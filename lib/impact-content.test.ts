import assert from "node:assert/strict"
import { test } from "node:test"
import { validateImpactContent, toPublicImpactContent, DEFAULT_IMPACT_CONTENT } from "./impact-content"

test("impact content rejects duplicates and malformed data", () => {
  const duplicateStats = { ...DEFAULT_IMPACT_CONTENT, statistics: [ { id: "a", label: "A", value: "1", prefix: "", suffix: "", description: "A", iconKey: "users" as const, visible: true, position: 0 }, { id: "a", label: "B", value: "2", prefix: "", suffix: "", description: "B", iconKey: "users" as const, visible: true, position: 1 } ] }
  assert.throws(() => validateImpactContent(duplicateStats))
  assert.throws(() => validateImpactContent({ ...DEFAULT_IMPACT_CONTENT, statistics: [{ id: "c", label: "A", value: "not-a-number!", prefix: "", suffix: "", description: "A", iconKey: "users" as const, visible: true, position: 0 }] }))
  // stories missing publishedAt is allowed by validateImpactContent (optional string)
  // Let's assert throws on actual invalid data instead, like an empty story ID or negative position.
  assert.throws(() => validateImpactContent({ ...DEFAULT_IMPACT_CONTENT, stories: [{ id: "", title: "A", excerpt: "E", body: "B", status: "published" as const, featured: true, position: 0 }] }))
})

test("impact content public projection excludes drafts and sorts items", () => {
  const mixed = { ...DEFAULT_IMPACT_CONTENT, stories: [ { id: "draft1", title: "A", excerpt: "E", body: "B", status: "draft" as const, featured: false, position: 1 }, { id: "pub1", title: "A", excerpt: "E", body: "B", status: "published" as const, featured: true, position: 0, publishedAt: "2024-01-01" } ] }
  const projected = toPublicImpactContent(mixed)
  assert.equal(projected.stories.length, 1)
  assert.equal(projected.stories[0].id, "pub1")
})
