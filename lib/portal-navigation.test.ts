import assert from "node:assert/strict"
import test from "node:test"
import { canPresentPortalModule, primaryNavigation } from "./portal-navigation"

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
