import type { AppRole } from "@/types/auth"

export const portalPermissionIds = [
  "portal.access",
  "dashboard.view",
  "member_area.view",
  "profile.view",
  "help.view",
  "notifications.view",
  "users.manage",
  "access.manage",
  "articles.manage",
  "homepage.manage",
  "products.manage",
  "impact.manage",
  "gallery.manage",
  "downloads.manage",
  "help_content.manage",
  "contact.manage",
  "branding.manage",
  "settings.manage",
  "audit.view",
  "notifications.manage",
  "modules.gorut.enter",
  "munfiq.transparency.own.view",
  "munfiq.account_links.manage",
] as const

export type PortalPermission = (typeof portalPermissionIds)[number]
export type RegisteredModuleKey = "gorut"

export const registeredModules = [
  { key: "gorut", name: "GORUT", route: "/gorut", description: "Digitalisasi Kotak Infaq NU" },
] as const

const basicPermissions: readonly PortalPermission[] = ["dashboard.view", "member_area.view", "profile.view", "help.view", "notifications.view"]
const managementPermissions = portalPermissionIds.filter((permission) =>
  !basicPermissions.includes(permission) &&
  permission !== "portal.access" &&
  permission !== "modules.gorut.enter" &&
  permission !== "munfiq.transparency.own.view" &&
  permission !== "munfiq.account_links.manage"
)

const capabilities: Record<AppRole, readonly PortalPermission[]> = {
  super_admin_pc: ["portal.access", ...basicPermissions, ...managementPermissions, "modules.gorut.enter", "munfiq.account_links.manage"],
  admin_pc: ["portal.access", ...basicPermissions, "articles.manage"],
  admin_upzis: ["portal.access", ...basicPermissions],
  admin_kordes: ["portal.access", ...basicPermissions],
  munfiq: ["portal.access", "profile.view", "notifications.view", "munfiq.transparency.own.view"],
}
const operationalModuleEligibleRoles: readonly AppRole[] = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"]

export function isPortalPermission(value: string): value is PortalPermission {
  return portalPermissionIds.includes(value as PortalPermission)
}

export function roleHasPortalPermission(role: string, permission: string) {
  if (!isPortalPermission(permission) || !(role in capabilities)) return false
  return capabilities[role as AppRole].includes(permission)
}

export function isRegisteredModuleKey(value: string): value is RegisteredModuleKey {
  return registeredModules.some((module) => module.key === value)
}

export function getRegisteredModuleByRoute(route: string) {
  return registeredModules.find((module) => module.route === route) ?? null
}

export function hasEffectiveModuleEntry(role: string, active: boolean, moduleKey: string, grantEnabled: boolean) {
  if (!active || !isRegisteredModuleKey(moduleKey) || !(role in capabilities) || !operationalModuleEligibleRoles.includes(role as AppRole)) return false
  return role === "super_admin_pc" || grantEnabled
}

export function resolveEffectivePortalModules(
  role: string,
  active: boolean,
  grants: readonly { moduleKey: string; enabled: boolean }[],
) {
  return registeredModules.filter((module) =>
    hasEffectiveModuleEntry(
      role,
      active,
      module.key,
      grants.some((grant) => grant.moduleKey === module.key && grant.enabled),
    ),
  )
}

export function canAccessPortalAccessApiRoute(
  role: string | null | undefined,
  method: string,
  pathname: string,
) {
  if (!pathname.startsWith("/api/portal-access") || !role || !(role in capabilities)) return false
  if (role === "super_admin_pc") return true
  return method.toUpperCase() === "GET" && pathname === "/api/portal-access/me"
}

export function canAccessLandingPageRoute(role: string, pathname: string) {
  if (!(role in capabilities)) return false
  if (pathname === "/dashboard/landing-page" || pathname.startsWith("/dashboard/landing-page/artikel")) return roleHasPortalPermission(role, "articles.manage") || role === "super_admin_pc"
  return pathname.startsWith("/dashboard/landing-page/beranda") || pathname.startsWith("/dashboard/landing-page/produk") || pathname.startsWith("/dashboard/landing-page/dampak") || pathname.startsWith("/dashboard/landing-page/bantuan") || pathname.startsWith("/dashboard/landing-page/galeri") || pathname.startsWith("/dashboard/landing-page/download") || pathname.startsWith("/dashboard/landing-page/media") || pathname.startsWith("/dashboard/landing-page/kontak") || pathname.startsWith("/dashboard/landing-page/pengaturan") ? role === "super_admin_pc" : false
}
