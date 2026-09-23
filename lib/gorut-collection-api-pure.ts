import {
  GorutCollectionStatus,
  GorutCollectionVisitStatus,
  type Prisma,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { GorutCollectionError } from "./gorut-collection-pure.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { assertGorutProvisionalFeePolicyAllowed, GorutProvisionalFeePolicyDisabledError, isGorutProvisionalFeePolicyAllowed, type GorutProvisionalFeeRuntime } from "./gorut-provisional-plpk-fee-policy.ts"

export const gorutCollectionApiActions = [
  "RECORD_ENTRY",
  "CONFIRM_AND_SUBMIT",
  "VERIFY_BY_KORDES",
  "RETURN_FOR_CORRECTION",
] as const

export type GorutCollectionApiAction = (typeof gorutCollectionApiActions)[number]

export function assertGorutCollectionMutationRuntime(
  runtime: GorutProvisionalFeeRuntime,
  hostRuntime?: GorutProvisionalFeeRuntime,
) {
  assertGorutProvisionalFeePolicyAllowed(runtime, hostRuntime)
}

const collectionWriteStates = new Set<GorutCollectionStatus>([
  GorutCollectionStatus.DRAFT,
  GorutCollectionStatus.COLLECTING,
  GorutCollectionStatus.COLLECTION_COMPLETED,
  GorutCollectionStatus.NEEDS_CORRECTION,
])

function hasExactKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  const expected = new Set(allowed)
  return Object.keys(value).every((key) => expected.has(key))
}

export function isPublicCollectionCode(value: unknown, maximum = 120): value is string {
  return typeof value === "string" && value.length <= maximum && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
}

export function isCollectionIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
}

export function isCollectionExpectedVersion(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1
}

export function isGorutDecimalString(value: unknown): value is string {
  return typeof value === "string" && /^(?:0|[1-9]\d{0,16})(?:\.\d{1,2})?$/.test(value)
}

function isOptionalBoundedText(value: unknown, maximum = 1000) {
  return value === undefined || value === null || (typeof value === "string" && value.length <= maximum)
}

function isCanonicalPeriod(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false
  const month = Number(value.slice(5, 7))
  return month >= 1 && month <= 12
}

export function parseCollectionCreateBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  if (
    !hasExactKeys(body, ["period", "expectedVersion", "idempotencyKey"]) ||
    !isCanonicalPeriod(body.period) ||
    body.expectedVersion !== 0 ||
    !isCollectionIdempotencyKey(body.idempotencyKey)
  ) return null
  return { period: body.period, expectedVersion: 0 as const, idempotencyKey: body.idempotencyKey }
}

export function parseCollectionEntryBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  if (
    !hasExactKeys(body, ["visitStatus", "amount", "note", "reason", "expectedVersion", "idempotencyKey"]) ||
    !Object.values(GorutCollectionVisitStatus).includes(body.visitStatus as GorutCollectionVisitStatus) ||
    !isGorutDecimalString(body.amount) ||
    !isOptionalBoundedText(body.note) ||
    !isOptionalBoundedText(body.reason) ||
    !isCollectionExpectedVersion(body.expectedVersion) ||
    !isCollectionIdempotencyKey(body.idempotencyKey)
  ) return null
  return {
    visitStatus: body.visitStatus as GorutCollectionVisitStatus,
    amount: body.amount,
    note: typeof body.note === "string" ? body.note : null,
    reason: typeof body.reason === "string" ? body.reason : null,
    expectedVersion: body.expectedVersion,
    idempotencyKey: body.idempotencyKey,
  }
}

export type ParsedCollectionAction =
  | { action: "CONFIRM_AND_SUBMIT"; expectedVersion: number; idempotencyKey: string }
  | {
      action: "VERIFY_BY_KORDES"
      expectedVersion: number
      idempotencyKey: string
      moneyMatches: boolean
      hasDamagedMoney: boolean
      cashReceived: boolean
      note: string | null
    }
  | {
      action: "RETURN_FOR_CORRECTION"
      expectedVersion: number
      idempotencyKey: string
      moneyMatches: boolean
      hasDamagedMoney: boolean
      cashReceived: boolean
      reason: string
      correctionMunfiqCodes: string[]
    }

export function parseCollectionActionBody(value: unknown): ParsedCollectionAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  if (!isCollectionExpectedVersion(body.expectedVersion) || !isCollectionIdempotencyKey(body.idempotencyKey)) return null

  if (body.action === "CONFIRM_AND_SUBMIT") {
    if (!hasExactKeys(body, ["action", "expectedVersion", "idempotencyKey"])) return null
    return { action: body.action, expectedVersion: body.expectedVersion, idempotencyKey: body.idempotencyKey }
  }

  const decisionKeys = ["action", "expectedVersion", "idempotencyKey", "moneyMatches", "hasDamagedMoney", "cashReceived", "note"]
  if (body.action === "VERIFY_BY_KORDES") {
    if (
      !hasExactKeys(body, decisionKeys) ||
      typeof body.moneyMatches !== "boolean" ||
      typeof body.hasDamagedMoney !== "boolean" ||
      typeof body.cashReceived !== "boolean" ||
      !isOptionalBoundedText(body.note)
    ) return null
    return {
      action: body.action,
      expectedVersion: body.expectedVersion,
      idempotencyKey: body.idempotencyKey,
      moneyMatches: body.moneyMatches,
      hasDamagedMoney: body.hasDamagedMoney,
      cashReceived: body.cashReceived,
      note: typeof body.note === "string" ? body.note : null,
    }
  }

  if (body.action === "RETURN_FOR_CORRECTION") {
    if (!hasExactKeys(body, ["action", "expectedVersion", "idempotencyKey", "moneyMatches", "hasDamagedMoney", "cashReceived", "reason", "correctionMunfiqCodes"])) return null
    if (
      typeof body.moneyMatches !== "boolean" ||
      typeof body.hasDamagedMoney !== "boolean" ||
      typeof body.cashReceived !== "boolean" ||
      typeof body.reason !== "string" ||
      !body.reason.trim() ||
      body.reason.length > 1000 ||
      !Array.isArray(body.correctionMunfiqCodes) ||
      body.correctionMunfiqCodes.length < 1 ||
      body.correctionMunfiqCodes.length > 500 ||
      !body.correctionMunfiqCodes.every((code) => isPublicCollectionCode(code, 80))
    ) return null
    return {
      action: body.action,
      expectedVersion: body.expectedVersion,
      idempotencyKey: body.idempotencyKey,
      moneyMatches: body.moneyMatches,
      hasDamagedMoney: body.hasDamagedMoney,
      cashReceived: body.cashReceived,
      reason: body.reason,
      correctionMunfiqCodes: [...new Set(body.correctionMunfiqCodes as string[])],
    }
  }

  return null
}

export function collectionReadScopeWhere(context: GorutOperationalContext): Prisma.GorutCollectionBatchWhereInput {
  if (context.operationalRole === "PC") return {}
  if (context.operationalRole === "UPZIS") return { kecamatanId: context.kecamatanId! }
  if (context.operationalRole === "RANTING") return { rantingId: context.rantingId! }
  return { plpkId: context.plpkId! }
}

export type GorutCollectionActionFacts = {
  status: GorutCollectionStatus
  plpkId: string
  rantingId: string
  entryCount: number
  hasPendingEntry: boolean
  hasInvalidCollectedAmount: boolean
  openCorrectionCount: number
  openCorrectionMunfiqCodes: string[]
}

export function calculateGorutCollectionAvailableActions(
  context: GorutOperationalContext,
  runtime: GorutProvisionalFeeRuntime,
  facts: GorutCollectionActionFacts,
) {
  const blockers = new Set<string>()
  const actions: GorutCollectionApiAction[] = []
  const runtimeAllowed = isGorutProvisionalFeePolicyAllowed(runtime)
  if (!runtimeAllowed) blockers.add("PROVISIONAL_FEE_POLICY_DISABLED")

  if (context.operationalRole === "PLPK") {
    if (context.plpkId !== facts.plpkId) blockers.add("PLPK_SCOPE_REQUIRED")
    const scopeAllowed = context.plpkId === facts.plpkId
    const stateAllowsWrite = collectionWriteStates.has(facts.status)
    const correctionAllowsWrite = facts.status !== GorutCollectionStatus.NEEDS_CORRECTION || facts.openCorrectionCount > 0
    if (runtimeAllowed && scopeAllowed && stateAllowsWrite && correctionAllowsWrite) actions.push("RECORD_ENTRY")

    const canConfirm = runtimeAllowed && scopeAllowed && stateAllowsWrite && facts.entryCount > 0 &&
      !facts.hasPendingEntry && !facts.hasInvalidCollectedAmount && facts.openCorrectionCount === 0
    if (canConfirm) actions.push("CONFIRM_AND_SUBMIT")
    if (!stateAllowsWrite) blockers.add("COLLECTION_STATE_LOCKED")
    if (facts.entryCount === 0) blockers.add("COLLECTION_ENTRIES_EMPTY")
    if (facts.hasPendingEntry) blockers.add("COLLECTION_ENTRY_PENDING")
    if (facts.hasInvalidCollectedAmount) blockers.add("COLLECTION_AMOUNT_INVALID")
    if (facts.openCorrectionCount > 0) blockers.add("OPEN_COLLECTION_CORRECTION")
  } else if (context.operationalRole === "RANTING") {
    if (context.rantingId !== facts.rantingId) blockers.add("KORDES_SCOPE_REQUIRED")
    if (facts.status !== GorutCollectionStatus.WAITING_KORDES_VERIFICATION) blockers.add("NOT_WAITING_KORDES_VERIFICATION")
    if (runtimeAllowed && context.rantingId === facts.rantingId && facts.status === GorutCollectionStatus.WAITING_KORDES_VERIFICATION) {
      actions.push("VERIFY_BY_KORDES", "RETURN_FOR_CORRECTION")
    }
  } else {
    blockers.add("COLLECTION_READ_ONLY_ROLE")
  }

  return { availableActions: actions, blockingReasons: [...blockers].sort() }
}

export function calculateGorutCollectionEntryActions(
  context: GorutOperationalContext,
  runtime: GorutProvisionalFeeRuntime,
  facts: GorutCollectionActionFacts,
  munfiqCode: string,
) {
  const batch = calculateGorutCollectionAvailableActions(context, runtime, facts)
  const recordAllowed = batch.availableActions.includes("RECORD_ENTRY") &&
    (facts.status !== GorutCollectionStatus.NEEDS_CORRECTION || facts.openCorrectionMunfiqCodes.includes(munfiqCode))
  return recordAllowed ? ["RECORD_ENTRY"] as const : [] as const
}

export function mapGorutCollectionError(error: unknown) {
  if (error instanceof GorutProvisionalFeePolicyDisabledError) {
    return { status: 503, body: { error: "Collection workflow provisional tidak tersedia pada environment ini.", code: error.code } }
  }
  if (error instanceof GorutCollectionError) {
    const status = error.code === "COLLECTION_ACCESS_DENIED" ? 403
      : error.code === "COLLECTION_NOT_FOUND" ? 404
        : ["COLLECTION_GRAIN_CONFLICT", "COLLECTION_VERSION_CONFLICT", "COLLECTION_IDEMPOTENCY_CONFLICT", "COLLECTION_SOURCE_CONFLICT"].includes(error.code) ? 409
          : 422
    return {
      status,
      body: { error: error.message, code: error.code, ...(error.metadata ? { details: error.metadata } : {}) },
    }
  }
  return { status: 500, body: { error: "Collection GORUT tidak dapat diproses." } }
}
