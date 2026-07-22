import assert from "node:assert/strict"
import test from "node:test"
import { canPresentPortalModule, primaryNavigation, classifyCanonicalRoute, publicRoutes } from "./portal-navigation"
import type { AppRole } from "@/types/auth"

void test("primary navigation is exactly the four portal destinations", () => {
  assert.deepEqual(
    primaryNavigation.map(({ label, href }) => ({ label, href })),
    [
      { label: "Beranda", href: "/dashboard" },
      { label: "Member Area", href: "/member-area" },
      { label: "Bantuan", href: "/bantuan" },
      { label: "Profil", href: "/profil" },
    ]
  )
})

void test("primary navigation contains no operational or admin route", () => {
  assert.equal(primaryNavigation.some(({ href }) => href.startsWith("/admin") || href.startsWith("/gorut")), false)
})

void test("module presentation only accepts the existing GORUT route and roles", () => {
  assert.equal(canPresentPortalModule("super_admin_pc", "/gorut"), true)
  assert.equal(canPresentPortalModule("admin_pc", "/gorut"), true)
  assert.equal(canPresentPortalModule("admin_upzis", "/gorut"), true)
  assert.equal(canPresentPortalModule("admin_kordes", "/gorut"), true)
  assert.equal(canPresentPortalModule("admin_pc", "/etasyaruf"), false)
})

void test("classify public routes", () => {
  for (const route of publicRoutes) {
    assert.equal(classifyCanonicalRoute(route), "public")
  }
})

void test("classify authenticated routes across roles", () => {
  const roles: AppRole[] = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"]
  for (const role of roles) {
    assert.equal(classifyCanonicalRoute("/dashboard", role), "authenticated")
    assert.equal(classifyCanonicalRoute("/member-area", role), "authenticated")
    assert.equal(classifyCanonicalRoute("/profil", role), "authenticated")
    assert.equal(classifyCanonicalRoute("/notifikasi", role), "authenticated")
  }
})

void test("classify super-admin routes", () => {
  assert.equal(classifyCanonicalRoute("/member-area/pengguna", "super_admin_pc"), "super-admin")
  assert.equal(classifyCanonicalRoute("/member-area/pengguna", "admin_pc"), "unknown")
  assert.equal(classifyCanonicalRoute("/member-area/pengguna", "admin_upzis"), "unknown")
  assert.equal(classifyCanonicalRoute("/member-area/pengguna", "admin_kordes"), "unknown")
})

void test("classify unknown routes and legacy redirect", () => {
  assert.equal(classifyCanonicalRoute("/admin/notifikasi"), "legacy-redirect")
  assert.equal(classifyCanonicalRoute("/random-non-existent-route"), "unknown")
})

void test("classify operational routes", () => {
  assert.equal(classifyCanonicalRoute("/gorut"), "operational-boundary")
  assert.equal(classifyCanonicalRoute("/api/user-operational-scopes"), "operational-boundary")
})
