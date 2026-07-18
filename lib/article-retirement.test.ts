import assert from "node:assert/strict"
import { test } from "node:test"
import { calculateArticleRetirementStatus } from "./article-retirement"

test("calculateArticleRetirementStatus classifies unresolved legacy articles and fully retired state", () => {
  const status = calculateArticleRetirementStatus(
    [
      { key: "legacy-1", data: { type: "Artikel", title: "Unmigrated Article", status: "Published" } },
      { key: "legacy-2", data: { type: "Berita", title: "Migrated Not Archived", status: "Published" } },
      { key: "legacy-3", data: { type: "Artikel", title: "Broken Map Target", status: "Published" } },
      { key: "legacy-4", data: { type: "Banner", title: "Homepage Banner", status: "Published" } },
    ],
    [
      { key: "legacy-2", data: { legacyScope: "homepage-content", legacyRecordKey: "legacy-2", articleId: "art-2", articleSlug: "migrated-not-archived" } },
      { key: "legacy-3", data: { legacyScope: "homepage-content", legacyRecordKey: "legacy-3", articleId: "art-missing", articleSlug: "missing-slug" } },
      { key: "orphan-map", data: { legacyScope: "homepage-content", legacyRecordKey: "orphan-map", articleId: "art-orphan", articleSlug: "orphan-slug" } },
    ],
    [{ key: "archived-old", data: {} }],
    [{ id: "art-2", slug: "migrated-not-archived" }],
  )

  assert.equal(status.activeLegacyCount, 3)
  assert.equal(status.migrationMapCount, 3)
  assert.equal(status.archiveCount, 1)
  assert.equal(status.unmigratedCount, 1)
  assert.equal(status.migratedNotArchivedCount, 1)
  assert.equal(status.invalidCount, 1)
  assert.equal(status.brokenMapCount, 2)
  assert.equal(status.fullyRetired, false)
  assert.equal(status.unresolved.find((record) => record.legacyRecordKey === "legacy-1")?.retirementState, "unmigrated")
  assert.equal(status.unresolved.find((record) => record.legacyRecordKey === "legacy-2")?.retirementState, "migrated_not_archived")
  assert.equal(status.unresolved.find((record) => record.legacyRecordKey === "legacy-3")?.retirementState, "invalid_or_conflicted")

  const fullyRetired = calculateArticleRetirementStatus(
    [{ key: "legacy-4", data: { type: "Banner", title: "Homepage Banner", status: "Published" } }],
    [{ key: "legacy-x", data: { legacyScope: "homepage-content", legacyRecordKey: "legacy-x", articleId: "art-2", articleSlug: "migrated-not-archived" } }],
    [{ key: "legacy-x", data: {} }],
    [{ id: "art-2", slug: "migrated-not-archived" }],
  )

  assert.equal(fullyRetired.activeLegacyCount, 0)
  assert.equal(fullyRetired.brokenMapCount, 0)
  assert.equal(fullyRetired.fullyRetired, true)
})
