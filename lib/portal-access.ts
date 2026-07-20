import type { AppRole } from "@/types/auth"

export const portalPermissionIds = [
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
  "modules.gorut.enter",
] as const

export type PortalPermission = (typeof portalPermissionIds)[number]
export type RegisteredModuleKey = "gorut"

export const registeredModules = [
  { key: "gorut", name: "GORUT", route: "/gorut", description: "Digitalisasi Kotak Infaq NU" },
] as const

const basicPermissions: readonly PortalPermission[] = ["dashboard.view", "member_area.view", "profile.view", "help.view", "notifications.view"]
const managementPermissions = portalPermissionIds.filter((permission) => !basicPermissions.includes(permission) && permission !== "modules.gorut.enter")

const capabilities: Record<AppRole, readonly PortalPermission[]> = {
  super_admin_pc: [...basicPermissions, ...managementPermissions, "modules.gorut.enter"],
  admin_pc: [...basicPermissions, "articles.manage"],
  admin_upzis: basicPermissions,
  admin_kordes: basicPermissions,
}

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
  if (!active || !isRegisteredModuleKey(moduleKey) || !(role in capabilities)) return false
  return role === "super_admin_pc" || grantEnabled
}

export function canAccessMemberAreaRoute(role: string, pathname: string) {
  if (!(role in capabilities)) return false
  if (pathname === "/member-area" || pathname === "/member-area/identitas") return roleHasPortalPermission(role, "member_area.view")

  if (pathname === "/member-area/konten" || pathname.startsWith("/member-area/konten/artikel")) return roleHasPortalPermission(role, "articles.manage") || role === "super_admin_pc"
  if (pathname.startsWith("/member-area/konten/beranda") || pathname.startsWith("/member-area/konten/produk") || pathname.startsWith("/member-area/konten/dampak") || pathname.startsWith("/member-area/konten/bantuan") || pathname.startsWith("/member-area/konten/galeri") || pathname.startsWith("/member-area/konten/download") || pathname.startsWith("/member-area/konten/media") || pathname.startsWith("/member-area/konten/kontak")) return role === "super_admin_pc"

  if (pathname === "/member-area/hak-akses") return roleHasPortalPermission(role, "access.manage")
  if (pathname === "/member-area/pengguna") return roleHasPortalPermission(role, "users.manage")
  return false
}
