import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { getPrismaClient } from "@/lib/prisma"
import type { AppRole } from "@/types/auth"
import { normalizePhoneNumber } from "@/lib/phone"

export interface SeedUserInput {
  name: string
  phone: string
  email?: string
  role: AppRole
  status: string
  avatar?: string
  password: string
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&q=80"

export const DEFAULT_AUTH_USERS: SeedUserInput[] = [
  {
    name: "Desandi",
    email: "superadmin@lazisnu.id",
    phone: "081461230523",
    role: "super_admin_pc",
    status: "Aktif",
    avatar: DEFAULT_AVATAR,
    password: "admin123",
  },
  {
    name: "Desandi Herdiansyah",
    email: "desandi@lazisnu.garut",
    phone: "081234567890",
    role: "super_admin_pc",
    status: "Aktif",
    avatar: DEFAULT_AVATAR,
    password: "admin123",
  },
  {
    name: "Siti Nurhaliza",
    email: "siti@lazisnu.garut",
    phone: "081234567891",
    role: "admin_pc",
    status: "Aktif",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80",
    password: "admin123",
  },
  {
    name: "Muhammad Iqbal",
    email: "iqbal@lazisnu.garut",
    phone: "081234567892",
    role: "admin_upzis",
    status: "Menunggu",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80",
    password: "admin123",
  },
  {
    name: "Dewi Anggraeni",
    email: "dewi@lazisnu.garut",
    phone: "081234567893",
    role: "admin_kordes",
    status: "Aktif",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&q=80",
    password: "admin123",
  },
  {
    name: "H. Abdul Karim",
    email: "karim@lazisnu.garut",
    phone: "081234567894",
    role: "admin_upzis",
    status: "Nonaktif",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80",
    password: "admin123",
  },
]

export async function ensureDefaultUsers() {
  const prisma = getPrismaClient()
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) return

  await Promise.all(
    DEFAULT_AUTH_USERS.map(async (user) => {
      const passwordHash = await bcrypt.hash(user.password, 10)
      await prisma.$executeRaw`
        INSERT INTO "User" (id, name, phone, email, "passwordHash", role, status, avatar, "updatedAt")
        VALUES (${randomUUID()}, ${user.name}, ${normalizePhoneNumber(user.phone)}, ${user.email ?? null}, ${passwordHash}, ${user.role}, ${user.status}, ${user.avatar ?? null}, NOW())
      `
    }),
  )
}
