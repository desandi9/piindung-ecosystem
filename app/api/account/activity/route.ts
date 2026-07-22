import { NextResponse, type NextRequest } from "next/server"
import { resolveCurrentPortalAccess } from "@/lib/portal-access-server"
import { getAccountActivity } from "@/lib/account-activity-server"
import { parseAccountActivityQuery, serializeAccountActivity } from "@/lib/account-activity"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store" }

export async function GET(request: NextRequest) {
  try {
    const access = await resolveCurrentPortalAccess()
    if (access.kind === "unauthenticated") return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401, headers })
    if (access.kind === "inactive") return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403, headers })
    if (access.kind !== "authorized" || !access.permissions.includes("member_area.view")) return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403, headers })
    const validation = parseAccountActivityQuery(new URL(request.url).searchParams)
    if (validation.error || !validation.value) return NextResponse.json({ error: validation.error }, { status: 400, headers })
    const { activities, total, hasMore } = await getAccountActivity(access.user.id, validation.value)
    return NextResponse.json({ activities: activities.map(serializeAccountActivity), page: validation.value.page, limit: validation.value.limit, total, hasMore }, { headers })
  } catch {
    return NextResponse.json({ error: "Aktivitas akun gagal dimuat." }, { status: 500, headers })
  }
}
