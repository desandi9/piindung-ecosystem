export const accountActivityScopes = ["portal-user-audit", "portal-access-audit"] as const

export const accountActivityActions = ["self_password_changed", "self_profile_name_changed", "self_profile_email_changed", "self_profile_phone_changed", "self_profile_avatar_changed", "user_created", "user_name_changed", "user_email_changed", "user_role_changed", "user_activated", "user_deactivated", "module_entry_enabled", "module_entry_disabled"] as const

export type ActivityAction = (typeof accountActivityActions)[number]
export type AccountActivityCategory = "Profil" | "Keamanan" | "Akun" | "Akses"

const presentations: Record<ActivityAction, { label: string; description: string; category: AccountActivityCategory }> = {
  self_password_changed: { label: "Password diperbarui", description: "Password akun Anda telah berhasil diperbarui.", category: "Keamanan" },
  self_profile_name_changed: { label: "Nama profil diperbarui", description: "Nama pada profil Anda telah diperbarui.", category: "Profil" },
  self_profile_email_changed: { label: "Email diperbarui", description: "Alamat email akun Anda telah diperbarui.", category: "Profil" },
  self_profile_phone_changed: { label: "Nomor HP diperbarui", description: "Nomor HP akun Anda telah diperbarui.", category: "Profil" },
  self_profile_avatar_changed: { label: "Foto profil diperbarui", description: "Foto profil akun Anda telah diperbarui.", category: "Profil" },
  user_created: { label: "Akun dibuat", description: "Akun Anda telah dibuat di sistem.", category: "Akun" },
  user_name_changed: { label: "Nama akun diperbarui", description: "Nama akun Anda telah diperbarui oleh pengelola.", category: "Profil" },
  user_email_changed: { label: "Email akun diperbarui", description: "Alamat email akun Anda telah diperbarui oleh pengelola.", category: "Profil" },
  user_role_changed: { label: "Peran akun diperbarui", description: "Peran dan kewenangan akun Anda telah diperbarui.", category: "Akses" },
  user_activated: { label: "Akun diaktifkan", description: "Akun Anda telah diaktifkan.", category: "Akun" },
  user_deactivated: { label: "Akun dinonaktifkan", description: "Akun Anda telah dinonaktifkan.", category: "Akun" },
  module_entry_enabled: { label: "Akses modul diberikan", description: "Akses Anda ke sebuah modul telah diberikan.", category: "Akses" },
  module_entry_disabled: { label: "Akses modul dicabut", description: "Akses Anda ke sebuah modul telah dicabut.", category: "Akses" }
}

export interface AccountActivity {
  action: ActivityAction
  timestamp: string
}

export interface AccountActivityQuery {
  page: number
  limit: number
}

export function accountActivityFilter(targetUserId: string) {
  return { scope: { in: [...accountActivityScopes] }, data: { path: ["targetUserId"], equals: targetUserId } }
}

export function parseAccountActivityQuery(params: URLSearchParams): { value?: AccountActivityQuery; error?: string } {
  const page = Number(params.get("page") ?? "1")
  const limit = Number(params.get("limit") ?? "25")
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(limit) || limit < 1 || limit > 50) return { error: "Pagination aktivitas tidak valid." }
  return { value: { page, limit } }
}

export function isActivityAction(value: unknown): value is ActivityAction {
  return typeof value === "string" && accountActivityActions.includes(value as ActivityAction)
}

export function parseAccountActivity(record: { data: unknown; createdAt: Date }): AccountActivity | null {
  if (!record.data || typeof record.data !== "object" || Array.isArray(record.data)) return null
  const data = record.data as Record<string, unknown>
  if (!isActivityAction(data.action)) return null
  const timestamp = typeof data.timestamp === "string" && !Number.isNaN(Date.parse(data.timestamp)) ? data.timestamp : record.createdAt.toISOString()
  return { action: data.action, timestamp }
}

export function serializeAccountActivity(activity: AccountActivity) {
  return { ...presentations[activity.action], timestamp: activity.timestamp }
}
