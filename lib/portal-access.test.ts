import assert from "node:assert/strict"
import test from "node:test"
import {
  canAccessPortalAccessApiRoute,
  roleHasPortalPermission,
  hasEffectiveModuleEntry,
  canAccessLandingPageRoute,
  resolveEffectivePortalModules,
} from "./portal-access"

void test("portal-access: Basic permissions", () => {
  const roles = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"] as const
  const basicPermissions = [
    "portal.access",
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

void test("portal-access: Munfiq has only the minimal self-service capability set", () => {
  for (const permission of ["portal.access", "profile.view", "notifications.view", "munfiq.transparency.own.view"] as const) {
    assert.equal(roleHasPortalPermission("munfiq", permission), true)
  }
  for (const permission of ["dashboard.view", "member_area.view", "help.view", "modules.gorut.enter", "users.manage", "notifications.manage", "munfiq.account_links.manage"] as const) {
    assert.equal(roleHasPortalPermission("munfiq", permission), false)
  }
  assert.equal(roleHasPortalPermission("super_admin_pc", "munfiq.account_links.manage"), true)
  assert.equal(roleHasPortalPermission("admin_pc", "munfiq.account_links.manage"), false)
  assert.equal(roleHasPortalPermission("admin_upzis", "munfiq.account_links.manage"), false)
  assert.equal(roleHasPortalPermission("admin_kordes", "munfiq.account_links.manage"), false)
  assert.equal(hasEffectiveModuleEntry("munfiq", true, "gorut", true), false)
  assert.deepEqual(resolveEffectivePortalModules("munfiq", true, [{ moduleKey: "gorut", enabled: true }]), [])
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

void test("portal-access proxy: authenticated users may self-read exact GET /me", () => {
  for (const role of ["admin_upzis", "admin_kordes", "admin_pc", "super_admin_pc", "munfiq"] as const) {
    assert.equal(canAccessPortalAccessApiRoute(role, "GET", "/api/portal-access/me"), true)
  }
})

void test("portal-access proxy: unauthenticated and unknown users cannot read /me", () => {
  assert.equal(canAccessPortalAccessApiRoute(null, "GET", "/api/portal-access/me"), false)
  assert.equal(canAccessPortalAccessApiRoute(undefined, "GET", "/api/portal-access/me"), false)
  assert.equal(canAccessPortalAccessApiRoute("unknown_role", "GET", "/api/portal-access/me"), false)
})

void test("portal-access proxy: non-super-admin management access stays denied", () => {
  assert.equal(canAccessPortalAccessApiRoute("admin_upzis", "GET", "/api/portal-access/grants"), false)

  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.equal(canAccessPortalAccessApiRoute("admin_upzis", method, "/api/portal-access/grants"), false)
    assert.equal(canAccessPortalAccessApiRoute("admin_upzis", method, "/api/portal-access/me"), false)
  }

  assert.equal(canAccessPortalAccessApiRoute("admin_upzis", "GET", "/api/portal-access/me/other"), false)
})

void test("portal-access proxy: super admin management access stays allowed", () => {
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    assert.equal(canAccessPortalAccessApiRoute("super_admin_pc", method, "/api/portal-access/grants"), true)
  }
})

void test("portal-access /me: enabled GORUT grant appears only for its effective user", () => {
  const fixtureGrant = [{ moduleKey: "gorut", enabled: true }]
  assert.deepEqual(resolveEffectivePortalModules("admin_upzis", true, fixtureGrant).map((module) => module.key), ["gorut"])
  assert.deepEqual(resolveEffectivePortalModules("admin_upzis", true, [{ moduleKey: "gorut", enabled: false }]), [])
  assert.deepEqual(resolveEffectivePortalModules("admin_upzis", false, fixtureGrant), [])
})

void test("portal-access: landing page route policy", () => {
  // hub + artikel routes allow Super Admin and Admin PC
  assert.equal(canAccessLandingPageRoute("super_admin_pc", "/dashboard/landing-page"), true)
  assert.equal(canAccessLandingPageRoute("super_admin_pc", "/dashboard/landing-page/artikel"), true)
  assert.equal(canAccessLandingPageRoute("super_admin_pc", "/dashboard/landing-page/artikel/migrasi"), true)
  assert.equal(canAccessLandingPageRoute("admin_pc", "/dashboard/landing-page/artikel"), true)
  assert.equal(canAccessLandingPageRoute("admin_pc", "/dashboard/landing-page/artikel/migrasi"), true)
  assert.equal(canAccessLandingPageRoute("admin_upzis", "/dashboard/landing-page/artikel"), false)
  assert.equal(canAccessLandingPageRoute("admin_kordes", "/dashboard/landing-page/artikel/migrasi"), false)

  // non-article content routes remain Super Admin-only
  assert.equal(canAccessLandingPageRoute("super_admin_pc", "/dashboard/landing-page/beranda"), true)
  assert.equal(canAccessLandingPageRoute("admin_pc", "/dashboard/landing-page/beranda"), false)
  assert.equal(canAccessLandingPageRoute("super_admin_pc", "/dashboard/landing-page/pengaturan"), true)
  assert.equal(canAccessLandingPageRoute("admin_pc", "/dashboard/landing-page/pengaturan"), false)

  // unknown protected /dashboard/landing-page/** route denied
  assert.equal(canAccessLandingPageRoute("super_admin_pc", "/dashboard/landing-page/random-route"), false)
})
