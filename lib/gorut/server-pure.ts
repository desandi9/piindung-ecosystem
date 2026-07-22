import { GorutOperationalRole, GorutTransactionState } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { activeUserStatus, inactiveUserStatus, isUserStatus } from "../portal-user-management"

export type GorutOperationalContext = { userId: string; assignmentId: string; operationalRole: GorutOperationalRole; kecamatanId: string | null; rantingId: string | null; plpkId: string | null }
export type AssignmentInput = { id: string; role: GorutOperationalRole; kecamatanId: string | null; rantingId: string | null; plpkId: string | null }
export const transactionStates = Object.values(GorutTransactionState)
export const pageSizeMax = 100

export function resolveOperationalContext(userId: string, assignments: AssignmentInput[]): GorutOperationalContext | null {
  if (assignments.length !== 1) return null
  const assignment = assignments[0]
  if (!assignment) return null
  const valid = assignment.role === "PC" ? !assignment.kecamatanId && !assignment.rantingId && !assignment.plpkId
    : assignment.role === "UPZIS" ? !!assignment.kecamatanId && !assignment.rantingId && !assignment.plpkId
      : assignment.role === "RANTING" ? !assignment.kecamatanId && !!assignment.rantingId && !assignment.plpkId
        : assignment.role === "PLPK" ? !assignment.kecamatanId && !assignment.rantingId && !!assignment.plpkId : false
  return valid ? { userId, assignmentId: assignment.id, operationalRole: assignment.role, kecamatanId: assignment.kecamatanId, rantingId: assignment.rantingId, plpkId: assignment.plpkId } : null
}

export function transactionScopeWhere(context: GorutOperationalContext): Prisma.GorutTransactionWhereInput {
  if (context.operationalRole === "PC") return {}
  if (context.operationalRole === "UPZIS") return { kecamatanId: context.kecamatanId! }
  if (context.operationalRole === "RANTING") return { rantingId: context.rantingId! }
  return { plpkId: context.plpkId! }
}

export function munfiqScopeWhere(context: GorutOperationalContext): Prisma.GorutMunfiqWhereInput {
  if (context.operationalRole === "PC") return {}
  if (context.operationalRole === "UPZIS") return { plpk: { ranting: { kecamatanId: context.kecamatanId! } } }
  if (context.operationalRole === "RANTING") return { rantingId: context.rantingId! }
  return { plpkId: context.plpkId! }
}

export function plpkScopeWhere(context: GorutOperationalContext): Prisma.GorutPlpkWhereInput {
  if (context.operationalRole === "PC") return {}
  if (context.operationalRole === "UPZIS") return { ranting: { kecamatanId: context.kecamatanId! } }
  if (context.operationalRole === "RANTING") return { rantingId: context.rantingId! }
  return { id: context.plpkId! }
}

export function rantingScopeWhere(context: GorutOperationalContext): Prisma.GorutRantingWhereInput {
  if (context.operationalRole === "PC") return {}
  if (context.operationalRole === "UPZIS") return { kecamatanId: context.kecamatanId! }
  if (context.operationalRole === "RANTING") return { id: context.rantingId! }
  return { plpks: { some: { id: context.plpkId! } } }
}

export function kecamatanScopeWhere(context: GorutOperationalContext): Prisma.GorutKecamatanWhereInput {
  if (context.operationalRole === "PC") return {}
  if (context.operationalRole === "UPZIS") return { id: context.kecamatanId! }
  if (context.operationalRole === "RANTING") return { rantings: { some: { id: context.rantingId! } } }
  return { rantings: { some: { plpks: { some: { id: context.plpkId! } } } } }
}

export function parsePage(value: string | null) { return parsePositiveInteger(value, 1, 10000) }
export function parsePageSize(value: string | null) { return parsePositiveInteger(value, 25, pageSizeMax) }
export function parsePositiveInteger(value: string | null, fallback: number, maximum: number) { const number = Number(value); return Number.isInteger(number) && number > 0 ? Math.min(number, maximum) : fallback }
export function parseSearch(value: string | null, maximum = 100) { return value?.trim().replace(/\s+/g, " ").slice(0, maximum) || "" }
export function parseStatus(value: string | null): boolean | undefined { return value === "active" || value === "aktif" || value === "true" ? true : value === "inactive" || value === "nonaktif" || value === "false" ? false : undefined }
export function serializePublicAccountStatus(status: string | null): "aktif" | "nonaktif" | "unknown" { return isUserStatus(status) && status === activeUserStatus ? "aktif" : isUserStatus(status) && status === inactiveUserStatus ? "nonaktif" : "unknown" }
export function parseState(value: string | null): GorutTransactionState | undefined { return value && transactionStates.includes(value as GorutTransactionState) ? value as GorutTransactionState : undefined }
export function parseIsoDate(value: string | null) { if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; const date = new Date(`${value}T00:00:00.000Z`); return Number.isNaN(date.getTime()) ? null : date }
export function endOfIsoDate(value: string | null) { const date = parseIsoDate(value); if (!date) return null; date.setUTCHours(23, 59, 59, 999); return date }
export function isDateRangeValid(from: Date | null, to: Date | null, maxDays = 366) { return !from || !to || (to >= from && to.getTime() - from.getTime() <= maxDays * 86400000) }
export function decimal(value: { toString(): string } | null | undefined) { return value?.toString() ?? "0" }
export function publicEntity<T extends { id?: unknown; code?: string | null }>(item: T) { const { id, ...rest } = item; return { ...rest, ...(item.code ? { code: item.code } : {}) } }
export function publicTransaction<T extends { id?: unknown; code: string; totalAmount?: { toString(): string } | null }>(item: T) { const { id, totalAmount, ...rest } = item; return { ...rest, transactionCode: item.code, ...(totalAmount !== undefined ? { totalAmount: decimal(totalAmount) } : {}) } }
export function rejectInternalIdParams(params: URLSearchParams, allowed: readonly string[] = []) { return ["id", "kecamatanId", "rantingId", "plpkId", "munfiqId", "transactionId"].some((key) => !allowed.includes(key) && params.has(key)) }
export function dateRangeWhere(from: Date | null, to: Date | null) { return from || to ? { transactionDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {} }
