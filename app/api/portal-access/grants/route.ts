import { NextResponse } from "next/server"
import { isRegisteredModuleKey } from "@/lib/portal-access"
import { listPortalUsersWithModules, requirePortalPermission, setModuleGrant } from "@/lib/portal-access-server"

export async function GET() {
  const required = await requirePortalPermission("access.manage")
  if (required.response) return required.response
  try {
    const users = await listPortalUsersWithModules()
    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ error: "Data akses belum dapat dimuat." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const required = await requirePortalPermission("access.manage")
  if (required.response) return required.response
  try {
    const body = (await request.json()) as { userId?: unknown; moduleKey?: unknown; enabled?: unknown }
    if (typeof body.userId !== "string" || typeof body.moduleKey !== "string" || typeof body.enabled !== "boolean") return NextResponse.json({ error: "Data akses tidak valid." }, { status: 400 })
    if (!isRegisteredModuleKey(body.moduleKey)) return NextResponse.json({ error: "Modul tidak terdaftar." }, { status: 400 })
    const userId = body.userId
    const moduleKey = body.moduleKey
    const enabled = body.enabled
    const targetUser = await import("@/lib/prisma").then(({ getPrismaClient }) => getPrismaClient().user.findUnique({ where: { id: userId }, select: { id: true, status: true } }))
    if (!targetUser) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 })
    const record = await setModuleGrant(userId, moduleKey, enabled, required.access.user.id)
    return NextResponse.json({ grant: { userId, moduleKey, enabled }, updatedAt: record?.updatedAt ?? null })
  } catch {
    return NextResponse.json({ error: "Akses modul belum dapat disimpan." }, { status: 500 })
  }
}
