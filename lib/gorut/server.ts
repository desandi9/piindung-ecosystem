import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { serializePublicAccountStatus } from "./server-pure"
import { resolveOperationalContext, type GorutOperationalContext } from "./server-pure"

export * from "./server-pure"
export const noStoreHeaders = { "Cache-Control": "private, no-store" }
export function json<T>(payload: T, status = 200) { return NextResponse.json(payload, { status, headers: noStoreHeaders }) }
export function errorResponse() { return json({ error: "Data GORUT tidak dapat diproses." }, 500) }
export async function requireGorutContext(): Promise<{ context: GorutOperationalContext } | { response: NextResponse }> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, process.env.AUTH_SECRET ?? "piindung-dev-auth-secret") : null
  if (!session) return { response: json({ error: "Sesi tidak ditemukan." }, 401) }
  try {
    const prisma = getPrismaClient()
    const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { id: true, status: true } })
    if (!user) return { response: json({ error: "Sesi tidak ditemukan." }, 401) }
    if (serializePublicAccountStatus(user.status) !== "aktif") return { response: json({ error: "Akun tidak aktif." }, 403) }
    const assignments = await prisma.gorutOperationalAssignment.findMany({ where: { userId: user.id, isActive: true }, select: { id: true, role: true, kecamatanId: true, rantingId: true, plpkId: true }, orderBy: { id: "asc" }, take: 2 })
    const context = resolveOperationalContext(user.id, assignments)
    return context ? { context } : { response: json({ error: "Akses operasional GORUT tidak tersedia." }, 403) }
  } catch { return { response: errorResponse() } }
}
