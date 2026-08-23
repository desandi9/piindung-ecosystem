import { NextResponse } from "next/server"
import { noStoreHeaders } from "./gorut/server"
import { GorutPackageSettlementError } from "./gorut-package-settlement-pure"

export {
  isGorutSettlementDecimal,
  isGorutSettlementPublicCode,
  parseGorutPackageSettlementBody,
} from "./gorut-package-settlement-api-pure"

export function gorutPackageSettlementErrorResponse(error: unknown) {
  if (!(error instanceof GorutPackageSettlementError)) {
    return NextResponse.json({ error: "Evidence settlement GORUT tidak dapat diproses." }, { status: 500, headers: noStoreHeaders })
  }
  const status = error.code === "SETTLEMENT_PACKAGE_NOT_FOUND" ? 404
    : error.code === "SETTLEMENT_ACCESS_DENIED" ? 403
      : error.code === "SETTLEMENT_PROVISIONAL_POLICY_DISABLED" ? 503
        : ["SETTLEMENT_VERSION_CONFLICT", "SETTLEMENT_IDEMPOTENCY_CONFLICT", "SETTLEMENT_SUPERSESSION_CONFLICT"].includes(error.code) ? 409
          : 422
  return NextResponse.json(
    { error: error.message, code: error.code, ...(error.metadata ? { details: error.metadata } : {}) },
    { status, headers: noStoreHeaders },
  )
}
