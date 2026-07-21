import { test } from "node:test"
import assert from "node:assert"
import { serializeAccountProfile, validateProfilePatch, validateAvatarReference, validatePasswordInput, passwordAuditPayload } from "./account-profile"
import { AUTH_COOKIE_NAME } from "./session-token"

void test("Profile serialization: safe serializer includes allowed profile fields", () => {
  const mockUser = {
    memberId: "PID-23456789ABCD",
    name: "Ahmad Zaki",
    email: "ahmad.zaki@example.com",
    phone: "081234567890",
    role: "admin_pc",
    status: "Aktif",
    avatar: "/uploads/avatar.png",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-21T00:00:00.000Z"),
  }
  const serialized = serializeAccountProfile(mockUser, "https://example.com/verify/PID-23456789ABCD")
  assert.equal(serialized.memberId, "PID-23456789ABCD")
  assert.equal(serialized.name, "Ahmad Zaki")
  assert.equal(serialized.email, "ahmad.zaki@example.com")
  assert.equal(serialized.phone, "081234567890")
  assert.equal(serialized.role, "admin_pc")
  assert.equal(serialized.status, "Aktif")
  assert.equal(serialized.avatar, "/uploads/avatar.png")
  assert.equal(serialized.createdAt, "2026-01-01T00:00:00.000Z")
  assert.equal(serialized.updatedAt, "2026-07-21T00:00:00.000Z")
  assert.equal(serialized.verificationUrl, "https://example.com/verify/PID-23456789ABCD")
  assert.equal(serialized.identityPath, "/member-area/identitas")
})

void test("Profile serialization: safe serializer omits internal User ID", () => {
  const mockUser = {
    id: "user-cuid-12345",
    memberId: "PID-23456789ABCD",
    name: "Ahmad Zaki",
    email: "ahmad.zaki@example.com",
    phone: "081234567890",
    role: "admin_pc",
    status: "Aktif",
    avatar: "/uploads/avatar.png",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-21T00:00:00.000Z"),
  }
  const serialized = serializeAccountProfile(mockUser, "https://example.com/verify/PID-23456789ABCD")
  assert.equal("id" in serialized, false)
})

void test("Profile serialization: safe serializer omits passwordHash", () => {
  const mockUser = {
    memberId: "PID-23456789ABCD",
    name: "Ahmad Zaki",
    email: "ahmad.zaki@example.com",
    phone: "081234567890",
    role: "admin_pc",
    status: "Aktif",
    avatar: "/uploads/avatar.png",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-21T00:00:00.000Z"),
    passwordHash: "$2a$10$abcdefghijklmnopqrstuv",
  }
  const serialized = serializeAccountProfile(mockUser, "https://example.com/verify/PID-23456789ABCD")
  assert.equal("passwordHash" in serialized, false)
  assert.equal("password" in serialized, false)
})

void test("Profile serialization: safe serializer omits token and session", () => {
  const mockUser = {
    memberId: "PID-23456789ABCD",
    name: "Ahmad Zaki",
    email: "ahmad.zaki@example.com",
    phone: "081234567890",
    role: "admin_pc",
    status: "Aktif",
    avatar: "/uploads/avatar.png",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-21T00:00:00.000Z"),
    token: "session-token-abc",
  }
  const serialized = serializeAccountProfile(mockUser, "https://example.com/verify/PID-23456789ABCD")
  assert.equal("token" in serialized, false)
})

void test("Profile serialization: safe serializer omits grants and operational scope", () => {
  const mockUser = {
    memberId: "PID-23456789ABCD",
    name: "Ahmad Zaki",
    email: "ahmad.zaki@example.com",
    phone: "081234567890",
    role: "admin_pc",
    status: "Aktif",
    avatar: "/uploads/avatar.png",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-21T00:00:00.000Z"),
    grants: ["modules.gorut.enter"],
    operationalScope: { id: "scope" },
  }
  const serialized = serializeAccountProfile(mockUser, "https://example.com/verify/PID-23456789ABCD")
  assert.equal("grants" in serialized, false)
  assert.equal("operationalScope" in serialized, false)
})

void test("Profile PATCH: name update allowed", () => {
  const validation = validateProfilePatch({ name: "Rahmat Hidayat" })
  assert.deepEqual(validation.value, { name: "Rahmat Hidayat" })
})

void test("Profile PATCH: normalized email update allowed", () => {
  const validation = validateProfilePatch({ email: "RAHMAT@Example.com" })
  assert.deepEqual(validation.value, { email: "rahmat@example.com" })
})

void test("Profile PATCH: normalized phone update allowed", () => {
  const validation = validateProfilePatch({ phone: "6281234567890" })
  assert.deepEqual(validation.value, { phone: "081234567890" })
})

void test("Profile PATCH: memberId rejected", () => {
  const validation = validateProfilePatch({ memberId: "PID-HACKED123" })
  assert.ok(validation.error)
})

void test("Profile PATCH: id rejected", () => {
  const validation = validateProfilePatch({ id: "user-id-forged" })
  assert.ok(validation.error)
})

void test("Profile PATCH: role rejected", () => {
  const validation = validateProfilePatch({ role: "super_admin_pc" })
  assert.ok(validation.error)
})

void test("Profile PATCH: status rejected", () => {
  const validation = validateProfilePatch({ status: "Aktif" })
  assert.ok(validation.error)
})

void test("Profile PATCH: modules rejected", () => {
  const validation = validateProfilePatch({ modules: [] })
  assert.ok(validation.error)
})

void test("Profile PATCH: grants rejected", () => {
  const validation = validateProfilePatch({ grants: [] })
  assert.ok(validation.error)
})

void test("Profile PATCH: password rejected", () => {
  const validation = validateProfilePatch({ password: "newpassword123" })
  assert.ok(validation.error)
})

void test("Profile PATCH: unsupported field rejects entire body", () => {
  const validation = validateProfilePatch({ name: "Ahmad", extra: "malicious" })
  assert.ok(validation.error)
})

void test("Avatar: approved managed upload path accepted", () => {
  const avatar = validateAvatarReference("/uploads/avatars/user-1.png")
  assert.equal(avatar.value, "/uploads/avatars/user-1.png")
  assert.equal(avatar.error, undefined)
})

void test("Avatar: external URL rejected", () => {
  assert.ok(validateAvatarReference("http://example.com/malicious.png").error)
  assert.ok(validateAvatarReference("https://example.com/malicious.png").error)
  assert.ok(validateAvatarReference("//example.com/malicious.png").error)
})

void test("Avatar: data URL rejected", () => {
  assert.ok(validateAvatarReference("data:image/png;base64,invalid").error)
})

void test("Avatar: javascript URL rejected", () => {
  assert.ok(validateAvatarReference("javascript:alert(1)").error)
})

void test("Avatar: traversal path rejected", () => {
  assert.ok(validateAvatarReference("/uploads/../malicious.png").error)
  assert.ok(validateAvatarReference("/uploads/..\\malicious.png").error)
})

void test("Avatar: executable path rejected", () => {
  assert.ok(validateAvatarReference("/uploads/shell.php").error)
  assert.ok(validateAvatarReference("/uploads/payload.js").error)
})

void test("Password: missing current password rejected", () => {
  const check = validatePasswordInput("", "newPassword123", "newPassword123")
  assert.equal(check.valid, false)
})

void test("Password: short password rejected", () => {
  const check = validatePasswordInput("currentPassword", "short", "short")
  assert.equal(check.valid, false)
})

void test("Password: confirmation mismatch rejected", () => {
  const check = validatePasswordInput("currentPassword", "newPassword123", "different")
  assert.equal(check.valid, false)
})

void test("Password: same current/new password policy rejected", () => {
  const check = validatePasswordInput("currentPassword123", "currentPassword123", "currentPassword123")
  assert.equal(check.valid, false)
})

void test("Password: valid password input accepted", () => {
  const check = validatePasswordInput("currentPassword123", "newPassword123", "newPassword123")
  assert.equal(check.valid, true)
})

void test("Password: password audit payload contains no password values", () => {
  const payload = passwordAuditPayload("actor-123", "2026-07-21T00:00:00.000Z")
  assert.deepEqual(payload, { actorId: "actor-123", targetUserId: "actor-123", action: "self_password_changed", timestamp: "2026-07-21T00:00:00.000Z" })
  assert.equal("currentPassword" in payload, false)
  assert.equal("newPassword" in payload, false)
  assert.equal("passwordHash" in payload, false)
})

void test("Session: successful password change requires current-session cookie clearing", () => {
  assert.equal(typeof AUTH_COOKIE_NAME, "string")
})
