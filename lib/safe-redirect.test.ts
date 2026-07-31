import assert from "node:assert/strict"
import { safeRedirectPath } from "./safe-redirect"

assert.equal(safeRedirectPath("/dashboard?tab=1"), "/dashboard?tab=1")
for (const value of [undefined, "https://evil.test", "//evil.test", "/\\evil", "/%2e%2e/admin", "/api/auth/logout", "/%61pi/users"]) {
  assert.equal(safeRedirectPath(value), "/dashboard")
}
