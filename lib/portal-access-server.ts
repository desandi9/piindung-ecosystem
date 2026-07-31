import { randomUUID } from "crypto"
import type { Prisma } from "@prisma/client"
import { cookies } from "next/headers"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { roleHasPortalPermission, registeredModules, isRegisteredModuleKey, type PortalPermission, type RegisteredModuleKey } from "@/lib/portal-access"
import { createSystemNotification } from "@/lib/portal-notifications-server"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const GRANTS_SCOPE = "portal-module-grants"
const AUDIT_SCOPE = "portal-access-audit"

type CurrentUser = { id: string; name: string; role: string; status: string }
type Grant = { userId: string; moduleKey: RegisteredModuleKey; enabled: boolean; updatedAt?: string; actorId?: string }
type GrantStoreClient = Pick<Prisma.TransactionClient, "appRecord" | "portalNotification">

function parseGrantsArray(data: unknown): Grant[] {
  if (!data || typeof data !== "object") return []
  const array = (data as Record<string, unknown>).grants
  if (!Array.isArray(array)) return []
  return array.filter((item): item is Grant => {
    if (!item || typeof item !== "object") return false
    const value = item as Record<string, unknown>
    return typeof value.userId === "string" && typeof value.moduleKey === "string" && isRegisteredModuleKey(value.moduleKey) && typeof value.enabled === "boolean"
  })
}

export async function resolveCurrentPortalAccess() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { kind: "unauthenticated" as const }

  const user = await getPrismaClient().user.findUnique({ where: { id: session.sub }, select: { id: true, name: true, role: true, status: true } })
  if (!user) return { kind: "unauthenticated" as const }
  if (user.status !== "Aktif") return { kind: "inactive" as const, user: user as CurrentUser }

  const grants = await getModuleGrantsForUserIds([user.id]).then((byUser) => byUser.get(user.id) ?? [])
  const canEnter = (moduleKey: RegisteredModuleKey) => user.role === "super_admin_pc" || grants.some((grant) => grant.moduleKey === moduleKey && grant.enabled)
  const permissions = [
    "dashboard.view", "member_area.view", "profile.view", "help.view", "notifications.view", "users.manage", "access.manage", "articles.manage", "homepage.manage", "products.manage", "impact.manage", "gallery.manage", "downloads.manage", "help_content.manage", "contact.manage", "branding.manage", "settings.manage", "audit.view", "notifications.manage",
  ].filter((permission) => roleHasPortalPermission(user.role, permission as PortalPermission))

  return { kind: "authorized" as const, user: user as CurrentUser, permissions, modules: registeredModules.filter((module) => canEnter(module.key)), grants }
}

export async function requirePortalPermission(permission: PortalPermission) {
  const access = await resolveCurrentPortalAccess()
  const headers = { "Cache-Control": "private, no-store" }
  if (access.kind === "unauthenticated") return { response: Response.json({ error: "Sesi tidak ditemukan." }, { status: 401, headers }) }
  if (access.kind === "inactive") return { response: Response.json({ error: "Akun tidak aktif." }, { status: 403, headers }) }
  if (!access.permissions.includes(permission)) return { response: Response.json({ error: "Akses tidak diizinkan." }, { status: 403, headers }) }
  return { access }
}

async function setModuleGrantWithClient(client: GrantStoreClient, userId: string, moduleKey: RegisteredModuleKey, enabled: boolean, actorId: string) {
  const existingRecord = await client.appRecord.findUnique({ where: { scope_key: { scope: GRANTS_SCOPE, key: userId } }, select: { data: true } })
  const existing = parseGrantsArray(existingRecord?.data)
  const previous = existing.find((grant) => grant.moduleKey === moduleKey)
  const before = previous?.enabled ?? false
  if (before === enabled) return { updatedAt: new Date() }
  const timestamp = new Date().toISOString()
  const grants = [...existing.filter((grant) => grant.moduleKey !== moduleKey), { userId, moduleKey, enabled, actorId, updatedAt: timestamp }]

  const updated = await client.appRecord.upsert({
    where: { scope_key: { scope: GRANTS_SCOPE, key: userId } },
    create: { id: randomUUID(), scope: GRANTS_SCOPE, key: userId, data: { grants } },
    update: { data: { grants } },
    select: { updatedAt: true },
  })
  await client.appRecord.create({
    data: {
      id: randomUUID(),
      scope: AUDIT_SCOPE,
      key: `audit-${randomUUID()}`,
      data: { actorId, targetUserId: userId, action: enabled ? "module_entry_enabled" : "module_entry_disabled", moduleKey, before: { enabled: before }, after: { enabled }, timestamp },
    },
  })
  await createSystemNotification(client, { title: "Akses modul diperbarui", body: `Akses modul ${moduleKey.toUpperCase()} Anda telah ${enabled ? "diaktifkan" : "dinonaktifkan"}.`, category: "access", severity: enabled ? "success" : "warning", targetUserId: userId, actionPath: "/dashboard" })
  return updated
}

export async function setModuleGrant(userId: string, moduleKey: RegisteredModuleKey, enabled: boolean, actorId: string, client?: GrantStoreClient) {
  if (client) return setModuleGrantWithClient(client, userId, moduleKey, enabled, actorId)
  return getPrismaClient().$transaction((tx) => setModuleGrantWithClient(tx, userId, moduleKey, enabled, actorId), { isolationLevel: "Serializable" })
}

export async function getModuleGrantsForUserIds(userIds: string[]) {
  const result = new Map<string, Grant[]>()
  if (userIds.length === 0) return result
  const records = await getPrismaClient().appRecord.findMany({ where: { scope: GRANTS_SCOPE, key: { in: userIds } }, select: { key: true, data: true } })
  for (const record of records) result.set(record.key, parseGrantsArray(record.data))
  return result
}

export async function listPortalUsersWithModules() {
  const users = await getPrismaClient().user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, role: true, status: true } })
  const grantsByUser = await getModuleGrantsForUserIds(users.map((user) => user.id))
  return users.map((user) => ({ ...user, modules: user.role === "super_admin_pc" ? [...registeredModules] : registeredModules.filter((module) => grantsByUser.get(user.id)?.some((grant) => grant.moduleKey === module.key && grant.enabled)) }))
}

export async function portalUserExists(userId: string) {
  return Boolean(await getPrismaClient().user.findUnique({ where: { id: userId }, select: { id: true } }))
}
