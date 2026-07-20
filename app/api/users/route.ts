import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { registeredModules } from "@/lib/portal-access"
import { createCentralUser, getUserModules, serializeUserListItem, requireUserManagementAccess, validateModules, validateUserPayload } from "@/lib/portal-user-management-server"
import { isAppRole, isUserStatus, normalizeEmail } from "@/lib/portal-user-management"
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone"

const userSelect = { id: true, name: true, email: true, phone: true, role: true, status: true, avatar: true, createdAt: true, updatedAt: true } as const

export async function GET(request: Request) {
  const required = await requireUserManagementAccess()
  if (required.response) return required.response
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get("search")?.trim().slice(0, 100) ?? ""
    const role = url.searchParams.get("role") ?? ""
    const status = url.searchParams.get("status") ?? ""
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1)
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 25, 1), 100)
    if (role && !isAppRole(role)) return NextResponse.json({ error: "Role pengguna tidak valid." }, { status: 400 })
    if (status && !isUserStatus(status)) return NextResponse.json({ error: "Status akun tidak valid." }, { status: 400 })
    const where = { ...(role ? { role } : {}), ...(status ? { status } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } : {}) }
    const prisma = getPrismaClient()
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit, select: userSelect }),
      prisma.user.count({ where }),
    ])
    const modulesByUser = await getUserModules(users)
    return NextResponse.json({ users: users.map((user) => serializeUserListItem(user, modulesByUser.get(user.id))), page, limit, total, hasMore: page * limit < total })
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data pengguna." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const required = await requireUserManagementAccess()
  if (required.response) return required.response
  try {
    const body = (await request.json()) as Record<string, unknown>
    const validation = validateUserPayload(body)
    if (validation) return NextResponse.json({ error: validation }, { status: 400 })
    const phone = normalizePhoneNumber(String(body.phone))
    if (!isValidPhoneNumber(phone)) return NextResponse.json({ error: "Nomor HP tidak valid." }, { status: 400 })
    if (!isAppRole(body.role) || !isUserStatus(body.status)) return NextResponse.json({ error: "Data pengguna tidak valid." }, { status: 400 })
    const modules = validateModules(body.modules)
    if (!modules) return NextResponse.json({ error: "Assignment modul tidak valid." }, { status: 400 })
    const user = await createCentralUser(required.actor.id, { name: String(body.name), email: normalizeEmail(String(body.email)), phone, role: body.role, status: body.status, password: String(body.password), avatar: typeof body.avatar === "string" ? body.avatar : undefined, modules })
    const assignedModules = registeredModules.filter((module) => user.status === "Aktif" && (user.role === "super_admin_pc" || modules.some((assignment) => assignment.key === module.key && assignment.enabled)))
    return NextResponse.json({ user: serializeUserListItem(user, assignedModules) }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE") return NextResponse.json({ error: "Email atau nomor HP sudah digunakan." }, { status: 409 })
    return NextResponse.json({ error: "Gagal membuat pengguna." }, { status: 500 })
  }
}
