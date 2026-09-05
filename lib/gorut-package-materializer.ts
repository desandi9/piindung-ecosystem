import {
  GorutPackageFinancialStatus,
  GorutPackageRecordOrigin,
  GorutTransactionState,
  Prisma,
  type PrismaClient,
} from "@prisma/client"
import {
  buildGorutPackageCode,
  calculateFinancialSnapshot,
  evaluateTransactionEligibility,
  GorutPackageMaterializationError,
  NORMALIZED_TRANSACTION_SOURCE_TYPE,
  normalizePackagePeriod,
  stableSourceHash,
  transactionSourceHash,
  type MaterializationTransactionSource,
  type PackageMaterializationErrorCode,
} from "./gorut-package-materializer-pure"

const NORMALIZED_FINANCIAL_BLOCKERS = [
  "NORMALIZED_GROSS_SOURCE_UNAVAILABLE",
  "NORMALIZED_PLPK_FEE_SOURCE_UNAVAILABLE",
] as const

const transactionSelect = {
  id: true,
  code: true,
  kecamatanId: true,
  rantingId: true,
  plpkId: true,
  transactionDate: true,
  totalAmount: true,
  currentState: true,
  updatedAt: true,
  kecamatan: { select: { id: true, code: true } },
  ranting: { select: { id: true, kecamatanId: true, code: true } },
  plpk: { select: { id: true, rantingId: true, code: true } },
  items: {
    select: {
      munfiqId: true,
      amount: true,
      periodLabel: true,
      munfiq: { select: { id: true, code: true, rantingId: true, plpkId: true } },
    },
    orderBy: [{ munfiq: { code: "asc" as const } }, { id: "asc" as const }],
  },
  packageMembership: {
    select: {
      packageId: true,
      sourceType: true,
      sourceKey: true,
      sourceVersion: true,
      sourceHash: true,
      package: { select: { packageCode: true, lockedAt: true } },
    },
  },
  collectionSource: {
    select: {
      collectionCode: true,
      status: true,
      recordOrigin: true,
      amountAuthorityStatus: true,
      feeAuthorityStatus: true,
      financialStatus: true,
      financialBlockingReasons: true,
      grossAmount: true,
      totalPlpkFee: true,
      netAmount: true,
      calculationPolicyVersion: true,
      financialSourceHash: true,
      revision: true,
      sourceHash: true,
      transactionSourceHash: true,
      confirmedByPlpkAt: true,
      submittedToKordesAt: true,
      verifiedByKordesAt: true,
      returnedForCorrectionAt: true,
    },
  },
} satisfies Prisma.GorutTransactionSelect

export type GorutPackageFinancialAssessment =
  | { ready: true; grossAmount: Prisma.Decimal | string; totalPlpkFee: Prisma.Decimal | string }
  | { ready: false; blockingReasons: string[] }

export type GorutPackageFinancialAuthority = {
  calculationPolicyVersion: string
  calculate(transactions: readonly MaterializationTransactionSource[]): GorutPackageFinancialAssessment
}

export type GorutPackageMaterializationPolicy = {
  /** Business-owned allow-list. Omission is intentionally fail-closed. */
  eligibleStates?: readonly GorutTransactionState[]
  /** Must only be supplied by an authoritative normalized server-data adapter. */
  financialAuthority?: GorutPackageFinancialAuthority
  /** Phase 2C technical cutover: exclude legacy/manual DRAFT transactions from collection packages. */
  authoritativeCollectionsOnly?: boolean
  /** Preserve the canonical provenance of the package grain. */
  packageRecordOrigin?: GorutPackageRecordOrigin
}

export type MaterializeGorutPackageInput = {
  kecamatanCode: string
  period: string | Date
}

type TransactionIssue = {
  transactionCode: string
  blockingReasons: PackageMaterializationErrorCode[]
}

export type GorutPackageMaterializationResult = {
  package: null | {
    packageCode: string
    currentState: GorutTransactionState | null
    version: number
    revision: number
    financialStatus: GorutPackageFinancialStatus
  }
  disposition: "blocked" | "created" | "existing" | "updated"
  eligibleTransactionCount: number
  includedTransactionCount: number
  unresolvedTransactions: TransactionIssue[]
  financialReady: boolean
  financialBlockingReasons: string[]
  coverageFacts: { includedRantingCodes: string[]; excluded: number; unresolved: number }
  sourceConflicts: Array<{ transactionCode: string; packageCode: string; reason: string }>
  idempotentReplay: boolean
  blockingReasons: string[]
}

type TxClient = Prisma.TransactionClient

function packageResult(row: {
  packageCode: string
  currentState: GorutTransactionState | null
  version: number
  revision: number
  financialStatus: GorutPackageFinancialStatus
}) {
  return {
    packageCode: row.packageCode,
    currentState: row.currentState,
    version: row.version,
    revision: row.revision,
    financialStatus: row.financialStatus,
  }
}

function isRetryable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || error.code === "P2002" || error.code === "P2025")
}

function retryExhaustedError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error
  if (error.code === "P2002") {
    return new GorutPackageMaterializationError(
      "IDEMPOTENCY_CONFLICT",
      "A canonical package or source uniqueness conflict could not be reconciled.",
    )
  }
  if (error.code === "P2034" || error.code === "P2025") {
    return new GorutPackageMaterializationError(
      "VERSION_CONFLICT",
      "Concurrent materialization could not be serialized within the retry limit.",
    )
  }
  return error
}

async function materializeInTransaction(
  tx: TxClient,
  input: MaterializeGorutPackageInput,
  policy: GorutPackageMaterializationPolicy,
  now: Date,
): Promise<GorutPackageMaterializationResult> {
  const period = normalizePackagePeriod(input.period)
  const kecamatan = await tx.gorutKecamatan.findUnique({
    where: { code: input.kecamatanCode },
    select: { id: true, code: true },
  })
  if (!kecamatan) throw new GorutPackageMaterializationError("UNRESOLVED_REGION", "Canonical Kecamatan was not found.")

  const packageCode = buildGorutPackageCode(kecamatan.code, period)
  const transactions = await tx.gorutTransaction.findMany({
    where: {
      kecamatanId: kecamatan.id,
      transactionDate: { gte: period.start, lt: period.end },
      ...(policy.authoritativeCollectionsOnly ? {
        sourceChannel: "AUTHORITATIVE_COLLECTION",
        collectionSource: { is: { status: "VERIFIED_BY_KORDES" } },
      } : {}),
    },
    select: transactionSelect,
    orderBy: [{ transactionDate: "asc" }, { code: "asc" }],
  })
  const eligibleStates = new Set(policy.eligibleStates ?? [])
  const evaluated = transactions.map((transaction) => ({
    transaction,
    eligibility: evaluateTransactionEligibility(transaction, kecamatan.id, period, eligibleStates),
  }))
  const unresolvedTransactions = evaluated
    .filter((row) => !row.eligibility.eligible)
    .map((row) => ({ transactionCode: row.transaction.code, blockingReasons: row.eligibility.blockingReasons }))
  const eligible = evaluated.filter((row) => row.eligibility.eligible).map((row) => row.transaction)

  const existingPackage = await tx.gorutUpzisPackage.findUnique({
    where: { kecamatanId_periodStart: { kecamatanId: kecamatan.id, periodStart: period.start } },
    select: {
      id: true,
      packageCode: true,
      currentState: true,
      version: true,
      revision: true,
      financialStatus: true,
      financialBlockingReasons: true,
      calculationPolicyVersion: true,
      financialSourceHash: true,
      lockedAt: true,
      rosterFrozenAt: true,
      recordOrigin: true,
      transactionMemberships: {
        select: { transactionId: true, sourceType: true, sourceKey: true, sourceVersion: true, sourceHash: true },
      },
      rantingCoverages: { select: { rantingId: true, status: true } },
    },
  })
  if (existingPackage && existingPackage.packageCode !== packageCode) {
    throw new GorutPackageMaterializationError("IDEMPOTENCY_CONFLICT", "Canonical package grain has a different public code.", {
      packageCode: existingPackage.packageCode,
    })
  }
  if (existingPackage && policy.packageRecordOrigin && existingPackage.recordOrigin !== policy.packageRecordOrigin) {
    throw new GorutPackageMaterializationError(
      "PACKAGE_SOURCE_CONFLICT",
      "Canonical package grain belongs to a different source origin.",
      { packageCode: existingPackage.packageCode },
    )
  }

  const evaluatedByTransactionId = new Map(evaluated.map((row) => [row.transaction.id, row]))
  const invalidExistingMemberships = existingPackage?.transactionMemberships.filter((membership) => {
    const row = evaluatedByTransactionId.get(membership.transactionId)
    if (!row) return true
    const onlyUnconfirmedBusinessPolicy = row.eligibility.blockingReasons.every(
      (reason) => reason === "BUSINESS_WORKFLOW_ELIGIBILITY_UNCONFIRMED",
    )
    return !row.eligibility.eligible && (!onlyUnconfirmedBusinessPolicy || eligibleStates.size > 0)
  }) ?? []
  if (invalidExistingMemberships.length) {
    if (existingPackage?.lockedAt) {
      throw new GorutPackageMaterializationError("PACKAGE_LOCKED", "A locked package contains a source that is no longer eligible.")
    }
    throw new GorutPackageMaterializationError(
      "PACKAGE_SOURCE_CONFLICT",
      "An existing package member is no longer eligible and requires a future correction revision.",
    )
  }

  if (eligible.length === 0) {
    const blockingReasons = transactions.length === 0
      ? ["NO_NORMALIZED_TRANSACTIONS_FOR_PERIOD"]
      : [...new Set(unresolvedTransactions.flatMap((row) => row.blockingReasons))]
    return {
      package: existingPackage ? packageResult(existingPackage) : null,
      disposition: "blocked",
      eligibleTransactionCount: 0,
      includedTransactionCount: existingPackage?.transactionMemberships.length ?? 0,
      unresolvedTransactions,
      financialReady: false,
      financialBlockingReasons: existingPackage?.financialBlockingReasons.length
        ? existingPackage.financialBlockingReasons
        : [...NORMALIZED_FINANCIAL_BLOCKERS],
      coverageFacts: { includedRantingCodes: [], excluded: 0, unresolved: 0 },
      sourceConflicts: [],
      idempotentReplay: false,
      blockingReasons,
    }
  }

  const hashes = new Map(eligible.map((transaction) => [transaction.id, transactionSourceHash(transaction)]))
  const sourceConflicts = eligible.flatMap((transaction) => {
    if (!transaction.packageMembership || transaction.packageMembership.packageId === existingPackage?.id) return []
    return [{
      transactionCode: transaction.code,
      packageCode: transaction.packageMembership.package.packageCode,
      reason: "TRANSACTION_ALREADY_BELONGS_TO_ANOTHER_PACKAGE",
    }]
  })
  if (sourceConflicts.length) {
    throw new GorutPackageMaterializationError("PACKAGE_MEMBERSHIP_CONFLICT", "A transaction already belongs to another package.", {
      transactionCode: sourceConflicts[0]!.transactionCode,
      packageCode: sourceConflicts[0]!.packageCode,
    })
  }

  const existingMemberships = new Map(existingPackage?.transactionMemberships.map((row) => [row.transactionId, row]) ?? [])
  const changedSources = eligible.filter((transaction) => {
    const membership = existingMemberships.get(transaction.id)
    return membership && (
      membership.sourceType !== NORMALIZED_TRANSACTION_SOURCE_TYPE ||
      membership.sourceKey !== transaction.code ||
      membership.sourceHash !== hashes.get(transaction.id)
    )
  })
  if (changedSources.length) {
    if (
      existingPackage?.lockedAt ||
      existingPackage?.rosterFrozenAt ||
      existingPackage?.currentState !== GorutTransactionState.DRAFT
    ) {
      throw new GorutPackageMaterializationError("PACKAGE_LOCKED", "A locked package has changed source facts.", {
        transactionCode: changedSources[0]!.code,
      })
    }
  }

  const additions = eligible.filter((transaction) => !existingMemberships.has(transaction.id))
  if (
    additions.length &&
    existingPackage &&
    (existingPackage.lockedAt || existingPackage.rosterFrozenAt || existingPackage.currentState !== GorutTransactionState.DRAFT)
  ) {
    throw new GorutPackageMaterializationError("PACKAGE_LOCKED", "A locked package cannot accept new membership.")
  }

  const allSourceTransactions = eligible as MaterializationTransactionSource[]
  const financialAssessment = policy.financialAuthority?.calculate(allSourceTransactions)
  const authoritativeAmounts = financialAssessment?.ready ? financialAssessment : null
  const financialBlockers = financialAssessment && "blockingReasons" in financialAssessment
    ? financialAssessment.blockingReasons
    : [...NORMALIZED_FINANCIAL_BLOCKERS]
  const financial = authoritativeAmounts
    ? calculateFinancialSnapshot(authoritativeAmounts.grossAmount, authoritativeAmounts.totalPlpkFee)
    : null
  const financialSourceHash = financial && policy.financialAuthority
    ? stableSourceHash({
      calculationPolicyVersion: policy.financialAuthority.calculationPolicyVersion,
      grossAmount: financial.grossAmount.toFixed(2),
      sourceHashes: eligible.map((transaction) => hashes.get(transaction.id)).sort(),
      totalPlpkFee: financial.totalPlpkFee.toFixed(2),
    })
    : null

  const financialMatches = financial && policy.financialAuthority
    ? existingPackage?.financialStatus === GorutPackageFinancialStatus.READY &&
      existingPackage.calculationPolicyVersion === policy.financialAuthority.calculationPolicyVersion &&
      existingPackage.financialSourceHash === financialSourceHash
    : existingPackage?.financialStatus === GorutPackageFinancialStatus.BLOCKED &&
      [...existingPackage.financialBlockingReasons].sort().join("|") === [...financialBlockers].sort().join("|")

  if (
    existingPackage?.financialStatus === GorutPackageFinancialStatus.READY &&
    financial &&
    !financialMatches
  ) {
    if (
      existingPackage.lockedAt ||
      existingPackage.rosterFrozenAt ||
      existingPackage.currentState !== GorutTransactionState.DRAFT
    ) {
      throw new GorutPackageMaterializationError("PACKAGE_LOCKED", "A locked package has changed financial source facts.")
    }
  }

  const isReplay = Boolean(existingPackage) && additions.length === 0 && changedSources.length === 0 && financialMatches
  if (isReplay) {
    return {
      package: packageResult(existingPackage!),
      disposition: "existing",
      eligibleTransactionCount: eligible.length,
      includedTransactionCount: existingPackage!.transactionMemberships.length,
      unresolvedTransactions,
      financialReady: existingPackage!.financialStatus === GorutPackageFinancialStatus.READY,
      financialBlockingReasons: existingPackage!.financialBlockingReasons,
      coverageFacts: {
        includedRantingCodes: [...new Set(eligible.map((transaction) => transaction.ranting.code))].sort(),
        excluded: 0,
        unresolved: 0,
      },
      sourceConflicts: [],
      idempotentReplay: true,
      blockingReasons: unresolvedTransactions.length ? ["SOME_TRANSACTIONS_NOT_ELIGIBLE"] : [],
    }
  }

  if (existingPackage?.financialStatus === GorutPackageFinancialStatus.READY && !financial) {
    throw new GorutPackageMaterializationError(
      "FINANCIAL_SOURCE_INCOMPLETE",
      "An authoritative READY snapshot cannot be revised without its financial authority.",
    )
  }

  const nextRevision = existingPackage ? existingPackage.revision + 1 : 1
  const nextVersion = existingPackage ? existingPackage.version + 1 : 1
  const financialData = financial && policy.financialAuthority ? {
    financialStatus: GorutPackageFinancialStatus.READY,
    financialBlockingReasons: [],
    grossAmount: financial.grossAmount,
    totalPlpkFee: financial.totalPlpkFee,
    netAmount: financial.netAmount,
    calculatedAt: now,
    calculationPolicyVersion: policy.financialAuthority.calculationPolicyVersion,
    financialSourceRevision: nextRevision,
    financialSourceHash,
  } : {
    financialStatus: GorutPackageFinancialStatus.BLOCKED,
    financialBlockingReasons: financialBlockers,
    grossAmount: null,
    totalPlpkFee: null,
    netAmount: null,
    calculatedAt: null,
    calculationPolicyVersion: null,
    financialSourceRevision: null,
    financialSourceHash: null,
  }

  const packageRow = existingPackage
    ? await tx.gorutUpzisPackage.update({
      where: { id: existingPackage.id, version: existingPackage.version },
      data: { version: nextVersion, revision: nextRevision, ...financialData },
      select: { id: true, packageCode: true, currentState: true, version: true, revision: true, financialStatus: true },
    })
    : await tx.gorutUpzisPackage.create({
      data: {
        packageCode,
        kecamatanId: kecamatan.id,
        periodStart: period.start,
        currentState: GorutTransactionState.DRAFT,
        recordOrigin: policy.packageRecordOrigin ?? GorutPackageRecordOrigin.NATIVE,
        isHistorical: false,
        workflowHistoryComplete: true,
        ...financialData,
      },
      select: { id: true, packageCode: true, currentState: true, version: true, revision: true, financialStatus: true },
    })

  if (existingPackage && packageRow.version !== nextVersion) {
    throw new GorutPackageMaterializationError("VERSION_CONFLICT", "Package version changed during materialization.")
  }

  if (additions.length) {
    await tx.gorutUpzisPackageTransaction.createMany({
      data: additions.map((transaction) => ({
        packageId: packageRow.id,
        transactionId: transaction.id,
        sourceType: NORMALIZED_TRANSACTION_SOURCE_TYPE,
        sourceKey: transaction.code,
        sourceVersion: transaction.updatedAt.toISOString(),
        sourceHash: hashes.get(transaction.id)!,
        includedAt: now,
      })),
    })
  }

  for (const transaction of changedSources) {
    await tx.gorutUpzisPackageTransaction.update({
      where: { transactionId: transaction.id },
      data: {
        sourceVersion: transaction.updatedAt.toISOString(),
        sourceHash: hashes.get(transaction.id)!,
      },
    })
  }

  const coveredRantingIds = new Set(existingPackage?.rantingCoverages.filter((row) => row.status === "INCLUDED").map((row) => row.rantingId) ?? [])
  const newRantings = [...new Map(additions.map((transaction) => [transaction.rantingId, transaction.ranting])).values()]
    .filter((ranting) => !coveredRantingIds.has(ranting.id))
  if (newRantings.length) {
    await tx.gorutUpzisPackageRantingCoverage.createMany({
      data: newRantings.map((ranting) => ({
        packageId: packageRow.id,
        rantingId: ranting.id,
        status: "INCLUDED",
        sourceRantingKey: ranting.code,
      })),
    })
  }

  return {
    package: packageResult(packageRow),
    disposition: existingPackage ? "updated" : "created",
    eligibleTransactionCount: eligible.length,
    includedTransactionCount: existingMemberships.size + additions.length,
    unresolvedTransactions,
    financialReady: financialData.financialStatus === GorutPackageFinancialStatus.READY,
    financialBlockingReasons: financialData.financialBlockingReasons,
    coverageFacts: {
      includedRantingCodes: [...new Set(eligible.map((transaction) => transaction.ranting.code))].sort(),
      excluded: 0,
      unresolved: 0,
    },
    sourceConflicts: [],
    idempotentReplay: false,
    blockingReasons: unresolvedTransactions.length ? ["SOME_TRANSACTIONS_NOT_ELIGIBLE"] : [],
  }
}

/**
 * Internal Phase 2A command. No route or UI calls this service.
 * The whole package mutation runs in a SERIALIZABLE transaction and retries only
 * database serialization/uniqueness races; workflow events are never written.
 */
export async function materializeGorutUpzisPackage(
  prisma: PrismaClient,
  input: MaterializeGorutPackageInput,
  policy: GorutPackageMaterializationPolicy = {},
  options: { now?: Date; maxAttempts?: number } = {},
) {
  const maxAttempts = options.maxAttempts ?? 3
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(
        (tx) => materializeInTransaction(tx, input, policy, options.now ?? new Date()),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (error) {
      if (!isRetryable(error)) throw error
      if (attempt === maxAttempts) throw retryExhaustedError(error)
    }
  }
  throw new GorutPackageMaterializationError("VERSION_CONFLICT", "Materialization retry limit was reached.")
}
