import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { isGorutMobileDestination, resolveAuthenticatedLoginDestination, resolveLoginPresentation, resolvePostLoginNavigation, shouldPrefetchPostLoginDestination } from "./login-presentation.ts"

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
    const presentation = resolveLoginPresentation(path)
    assert.equal(presentation.safeDestination, path)
    assert.deepEqual(resolvePostLoginNavigation(presentation), {
      destination: path,
      method: "replace",
      showDashboardTransition: false,
    })
    assert.notEqual(resolvePostLoginNavigation(presentation).destination, "/gorut-v2/dashboard")
  }
})

void test("standard login keeps its existing dashboard transition and push navigation", () => {
  const presentation = resolveLoginPresentation(undefined)
  assert.deepEqual(resolvePostLoginNavigation(presentation), {
    destination: "/dashboard",
    method: "push",
    showDashboardTransition: true,
  })
})

void test("protected mobile destinations are not prefetched before authentication", () => {
  assert.equal(shouldPrefetchPostLoginDestination(resolveLoginPresentation("/gorut-v2/mobile/plpk")), false)
  assert.equal(shouldPrefetchPostLoginDestination(resolveLoginPresentation("/dashboard")), true)
})

void test("authenticated login proxy preserves only exact safe GORUT mobile intent", () => {
  for (const path of ["/gorut-v2/mobile/plpk", "/gorut-v2/mobile/kordes", "/gorut-v2/mobile/munfiq"]) {
    assert.equal(resolveAuthenticatedLoginDestination(path, "/dashboard"), path)
  }

  for (const value of [undefined, "/dashboard", "/gorut-v2/dashboard", "https://evil.test/gorut-v2/mobile/plpk", "//evil.test"]) {
    assert.equal(resolveAuthenticatedLoginDestination(value, "/dashboard"), "/dashboard")
  }
})
