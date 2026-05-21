import type { AppRole } from "@/types/auth"
import { adminDashboardRoles } from "@/features/auth/role-config"
import { matchesAnyPathPrefix, matchesPathPrefix } from "@/utils"

export const superAdminOnlyRoutes = [
  "/admin/pengguna",
  "/admin/hak-akses",
  "/admin/media",
  "/admin/aplikasi",
  "/admin/backup",
  "/admin/maintenance",
  "/admin/pengaturan",
  "/admin/system-health",
  "/admin/audit-trail",
  "/admin/riwayat-login",
]

export function isAdminRoute(pathname: string) {
  return matchesPathPrefix(pathname, "/admin")
}

export function canAccessAdminDashboard(role?: AppRole | null) {
  return role ? adminDashboardRoles.includes(role) : false
}

export function isSuperAdminOnlyRoute(pathname: string) {
  return matchesAnyPathPrefix(pathname, superAdminOnlyRoutes)
}

export function canAccessRoute(pathname: string, role?: AppRole | null) {
  if (!isAdminRoute(pathname)) return true
  if (!canAccessAdminDashboard(role)) return false
  if ((role === "admin_upzis" || role === "admin_kordes") && pathname !== "/admin" && !pathname.startsWith("/admin/notifikasi")) return false
  if (isSuperAdminOnlyRoute(pathname) && role !== "super_admin_pc") return false
  return true
}

export function canBypassMaintenance(pathname: string, role?: AppRole | null) {
  return role === "super_admin_pc" && isAdminRoute(pathname)
}
