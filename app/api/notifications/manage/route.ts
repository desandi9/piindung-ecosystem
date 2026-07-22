import { NextResponse } from "next/server"
import { requirePortalPermission } from "@/lib/portal-access-server"
import { listNotificationsManage, publishNotification } from "@/lib/portal-notifications-server"
import { parseNotificationInput, parseNotificationPagination } from "@/lib/portal-notifications"
import { readJsonMutation } from "@/lib/request-security"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store" }

export async function GET(request: Request) {
  try {
    const required = await requirePortalPermission("notifications.manage")
    if (required.response) return required.response
    const parsed = parseNotificationPagination(new URL(request.url).searchParams)
    if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400, headers })
    const result = await listNotificationsManage(parsed.value.page, parsed.value.limit)
    return NextResponse.json({ ...result, page: parsed.value.page, limit: parsed.value.limit }, { headers })
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat manajemen notifikasi." }, { status: 500, headers })
  }
}

export async function POST(request: Request) {
  const required = await requirePortalPermission("notifications.manage")
  if (required.response) return required.response
  const parsedJson = await readJsonMutation(request)
  if (parsedJson.failure) return NextResponse.json({ error: parsedJson.failure.error }, { status: parsedJson.failure.status, headers })
  const parsed = parseNotificationInput(parsedJson.value)
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400, headers })
  try {
    const notification = await publishNotification(required.access.user.id, parsed.value)
    return NextResponse.json({ notification: { id: notification.id, createdAt: notification.createdAt.toISOString(), publishedAt: notification.publishedAt?.toISOString() ?? null } }, { status: 201, headers })
  } catch (error) {
    if (error instanceof Error && error.message === "TARGET_NOT_FOUND") return NextResponse.json({ error: "Pengguna tujuan tidak ditemukan." }, { status: 404, headers })
    if (error instanceof Error && error.message === "TARGET_INACTIVE") return NextResponse.json({ error: "Pengguna tujuan tidak aktif." }, { status: 409, headers })
    return NextResponse.json({ error: "Notifikasi tidak dapat dipublikasikan." }, { status: 500, headers })
  }
}
