import {
  GorutPackageFinancialStatus,
  GorutPackageSettlementMode,
  GorutTransactionState,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { isGorutProvisionalFeePolicyAllowed, type GorutProvisionalFeeRuntime } from "./gorut-provisional-plpk-fee-policy.ts"

export const gorutPackageSettlementModes = [
  GorutPackageSettlementMode.PC_PICKUP,
  GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
] as const

export const gorutPackageSettlementActions = [
  "RECORD_PC_PICKUP",
  "RECORD_BANK_DEPOSIT",
] as const

export type GorutPackageSettlementAction = (typeof gorutPackageSettlementActions)[number]

export class GorutPackageSettlementError extends Error {
  readonly code: string
  readonly metadata?: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "GorutPackageSettlementError"
    this.code = code
    this.metadata = metadata
  }
}

export type GorutPackageSettlementFacts = {
  currentState: GorutTransactionState | null
  financialStatus: GorutPackageFinancialStatus
  netAmountAvailable: boolean
  isHistorical: boolean
  kecamatanId: string
}

export function calculateGorutPackageSettlementAvailability(
  context: GorutOperationalContext,
  runtime: GorutProvisionalFeeRuntime,
  facts: GorutPackageSettlementFacts,
) {
  const blockingReasons = new Set<string>()
  const availableActions: GorutPackageSettlementAction[] = []

  if (!isGorutProvisionalFeePolicyAllowed(runtime)) blockingReasons.add("PROVISIONAL_FEE_POLICY_DISABLED")
  if (facts.currentState !== GorutTransactionState.WAITING_PC_APPROVAL) blockingReasons.add("PACKAGE_NOT_WAITING_PC_APPROVAL")
  if (facts.financialStatus !== GorutPackageFinancialStatus.READY || !facts.netAmountAvailable) {
    blockingReasons.add("PACKAGE_FINANCIAL_NOT_READY")
  }
  if (facts.isHistorical) blockingReasons.add("HISTORICAL_SETTLEMENT_EVIDENCE_UNAVAILABLE")

  const factualGatesReady = blockingReasons.size === 0
  if (context.operationalRole === "PC") {
    if (factualGatesReady) availableActions.push("RECORD_PC_PICKUP")
  } else if (context.operationalRole === "UPZIS") {
    if (context.kecamatanId !== facts.kecamatanId) blockingReasons.add("UPZIS_PACKAGE_SCOPE_REQUIRED")
    if (factualGatesReady && context.kecamatanId === facts.kecamatanId) availableActions.push("RECORD_BANK_DEPOSIT")
  } else {
    blockingReasons.add("SETTLEMENT_ROLE_NOT_ALLOWED")
  }

  return { availableActions, blockingReasons: [...blockingReasons].sort() }
}
