import { NextResponse } from "next/server"
import { resolveCurrentPortalAccess } from "@/lib/portal-access-server"

export async function GET() {
  try {
    const access = await resolveCurrentPortalAccess()
    if (access.kind === "unauthenticated") return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 })
    if (access.kind === "inactive") return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403 })
    return NextResponse.json({ permissions: access.permissions, modules: access.modules })
  } catch {
    return NextResponse.json({ error: "Akses portal belum dapat dimuat." }, { status: 500 })
  }
}
