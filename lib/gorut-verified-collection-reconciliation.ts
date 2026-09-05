import {
  GorutCollectionAuthorityStatus,
  GorutCollectionFinancialStatus,
  GorutCollectionRecordOrigin,
  GorutCollectionStatus,
  GorutCollectionVisitStatus,
  GorutPackageFinancialStatus,
  GorutPackageRecordOrigin,
  GorutTransactionState,
  Prisma,
  type PrismaClient,
} from "@prisma/client"
import { createAuthoritativeCollectionFinancialAuthority } from "./gorut-collection-package-adapter"
import {
  calculateCollectionFinancialFacts,
  GorutCollectionError,
} from "./gorut-collection-pure"
import { findCollection, sourceHashFor, type GorutCollectionSource } from "./gorut-collection-server"
import { bridgeAuthoritativeCollectionToTransaction } from "./gorut-collection-transaction-bridge"
import {
  materializeGorutUpzisPackage,
} from "./gorut-package-materializer"
import {
  buildGorutPackageCode,
  GorutPackageMaterializationError,
  normalizePackagePeriod,
  stableSourceHash,
} from "./gorut-package-materializer-pure"
import {
  assertGorutProvisionalFeePolicyAllowed,
  GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION,
  resolveGorutProvisionalFeeRuntime,
  type GorutProvisionalFeeRuntime,
} from "./gorut-provisional-plpk-fee-policy"

export type GorutVerifiedCollectionReconciliationResult = {
  collectionCode: string
  transactionCode: string | null
  packageCode: string | null
  bridgeStatus: "CREATED" | "EXISTING" | "RECONCILED" | "BLOCKED" | "RETRYABLE"
  packageStatus: "CREATED" | "UPDATED" | "EXISTING" | "BLOCKED" | "RETRYABLE" | "NOT_RUN"
  financialStatus: "READY" | "BLOCKED" | "NOT_RUN"
  blockingReasons: string[]
  idempotentReplay: boolean
}

function decimalEquals(left: Prisma.Decimal | null, right: Prisma.Decimal | null) {
  return left === null ? right === null : right !== null && left.equals(right)
}

export function verifiedCollectionReconciliationGateReasons(
  collection: GorutCollectionSource,
  runtime: GorutProvisionalFeeRuntime,
) {
  const reasons = new Set<string>()
  if (collection.recordOrigin !== GorutCollectionRecordOrigin.NATIVE) reasons.add("COLLECTION_NOT_SERVER_AUTHORITATIVE")
  if (collection.status !== GorutCollectionStatus.VERIFIED_BY_KORDES) reasons.add("COLLECTION_NOT_VERIFIED_BY_KORDES")
  if (!collection.confirmedByPlpkAt || !collection.confirmedByPlpkUserId) reasons.add("PLPK_CONFIRMATION_FACT_MISSING")
  if (!collection.submittedToKordesAt || !collection.submittedToKordesByUserId) reasons.add("KORDES_SUBMISSION_FACT_MISSING")
  if (!collection.verifiedByKordesAt || !collection.kordesDecisionByUserId) reasons.add("KORDES_VERIFICATION_FACT_MISSING")
  if (!collection.kordesMoneyMatches || !collection.kordesCashReceived || (collection.kordesHasDamagedMoney && !collection.kordesNote)) {
    reasons.add("KORDES_VERIFICATION_FACT_INCOMPLETE")
  }
  if (collection.returnedForCorrectionAt || collection.corrections.length) reasons.add("OPEN_COLLECTION_CORRECTION")
  if (collection.amountAuthorityStatus !== GorutCollectionAuthorityStatus.AUTHORITATIVE) reasons.add("COLLECTION_AMOUNT_NOT_AUTHORITATIVE")
  if (collection.feeAuthorityStatus !== GorutCollectionAuthorityStatus.AUTHORITATIVE) reasons.add("COLLECTION_FEE_NOT_AUTHORITATIVE")
  if (collection.entries.length === 0 || collection.entries.some((entry) => entry.visitStatus === GorutCollectionVisitStatus.PENDING)) {
    reasons.add("COLLECTION_ENTRIES_INCOMPLETE")
  }
  if (sourceHashFor(collection) !== collection.sourceHash) reasons.add("COLLECTION_SOURCE_DRIFT")

  let policyAllowed = true
  try {
    assertGorutProvisionalFeePolicyAllowed(runtime)
  } catch {
    policyAllowed = false
    reasons.add(runtime.deploymentEnvironment === "PRODUCTION"
      ? "PRODUCTION_PROVISIONAL_FEE_POLICY_BLOCKED"
      : "PROVISIONAL_FEE_POLICY_UNAVAILABLE")
  }
  if (
    policyAllowed &&
    collection.calculationPolicyVersion !== GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION
  ) reasons.add("PROVISIONAL_FEE_POLICY_VERSION_INVALID")

  let calculated: ReturnType<typeof calculateCollectionFinancialFacts> | null = null
  try {
    calculated = calculateCollectionFinancialFacts(collection.entries, collection.amountAuthorityStatus)
  } catch {
    reasons.add("COLLECTION_FINANCIAL_RECONCILIATION_FAILED")
  }
  if (
    !calculated ||
    collection.financialStatus !== GorutCollectionFinancialStatus.READY ||
    calculated.financialStatus !== GorutCollectionFinancialStatus.READY ||
    !decimalEquals(collection.grossAmount, calculated.grossAmount) ||
    !decimalEquals(collection.totalPlpkFee, calculated.totalPlpkFee) ||
    !decimalEquals(collection.netAmount, calculated.netAmount) ||
    collection.financialSourceHash !== calculated.financialSourceHash
  ) reasons.add("COLLECTION_FINANCIAL_RECONCILIATION_FAILED")

  return [...reasons].sort()
}

function retryableReconciliationError(error: unknown) {
  if (error instanceof GorutCollectionError) {
    return error.code === "COLLECTION_VERSION_CONFLICT" || error.code === "COLLECTION_IDEMPOTENCY_CONFLICT"
  }
  if (error instanceof GorutPackageMaterializationError) {
    return error.code === "VERSION_CONFLICT" || error.code === "IDEMPOTENCY_CONFLICT"
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) return ["P1001", "P1002", "P2024", "P2034"].includes(error.code)
  if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) return true
  return true
}

function reconciliationErrorReason(error: unknown) {
  if (error instanceof GorutCollectionError || error instanceof GorutPackageMaterializationError) return error.code
  return retryableReconciliationError(error)
    ? "RECONCILIATION_TECHNICAL_RETRYABLE"
    : "RECONCILIATION_TECHNICAL_FAILURE"
}

/**
 * Phase 2C.3 internal command. It resolves all target identity from the authoritative
 * collection and never emits workflow events or advances package workflow state.
 */
export async function reconcileVerifiedCollection(
  prisma: PrismaClient,
  collectionCode: string,
  options: {
    runtime?: GorutProvisionalFeeRuntime
    now?: Date
    services?: {
      bridge?: typeof bridgeAuthoritativeCollectionToTransaction
      materialize?: typeof materializeGorutUpzisPackage
    }
  } = {},
): Promise<GorutVerifiedCollectionReconciliationResult> {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  const now = options.now ?? new Date()
  let collection: GorutCollectionSource
  try {
    collection = await prisma.$transaction((tx) => findCollection(tx, collectionCode), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  } catch (error) {
    const retryable = retryableReconciliationError(error)
    return {
      collectionCode,
      transactionCode: null,
      packageCode: null,
      bridgeStatus: retryable ? "RETRYABLE" : "BLOCKED",
      packageStatus: "NOT_RUN",
      financialStatus: "NOT_RUN",
      blockingReasons: [reconciliationErrorReason(error)],
      idempotentReplay: false,
    }
  }

  const packageCode = buildGorutPackageCode(collection.kecamatan.code, normalizePackagePeriod(collection.periodStart))
  const gateReasons = verifiedCollectionReconciliationGateReasons(collection, runtime)
  if (gateReasons.length) {
    return {
      collectionCode,
      transactionCode: null,
      packageCode: null,
      bridgeStatus: "BLOCKED",
      packageStatus: "NOT_RUN",
      financialStatus: "BLOCKED",
      blockingReasons: gateReasons,
      idempotentReplay: false,
    }
  }

  let transactionCode: string | null = null
  let bridgeStatus: GorutVerifiedCollectionReconciliationResult["bridgeStatus"] = "BLOCKED"
  try {
    const bridge = await (options.services?.bridge ?? bridgeAuthoritativeCollectionToTransaction)(prisma, {
      collectionCode,
      expectedVersion: collection.version,
      idempotencyKey: `phase2c3:bridge:${stableSourceHash({ collectionCode, sourceHash: collection.sourceHash })}`,
    }, {
      allowedCollectionStatuses: [GorutCollectionStatus.VERIFIED_BY_KORDES],
    }, { now, maxAttempts: 6 })
    transactionCode = bridge.transaction?.transactionCode ?? null
    bridgeStatus = bridge.disposition === "created"
      ? "CREATED"
      : bridge.disposition === "reconciled"
        ? "RECONCILED"
        : bridge.disposition === "existing"
          ? "EXISTING"
          : "BLOCKED"
    if (!bridge.transaction) {
      return {
        collectionCode,
        transactionCode: null,
        packageCode: null,
        bridgeStatus,
        packageStatus: "NOT_RUN",
        financialStatus: "NOT_RUN",
        blockingReasons: bridge.blockingReasons,
        idempotentReplay: bridge.idempotentReplay,
      }
    }

    const materialized = await (options.services?.materialize ?? materializeGorutUpzisPackage)(prisma, {
      kecamatanCode: collection.kecamatan.code,
      period: collection.periodStart,
    }, {
      eligibleStates: [GorutTransactionState.DRAFT],
      financialAuthority: createAuthoritativeCollectionFinancialAuthority(),
      authoritativeCollectionsOnly: true,
      packageRecordOrigin: GorutPackageRecordOrigin.COLLECTION_BRIDGE,
    }, { now, maxAttempts: 6 })
    const blockingReasons = [...new Set([
      ...materialized.blockingReasons,
      ...materialized.financialBlockingReasons,
      ...materialized.unresolvedTransactions.flatMap((row) => row.blockingReasons),
    ])].sort()
    return {
      collectionCode,
      transactionCode,
      packageCode: materialized.package?.packageCode ?? packageCode,
      bridgeStatus,
      packageStatus: materialized.disposition === "created"
        ? "CREATED"
        : materialized.disposition === "updated"
          ? "UPDATED"
          : materialized.disposition === "existing"
            ? "EXISTING"
            : "BLOCKED",
      financialStatus: materialized.package?.financialStatus === GorutPackageFinancialStatus.READY
        ? "READY"
        : "BLOCKED",
      blockingReasons,
      idempotentReplay: bridge.idempotentReplay && materialized.idempotentReplay,
    }
  } catch (error) {
    const retryable = retryableReconciliationError(error)
    return {
      collectionCode,
      transactionCode,
      packageCode,
      bridgeStatus: transactionCode ? bridgeStatus : retryable ? "RETRYABLE" : "BLOCKED",
      packageStatus: transactionCode ? retryable ? "RETRYABLE" : "BLOCKED" : "NOT_RUN",
      financialStatus: "BLOCKED",
      blockingReasons: [reconciliationErrorReason(error)],
      idempotentReplay: false,
    }
  }
}
