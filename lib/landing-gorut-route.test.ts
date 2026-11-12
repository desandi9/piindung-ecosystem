import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { GORUT_ANDROID_PACKAGE, GORUT_PLAY_STORE_URL, GORUT_V2_MOBILE_ENTRY, resolveLandingGorutRoute } from "./landing-gorut-route.ts"

void test("Play Store link is either absent or the official GORUT listing", () => {
  assert.equal(GORUT_ANDROID_PACKAGE, "id.or.nucare.gorut")
  if (GORUT_PLAY_STORE_URL === null) return
  const url = new URL(GORUT_PLAY_STORE_URL)
  assert.equal(url.origin, "https://play.google.com")
  assert.equal(url.pathname, "/store/apps/details")
  assert.equal(url.searchParams.get("id"), GORUT_ANDROID_PACKAGE)
})

void test("operational roles open the GORUT V2 desktop dashboard", () => {
  for (const role of ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"]) {
    assert.equal(resolveLandingGorutRoute(role), "/gorut-v2/dashboard")
  }
})

void test("field actors open their own GORUT V2 mobile space", () => {
  assert.equal(resolveLandingGorutRoute("munfiq"), "/gorut-v2/mobile/munfiq")
  assert.equal(resolveLandingGorutRoute("plpk"), "/gorut-v2/mobile/plpk")
})

void test("visitors without a session go through login with a V2 destination", () => {
  assert.equal(resolveLandingGorutRoute(null), "/login?next=%2Fgorut-v2%2Fdashboard")
  assert.equal(resolveLandingGorutRoute(undefined), "/login?next=%2Fgorut-v2%2Fdashboard")
})

void test("unknown roles fall back to the portal instead of guessing", () => {
  assert.equal(resolveLandingGorutRoute("tamu"), "/dashboard")
})

void test("no landing route ever points at legacy GORUT V1", () => {
  const roles = [null, "super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes", "munfiq", "plpk", "tamu"]
  for (const role of roles) {
    const route = decodeURIComponent(resolveLandingGorutRoute(role))
    assert.ok(!/\/gorut(?:\/|$|\?)/.test(route), `${String(role)} -> ${route}`)
  }
  assert.equal(GORUT_V2_MOBILE_ENTRY, "/gorut-v2/mobile")
})
