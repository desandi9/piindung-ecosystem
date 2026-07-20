import type { AppRole } from "@/types/auth"

export type PortalNavigationIcon = "home" | "members" | "help" | "profile"

export const primaryNavigation = [
  { id: "dashboard", label: "Beranda", href: "/dashboard", icon: "home" },
  { id: "member-area", label: "Member Area", href: "/member-area", icon: "members" },
  { id: "bantuan", label: "Bantuan", href: "/bantuan", icon: "help" },
  { id: "profil", label: "Profil", href: "/profil", icon: "profile" },
] as const satisfies ReadonlyArray<{
  id: string
  label: string
  href: string
  icon: PortalNavigationIcon
}>

const gorutRoles: ReadonlySet<AppRole> = new Set<AppRole>([
  "super_admin_pc",
  "admin_pc",
  "admin_upzis",
  "admin_kordes",
])

export function canPresentPortalModule(role: AppRole, route: string) {
  return route === "/gorut" && gorutRoles.has(role)
}
