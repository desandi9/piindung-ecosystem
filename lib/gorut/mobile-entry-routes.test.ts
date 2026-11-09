import assert from "node:assert/strict"
import { test } from "node:test"
// @ts-expect-error Native Node tests use the TypeScript extension.
import { isMobileEntryPath, safeMobileDestination, mobileLoginPath } from "./mobile-entry-routes.ts"

test("public mobile entry allowlist never opens actor pages or APIs", () => {
  for (const path of ["/gorut-v2/mobile", "/gorut-v2/mobile/login", "/gorut-v2/mobile/reset-password"]) assert.equal(isMobileEntryPath(path), true)
  for (const path of ["/gorut-v2/mobile/munfiq", "/gorut-v2/mobile/pc", "/gorut-v2/mobile/login/admin", "/api/gorut/munfiq/me"]) assert.equal(isMobileEntryPath(path), false)
})

test("mobile return targets reject external URLs, web destinations and traversal", () => {
  for (const path of ["https://example.com", "//example.com", "/login", "/admin", "/gorut-v2/mobile/login", "/gorut-v2/mobile/munfiq/../../admin", "/gorut-v2/mobile/munfiq/%2e%2e", "/gorut-v2/mobile/munfiq\\evil"]) assert.equal(safeMobileDestination(path), null)
  assert.equal(safeMobileDestination("/gorut-v2/mobile/munfiq/penjemputan"), "/gorut-v2/mobile/munfiq/penjemputan")
  assert.equal(mobileLoginPath("/gorut-v2/mobile/kordes"), "/gorut-v2/mobile/login?next=%2Fgorut-v2%2Fmobile%2Fkordes")
})
