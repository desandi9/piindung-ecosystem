import type { AppRole } from "@/types/auth"
import { registeredModules } from "./portal-access"
import { appRoles } from "./portal-user-management"

export const notificationCategories = ["general", "security", "account", "access", "system"] as const
export const notificationSeverities = ["info", "success", "warning", "critical"] as const
export const notificationAudiences = ["all", "role", "user"] as const
export type NotificationCategory = typeof notificationCategories[number]
export type NotificationSeverity = typeof notificationSeverities[number]
export type NotificationAudience = typeof notificationAudiences[number]

const inputFields = new Set(["title", "body", "category", "severity", "audience", "actionPath", "targetUserId", "targetRole", "expiresAt"])
const commonPaths = new Set(["/profil", "/pengaturan-profil", "/member-area", "/member-area/identitas", "/notifikasi"])
const unsafeTextPattern = /<\/?[a-z][\s\S]*>|<script\b|javascript:|on\w+\s*=|[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/i
const safeWordingPattern = /[\w.+-]+@[\w-]+\.[\w.-]+|\b(?:https?:\/\/|www\.)|\b(?:Rp|IDR)\s?\d|\b(?:081|08\d{2})\d{6,}/i

export type NotificationInput = {
  title: string
  body: string
  category: NotificationCategory
  severity: NotificationSeverity
  audience: NotificationAudience
  actionPath?: string | null
  targetUserId?: string | null
  targetRole?: AppRole | null
  expiresAt?: Date | null
}

export function normalizePlainText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function parseNotificationPagination(searchParams: URLSearchParams, defaults = { page: 1, limit: 20 }) {
  const pageText = searchParams.get("page")
  const limitText = searchParams.get("limit")
  const page = pageText === null ? defaults.page : Number(pageText)
  const limit = limitText === null ? defaults.limit : Number(limitText)
  if (!Number.isInteger(page) || page <= 0 || !Number.isInteger(limit) || limit <= 0 || limit > 50) return { error: "Parameter pagination tidak valid." as const }
  return { value: { page, limit } }
}

export function isAppRoleValue(value: unknown): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole)
}

export function parseNotificationInput(input: unknown): { value?: NotificationInput; error?: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Data notifikasi tidak valid." }
  const record = input as Record<string, unknown>
  if (Object.keys(record).some((key) => !inputFields.has(key))) return { error: "Field notifikasi tidak didukung." }
  if (typeof record.title !== "string") return { error: "Judul notifikasi tidak valid." }
  if (typeof record.body !== "string") return { error: "Isi notifikasi tidak valid." }
  const title = normalizePlainText(record.title)
  const body = normalizePlainText(record.body)
  if (title.length < 3 || title.length > 120) return { error: "Judul notifikasi tidak valid." }
  if (body.length < 3 || body.length > 2000) return { error: "Isi notifikasi tidak valid." }
  if (unsafeTextPattern.test(record.title) || unsafeTextPattern.test(record.body)) return { error: "Notifikasi harus berupa teks polos." }
  if (safeWordingPattern.test(`${title} ${body}`)) return { error: "Notifikasi tidak boleh memuat detail kontak, tautan, atau nominal." }
  if (!notificationCategories.includes(record.category as NotificationCategory) || !notificationSeverities.includes(record.severity as NotificationSeverity) || !notificationAudiences.includes(record.audience as NotificationAudience)) return { error: "Metadata notifikasi tidak valid." }
  if (record.actionPath !== undefined && record.actionPath !== null && (typeof record.actionPath !== "string" || !isAllowedActionPath(record.actionPath))) return { error: "Tujuan notifikasi tidak valid." }
  if (record.audience === "all" && (record.targetUserId !== undefined || record.targetRole !== undefined)) return { error: "Target notifikasi tidak sesuai." }
  if (record.audience === "role" && !isAppRoleValue(record.targetRole)) return { error: "Target role tidak valid." }
  if (record.audience === "user" && typeof record.targetUserId !== "string") return { error: "Target pengguna wajib diisi." }
  if (record.expiresAt !== undefined && record.expiresAt !== null && typeof record.expiresAt !== "string") return { error: "Waktu kedaluwarsa tidak valid." }
  const expiresAt = typeof record.expiresAt === "string" ? new Date(record.expiresAt) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { error: "Waktu kedaluwarsa tidak valid." }
  if (expiresAt && expiresAt <= new Date()) return { error: "Waktu kedaluwarsa harus di masa depan." }
  return { value: { title, body, category: record.category as NotificationCategory, severity: record.severity as NotificationSeverity, audience: record.audience as NotificationAudience, actionPath: typeof record.actionPath === "string" ? record.actionPath : null, targetUserId: typeof record.targetUserId === "string" ? record.targetUserId : null, targetRole: isAppRoleValue(record.targetRole) ? record.targetRole : null, expiresAt } }
}

export function validateNotificationInput(input: unknown) {
  return parseNotificationInput(input).error ?? null
}

export function isAllowedActionPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false
  if (/[a-z][a-z0-9+.-]*:/i.test(path)) return false
  const decoded = decodeURIComponentSafe(path)
  if (!decoded || decoded.includes("..") || decoded.includes("\\")) return false
  return commonPaths.has(path) || registeredModules.some((module) => path === module.route || path.startsWith(`${module.route}/`))
}

function decodeURIComponentSafe(path: string) {
  try { return decodeURIComponent(path) } catch { return null }
}

export function canUseActionPath(path: string | null | undefined, role: string, grants: string[]) {
  if (!path || commonPaths.has(path)) return path ?? null
  const module = registeredModules.find((item) => path === item.route || path.startsWith(`${item.route}/`))
  if (!module) return null
  return role === "super_admin_pc" || grants.includes(module.key) ? path : null
}

export function isEligibleForNotification(audience: NotificationAudience, targetUserId: string | null, targetRole: string | null, userId: string, role: string) {
  if (audience === "all") return true
  if (audience === "role") return targetRole === role
  return targetUserId === userId
}

export function isVisibleNotification(item: { publishedAt: Date | null; withdrawnAt: Date | null; expiresAt: Date | null }, now = new Date()) {
  return !!item.publishedAt && !item.withdrawnAt && (!item.expiresAt || item.expiresAt > now)
}

export function serializeNotification(item: { id: string; title: string; body: string; category: string; severity: string; actionPath: string | null; publishedAt: Date | null; createdAt: Date; readAt?: Date | null }) {
  return { id: item.id, title: item.title, body: item.body, category: item.category, severity: item.severity, actionPath: item.actionPath, publishedAt: item.publishedAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null, read: Boolean(item.readAt) }
}
