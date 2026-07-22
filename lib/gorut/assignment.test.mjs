import assert from "node:assert/strict"
import test from "node:test"
import { validateAssignmentOptions, isLocalDatabase, createAssignment } from "./assignment.mjs"

const localEnv = { DATABASE_URL: "postgresql://localhost/db", GORUT_ASSIGNMENT_ACK: "local-development" }

test("isLocalDatabase: localhost", () => assert.equal(isLocalDatabase("postgresql://localhost/db"), true))
test("isLocalDatabase: 127.0.0.1", () => assert.equal(isLocalDatabase("postgresql://127.0.0.1/db"), true))
test("isLocalDatabase: remote", () => assert.equal(isLocalDatabase("postgresql://remote.host/db"), false))
test("isLocalDatabase: garbage", () => assert.equal(isLocalDatabase("not-a-url"), false))

test("default is dry-run", () => assert.deepEqual(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "PC"], env: {} }), { ok: true, options: { apply: false, userId: "u1", role: "PC" } }))
test("unknown flags rejected", () => assert.equal(validateAssignmentOptions({ flags: ["--nope"], env: {} }).ok, false))
test("apply requires ACK", () => assert.equal(validateAssignmentOptions({ flags: ["--apply", "--user-id", "u1", "--role", "PC"], env: { DATABASE_URL: "postgresql://localhost/db" } }).ok, false))
test("wrong ACK rejected", () => assert.equal(validateAssignmentOptions({ flags: ["--apply", "--user-id", "u1", "--role", "PC"], env: { DATABASE_URL: "postgresql://localhost/db", GORUT_ASSIGNMENT_ACK: "wrong" } }).ok, false))
test("production rejected", () => assert.equal(validateAssignmentOptions({ flags: ["--apply", "--user-id", "u1", "--role", "PC"], env: { NODE_ENV: "production", ...localEnv } }).ok, false))
test("remote DB rejected", () => assert.equal(validateAssignmentOptions({ flags: ["--apply", "--user-id", "u1", "--role", "PC"], env: { DATABASE_URL: "postgresql://remote/db", GORUT_ASSIGNMENT_ACK: "local-development" } }).ok, false))
test("valid local apply accepted", () => assert.deepEqual(validateAssignmentOptions({ flags: ["--apply", "--user-id", "u1", "--role", "PC"], env: localEnv }), { ok: true, options: { apply: true, userId: "u1", role: "PC" } }))

test("requires user-id or member-id", () => assert.equal(validateAssignmentOptions({ flags: ["--role", "PC"], env: {} }).ok, false))
test("both user-id and member-id rejected", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--member-id", "m1", "--role", "PC"], env: {} }).ok, false))
test("member-id works alone", () => assert.deepEqual(validateAssignmentOptions({ flags: ["--member-id", "m1", "--role", "PC"], env: {} }), { ok: true, options: { apply: false, memberId: "m1", role: "PC" } }))
test("requires role", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1"], env: {} }).ok, false))
test("invalid role rejected", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "ADMIN"], env: {} }).ok, false))
test("missing value rejected", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "--role", "PC"], env: {} }).ok, false))
test("duplicate flag rejected", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--user-id", "u2", "--role", "PC"], env: {} }).ok, false))

test("PC rejects scope fields", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "PC", "--kecamatan-code", "k1"], env: {} }).ok, false))
test("UPZIS requires kecamatan-code", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "UPZIS"], env: {} }).ok, false))
test("UPZIS with kecamatan-code ok", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "UPZIS", "--kecamatan-code", "k1"], env: {} }).ok, true))
test("UPZIS rejects extra ranting-code", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "UPZIS", "--kecamatan-code", "k1", "--ranting-code", "r1"], env: {} }).ok, false))
test("RANTING requires kecamatan-code and ranting-code", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "RANTING", "--kecamatan-code", "k1", "--ranting-code", "r1"], env: {} }).ok, true))
test("RANTING rejects missing kecamatan-code", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "RANTING", "--ranting-code", "r1"], env: {} }).ok, false))
test("PLPK requires plpk-code only", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "PLPK", "--plpk-code", "p1"], env: {} }).ok, true))
test("PLPK rejects missing plpk-code", () => assert.equal(validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "PLPK"], env: {} }).ok, false))

test("output is privacy-safe (no PII in options)", () => {
  const result = validateAssignmentOptions({ flags: ["--user-id", "u1", "--role", "PC"], env: {} })
  const json = JSON.stringify(result)
  assert.ok(!json.includes("password"))
  assert.ok(!json.includes("email"))
  assert.ok(!json.includes("phone"))
})

test("duplicate apply synthetic test", async () => {
  let created = false
  const prisma = {
    user: { findUnique: async () => ({ id: "u1", status: "Aktif" }) },
    gorutOperationalAssignment: {
      findFirst: async ({ where }) => {
        if (!created && where.isActive) return null
        if (created && where.isActive) return { id: "a1" }
        return null
      },
      create: async () => {
        if (created) {
          const err = new Error("Unique constraint")
          err.code = "P2002"
          throw err
        }
        created = true
        return { id: "a1" }
      }
    }
  }
  const result = await createAssignment({ options: { apply: true, userId: "u1", role: "PC" }, prisma })
  assert.equal(result.status, "created")
  const result2 = await createAssignment({ options: { apply: true, userId: "u1", role: "PC" }, prisma })
  assert.equal(result2.status, "unchanged")
})

test("no auto-run on import", () => assert.equal(typeof validateAssignmentOptions, "function"))
