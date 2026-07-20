import assert from "node:assert/strict"
import test from "node:test"
import { canManagePortalUsers, isAppRole, isUserStatus, normalizeEmail, classifyDuplicateEmail, canChangeCentralUser, serializeManagedUser } from "./portal-user-management"
import { validateUserPayload, serializeUserListItem, serializeUserDetail, validateModules } from "./portal-user-management-server"
import { hasEffectiveModuleEntry } from "./portal-access"

void test("portal-user-management: canManagePortalUsers policy rules", () => {
  assert.equal(canManagePortalUsers(true, true), true)
  assert.equal(canManagePortalUsers(true, false), false)
  assert.equal(canManagePortalUsers(false, true), false)
})

void test("portal-user-management: validator values allowlist checks", () => {
  assert.equal(isAppRole("super_admin_pc"), true)
  assert.equal(isAppRole("admin_pc"), true)
  assert.equal(isAppRole("admin_upzis"), true)
  assert.equal(isAppRole("admin_kordes"), true)
  assert.equal(isAppRole("unknown_role"), false)
  assert.equal(isAppRole(null), false)

  assert.equal(isUserStatus("Aktif"), true)
  assert.equal(isUserStatus("Menunggu"), true)
  assert.equal(isUserStatus("Nonaktif"), true)
  assert.equal(isUserStatus("unknown_status"), false)
  assert.equal(isUserStatus(undefined), false)
})

void test("portal-user-management: email normalizer and duplicates check", () => {
  assert.equal(normalizeEmail(" TEST@LAZISNU.ID  "), "test@lazisnu.id")
  assert.equal(classifyDuplicateEmail("test@lazisnu.id", " TEST@LAZISNU.ID "), true)
  assert.equal(classifyDuplicateEmail(null, "test@lazisnu.id"), false)
  assert.equal(classifyDuplicateEmail(undefined, "test@lazisnu.id"), false)
})

void test("portal-user-management: central change policy controls", () => {
  // Actor cannot modify own role or status
  assert.equal(canChangeCentralUser("user1", { id: "user1", role: "super_admin_pc", status: "Aktif" }, { role: "admin_pc", status: "Aktif" }, 2), false)
  assert.equal(canChangeCentralUser("user1", { id: "user1", role: "super_admin_pc", status: "Aktif" }, { role: "super_admin_pc", status: "Nonaktif" }, 2), false)
  assert.equal(canChangeCentralUser("user1", { id: "user1", role: "super_admin_pc", status: "Aktif" }, { role: "super_admin_pc", status: "Aktif" }, 2), true)

  // System must retain at least one active super admin PC
  assert.equal(canChangeCentralUser("user2", { id: "user1", role: "super_admin_pc", status: "Aktif" }, { role: "admin_pc", status: "Aktif" }, 1), false)
  assert.equal(canChangeCentralUser("user2", { id: "user1", role: "super_admin_pc", status: "Aktif" }, { role: "admin_pc", status: "Aktif" }, 2), true)
  assert.equal(canChangeCentralUser("user2", { id: "user1", role: "super_admin_pc", status: "Aktif" }, { role: "super_admin_pc", status: "Nonaktif" }, 1), false)
  assert.equal(canChangeCentralUser("user2", { id: "user1", role: "super_admin_pc", status: "Aktif" }, { role: "super_admin_pc", status: "Nonaktif" }, 2), true)
})

void test("portal-user-management: safe serialization logic", () => {
  const raw = {
    id: "user-123",
    name: "Ahmad",
    email: "AHMAD@LAZISNU.ID",
    phone: "081234567890",
    role: "admin_pc",
    status: "Aktif" as const,
    avatar: "https://example.com/avatar.jpg",
    createdAt: new Date("2026-07-21T00:00:00Z"),
    updatedAt: new Date("2026-07-21T01:00:00Z"),
  }

  const listSerialized = serializeUserListItem(raw, [{ key: "gorut", name: "GORUT", route: "/gorut" }])
  assert.deepEqual(listSerialized, {
    id: "user-123",
    name: "Ahmad",
    email: "AHMAD@LAZISNU.ID",
    role: "admin_pc",
    status: "Aktif",
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T01:00:00.000Z",
    modules: [{ key: "gorut", name: "GORUT", route: "/gorut" }],
  })

  // Verify list view strictly omits phone and avatar
  assert.equal("phone" in listSerialized, false)
  assert.equal("avatar" in listSerialized, false)

  const detailSerialized = serializeUserDetail(raw, [{ key: "gorut", name: "GORUT", route: "/gorut", enabled: true, effective: true }])
  assert.deepEqual(detailSerialized, {
    id: "user-123",
    name: "Ahmad",
    email: "AHMAD@LAZISNU.ID",
    role: "admin_pc",
    status: "Aktif",
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T01:00:00.000Z",
    phone: "081234567890",
    avatar: "https://example.com/avatar.jpg",
    modules: [{ key: "gorut", name: "GORUT", route: "/gorut", enabled: true, effective: true }],
  })

  // Explicitly verify sensitive password fields are omitted
  assert.equal("passwordHash" in listSerialized, false)
  assert.equal("password" in listSerialized, false)
  assert.equal("passwordHash" in detailSerialized, false)
  assert.equal("password" in detailSerialized, false)
})

void test("portal-user-management: validator validations", () => {
  // Invalid payload
  assert.equal(typeof validateUserPayload({ name: "A", email: "invalid", role: "admin_pc", status: "Aktif", phone: "123", password: "12" }), "string")
  // Unsupported field
  assert.equal(typeof validateUserPayload({ name: "Ahmad", email: "ahmad@test.com", role: "admin_pc", status: "Aktif", phone: "123", password: "password123", extra: "unsupported" }), "string")
  // Valid payload
  assert.equal(validateUserPayload({ name: "Ahmad", email: "ahmad@test.com", role: "admin_pc", status: "Aktif", phone: "081234567890", password: "password123" }), null)
})

void test("portal-user-management: module grant rules", () => {
  // Inactive target has no effective module entry
  assert.equal(hasEffectiveModuleEntry("admin_pc", false, "gorut", true), false)
  // Role change does not automatically grant GORUT (since grant enabled is separate boolean)
  assert.equal(hasEffectiveModuleEntry("admin_pc", true, "gorut", false), false)
  // Unknown module rejected
  assert.equal(validateModules([{ key: "unknown", enabled: true }]), null)
  // Valid module keys accepted
  assert.deepEqual(validateModules([{ key: "gorut", enabled: true }]), [{ key: "gorut", enabled: true }])
})
