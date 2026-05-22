import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { ensureDefaultUsers } from "@/lib/auth-server"
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone"

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

export async function GET() {
  try {
    const prisma = getPrismaClient()
    await ensureDefaultUsers()
    const users = await prisma.$queryRaw<Array<{
      id: string
      name: string
      email: string | null
      phone: string
      role: string
      status: string
      avatar: string | null
      lastLoginAt: Date | null
    }>>`SELECT id, name, email, phone, role, status, avatar, "lastLoginAt" FROM "User" ORDER BY "createdAt" DESC`
    return NextResponse.json({ users: users.map(mapUser) })
  } catch (error) {
    console.error("Users fetch error", error)
    return NextResponse.json({ error: "Gagal mengambil data pengguna." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrismaClient()
    const body = (await request.json()) as {
      name?: string
      email?: string
      phone?: string
      role?: string
      status?: string
      avatar?: string
      password?: string
    }

    if (!body.name || !body.phone || !body.password || !body.role || !body.status) {
      return NextResponse.json({ error: "Data pengguna belum lengkap." }, { status: 400 })
    }

    const phone = normalizePhoneNumber(body.phone)
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json({ error: "Nomor HP tidak valid." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(body.password, 10)
    const users = await prisma.$queryRaw<Array<{
      id: string
      name: string
      email: string | null
      phone: string
      role: string
      status: string
      avatar: string | null
      lastLoginAt: Date | null
    }>>`
      INSERT INTO "User" (id, name, phone, email, "passwordHash", role, status, avatar, "updatedAt")
      VALUES (${randomUUID()}, ${body.name}, ${phone}, ${body.email?.trim() || null}, ${passwordHash}, ${body.role}, ${body.status}, ${body.avatar?.trim() || null}, NOW())
      RETURNING id, name, email, phone, role, status, avatar, "lastLoginAt"
    `

    return NextResponse.json({ user: mapUser(users[0]) }, { status: 201 })
  } catch (error) {
    console.error("Users create error", error)
    return NextResponse.json({ error: "Gagal membuat pengguna." }, { status: 500 })
  }
}
