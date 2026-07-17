import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { normalizePhoneNumber } from "@/lib/phone"
import type { AppRole } from "@/types/auth"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const validRoles: AppRole[] = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"]
const validStatuses = ["Aktif", "Nonaktif"] as const

function formatLastLogin(lastLoginAt: Date | null) {
  if (!lastLoginAt) return "Belum pernah login"

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(lastLoginAt)
}

function mapUser(user: {
  id: string
  name: string
  email: string | null
  phone: string
  role: string
  status: string
  avatar: string | null
  lastLoginAt: Date | null
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? "",
    phone: user.phone,
    role: user.role,
    status: user.status,
    lastLogin: formatLastLogin(user.lastLoginAt),
    avatar: user.avatar ?? "",
    password: "",
    passwordUpdatedAt: undefined,
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
    const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
    if (!session) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 })
    if (session.role !== "super_admin_pc") return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })

    const prisma = getPrismaClient()
    const { id } = await Promise.resolve(params)
    const body = (await request.json()) as {
      name?: string
      email?: string
      phone?: string
      role?: string
      status?: string
      avatar?: string
      password?: string
      passwordUpdatedAt?: string
    }

    const currentUsers = await prisma.$queryRaw<Array<{
      id: string
      name: string
      email: string | null
      phone: string
      role: string
      status: string
      avatar: string | null
      passwordHash: string
      lastLoginAt: Date | null
    }>>`SELECT id, name, email, phone, role, status, avatar, "passwordHash", "lastLoginAt" FROM "User" WHERE id = ${id} LIMIT 1`

    const currentUser = currentUsers[0]
    if (!currentUser) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 })

    if (body.role !== undefined && !validRoles.includes(body.role as AppRole)) {
      return NextResponse.json({ error: "Role pengguna tidak valid." }, { status: 400 })
    }
    if (body.status !== undefined && !validStatuses.includes(body.status as (typeof validStatuses)[number])) {
      return NextResponse.json({ error: "Status akun tidak valid." }, { status: 400 })
    }
    if (id === session.sub && (body.role !== undefined || body.status !== undefined)) {
      return NextResponse.json({ error: "Role dan status akun sendiri tidak dapat diubah." }, { status: 403 })
    }

    const nextRole = body.role ?? currentUser.role
    const nextStatus = body.status ?? currentUser.status
    if (currentUser.role === "super_admin_pc" && currentUser.status === "Aktif" && (nextRole !== "super_admin_pc" || nextStatus !== "Aktif")) {
      const activeSuperAdmins = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "User" WHERE role = 'super_admin_pc' AND status = 'Aktif'`
      if (Number(activeSuperAdmins[0]?.count ?? 0) <= 1) {
        return NextResponse.json({ error: "Aksi diblokir: sistem harus memiliki minimal satu Super Admin PC aktif." }, { status: 409 })
      }
    }

    const nextPasswordHash = body.password ? await bcrypt.hash(body.password, 10) : currentUser.passwordHash
    const phone = body.phone ? normalizePhoneNumber(body.phone) : currentUser.phone
    const email = body.email !== undefined ? (body.email.trim() || null) : currentUser.email
    const avatar = body.avatar !== undefined ? (body.avatar.trim() || null) : currentUser.avatar

    const updatedUsers = await prisma.$queryRaw<Array<{
      id: string
      name: string
      email: string | null
      phone: string
      role: string
      status: string
      avatar: string | null
      lastLoginAt: Date | null
    }>>`
      UPDATE "User"
      SET
        name = ${body.name ?? currentUser.name},
        email = ${email},
        phone = ${phone},
        role = ${body.role ?? currentUser.role},
        status = ${body.status ?? currentUser.status},
        avatar = ${avatar},
        "passwordHash" = ${nextPasswordHash},
        "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, phone, role, status, avatar, "lastLoginAt"
    `

    return NextResponse.json({ user: mapUser(updatedUsers[0]) })
  } catch (error) {
    console.error("Users update error", error)
    return NextResponse.json({ error: "Gagal memperbarui pengguna." }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const prisma = getPrismaClient()
    const { id } = await Promise.resolve(params)
    await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Users delete error", error)
    return NextResponse.json({ error: "Gagal menghapus pengguna." }, { status: 500 })
  }
}
