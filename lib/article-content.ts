import { randomUUID } from "crypto"
import { getPrismaClient } from "@/lib/prisma"
import { listRecords } from "@/lib/record-store-server"
import {
  ArticleConflictError,
  ArticleNotFoundError,
  generateArticleSlug,
  isValidStoredArticle,
  validateArticleMutationInput,
  type ArticleMutationInput,
} from "@/lib/article-content-rules"

export const ARTICLE_SCOPE = "articles"

export type ArticleContentType = "artikel" | "berita"
export type ArticleStatus = "draft" | "published" | "unpublished"

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  contentType: ArticleContentType
  coverImage: string
  authorName: string
  status: ArticleStatus
  featured: boolean
  position: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PublicArticle = Pick<Article, "id" | "slug" | "title" | "excerpt" | "body" | "contentType" | "coverImage" | "authorName" | "featured" | "publishedAt" | "updatedAt">

type StoredRecord = {
  id: string
  scope: string
  key: string
  data: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

function articleFromRecord(record: StoredRecord) {
  return isValidStoredArticle(record.data) ? record.data : null
}

function sortDate(value: string | null) {
  return value ? Date.parse(value) : 0
}

export function sortArticles(articles: Article[]) {
  return [...articles].sort((first, second) => {
    if (first.featured !== second.featured) return first.featured ? -1 : 1
    if (first.position !== second.position) return first.position - second.position
    const publishedDifference = sortDate(second.publishedAt) - sortDate(first.publishedAt)
    if (publishedDifference !== 0) return publishedDifference
    const updatedDifference = Date.parse(second.updatedAt) - Date.parse(first.updatedAt)
    if (updatedDifference !== 0) return updatedDifference
    return first.id.localeCompare(second.id)
  })
}

function toPublicArticle(article: Article): PublicArticle {
  const { id, slug, title, excerpt, body, contentType, coverImage, authorName, featured, publishedAt, updatedAt } = article
  return { id, slug, title, excerpt, body, contentType, coverImage, authorName, featured, publishedAt, updatedAt }
}

function nowIso() {
  return new Date().toISOString()
}

function dataForStorage(article: Article) {
  return article as unknown as Record<string, unknown>
}

async function getArticleRecords() {
  return listRecords(ARTICLE_SCOPE) as Promise<StoredRecord[]>
}

function ensureUniqueSlug(articles: Article[], slug: string, ignoredId?: string) {
  if (articles.some((article) => article.slug === slug && article.id !== ignoredId)) {
    throw new ArticleConflictError("Slug artikel sudah digunakan.")
  }
}

function buildArticle(input: ArticleMutationInput, existing: Article | null, articles: Article[], id: string): Article {
  const timestamp = nowIso()
  const status = (input.status ?? existing?.status) as ArticleStatus
  const requestedPublishedAt = input.publishedAt !== undefined ? input.publishedAt : existing?.publishedAt
  const publishedAt = status === "published" ? requestedPublishedAt ?? timestamp : requestedPublishedAt ?? null

  return {
    id,
    slug: input.slug ?? existing?.slug ?? generateArticleSlug(input.title ?? ""),
    title: input.title ?? existing?.title ?? "",
    excerpt: input.excerpt ?? existing?.excerpt ?? "",
    body: input.body ?? existing?.body ?? "",
    contentType: input.contentType ?? existing?.contentType ?? "artikel",
    coverImage: input.coverImage ?? existing?.coverImage ?? "",
    authorName: input.authorName ?? existing?.authorName ?? "",
    status,
    featured: input.featured ?? existing?.featured ?? false,
    position: input.position ?? existing?.position ?? Math.max(0, ...articles.map((article) => article.position)) + 1,
    publishedAt,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

async function persistArticle(article: Article, mode: "create" | "update", previousId?: string) {
  const prisma = getPrismaClient()
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ARTICLE_SCOPE + ":mutations"}))`
    const records = await transaction.$queryRaw<StoredRecord[]>`
      SELECT id, scope, key, data, "createdAt", "updatedAt"
      FROM "AppRecord"
      WHERE scope = ${ARTICLE_SCOPE}
      ORDER BY "updatedAt" DESC
    `
    const articles = records.map(articleFromRecord).filter((value): value is Article => value !== null)
    ensureUniqueSlug(articles, article.slug, previousId)

    if (article.featured) {
      const previousFeatured = articles.filter((item) => item.featured && item.id !== article.id)
      for (const previous of previousFeatured) {
        const next = { ...previous, featured: false, updatedAt: article.updatedAt }
        await transaction.$executeRaw`
          UPDATE "AppRecord"
          SET data = ${JSON.stringify(dataForStorage(next))}::jsonb, "updatedAt" = NOW()
          WHERE scope = ${ARTICLE_SCOPE} AND key = ${previous.id}
        `
      }
    }

    if (mode === "create") {
      await transaction.$executeRaw`
        INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
        VALUES (${randomUUID()}, ${ARTICLE_SCOPE}, ${article.id}, ${JSON.stringify(dataForStorage(article))}::jsonb, NOW())
      `
    } else {
      const result = await transaction.$executeRaw`
        UPDATE "AppRecord"
        SET data = ${JSON.stringify(dataForStorage(article))}::jsonb, "updatedAt" = NOW()
        WHERE scope = ${ARTICLE_SCOPE} AND key = ${article.id}
      `
      if (Number(result) !== 1) throw new ArticleNotFoundError()
    }

    return article
  })
}

export async function readManagedArticles() {
  const records = await getArticleRecords()
  return sortArticles(records.map(articleFromRecord).filter((value): value is Article => value !== null))
}

export async function readPublishedArticles() {
  return (await readManagedArticles()).filter((article) => article.status === "published")
}

export async function getPublishedArticleBySlug(slug: string) {
  return (await readPublishedArticles()).find((article) => article.slug === slug)
}

export async function refreshArticles() {
  return readManagedArticles()
}

export async function createArticle(value: unknown) {
  const input = validateArticleMutationInput(value, "create")
  const articles = await readManagedArticles()
  const article = buildArticle(input, null, articles, randomUUID())
  return persistArticle(article, "create")
}

export async function updateArticle(id: string, value: unknown) {
  const articles = await readManagedArticles()
  const existing = articles.find((article) => article.id === id)
  if (!existing) throw new ArticleNotFoundError()

  const input = validateArticleMutationInput(value, "update")
  const article = buildArticle(input, existing, articles, id)
  return persistArticle(article, "update", id)
}

export async function deleteArticle(id: string, audit: { actorId: string; actorName: string; actorEmail: string | null; actorRole: string }) {
  const prisma = getPrismaClient()
  return prisma.$transaction(async (transaction) => {
    const records = await transaction.$queryRaw<Array<{ data: Record<string, unknown> }>>`
      SELECT data
      FROM "AppRecord"
      WHERE scope = ${ARTICLE_SCOPE} AND key = ${id}
      LIMIT 1
    `
    const article = records[0] ? articleFromRecord({ ...records[0], id, scope: ARTICLE_SCOPE, key: id, createdAt: new Date(), updatedAt: new Date() }) : null
    if (!article) throw new ArticleNotFoundError()

    const auditId = randomUUID()
    const auditTimestamp = new Date().toISOString()
    const auditData = {
      id: `log-${auditId}`,
      userName: audit.actorName,
      type: "Article/Banner",
      action: "article_deleted",
      dateTime: auditTimestamp,
      device: "Server Article API",
      status: "Warning",
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      previousStatus: article.status,
      actorId: audit.actorId,
      actorEmail: audit.actorEmail,
      actorRole: audit.actorRole,
      timestamp: auditTimestamp,
    }

    const deleted = await transaction.$executeRaw`
      DELETE FROM "AppRecord"
      WHERE scope = ${ARTICLE_SCOPE} AND key = ${id}
    `
    if (Number(deleted) !== 1) throw new ArticleNotFoundError()

    await transaction.$executeRaw`
      INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
      VALUES (${randomUUID()}, 'activity-log', ${`article-deleted-${auditId}`}, ${JSON.stringify(auditData)}::jsonb, NOW())
    `

    return article
  })
}

export { ArticleConflictError, ArticleNotFoundError }
export { toPublicArticle }
