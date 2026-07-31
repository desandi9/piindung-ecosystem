import type { AppRole } from "@/types/auth"

export type CanonicalRouteClass = "public" | "authenticated" | "super-admin" | "legacy-redirect" | "operational-boundary" | "unknown"

export const publicRoutes = ["/", "/login", "/produk", "/dampak", "/artikel", "/program", "/informasi", "/laporan", "/rekening-donasi", "/qris-donasi", "/bantuan", "/kontak", "/galeri", "/download", "/verify"] as const
export const authenticatedRoutes = ["/dashboard", "/profil/identitas", "/profil", "/pengaturan-profil", "/notifikasi"] as const
export const superAdminRoutes = ["/dashboard/landing-page", "/dashboard/landing-page/beranda", "/dashboard/landing-page/produk", "/dashboard/landing-page/dampak", "/dashboard/landing-page/bantuan", "/dashboard/landing-page/pengaturan", "/dashboard/landing-page/galeri", "/dashboard/landing-page/download", "/dashboard/landing-page/media", "/dashboard/landing-page/kontak"] as const
export const legacyRedirectRoutes = ["/admin/notifikasi", "/admin/pengguna", "/admin/hak-akses"] as const
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

export type PortalNavigationIcon = "home" | "members" | "help" | "profile" | "landing"
export const primaryNavigation = [
  { id: "dashboard", label: "Beranda", href: "/dashboard", icon: "home" },
  { id: "landing-page", label: "Landing Page", href: "/dashboard/landing-page", icon: "landing" },
  { id: "bantuan", label: "Bantuan", href: "/dashboard/bantuan", icon: "help" },
  { id: "profil", label: "Profil", href: "/profil", icon: "profile" },
] as const satisfies ReadonlyArray<{ id: string; label: string; href: string; icon: PortalNavigationIcon }>

export function canPresentPortalModule(role: AppRole, route: string) {
  return route === "/gorut" && roles.includes(role)
}
