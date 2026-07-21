import "server-only"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { randomUUID } from "crypto"
import type { NextRequest } from "next/server"
import { verificationUrl } from "@/lib/member-identity"
import { validatePasswordInput, type ProfilePatch } from "./account-profile"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"

const profileSelect = {
  memberId: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
} as const

const passwordSelect = {
  passwordHash: true,
  status: true,
} as const

export async function currentAccount(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) return { kind: "unauthenticated" as const }
  const session = await verifySessionToken(token, AUTH_SECRET)
  if (!session) return { kind: "unauthenticated" as const }
  const user = await getPrismaClient().user.findUnique({
    where: { id: session.sub },
    select: { id: true, ...profileSelect },
  })
  if (!user) return { kind: "unauthenticated" as const }
  if (user.status !== "Aktif") return { kind: "inactive" as const, user }
  return { kind: "active" as const, user }
}

async function writeAudit(tx: Prisma.TransactionClient, actorId: string, action: string, field?: string, before?: unknown, after?: unknown) {
  await tx.appRecord.create({
    data: {
      id: randomUUID(),
      scope: "portal-user-audit",
      key: `self-${randomUUID()}`,
      data: {
        actorId,
        targetUserId: actorId,
        action,
        ...(field ? { field, before, after } : {}),
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  })
}

export async function updateCurrentAccount(actorId: string, patch: ProfilePatch) {
  try {
    return await getPrismaClient().$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id: actorId },
        select: profileSelect,
      })
      if (!before || before.status !== "Aktif") throw new Error("INACTIVE")
      const after = await tx.user.update({
        where: { id: actorId },
        data: patch,
        select: profileSelect,
      })
      for (const [field, action] of [
        ["name", "self_profile_name_changed"],
        ["email", "self_profile_email_changed"],
        ["phone", "self_profile_phone_changed"],
        ["avatar", "self_profile_avatar_changed"],
      ] as const) {
        if (before[field] !== after[field]) {
          await writeAudit(
            tx,
            actorId,
            action,
            field,
            field === "avatar" ? Boolean(before[field]) : before[field],
            field === "avatar" ? Boolean(after[field]) : after[field],
          )
        }
      }
      return after
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("DUPLICATE")
    }
    throw error
  }
}

export async function changeCurrentPassword(actorId: string, currentPassword: string, newPassword: string, confirmPassword: string) {
  const check = validatePasswordInput(currentPassword, newPassword, confirmPassword)
  if (!check.valid) throw new Error("INVALID_PASSWORD")
  return getPrismaClient().$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: actorId },
      select: passwordSelect,
    })
    if (!user || user.status !== "Aktif") throw new Error("INACTIVE")
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new Error("INVALID_PASSWORD")
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await tx.user.update({
      where: { id: actorId },
      data: { passwordHash },
    })
    await writeAudit(tx, actorId, "self_password_changed")
  })
}

export function currentVerificationUrl(memberId: string) {
  return verificationUrl(memberId)
}
