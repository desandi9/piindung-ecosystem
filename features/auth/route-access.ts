import type { AppRole } from "@/types/auth"
import { adminDashboardRoles } from "@/features/auth/role-config"
import { matchesPathPrefix } from "@/utils"

export function isAdminRoute(pathname: string) {
  return matchesPathPrefix(pathname, "/admin")
}

export function canAccessAdminDashboard(role?: AppRole | null) {
  return role ? adminDashboardRoles.includes(role) : false
}

export function canBypassMaintenance(pathname: string, role?: AppRole | null) {
  return role === "super_admin_pc" && isAdminRoute(pathname)
}
