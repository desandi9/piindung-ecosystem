import assert from "node:assert/strict"
import { test } from "node:test"
import { protectHomepageContentMutation } from "./homepage-content-api"

async function responseStatus(result: Awaited<ReturnType<typeof protectHomepageContentMutation>>) {
  return result.response?.status ?? 200
}

test("protectHomepageContentMutation rejects legacy article mutations and allows Banner mutations", async () => {
  const cases: Array<{ name: string; operation: "create" | "update" | "delete"; existing?: string; incoming?: unknown; expected: number }> = [
    { name: "Artikel create rejected", operation: "create", incoming: "Artikel", expected: 410 },
    { name: "Berita create rejected", operation: "create", incoming: "Berita", expected: 410 },
    { name: "Artikel update rejected", operation: "update", existing: "Artikel", incoming: "Artikel", expected: 410 },
    { name: "Berita update rejected", operation: "update", existing: "Berita", incoming: "Berita", expected: 410 },
    { name: "Artikel delete rejected", operation: "delete", existing: "Artikel", expected: 410 },
    { name: "Berita delete rejected", operation: "delete", existing: "Berita", expected: 410 },
    { name: "Banner to Artikel rejected", operation: "update", existing: "Banner", incoming: "Artikel", expected: 410 },
    { name: "Artikel to Banner rejected", operation: "update", existing: "Artikel", incoming: "Banner", expected: 410 },
    { name: "missing type rejected", operation: "create", incoming: undefined, expected: 400 },
    { name: "unknown type rejected", operation: "create", incoming: "Popup", expected: 400 },
    { name: "malformed type rejected", operation: "create", incoming: 123, expected: 400 },
    { name: "Banner create allowed", operation: "create", incoming: "Banner", expected: 200 },
    { name: "Banner edit allowed", operation: "update", existing: "Banner", incoming: "Banner", expected: 200 },
    { name: "Banner delete allowed", operation: "delete", existing: "Banner", expected: 200 },
  ]

  for (const item of cases) {
    const key = item.existing ? `test-${item.name}` : undefined
    const result = await protectHomepageContentMutation(item.operation, key, item.incoming, item.existing ? { key: key ?? "test", data: { type: item.existing } } : undefined)
    assert.equal(await responseStatus(result), item.expected, item.name)
  }
})

test("protectHomepageContentMutation returns 404 when updating or deleting a missing record", async () => {
  assert.equal(await responseStatus(await protectHomepageContentMutation("update", "missing", "Banner", null)), 404)
  assert.equal(await responseStatus(await protectHomepageContentMutation("delete", "missing", undefined, null)), 404)
})
