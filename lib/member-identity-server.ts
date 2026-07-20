import { Prisma } from "@prisma/client"
import { getPrismaClient } from "@/lib/prisma"
import { resolveCurrentPortalAccess } from "@/lib/portal-access-server"
import { roleDisplayNames } from "@/features/auth/role-config"
import { generateMemberId, normalizeMemberId, verificationUrl, serializePublicMember } from "@/lib/member-identity"
import type { AppRole } from "@/types/auth"

export const organizationLabel = "NU Care-LAZISNU Kabupaten Garut"

export async function issueUniqueMemberId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const memberId = generateMemberId()
    const exists = await getPrismaClient().user.findUnique({ where: { memberId }, select: { id: true } })
    if (!exists) return memberId
  }
  throw new Error("MEMBER_ID_COLLISION")
}

export async function currentMemberIdentity() {
  const access = await resolveCurrentPortalAccess()
  if (access.kind !== "authorized") return access
  const user = await getPrismaClient().user.findUnique({ where: { id: access.user.id }, select: { memberId: true, name: true, role: true, status: true, avatar: true } })
  if (!user) return { kind: "unauthenticated" as const }
  const memberId = user.memberId
  return { kind: "authorized" as const, identity: { memberId, name: user.name, role: roleDisplayNames[user.role as AppRole], status: user.status, avatar: user.avatar, organization: organizationLabel, verificationUrl: verificationUrl(memberId), qrUrl: `/api/public/verify/${encodeURIComponent(memberId)}/qr` } }
}

export async function findPublicMember(memberId: string) {
  const normalized = normalizeMemberId(memberId)
  const user = await getPrismaClient().user.findUnique({ where: { memberId: normalized }, select: { memberId: true, name: true, role: true, status: true } })
  if (!user) return null
  return serializePublicMember({ ...user, role: user.role as AppRole }, roleDisplayNames[user.role as AppRole] ?? "Anggota PIINDUNG", organizationLabel)
}

export async function createUserWithMemberId(data: Omit<Prisma.UserCreateInput, "memberId">, select: Prisma.UserSelect) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await getPrismaClient().user.create({ data: { ...data, memberId: generateMemberId() }, select })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && Array.isArray(error.meta?.target) && error.meta.target.includes("memberId"))) throw error
    }
  }
  throw new Error("MEMBER_ID_COLLISION")
}
