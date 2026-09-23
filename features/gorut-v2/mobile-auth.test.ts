import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { redirectAfterMobileLogout, terminateMobileSession } from "./mobile-auth.ts"

void test("shared mobile logout uses the existing server endpoint and includes the session cookie", async () => {
  let request: { input: RequestInfo | URL; init?: RequestInit } | null = null
  await terminateMobileSession(async (input, init) => {
    request = { input, init }
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  })
  assert.deepEqual(request, { input: "/api/auth/logout", init: { method: "POST", credentials: "include" } })
})

void test("failed server logout is not treated as success", async () => {
  await assert.rejects(terminateMobileSession(async () => new Response(null, { status: 403 })), /LOGOUT_FAILED/)
})

void test("each actor returns to login with its canonical mobile next path", () => {
  const expected = {
    MUNFIQ: "/login?next=/gorut-v2/mobile/munfiq",
    PLPK: "/login?next=/gorut-v2/mobile/plpk",
    KORDES: "/login?next=/gorut-v2/mobile/kordes",
  } as const
  for (const actor of ["MUNFIQ", "PLPK", "KORDES"] as const) {
    let destination = ""
    redirectAfterMobileLogout(actor, { assign(value) { destination = String(value) } })
    assert.equal(destination, expected[actor])
  }
})
