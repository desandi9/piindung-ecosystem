import assert from "node:assert/strict"
import test from "node:test"
import {
  roleHasPortalPermission,
  hasEffectiveModuleEntry,
  canAccessMemberAreaRoute,
  isRegisteredModuleKey,
  isPortalPermission,
  getRegisteredModuleByRoute
} from "./portal-access"

void test("portal-access: Basic permissions", () => {
  const roles = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"] as const
  const basicPermissions = [
    "dashboard.view",
    "member_area.view",
    "profile.view",
    "help.view",
    "notifications.view"
  ]

  for (const role of roles) {
    for (const permission of basicPermissions) {
      assert.equal(
        roleHasPortalPermission(role, permission),
        true,
        `Role ${role} must have permission ${permission}`
      )
    }
  }
})

void test("portal-access: Super Admin permissions", () => {
  const superAdmin = "super_admin_pc"
  const expectedPermissions = [
    "users.manage",
    "access.manage",
    "articles.manage",
    "settings.manage",
    "audit.view",
    // All other management permissions
    "homepage.manage",
    "products.manage",
    "impact.manage",
    "gallery.manage",
    "downloads.manage",
    "help_content.manage",
    "contact.manage",
    "branding.manage",
    "notifications.manage"
  ]

  for (const permission of expectedPermissions) {
    assert.equal(
      roleHasPortalPermission(superAdmin, permission),
      true,
      `Super Admin must have permission ${permission}`
    )
  }
})

void test("portal-access: Admin PC permissions", () => {
  const adminPC = "admin_pc"
  assert.equal(roleHasPortalPermission(adminPC, "articles.manage"), true, "Admin PC must have articles.manage")
  assert.equal(roleHasPortalPermission(adminPC, "users.manage"), false, "Admin PC must not have users.manage")
  assert.equal(roleHasPortalPermission(adminPC, "access.manage"), false, "Admin PC must not have access.manage")
  assert.equal(roleHasPortalPermission(adminPC, "settings.manage"), false, "Admin PC must not have settings.manage")
  assert.equal(roleHasPortalPermission(adminPC, "audit.view"), false, "Admin PC must not have audit.view")
})

void test("portal-access: Other roles permissions", () => {
  const otherRoles = ["admin_upzis", "admin_kordes"] as const
  const managementPermissions = [
    "users.manage",
    "access.manage",
    "articles.manage",
    "settings.manage",
    "audit.view",
    "homepage.manage",
    "products.manage",
    "impact.manage",
    "gallery.manage",
    "downloads.manage",
    "help_content.manage",
    "contact.manage",
    "branding.manage",
    "notifications.manage"
  ]

  for (const role of otherRoles) {
    for (const permission of managementPermissions) {
      assert.equal(
        roleHasPortalPermission(role, permission),
        false,
        `Role ${role} must not have management permission ${permission}`
      )
    }
  }
})

void test("portal-access: Deny by default", () => {
  // Unknown role
  assert.equal(roleHasPortalPermission("unknown_role", "dashboard.view"), false)
  // Unknown permission
  assert.equal(roleHasPortalPermission("super_admin_pc", "unknown.permission"), false)
  // Inactive account denies module entry (hasEffectiveModuleEntry)
  assert.equal(hasEffectiveModuleEntry("super_admin_pc", false, "gorut", true), false)
  assert.equal(hasEffectiveModuleEntry("admin_pc", false, "gorut", true), false)
})

void test("portal-access: Module entry rules", () => {
  // Super Admin may enter registered GORUT without explicit grant
  assert.equal(hasEffectiveModuleEntry("super_admin_pc", true, "gorut", false), true)
  assert.equal(hasEffectiveModuleEntry("super_admin_pc", true, "gorut", true), true)

  // Non-Super Admin without grant denied
  assert.equal(hasEffectiveModuleEntry("admin_pc", true, "gorut", false), false)
  assert.equal(hasEffectiveModuleEntry("admin_upzis", true, "gorut", false), false)
  assert.equal(hasEffectiveModuleEntry("admin_kordes", true, "gorut", false), false)

  // Enabled explicit GORUT grant allowed
  assert.equal(hasEffectiveModuleEntry("admin_pc", true, "gorut", true), true)
  assert.equal(hasEffectiveModuleEntry("admin_upzis", true, "gorut", true), true)
  assert.equal(hasEffectiveModuleEntry("admin_kordes", true, "gorut", true), true)

  // Disabled grant denied
  assert.equal(hasEffectiveModuleEntry("admin_pc", true, "gorut", false), false)

  // Inactive user denied
  assert.equal(hasEffectiveModuleEntry("super_admin_pc", false, "gorut", true), false)
  assert.equal(hasEffectiveModuleEntry("admin_pc", false, "gorut", true), false)

  // Unknown module key denied
  assert.equal(hasEffectiveModuleEntry("super_admin_pc", true, "unknown_module", true), false)
})

void test("portal-access: Member Area route policy", () => {
  // exact /member-area allowed for active authenticated roles
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area"), true)
  assert.equal(canAccessMemberAreaRoute("admin_pc", "/member-area"), true)
  assert.equal(canAccessMemberAreaRoute("admin_upzis", "/member-area"), true)
  assert.equal(canAccessMemberAreaRoute("admin_kordes", "/member-area"), true)
  assert.equal(canAccessMemberAreaRoute("unknown_role", "/member-area"), false)
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area/notifikasi"), true)
  assert.equal(canAccessMemberAreaRoute("admin_pc", "/member-area/notifikasi"), false)
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area/audit"), true)
  assert.equal(canAccessMemberAreaRoute("admin_pc", "/member-area/audit"), false)
  assert.equal(canAccessMemberAreaRoute("admin_upzis", "/member-area/aktivitas"), true)

  // /member-area/konten/artikel routes allow Super Admin and Admin PC
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area/konten/artikel"), true)
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area/konten/artikel/migrasi"), true)
  assert.equal(canAccessMemberAreaRoute("admin_pc", "/member-area/konten/artikel"), true)
  assert.equal(canAccessMemberAreaRoute("admin_pc", "/member-area/konten/artikel/migrasi"), true)
  assert.equal(canAccessMemberAreaRoute("admin_upzis", "/member-area/konten/artikel"), false)
  assert.equal(canAccessMemberAreaRoute("admin_kordes", "/member-area/konten/artikel/migrasi"), false)

  // /member-area/hak-akses requires access.manage (Super Admin only)
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area/hak-akses"), true)
  assert.equal(canAccessMemberAreaRoute("admin_pc", "/member-area/hak-akses"), false)
  assert.equal(canAccessMemberAreaRoute("admin_upzis", "/member-area/hak-akses"), false)

  // /member-area/pengguna requires users.manage (Super Admin only)
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area/pengguna"), true)
  assert.equal(canAccessMemberAreaRoute("admin_pc", "/member-area/pengguna"), false)
  assert.equal(canAccessMemberAreaRoute("admin_upzis", "/member-area/pengguna"), false)

  // non-article content routes remain Super Admin-only (meaning require respective permissions like homepage.manage)
  // Let's check a non-article route /member-area/konten/beranda
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area/konten/beranda"), true)
  assert.equal(canAccessMemberAreaRoute("admin_pc", "/member-area/konten/beranda"), false)

  // unknown protected /member-area/** route denied
  assert.equal(canAccessMemberAreaRoute("super_admin_pc", "/member-area/random-route"), false)
})
