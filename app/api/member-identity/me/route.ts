import { NextResponse } from "next/server"
import { currentMemberIdentity } from "@/lib/member-identity-server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const identity = await currentMemberIdentity()
    if (identity.kind === "unauthenticated") return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 })
    if (identity.kind === "inactive") return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403 })
    return NextResponse.json(identity.identity, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "Identitas anggota belum dapat dimuat." }, { status: 500 })
  }
}
