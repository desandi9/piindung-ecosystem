import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { canAccessAdminDashboard } from "@/features/auth"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { getRecord } from "@/lib/record-store-server"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const LEGACY_MUTATION_MESSAGE = "Pengelolaan artikel lama telah dipindahkan ke CMS Landing Page."
const HOMEPAGE_CONTENT_TYPES = ["Banner", "Artikel", "Berita"] as const

type MutationOperation = "create" | "update" | "delete"

export async function requireHomepageContentManager() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!canAccessAdminDashboard(session.role)) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

function isKnownHomepageContentType(value: unknown) {
  return typeof value === "string" && HOMEPAGE_CONTENT_TYPES.includes(value as never)
}

function isLegacyArticleType(value: unknown) {
  return value === "Artikel" || value === "Berita"
}

function invalidType() {
  return { response: NextResponse.json({ error: "Tipe konten harus Banner." }, { status: 400 }) }
}

function retiredArticleMutation() {
  return { response: NextResponse.json({ error: LEGACY_MUTATION_MESSAGE }, { status: 410 }) }
}

export async function protectHomepageContentMutation(operation: MutationOperation, key: string | undefined, incomingType?: unknown, existingRecord?: Awaited<ReturnType<typeof getRecord>> | null) {
  const existing = existingRecord !== undefined ? existingRecord : key ? await getRecord("homepage-content", key) : null
  if (operation !== "create" && !existing) return { response: NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 }) }

  const existingType = existing?.data?.type
  if (operation === "delete") return isLegacyArticleType(existingType) ? retiredArticleMutation() : { existing }
  if (!isKnownHomepageContentType(incomingType)) return invalidType()
  if (isLegacyArticleType(incomingType) || isLegacyArticleType(existingType)) return retiredArticleMutation()

  return { existing }
}
