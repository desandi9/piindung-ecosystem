import type { Article, ArticleContentType, ArticleStatus } from "@/lib/article-content"

export const ARTICLE_CONTENT_TYPES = ["artikel", "berita"] as const
export const ARTICLE_STATUSES = ["draft", "published", "unpublished"] as const

export const ARTICLE_LIMITS = {
  title: 160,
  excerpt: 320,
  body: 500_000,
  slug: 200,
  coverImage: 2_000,
  authorName: 120,
} as const

export type ArticleMutationInput = Partial<Pick<Article, "slug" | "title" | "excerpt" | "body" | "contentType" | "coverImage" | "authorName" | "status" | "featured" | "position" | "publishedAt">>

export class ArticleValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ArticleValidationError"
  }
}

export class ArticleConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ArticleConflictError"
  }
}

export class ArticleNotFoundError extends Error {
  constructor(message = "Artikel tidak ditemukan.") {
    super(message)
    this.name = "ArticleNotFoundError"
  }
}

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b-\u001f\u007f]/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function hasControlCharacters(value: string) {
  return CONTROL_CHARACTER_PATTERN.test(value)
}

function assertString(value: unknown, field: string, maxLength: number, required = false) {
  if (typeof value !== "string") throw new ArticleValidationError(`${field} harus berupa teks.`)
  const trimmed = value.trim()
  if (required && !trimmed) throw new ArticleValidationError(`${field} wajib diisi.`)
  if (trimmed.length > maxLength) throw new ArticleValidationError(`${field} terlalu panjang.`)
  if (hasControlCharacters(value)) throw new ArticleValidationError(`${field} mengandung karakter tidak valid.`)
  return trimmed
}

function assertIsoDate(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim() || !ISO_DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ArticleValidationError(`${field} harus berupa tanggal ISO yang valid.`)
  }
  if (hasControlCharacters(value)) throw new ArticleValidationError(`${field} mengandung karakter tidak valid.`)
  return new Date(value).toISOString()
}

export function generateArticleSlug(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, ARTICLE_LIMITS.slug)
    .replace(/-+$/g, "")

  if (!slug || !SLUG_PATTERN.test(slug)) throw new ArticleValidationError("Slug tidak dapat dibuat dari judul.")
  return slug
}

export function normalizeArticleSlug(value: unknown) {
  if (typeof value !== "string") throw new ArticleValidationError("Slug harus berupa teks.")
  const trimmed = value.trim()
  if (!trimmed || hasControlCharacters(trimmed)) throw new ArticleValidationError("Slug wajib diisi dan tidak boleh mengandung karakter kontrol.")
  const slug = generateArticleSlug(trimmed)
  if (slug.length > ARTICLE_LIMITS.slug) throw new ArticleValidationError("Slug terlalu panjang.")
  return slug
}

function assertContentType(value: unknown): ArticleContentType {
  if (typeof value !== "string" || !ARTICLE_CONTENT_TYPES.includes(value as ArticleContentType)) {
    throw new ArticleValidationError("Tipe konten tidak valid.")
  }
  return value as ArticleContentType
}

function assertStatus(value: unknown): ArticleStatus {
  if (typeof value !== "string" || !ARTICLE_STATUSES.includes(value as ArticleStatus)) {
    throw new ArticleValidationError("Status artikel tidak valid.")
  }
  return value as ArticleStatus
}

function assertImage(value: unknown) {
  const image = assertString(value, "Cover image", ARTICLE_LIMITS.coverImage)
  if (!image) return image
  if (image.startsWith("/public/") || image === "/public") return image

  let parsed: URL
  try {
    parsed = new URL(image)
  } catch {
    throw new ArticleValidationError("Cover image harus berupa URL gambar yang aman atau path /public.")
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new ArticleValidationError("Cover image harus berupa URL HTTP(S) yang aman atau path /public.")
  }
  return image
}

function assertPosition(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new ArticleValidationError("Position harus berupa bilangan bulat positif.")
  }
  return value
}

function assertBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") throw new ArticleValidationError(`${field} harus berupa boolean.`)
  return value
}

const allowedFields = new Set(["slug", "title", "excerpt", "body", "contentType", "coverImage", "authorName", "status", "featured", "position", "publishedAt"])

export function validateArticleMutationInput(value: unknown, mode: "create" | "update") {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ArticleValidationError("Payload artikel tidak valid.")
  const input = value as Record<string, unknown>
  if (Object.keys(input).some((key) => !allowedFields.has(key))) throw new ArticleValidationError("Payload artikel mengandung field yang tidak diizinkan.")

  const result: ArticleMutationInput = {}
  if (input.slug !== undefined) result.slug = normalizeArticleSlug(input.slug)
  if (input.title !== undefined) result.title = assertString(input.title, "Judul", ARTICLE_LIMITS.title, mode === "create")
  if (input.excerpt !== undefined) result.excerpt = assertString(input.excerpt, "Excerpt", ARTICLE_LIMITS.excerpt, mode === "create")
  if (input.body !== undefined) result.body = assertString(input.body, "Body", ARTICLE_LIMITS.body, mode === "create")
  if (input.contentType !== undefined) result.contentType = assertContentType(input.contentType)
  if (input.coverImage !== undefined) result.coverImage = assertImage(input.coverImage)
  if (input.authorName !== undefined) result.authorName = assertString(input.authorName, "Nama penulis", ARTICLE_LIMITS.authorName)
  if (input.status !== undefined) result.status = assertStatus(input.status)
  if (input.featured !== undefined) result.featured = assertBoolean(input.featured, "Featured")
  if (input.position !== undefined) result.position = assertPosition(input.position)
  if (input.publishedAt !== undefined) result.publishedAt = input.publishedAt === null ? null : assertIsoDate(input.publishedAt, "Published date")

  if (mode === "create") {
    if (!result.title) throw new ArticleValidationError("Judul wajib diisi.")
    if (!result.excerpt) throw new ArticleValidationError("Excerpt wajib diisi.")
    if (!result.body) throw new ArticleValidationError("Body wajib diisi.")
    if (!result.contentType) throw new ArticleValidationError("Tipe konten wajib diisi.")
    if (!result.status) throw new ArticleValidationError("Status artikel wajib diisi.")
    if (result.status === "published" && !result.publishedAt) throw new ArticleValidationError("Tanggal publikasi wajib diisi untuk artikel Published.")
  } else if (Object.keys(result).length === 0) {
    throw new ArticleValidationError("Tidak ada perubahan artikel.")
  }

  return result
}

export function isArticleContentType(value: unknown): value is ArticleContentType {
  return typeof value === "string" && ARTICLE_CONTENT_TYPES.includes(value as ArticleContentType)
}

export function isArticleStatus(value: unknown): value is ArticleStatus {
  return typeof value === "string" && ARTICLE_STATUSES.includes(value as ArticleStatus)
}

export function isValidArticleDate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value)) && !hasControlCharacters(value)
}

export function isSafeArticleImage(value: unknown) {
  try {
    assertImage(value)
    return true
  } catch {
    return false
  }
}

export function isValidStoredArticle(value: unknown): value is Article {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const article = value as Record<string, unknown>
  return typeof article.id === "string" && Boolean(article.id.trim())
    && typeof article.slug === "string" && SLUG_PATTERN.test(article.slug)
    && typeof article.title === "string" && article.title.trim().length > 0
    && typeof article.excerpt === "string"
    && typeof article.body === "string"
    && isArticleContentType(article.contentType)
    && typeof article.coverImage === "string" && isSafeArticleImage(article.coverImage)
    && typeof article.authorName === "string"
    && isArticleStatus(article.status)
    && typeof article.featured === "boolean"
    && typeof article.position === "number" && Number.isSafeInteger(article.position) && article.position >= 1
    && (article.publishedAt === null || isValidArticleDate(article.publishedAt))
    && isValidArticleDate(article.createdAt)
    && isValidArticleDate(article.updatedAt)
}

export function normalizeLegacyStatus(value: unknown): ArticleStatus | null {
  if (value === "Published") return "published"
  if (value === "Draft") return "draft"
  if (value === "Unpublished") return "unpublished"
  if (isArticleStatus(value)) return value
  return null
}
