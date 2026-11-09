import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Native Node tests require the TypeScript extension.
import { entryRoles, loadEntryRoles, resolveEntryDestination } from "./entry-access.ts"
// @ts-expect-error Native Node tests require the TypeScript extension.
import { invalidateActorSession } from "../../services/api/actor-session.ts"

function fetchWith(...responses: Array<{ status?: number; body?: unknown }>) {
  const paths: string[] = []
  const fetcher = (async (path, init) => {
    paths.push(String(path))
    assert.equal(init?.credentials, "include")
    assert.equal(init?.cache, "no-store")
    assert(init?.signal)
    const next = responses.shift()
    assert(next, "Unexpected request")
    return new Response(JSON.stringify(next.body ?? {}), { status: next.status ?? 200 })
  }) as typeof fetch
  return { paths, fetcher }
}
const signal = () => new AbortController().signal

void test("post-login entry resolves one authorized home without a persona chooser", () => {
  for (const role of ["MUNFIQ", "PLPK", "RANTING", "UPZIS", "PC"] as const) {
    assert.equal(resolveEntryDestination([role], null), entryRoles[role].href)
  }
  assert.equal(resolveEntryDestination(["PLPK"], entryRoles.MUNFIQ.href), entryRoles.PLPK.href)
  assert.equal(resolveEntryDestination(["RANTING"], `${entryRoles.RANTING.href}/profil`), `${entryRoles.RANTING.href}/profil`)
  assert.equal(resolveEntryDestination([], entryRoles.PC.href), null)
})

void test("Munfiq requires active self identity, never operational-role guessing", async () => {
  for (const body of [{ munfiqCode: "M001", active: false }, {}, { role: "munfiq" }]) {
    const { fetcher, paths } = fetchWith({ body })
    assert.deepEqual(await loadEntryRoles({ role: "munfiq" }, signal(), fetcher), [])
    assert.deepEqual(paths, ["/api/gorut/munfiq/me"])
  }
  const { fetcher } = fetchWith({ body: { munfiqCode: "M001", active: true } })
  assert.deepEqual(await loadEntryRoles({ role: "munfiq" }, signal(), fetcher), ["MUNFIQ"])
})

void test("only the canonical server role is shown after module access succeeds", async () => {
  for (const role of ["PC", "UPZIS", "PLPK", "RANTING"] as const) {
    const { fetcher } = fetchWith({ body: { modules: [{ key: "gorut" }] } }, { body: { roleSummary: { role } } })
    assert.deepEqual(await loadEntryRoles({ role: "admin_kordes" }, signal(), fetcher), [role])
    assert(entryRoles[role].href.startsWith("/gorut-v2/"))
  }
  const { fetcher } = fetchWith({ body: { modules: [{ key: "gorut" }] } }, { body: { roleSummary: { role: "SUPER_ADMIN" } } })
  assert.deepEqual(await loadEntryRoles({ role: "super_admin_pc" }, signal(), fetcher), [])
})

void test("missing module grant and 403 fail closed, including admin accounts", async () => {
  for (const response of [{ status: 403 }, { body: { modules: [] } }]) {
    const { fetcher, paths } = fetchWith(response)
    assert.deepEqual(await loadEntryRoles({ role: "super_admin_pc" }, signal(), fetcher), [])
    assert.equal(paths.length, 1)
  }
  const { fetcher } = fetchWith({ body: { modules: [{ key: "gorut" }] } }, { status: 403 })
  assert.deepEqual(await loadEntryRoles({ role: "admin_pc" }, signal(), fetcher), [])
})

void test("expired session and failed reads remain errors rather than empty role lists", async () => {
  for (const status of [401, 500]) {
    const { fetcher } = fetchWith({ status })
    await assert.rejects(loadEntryRoles({ role: "munfiq" }, signal(), fetcher), status === 401 ? /Sesi berakhir/ : /belum dapat dimuat/)
  }
})

void test("a late role response cannot survive an actor switch", async () => {
  let release!: (response: Response) => void
  const fetcher = (() => new Promise<Response>((resolve) => { release = resolve })) as typeof fetch
  const pending = loadEntryRoles({ role: "munfiq" }, signal(), fetcher)
  invalidateActorSession()
  release(new Response(JSON.stringify({ munfiqCode: "OLD", active: true })))
  await assert.rejects(pending, { name: "AbortError" })
})
