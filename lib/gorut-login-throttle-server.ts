import { createHmac } from "crypto"
import { getPrismaClient } from "@/lib/prisma"

/**
 * Login brute-force throttle backed by the generic AppRecord table.
 *
 * Semantics (deliberate, see Phase 4G-C3e review):
 * - Only FAILED credential checks increment a counter. Successful logins never increment.
 *   This keeps a shared office/NAT IP from self-throttling through ordinary daily use.
 * - The per-identity (phone) counter resets to zero after a successful login for that identity.
 * - The per-IP counter is NEVER reset on success — only a fresh window (via expiry) resets it.
 *   A single IP spraying many different phone numbers must still eventually trip the IP gate.
 * - The pre-check (`checkLoginThrottle`) is a plain read: under heavy concurrency a handful of
 *   extra attempts can slip past the fast check before the atomic increment catches up. The
 *   stored counter itself is never lost or double-counted under concurrency (guaranteed by the
 *   single-statement UPSERT below), which is the property that actually matters for a
 *   fixed-window limiter. This tradeoff is intentional, not an oversight.
 * - Any failure to reach the database during the pre-check is treated as a hard stop (fail
 *   CLOSED), never a silent fail-open. Login already requires the same database to verify
 *   credentials, so this does not introduce a new availability risk beyond an outage the
 *   credential check would hit anyway.
 */

const SCOPE = "gorut-login-throttle"
const WINDOW_SECONDS = 300
const MAX_FAILURES_PHONE = 7
const MAX_FAILURES_IP = 20

export type LoginThrottleCheck =
  | { kind: "allowed" }
  | { kind: "blocked"; retryAfterSeconds: number }
  | { kind: "error" }

function requiredAuthSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || !secret.trim()) throw new Error("AUTH_SECRET is required for login throttle key derivation.")
  return secret
}

function throttleKey(kind: "phone" | "ip", value: string, secret: string) {
  return `${kind}:${createHmac("sha256", secret).update(value).digest("hex")}`
}

/**
 * Resolves the client IP using only the header Vercel's edge itself sets, which cannot be
 * forged by the caller. `x-forwarded-for` is attacker-controlled on arbitrary infrastructure
 * and is kept only as a fallback for a future non-Vercel (VPS) deployment that terminates TLS
 * behind a single known reverse proxy the operator controls. Requests with neither header
 * collapse into one shared "unknown" bucket rather than being unthrottled.
 */
export function resolveClientIp(headers: Headers) {
  const trusted = headers.get("x-vercel-forwarded-for")
  if (trusted) return trusted.split(",")[0]!.trim().slice(0, 64)
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64)
  return "unknown"
}

type CountRow = { count: number; windowStart: Date }

async function readCount(key: string): Promise<CountRow | null> {
  const prisma = getPrismaClient()
  const rows = await prisma.$queryRaw<Array<{ data: { count: number; windowStart: string } }>>`
    SELECT "data" FROM "AppRecord" WHERE "scope" = ${SCOPE} AND "key" = ${key} LIMIT 1
  `
  const row = rows[0]
  if (!row) return null
  return { count: Number(row.data.count), windowStart: new Date(row.data.windowStart) }
}

function remainingSeconds(windowStart: Date) {
  const elapsed = (Date.now() - windowStart.getTime()) / 1000
  return Math.max(1, Math.ceil(WINDOW_SECONDS - elapsed))
}

export async function checkLoginThrottle(phoneNumber: string, ip: string): Promise<LoginThrottleCheck> {
  try {
    const secret = requiredAuthSecret()
    const phoneKey = throttleKey("phone", phoneNumber, secret)
    const ipKey = throttleKey("ip", ip, secret)
    const [phone, ipRow] = await Promise.all([readCount(phoneKey), readCount(ipKey)])
    const now = Date.now()
    for (const row of [phone, ipRow]) {
      if (!row) continue
      const expired = now - row.windowStart.getTime() > WINDOW_SECONDS * 1000
      if (expired) continue
      const limit = row === phone ? MAX_FAILURES_PHONE : MAX_FAILURES_IP
      if (row.count >= limit) return { kind: "blocked", retryAfterSeconds: remainingSeconds(row.windowStart) }
    }
    return { kind: "allowed" }
  } catch (error) {
    console.error("Login throttle check failed; failing closed.", error)
    return { kind: "error" }
  }
}

async function bumpFailure(key: string) {
  const prisma = getPrismaClient()
  await prisma.$executeRaw`
    INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
    VALUES (gen_random_uuid()::text, ${SCOPE}, ${key},
      jsonb_build_object('count', 1, 'windowStart', now()), now())
    ON CONFLICT ("scope", "key") DO UPDATE SET
      "data" = CASE
        WHEN (COALESCE("AppRecord"."data"->>'windowStart', '1970-01-01'))::timestamptz
             < now() - (${WINDOW_SECONDS} || ' seconds')::interval
          THEN jsonb_build_object('count', 1, 'windowStart', now())
        ELSE jsonb_set("AppRecord"."data", '{count}',
          to_jsonb((COALESCE("AppRecord"."data"->>'count', '0'))::int + 1))
      END,
      "updatedAt" = now()
  `
}

/** Call only after credentials have been determined invalid. Best-effort: a write failure here
 *  must not change the 401 the caller already decided on, but must never be swallowed silently. */
export async function recordLoginFailure(phoneNumber: string, ip: string) {
  try {
    const secret = requiredAuthSecret()
    await Promise.all([
      bumpFailure(throttleKey("phone", phoneNumber, secret)),
      bumpFailure(throttleKey("ip", ip, secret)),
    ])
  } catch (error) {
    console.error("Recording login throttle failure did not persist.", error)
  }
}

/** Call only after a successful login. Resets the per-identity counter only — the per-IP
 *  counter intentionally survives a single success so a spray attack sharing that IP keeps
 *  accumulating toward its own limit. */
export async function resetLoginThrottleForIdentity(phoneNumber: string) {
  try {
    const secret = requiredAuthSecret()
    const key = throttleKey("phone", phoneNumber, secret)
    await getPrismaClient().$executeRaw`DELETE FROM "AppRecord" WHERE "scope" = ${SCOPE} AND "key" = ${key}`
  } catch (error) {
    console.error("Resetting login throttle for identity did not persist.", error)
  }
}
