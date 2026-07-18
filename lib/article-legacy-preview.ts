import { listRecords } from "@/lib/record-store-server"
import type { ArticleContentType, ArticleStatus } from "@/lib/article-content"
import { ARTICLE_LIMITS, generateArticleSlug, isSafeArticleImage, normalizeLegacyStatus } from "@/lib/article-content-rules"

export const LEGACY_ARTICLE_SOURCE_SCOPE = "homepage-content"
export const LEGACY_CONTENT_SECURITY_NOTE = "Legacy homepage-content records remain stored for migration, but generic public reads are protected and public homepage rendering uses a validated projection."

type LegacyRecord = {
  key: string
  data: Record<string, unknown>
  updatedAt: Date
}

export type LegacyArticlePreviewItem = {
  legacyReference: string
  slug: string | null
  article: {
    title: string
    excerpt: string
    body: string
    contentType: ArticleContentType
    coverImage: string
    authorName: string
    status: ArticleStatus
    featured: false
    position: number
    publishedAt: string | null
    updatedAt: string
  } | null
  issues: string[]
}

export type LegacyArticleMigrationPreview = {
  sourceScope: string
  candidates: LegacyArticlePreviewItem[]
  duplicateSlugs: string[]
  invalidCount: number
  writesPerformed: false
}

function legacyDate(value: unknown, fallback: Date) {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString()
  return fallback.toISOString()
}

function previewLegacyRecord(record: LegacyRecord, position: number): LegacyArticlePreviewItem {
  const data = record.data
  const issues: string[] = []
  const title = typeof data.title === "string" ? data.title.trim() : ""
  const description = typeof data.description === "string" ? data.description.trim() : ""
  const subtitle = typeof data.subtitle === "string" ? data.subtitle.trim() : ""
  const image = typeof data.image === "string" ? data.image.trim() : ""
  const contentType = data.type === "Artikel" ? "artikel" : data.type === "Berita" ? "berita" : null
  const status = normalizeLegacyStatus(data.status)
  const updatedAt = legacyDate(data.updatedAt, record.updatedAt)
  const publishedAt = status === "published" ? updatedAt : null

  if (!title) issues.push("Judul legacy kosong atau tidak valid.")
  if (!description && !subtitle) issues.push("Excerpt/body legacy kosong.")
  if (!contentType) issues.push("Tipe legacy bukan Artikel atau Berita.")
  if (!status) issues.push("Status legacy tidak dikenal.")
  if (data.updatedAt !== undefined && (typeof data.updatedAt !== "string" || Number.isNaN(Date.parse(data.updatedAt)))) {
    issues.push("Tanggal legacy tidak dapat diparse; metadata AppRecord digunakan sebagai fallback.")
  }
  if (typeof data.image !== "undefined" && typeof data.image !== "string") issues.push("Cover legacy bukan teks.")
  if (image && !isSafeArticleImage(image)) issues.push("Cover legacy bukan URL aman atau path /public.")
  if (title.length > ARTICLE_LIMITS.title) issues.push("Judul legacy terlalu panjang.")
  if ((description || subtitle).length > ARTICLE_LIMITS.excerpt) issues.push("Excerpt legacy terlalu panjang.")

  let slug: string | null = null
  if (title) {
    try {
      slug = generateArticleSlug(title)
    } catch {
      issues.push("Slug tidak dapat dibuat dari judul legacy.")
    }
  }

  if (issues.length > 0 || !contentType || !status || !slug) {
    return { legacyReference: record.key, slug, article: null, issues }
  }

  return {
    legacyReference: record.key,
    slug,
    article: {
      title,
      excerpt: description || subtitle,
      body: description || subtitle,
      contentType,
      coverImage: image,
      authorName: "",
      status,
      featured: false,
      position,
      publishedAt,
      updatedAt,
    },
    issues,
  }
}

export async function previewLegacyArticleMigration(): Promise<LegacyArticleMigrationPreview> {
  const records = await listRecords(LEGACY_ARTICLE_SOURCE_SCOPE) as LegacyRecord[]
  const candidates = records
    .filter((record) => record.data.type === "Artikel" || record.data.type === "Berita")
    .map((record, index) => previewLegacyRecord(record, index + 1))
  const slugCounts = new Map<string, number>()
  for (const candidate of candidates) {
    if (candidate.slug) slugCounts.set(candidate.slug, (slugCounts.get(candidate.slug) ?? 0) + 1)
  }
  const duplicateSlugs = [...slugCounts.entries()].filter(([, count]) => count > 1).map(([slug]) => slug)
  for (const candidate of candidates) {
    if (candidate.slug && duplicateSlugs.includes(candidate.slug)) candidate.issues.push("Slug hasil migrasi duplikat.")
  }

  return {
    sourceScope: LEGACY_ARTICLE_SOURCE_SCOPE,
    candidates,
    duplicateSlugs,
    invalidCount: candidates.filter((candidate) => candidate.article === null || candidate.issues.length > 0).length,
    writesPerformed: false,
  }
}
