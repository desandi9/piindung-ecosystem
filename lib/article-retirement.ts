import { listRecords } from "@/lib/record-store-server"
import { readManagedArticles } from "@/lib/article-content"

const LEGACY_SCOPE = "homepage-content"
const MAP_SCOPE = "article-migration-map"
const ARCHIVE_SCOPE = "article-legacy-archive"

export type LegacyRetirementState = "unmigrated" | "migrated_not_archived" | "invalid_or_conflicted"

export type LegacyRetirementRecord = {
  legacyRecordKey: string
  title: string
  type: string
  status: string
  retirementState: LegacyRetirementState
  issue: string
}

export type ArticleRetirementStatus = {
  fullyRetired: boolean
  activeLegacyCount: number
  migrationMapCount: number
  archiveCount: number
  unmigratedCount: number
  migratedNotArchivedCount: number
  invalidCount: number
  brokenMapCount: number
  unresolved: LegacyRetirementRecord[]
}

type StoredRecord = { key: string; data: Record<string, unknown> }
type ManagedArticle = { id: string; slug: string }

function titleOf(data: Record<string, unknown>) {
  return typeof data.title === "string" ? data.title.trim() : ""
}

function typeOf(data: Record<string, unknown>) {
  return typeof data.type === "string" ? data.type : "Unknown"
}

function statusOf(data: Record<string, unknown>) {
  return typeof data.status === "string" ? data.status : "Unknown"
}

function validMap(data: Record<string, unknown>, key: string) {
  return data.legacyScope === LEGACY_SCOPE
    && data.legacyRecordKey === key
    && typeof data.articleId === "string"
    && Boolean(data.articleId.trim())
    && typeof data.articleSlug === "string"
    && Boolean(data.articleSlug.trim())
}

export function calculateArticleRetirementStatus(legacyRecords: StoredRecord[], maps: StoredRecord[], archives: StoredRecord[], managedArticles: ManagedArticle[]): ArticleRetirementStatus {
  const articleById = new Map(managedArticles.map((article: ManagedArticle) => [article.id, article]))
  const mapsByKey = new Map<string, StoredRecord[]>()
  for (const map of maps) mapsByKey.set(map.key, [...(mapsByKey.get(map.key) ?? []), map])
  const archiveKeys = new Set(archives.map((record) => record.key))
  const isUsableMap = (record: StoredRecord) => {
    const data = record.data
    if (!validMap(data, record.key)) return false
    const article = articleById.get(data.articleId as string)
    return Boolean(article && article.slug === data.articleSlug)
  }
  const brokenMapCount = maps.filter((record) => !isUsableMap(record)).length
  const unresolved: LegacyRetirementRecord[] = []
  let unmigratedCount = 0
  let migratedNotArchivedCount = 0
  let invalidCount = 0

  const activeLegacyArticles = legacyRecords.filter((record) => typeOf(record.data) === "Artikel" || typeOf(record.data) === "Berita")
  for (const record of activeLegacyArticles) {
    const mapsForLegacy = mapsByKey.get(record.key) ?? []
    const map = mapsForLegacy[0]
    const mapIsValid = mapsForLegacy.length === 1 && Boolean(map && isUsableMap(map))
    let state: LegacyRetirementState
    let issue: string

    if (mapsForLegacy.length === 0) {
      state = "unmigrated"
      issue = "Belum memiliki migration map."
      unmigratedCount += 1
    } else if (!mapIsValid) {
      state = "invalid_or_conflicted"
      issue = mapsForLegacy.length > 1
        ? "Ditemukan lebih dari satu migration map untuk legacy key ini."
        : !map || !validMap(map.data, record.key)
          ? "Migration map tidak valid."
          : !articleById.get(String(map.data.articleId))
            ? "Artikel terkelola tidak ditemukan."
            : "Slug migration map tidak cocok dengan artikel terkelola."
      invalidCount += 1
    } else if (!archiveKeys.has(record.key)) {
      state = "migrated_not_archived"
      issue = "Sudah dimigrasikan, tetapi belum diarsipkan."
      migratedNotArchivedCount += 1
    } else {
      continue
    }

    unresolved.push({ legacyRecordKey: record.key, title: titleOf(record.data), type: typeOf(record.data), status: statusOf(record.data), retirementState: state, issue })
  }

  const activeLegacyCount = activeLegacyArticles.length
  return {
    fullyRetired: activeLegacyCount === 0 && brokenMapCount === 0,
    activeLegacyCount,
    migrationMapCount: maps.length,
    archiveCount: archives.length,
    unmigratedCount,
    migratedNotArchivedCount,
    invalidCount,
    brokenMapCount,
    unresolved,
  }
}

export async function getArticleRetirementStatus(): Promise<ArticleRetirementStatus> {
  const [legacyRecords, maps, archives, managedArticles] = await Promise.all([
    listRecords(LEGACY_SCOPE) as Promise<StoredRecord[]>,
    listRecords(MAP_SCOPE) as Promise<StoredRecord[]>,
    listRecords(ARCHIVE_SCOPE) as Promise<StoredRecord[]>,
    readManagedArticles(),
  ])

  return calculateArticleRetirementStatus(legacyRecords, maps, archives, managedArticles)
}
