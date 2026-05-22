export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const revalidate = 0

import bcrypt from "bcryptjs"
import { NextResponse, type NextRequest } from "next/server"
import { ensureDefaultUsers } from "@/lib/auth-server"
import { getPrismaClient } from "@/lib/prisma"
import { normalizePhoneNumber } from "@/lib/phone"
import { AUTH_COOKIE_NAME, createSessionToken } from "@/lib/session-token"
import type { AuthUser } from "@/types/auth"

export async function POST(request: NextRequest) {
  try {
    await ensureDefaultUsers()
    const prisma = getPrismaClient()
    const authSecret = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
    const body = (await request.json()) as { phoneNumber?: string; password?: string; remember?: boolean }
    const phoneNumber = normalizePhoneNumber(body.phoneNumber ?? "")
    const password = body.password ?? ""

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "Nomor HP dan password wajib diisi." }, { status: 400 })
    }

    const users = await prisma.$queryRaw<Array<{
      id: string
      name: string
      phone: string
      email: string | null
      passwordHash: string
      role: string
      status: string
      avatar: string | null
    }>>`SELECT id, name, phone, email, "passwordHash", role, status, avatar FROM "User" WHERE phone = ${phoneNumber} LIMIT 1`

    const user = users[0]

    if (!user || user.status !== "Aktif") {
      console.warn("Login rejected", {
        reason: !user ? "user_not_found" : "user_inactive",
        phoneNumber,
        status: user?.status ?? null,
      })
      return NextResponse.json({ error: "Nomor HP atau password tidak valid." }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      console.warn("Login rejected", {
        reason: "password_mismatch",
        phoneNumber,
        userId: user.id,
      })
      return NextResponse.json({ error: "Nomor HP atau password tidak valid." }, { status: 401 })
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email ?? "",
      role: user.role as AuthUser["role"],
      avatar: user.avatar ?? undefined,
    }

    const now = Date.now()
    const token = await createSessionToken(
      {
        sub: user.id,
        name: authUser.name,
        phone: user.phone,
        role: authUser.role,
        remember: body.remember ?? true,
        iat: now,
        exp: now + ((body.remember ?? true) ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 12),
      },
      authSecret,
    )

    const response = NextResponse.json({ user: authUser })
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: body.remember ?? true ? 60 * 60 * 24 * 30 : undefined,
    })

    await prisma.$executeRaw`UPDATE "User" SET "lastLoginAt" = ${new Date()} WHERE id = ${user.id}`

    return response
  } catch (error) {
    console.error("Login error", error)
    return NextResponse.json({ error: "Gagal memproses login." }, { status: 500 })
  }
}
