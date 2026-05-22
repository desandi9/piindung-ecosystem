import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const prisma = new PrismaClient()

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
  }

  return prisma
}
