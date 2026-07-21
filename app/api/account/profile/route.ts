import { NextResponse, type NextRequest } from "next/server"
import { currentAccount, currentVerificationUrl, updateCurrentAccount } from "@/lib/account-profile-server"
import { serializeAccountProfile as clientSerialize, validateProfilePatch } from "@/lib/account-profile"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store" }

export async function GET(request: NextRequest) {
  try {
    const account = await currentAccount(request)
    if (account.kind === "unauthenticated") return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401, headers })
    if (account.kind === "inactive") return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403, headers })
    return NextResponse.json({ profile: clientSerialize(account.user, currentVerificationUrl(account.user.memberId)) }, { headers })
  } catch {
    return NextResponse.json({ error: "Profil belum dapat dimuat." }, { status: 500, headers })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const account = await currentAccount(request)
    if (account.kind === "unauthenticated") return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401, headers })
    if (account.kind === "inactive") return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403, headers })
    const validation = validateProfilePatch(await request.json().catch(() => null))
    if (validation.error || !validation.value) return NextResponse.json({ error: validation.error ?? "Data profil tidak valid." }, { status: 400, headers })
    const updated = await updateCurrentAccount(account.user.id, validation.value)
    return NextResponse.json({ profile: clientSerialize(updated, currentVerificationUrl(updated.memberId)) }, { headers })
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE") return NextResponse.json({ error: "Email atau nomor HP telah digunakan." }, { status: 409, headers })
    if (error instanceof Error && error.message === "INACTIVE") return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403, headers })
    return NextResponse.json({ error: "Profil gagal diperbarui." }, { status: 500, headers })
  }
}
