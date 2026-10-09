import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { canAccessGorutV2Path } from "../proxy.ts"

test("Munfiq mobile route is restricted to the Munfiq role", () => {
  assert.equal(canAccessGorutV2Path("munfiq", "/gorut-v2/mobile/munfiq"), true)
  assert.equal(canAccessGorutV2Path("admin_pc", "/gorut-v2/mobile/munfiq"), false)
  assert.equal(canAccessGorutV2Path("admin_upzis", "/gorut-v2/mobile/munfiq/history"), false)
})

test("existing operational GORUT v2 access remains unchanged", () => {
  assert.equal(canAccessGorutV2Path("admin_pc", "/gorut-v2/dashboard"), true)
  assert.equal(canAccessGorutV2Path("admin_kordes", "/gorut-v2/mobile/kordes"), true)
  assert.equal(canAccessGorutV2Path("munfiq", "/gorut-v2/dashboard"), false)
})
