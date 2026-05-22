import { NextResponse, type NextRequest } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ user: null }, { status: 401 })

    const session = await verifySessionToken(token, AUTH_SECRET)
    if (!session) return NextResponse.json({ user: null }, { status: 401 })

    const users = await prisma.$queryRaw<Array<{
      id: string
      name: string
      email: string | null
      role: string
      avatar: string | null
      status: string
    }>>`SELECT id, name, email, role, avatar, status FROM "User" WHERE id = ${session.sub} LIMIT 1`

    const user = users[0]
    if (!user || user.status !== "Aktif") return NextResponse.json({ user: null }, { status: 401 })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email ?? "",
        role: user.role,
        avatar: user.avatar ?? undefined,
      },
    })
  } catch (error) {
    console.error("Session lookup error", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
