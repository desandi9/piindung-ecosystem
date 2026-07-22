import assert from "node:assert/strict"
import test from "node:test"
import { isProtectedInternalRecordScope, protectedInternalRecordScopes } from "./protected-internal-scopes"

void test("protected-internal-scopes: returns true for protected scopes", () => {
  for (const scope of ["portal-module-grants", "portal-access-audit", "portal-user-audit", "portal-notification-audit"]) {
    assert.equal(isProtectedInternalRecordScope(scope), true)
  }
})

void test("protected-internal-scopes: returns false for ordinary or other scopes", () => {
  assert.equal(isProtectedInternalRecordScope("gallery-content"), false)
  assert.equal(isProtectedInternalRecordScope("system-settings"), false)
  assert.equal(isProtectedInternalRecordScope("unknown-scope"), false)
})

void test("protected-internal-scopes: set verification", () => {
  assert.equal(protectedInternalRecordScopes.size, 4)
})
