import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { Prisma } from "@prisma/client"
import { getPrismaClient } from "@/lib/prisma"
import { resolveCurrentPortalAccess, getModuleGrantsForUserIds, setModuleGrant } from "@/lib/portal-access-server"
import { isRegisteredModuleKey, registeredModules, type RegisteredModuleKey } from "@/lib/portal-access"
import { canChangeCentralUser, isAppRole, isUserStatus, normalizeEmail, type UserStatus } from "@/lib/portal-user-management"
import { generateMemberId } from "@/lib/member-identity"
import type { AppRole } from "@/types/auth"

export const userAuditScope = "portal-user-audit"
const userSelect = { id: true, memberId: true, name: true, email: true, phone: true, role: true, status: true, avatar: true, createdAt: true, updatedAt: true } as const
type DbUser = Prisma.UserGetPayload<{ select: typeof userSelect }>
type ModuleAssignment = { key: RegisteredModuleKey; enabled: boolean }

export function serializeUserListItem(user: { id: string; memberId?: string; name: string; email: string | null; role: string; status: string; createdAt: Date; updatedAt: Date; phone?: string; avatar?: string | null }, modules: Array<{ key: RegisteredModuleKey; name: string; route: string }> = []) {
  return { id: user.id, ...(user.memberId ? { memberId: user.memberId } : {}), name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString(), modules: modules.map(({ key, name, route }) => ({ key, name, route })) }
}

export function serializeUserDetail(user: { id: string; memberId?: string; name: string; email: string | null; role: string; status: string; createdAt: Date; updatedAt: Date; phone?: string; avatar?: string | null }, modules: Array<{ key: RegisteredModuleKey; name: string; route: string; enabled: boolean; effective: boolean }>) {
  return { ...serializeUserListItem(user), phone: user.phone, avatar: user.avatar, modules }
}

export function mapManagedUser(user: DbUser, modules: Array<{ key: RegisteredModuleKey; name: string; route: string }> = []) {
  return serializeUserListItem(user, modules)
}

export async function requireUserManagementAccess() {
  const access = await resolveCurrentPortalAccess()
  if (access.kind === "unauthenticated") return { response: Response.json({ error: "Sesi tidak ditemukan." }, { status: 401 }) }
  if (access.kind === "inactive") return { response: Response.json({ error: "Akun tidak aktif." }, { status: 403 }) }
  if (!access.permissions.includes("users.manage")) return { response: Response.json({ error: "Akses tidak diizinkan." }, { status: 403 }) }
  return { actor: access.user }
}

export function validateModules(value: unknown): ModuleAssignment[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null
  const seen = new Set<string>()
  const modules: ModuleAssignment[] = []
  for (const assignment of value) {
    if (!assignment || typeof assignment !== "object") return null
    const item = assignment as Record<string, unknown>
    if (typeof item.key !== "string" || !isRegisteredModuleKey(item.key) || typeof item.enabled !== "boolean" || seen.has(item.key)) return null
    seen.add(item.key); modules.push({ key: item.key, enabled: item.enabled })
  }
  return modules
}

export function validateUserPayload(body: Record<string, unknown>, partial = false) {
  const allowed = ["name", "email", "phone", "role", "status", "avatar", "password", "modules"]
  if (Object.keys(body).some((key) => !allowed.includes(key))) return "Field pengguna tidak didukung."
  if (body.memberId !== undefined) return "Pembaruan memberId tidak diizinkan."
  if (!partial && (typeof body.name !== "string" || typeof body.email !== "string" || typeof body.phone !== "string" || typeof body.password !== "string" || typeof body.role !== "string" || typeof body.status !== "string")) return "Data pengguna belum lengkap."
  if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 2)) return "Nama pengguna tidak valid."
  if (body.email !== undefined && (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(normalizeEmail(body.email)))) return "Email pengguna tidak valid."
  if (body.phone !== undefined && typeof body.phone !== "string") return "Nomor HP tidak valid."
  if (body.role !== undefined && !isAppRole(body.role)) return "Role pengguna tidak valid."
  if (body.status !== undefined && !isUserStatus(body.status)) return "Status akun tidak valid."
  if (body.password !== undefined && (typeof body.password !== "string" || body.password.length < 8)) return "Password minimal 8 karakter."
  if (validateModules(body.modules) === null) return "Assignment modul tidak valid."
  return null
}

function auditData(actorId: string, targetUserId: string, action: string, before: Record<string, unknown>, after: Record<string, unknown>) {
  return { actorId, targetUserId, action, before, after, timestamp: new Date().toISOString() }
}

async function writeUserAuditWithClient(client: Pick<Prisma.TransactionClient, "appRecord">, actorId: string, targetUserId: string, action: string, before: Record<string, unknown>, after: Record<string, unknown>) {
  await client.appRecord.create({ data: { id: randomUUID(), scope: userAuditScope, key: `user-${randomUUID()}`, data: auditData(actorId, targetUserId, action, before, after) as Prisma.InputJsonValue } })
}

export async function writeUserAudit(actorId: string, targetUserId: string, action: string, before: Record<string, unknown>, after: Record<string, unknown>) {
  await getPrismaClient().$transaction((tx) => writeUserAuditWithClient(tx, actorId, targetUserId, action, before, after))
}

export async function createCentralUser(actorId: string, input: { name: string; email: string; phone: string; role: AppRole; status: UserStatus; password: string; avatar?: string; modules: ModuleAssignment[] }) {
  const passwordHash = await bcrypt.hash(input.password, 10)
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await getPrismaClient().$transaction(async (tx) => {
        const user = await tx.user.create({ data: { memberId: generateMemberId(), name: input.name.trim(), email: normalizeEmail(input.email), phone: input.phone, passwordHash, role: input.role, status: input.status, avatar: input.avatar?.trim() || null }, select: userSelect })
        await writeUserAuditWithClient(tx, actorId, user.id, "user_created", {}, { name: user.name, email: user.email, role: user.role, status: user.status })
        for (const module of input.modules) await setModuleGrant(user.id, module.key, module.enabled, actorId, tx)
        return user
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        if (Array.isArray(error.meta?.target) && error.meta.target.includes("memberId")) continue
        throw new Error("DUPLICATE")
      }
      throw error
    }
  }
  throw new Error("MEMBER_ID_COLLISION")
}

export async function updateCentralUser(actorId: string, targetId: string, input: { name: string; email: string; phone: string; role: AppRole; status: UserStatus; avatar: string | null; modules: ModuleAssignment[] }) {
  try {
    return await getPrismaClient().$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: targetId }, select: userSelect })
      if (!target) throw new Error("NOT_FOUND")
      const activeSuperAdminCount = await tx.user.count({ where: { role: "super_admin_pc", status: "Aktif" } })
      if (!canChangeCentralUser(actorId, target, input, activeSuperAdminCount)) throw new Error(actorId === targetId ? "SELF_CHANGE" : "LAST_SUPER_ADMIN")
      const updated = await tx.user.update({ where: { id: targetId }, data: { name: input.name, email: normalizeEmail(input.email), phone: input.phone, role: input.role, status: input.status, avatar: input.avatar }, select: userSelect })
      const changes: Array<[string, string]> = []
      if (target.name !== updated.name) changes.push(["user_name_changed", "name"])
      if (target.email !== updated.email) changes.push(["user_email_changed", "email"])
      if (target.role !== updated.role) changes.push(["user_role_changed", "role"])
      if (target.status !== updated.status) changes.push([updated.status === "Aktif" ? "user_activated" : "user_deactivated", "status"])
      for (const [action, field] of changes) await writeUserAuditWithClient(tx, actorId, targetId, action, { [field]: target[field as keyof DbUser] }, { [field]: updated[field as keyof DbUser] })
      for (const module of input.modules) await setModuleGrant(targetId, module.key, module.enabled, actorId, tx)
      return { before: target, after: updated }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("DUPLICATE")
    throw error
  }
}

export async function getUserModules(users: Array<Pick<DbUser, "id" | "role" | "status">>) {
  const grantsByUser = await getModuleGrantsForUserIds(users.map((user) => user.id))
  return new Map(users.map((user) => [user.id, registeredModules.filter((module) => user.status === "Aktif" && (user.role === "super_admin_pc" || grantsByUser.get(user.id)?.some((grant) => grant.moduleKey === module.key && grant.enabled)))]))
}
