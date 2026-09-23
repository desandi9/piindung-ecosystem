import {
  GorutPackageCorrectionTargetType,
  GorutReturnReasonCode,
  GorutWorkflowAction,
} from "@prisma/client"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { gorutPhase2bActions, gorutReturnReasonCodes } from "./gorut-package-workflow-pure.ts"

type JsonObject = Record<string, unknown>

function hasOnlyKeys(value: JsonObject, keys: string[]) {
  const allowed = new Set(keys)
  return Object.keys(value).every((key) => allowed.has(key))
}

export function isPublicGorutCode(value: unknown, maximum = 160): value is string {
  return typeof value === "string" && value.length <= maximum && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
}

export function isExpectedVersion(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1
}

export function parseTransitionBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const body = value as JsonObject
  if (
    !gorutPhase2bActions.includes(body.action as (typeof gorutPhase2bActions)[number]) ||
    !isExpectedVersion(body.expectedVersion) ||
    !isPublicGorutCode(body.idempotencyKey, 120)
  ) return null
  const action = body.action as (typeof gorutPhase2bActions)[number]
  if (action === GorutWorkflowAction.RETURN) {
    if (!hasOnlyKeys(body, ["action", "expectedVersion", "idempotencyKey", "reasonCode", "reason", "correctionTargets"])) return null
    if (!gorutReturnReasonCodes.includes(body.reasonCode as (typeof gorutReturnReasonCodes)[number])) return null
    if (!Array.isArray(body.correctionTargets) || body.correctionTargets.length < 1 || body.correctionTargets.length > 50) return null
    const correctionTargets = body.correctionTargets.map((target) => {
      if (!target || typeof target !== "object" || Array.isArray(target)) return null
      const row = target as JsonObject
      if (!hasOnlyKeys(row, ["targetType", "targetCode"])) return null
      if (!Object.values(GorutPackageCorrectionTargetType).includes(row.targetType as GorutPackageCorrectionTargetType)) return null
      if (row.targetCode !== undefined && row.targetCode !== null && !isPublicGorutCode(row.targetCode)) return null
      return { targetType: row.targetType as GorutPackageCorrectionTargetType, targetCode: row.targetCode as string | null | undefined }
    })
    if (correctionTargets.some((target) => !target)) return null
    return {
      action,
      expectedVersion: body.expectedVersion,
      idempotencyKey: body.idempotencyKey,
      reasonCode: body.reasonCode as GorutReturnReasonCode,
      reason: typeof body.reason === "string" ? body.reason : null,
      correctionTargets: correctionTargets as Array<{ targetType: GorutPackageCorrectionTargetType; targetCode?: string | null }>,
    }
  }
  if (action === GorutWorkflowAction.SUBMIT) {
    if (!hasOnlyKeys(body, ["action", "expectedVersion", "idempotencyKey", "resolvedCorrectionCodes", "resolutionNote"])) return null
    const codes = body.resolvedCorrectionCodes === undefined
      ? []
      : Array.isArray(body.resolvedCorrectionCodes) && body.resolvedCorrectionCodes.length <= 100 && body.resolvedCorrectionCodes.every((code) => isPublicGorutCode(code))
        ? body.resolvedCorrectionCodes as string[]
        : null
    if (!codes) return null
    return {
      action,
      expectedVersion: body.expectedVersion,
      idempotencyKey: body.idempotencyKey,
      resolvedCorrectionCodes: codes,
      resolutionNote: typeof body.resolutionNote === "string" ? body.resolutionNote : null,
    }
  }
  if (!hasOnlyKeys(body, ["action", "expectedVersion", "idempotencyKey"])) return null
  return { action, expectedVersion: body.expectedVersion, idempotencyKey: body.idempotencyKey }
}
