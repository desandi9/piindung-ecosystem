import { NextResponse } from "next/server"
import { noStoreHeaders } from "./gorut/server"
import { GorutPackageValidationError } from "./gorut-package-validation-pure"

export { parseGorutPackageValidationBody } from "./gorut-package-validation-api-pure"

export function gorutPackageValidationErrorResponse(error: unknown) {
  if (!(error instanceof GorutPackageValidationError)) {
    return NextResponse.json({ error: "Validasi settlement GORUT tidak dapat diproses." }, { status: 500, headers: noStoreHeaders })
  }
  const status = error.code === "VALIDATION_PACKAGE_NOT_FOUND" ? 404
    : error.code === "VALIDATION_ACCESS_DENIED" ? 403
      : error.code === "VALIDATION_PROVISIONAL_POLICY_DISABLED" ? 503
        : ["VALIDATION_VERSION_CONFLICT", "VALIDATION_IDEMPOTENCY_CONFLICT", "VALIDATION_STALE_SETTLEMENT"].includes(error.code) ? 409
          : 422
  return NextResponse.json(
    { error: error.message, code: error.code, ...(error.metadata ? { details: error.metadata } : {}) },
    { status, headers: noStoreHeaders },
  )
}
