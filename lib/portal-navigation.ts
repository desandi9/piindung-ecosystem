import type { AppRole } from "@/types/auth"

export type CanonicalRouteClass = "public" | "authenticated" | "super-admin" | "legacy-redirect" | "operational-boundary" | "unknown"

export const publicRoutes = ["/", "/login", "/produk", "/dampak", "/artikel", "/program", "/informasi", "/laporan", "/rekening-donasi", "/qris-donasi", "/bantuan", "/kontak", "/galeri", "/download", "/verify"] as const
export const authenticatedRoutes = ["/dashboard", "/member-area", "/member-area/identitas", "/member-area/aktivitas", "/profil", "/pengaturan-profil", "/notifikasi"] as const
export const superAdminRoutes = ["/member-area/pengguna", "/member-area/hak-akses", "/member-area/audit", "/member-area/konten", "/member-area/konten/beranda", "/member-area/konten/produk", "/member-area/konten/dampak", "/member-area/konten/bantuan", "/member-area/konten/galeri", "/member-area/konten/download", "/member-area/konten/media", "/member-area/konten/kontak"] as const
export const legacyRedirectRoutes = ["/admin/notifikasi"] as const
export const operationalBoundaryRoutes = ["/gorut", "/api/user-operational-scopes"] as const

const roles: readonly AppRole[] = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"]

function matches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function classifyCanonicalRoute(pathname: string, role?: AppRole | string): CanonicalRouteClass {
  if (legacyRedirectRoutes.some((route) => matches(pathname, route))) return "legacy-redirect"
  if (operationalBoundaryRoutes.some((route) => matches(pathname, route))) return "operational-boundary"
  if (publicRoutes.some((route) => matches(pathname, route))) return "public"
  if (superAdminRoutes.some((route) => matches(pathname, route))) return role === "super_admin_pc" ? "super-admin" : "unknown"
  if (authenticatedRoutes.some((route) => matches(pathname, route))) return roles.includes(role as AppRole) ? "authenticated" : "unknown"
  return "unknown"
}

export type PortalNavigationIcon = "home" | "members" | "help" | "profile"
export const primaryNavigation = [
  { id: "dashboard", label: "Beranda", href: "/dashboard", icon: "home" },
  { id: "member-area", label: "Member Area", href: "/member-area", icon: "members" },
  { id: "bantuan", label: "Bantuan", href: "/bantuan", icon: "help" },
  { id: "profil", label: "Profil", href: "/profil", icon: "profile" },
] as const satisfies ReadonlyArray<{ id: string; label: string; href: string; icon: PortalNavigationIcon }>

export function canPresentPortalModule(role: AppRole, route: string) {
  return route === "/gorut" && roles.includes(role)
}
