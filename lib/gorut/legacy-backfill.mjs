import { createHash } from "node:crypto"
import { PrismaClient } from "@prisma/client"

export const approvedScopes = ["gorut-kordes-upzis", "gorut-munfiq", "gorut-munfiq-plpk", "gorut-penghimpunan-verification", "gorut-plpk-kordes", "user-operational-scope"]
export const dependencyOrder = ["kecamatan", "ranting", "plpk", "assignment", "munfiq", "transaction", "item", "workflow"]
export function stableCode(prefix, ...parts) { return `${prefix}-${createHash("sha256").update(parts.join("\u001f")).digest("hex").slice(0, 12).toUpperCase()}` }
export function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : null }
export function text(data, field) { const value = data[field]; return typeof value === "string" && value.trim() ? value.trim() : null }
export function parseMoney(value) { if ((typeof value !== "string" && typeof value !== "number") || !/^\d+(?:\.\d{1,2})?$/.test(String(value))) return null; const result = String(value); return result.includes(".") ? result : `${result}.00` }
export function validDate(value) { if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date }
export function safeIssue(category) { return { category, count: 1 } }
export function validateBackfillOptions({ flags = [], env = {} }) {
  const unknown = flags.filter(flag => flag !== "--apply")
  if (unknown.length > 0) return { ok: false, error: "Unknown flag" }
  const apply = flags.includes("--apply")
  if (!apply) return { ok: true, apply: false }
  if (env.NODE_ENV === "production") return { ok: false, error: "Production execution is rejected" }
  if (env.GORUT_BACKFILL_ACK !== "local-development") return { ok: false, error: "Apply requires GORUT_BACKFILL_ACK=local-development" }
  let url
  try { url = new URL(env.DATABASE_URL ?? "") } catch { return { ok: false, error: "Invalid DATABASE_URL" } }
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) return { ok: false, error: "Apply is restricted to a local database" }
  return { ok: true, apply: true }
}

export async function backfill({ apply, prisma = new PrismaClient() }) {
  const rows = await prisma.appRecord.findMany({ where: { scope: { in: approvedScopes } }, select: { scope: true, key: true, data: true } })
  const summary = Object.fromEntries(approvedScopes.map(scope => [scope, { source: rows.filter(row => row.scope === scope).length, valid: 0, inserted: 0, unchanged: 0, malformed: 0, unresolved: 0, conflict: 0 }]))
  const seenLegacy = new Set()
  const plpkRows = rows.filter(row => row.scope === "gorut-plpk-kordes")
  const parsed = []
  for (const row of plpkRows) {
    const legacyIdentity = `${row.scope}:${row.key}`
    if (seenLegacy.has(legacyIdentity)) { summary[row.scope].conflict++; continue }
    seenLegacy.add(legacyIdentity)
    const data = object(row.data); const code = data && text(data, "plpkCode"); const name = data && text(data, "plpkName"); const upzis = data && text(data, "upzis"); const rantingRaw = data && text(data, "ranting")
    if (!data || !code || !name || !upzis || !rantingRaw) { summary[row.scope].malformed++; continue }
    const kecamatan = upzis.replace(/^UPZIS\s+/i, ""); const ranting = rantingRaw.replace(/^Ranting\s+/i, ""); if (!kecamatan || !ranting) { summary[row.scope].unresolved++; continue }
    summary[row.scope].valid++; parsed.push({ row, code, name, kecamatan, ranting, phone: text(data, "phone") })
  }
  summary["gorut-munfiq"].unresolved = summary["gorut-munfiq"].source
  summary["gorut-munfiq-plpk"].unresolved = summary["gorut-munfiq-plpk"].source
  summary["gorut-kordes-upzis"].valid = summary["gorut-kordes-upzis"].source
  summary["gorut-penghimpunan-verification"].unresolved = summary["gorut-penghimpunan-verification"].source
  if (apply) await prisma.$transaction(async tx => {
    for (const item of parsed) {
      const kecCode = stableCode("KEC", item.kecamatan); const kecExisting = await tx.gorutKecamatan.findUnique({ where: { code: kecCode } }); const kec = await tx.gorutKecamatan.upsert({ where: { code: kecCode }, create: { code: kecCode, name: item.kecamatan }, update: {} })
      const rantingCode = stableCode("RAN", item.kecamatan, item.ranting); const rantingExisting = await tx.gorutRanting.findUnique({ where: { kecamatanId_code: { kecamatanId: kec.id, code: rantingCode } } }); const ranting = await tx.gorutRanting.upsert({ where: { kecamatanId_code: { kecamatanId: kec.id, code: rantingCode } }, create: { kecamatanId: kec.id, code: rantingCode, name: item.ranting }, update: {} })
      const existing = await tx.gorutPlpk.findUnique({ where: { code: item.code } }); await tx.gorutPlpk.upsert({ where: { code: item.code }, create: { code: item.code, name: item.name, phone: item.phone, rantingId: ranting.id, legacyScope: item.row.scope, legacyKey: item.row.key }, update: {} }); summary[item.row.scope][existing ? "unchanged" : "inserted"]++; if (!kecExisting) summary["gorut-kordes-upzis"].inserted++; if (!rantingExisting) summary["gorut-kordes-upzis"].inserted++
    }
    const assignments = rows.filter(row => row.scope === "user-operational-scope")
    for (const row of assignments) {
      const data = object(row.data); const userId = data && text(data, "userId"); const role = data && text(data, "role"); const kecName = data && text(data, "gorutKecamatan"); if (!userId || !role) { summary[row.scope].malformed++; continue }
      let normalizedRole = null; if (role === "admin_upzis") normalizedRole = "UPZIS"; else if (role === "admin_kordes") normalizedRole = "RANTING"; else if (role === "admin_pc" || role === "super_admin_pc") normalizedRole = "PC"; if (!normalizedRole) { summary[row.scope].unresolved++; continue }
      const kec = kecName ? await tx.gorutKecamatan.findUnique({ where: { name: kecName } }) : null; if (normalizedRole !== "PC" && !kec) { summary[row.scope].unresolved++; continue }
      const existing = await tx.gorutOperationalAssignment.findFirst({ where: { userId, role: normalizedRole, kecamatanId: kec?.id ?? null, isActive: true } }); if (!existing) await tx.gorutOperationalAssignment.create({ data: { userId, role: normalizedRole, kecamatanId: kec?.id } }); summary[row.scope][existing ? "unchanged" : "inserted"]++; summary[row.scope].valid++
    }
  }, { timeout: 30000 })
  return summary
}
