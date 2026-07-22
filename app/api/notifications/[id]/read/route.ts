import { NextResponse } from "next/server"
import { requirePortalPermission } from "@/lib/portal-access-server"
import { markNotificationRead } from "@/lib/portal-notifications-server"
import { validateMutationRequest } from "@/lib/request-security"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store" }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const failure = validateMutationRequest(request, { json: false })
  if (failure) return NextResponse.json({ error: failure.error }, { status: failure.status, headers })
  try {
    const required = await requirePortalPermission("notifications.view")
    if (required.response) return required.response
    const { id } = await params
    const marked = await markNotificationRead(id, required.access.user.id, required.access.user.role)
    if (!marked) return NextResponse.json({ error: "Notifikasi tidak ditemukan." }, { status: 404, headers })
    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    return NextResponse.json({ error: "Notifikasi tidak dapat diperbarui." }, { status: 500, headers })
  }
}
