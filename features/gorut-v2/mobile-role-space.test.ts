import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Native Node tests require the TypeScript extension.
import { resolveSwitchableOperationalPersona } from "./mobile-role-space.ts"
// @ts-expect-error Native Node tests require the TypeScript extension.
import { beginMobileRoleSpaceTransition } from "./mobile-role-transition.ts"
// @ts-expect-error Native Node tests require the TypeScript extension.
import { runActorRequest } from "../../services/api/actor-session.ts"

void test("only Kordes, UPZIS, and PC receive an authorized return persona", () => {
  assert.deepEqual(resolveSwitchableOperationalPersona("RANTING"), { role: "KORDES", label: "Kordes", href: "/gorut-v2/mobile/kordes" })
  assert.deepEqual(resolveSwitchableOperationalPersona("UPZIS"), { role: "UPZIS", label: "UPZIS", href: "/gorut-v2/mobile/upzis" })
  assert.deepEqual(resolveSwitchableOperationalPersona("PC"), { role: "PC", label: "PC", href: "/gorut-v2/mobile/pc" })
  assert.equal(resolveSwitchableOperationalPersona("PLPK"), null)
})

void test("a role-space transition aborts stale responses from the previous presentation", async () => {
  let release!: () => void
  const pending = runActorRequest(async () => {
    await new Promise<void>((resolve) => { release = resolve })
    return "stale operational data"
  })
  const rejected = assert.rejects(pending, { name: "AbortError" })
  beginMobileRoleSpaceTransition()
  release()
  await rejected
})
