import { NextResponse } from "next/server"
import { requirePortalPermission } from "@/lib/portal-access-server"
import { listNotificationsForUser } from "@/lib/portal-notifications-server"
import { parseNotificationPagination } from "@/lib/portal-notifications"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store" }

export async function GET(request: Request) {
  try {
    const required = await requirePortalPermission("notifications.view")
    if (required.response) return required.response
    const parsed = parseNotificationPagination(new URL(request.url).searchParams)
    if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400, headers })
    const result = await listNotificationsForUser(required.access.user.id, required.access.user.role, parsed.value.page, parsed.value.limit)
    return NextResponse.json(result, { headers })
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat notifikasi pengguna." }, { status: 500, headers })
  }
}
