import assert from "node:assert/strict"
import test from "node:test"
import { canUseActionPath, isAllowedActionPath, isEligibleForNotification, isVisibleNotification, notificationAudiences, notificationCategories, normalizePlainText, parseNotificationInput, parseNotificationPagination, serializeNotification } from "./portal-notifications"

const base = { title: "Informasi Portal", body: "Informasi aman untuk pengguna.", category: "general", severity: "info", audience: "all" }
const legacyMemberArea = `/${"member-area"}`

void test("notification metadata is exact", () => {
  assert.deepEqual([...notificationCategories], ["general", "security", "account", "access", "system"])
  assert.deepEqual([...notificationAudiences], ["all", "role", "user"])
})

void test("strict validation and plain text normalization", () => {
  assert.equal(parseNotificationInput(base).value?.title, "Informasi Portal")
  assert.equal(normalizePlainText("  teks\n  aman  "), "teks aman")
  assert.ok(parseNotificationInput({ ...base, extra: true }).error)
  assert.ok(parseNotificationInput({ ...base, title: "x".repeat(121) }).error)
  assert.equal(parseNotificationInput({ ...base, body: "x".repeat(2000) }).error, undefined)
  assert.ok(parseNotificationInput({ ...base, body: "x".repeat(2001) }).error)
  assert.ok(parseNotificationInput({ ...base, body: "<script>alert(1)</script>" }).error)
  assert.ok(parseNotificationInput({ ...base, body: "<b>teks</b>" }).error)
})

void test("pagination parser rejects invalid values", () => {
  assert.deepEqual(parseNotificationPagination(new URLSearchParams()), { value: { page: 1, limit: 20 } })
  assert.deepEqual(parseNotificationPagination(new URLSearchParams("page=2&limit=50")), { value: { page: 2, limit: 50 } })
  for (const query of ["page=0", "page=-1", "page=1.5", "page=NaN", "limit=0", "limit=-1", "limit=1.5", "limit=51", "limit=NaN"]) assert.ok(parseNotificationPagination(new URLSearchParams(query)).error)
})

void test("audience validation", () => {
  assert.equal(parseNotificationInput({ ...base, audience: "role", targetRole: "admin_pc" }).value?.targetRole, "admin_pc")
  assert.ok(parseNotificationInput({ ...base, audience: "role", targetRole: "invalid" }).error)
  assert.equal(parseNotificationInput({ ...base, audience: "user", targetUserId: "u1" }).value?.targetUserId, "u1")
  assert.ok(parseNotificationInput({ ...base, audience: "user" }).error)
  assert.ok(parseNotificationInput({ ...base, targetRole: "admin_pc" }).error)
})

void test("action paths reject external and traversal forms", () => {
  for (const path of ["/dashboard", "/profil", "/pengaturan-profil", "/profil/identitas", "/notifikasi", "/gorut", "/gorut/dashboard"]) assert.equal(isAllowedActionPath(path), true)
  for (const path of ["//evil.test", "https://evil.test", "/foo\\bar", "/%2e%2e/admin", legacyMemberArea, `${legacyMemberArea}/notifikasi`, "/random"]) assert.equal(isAllowedActionPath(path), false)
  assert.equal(canUseActionPath("/gorut/dashboard", "admin_pc", []), null)
  assert.equal(canUseActionPath("/gorut/dashboard", "admin_pc", ["gorut"]), "/gorut/dashboard")
  assert.equal(canUseActionPath("/gorut", "super_admin_pc", []), "/gorut")
})

void test("eligibility supports all role and user", () => {
  assert.equal(isEligibleForNotification("all", null, null, "u1", "admin_pc"), true)
  assert.equal(isEligibleForNotification("role", null, "admin_pc", "u1", "admin_pc"), true)
  assert.equal(isEligibleForNotification("role", null, "admin_upzis", "u1", "admin_pc"), false)
  assert.equal(isEligibleForNotification("user", "u1", null, "u1", "admin_pc"), true)
})

void test("visibility excludes drafts withdrawals and expiry", () => {
  const now = new Date("2026-07-22T12:00:00Z")
  assert.equal(isVisibleNotification({ publishedAt: now, withdrawnAt: null, expiresAt: null }, now), true)
  assert.equal(isVisibleNotification({ publishedAt: null, withdrawnAt: null, expiresAt: null }, now), false)
  assert.equal(isVisibleNotification({ publishedAt: now, withdrawnAt: now, expiresAt: null }, now), false)
  assert.equal(isVisibleNotification({ publishedAt: now, withdrawnAt: null, expiresAt: new Date("2026-07-22T11:00:00Z") }, now), false)
})

void test("personal serializer omits audience and internal targeting", () => {
  const result = serializeNotification({ id: "n1", title: "Test", body: "Body", category: "system", severity: "info", actionPath: null, publishedAt: new Date("2026-07-22T00:00:00Z"), createdAt: new Date("2026-07-21T00:00:00Z"), readAt: null })
  assert.equal(result.read, false)
  assert.equal(result.readAt, null)
  for (const field of ["audience", "creator", "creatorId", "targetUserId", "targetRole", "recipients", "withdrawnAt", "expiresAt"]) assert.equal(field in result, false)
})
