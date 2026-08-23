import assert from "node:assert/strict"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { safeRedirectPath } from "./safe-redirect.ts"

assert.equal(safeRedirectPath("/dashboard?tab=1"), "/dashboard?tab=1")
assert.equal(safeRedirectPath("/gorut-v2/mobile/munfiq"), "/gorut-v2/mobile/munfiq")
assert.equal(safeRedirectPath("/gorut-v2/mobile/plpk"), "/gorut-v2/mobile/plpk")
assert.equal(safeRedirectPath("/gorut-v2/mobile/kordes"), "/gorut-v2/mobile/kordes")
for (const value of [undefined, "https://evil.test", "//evil.test", "javascript:alert(1)", "data:text/html,test", "/\\evil", "/%2f%2fevil.test", "/%2e%2e/admin", "/api/auth/logout", "/%61pi/users"]) {
  assert.equal(safeRedirectPath(value), "/dashboard")
}
