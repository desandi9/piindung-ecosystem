import assert from "node:assert/strict"
import test from "node:test"
import { getAuthCookieOptions, getClearAuthCookieOptions } from "./session-token"

void test("getAuthCookieOptions persistent vs session and secure flag", () => {
  const persistentProd = getAuthCookieOptions(true, true)
  assert.equal(persistentProd.httpOnly, true)
  assert.equal(persistentProd.sameSite, "lax")
  assert.equal(persistentProd.secure, true)
  assert.equal(persistentProd.path, "/")
  assert.equal(persistentProd.maxAge, 60 * 60 * 24 * 30)
  assert.equal(persistentProd.expires instanceof Date, true)

  const sessionDev = getAuthCookieOptions(false, false)
  assert.equal(sessionDev.secure, false)
  assert.equal(sessionDev.maxAge, undefined)
  assert.equal(sessionDev.expires, undefined)
})

void test("getClearAuthCookieOptions options exactly match clear contract", () => {
  const clearProd = getClearAuthCookieOptions(true)
  assert.equal(clearProd.httpOnly, true)
  assert.equal(clearProd.sameSite, "lax")
  assert.equal(clearProd.secure, true)
  assert.equal(clearProd.path, "/")
  assert.equal(clearProd.maxAge, 0)
  assert.equal(clearProd.expires?.getTime(), 0)
})
