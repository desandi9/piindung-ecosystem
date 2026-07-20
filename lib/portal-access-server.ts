import { cookies } from "next/headers"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { getRecord, listRecords, updateRecord } from "@/lib/record-store-server"
import { roleHasPortalPermission, registeredModules, isRegisteredModuleKey, type PortalPermission, type RegisteredModuleKey } from "@/lib/portal-access"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const GRANTS_SCOPE = "portal-module-grants"
const AUDIT_SCOPE = "portal-access-audit"

type CurrentUser = { id: string; name: string; role: string; status: string }
type Grant = { userId: string; moduleKey: RegisteredModuleKey; enabled: boolean; updatedAt?: string; actorId?: string }

function parseGrantsArray(data: unknown): Grant[] {
  if (!data || typeof data !== "object") return []
  const array = (data as Record<string, unknown>).grants
  if (!Array.isArray(array)) return []
  return array.filter((item): item is Grant => {
    if (!item || typeof item !== "object") return false
    const v = item as Record<string, unknown>
    return typeof v.userId === "string" && typeof v.moduleKey === "string" && isRegisteredModuleKey(v.moduleKey) && typeof v.enabled === "boolean"
  })
}

export async function resolveCurrentPortalAccess() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { kind: "unauthenticated" as const }

  const users = await getPrismaClient().$queryRaw<CurrentUser[]>`SELECT id, name, role, status FROM "User" WHERE id = ${session.sub} LIMIT 1`
  const user = users[0]
  if (!user) return { kind: "unauthenticated" as const }
  if (user.status !== "Aktif") return { kind: "inactive" as const, user }

  const record = await getRecord(GRANTS_SCOPE, user.id)
  const grants = parseGrantsArray(record?.data)
  const canEnter = (moduleKey: RegisteredModuleKey) => user.role === "super_admin_pc" || grants.some((grant) => grant.moduleKey === moduleKey && grant.enabled)
  const permissions = [
    "dashboard.view",
    "member_area.view",
    "profile.view",
    "help.view",
    "notifications.view",
    "users.manage",
    "access.manage",
    "articles.manage",
    "homepage.manage",
    "products.manage",
    "impact.manage",
    "gallery.manage",
    "downloads.manage",
    "help_content.manage",
    "contact.manage",
    "branding.manage",
    "settings.manage",
    "audit.view",
  ].filter((permission) => roleHasPortalPermission(user.role, permission as PortalPermission))

  return {
    kind: "authorized" as const,
    user,
    permissions,
    modules: registeredModules.filter((module) => canEnter(module.key)),
    grants,
  }
}

export async function requirePortalPermission(permission: PortalPermission) {
  const access = await resolveCurrentPortalAccess()
  if (access.kind === "unauthenticated") return { response: Response.json({ error: "Sesi tidak ditemukan." }, { status: 401 }) }
  if (access.kind === "inactive") return { response: Response.json({ error: "Akun tidak aktif." }, { status: 403 }) }
  if (!access.permissions.includes(permission)) return { response: Response.json({ error: "Akses tidak diizinkan." }, { status: 403 }) }
  return { access }
}

export async function setModuleGrant(userId: string, moduleKey: RegisteredModuleKey, enabled: boolean, actorId: string) {
  const record = await getRecord(GRANTS_SCOPE, userId)
  const existing = parseGrantsArray(record?.data)
  const previous = existing.find((grant) => grant.moduleKey === moduleKey)
  const wasEnabled = previous ? previous.enabled : false

  const next = existing.filter((grant) => grant.moduleKey !== moduleKey)
  next.push({ userId, moduleKey, enabled, actorId, updatedAt: new Date().toISOString() })
  
  const updated = await updateRecord(GRANTS_SCOPE, userId, { grants: next })

  const auditKey = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  await updateRecord(AUDIT_SCOPE, auditKey, {
    action: "module_grant_updated",
    actorId,
    targetUserId: userId,
    moduleKey,
    beforeState: wasEnabled,
    afterState: enabled,
    timestamp: new Date().toISOString(),
  })

  return updated
}

export async function listPortalUsersWithModules() {
  const users = await getPrismaClient().$queryRaw<Array<{ id: string; name: string; role: string; status: string }>>`SELECT id, name, role, status FROM "User" ORDER BY name ASC`
  const records = await listRecords(GRANTS_SCOPE)
  return users.map((user) => {
    const grantsRecord = records.find((record) => record.key === user.id)
    const grants = parseGrantsArray(grantsRecord?.data)
    return {
      ...user,
      modules: user.role === "super_admin_pc"
        ? [...registeredModules]
        : registeredModules.filter((module) => grants.some((grant) => grant.moduleKey === module.key && grant.enabled)),
    }
  })
}

export async function portalUserExists(userId: string) {
  const users = await getPrismaClient().$queryRaw<Array<{ id: string }>>`SELECT id FROM "User" WHERE id = ${userId} LIMIT 1`
  return Boolean(users[0])
}
