import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { isGorutMobileDestination, resolveLoginPresentation } from "./login-presentation.ts"

void test("exact safe GORUT mobile destinations select actor-aware presentation", () => {
  const cases = [
    ["/gorut-v2/mobile/plpk", "PLPK", "PLPK"],
    ["/gorut-v2/mobile/kordes", "KORDES", "Kordes"],
    ["/gorut-v2/mobile/munfiq", "MUNFIQ", "Munfiq"],
  ] as const

  for (const [path, actorType, actorLabel] of cases) {
    const presentation = resolveLoginPresentation(path)
    assert.equal(isGorutMobileDestination(presentation.safeDestination), true)
    assert.deepEqual(presentation, { kind: "gorut-mobile", safeDestination: path, actorType, actorLabel })
  }
})

void test("normal and non-mobile destinations retain standard presentation", () => {
  assert.deepEqual(resolveLoginPresentation(undefined), { kind: "standard", safeDestination: "/dashboard" })
  assert.deepEqual(resolveLoginPresentation("/dashboard"), { kind: "standard", safeDestination: "/dashboard" })
  assert.deepEqual(resolveLoginPresentation("/gorut-v2/mobile/plpk?source=test"), {
    kind: "standard",
    safeDestination: "/gorut-v2/mobile/plpk?source=test",
  })
})

void test("unsafe next falls back before presentation selection", () => {
  for (const value of [
    "https://evil.test/gorut-v2/mobile/plpk",
    "//evil.test/gorut-v2/mobile/kordes",
    "/\\evil",
    "javascript:/gorut-v2/mobile/munfiq",
    "data:text/html,test",
    "/%2e%2e/gorut-v2/mobile/plpk",
    "/api/auth/logout",
  ]) {
    assert.deepEqual(resolveLoginPresentation(value), { kind: "standard", safeDestination: "/dashboard" })
  }
})

void test("resolved mobile destination remains exact for successful login and logout return", () => {
  for (const path of ["/gorut-v2/mobile/plpk", "/gorut-v2/mobile/kordes", "/gorut-v2/mobile/munfiq"]) {
    assert.equal(resolveLoginPresentation(path).safeDestination, path)
  }
})
