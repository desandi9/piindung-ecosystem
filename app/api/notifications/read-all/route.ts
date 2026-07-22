import { NextResponse } from "next/server"
import { requirePortalPermission } from "@/lib/portal-access-server"
import { markAllNotificationsRead } from "@/lib/portal-notifications-server"
import { validateMutationRequest } from "@/lib/request-security"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store" }

export async function POST(request: Request) {
  const failure = validateMutationRequest(request, { json: false })
  if (failure) return NextResponse.json({ error: failure.error }, { status: failure.status, headers })
  try {
    const required = await requirePortalPermission("notifications.view")
    if (required.response) return required.response
    const count = await markAllNotificationsRead(required.access.user.id, required.access.user.role)
    return NextResponse.json({ success: true, count }, { headers })
  } catch (error) {
    return NextResponse.json({ error: "Notifikasi tidak dapat diperbarui." }, { status: 500, headers })
  }
}
