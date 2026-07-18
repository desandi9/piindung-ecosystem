import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { ARTICLE_SCOPE } from "@/lib/article-content"
import { requireArticleManager } from "@/lib/article-content-api"
import { isValidStoredArticle } from "@/lib/article-content-rules"
import { getPrismaClient } from "@/lib/prisma"

const LEGACY_SCOPE = "homepage-content"
const MAP_SCOPE = "article-migration-map"
const ARCHIVE_SCOPE = "article-legacy-archive"
const CONFIRMATION = "ARSIPKAN KONTEN LAMA"

type ArchiveStatus = "archived" | "already_archived" | "not_migrated" | "missing_article" | "invalid_map" | "missing_legacy_record" | "failed"
type ArchiveResult = { legacyRecordKey: string; status: ArchiveStatus; articleId?: string; articleSlug?: string; reason?: string }
type RecordRow = { key: string; data: Record<string, unknown>; createdAt: Date; updatedAt: Date }

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function isMigrationMap(value: Record<string, unknown>, key: string) {
  return value.legacyScope === LEGACY_SCOPE
    && value.legacyRecordKey === key
    && typeof value.articleId === "string"
    && Boolean(value.articleId.trim())
    && typeof value.articleSlug === "string"
    && Boolean(value.articleSlug.trim())
}

export async function POST(request: Request) {
  try {
    const access = await requireArticleManager()
    if (access.response) return access.response

    const body = await request.json().catch(() => null) as { legacyRecordKeys?: unknown; confirm?: unknown; confirmationPhrase?: unknown } | null
    if (!body || !Array.isArray(body.legacyRecordKeys) || body.confirm !== true || body.confirmationPhrase !== CONFIRMATION) {
      return invalid("Konfirmasi arsip tidak valid.")
    }
    const keys = [...new Set(body.legacyRecordKeys.filter((key): key is string => typeof key === "string" && key.trim().length > 0).map((key) => key.trim()))]
    if (keys.length === 0 || keys.length > 50) return invalid("Jumlah konten terpilih tidak valid.")

    const prisma = getPrismaClient()
    const results: ArchiveResult[] = []

    for (const legacyRecordKey of keys) {
      try {
        const result = await prisma.$transaction(async (transaction): Promise<ArchiveResult> => {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ARCHIVE_SCOPE + ":mutations"}))`

          const archiveRows = await transaction.$queryRaw<Array<{ data: Record<string, unknown> }>>`
            SELECT data FROM "AppRecord" WHERE scope = ${ARCHIVE_SCOPE} AND key = ${legacyRecordKey} LIMIT 1
          `
          if (archiveRows.length > 0) return { legacyRecordKey, status: "already_archived", articleId: String(archiveRows[0].data.articleId ?? ""), articleSlug: String(archiveRows[0].data.articleSlug ?? ""), reason: "Konten lama sudah berada di arsip." }

          const legacyRows = await transaction.$queryRaw<RecordRow[]>`
            SELECT key, data, "createdAt", "updatedAt" FROM "AppRecord" WHERE scope = ${LEGACY_SCOPE} AND key = ${legacyRecordKey} LIMIT 1
          `
          const legacy = legacyRows[0]
          if (!legacy) return { legacyRecordKey, status: "missing_legacy_record", reason: "Legacy record sudah tidak ada di homepage-content." }
          if (legacy.data.type !== "Artikel" && legacy.data.type !== "Berita") return { legacyRecordKey, status: "failed", reason: "Record bukan Artikel/Berita." }

          const mapRows = await transaction.$queryRaw<Array<{ data: Record<string, unknown> }>>`
            SELECT data FROM "AppRecord" WHERE scope = ${MAP_SCOPE} AND key = ${legacyRecordKey} LIMIT 1
          `
          const map = mapRows[0]?.data
          if (!map) return { legacyRecordKey, status: "not_migrated", reason: "Migration map belum ada." }
          if (!isMigrationMap(map, legacyRecordKey)) return { legacyRecordKey, status: "invalid_map", reason: "Migration map tidak valid." }

          const articleId = String(map.articleId)
          const articleSlug = String(map.articleSlug)
          const articleRows = await transaction.$queryRaw<Array<{ data: Record<string, unknown> }>>`
            SELECT data FROM "AppRecord" WHERE scope = ${ARTICLE_SCOPE} AND key = ${articleId} LIMIT 1
          `
          const article = articleRows[0]?.data
          if (!article || !isValidStoredArticle(article)) return { legacyRecordKey, status: "missing_article", articleId, articleSlug, reason: "Artikel terkelola tidak ditemukan." }
          if (article.id !== articleId || article.slug !== articleSlug) return { legacyRecordKey, status: "invalid_map", articleId, articleSlug, reason: "Migration map tidak cocok dengan artikel terkelola." }

          const archivedAt = new Date().toISOString()
          const archiveData = {
            legacyScope: LEGACY_SCOPE,
            legacyRecordKey,
            originalRecord: {
              key: legacy.key,
              data: legacy.data,
              createdAt: legacy.createdAt.toISOString(),
              updatedAt: legacy.updatedAt.toISOString(),
            },
            articleId,
            articleSlug,
            archivedAt,
            archivedByUserId: access.user.id,
          }
          await transaction.$executeRaw`
            INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
            VALUES (${randomUUID()}, ${ARCHIVE_SCOPE}, ${legacyRecordKey}, ${JSON.stringify(archiveData)}::jsonb, NOW())
          `

          const deleted = await transaction.$executeRaw`
            DELETE FROM "AppRecord" WHERE scope = ${LEGACY_SCOPE} AND key = ${legacyRecordKey}
          `
          if (Number(deleted) !== 1) throw new Error("legacy_delete_failed")

          const auditId = randomUUID()
          const auditData = {
            id: `log-${auditId}`,
            userName: access.user.name,
            type: "Article/Banner",
            action: "legacy_article_archived",
            dateTime: archivedAt,
            device: "Server Article Archive API",
            status: "Warning",
            actorId: access.user.id,
            actorEmail: access.user.email,
            actorRole: access.user.role,
            legacyRecordKey,
            articleId,
            articleSlug,
            legacyType: legacy.data.type,
            legacyStatus: legacy.data.status,
            timestamp: archivedAt,
          }
          await transaction.$executeRaw`
            INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
            VALUES (${randomUUID()}, 'activity-log', ${`legacy-article-archived-${auditId}`}, ${JSON.stringify(auditData)}::jsonb, NOW())
          `

          return { legacyRecordKey, status: "archived", articleId, articleSlug }
        })
        results.push(result)
      } catch {
        results.push({ legacyRecordKey, status: "failed", reason: "Gagal mengarsipkan record ini." })
      }
    }

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: "Gagal menjalankan arsip konten lama." }, { status: 500 })
  }
}
