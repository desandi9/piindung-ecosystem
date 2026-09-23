import {
  GorutPackageFinancialStatus,
  GorutPackageSettlementValidationResult,
  GorutTransactionState,
  Prisma,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { isGorutProvisionalFeePolicyAllowed, type GorutProvisionalFeeRuntime } from "./gorut-provisional-plpk-fee-policy.ts"

export const gorutPackageValidationActions = ["VALIDATE_SETTLEMENT"] as const
export type GorutPackageValidationAction = (typeof gorutPackageValidationActions)[number]

export class GorutPackageValidationError extends Error {
  readonly code: string
  readonly metadata?: Record<string, unknown>

  constructor(code: string, message: string, metadata?: Record<string, unknown>) {
    super(message)
    this.name = "GorutPackageValidationError"
    this.code = code
    this.metadata = metadata
  }
}
export type GorutPackageValidationFacts = {
  currentState: GorutTransactionState | null
  financialStatus: GorutPackageFinancialStatus
  financialSourceClean: boolean
  isHistorical: boolean
  hasCurrentSettlement: boolean
  currentValidationResult: GorutPackageSettlementValidationResult | null
}

export function calculateGorutValidationAmounts(expectedAmount: string, actualAmount: string) {
  const expected = new Prisma.Decimal(expectedAmount)
  const actual = new Prisma.Decimal(actualAmount)
  const difference = actual.minus(expected)
  return {
    expectedAmount: expected.toFixed(2),
    actualAmount: actual.toFixed(2),
    differenceAmount: difference.toFixed(2),
    result: difference.equals(0)
      ? GorutPackageSettlementValidationResult.MATCHED
      : GorutPackageSettlementValidationResult.MISMATCH,
  }
}

function factualBlockingReasons(runtime: GorutProvisionalFeeRuntime, facts: GorutPackageValidationFacts) {
  const reasons = new Set<string>()
  if (!isGorutProvisionalFeePolicyAllowed(runtime)) reasons.add("PROVISIONAL_FEE_POLICY_DISABLED")
  if (facts.currentState !== GorutTransactionState.WAITING_PC_APPROVAL) reasons.add("PACKAGE_NOT_WAITING_PC_APPROVAL")
  if (facts.financialStatus !== GorutPackageFinancialStatus.READY) reasons.add("PACKAGE_FINANCIAL_NOT_READY")
  if (!facts.financialSourceClean) reasons.add("PACKAGE_FINANCIAL_SOURCE_NOT_CLEAN")
  if (facts.isHistorical) reasons.add("HISTORICAL_VALIDATION_UNAVAILABLE")
  if (!facts.hasCurrentSettlement) reasons.add("CURRENT_SETTLEMENT_EVIDENCE_MISSING")
  return reasons
}

export function calculateGorutPackageValidationAvailability(
  context: GorutOperationalContext,
  runtime: GorutProvisionalFeeRuntime,
  facts: GorutPackageValidationFacts,
) {
  const blockingReasons = factualBlockingReasons(runtime, facts)
  const availableActions: GorutPackageValidationAction[] = []
  if (context.operationalRole !== "PC") blockingReasons.add("PC_VALIDATOR_ASSIGNMENT_REQUIRED")
  if (facts.currentValidationResult === GorutPackageSettlementValidationResult.MATCHED) {
    blockingReasons.add("SETTLEMENT_VALIDATION_ALREADY_MATCHED")
  }
  if (facts.currentValidationResult === GorutPackageSettlementValidationResult.MISMATCH) {
    blockingReasons.add("SETTLEMENT_AMOUNT_MISMATCH")
    blockingReasons.add("SETTLEMENT_VALIDATION_REQUIRES_NEW_EVIDENCE")
  }
  if (blockingReasons.size === 0) availableActions.push("VALIDATE_SETTLEMENT")
  return { availableActions, blockingReasons: [...blockingReasons].sort() }
}

export function calculateGorutFinalApprovalReadiness(
  runtime: GorutProvisionalFeeRuntime,
  facts: GorutPackageValidationFacts,
) {
  const blockingReasons = factualBlockingReasons(runtime, facts)
  if (facts.currentValidationResult !== GorutPackageSettlementValidationResult.MATCHED) {
    blockingReasons.add(
      facts.currentValidationResult === GorutPackageSettlementValidationResult.MISMATCH
        ? "SETTLEMENT_AMOUNT_MISMATCH"
        : "CURRENT_SETTLEMENT_VALIDATION_MISSING",
    )
  }
  return {
    status: blockingReasons.size === 0 ? "READY" as const : "BLOCKED" as const,
    blockingReasons: [...blockingReasons].sort(),
  }
}
