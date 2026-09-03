import { randomUUID } from "crypto"
import { GorutMunfiqAccountLinkStatus, Prisma, type PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import { getPrismaClient } from "@/lib/prisma"
import { roleHasPortalPermission } from "@/lib/portal-access"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { json } from "@/lib/gorut/server"
import {
  resolveGorutMunfiqSelfContext,
  type GorutMunfiqSelfContext,
} from "@/lib/gorut-munfiq-identity-pure"
import type { GorutMunfiqLinkInput } from "@/lib/gorut-munfiq-identity-api"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const linkSelect = {
  linkCode: true,
  status: true,
  linkedAt: true,
  revokedAt: true,
  reason: true,
  revokedReason: true,
  user: { select: { memberId: true } },
  munfiq: { select: { code: true } },
} satisfies Prisma.GorutMunfiqAccountLinkSelect

export const gorutMunfiqIdentityErrorCodes = [
  "IDENTITY_ADMIN_ACCESS_DENIED",
  "IDENTITY_USER_NOT_FOUND",
  "IDENTITY_USER_INACTIVE",
  "IDENTITY_USER_ROLE_INVALID",
  "IDENTITY_MUNFIQ_NOT_FOUND",
  "IDENTITY_USER_ALREADY_LINKED",
  "IDENTITY_MUNFIQ_ALREADY_LINKED",
  "IDENTITY_ACTIVE_LINK_NOT_FOUND",
  "IDENTITY_ACTIVE_LINK_AMBIGUOUS",
  "IDENTITY_REVOKE_TARGET_MISMATCH",
  "IDENTITY_CONCURRENT_CONFLICT",
] as const

export type GorutMunfiqIdentityErrorCode = (typeof gorutMunfiqIdentityErrorCodes)[number]

export class GorutMunfiqIdentityError extends Error {
  constructor(public readonly code: GorutMunfiqIdentityErrorCode, message: string) {
    super(message)
    this.name = "GorutMunfiqIdentityError"
  }
}

function publicLink(link: Prisma.GorutMunfiqAccountLinkGetPayload<{ select: typeof linkSelect }>, idempotent = false) {
  return {
    linkCode: link.linkCode,
    userMemberId: link.user.memberId,
    munfiqCode: link.munfiq.code,
    status: link.status,
    linkedAt: link.linkedAt.toISOString(),
    revokedAt: link.revokedAt?.toISOString() ?? null,
    reason: link.reason,
    revokedReason: link.revokedReason,
    idempotent,
  }
}

async function assertAdministrativeAuthority(tx: Prisma.TransactionClient, actorUserId: string) {
  const actor = await tx.user.findUnique({ where: { id: actorUserId }, select: { id: true, role: true, status: true } })
  if (!actor || actor.status !== "Aktif" || !roleHasPortalPermission(actor.role, "munfiq.account_links.manage")) {
    throw new GorutMunfiqIdentityError("IDENTITY_ADMIN_ACCESS_DENIED", "Akun tidak memiliki otoritas linking identitas Munfiq.")
  }
  return actor
}

async function resolveLinkTarget(tx: Prisma.TransactionClient, input: GorutMunfiqLinkInput) {
  const [user, munfiq] = await Promise.all([
    tx.user.findUnique({ where: { memberId: input.userMemberId }, select: { id: true, memberId: true, role: true, status: true } }),
    tx.gorutMunfiq.findUnique({ where: { code: input.munfiqCode }, select: { id: true, code: true } }),
  ])
  if (!user) throw new GorutMunfiqIdentityError("IDENTITY_USER_NOT_FOUND", "Akun tujuan tidak ditemukan.")
  if (user.status !== "Aktif") throw new GorutMunfiqIdentityError("IDENTITY_USER_INACTIVE", "Akun tujuan tidak aktif.")
  if (user.role !== "munfiq") throw new GorutMunfiqIdentityError("IDENTITY_USER_ROLE_INVALID", "Akun tujuan bukan akun portal Munfiq.")
  if (!munfiq) throw new GorutMunfiqIdentityError("IDENTITY_MUNFIQ_NOT_FOUND", "Munfiq tujuan tidak ditemukan.")
  return { user, munfiq }
}

function retryable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2025", "P2034"].includes(error.code)
}

async function serializable<T>(prisma: PrismaClient, run: (tx: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (!retryable(error)) throw error
      if (attempt === 3) {
        throw new GorutMunfiqIdentityError("IDENTITY_CONCURRENT_CONFLICT", "Perubahan link bersamaan tidak dapat direkonsiliasi.")
      }
    }
  }
  throw new GorutMunfiqIdentityError("IDENTITY_CONCURRENT_CONFLICT", "Batas retry perubahan link tercapai.")
}

export async function linkUserToGorutMunfiq(prisma: PrismaClient, actorUserId: string, input: GorutMunfiqLinkInput) {
  return serializable(prisma, async (tx) => {
    await assertAdministrativeAuthority(tx, actorUserId)
    const { user, munfiq } = await resolveLinkTarget(tx, input)
    const conflicts = await tx.gorutMunfiqAccountLink.findMany({
      where: { status: GorutMunfiqAccountLinkStatus.ACTIVE, OR: [{ userId: user.id }, { munfiqId: munfiq.id }] },
      select: { id: true, userId: true, munfiqId: true, ...linkSelect },
      orderBy: { id: "asc" },
      take: 3,
    })
    const exact = conflicts.find((link) => link.userId === user.id && link.munfiqId === munfiq.id)
    if (exact && conflicts.length === 1) return publicLink(exact, true)
    if (conflicts.some((link) => link.userId === user.id)) {
      throw new GorutMunfiqIdentityError("IDENTITY_USER_ALREADY_LINKED", "Akun sudah memiliki link Munfiq aktif.")
    }
    if (conflicts.some((link) => link.munfiqId === munfiq.id)) {
      throw new GorutMunfiqIdentityError("IDENTITY_MUNFIQ_ALREADY_LINKED", "Munfiq sudah memiliki link akun aktif.")
    }
    const created = await tx.gorutMunfiqAccountLink.create({
      data: {
        linkCode: `GML-${randomUUID().toUpperCase()}`,
        userId: user.id,
        munfiqId: munfiq.id,
        linkedByUserId: actorUserId,
        reason: input.reason,
      },
      select: linkSelect,
    })
    return publicLink(created)
  })
}

export async function relinkUserToGorutMunfiq(prisma: PrismaClient, actorUserId: string, input: GorutMunfiqLinkInput) {
  return serializable(prisma, async (tx) => {
    await assertAdministrativeAuthority(tx, actorUserId)
    const { user, munfiq } = await resolveLinkTarget(tx, input)
    const current = await tx.gorutMunfiqAccountLink.findMany({
      where: { userId: user.id, status: GorutMunfiqAccountLinkStatus.ACTIVE },
      select: { id: true, userId: true, munfiqId: true, ...linkSelect },
      orderBy: { id: "asc" },
      take: 2,
    })
    if (current.length === 0) throw new GorutMunfiqIdentityError("IDENTITY_ACTIVE_LINK_NOT_FOUND", "Link aktif yang akan diganti tidak ditemukan.")
    if (current.length !== 1) throw new GorutMunfiqIdentityError("IDENTITY_ACTIVE_LINK_AMBIGUOUS", "Link aktif akun tidak tunggal.")
    const previous = current[0]!
    if (previous.munfiqId === munfiq.id) return publicLink(previous, true)

    const targetLinks = await tx.gorutMunfiqAccountLink.findMany({
      where: { munfiqId: munfiq.id, status: GorutMunfiqAccountLinkStatus.ACTIVE },
      select: { id: true },
      take: 2,
    })
    if (targetLinks.length > 0) {
      throw new GorutMunfiqIdentityError("IDENTITY_MUNFIQ_ALREADY_LINKED", "Munfiq tujuan sudah memiliki link akun aktif.")
    }

    const now = new Date()
    const revoked = await tx.gorutMunfiqAccountLink.updateMany({
      where: { id: previous.id, status: GorutMunfiqAccountLinkStatus.ACTIVE },
      data: { status: GorutMunfiqAccountLinkStatus.REVOKED, revokedAt: now, revokedByUserId: actorUserId, revokedReason: input.reason },
    })
    if (revoked.count !== 1) throw new Prisma.PrismaClientKnownRequestError("Concurrent Munfiq relink", { code: "P2034", clientVersion: Prisma.prismaVersion.client })

    const created = await tx.gorutMunfiqAccountLink.create({
      data: {
        linkCode: `GML-${randomUUID().toUpperCase()}`,
        userId: user.id,
        munfiqId: munfiq.id,
        linkedByUserId: actorUserId,
        reason: input.reason,
      },
      select: linkSelect,
    })
    return publicLink(created)
  })
}

export async function revokeUserGorutMunfiqLink(prisma: PrismaClient, actorUserId: string, input: GorutMunfiqLinkInput) {
  return serializable(prisma, async (tx) => {
    await assertAdministrativeAuthority(tx, actorUserId)
    const user = await tx.user.findUnique({ where: { memberId: input.userMemberId }, select: { id: true } })
    if (!user) throw new GorutMunfiqIdentityError("IDENTITY_USER_NOT_FOUND", "Akun tujuan tidak ditemukan.")
    const active = await tx.gorutMunfiqAccountLink.findMany({
      where: { userId: user.id, status: GorutMunfiqAccountLinkStatus.ACTIVE },
      select: { id: true, ...linkSelect },
      orderBy: { id: "asc" },
      take: 2,
    })
    if (active.length === 0) throw new GorutMunfiqIdentityError("IDENTITY_ACTIVE_LINK_NOT_FOUND", "Link aktif tidak ditemukan.")
    if (active.length !== 1) throw new GorutMunfiqIdentityError("IDENTITY_ACTIVE_LINK_AMBIGUOUS", "Link aktif akun tidak tunggal.")
    const current = active[0]!
    if (current.munfiq.code !== input.munfiqCode) {
      throw new GorutMunfiqIdentityError("IDENTITY_REVOKE_TARGET_MISMATCH", "Munfiq tujuan tidak sama dengan link aktif akun.")
    }
    const now = new Date()
    const revoked = await tx.gorutMunfiqAccountLink.updateMany({
      where: { id: current.id, status: GorutMunfiqAccountLinkStatus.ACTIVE },
      data: { status: GorutMunfiqAccountLinkStatus.REVOKED, revokedAt: now, revokedByUserId: actorUserId, revokedReason: input.reason },
    })
    if (revoked.count !== 1) throw new Prisma.PrismaClientKnownRequestError("Concurrent Munfiq revoke", { code: "P2034", clientVersion: Prisma.prismaVersion.client })
    return publicLink({ ...current, status: GorutMunfiqAccountLinkStatus.REVOKED, revokedAt: now, revokedReason: input.reason })
  })
}

export async function resolveGorutMunfiqContextForUser(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      role: true,
      gorutMunfiqAccountLinks: {
        where: { status: GorutMunfiqAccountLinkStatus.ACTIVE },
        orderBy: { id: "asc" },
        take: 2,
        select: {
          userId: true,
          status: true,
          munfiq: { select: { id: true, code: true, name: true, isActive: true } },
        },
      },
    },
  })
  if (!user) return { kind: "unauthenticated" as const }
  return resolveGorutMunfiqSelfContext({ ...user, accountLinks: user.gorutMunfiqAccountLinks })
}

export async function requireGorutMunfiqContext(): Promise<{ context: GorutMunfiqSelfContext } | { response: Response }> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { response: json({ error: "Sesi tidak ditemukan." }, 401) }
  try {
    const resolved = await resolveGorutMunfiqContextForUser(getPrismaClient(), session.sub)
    if (resolved.kind === "unauthenticated") return { response: json({ error: "Sesi tidak ditemukan." }, 401) }
    if (resolved.kind === "inactive-user") return { response: json({ error: "Akun tidak aktif." }, 403) }
    if (resolved.kind !== "authorized") return { response: json({ error: "Akses identitas Munfiq tidak tersedia." }, 403) }
    return { context: resolved.context }
  } catch {
    return { response: json({ error: "Identitas Munfiq tidak dapat diproses." }, 500) }
  }
}
