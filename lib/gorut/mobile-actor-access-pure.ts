import type { GorutOperationalRole } from "@prisma/client"

export const gorutMobilePaths = {
  MUNFIQ: "/gorut-v2/mobile/munfiq",
  PLPK: "/gorut-v2/mobile/plpk",
  KORDES: "/gorut-v2/mobile/kordes",
} as const

export type MobileActorType = keyof typeof gorutMobilePaths

export type MobileActorIdentity = {
  displayName: string
  actorType: MobileActorType
  assignmentLabel: string
  regionLabel: string
  initials: string
}

export type PlpkMobileProfile = {
  identity: MobileActorIdentity
  plpkId: string
  name: string
  phone: string
  village: string
  kecamatan: string
  kordesName: string
  upzis: string
  joinedAt: string
}

export type KordesMobileProfile = {
  identity: MobileActorIdentity
  rantingCode: string
  name: string
  phone: string
  village: string
  kecamatan: string
  upzis: string
}

export type MobileAssignmentRecord = {
  id: string
  role: GorutOperationalRole
  kecamatanId: string | null
  rantingId: string | null
  plpkId: string | null
  isActive: boolean
  plpk: {
    id: string
    code: string
    isActive: boolean
    ranting: {
      id: string
      name: string
      isActive: boolean
      kecamatan: { name: string; isActive: boolean }
      assignments: Array<{ user: { name: string } }>
    }
  } | null
  ranting: {
    id: string
    code: string
    name: string
    isActive: boolean
    kecamatan: { name: string; isActive: boolean }
  } | null
}

export type MobileUserAccessRecord = {
  id: string
  name: string
  phone: string
  status: string
  createdAt: Date
  assignments: MobileAssignmentRecord[]
}

export type ActorAccess<TProfile> =
  | { kind: "authorized"; profile: TProfile }
  | { kind: "inactive" }
  | { kind: "forbidden" }

export type MunfiqMobileAccess =
  | { kind: "inactive" }
  | { kind: "contract-gap" }

export function gorutMobileLoginPath(actorType: MobileActorType) {
  return `/login?next=${gorutMobilePaths[actorType]}`
}

export function resolveMobileEntry(kind: "authorized" | "unauthenticated" | "inactive" | "forbidden" | "unavailable" | "contract-gap", actorType: MobileActorType) {
  if (kind === "unauthenticated") return { kind: "redirect" as const, location: gorutMobileLoginPath(actorType) }
  if (kind === "authorized") return { kind: "render" as const }
  return { kind: "deny" as const }
}

function initials(name: string) {
  const value = (name.match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
  return value || "?"
}

function actorIdentity(displayName: string, actorType: MobileActorType, assignmentLabel: string, regionLabel: string): MobileActorIdentity {
  return { displayName, actorType, assignmentLabel, regionLabel, initials: initials(displayName) }
}

export function resolvePlpkMobileAccessRecord(user: MobileUserAccessRecord): ActorAccess<PlpkMobileProfile> {
  if (user.status !== "Aktif") return { kind: "inactive" }
  if (user.assignments.length !== 1) return { kind: "forbidden" }

  const assignment = user.assignments[0]
  const plpk = assignment?.plpk
  if (
    !assignment || !assignment.isActive || assignment.role !== "PLPK" ||
    assignment.kecamatanId !== null || assignment.rantingId !== null || !assignment.plpkId ||
    !plpk || assignment.plpkId !== plpk.id || !plpk.isActive ||
    !plpk.ranting.isActive || !plpk.ranting.kecamatan.isActive
  ) return { kind: "forbidden" }

  const assignmentLabel = `PLPK ${plpk.ranting.name}`
  const regionLabel = `${plpk.ranting.name}, Kecamatan ${plpk.ranting.kecamatan.name}`
  return {
    kind: "authorized",
    profile: {
      identity: actorIdentity(user.name, "PLPK", assignmentLabel, regionLabel),
      plpkId: plpk.code,
      name: user.name,
      phone: user.phone,
      village: plpk.ranting.name,
      kecamatan: plpk.ranting.kecamatan.name,
      kordesName: plpk.ranting.assignments[0]?.user.name ?? `Kordes ${plpk.ranting.name}`,
      upzis: `UPZIS ${plpk.ranting.kecamatan.name}`,
      joinedAt: user.createdAt.toISOString(),
    },
  }
}

export function resolveKordesMobileAccessRecord(user: MobileUserAccessRecord): ActorAccess<KordesMobileProfile> {
  if (user.status !== "Aktif") return { kind: "inactive" }
  if (user.assignments.length !== 1) return { kind: "forbidden" }

  const assignment = user.assignments[0]
  const ranting = assignment?.ranting
  if (
    !assignment || !assignment.isActive || assignment.role !== "RANTING" ||
    assignment.kecamatanId !== null || !assignment.rantingId || assignment.plpkId !== null ||
    !ranting || assignment.rantingId !== ranting.id || !ranting.isActive || !ranting.kecamatan.isActive
  ) return { kind: "forbidden" }

  const assignmentLabel = `Kordes ${ranting.name}`
  const regionLabel = `${ranting.name}, Kecamatan ${ranting.kecamatan.name}`
  return {
    kind: "authorized",
    profile: {
      identity: actorIdentity(user.name, "KORDES", assignmentLabel, regionLabel),
      rantingCode: ranting.code,
      name: user.name,
      phone: user.phone,
      village: ranting.name,
      kecamatan: ranting.kecamatan.name,
      upzis: `UPZIS ${ranting.kecamatan.name}`,
    },
  }
}

/** GorutMunfiq currently has no canonical User relation; never infer one from phone/name. */
export function resolveMunfiqMobileAccessRecord(user: MobileUserAccessRecord): MunfiqMobileAccess {
  return user.status === "Aktif" ? { kind: "contract-gap" } : { kind: "inactive" }
}
