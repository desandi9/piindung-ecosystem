import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { gorutMobileLoginPath, gorutMobilePaths, resolveKordesMobileAccessRecord, resolveMobileEntry, resolveMunfiqMobileAccessRecord, resolvePlpkMobileAccessRecord, type MobileAssignmentRecord, type MobileUserAccessRecord } from "./mobile-actor-access-pure.ts"

const hierarchy = {
  id: "ranting-boundary-id",
  code: "UAT-R01",
  name: "[UAT] Ranting Boundary",
  isActive: true,
  kecamatan: { name: "[UAT] Kecamatan", isActive: true },
}

function user(assignments: MobileAssignmentRecord[], overrides: Partial<MobileUserAccessRecord> = {}): MobileUserAccessRecord {
  return {
    id: "user-1",
    name: "[UAT] Actor Boundary",
    phone: "628990010003",
    status: "Aktif",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    assignments,
    ...overrides,
  }
}

function plpkAssignment(): MobileAssignmentRecord {
  return {
    id: "assignment-plpk",
    role: "PLPK",
    kecamatanId: null,
    rantingId: null,
    plpkId: "plpk-boundary-id",
    isActive: true,
    ranting: null,
    plpk: {
      id: "plpk-boundary-id",
      code: "UAT-P02",
      isActive: true,
      ranting: { ...hierarchy, assignments: [{ user: { name: "[UAT] Kordes Boundary" } }] },
    },
  }
}

function kordesAssignment(): MobileAssignmentRecord {
  return {
    id: "assignment-kordes",
    role: "RANTING",
    kecamatanId: null,
    rantingId: hierarchy.id,
    plpkId: null,
    isActive: true,
    plpk: null,
    ranting: hierarchy,
  }
}

void test("all actor direct entries use the existing login with actor-specific safe next", () => {
  assert.deepEqual(gorutMobilePaths, {
    MUNFIQ: "/gorut-v2/mobile/munfiq",
    PLPK: "/gorut-v2/mobile/plpk",
    KORDES: "/gorut-v2/mobile/kordes",
  })
  for (const actor of ["MUNFIQ", "PLPK", "KORDES"] as const) {
    assert.equal(resolveMobileEntry("unauthenticated", actor).location, gorutMobileLoginPath(actor))
    assert.equal(resolveMobileEntry("unauthenticated", actor).kind, "redirect")
  }
})

void test("active PLPK resolves authenticated User plus canonical PLPK hierarchy", () => {
  const result = resolvePlpkMobileAccessRecord(user([plpkAssignment()], { name: "[UAT] PLPK Boundary", phone: "628990010007" }))
  assert.equal(result.kind, "authorized")
  if (result.kind !== "authorized") return
  assert.equal(result.profile.name, "[UAT] PLPK Boundary")
  assert.equal(result.profile.plpkId, "UAT-P02")
  assert.equal(result.profile.identity.assignmentLabel, "PLPK [UAT] Ranting Boundary")
  assert.equal(result.profile.identity.initials, "UP")
  assert.equal(JSON.stringify(result).includes("Dede Rahmat"), false)
})

void test("PLPK wrong role, missing/multiple assignment, inactive hierarchy, and invalid scope fail closed", () => {
  const assignment = plpkAssignment()
  assert.equal(resolvePlpkMobileAccessRecord(user([])).kind, "forbidden")
  assert.equal(resolvePlpkMobileAccessRecord(user([assignment, { ...assignment, id: "assignment-2" }])).kind, "forbidden")
  assert.equal(resolvePlpkMobileAccessRecord(user([{ ...assignment, role: "RANTING" }])).kind, "forbidden")
  assert.equal(resolvePlpkMobileAccessRecord(user([{ ...assignment, rantingId: hierarchy.id }])).kind, "forbidden")
  assert.equal(resolvePlpkMobileAccessRecord(user([{ ...assignment, plpk: { ...assignment.plpk!, isActive: false } }])).kind, "forbidden")
  assert.equal(resolvePlpkMobileAccessRecord(user([assignment], { status: "Nonaktif" })).kind, "inactive")
})

void test("active Kordes resolves authenticated User plus canonical Ranting hierarchy", () => {
  const result = resolveKordesMobileAccessRecord(user([kordesAssignment()], { name: "[UAT] Kordes Boundary" }))
  assert.equal(result.kind, "authorized")
  if (result.kind !== "authorized") return
  assert.equal(result.profile.name, "[UAT] Kordes Boundary")
  assert.equal(result.profile.rantingCode, "UAT-R01")
  assert.equal(result.profile.identity.assignmentLabel, "Kordes [UAT] Ranting Boundary")
  assert.equal(result.profile.identity.regionLabel, "[UAT] Ranting Boundary, Kecamatan [UAT] Kecamatan")
  assert.equal(JSON.stringify(result).includes("Cecep Suhendar"), false)
})

void test("Kordes wrong role, missing/multiple assignment, inactive hierarchy, and invalid scope fail closed", () => {
  const assignment = kordesAssignment()
  assert.equal(resolveKordesMobileAccessRecord(user([])).kind, "forbidden")
  assert.equal(resolveKordesMobileAccessRecord(user([assignment, { ...assignment, id: "assignment-2" }])).kind, "forbidden")
  assert.equal(resolveKordesMobileAccessRecord(user([{ ...assignment, role: "PLPK" }])).kind, "forbidden")
  assert.equal(resolveKordesMobileAccessRecord(user([{ ...assignment, plpkId: "unexpected" }])).kind, "forbidden")
  assert.equal(resolveKordesMobileAccessRecord(user([{ ...assignment, ranting: { ...hierarchy, isActive: false } }])).kind, "forbidden")
  assert.equal(resolveKordesMobileAccessRecord(user([assignment], { status: "Nonaktif" })).kind, "inactive")
})

void test("Munfiq remains fail closed because no canonical User relation exists", () => {
  assert.deepEqual(resolveMunfiqMobileAccessRecord(user([])), { kind: "contract-gap" })
  assert.deepEqual(resolveMunfiqMobileAccessRecord(user([], { status: "Nonaktif" })), { kind: "inactive" })
  assert.equal(resolveMobileEntry("contract-gap", "MUNFIQ").kind, "deny")
})
