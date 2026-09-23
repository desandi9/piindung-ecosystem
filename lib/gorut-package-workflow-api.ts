import { NextResponse } from "next/server"
import { noStoreHeaders } from "./gorut/server"
import { GorutPackageWorkflowError } from "./gorut-package-workflow-pure"

export { isExpectedVersion, isPublicGorutCode, parseTransitionBody } from "./gorut-package-workflow-api-pure"

export function gorutWorkflowErrorResponse(error: unknown) {
  if (!(error instanceof GorutPackageWorkflowError)) {
    return NextResponse.json({ error: "Workflow package GORUT tidak dapat diproses." }, { status: 500, headers: noStoreHeaders })
  }
  const status = error.code === "PACKAGE_NOT_FOUND" ? 404
    : error.code === "PACKAGE_ACCESS_DENIED" ? 403
      : error.code === "PACKAGE_PROVISIONAL_POLICY_DISABLED" ? 503
        : error.code === "PACKAGE_VERSION_CONFLICT" || error.code === "PACKAGE_IDEMPOTENCY_CONFLICT" || error.code === "PACKAGE_SOURCE_CONFLICT" ? 409
          : 422
  return NextResponse.json(
    { error: error.message, code: error.code, ...(error.metadata ? { details: error.metadata } : {}) },
    { status, headers: noStoreHeaders },
  )
}
