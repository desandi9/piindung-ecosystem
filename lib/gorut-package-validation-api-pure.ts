// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { isGorutSettlementPublicCode } from "./gorut-package-settlement-api-pure.ts"

export function parseGorutPackageValidationBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  const allowed = new Set(["settlementEvidenceCode", "note", "expectedVersion", "idempotencyKey"])
  if (
    !Object.keys(body).every((key) => allowed.has(key)) ||
    !isGorutSettlementPublicCode(body.settlementEvidenceCode, 160) ||
    (body.note !== undefined && body.note !== null && (typeof body.note !== "string" || body.note.length > 1000)) ||
    typeof body.expectedVersion !== "number" ||
    !Number.isInteger(body.expectedVersion) ||
    body.expectedVersion < 1 ||
    !isGorutSettlementPublicCode(body.idempotencyKey, 120)
  ) return null
  return {
    settlementEvidenceCode: body.settlementEvidenceCode,
    note: typeof body.note === "string" ? body.note : null,
    expectedVersion: body.expectedVersion,
    idempotencyKey: body.idempotencyKey,
  }
}
