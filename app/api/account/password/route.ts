import { NextResponse, type NextRequest } from "next/server"
import { changeCurrentPassword, currentAccount } from "@/lib/account-profile-server"
import { AUTH_COOKIE_NAME } from "@/lib/session-token"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store" }

export async function POST(request: NextRequest) {
  try {
    const account = await currentAccount(request)
    if (account.kind === "unauthenticated") return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401, headers })
    if (account.kind === "inactive") return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403, headers })
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (!body || Object.keys(body).some((key) => !["currentPassword", "newPassword", "confirmPassword"].includes(key)) || typeof body.currentPassword !== "string" || typeof body.newPassword !== "string" || typeof body.confirmPassword !== "string") return NextResponse.json({ error: "Data password tidak valid." }, { status: 400, headers })
    await changeCurrentPassword(account.user.id, body.currentPassword, body.newPassword, body.confirmPassword)
    const response = NextResponse.json({ success: true, requiresLogin: true }, { headers })
    response.cookies.set(AUTH_COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 })
    return response
  } catch (error) {
    if (error instanceof Error && error.message === "INACTIVE") return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403, headers })
    if (error instanceof Error && error.message === "INVALID_PASSWORD") return NextResponse.json({ error: "Password saat ini atau password baru tidak valid." }, { status: 400, headers })
    return NextResponse.json({ error: "Password gagal diubah." }, { status: 500, headers })
  }
}
