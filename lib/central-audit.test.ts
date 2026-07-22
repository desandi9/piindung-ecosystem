import { test } from "node:test"
import assert from "node:assert/strict"
import { mapCentralAudit, parseCentralAuditQuery } from "./central-audit"

void test("CentralAudit: maps safe action to summary, category, source labels", () => {
  const entry = mapCentralAudit({
    createdAt: new Date("2026-07-22T00:00:00.000Z"),
    actorName: "Admin",
    targetName: "Anggota",
    data: { actorId: "actor-1", targetUserId: "target-1", action: "user_role_changed", timestamp: "2026-07-22T01:00:00.000Z", before: { passwordHash: "secret" }, after: { role: "admin_pc" }, token: "secret" }
  })
  if (!entry) throw new Error("Audit seharusnya valid")
  assert.deepEqual(entry, {
    summary: "Peran akun pengguna diperbarui.",
    category: "Akses",
    sourceLabel: "Pengguna",
    timestamp: "2026-07-22T01:00:00.000Z",
    actorName: "Admin",
    targetName: "Anggota"
  })
  assert.equal("id" in entry, false)
  assert.equal("scope" in entry, false)
  assert.equal("action" in entry, false)
  assert.equal("before" in entry, false)
  assert.equal("after" in entry, false)
  assert.equal("token" in entry, false)
})

void test("CentralAudit: handles notification publish/withdraw action mappings", () => {
  const publishEntry = mapCentralAudit({
    createdAt: new Date("2026-07-22T00:00:00.000Z"),
    actorName: "Admin",
    data: { actorId: "actor-1", action: "notification_published", timestamp: "2026-07-22T01:00:00.000Z" }
  })
  if (!publishEntry) throw new Error("Audit publikasi seharusnya valid")
  assert.equal(publishEntry.summary, "Notifikasi dipublikasikan.")
  assert.equal(publishEntry.targetName, "Audiens notifikasi")

  const withdrawEntry = mapCentralAudit({
    createdAt: new Date("2026-07-22T00:00:00.000Z"),
    actorName: "Admin",
    data: { actorId: "actor-1", action: "notification_withdrawn", timestamp: "2026-07-22T01:00:00.000Z" }
  })
  if (!withdrawEntry) throw new Error("Audit penarikan seharusnya valid")
  assert.equal(withdrawEntry.summary, "Notifikasi ditarik.")
  assert.equal(withdrawEntry.targetName, "Audiens notifikasi")
})

void test("CentralAudit: handles malformed records with safe fallbacks or null", () => {
  assert.equal(mapCentralAudit({ createdAt: new Date(), data: null }), null)
  assert.equal(mapCentralAudit({ createdAt: new Date(), data: { action: "unknown_hack_attempt" } }), null)

  const missingNames = mapCentralAudit({
    createdAt: new Date("2026-07-22T00:00:00.000Z"),
    data: { action: "user_activated" }
  })
  if (!missingNames) throw new Error("Audit tanpa nama seharusnya valid")
  assert.equal(missingNames.actorName, "Pengguna tidak tersedia")
  assert.equal(missingNames.targetName, "Pengguna tidak tersedia")
})

void test("CentralAudit: filters and pagination are validated", () => {
  const valid = parseCentralAuditQuery(new URLSearchParams("category=Profil&action=profile-updated&from=2026-07-01&to=2026-07-22&limit=50"))
  assert.equal(valid.value?.category, "Profil")
  assert.equal(valid.value?.action, "profile-updated")
  assert.equal(valid.value?.limit, 50)
  assert.equal(parseCentralAuditQuery(new URLSearchParams("category=unknown")).error, "Filter audit tidak valid.")
  assert.equal(parseCentralAuditQuery(new URLSearchParams("action=unknown")).error, "Filter audit tidak valid.")
  assert.equal(parseCentralAuditQuery(new URLSearchParams("limit=51")).error, "Filter audit tidak valid.")
})
