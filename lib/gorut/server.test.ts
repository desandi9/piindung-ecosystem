import assert from "node:assert/strict"
import test from "node:test"
import { activeUserStatus, inactiveUserStatus } from "../portal-user-management"
import { decimal, endOfIsoDate, isDateRangeValid, munfiqScopeWhere, parsePage, parsePageSize, parseSearch, parseState, parseStatus, resolveOperationalContext, serializePublicAccountStatus, transactionScopeWhere } from "./server-pure"

const assignment = (role: "PC" | "UPZIS" | "RANTING" | "PLPK", kecamatanId: string | null = null, rantingId: string | null = null, plpkId: string | null = null) => ({ id: "a1", role, kecamatanId, rantingId, plpkId })

test("canonical account status is privacy-safe", () => {
  assert.equal(serializePublicAccountStatus(activeUserStatus), "aktif")
  assert.equal(serializePublicAccountStatus(inactiveUserStatus), "nonaktif")
  assert.equal(serializePublicAccountStatus("Menunggu"), "unknown")
  assert.equal(serializePublicAccountStatus("unexpected"), "unknown")
  assert.equal(serializePublicAccountStatus(null), "unknown")
})

test("only one normalized active assignment resolves", () => {
  assert.equal(resolveOperationalContext("u1", [assignment("PC"), assignment("PC")]), null)
  assert.equal(resolveOperationalContext("u1", [assignment("UPZIS", "k1", "r1")]), null)
  assert.equal(resolveOperationalContext("u1", [assignment("PLPK", null, null, "p1")] )?.operationalRole, "PLPK")
})

test("canonical scope is exact at each operational level", () => {
  assert.deepEqual(transactionScopeWhere(resolveOperationalContext("u1", [assignment("PC")])!), {})
  assert.deepEqual(transactionScopeWhere(resolveOperationalContext("u1", [assignment("UPZIS", "k1")])!), { kecamatanId: "k1" })
  assert.deepEqual(transactionScopeWhere(resolveOperationalContext("u1", [assignment("RANTING", null, "r1")])!), { rantingId: "r1" })
  assert.deepEqual(munfiqScopeWhere(resolveOperationalContext("u1", [assignment("PLPK", null, null, "p1")])!), { plpkId: "p1" })
})

test("request parsing is bounded and strict", () => {
  assert.equal(parsePage("0"), 1)
  assert.equal(parsePageSize("1000"), 100)
  assert.equal(parseSearch("  one\n two  "), "one two")
  assert.equal(parseStatus("aktif"), true)
  assert.equal(parseStatus("nope"), undefined)
  assert.equal(parseState("FINAL_APPROVED"), "FINAL_APPROVED")
  assert.equal(parseState("nope"), undefined)
})

test("date and decimal values preserve safe semantics", () => {
  assert.equal(isDateRangeValid(new Date("2026-01-02"), new Date("2026-01-01")), false)
  assert.equal(endOfIsoDate("2026-07-23")?.toISOString(), "2026-07-23T23:59:59.999Z")
  assert.equal(decimal({ toString: () => "25000.50" }), "25000.50")
})
