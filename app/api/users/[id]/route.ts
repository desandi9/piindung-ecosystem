import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { normalizePhoneNumber } from "@/lib/phone"

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
