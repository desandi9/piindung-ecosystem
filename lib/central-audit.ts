export const centralAuditScopes = ["portal-user-audit", "portal-access-audit", "portal-notification-audit"] as const
export const centralAuditCategories = ["Akun", "Profil", "Keamanan", "Akses", "Notifikasi"] as const
export const centralAuditActions = ["account-created", "account-updated", "account-activated", "account-deactivated", "profile-updated", "password-updated", "module-access-enabled", "module-access-disabled", "notification-published", "notification-withdrawn"] as const

export type CentralAuditCategory = (typeof centralAuditCategories)[number]
export type CentralAuditAction = (typeof centralAuditActions)[number]

export interface CentralAuditEntry {
  summary: string
  category: CentralAuditCategory
  sourceLabel: string
  timestamp: string
  actorName: string
  targetName: string
}

export interface CentralAuditQuery {
  page: number
  limit: number
  category?: CentralAuditCategory
  action?: CentralAuditAction
  search?: string
  from?: Date
  to?: Date
}

type InternalPresentation = { action: CentralAuditAction; summary: string; category: CentralAuditCategory; sourceLabel: string; targetFallback?: string }

const presentations: Record<string, InternalPresentation> = {
  self_password_changed: { action: "password-updated", summary: "Password akun diperbarui.", category: "Keamanan", sourceLabel: "Pengguna" },
  self_profile_name_changed: { action: "profile-updated", summary: "Nama profil diperbarui.", category: "Profil", sourceLabel: "Pengguna" },
  self_profile_email_changed: { action: "profile-updated", summary: "Alamat email profil diperbarui.", category: "Profil", sourceLabel: "Pengguna" },
  self_profile_phone_changed: { action: "profile-updated", summary: "Nomor HP profil diperbarui.", category: "Profil", sourceLabel: "Pengguna" },
  self_profile_avatar_changed: { action: "profile-updated", summary: "Foto profil diperbarui.", category: "Profil", sourceLabel: "Pengguna" },
  user_created: { action: "account-created", summary: "Akun pengguna dibuat.", category: "Akun", sourceLabel: "Pengguna" },
  user_name_changed: { action: "account-updated", summary: "Nama akun pengguna diperbarui.", category: "Profil", sourceLabel: "Pengguna" },
  user_email_changed: { action: "account-updated", summary: "Alamat email akun pengguna diperbarui.", category: "Profil", sourceLabel: "Pengguna" },
  user_role_changed: { action: "account-updated", summary: "Peran akun pengguna diperbarui.", category: "Akses", sourceLabel: "Pengguna" },
  user_activated: { action: "account-activated", summary: "Akun pengguna diaktifkan.", category: "Akun", sourceLabel: "Pengguna" },
  user_deactivated: { action: "account-deactivated", summary: "Akun pengguna dinonaktifkan.", category: "Akun", sourceLabel: "Pengguna" },
  module_entry_enabled: { action: "module-access-enabled", summary: "Akses modul pengguna diberikan.", category: "Akses", sourceLabel: "Hak Akses" },
  module_entry_disabled: { action: "module-access-disabled", summary: "Akses modul pengguna dicabut.", category: "Akses", sourceLabel: "Hak Akses" },
  notification_published: { action: "notification-published", summary: "Notifikasi dipublikasikan.", category: "Notifikasi", sourceLabel: "Notifikasi", targetFallback: "Audiens notifikasi" },
  notification_publish: { action: "notification-published", summary: "Notifikasi dipublikasikan.", category: "Notifikasi", sourceLabel: "Notifikasi", targetFallback: "Audiens notifikasi" },
  notification_withdrawn: { action: "notification-withdrawn", summary: "Notifikasi ditarik.", category: "Notifikasi", sourceLabel: "Notifikasi", targetFallback: "Audiens notifikasi" },
  notification_withdraw: { action: "notification-withdrawn", summary: "Notifikasi ditarik.", category: "Notifikasi", sourceLabel: "Notifikasi", targetFallback: "Audiens notifikasi" }
}

export const centralAuditInternalActions = Object.keys(presentations)

function parseDate(value: string | null, end = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value ? null : undefined
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

export function parseCentralAuditQuery(params: URLSearchParams): { value?: CentralAuditQuery; error?: string } {
  const page = Number(params.get("page") ?? "1")
  const limit = Number(params.get("limit") ?? "25")
  const category = params.get("category")?.trim() || undefined
  const action = params.get("action")?.trim() || undefined
  const search = params.get("search")?.trim().slice(0, 100) || undefined
  const from = parseDate(params.get("from"))
  const to = parseDate(params.get("to"), true)
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(limit) || limit < 1 || limit > 50 || (category && !centralAuditCategories.includes(category as CentralAuditCategory)) || (action && !centralAuditActions.includes(action as CentralAuditAction)) || from === null || to === null || (from && to && from > to)) return { error: "Filter audit tidak valid." }
  return { value: { page, limit, ...(category ? { category: category as CentralAuditCategory } : {}), ...(action ? { action: action as CentralAuditAction } : {}), ...(search ? { search } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) } }
}

export function centralAuditActionsForQuery(query: Pick<CentralAuditQuery, "category" | "action">) {
  return centralAuditInternalActions.filter((action) => (!query.category || presentations[action].category === query.category) && (!query.action || presentations[action].action === query.action))
}

function safeName(value: unknown, fallback = "Pengguna tidak tersedia") {
  return typeof value === "string" && value.trim() ? value : fallback
}

export function mapCentralAudit(record: { data: unknown; createdAt: Date; actorName?: string | null; targetName?: string | null }): CentralAuditEntry | null {
  if (!record.data || typeof record.data !== "object" || Array.isArray(record.data)) return null
  const data = record.data as Record<string, unknown>
  if (typeof data.action !== "string") return null
  const presentation = presentations[data.action]
  if (!presentation) return null
  const timestamp = typeof data.timestamp === "string" && !Number.isNaN(Date.parse(data.timestamp)) ? data.timestamp : record.createdAt.toISOString()
  return {
    summary: presentation.summary,
    category: presentation.category,
    sourceLabel: presentation.sourceLabel,
    timestamp,
    actorName: safeName(record.actorName),
    targetName: safeName(record.targetName, presentation.targetFallback)
  }
}
