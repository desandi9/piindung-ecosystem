import { test } from "node:test"
import assert from "node:assert/strict"
import { accountActivityActions, accountActivityFilter, parseAccountActivity, parseAccountActivityQuery, serializeAccountActivity } from "./account-activity"

void test("AccountActivity: maps safe presentation without internal action data", () => {
  const parsed = parseAccountActivity({ createdAt: new Date("2026-07-22T00:00:00.000Z"), data: { action: "self_profile_email_changed", actorId: "user-1", targetUserId: "user-1", timestamp: "2026-07-22T01:00:00.000Z", field: "email", before: "old@example.com", after: "new@example.com", password: "secret" } })
  if (!parsed) throw new Error("Aktivitas seharusnya valid")
  const serialized = serializeAccountActivity(parsed)
  assert.deepEqual(serialized, { label: "Email diperbarui", description: "Alamat email akun Anda telah diperbarui.", category: "Profil", timestamp: "2026-07-22T01:00:00.000Z" })
  assert.equal("action" in serialized, false)
  assert.equal("field" in serialized, false)
  assert.equal("actorId" in serialized, false)
  assert.equal("before" in serialized, false)
  assert.equal("after" in serialized, false)
  assert.equal("password" in serialized, false)
})

void test("AccountActivity: maps password without credentials", () => {
  const parsed = parseAccountActivity({ createdAt: new Date("2026-07-22T00:00:00.000Z"), data: { action: "self_password_changed", actorId: "user-1", targetUserId: "user-1", timestamp: "2026-07-22T01:00:00.000Z", currentPassword: "secret", newPassword: "secret2" } })
  if (!parsed) throw new Error("Aktivitas password seharusnya valid")
  assert.equal(serializeAccountActivity(parsed).description, "Password akun Anda telah berhasil diperbarui.")
})

void test("AccountActivity: ignores unsupported notification actions", () => {
  assert.equal(parseAccountActivity({ createdAt: new Date(), data: { action: "notification_push_registered", actorId: "u", targetUserId: "u", timestamp: new Date().toISOString() } }), null)
  assert.equal(accountActivityActions.includes("notification_push_registered" as never), false)
  assert.equal(accountActivityActions.includes("notification_subscription_changed" as never), false)
})

void test("AccountActivity: current-user policy uses database target filter", () => {
  assert.deepEqual(accountActivityFilter("user-1"), { scope: { in: ["portal-user-audit", "portal-access-audit"] }, data: { path: ["targetUserId"], equals: "user-1" } })
})

void test("AccountActivity: pagination is bounded", () => {
  assert.deepEqual(parseAccountActivityQuery(new URLSearchParams("page=2&limit=50")).value, { page: 2, limit: 50 })
  assert.equal(parseAccountActivityQuery(new URLSearchParams("limit=51")).error, "Pagination aktivitas tidak valid.")
})
