import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPrismaClient } from "@/lib/prisma"
import { getRecord, listRecords } from "@/lib/record-store-server"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { DEFAULT_HELP_FAQ_CATEGORIES } from "@/lib/faq-manager-data"
import { DEFAULT_PUBLIC_PRODUCTS, type PublicProductId } from "@/lib/public-products-data"

export const HELP_CONTENT_SCOPE = "help-content"
export const HELP_CONTENT_KEY = "main"
export const HELP_CONTENT_EVENT = "piindung-help-content-updated"

export type HelpIconKey = "users" | "credit-card" | "shield" | "settings" | "help"
export type HelpQuestionStatus = "draft" | "published"

export type HelpQuestion = {
  id: string
  question: string
  answer: string
  productId?: PublicProductId
  status: HelpQuestionStatus
  position: number
}

export type HelpCategory = {
  id: string
  title: string
  iconKey: HelpIconKey
  visible: boolean
  position: number
  questions: HelpQuestion[]
}

export type HelpSupport = {
  title: string
  description: string
  buttonLabel: string
  href: string
}

export type HelpContent = {
  categories: HelpCategory[]
  support: HelpSupport
  updatedAt: string
}

export type PublicHelpContent = {
  categories: Array<Omit<HelpCategory, "questions"> & { questions: HelpQuestion[] }>
  support: HelpSupport
  updatedAt: string
}

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f]/
const ICON_KEYS: HelpIconKey[] = ["users", "credit-card", "shield", "settings", "help"]
const STATUSES: HelpQuestionStatus[] = ["draft", "published"]
const PRODUCT_IDS = DEFAULT_PUBLIC_PRODUCTS.map((product) => product.id)
const LEGACY_ICON_MAP: Record<string, HelpIconKey> = { users: "users", "credit-card": "credit-card", shield: "shield", settings: "settings" }
const SAFE_PUBLIC_HREFS = ["/kontak", "/", "/bantuan"]

export class HelpContentValidationError extends Error {}

function text(value: unknown, field: string, max: number, required = true) {
  if (typeof value !== "string") throw new HelpContentValidationError(`${field} tidak valid.`)
  const next = value.trim()
  if (required && !next) throw new HelpContentValidationError(`${field} wajib diisi.`)
  if (next.length > max || CONTROL_CHARS.test(next)) throw new HelpContentValidationError(`${field} tidak valid.`)
  return next
}

function optionalId(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value !== "string" || !PRODUCT_IDS.includes(value as PublicProductId)) throw new HelpContentValidationError("Produk tidak valid.")
  return value as PublicProductId
}

function id(value: unknown, field: string) {
  const next = text(value, field, 80)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(next)) throw new HelpContentValidationError(`${field} tidak valid.`)
  return next
}

function position(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) throw new HelpContentValidationError(`${field} tidak valid.`)
  return value
}

function supportHref(value: unknown) {
  const next = text(value, "Tautan bantuan", 120)
  if (SAFE_PUBLIC_HREFS.includes(next)) return next
  if (next.startsWith("/produk") || next.startsWith("/bantuan") || next.startsWith("/kontak")) return next
  throw new HelpContentValidationError("Tautan bantuan tidak diizinkan.")
}

function sortByPosition<T extends { position: number; id: string }>(items: T[]) {
  return [...items].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
}

function unique(values: string[], field: string) {
  if (new Set(values).size !== values.length) throw new HelpContentValidationError(`${field} duplikat.`)
}

export const DEFAULT_HELP_CONTENT: HelpContent = {
  categories: [
    {
      id: "umum",
      title: "Memulai PIINDUNG",
      iconKey: "help",
      visible: true,
      position: 1,
      questions: [
        { id: "apa-itu-piindung", question: "Apa itu PIINDUNG?", answer: "PIINDUNG adalah ekosistem digital NU Care–LAZISNU Garut yang membantu pengelolaan informasi, layanan, dan proses organisasi dalam satu lingkungan yang lebih tertata.", status: "published", position: 1 },
        { id: "pengguna-piindung", question: "Siapa yang dapat menggunakan PIINDUNG?", answer: "PIINDUNG digunakan oleh pengurus dan petugas yang memiliki akses sesuai peran masing-masing. Beberapa informasi publik tetap dapat dibuka tanpa login.", status: "published", position: 2 },
        { id: "cara-masuk", question: "Bagaimana cara masuk ke dalam sistem?", answer: "Pengguna yang memiliki akun dapat masuk melalui halaman login. Setelah masuk, sistem akan menyesuaikan akses berdasarkan peran pengguna.", status: "published", position: 3 },
      ],
    },
    {
      id: "produk",
      title: "Penggunaan Produk",
      iconKey: "settings",
      visible: true,
      position: 2,
      questions: [
        { id: "produk-tersedia", question: "Produk apa saja yang tersedia?", answer: "Ekosistem PIINDUNG mencakup GORUT serta produk pendukung seperti E-Tasyaruf, Mobisnu, Arsip Digital, dan LAZISNU POS sesuai tahapan pengembangan.", status: "published", position: 1 },
      ],
    },
    {
      id: "akses",
      title: "Akun dan Akses",
      iconKey: "users",
      visible: true,
      position: 3,
      questions: [
        { id: "tidak-bisa-masuk", question: "Apa yang harus dilakukan jika tidak bisa masuk?", answer: "Periksa kembali data login dan pastikan akun sudah memiliki akses. Jika masih bermasalah, hubungi tim PIINDUNG melalui halaman kontak.", status: "published", position: 1 },
        { id: "hubungi-bantuan", question: "Bagaimana cara menghubungi tim bantuan?", answer: "Gunakan halaman Kontak untuk mengirimkan pertanyaan atau kebutuhan bantuan kepada tim NU Care–LAZISNU Garut.", status: "published", position: 2 },
      ],
    },
  ],
  support: {
    title: "Masih Membutuhkan Bantuan?",
    description: "Hubungi tim NU Care–LAZISNU Garut untuk mendapatkan informasi lebih lanjut mengenai penggunaan PIINDUNG.",
    buttonLabel: "Hubungi Kami",
    href: "/kontak",
  },
  updatedAt: new Date(0).toISOString(),
}

function normalizeLegacyFaqDefaults(): HelpCategory[] {
  const existing = new Set(DEFAULT_HELP_CONTENT.categories.flatMap((category) => category.questions.map((question) => question.question.toLowerCase())))
  const categories: HelpCategory[] = []
  for (const [index, legacy] of DEFAULT_HELP_FAQ_CATEGORIES.entries()) {
    const questions = legacy.questions
      .filter((question) => question.q.trim() && question.a.trim() && !existing.has(question.q.trim().toLowerCase()))
      .map((question, questionIndex) => ({ id: id(question.id, "ID FAQ"), question: question.q.trim(), answer: question.a.trim(), status: "published" as const, position: questionIndex + 1 }))
    if (questions.length === 0) continue
    categories.push({ id: id(legacy.id, "ID kategori"), title: legacy.title.trim(), iconKey: LEGACY_ICON_MAP[legacy.iconKey] ?? "help", visible: true, position: DEFAULT_HELP_CONTENT.categories.length + index + 1, questions })
  }
  return categories
}

export function buildInitialHelpContent(now = new Date().toISOString(), legacyRecords: Array<{ data: Record<string, unknown> }> = []): { content: HelpContent; skippedCount: number } {
  const categories = [...DEFAULT_HELP_CONTENT.categories, ...normalizeLegacyFaqDefaults()]
  const questionTexts = new Set(categories.flatMap((category) => category.questions.map((question) => question.question.toLowerCase())))
  let skippedCount = 0
  for (const record of legacyRecords) {
    const legacy = record.data
    if (typeof legacy.id !== "string" || typeof legacy.title !== "string" || !Array.isArray(legacy.questions)) {
      skippedCount += 1
      continue
    }
    const validQuestions: HelpQuestion[] = []
    for (const value of legacy.questions) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        skippedCount += 1
        continue
      }
      const question = value as Record<string, unknown>
      if (typeof question.q !== "string" || !question.q.trim() || typeof question.a !== "string" || !question.a.trim()) {
        skippedCount += 1
        continue
      }
      const normalizedQuestion = question.q.trim().toLowerCase()
      if (questionTexts.has(normalizedQuestion)) continue
      questionTexts.add(normalizedQuestion)
      try {
        validQuestions.push({ id: id(question.id, "ID FAQ"), question: question.q.trim(), answer: question.a.trim(), status: "published", position: validQuestions.length + 1 })
      } catch {
        skippedCount += 1
      }
    }
    if (validQuestions.length === 0) continue
    const existingCategory = categories.find((category) => category.id === legacy.id)
    if (existingCategory) {
      existingCategory.questions.push(...validQuestions.map((question, index) => ({ ...question, position: existingCategory.questions.length + index + 1 })))
    } else {
      try {
        categories.push({ id: id(legacy.id, "ID kategori"), title: text(legacy.title, "Judul kategori", 100), iconKey: LEGACY_ICON_MAP[String(legacy.iconKey)] ?? "help", visible: true, position: categories.length + 1, questions: validQuestions })
      } catch {
        skippedCount += validQuestions.length
      }
    }
  }
  return { content: validateHelpContent({ ...DEFAULT_HELP_CONTENT, categories, updatedAt: now }), skippedCount }
}

export function validateHelpContent(value: unknown): HelpContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HelpContentValidationError("Payload bantuan tidak valid.")
  const input = value as Record<string, unknown>
  if (!Array.isArray(input.categories)) throw new HelpContentValidationError("Kategori bantuan wajib diisi.")
  const categories = input.categories.map((categoryValue) => {
    if (!categoryValue || typeof categoryValue !== "object" || Array.isArray(categoryValue)) throw new HelpContentValidationError("Kategori bantuan tidak valid.")
    const category = categoryValue as Record<string, unknown>
    if (typeof category.visible !== "boolean") throw new HelpContentValidationError("Visibility kategori tidak valid.")
    if (!ICON_KEYS.includes(category.iconKey as HelpIconKey)) throw new HelpContentValidationError("Ikon kategori tidak valid.")
    if (!Array.isArray(category.questions)) throw new HelpContentValidationError("FAQ kategori tidak valid.")
    const questions = category.questions.map((questionValue) => {
      if (!questionValue || typeof questionValue !== "object" || Array.isArray(questionValue)) throw new HelpContentValidationError("FAQ tidak valid.")
      const question = questionValue as Record<string, unknown>
      if (!STATUSES.includes(question.status as HelpQuestionStatus)) throw new HelpContentValidationError("Status FAQ tidak valid.")
      return { id: id(question.id, "ID FAQ"), question: text(question.question, "Pertanyaan", 220), answer: text(question.answer, "Jawaban", 1600), productId: optionalId(question.productId), status: question.status as HelpQuestionStatus, position: position(question.position, "Posisi FAQ") }
    })
    unique(questions.map((question) => question.id), "ID FAQ")
    return { id: id(category.id, "ID kategori"), title: text(category.title, "Judul kategori", 100), iconKey: category.iconKey as HelpIconKey, visible: category.visible, position: position(category.position, "Posisi kategori"), questions: sortByPosition(questions) }
  })
  unique(categories.map((category) => category.id), "ID kategori")
  const support = input.support as Record<string, unknown> | undefined
  if (!support || typeof support !== "object" || Array.isArray(support)) throw new HelpContentValidationError("Konten dukungan tidak valid.")
  return { categories: sortByPosition(categories), support: { title: text(support.title, "Judul dukungan", 120), description: text(support.description, "Deskripsi dukungan", 400), buttonLabel: text(support.buttonLabel, "Label tombol", 80), href: supportHref(support.href) }, updatedAt: text(input.updatedAt ?? new Date().toISOString(), "Tanggal pembaruan", 40) }
}

export function toPublicHelpContent(content: HelpContent): PublicHelpContent {
  return {
    categories: sortByPosition(content.categories).filter((category) => category.visible).map((category) => ({ ...category, questions: sortByPosition(category.questions).filter((question) => question.status === "published") })).filter((category) => category.questions.length > 0),
    support: content.support,
    updatedAt: content.updatedAt,
  }
}

export async function readHelpContent() {
  const record = await getRecord(HELP_CONTENT_SCOPE, HELP_CONTENT_KEY)
  return record ? validateHelpContent(record.data) : buildInitialHelpContent().content
}

export async function requireHelpContentManager() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { response: NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 }) }
  if (session.role !== "super_admin_pc") return { response: NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 }) }
  const prisma = getPrismaClient()
  const users = await prisma.$queryRaw<Array<{ id: string; name: string; email: string | null; role: string }>>`SELECT id, name, email, role FROM "User" WHERE id = ${session.sub} LIMIT 1`
  const user = users[0]
  if (user?.role !== "super_admin_pc") return { response: NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 }) }
  return { user, session }
}

export async function updateHelpContent(content: HelpContent, actor: { id: string; name: string; email: string | null; role: string }) {
  const prisma = getPrismaClient()
  const validated = validateHelpContent({ ...content, updatedAt: new Date().toISOString() })
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${HELP_CONTENT_SCOPE + ":mutations"}))`
    await transaction.$executeRaw`
      INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
      VALUES (${randomUUID()}, ${HELP_CONTENT_SCOPE}, ${HELP_CONTENT_KEY}, ${JSON.stringify(validated)}::jsonb, NOW())
      ON CONFLICT ("scope", "key") DO UPDATE SET "data" = EXCLUDED."data", "updatedAt" = NOW()
    `
    const timestamp = new Date().toISOString()
    const auditId = randomUUID()
    const audit = { id: `log-${auditId}`, userName: actor.name, type: "Settings", action: "help_content_updated", dateTime: timestamp, device: "Server Help Content API", status: "Success", actorId: actor.id, actorEmail: actor.email, actorRole: actor.role, timestamp }
    await transaction.$executeRaw`
      INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
      VALUES (${randomUUID()}, 'activity-log', ${`help-content-updated-${auditId}`}, ${JSON.stringify(audit)}::jsonb, NOW())
    `
    return validated
  })
}

export async function readLegacyFaqManagerRecords() {
  return listRecords("faq-manager")
}
