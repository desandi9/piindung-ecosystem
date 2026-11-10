import assert from "node:assert/strict"
import test from "node:test"
import { canonicalOrigin, generateMemberId, isMemberId, normalizeMemberId, preservesMemberId, publicStatus, serializePublicMember, verificationPath, verificationUrl } from "./member-identity"

void test("member-identity: generated ID uses only the allowed alphabet", () => {
  const allowed = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/
  for (let i = 0; i < 100; i++) {
    const id = generateMemberId()
    assert.equal(isMemberId(id), true)
    const payload = id.slice(4)
    assert.equal(allowed.test(payload), true)
  }
})

void test("member-identity: IDs containing 0 are rejected", () => {
  assert.equal(isMemberId("PID-23450789ABCD"), false)
})

void test("member-identity: IDs containing 1 are rejected", () => {
  assert.equal(isMemberId("PID-23451789ABCD"), false)
})

void test("member-identity: lowercase valid ID normalizes to uppercase", () => {
  assert.equal(normalizeMemberId(" pid-23456789abcd "), "PID-23456789ABCD")
  assert.equal(isMemberId("pid-23456789abcd"), true)
})

void test("member-identity: migration-compatible translated ID is accepted", () => {
  // MD5 hex backfill string 'PID-000000000001' translated to 'PID-GGGGGGGGGGGH'
  assert.equal(isMemberId("PID-GGGGGGGGGGGH"), true)
})

void test("member-identity: verification path rejects malformed ID", () => {
  assert.throws(() => verificationPath("PID-123"), /INVALID_MEMBER_ID/)
  assert.equal(verificationPath("PID-23456789ABCD"), "/verify/PID-23456789ABCD")
})

void test("member-identity: production canonical URL fails closed without configured SITE_URL", () => {
  assert.throws(() => canonicalOrigin({ NODE_ENV: "production" }), /SITE_URL_REQUIRED/)
  assert.equal(canonicalOrigin({ SITE_URL: "https://site.example", NODE_ENV: "production" }), "https://site.example")
  assert.equal(canonicalOrigin({ NODE_ENV: "development" }), "http://localhost:3000")
})

void test("member-identity: Preview falls back to the current deployment's VERCEL_URL", () => {
  assert.equal(
    canonicalOrigin({ NODE_ENV: "production", VERCEL_ENV: "preview", VERCEL_URL: "my-app-git-branch-team.vercel.app" }),
    "https://my-app-git-branch-team.vercel.app",
  )
})

void test("member-identity: Preview without VERCEL_URL still fails closed, no silent localhost", () => {
  assert.throws(() => canonicalOrigin({ NODE_ENV: "production", VERCEL_ENV: "preview" }), /SITE_URL_REQUIRED/)
})

void test("member-identity: explicit SITE_URL outranks VERCEL_URL even on Preview", () => {
  assert.equal(
    canonicalOrigin({ NODE_ENV: "production", VERCEL_ENV: "preview", VERCEL_URL: "my-app-git-branch-team.vercel.app", SITE_URL: "https://custom.example" }),
    "https://custom.example",
  )
})

void test("member-identity: Production never falls back to VERCEL_URL, fails closed without explicit SITE_URL", () => {
  assert.throws(
    () => canonicalOrigin({ NODE_ENV: "production", VERCEL_ENV: "production", VERCEL_URL: "my-app.vercel.app" }),
    /SITE_URL_REQUIRED/,
  )
  assert.equal(
    canonicalOrigin({ NODE_ENV: "production", VERCEL_ENV: "production", SITE_URL: "https://lazisnugarut.web.id" }),
    "https://lazisnugarut.web.id",
  )
})

void test("member-identity: invalid explicit SITE_URL configuration is rejected", () => {
  assert.throws(() => canonicalOrigin({ NODE_ENV: "production", SITE_URL: "http://insecure.example" }), /INVALID_SITE_URL/)
})

void test("member-identity: verificationUrl uses the Preview deployment URL end to end", () => {
  const env = { NODE_ENV: "production", VERCEL_ENV: "preview", VERCEL_URL: "my-app-git-branch-team.vercel.app" }
  const url = verificationUrl("PID-23456789ABCD", env)
  assert.equal(url, "https://my-app-git-branch-team.vercel.app/verify/PID-23456789ABCD")
})

void test("member-identity: QR payload equals only the canonical verification URL", () => {
  const env = { SITE_URL: "https://verify.example", NODE_ENV: "production" }
  const url = verificationUrl("PID-23456789ABCD", env)
  assert.equal(url, "https://verify.example/verify/PID-23456789ABCD")
})

void test("member-identity: public serializer omits private fields", () => {
  const user = { memberId: "PID-23456789ABCD", name: "User Test", role: "admin_pc" as const, status: "Aktif" }
  const serialized = serializePublicMember(user, "Admin PC", "LAZISNU Garut")
  assert.deepEqual(serialized, {
    memberId: "PID-23456789ABCD",
    name: "User Test",
    role: "Admin PC",
    status: { label: "Status akun: Aktif", result: "Identitas terdaftar", active: true },
    organization: "LAZISNU Garut"
  })
  assert.equal("email" in serialized, false)
  assert.equal("phone" in serialized, false)
  assert.equal("id" in serialized, false)
  assert.equal("passwordHash" in serialized, false)
})

void test("member-identity: active, pending, and inactive wording are distinct", () => {
  assert.deepEqual(publicStatus("Aktif"), { label: "Status akun: Aktif", result: "Identitas terdaftar", active: true })
  assert.deepEqual(publicStatus("Menunggu"), { label: "Menunggu aktivasi", result: "Identitas terdaftar", active: false })
  assert.deepEqual(publicStatus("Nonaktif"), { label: "Akun tidak aktif", result: "Identitas terdaftar", active: false })
})


void test("member-identity: member ID remains immutable across role/status changes", () => {
  assert.equal(preservesMemberId("PID-23456789ABCD", "admin_upzis", "Nonaktif"), "PID-23456789ABCD")
})
