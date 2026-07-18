import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { ARTICLE_SCOPE, type Article, type ArticleContentType, type ArticleStatus } from "@/lib/article-content"
import { requireArticleManager } from "@/lib/article-content-api"
import { ARTICLE_LIMITS, generateArticleSlug, isSafeArticleImage, isValidStoredArticle, normalizeLegacyStatus } from "@/lib/article-content-rules"

const LEGACY_SCOPE = "homepage-content"
const MAP_SCOPE = "article-migration-map"

type LegacyRecord = { key: string; data: Record<string, unknown>; updatedAt: Date }
type MigrationStatus = "migrated" | "already_migrated" | "skipped_invalid" | "slug_conflict" | "failed"
type MigrationResult = { legacyRecordKey: string; title?: string; status: MigrationStatus; articleId?: string; articleSlug?: string; reason?: string }

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function legacyDate(value: unknown, fallback: Date) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return null
  return new Date(value).toISOString()
}

function buildArticleFromLegacy(record: LegacyRecord, id: string): { article: Article | null; reason?: string; legacyStatus?: string; legacyType?: string } {
  const data = record.data
  const title = typeof data.title === "string" ? data.title.trim() : ""
  const description = typeof data.description === "string" ? data.description.trim() : ""
  const subtitle = typeof data.subtitle === "string" ? data.subtitle.trim() : ""
  const image = typeof data.image === "string" ? data.image.trim() : ""
  const contentType = data.type === "Artikel" ? "artikel" : data.type === "Berita" ? "berita" : null
  const status = normalizeLegacyStatus(data.status)
  const source = description || subtitle
  const updatedAt = legacyDate(data.updatedAt, record.updatedAt)
  const order = typeof data.order === "number" && Number.isSafeInteger(data.order) && data.order > 0 ? data.order : 1

  if (!title) return { article: null, reason: "Judul legacy kosong atau tidak valid.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") }
  if (!source) return { article: null, reason: "Description/subtitle legacy kosong.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") }
  if (!contentType) return { article: null, reason: "Tipe legacy bukan Artikel atau Berita.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") }
  if (!status) return { article: null, reason: "Status legacy tidak valid.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") }
  if (title.length > ARTICLE_LIMITS.title) return { article: null, reason: "Judul legacy terlalu panjang.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") }
  if (source.length > ARTICLE_LIMITS.excerpt) return { article: null, reason: "Excerpt/body legacy terlalu panjang.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") }
  if (image && !isSafeArticleImage(image)) return { article: null, reason: "Cover legacy bukan URL aman atau path /public.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") }
  if (status === "published" && !updatedAt) return { article: null, reason: "Tanggal Published legacy tidak valid.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") }

  let slug = ""
  try { slug = generateArticleSlug(title) }
  catch { return { article: null, reason: "Slug tidak dapat dibuat dari judul legacy.", legacyStatus: String(data.status ?? ""), legacyType: String(data.type ?? "") } }

  const now = new Date().toISOString()
  return {
    legacyStatus: String(data.status ?? ""),
    legacyType: String(data.type ?? ""),
    article: {
      id,
      slug,
      title,
      excerpt: source,
      body: source,
      contentType: contentType as ArticleContentType,
      coverImage: image,
      authorName: "PIINDUNG",
      status: status as ArticleStatus,
      featured: false,
      position: order,
      publishedAt: status === "published" ? updatedAt : null,
      createdAt: now,
      updatedAt: now,
    },
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireArticleManager()
    if (access.response) return access.response

    const body = await request.json().catch(() => null) as { legacyRecordKeys?: unknown; confirm?: unknown } | null
    if (!body || !Array.isArray(body.legacyRecordKeys) || body.confirm !== true) return invalid("Pilih konten lama dan konfirmasi migrasi terlebih dahulu.")
    const keys = [...new Set(body.legacyRecordKeys.filter((key): key is string => typeof key === "string" && key.trim().length > 0).map((key) => key.trim()))]
    if (keys.length === 0 || keys.length > 50) return invalid("Jumlah konten terpilih tidak valid.")

    const prisma = getPrismaClient()
    const results: MigrationResult[] = []

    for (const legacyRecordKey of keys) {
      try {
        const result = await prisma.$transaction(async (transaction): Promise<MigrationResult> => {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${MAP_SCOPE + ":mutations"}))`

          const mapRecords = await transaction.$queryRaw<Array<{ data: Record<string, unknown> }>>`
            SELECT data FROM "AppRecord" WHERE scope = ${MAP_SCOPE} AND key = ${legacyRecordKey} LIMIT 1
          `
          if (mapRecords.length > 0) return { legacyRecordKey, status: "already_migrated", articleId: String(mapRecords[0].data.articleId ?? ""), articleSlug: String(mapRecords[0].data.articleSlug ?? ""), reason: "Konten lama sudah memiliki migration map." }

          const records = await transaction.$queryRaw<LegacyRecord[]>`
            SELECT key, data, "updatedAt" FROM "AppRecord" WHERE scope = ${LEGACY_SCOPE} AND key = ${legacyRecordKey} LIMIT 1
          `
          const legacy = records[0]
          if (!legacy) return { legacyRecordKey, status: "skipped_invalid", reason: "Legacy record tidak ditemukan." }

          const legacySiblings = await transaction.$queryRaw<LegacyRecord[]>`
            SELECT key, data, "updatedAt" FROM "AppRecord" WHERE scope = ${LEGACY_SCOPE}
          `
          const legacySlugs = new Map<string, number>()
          for (const sibling of legacySiblings.filter((item) => item.data.type === "Artikel" || item.data.type === "Berita")) {
            const title = typeof sibling.data.title === "string" ? sibling.data.title.trim() : ""
            if (!title) continue
            try {
              const slug = generateArticleSlug(title)
              legacySlugs.set(slug, (legacySlugs.get(slug) ?? 0) + 1)
            } catch {}
          }

          const articleId = randomUUID()
          const built = buildArticleFromLegacy(legacy, articleId)
          if (!built.article) return { legacyRecordKey, title: typeof legacy.data.title === "string" ? legacy.data.title : undefined, status: "skipped_invalid", reason: built.reason }
          if ((legacySlugs.get(built.article.slug) ?? 0) > 1) return { legacyRecordKey, title: built.article.title, status: "slug_conflict", reason: "Slug hasil migrasi duplikat di legacy records.", articleSlug: built.article.slug }

          const existingArticles = await transaction.$queryRaw<Array<{ data: Record<string, unknown> }>>`
            SELECT data FROM "AppRecord" WHERE scope = ${ARTICLE_SCOPE}
          `
          const articles = existingArticles.map((record) => record.data).filter(isValidStoredArticle)
          if (articles.some((article) => article.slug === built.article?.slug)) return { legacyRecordKey, title: built.article.title, status: "slug_conflict", reason: "Slug sudah digunakan oleh artikel terkelola.", articleSlug: built.article.slug }

          await transaction.$executeRaw`
            INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
            VALUES (${randomUUID()}, ${ARTICLE_SCOPE}, ${built.article.id}, ${JSON.stringify(built.article)}::jsonb, NOW())
          `

          const migratedAt = new Date().toISOString()
          const mapData = { legacyScope: LEGACY_SCOPE, legacyRecordKey, articleId: built.article.id, articleSlug: built.article.slug, migratedAt, migratedByUserId: access.user.id }
          await transaction.$executeRaw`
            INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
            VALUES (${randomUUID()}, ${MAP_SCOPE}, ${legacyRecordKey}, ${JSON.stringify(mapData)}::jsonb, NOW())
          `

          const auditId = randomUUID()
          const auditData = {
            id: `log-${auditId}`,
            userName: access.user.name,
            type: "Article/Banner",
            action: "legacy_article_migrated",
            dateTime: migratedAt,
            device: "Server Article Migration API",
            status: "Success",
            actorId: access.user.id,
            actorEmail: access.user.email,
            actorRole: access.user.role,
            legacyRecordKey,
            articleId: built.article.id,
            articleSlug: built.article.slug,
            legacyType: built.legacyType,
            legacyStatus: built.legacyStatus,
            timestamp: migratedAt,
          }
          await transaction.$executeRaw`
            INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
            VALUES (${randomUUID()}, 'activity-log', ${`legacy-article-migrated-${auditId}`}, ${JSON.stringify(auditData)}::jsonb, NOW())
          `

          return { legacyRecordKey, title: built.article.title, status: "migrated", articleId: built.article.id, articleSlug: built.article.slug }
        })
        results.push(result)
      } catch {
        results.push({ legacyRecordKey, status: "failed", reason: "Gagal menyimpan migrasi untuk record ini." })
      }
    }

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: "Gagal menjalankan migrasi." }, { status: 500 })
  }
}
