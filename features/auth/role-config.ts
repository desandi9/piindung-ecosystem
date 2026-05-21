import type { AppRole } from "@/types/auth"

export const roleDisplayNames: Record<AppRole, string> = {
  super_admin_pc: "Super Admin PC",
  admin_pc: "Admin PC",
  admin_upzis: "Admin UPZIS",
  admin_kordes: "Admin Kordes / Ranting",
}

export const adminDashboardRoles: AppRole[] = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"]
export const operationalRoles: AppRole[] = ["admin_upzis", "admin_kordes"]
export const allPlatformRoles: AppRole[] = [...adminDashboardRoles, ...operationalRoles]
