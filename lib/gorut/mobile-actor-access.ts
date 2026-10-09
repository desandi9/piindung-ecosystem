import { cookies } from "next/headers"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import {
  resolveKordesMobileAccessRecord,
  resolveMunfiqMobileAccessRecord,
  resolvePlpkMobileAccessRecord,
  type ActorAccess,
  type KordesMobileProfile,
  type MobileUserAccessRecord,
  type MunfiqMobileAccess,
  type PlpkMobileProfile,
} from "./mobile-actor-access-pure"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"

type SessionFailure = { kind: "unauthenticated" } | { kind: "unavailable" }
export type CurrentPlpkMobileAccess = ActorAccess<PlpkMobileProfile> | SessionFailure
export type CurrentKordesMobileAccess = ActorAccess<KordesMobileProfile> | SessionFailure
export type CurrentMunfiqMobileAccess = MunfiqMobileAccess | SessionFailure

async function resolveCurrentMobileUser(): Promise<{ kind: "authenticated"; user: MobileUserAccessRecord } | SessionFailure> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { kind: "unauthenticated" }

  try {
    const user = await getPrismaClient().user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        gorutAssignments: {
          where: { isActive: true },
          orderBy: { id: "asc" },
          take: 2,
          select: {
            id: true,
            role: true,
            kecamatanId: true,
            rantingId: true,
            plpkId: true,
            isActive: true,
            ranting: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                kecamatan: { select: { name: true, isActive: true } },
              },
            },
            plpk: {
              select: {
                id: true,
                code: true,
                isActive: true,
                ranting: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true,
                    kecamatan: { select: { name: true, isActive: true } },
                    assignments: {
                      where: { role: "RANTING", isActive: true, user: { status: "Aktif" } },
                      orderBy: { id: "asc" },
                      take: 1,
                      select: { user: { select: { name: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    if (!user) return { kind: "unauthenticated" }
    return { kind: "authenticated", user: { ...user, assignments: user.gorutAssignments } }
  } catch {
    return { kind: "unavailable" }
  }
}

export async function resolveCurrentPlpkMobileAccess(): Promise<CurrentPlpkMobileAccess> {
  const current = await resolveCurrentMobileUser()
  return current.kind === "authenticated" ? resolvePlpkMobileAccessRecord(current.user) : current
}

export async function resolveCurrentKordesMobileAccess(): Promise<CurrentKordesMobileAccess> {
  const current = await resolveCurrentMobileUser()
  return current.kind === "authenticated" ? resolveKordesMobileAccessRecord(current.user) : current
}

export async function resolveCurrentMunfiqMobileAccess(): Promise<CurrentMunfiqMobileAccess> {
  const current = await resolveCurrentMobileUser()
  return current.kind === "authenticated" ? resolveMunfiqMobileAccessRecord(current.user) : current
}
