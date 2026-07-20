import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { ArticleConflictError, ArticleNotFoundError } from "@/lib/article-content"
import { ArticleValidationError } from "@/lib/article-content-rules"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"

export async function requireArticleManager() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { response: NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 }) }
  const isSuperAdmin = session.role === "super_admin_pc"
  const isAdminPc = session.role === "admin_pc"
  if (!isSuperAdmin && !isAdminPc) return { response: NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 }) }

  const prisma = getPrismaClient()
  const users = await prisma.$queryRaw<Array<{ id: string; name: string; email: string | null; role: string; status: string }>>`
    SELECT id, name, email, role, status
    FROM "User"
    WHERE id = ${session.sub}
    LIMIT 1
  `
  const user = users[0]
  if (!user || user.status !== "Aktif") return { response: NextResponse.json({ error: "Akun tidak aktif." }, { status: 403 }) }
  if (user.role !== "super_admin_pc" && user.role !== "admin_pc") return { response: NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 }) }
  return { session, user }
}

export function articleErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ArticleValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
  if (error instanceof ArticleConflictError) return NextResponse.json({ error: error.message }, { status: 409 })
  if (error instanceof ArticleNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ error: fallback }, { status: 500 })
}

export async function parseArticlePayload(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new ArticleValidationError("Payload artikel tidak valid.")
  }
}
