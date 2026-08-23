import {
  GorutPackageSettlementValidationResult,
  GorutTransactionState,
  GorutWorkflowAction,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
import type { GorutProvisionalFeeRuntime } from "./gorut-provisional-plpk-fee-policy.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { isGorutProvisionalFeePolicyAllowed } from "./gorut-provisional-plpk-fee-policy.ts"

export const gorutPhase2bActions = [
  GorutWorkflowAction.SUBMIT,
  GorutWorkflowAction.APPROVE,
  GorutWorkflowAction.RETURN,
] as const

export const gorutReturnReasonCodes = [
  "DATA_INCOMPLETE",
  "AMOUNT_MISMATCH",
  "UNRESOLVED_MAPPING",
  "COLLECTION_CORRECTION_REQUIRED",
  "FINANCIAL_RECONCILIATION_FAILED",
  "EVIDENCE_INCOMPLETE",
  "OTHER",
] as const

export type GorutPhase2bAction = (typeof gorutPhase2bActions)[number]
export type GorutReturnReasonCodeValue = (typeof gorutReturnReasonCodes)[number]

export const gorutPackageWorkflowErrorCodes = [
  "PACKAGE_NOT_FOUND",
  "PACKAGE_ACCESS_DENIED",
  "PACKAGE_ACTION_DISABLED",
  "PACKAGE_STATE_INVALID",
  "PACKAGE_VERSION_CONFLICT",
  "PACKAGE_IDEMPOTENCY_CONFLICT",
  "PACKAGE_PROVISIONAL_POLICY_DISABLED",
  "PACKAGE_GATE_BLOCKED",
  "PACKAGE_MAKER_CHECKER_VIOLATION",
  "PACKAGE_RETURN_REASON_INVALID",
  "PACKAGE_CORRECTION_TARGET_INVALID",
  "PACKAGE_CORRECTION_UNRESOLVED",
  "PACKAGE_SOURCE_CONFLICT",
] as const

export type GorutPackageWorkflowErrorCode = (typeof gorutPackageWorkflowErrorCodes)[number]

export type GorutPcFinalApprovalFacts = {
  packageState: GorutTransactionState | null
  financialReady: boolean
  netAmountAvailable: boolean
  sourceClean: boolean
  hasOpenCorrections: boolean
  hasCurrentSettlement: boolean
  settlementModeValid: boolean
  settlementExpectedMatchesNet: boolean
  validationStatus: "NOT_VALIDATED" | "CURRENT" | "STALE"
  validationResult: GorutPackageSettlementValidationResult | null
  validationDifferenceIsZero: boolean
  validationMatchesSettlement: boolean
  validationActorFactual: boolean
  validationTimestampFactual: boolean
}

export function calculateGorutPcFinalApprovalReadiness(facts: GorutPcFinalApprovalFacts) {
  const blockingReasons = new Set<string>()
  if (facts.packageState !== GorutTransactionState.WAITING_PC_APPROVAL) blockingReasons.add("PACKAGE_NOT_WAITING_PC_APPROVAL")
  if (!facts.financialReady || !facts.netAmountAvailable) blockingReasons.add("FINANCIAL_NOT_READY")
  if (!facts.sourceClean) blockingReasons.add("SOURCE_RECONCILIATION_REQUIRED")
  if (facts.hasOpenCorrections) blockingReasons.add("UNRESOLVED_CORRECTION")
  if (!facts.hasCurrentSettlement || !facts.settlementModeValid) blockingReasons.add("SETTLEMENT_REQUIRED")
  if (facts.hasCurrentSettlement && !facts.settlementExpectedMatchesNet) blockingReasons.add("SOURCE_RECONCILIATION_REQUIRED")
  if (facts.validationStatus === "STALE") blockingReasons.add("SETTLEMENT_VALIDATION_STALE")
  if (facts.validationStatus === "NOT_VALIDATED") blockingReasons.add("SETTLEMENT_VALIDATION_REQUIRED")
  if (facts.validationResult === GorutPackageSettlementValidationResult.MISMATCH) {
    blockingReasons.add("SETTLEMENT_AMOUNT_MISMATCH")
  }
  if (
    facts.validationStatus === "CURRENT" &&
    (
      !facts.validationMatchesSettlement ||
      !facts.validationActorFactual ||
      !facts.validationTimestampFactual ||
      (facts.validationResult === GorutPackageSettlementValidationResult.MATCHED && !facts.validationDifferenceIsZero)
    )
  ) blockingReasons.add("SETTLEMENT_VALIDATION_STALE")
  if (
    facts.validationStatus === "CURRENT" &&
    facts.validationResult !== GorutPackageSettlementValidationResult.MATCHED &&
    facts.validationResult !== GorutPackageSettlementValidationResult.MISMATCH
  ) blockingReasons.add("SETTLEMENT_VALIDATION_REQUIRED")
  return {
    status: blockingReasons.size === 0 ? "READY" as const : "BLOCKED" as const,
    blockingReasons: [...blockingReasons].sort(),
  }
}

export class GorutPackageWorkflowError extends Error {
  readonly code: GorutPackageWorkflowErrorCode
  readonly metadata?: Record<string, unknown>

  constructor(code: GorutPackageWorkflowErrorCode, message: string, metadata?: Record<string, unknown>) {
    super(message)
    this.name = "GorutPackageWorkflowError"
    this.code = code
    this.metadata = metadata
  }
}

export function phase2bTargetState(currentState: GorutTransactionState, action: GorutPhase2bAction) {
  if (
    action === GorutWorkflowAction.SUBMIT &&
    (currentState === GorutTransactionState.DRAFT || currentState === GorutTransactionState.RETURNED_TO_RANTING)
  ) return GorutTransactionState.WAITING_UPZIS_VERIFICATION
  if (action === GorutWorkflowAction.APPROVE && currentState === GorutTransactionState.WAITING_UPZIS_VERIFICATION) {
    return GorutTransactionState.WAITING_PC_APPROVAL
  }
  if (action === GorutWorkflowAction.RETURN && currentState === GorutTransactionState.WAITING_UPZIS_VERIFICATION) {
    return GorutTransactionState.RETURNED_TO_RANTING
  }
  return null
}

export function validateGorutReturnReason(reasonCode: string | null | undefined, reason: string | null | undefined) {
  if (!reasonCode || !gorutReturnReasonCodes.includes(reasonCode as GorutReturnReasonCodeValue)) return false
  return reasonCode !== "OTHER" || Boolean(reason?.trim())
}

export type GorutPackageWorkflowGateFacts = {
  packageState: GorutTransactionState | null
  scopeMatches: boolean
  packageEligible: boolean
  hasOpenCorrections: boolean
  submitterUserId: string | null
  blockingReasons: string[]
}

export function calculateGorutPackageAvailableActions(
  context: GorutOperationalContext,
  runtime: GorutProvisionalFeeRuntime,
  facts: GorutPackageWorkflowGateFacts,
) {
  const runtimeAllowed = isGorutProvisionalFeePolicyAllowed(runtime)
  if (facts.packageState === GorutTransactionState.WAITING_PC_APPROVAL) {
    const blockers = new Set(["PC_FINALIZATION_OUT_OF_SCOPE"])
    if (!runtimeAllowed) blockers.add("PROVISIONAL_FEE_POLICY_DISABLED")
    return { availableActions: [] as GorutPhase2bAction[], blockingReasons: [...blockers].sort() }
  }

  if (facts.packageState === GorutTransactionState.FINAL_APPROVED) {
    return { availableActions: [] as GorutPhase2bAction[], blockingReasons: ["PACKAGE_ALREADY_FINAL_APPROVED"] }
  }

  const blockers = new Set(facts.blockingReasons)
  if (!runtimeAllowed) blockers.add("PROVISIONAL_FEE_POLICY_DISABLED")
  if (context.operationalRole !== "UPZIS" || !facts.scopeMatches) blockers.add("UPZIS_SCOPE_REQUIRED")
  if (facts.hasOpenCorrections && facts.packageState !== GorutTransactionState.RETURNED_TO_RANTING) {
    blockers.add("OPEN_PACKAGE_CORRECTIONS")
  }

  const actions: GorutPhase2bAction[] = []
  const baseAllowed = blockers.size === 0 && facts.packageEligible
  if (
    baseAllowed &&
    (facts.packageState === GorutTransactionState.DRAFT || facts.packageState === GorutTransactionState.RETURNED_TO_RANTING)
  ) actions.push(GorutWorkflowAction.SUBMIT)
  if (runtimeAllowed && facts.packageState === GorutTransactionState.WAITING_UPZIS_VERIFICATION && context.operationalRole === "UPZIS" && facts.scopeMatches) {
    actions.push(GorutWorkflowAction.RETURN)
    if (baseAllowed && facts.submitterUserId !== context.userId) actions.unshift(GorutWorkflowAction.APPROVE)
    else if (facts.submitterUserId === context.userId) blockers.add("MAKER_CHECKER_REQUIRED")
  }

  return { availableActions: actions, blockingReasons: [...blockers].sort() }
}
