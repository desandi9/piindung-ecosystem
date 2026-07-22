import { NextResponse } from "next/server"
import { requirePortalPermission } from "@/lib/portal-access-server"
import { withdrawNotification } from "@/lib/portal-notifications-server"

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const required = await requirePortalPermission("notifications.manage")
  if (required.response) return required.response
  const result = await withdrawNotification((await params).id, required.access.user.id)
  if (!result) return NextResponse.json({ error: "Notifikasi tidak ditemukan." }, { status: 404, headers: { "Cache-Control": "private, no-store" } })
  return NextResponse.json({ notification: { id: result.id, withdrawnAt: result.withdrawnAt?.toISOString() ?? null } }, { headers: { "Cache-Control": "private, no-store" } })
}
