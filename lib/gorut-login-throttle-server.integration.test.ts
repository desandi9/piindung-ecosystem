import assert from "node:assert/strict"
import { after, test } from "node:test"
import { PrismaClient } from "@prisma/client"
import {
  checkLoginThrottle,
  recordLoginFailure,
  resetLoginThrottleForIdentity,
  resolveClientIp,
} from "./gorut-login-throttle-server"

// Dedicated local-only identifiers so this test never touches real phone numbers or collides
// with any other AppRecord data. Requires a reachable local DATABASE_URL + AUTH_SECRET.
const prisma = new PrismaClient()
const SCOPE = "gorut-login-throttle"

async function clear() {
  await prisma.$executeRaw`DELETE FROM "AppRecord" WHERE "scope" = ${SCOPE}`
}

async function failN(phoneNumber: string, ip: string, n: number) {
  for (let i = 0; i < n; i += 1) await recordLoginFailure(phoneNumber, ip)
}

after(async () => {
  await prisma.$executeRaw`DELETE FROM "AppRecord" WHERE "scope" = ${SCOPE}`
  await prisma.$disconnect()
})

void test("resolveClientIp trusts only the Vercel edge header, never a spoofable one", () => {
  const spoofed = new Headers({ "x-forwarded-for": "9.9.9.9", "x-vercel-forwarded-for": "1.2.3.4" })
  assert.equal(resolveClientIp(spoofed), "1.2.3.4")
  const noEdgeHeader = new Headers({ "x-forwarded-for": "9.9.9.9" })
  assert.equal(resolveClientIp(noEdgeHeader), "9.9.9.9")
  assert.equal(resolveClientIp(new Headers()), "unknown")
})

void test("under the failure threshold, the identity and IP both remain allowed", async () => {
  const phone = "+6281100000001"
  const ip = "203.0.113.1"
  await clear()
  await failN(phone, ip, 6)
  const result = await checkLoginThrottle(phone, ip)
  assert.equal(result.kind, "allowed")
})

void test("the Nth failure trips the per-identity gate with a positive Retry-After", async () => {
  const phone = "+6281100000002"
  const ip = "203.0.113.2"
  await clear()
  await failN(phone, ip, 7)
  const result = await checkLoginThrottle(phone, ip)
  assert.equal(result.kind, "blocked")
  if (result.kind === "blocked") {
    assert.ok(result.retryAfterSeconds > 0 && result.retryAfterSeconds <= 300)
  }
})

void test("a successful login resets only the identity counter, never the IP counter", async () => {
  const phone = "+6281100000003"
  const ip = "203.0.113.3"
  await clear()
  await failN(phone, ip, 7)
  let result = await checkLoginThrottle(phone, ip)
  assert.equal(result.kind, "blocked")

  await resetLoginThrottleForIdentity(phone)
  result = await checkLoginThrottle(phone, ip)
  assert.equal(result.kind, "allowed", "identity gate must clear after success")

  // Drive the shared IP counter up to its own (much higher) limit using OTHER identities,
  // each well under its own per-identity limit, so this cannot be confused with retripping
  // the per-identity gate checked above.
  for (let i = 0; i < 13; i += 1) {
    await recordLoginFailure(`+628110000030${String(i).padStart(2, "0")}`, ip)
  }

  // The same IP, now trying a brand-new phone number, must still be blocked by its own
  // accumulated failure count — the earlier identity reset must not have touched it.
  const result2 = await checkLoginThrottle("+6281199999999", ip)
  assert.equal(result2.kind, "blocked", "IP gate must survive an unrelated identity's success")
})

void test("an unregistered phone number is throttled identically to a registered one", async () => {
  const phone = "+6281100000004"
  const ip = "203.0.113.4"
  await clear()
  await failN(phone, ip, 7)
  const result = await checkLoginThrottle(phone, ip)
  assert.equal(result.kind, "blocked", "throttling must not reveal whether the phone is registered")
})

void test("one IP spraying many distinct phone numbers trips the shared IP gate", async () => {
  const ip = "203.0.113.5"
  await prisma.$executeRaw`DELETE FROM "AppRecord" WHERE "scope" = ${SCOPE}`
  for (let i = 0; i < 20; i += 1) {
    await recordLoginFailure(`+62811000001${String(i).padStart(2, "0")}`, ip)
  }
  const result = await checkLoginThrottle("+6281100000199", ip)
  assert.equal(result.kind, "blocked")
})

void test("concurrent parallel failures for the same identity are all counted exactly once each", async () => {
  const phone = "+6281100000006"
  const ip = "203.0.113.6"
  await clear()
  await Promise.all(Array.from({ length: 7 }, () => recordLoginFailure(phone, ip)))
  const result = await checkLoginThrottle(phone, ip)
  assert.equal(result.kind, "blocked", "7 concurrent failures must not be lost to a race")
})

void test("a stale window naturally allows a fresh attempt without manual cleanup", async () => {
  const phone = "+6281100000007"
  const ip = "203.0.113.7"
  await clear()
  const { createHmac } = await import("node:crypto")
  const secret = process.env.AUTH_SECRET!
  const key = `phone:${createHmac("sha256", secret).update(phone).digest("hex")}`
  await prisma.$executeRaw`
    INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
    VALUES (gen_random_uuid()::text, ${SCOPE}, ${key},
      jsonb_build_object('count', 999, 'windowStart', now() - interval '1 hour'), now())
  `
  const result = await checkLoginThrottle(phone, ip)
  assert.equal(result.kind, "allowed", "an expired window must not block a fresh attempt")
})

void test("missing AUTH_SECRET fails closed instead of silently allowing the attempt", async () => {
  const original = process.env.AUTH_SECRET
  delete process.env.AUTH_SECRET
  try {
    const result = await checkLoginThrottle("+6281100000008", "203.0.113.8")
    assert.equal(result.kind, "error", "absent secret must surface as an explicit error, not 'allowed'")
  } finally {
    process.env.AUTH_SECRET = original
  }
})

void test("a database failure during the check fails closed, not open", async () => {
  // lib/prisma.ts caches a singleton client on globalThis. To genuinely exercise a connection
  // failure (not just reuse the already-working client), the cached singleton must be dropped
  // *before* pointing DATABASE_URL at an unreachable port, forcing a fresh client to be built
  // against the broken URL for this one call.
  const globalForPrisma = globalThis as unknown as { prisma: unknown }
  const savedClient = globalForPrisma.prisma
  const savedUrl = process.env.DATABASE_URL
  globalForPrisma.prisma = undefined
  process.env.DATABASE_URL = "postgresql://invalid:invalid@127.0.0.1:1/invalid"
  try {
    const result = await checkLoginThrottle("+6281100000009", "203.0.113.9")
    assert.equal(result.kind, "error", "an unreachable database must fail closed, never silently allow")
  } finally {
    globalForPrisma.prisma = savedClient
    process.env.DATABASE_URL = savedUrl
  }
})
