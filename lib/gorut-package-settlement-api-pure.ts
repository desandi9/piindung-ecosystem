import { GorutPackageSettlementMode } from "@prisma/client"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { gorutPackageSettlementModes } from "./gorut-package-settlement-pure.ts"

type JsonObject = Record<string, unknown>

const commonKeys = [
  "mode",
  "actualAmount",
  "occurredAt",
  "externalReference",
  "evidenceReference",
  "note",
  "supersedesEvidenceCode",
  "expectedVersion",
  "idempotencyKey",
] as const

function hasOnlyKeys(body: JsonObject, allowed: readonly string[]) {
  const keys = new Set(allowed)
  return Object.keys(body).every((key) => keys.has(key))
}

function isOptionalText(value: unknown, maximum: number) {
  return value === undefined || value === null || (typeof value === "string" && value.length <= maximum)
}

export function isGorutSettlementPublicCode(value: unknown, maximum = 160): value is string {
  return typeof value === "string" && value.length <= maximum && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
}

export function isGorutSettlementDecimal(value: unknown): value is string {
  return typeof value === "string" && /^(?:0|[1-9]\d{0,16})(?:\.\d{1,2})?$/.test(value)
}

function parseOccurredAt(value: unknown) {
  if (typeof value !== "string" || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseGorutPackageSettlementBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const body = value as JsonObject
  if (
    !gorutPackageSettlementModes.includes(body.mode as (typeof gorutPackageSettlementModes)[number]) ||
    !isGorutSettlementDecimal(body.actualAmount) ||
    typeof body.expectedVersion !== "number" ||
    !Number.isInteger(body.expectedVersion) ||
    body.expectedVersion < 1 ||
    !isGorutSettlementPublicCode(body.idempotencyKey, 120) ||
    !isOptionalText(body.externalReference, 240) ||
    !isOptionalText(body.evidenceReference, 240) ||
    !isOptionalText(body.note, 1000) ||
    (body.supersedesEvidenceCode !== undefined && body.supersedesEvidenceCode !== null && !isGorutSettlementPublicCode(body.supersedesEvidenceCode))
  ) return null
  const occurredAt = parseOccurredAt(body.occurredAt)
  if (!occurredAt) return null

  if (body.mode === GorutPackageSettlementMode.PC_PICKUP) {
    if (
      !hasOnlyKeys(body, [...commonKeys, "handedOverByMemberId"]) ||
      !isGorutSettlementPublicCode(body.handedOverByMemberId, 80)
    ) return null
    return {
      mode: body.mode,
      actualAmount: body.actualAmount,
      occurredAt,
      handedOverByMemberId: body.handedOverByMemberId,
      bankName: null,
      externalReference: typeof body.externalReference === "string" ? body.externalReference : null,
      evidenceReference: typeof body.evidenceReference === "string" ? body.evidenceReference : null,
      note: typeof body.note === "string" ? body.note : null,
      supersedesEvidenceCode: typeof body.supersedesEvidenceCode === "string" ? body.supersedesEvidenceCode : null,
      expectedVersion: body.expectedVersion,
      idempotencyKey: body.idempotencyKey,
    }
  }

  if (!hasOnlyKeys(body, [...commonKeys, "bankName"]) || !isOptionalText(body.bankName, 120)) return null
  return {
    mode: body.mode as typeof GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: body.actualAmount,
    occurredAt,
    handedOverByMemberId: null,
    bankName: typeof body.bankName === "string" ? body.bankName : null,
    externalReference: typeof body.externalReference === "string" ? body.externalReference : null,
    evidenceReference: typeof body.evidenceReference === "string" ? body.evidenceReference : null,
    note: typeof body.note === "string" ? body.note : null,
    supersedesEvidenceCode: typeof body.supersedesEvidenceCode === "string" ? body.supersedesEvidenceCode : null,
    expectedVersion: body.expectedVersion,
    idempotencyKey: body.idempotencyKey,
  }
}
