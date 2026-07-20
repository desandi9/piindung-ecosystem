import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { registeredModules } from "@/lib/portal-access"
import { getModuleGrantsForUserIds } from "@/lib/portal-access-server"
import { requireUserManagementAccess, serializeUserDetail, updateCentralUser, validateModules, validateUserPayload } from "@/lib/portal-user-management-server"
import { isAppRole, isUserStatus, normalizeEmail } from "@/lib/portal-user-management"
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone"

const userSelect = { id: true, name: true, email: true, phone: true, role: true, status: true, avatar: true, createdAt: true, updatedAt: true } as const

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const required = await requireUserManagementAccess()
  if (required.response) return required.response
  const { id } = await Promise.resolve(params)
  const user = await getPrismaClient().user.findUnique({ where: { id }, select: userSelect })
  if (!user) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 })
  const grants = (await getModuleGrantsForUserIds([id])).get(id) ?? []
  const modules = registeredModules.map((module) => {
    const enabled = user.role === "super_admin_pc" || grants.some((grant) => grant.moduleKey === module.key && grant.enabled)
    return { ...module, enabled, effective: user.status === "Aktif" && enabled }
  })
  return NextResponse.json({ user: serializeUserDetail(user, modules) })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const required = await requireUserManagementAccess()
  if (required.response) return required.response
  try {
    const { id } = await Promise.resolve(params)
    const body = (await request.json()) as Record<string, unknown>
    const validation = validateUserPayload(body, true)
    if (validation) return NextResponse.json({ error: validation }, { status: 400 })
    if (body.password !== undefined) return NextResponse.json({ error: "Password tidak dapat diubah melalui pembaruan umum." }, { status: 400 })
    const current = await getPrismaClient().user.findUnique({ where: { id }, select: userSelect })
    if (!current) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 })
    const nextRole = body.role === undefined ? current.role : body.role
    const nextStatus = body.status === undefined ? current.status : body.status
    if (!isAppRole(nextRole) || !isUserStatus(nextStatus)) return NextResponse.json({ error: "Role atau status tidak valid." }, { status: 400 })
    const phone = body.phone === undefined ? current.phone : normalizePhoneNumber(String(body.phone))
    if (!isValidPhoneNumber(phone)) return NextResponse.json({ error: "Nomor HP tidak valid." }, { status: 400 })
    const modules = validateModules(body.modules)
    if (!modules) return NextResponse.json({ error: "Assignment modul tidak valid." }, { status: 400 })
    const result = await updateCentralUser(required.actor.id, id, { name: body.name === undefined ? current.name : String(body.name).trim(), email: body.email === undefined ? (current.email ?? "") : normalizeEmail(String(body.email)), phone, role: nextRole, status: nextStatus, avatar: body.avatar === undefined ? current.avatar : String(body.avatar).trim() || null, modules })
    const grants = (await getModuleGrantsForUserIds([id])).get(id) ?? []
    const moduleDetails = registeredModules.map((module) => {
      const enabled = result.after.role === "super_admin_pc" || grants.some((grant) => grant.moduleKey === module.key && grant.enabled)
      return { ...module, enabled, effective: result.after.status === "Aktif" && enabled }
    })
    return NextResponse.json({ user: serializeUserDetail(result.after, moduleDetails) })
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 })
    if (error instanceof Error && error.message === "SELF_CHANGE") return NextResponse.json({ error: "Role dan status akun sendiri tidak dapat diubah." }, { status: 403 })
    if (error instanceof Error && error.message === "LAST_SUPER_ADMIN") return NextResponse.json({ error: "Sistem harus memiliki minimal satu Super Admin PC aktif." }, { status: 409 })
    if (error instanceof Error && error.message === "DUPLICATE") return NextResponse.json({ error: "Email atau nomor HP sudah digunakan." }, { status: 409 })
    return NextResponse.json({ error: "Gagal memperbarui pengguna." }, { status: 500 })
  }
}
