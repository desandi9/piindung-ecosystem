import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Satu client per instance, juga di production: client baru per panggilan membuka pool
// koneksi baru ke database setiap kali (lambat, dan koneksinya tidak pernah ditutup).
export function getPrismaClient() {
  globalForPrisma.prisma ??= new PrismaClient()
  return globalForPrisma.prisma
}
