// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { roleHasPortalPermission } from "./portal-access.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { resolveOperationalContext, type AssignmentInput } from "./gorut/server-pure.ts"

export const gorutMunfiqPortalRole = "munfiq" as const
export const gorutMunfiqSelfOperationalRoles = ["RANTING", "UPZIS", "PC"] as const

export type GorutMunfiqSelfContext = {
  userId: string
  munfiqId: string
  munfiqCode: string
  munfiqName: string
  munfiqActive: boolean
  portalRole: typeof gorutMunfiqPortalRole
}

export type GorutMunfiqContextRecord = {
  id: string
  status: string
  role: string
  operationalAssignments: AssignmentInput[]
  accountLinks: Array<{
    userId: string
    status: string
    munfiq: { id: string; code: string; name: string; isActive: boolean } | null
  }>
}

export type GorutMunfiqContextResolution =
  | { kind: "authorized"; context: GorutMunfiqSelfContext }
  | { kind: "inactive-user" }
  | { kind: "wrong-role" }
  | { kind: "mapping-unavailable" }
  | { kind: "mapping-invalid" }

function hasNativeMunfiqSelfAccess(record: GorutMunfiqContextRecord) {
  return record.role === gorutMunfiqPortalRole &&
    roleHasPortalPermission(record.role, "portal.access") &&
    roleHasPortalPermission(record.role, "munfiq.transparency.own.view")
}

function hasEligibleOperationalSelfContext(record: GorutMunfiqContextRecord) {
  const context = resolveOperationalContext(record.id, record.operationalAssignments)
  return Boolean(context && gorutMunfiqSelfOperationalRoles.includes(
    context.operationalRole as (typeof gorutMunfiqSelfOperationalRoles)[number],
  ))
}

export function resolveGorutMunfiqSelfContext(record: GorutMunfiqContextRecord): GorutMunfiqContextResolution {
  if (record.status !== "Aktif") return { kind: "inactive-user" }
  if (!hasNativeMunfiqSelfAccess(record) && !hasEligibleOperationalSelfContext(record)) return { kind: "wrong-role" }
  if (record.accountLinks.length !== 1) return { kind: "mapping-unavailable" }

  const link = record.accountLinks[0]
  if (!link || link.status !== "ACTIVE" || link.userId !== record.id || !link.munfiq) {
    return { kind: "mapping-invalid" }
  }

  return {
    kind: "authorized",
    context: {
      userId: record.id,
      munfiqId: link.munfiq.id,
      munfiqCode: link.munfiq.code,
      munfiqName: link.munfiq.name,
      munfiqActive: link.munfiq.isActive,
      portalRole: gorutMunfiqPortalRole,
    },
  }
}

export function serializeGorutMunfiqSelfIdentity(context: GorutMunfiqSelfContext) {
  return { munfiqCode: context.munfiqCode, name: context.munfiqName, active: context.munfiqActive }
}
