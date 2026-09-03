import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { parseGorutMunfiqLinkInput } from "./gorut-munfiq-identity-api.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { resolveGorutMunfiqSelfContext, serializeGorutMunfiqSelfIdentity, type GorutMunfiqContextRecord } from "./gorut-munfiq-identity-pure.ts"

function record(overrides: Partial<GorutMunfiqContextRecord> = {}): GorutMunfiqContextRecord {
  return {
    id: "user-db-a",
    status: "Aktif",
    role: "munfiq",
    accountLinks: [{ userId: "user-db-a", status: "ACTIVE", munfiq: { id: "munfiq-db-a", code: "MUN-A", name: "Munfiq A", isActive: true } }],
    ...overrides,
  }
}

void test("self context resolves exactly the authoritative active link and serializes no database ids", () => {
  const result = resolveGorutMunfiqSelfContext(record())
  assert.equal(result.kind, "authorized")
  if (result.kind !== "authorized") return
  assert.equal(result.context.userId, "user-db-a")
  assert.equal(result.context.munfiqId, "munfiq-db-a")
  assert.deepEqual(serializeGorutMunfiqSelfIdentity(result.context), { munfiqCode: "MUN-A", name: "Munfiq A", active: true })
  assert.equal(JSON.stringify(serializeGorutMunfiqSelfIdentity(result.context)).includes("db-"), false)
})

void test("inactive Munfiq remains available for historical self context", () => {
  const result = resolveGorutMunfiqSelfContext(record({
    accountLinks: [{ userId: "user-db-a", status: "ACTIVE", munfiq: { id: "munfiq-db-a", code: "MUN-A", name: "Munfiq A", isActive: false } }],
  }))
  assert.equal(result.kind, "authorized")
  if (result.kind === "authorized") assert.equal(result.context.munfiqActive, false)
})

void test("inactive user, wrong role, missing/revoked/multiple/invalid links fail closed", () => {
  assert.equal(resolveGorutMunfiqSelfContext(record({ status: "Nonaktif" })).kind, "inactive-user")
  assert.equal(resolveGorutMunfiqSelfContext(record({ role: "admin_pc" })).kind, "wrong-role")
  assert.equal(resolveGorutMunfiqSelfContext(record({ accountLinks: [] })).kind, "mapping-unavailable")
  assert.equal(resolveGorutMunfiqSelfContext(record({ accountLinks: [
    { userId: "user-db-a", status: "ACTIVE", munfiq: { id: "m-a", code: "M-A", name: "A", isActive: true } },
    { userId: "user-db-a", status: "ACTIVE", munfiq: { id: "m-b", code: "M-B", name: "B", isActive: true } },
  ] })).kind, "mapping-unavailable")
  assert.equal(resolveGorutMunfiqSelfContext(record({ accountLinks: [{ userId: "user-db-a", status: "REVOKED", munfiq: { id: "m-a", code: "M-A", name: "A", isActive: true } }] })).kind, "mapping-invalid")
  assert.equal(resolveGorutMunfiqSelfContext(record({ accountLinks: [{ userId: "different-user", status: "ACTIVE", munfiq: { id: "m-a", code: "M-A", name: "A", isActive: true } }] })).kind, "mapping-invalid")
  assert.equal(resolveGorutMunfiqSelfContext(record({ accountLinks: [{ userId: "user-db-a", status: "ACTIVE", munfiq: null }] })).kind, "mapping-invalid")
})

void test("admin command input accepts public identifiers only", () => {
  assert.deepEqual(parseGorutMunfiqLinkInput({ userMemberId: "pid-23456789abcd", munfiqCode: "MUN-001", reason: "  Rekonsiliasi   manual  " }), {
    userMemberId: "PID-23456789ABCD",
    munfiqCode: "MUN-001",
    reason: "Rekonsiliasi manual",
  })
  assert.equal(parseGorutMunfiqLinkInput({ userId: "db-user", munfiqId: "db-munfiq" }), null)
  assert.equal(parseGorutMunfiqLinkInput({ userMemberId: "PID-23456789ABCD", munfiqCode: "MUN-001", reason: null, munfiqId: "forged" }), null)
  assert.equal(parseGorutMunfiqLinkInput({ userMemberId: "PID-23456789ABCD", munfiqCode: "../MUN", reason: null }), null)
})
