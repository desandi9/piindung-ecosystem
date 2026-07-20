import type { AppRole } from "@/types/auth"

export const userStatuses = ["Aktif", "Menunggu", "Nonaktif"] as const
export type UserStatus = (typeof userStatuses)[number]
export const appRoles: readonly AppRole[] = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"]

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole)
}

export function isUserStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && userStatuses.includes(value as UserStatus)
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function canManagePortalUsers(hasUsersManage: boolean, active: boolean) {
  return hasUsersManage && active
}

export function classifyDuplicateEmail(existingEmail: string | null | undefined, candidateEmail: string) {
  return existingEmail !== null && existingEmail !== undefined && normalizeEmail(existingEmail) === normalizeEmail(candidateEmail)
}

export function canChangeCentralUser(
  actorId: string,
  target: { id: string; role: string; status: string },
  next: { role: string; status: string },
  activeSuperAdminCount: number,
) {
  if (actorId === target.id && (target.role !== next.role || target.status !== next.status)) return false
  const removesFinalActiveSuperAdmin = target.role === "super_admin_pc" && target.status === "Aktif" && (next.role !== "super_admin_pc" || next.status !== "Aktif")
  return !removesFinalActiveSuperAdmin || activeSuperAdminCount > 1
}

export function serializeManagedUser(user: { id: string; memberId?: string; name: string; email: string | null; role: string; status: string; createdAt: Date; updatedAt: Date }, modules: Array<{ key: string; name: string; route: string }> = []) {
  return {
    id: user.id,
    ...(user.memberId ? { memberId: user.memberId } : {}),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    modules: modules.map(({ key, name, route }) => ({ key, name, route })),
  }
}
