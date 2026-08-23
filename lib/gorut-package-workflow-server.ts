import {
  GorutCollectionRevisionAction,
  GorutCollectionStatus,
  GorutPackageCorrectionStatus,
  GorutPackageCorrectionTargetType,
  GorutPackageCoverageStatus,
  GorutPackageFinancialStatus,
  GorutReturnReasonCode,
  GorutTransactionState,
  GorutWorkflowAction,
  GorutWorkflowStage,
  Prisma,
  type PrismaClient,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
import {
  assertGorutProvisionalFeePolicyAllowed,
  GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION,
  resolveGorutProvisionalFeeRuntime,
  type GorutProvisionalFeeRuntime,
} from "./gorut-provisional-plpk-fee-policy"
import {
  calculateGorutPackageAvailableActions,
  GorutPackageWorkflowError,
  phase2bTargetState,
  validateGorutReturnReason,
  type GorutPhase2bAction,
} from "./gorut-package-workflow-pure"
import {
  stableSourceHash,
  transactionSourceHash,
  type MaterializationTransactionSource,
} from "./gorut-package-materializer-pure"
import { AUTHORITATIVE_COLLECTION_PACKAGE_POLICY_VERSION } from "./gorut-collection-package-adapter"
import { findCollection, revisionSnapshot, sourceHashFor } from "./gorut-collection-server"

const workflowTransactionSelect = {
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
      id: true,
      munfiqId: true,
      amount: true,
      periodLabel: true,
      munfiq: { select: { id: true, code: true, rantingId: true, plpkId: true } },
    },
    orderBy: [{ munfiq: { code: "asc" as const } }, { id: "asc" as const }],
  },
  collectionSource: {
    select: {
      id: true,
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
      version: true,
      revision: true,
      sourceHash: true,
      transactionSourceHash: true,
      confirmedByPlpkAt: true,
      submittedToKordesAt: true,
      verifiedByKordesAt: true,
      returnedForCorrectionAt: true,
      kordesDecisionByUserId: true,
      kecamatanId: true,
      rantingId: true,
      plpkId: true,
      corrections: { where: { resolvedAt: null }, select: { id: true } },
      entries: {
        select: {
          id: true,
          munfiqId: true,
          visitStatus: true,
          amount: true,
          note: true,
          feeEligibleSnapshot: true,
          plpkFeeSnapshot: true,
          feePolicyVersion: true,
          munfiq: { select: { id: true, code: true, rantingId: true, plpkId: true } },
        },
        orderBy: [{ munfiq: { code: "asc" as const } }, { id: "asc" as const }],
      },
    },
  },
} satisfies Prisma.GorutTransactionSelect

const workflowPackageSelect = {
  id: true,
  packageCode: true,
  kecamatanId: true,
  periodStart: true,
  currentState: true,
  version: true,
  revision: true,
  isHistorical: true,
  financialStatus: true,
  financialBlockingReasons: true,
  grossAmount: true,
  totalPlpkFee: true,
  netAmount: true,
  calculationPolicyVersion: true,
  financialSourceRevision: true,
  financialSourceHash: true,
  lockedAt: true,
  rosterFrozenAt: true,
  rosterFrozenByUserId: true,
  rosterSourceHash: true,
  kecamatan: { select: { code: true } },
  transactionMemberships: {
    select: {
      id: true,
      transactionId: true,
      sourceType: true,
      sourceKey: true,
      sourceVersion: true,
      sourceHash: true,
      transaction: { select: workflowTransactionSelect },
    },
    orderBy: [{ sourceKey: "asc" as const }, { id: "asc" as const }],
  },
  rantingCoverages: {
    select: {
      id: true,
      rantingId: true,
      status: true,
      sourceRantingKey: true,
      sourceRantingName: true,
      exclusionReason: true,
      exclusionReference: true,
      recordedByUserId: true,
      recordedAt: true,
      idempotencyKey: true,
      activeAtCutoff: true,
      ranting: { select: { id: true, code: true, kecamatanId: true, isActive: true } },
    },
    orderBy: [{ sourceRantingKey: "asc" as const }, { id: "asc" as const }],
  },
  workflowEvents: {
    select: {
      id: true,
      actorUserId: true,
      createdAt: true,
      action: true,
      previousState: true,
      resultingState: true,
      metadata: true,
      actor: { select: { memberId: true, name: true } },
      actorAssignment: { select: { role: true } },
    },
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
  },
  corrections: {
    select: {
      id: true,
      correctionCode: true,
      targetType: true,
      rantingId: true,
      transactionId: true,
      collectionId: true,
      reasonCode: true,
      reasonText: true,
      status: true,
    },
    orderBy: [{ requestedAt: "asc" as const }, { id: "asc" as const }],
  },
} satisfies Prisma.GorutUpzisPackageSelect

type TxClient = Prisma.TransactionClient
type WorkflowPackage = Prisma.GorutUpzisPackageGetPayload<{ select: typeof workflowPackageSelect }>
type WorkflowTransaction = Prisma.GorutTransactionGetPayload<{ select: typeof workflowTransactionSelect }>

export type GorutPackageCorrectionTargetInput = {
  targetType: GorutPackageCorrectionTargetType
  targetCode?: string | null
}

export type ExecuteGorutPackageTransitionInput = {
  packageCode: string
  action: GorutPhase2bAction
  expectedVersion: number
  idempotencyKey: string
  reasonCode?: GorutReturnReasonCode | null
  reason?: string | null
  correctionTargets?: GorutPackageCorrectionTargetInput[]
  resolvedCorrectionCodes?: string[]
  resolutionNote?: string | null
}

function assertRuntime(runtime: GorutProvisionalFeeRuntime) {
  try {
    assertGorutProvisionalFeePolicyAllowed(runtime)
  } catch {
    throw new GorutPackageWorkflowError(
      "PACKAGE_PROVISIONAL_POLICY_DISABLED",
      "The provisional GORUT workflow is unavailable in this deployment environment.",
    )
  }
}

function assertUpzisScope(context: GorutOperationalContext, packageRow: WorkflowPackage) {
  if (context.operationalRole !== "UPZIS" || !context.kecamatanId || context.kecamatanId !== packageRow.kecamatanId) {
    throw new GorutPackageWorkflowError("PACKAGE_ACCESS_DENIED", "UPZIS may only mutate a package in its assigned Kecamatan.")
  }
}

function assertTransitionScope(context: GorutOperationalContext, packageRow: WorkflowPackage) {
  assertUpzisScope(context, packageRow)
}

function latestSubmitEvent(packageRow: WorkflowPackage) {
  return packageRow.workflowEvents.find((event) => event.action === GorutWorkflowAction.SUBMIT) ?? null
}

function publicWorkflowResult(packageRow: WorkflowPackage, availableActions: string[], blockingReasons: string[], idempotentReplay: boolean) {
  return {
    packageCode: packageRow.packageCode,
    currentState: packageRow.currentState,
    version: packageRow.version,
    revision: packageRow.revision,
    financialStatus: packageRow.financialStatus,
    availableActions,
    blockingReasons,
    finalApproval: {
      enabled: false,
      approved: false,
      approvedAt: null,
      approvedBy: null,
      sourceValidationCode: null,
      settlementEvidenceCode: null,
      packageVersion: null,
      packageRevision: null,
      assertions: {
        bankSettled: false,
        fundsCleared: false,
        bankDepositCompleted: false,
        proofCryptographicallyVerified: false,
        f016Issued: false,
        finalClose: false,
        administrativeArchiveComplete: false,
      },
    },
    idempotentReplay,
  }
}

function rosterHash(packageRow: WorkflowPackage, rows: WorkflowPackage["rantingCoverages"]) {
  return stableSourceHash({
    kecamatanCode: packageRow.kecamatan.code,
    period: packageRow.periodStart.toISOString().slice(0, 7),
    roster: rows
      .map((row) => ({
        rantingCode: row.ranting?.code ?? row.sourceRantingKey,
        status: row.status,
        exclusionReason: row.exclusionReason,
        exclusionReference: row.exclusionReference,
      }))
      .sort((left, right) => String(left.rantingCode).localeCompare(String(right.rantingCode))),
  })
}

function collectionGateReasons(transaction: WorkflowTransaction) {
  const reasons = new Set<string>()
  const source = transaction.collectionSource
  if (!source) return ["AUTHORITATIVE_COLLECTION_SOURCE_MISSING"]
  if (source.status !== GorutCollectionStatus.VERIFIED_BY_KORDES) reasons.add("COLLECTION_NOT_VERIFIED_BY_KORDES")
  if (!source.confirmedByPlpkAt) reasons.add("PLPK_CONFIRMATION_MISSING")
  if (!source.submittedToKordesAt) reasons.add("KORDES_SUBMISSION_MISSING")
  if (!source.verifiedByKordesAt || !source.kordesDecisionByUserId) reasons.add("KORDES_VERIFICATION_FACT_MISSING")
  if (source.corrections.length) reasons.add("OPEN_COLLECTION_CORRECTION")
  if (
    source.kecamatanId !== transaction.kecamatanId ||
    source.rantingId !== transaction.rantingId ||
    source.plpkId !== transaction.plpkId ||
    transaction.ranting.kecamatanId !== transaction.kecamatanId ||
    transaction.plpk.rantingId !== transaction.rantingId ||
    source.entries.some((entry) => entry.munfiq.rantingId !== source.rantingId || entry.munfiq.plpkId !== source.plpkId)
  ) reasons.add("CANONICAL_HIERARCHY_INVALID")
  if (source.amountAuthorityStatus !== "AUTHORITATIVE") reasons.add("COLLECTION_AMOUNT_NOT_AUTHORITATIVE")
  if (source.feeAuthorityStatus !== "AUTHORITATIVE") reasons.add("COLLECTION_FEE_NOT_AUTHORITATIVE")
  if (
    source.financialStatus !== "READY" ||
    !source.grossAmount ||
    !source.totalPlpkFee ||
    !source.netAmount ||
    !source.financialSourceHash
  ) reasons.add("COLLECTION_FINANCIAL_NOT_READY")
  if (source.calculationPolicyVersion !== GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION) reasons.add("PROVISIONAL_FEE_POLICY_VERSION_REQUIRED")
  if (source.grossAmount && source.totalPlpkFee && source.netAmount && !source.grossAmount.minus(source.totalPlpkFee).equals(source.netAmount)) {
    reasons.add("COLLECTION_FINANCIAL_RECONCILIATION_FAILED")
  }
  const gross = source.entries
    .filter((entry) => entry.visitStatus === "COLLECTED")
    .reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0))
  if (source.grossAmount && !gross.equals(source.grossAmount)) reasons.add("COLLECTION_AMOUNT_RECONCILIATION_FAILED")
  const recorded = source.entries.reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0))
  if (!recorded.equals(transaction.totalAmount)) reasons.add("TRANSACTION_RECORDED_AMOUNT_DRIFT")
  const transactionItemTotal = transaction.items.reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0))
  if (!transactionItemTotal.equals(transaction.totalAmount)) reasons.add("TRANSACTION_ITEM_RECONCILIATION_FAILED")
  if (source.transactionSourceHash !== source.sourceHash) reasons.add("COLLECTION_SOURCE_HASH_DRIFT")
  return [...reasons]
}

function membershipMatchesCorrection(
  membership: WorkflowPackage["transactionMemberships"][number],
  correction: WorkflowPackage["corrections"][number],
) {
  if (correction.targetType === GorutPackageCorrectionTargetType.PACKAGE) return true
  if (correction.targetType === GorutPackageCorrectionTargetType.RANTING) return membership.transaction.rantingId === correction.rantingId
  if (correction.targetType === GorutPackageCorrectionTargetType.TRANSACTION) return membership.transactionId === correction.transactionId
  return membership.transaction.collectionSource?.id === correction.collectionId
}

function sourceHasTraceableDrift(membership: WorkflowPackage["transactionMemberships"][number]) {
  const source = membership.transaction.collectionSource
  return Boolean(source && source.transactionSourceHash && source.transactionSourceHash !== source.sourceHash)
}

async function evaluatePackageGates(
  tx: TxClient,
  packageRow: WorkflowPackage,
  options: { resubmissionPreview?: boolean } = {},
) {
  const reasons = new Set<string>()
  const resubmissionPreview = options.resubmissionPreview === true
  if (!packageRow.currentState) reasons.add("PACKAGE_STATE_MISSING")
  if (!packageRow.transactionMemberships.length) reasons.add("PACKAGE_TRANSACTIONS_EMPTY")
  for (const membership of packageRow.transactionMemberships) {
    const traceableDrift = sourceHasTraceableDrift(membership)
    const ignoredPreviewReasons = new Set([
      "COLLECTION_SOURCE_HASH_DRIFT",
      "TRANSACTION_RECORDED_AMOUNT_DRIFT",
      "TRANSACTION_ITEM_RECONCILIATION_FAILED",
    ])
    for (const reason of collectionGateReasons(membership.transaction)) {
      if (!(resubmissionPreview && traceableDrift && ignoredPreviewReasons.has(reason))) reasons.add(reason)
    }
    const currentHash = transactionSourceHash(membership.transaction as MaterializationTransactionSource)
    if (membership.sourceHash !== currentHash && !(resubmissionPreview && traceableDrift)) reasons.add("PACKAGE_MEMBERSHIP_SOURCE_DRIFT")
    if (membership.transaction.currentState !== GorutTransactionState.DRAFT) reasons.add("TECHNICAL_TRANSACTION_STATE_INVALID")
  }

  if (!resubmissionPreview) {
    if (packageRow.financialStatus !== GorutPackageFinancialStatus.READY) reasons.add("PACKAGE_FINANCIAL_NOT_READY")
    if (
      !packageRow.grossAmount ||
      !packageRow.totalPlpkFee ||
      !packageRow.netAmount ||
      !packageRow.grossAmount.minus(packageRow.totalPlpkFee).equals(packageRow.netAmount)
    ) reasons.add("PACKAGE_FINANCIAL_RECONCILIATION_FAILED")

    const expectedGross = packageRow.transactionMemberships.reduce(
      (sum, membership) => sum.plus(membership.transaction.collectionSource?.grossAmount ?? 0),
      new Prisma.Decimal(0),
    )
    const expectedFee = packageRow.transactionMemberships.reduce(
      (sum, membership) => sum.plus(membership.transaction.collectionSource?.totalPlpkFee ?? 0),
      new Prisma.Decimal(0),
    )
    if (packageRow.grossAmount && !expectedGross.equals(packageRow.grossAmount)) reasons.add("PACKAGE_GROSS_SOURCE_MISMATCH")
    if (packageRow.totalPlpkFee && !expectedFee.equals(packageRow.totalPlpkFee)) reasons.add("PACKAGE_FEE_SOURCE_MISMATCH")
  }

  if (resubmissionPreview) {
    const openCorrections = packageRow.corrections.filter((row) => row.status === GorutPackageCorrectionStatus.OPEN)
    if (!openCorrections.length) reasons.add("PACKAGE_CORRECTION_UNRESOLVED")
    for (const correction of openCorrections) {
      const targets = packageRow.transactionMemberships.filter((membership) => membershipMatchesCorrection(membership, correction))
      if (!targets.length || !targets.some(sourceHasTraceableDrift)) reasons.add("PACKAGE_CORRECTION_SOURCE_UNCHANGED")
    }
  }

  let rosterRows: WorkflowPackage["rantingCoverages"]
  if (packageRow.rosterFrozenAt) {
    rosterRows = packageRow.rantingCoverages.filter((row) => row.activeAtCutoff === true)
    if (!rosterRows.length) reasons.add("FROZEN_ROSTER_EMPTY")
    if (packageRow.rosterSourceHash !== rosterHash(packageRow, rosterRows)) reasons.add("FROZEN_ROSTER_HASH_MISMATCH")
  } else {
    const activeRantings = await tx.gorutRanting.findMany({
      where: { kecamatanId: packageRow.kecamatanId, isActive: true },
      select: { id: true },
      orderBy: { id: "asc" },
    })
    const activeIds = new Set(activeRantings.map((row) => row.id))
    rosterRows = packageRow.rantingCoverages.filter((row) => row.rantingId && activeIds.has(row.rantingId))
    if (rosterRows.length !== activeIds.size) reasons.add("ROSTER_COVERAGE_INCOMPLETE")
  }

  if (rosterRows.some((row) => row.status === GorutPackageCoverageStatus.UNRESOLVED)) reasons.add("UNRESOLVED_COVERAGE")
  if (packageRow.rantingCoverages.some((row) => row.status === GorutPackageCoverageStatus.UNRESOLVED)) reasons.add("UNRESOLVED_COVERAGE")
  if (rosterRows.some((row) => row.status === GorutPackageCoverageStatus.EXCLUDED && (
    !row.exclusionReason?.trim() || !row.recordedByUserId || !row.recordedAt || !row.idempotencyKey
  ))) reasons.add("EXCLUSION_AUDIT_INCOMPLETE")
  if (rosterRows.some((row) => row.status === GorutPackageCoverageStatus.INCLUDED && !packageRow.transactionMemberships.some(
    (membership) => membership.transaction.rantingId === row.rantingId,
  ))) reasons.add("INCLUDED_COVERAGE_WITHOUT_SOURCE")
  if (packageRow.transactionMemberships.some((membership) => !packageRow.rantingCoverages.some(
    (coverage) => coverage.rantingId === membership.transaction.rantingId && coverage.status === GorutPackageCoverageStatus.INCLUDED,
  ))) reasons.add("TRANSACTION_WITHOUT_INCLUDED_COVERAGE")

  return { eligible: reasons.size === 0, blockingReasons: [...reasons].sort(), rosterRows }
}

async function loadPackage(tx: TxClient, packageCode: string) {
  const packageRow = await tx.gorutUpzisPackage.findUnique({ where: { packageCode }, select: workflowPackageSelect })
  if (!packageRow) throw new GorutPackageWorkflowError("PACKAGE_NOT_FOUND", "GORUT package was not found.")
  return packageRow
}

function retryable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2025", "P2034"].includes(error.code)
}

async function serializable<T>(prisma: PrismaClient, run: (tx: TxClient) => Promise<T>) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (!retryable(error)) throw error
      if (attempt === 3) {
        throw new GorutPackageWorkflowError("PACKAGE_VERSION_CONFLICT", "Concurrent package mutation could not be reconciled.")
      }
    }
  }
  throw new GorutPackageWorkflowError("PACKAGE_VERSION_CONFLICT", "Package mutation retry limit was reached.")
}

export async function recordGorutPackageRantingExclusion(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: {
    packageCode: string
    rantingCode: string
    reason: string
    reference?: string | null
    expectedVersion: number
    idempotencyKey: string
  },
  options: { now?: Date; runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  assertRuntime(runtime)
  const now = options.now ?? new Date()
  const reason = input.reason.trim()
  const reference = input.reference?.trim() || null
  if (!reason || !input.idempotencyKey.trim()) {
    throw new GorutPackageWorkflowError("PACKAGE_GATE_BLOCKED", "Exclusion reason and idempotency key are required.")
  }

  return serializable(prisma, async (tx) => {
    const packageRow = await loadPackage(tx, input.packageCode)
    assertUpzisScope(context, packageRow)
    if (packageRow.currentState !== GorutTransactionState.DRAFT || packageRow.rosterFrozenAt) {
      throw new GorutPackageWorkflowError("PACKAGE_STATE_INVALID", "Roster exclusions can only be recorded before first SUBMIT.")
    }
    const byIdempotency = packageRow.rantingCoverages.find((row) => row.idempotencyKey === input.idempotencyKey)
    if (byIdempotency) {
      if (byIdempotency.ranting?.code !== input.rantingCode || byIdempotency.exclusionReason !== reason || byIdempotency.exclusionReference !== reference) {
        throw new GorutPackageWorkflowError("PACKAGE_IDEMPOTENCY_CONFLICT", "Coverage idempotency key was reused with different facts.")
      }
      return { packageCode: packageRow.packageCode, rantingCode: input.rantingCode, status: byIdempotency.status, version: packageRow.version, idempotentReplay: true }
    }
    if (packageRow.version !== input.expectedVersion) {
      throw new GorutPackageWorkflowError("PACKAGE_VERSION_CONFLICT", "Package version does not match expectedVersion.")
    }
    const ranting = await tx.gorutRanting.findFirst({
      where: { code: input.rantingCode, kecamatanId: packageRow.kecamatanId, isActive: true },
      select: { id: true, code: true },
    })
    if (!ranting) throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_TARGET_INVALID", "Active Ranting was not found in the package Kecamatan.")
    if (packageRow.transactionMemberships.some((membership) => membership.transaction.rantingId === ranting.id)) {
      throw new GorutPackageWorkflowError("PACKAGE_GATE_BLOCKED", "A Ranting with authoritative transaction source cannot be excluded.")
    }
    const existing = packageRow.rantingCoverages.find((row) => row.rantingId === ranting.id)
    if (existing) throw new GorutPackageWorkflowError("PACKAGE_SOURCE_CONFLICT", "Ranting coverage already exists and cannot be overwritten silently.")

    await tx.gorutUpzisPackageRantingCoverage.create({
      data: {
        packageId: packageRow.id,
        rantingId: ranting.id,
        status: GorutPackageCoverageStatus.EXCLUDED,
        sourceRantingKey: ranting.code,
        exclusionReason: reason,
        exclusionReference: reference,
        recordedByUserId: context.userId,
        recordedAt: now,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      },
    })
    const updated = await tx.gorutUpzisPackage.update({
      where: { id: packageRow.id, version: packageRow.version },
      data: { version: { increment: 1 }, revision: { increment: 1 }, updatedAt: now },
      select: { version: true },
    })
    return { packageCode: packageRow.packageCode, rantingCode: ranting.code, status: GorutPackageCoverageStatus.EXCLUDED, version: updated.version, idempotentReplay: false }
  })
}

function resolveCorrectionTargets(packageRow: WorkflowPackage, targets: GorutPackageCorrectionTargetInput[]) {
  if (!targets.length) throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_TARGET_INVALID", "RETURN requires at least one correction target.")
  const unique = new Map<string, {
    targetType: GorutPackageCorrectionTargetType
    targetCode: string
    rantingId: string | null
    transactionId: string | null
    collectionId: string | null
  }>()

  for (const target of targets) {
    const code = target.targetCode?.trim() || packageRow.packageCode
    if (target.targetType === GorutPackageCorrectionTargetType.PACKAGE) {
      if (code !== packageRow.packageCode || targets.length !== 1) {
        throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_TARGET_INVALID", "A package-wide RETURN must be the only target.")
      }
      unique.set(`PACKAGE:${code}`, { targetType: target.targetType, targetCode: code, rantingId: null, transactionId: null, collectionId: null })
      continue
    }
    if (target.targetType === GorutPackageCorrectionTargetType.RANTING) {
      const coverage = packageRow.rantingCoverages.find((row) => row.ranting?.code === code)
      if (!coverage?.rantingId) throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_TARGET_INVALID", "Ranting target is outside the package.")
      unique.set(`RANTING:${code}`, { targetType: target.targetType, targetCode: code, rantingId: coverage.rantingId, transactionId: null, collectionId: null })
      continue
    }
    const membership = packageRow.transactionMemberships.find((row) =>
      target.targetType === GorutPackageCorrectionTargetType.TRANSACTION
        ? row.transaction.code === code
        : row.transaction.collectionSource?.collectionCode === code,
    )
    if (!membership) throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_TARGET_INVALID", "Transaction or collection target is outside the package.")
    unique.set(`${target.targetType}:${code}`, {
      targetType: target.targetType,
      targetCode: code,
      rantingId: null,
      transactionId: target.targetType === GorutPackageCorrectionTargetType.TRANSACTION ? membership.transactionId : null,
      collectionId: target.targetType === GorutPackageCorrectionTargetType.COLLECTION ? membership.transaction.collectionSource!.id : null,
    })
  }
  return [...unique.values()]
}

async function reconcileReturnedSources(
  tx: TxClient,
  packageRow: WorkflowPackage,
  actorUserId: string,
  idempotencyKey: string,
  now: Date,
) {
  let changed = false
  for (const membership of packageRow.transactionMemberships) {
    const source = membership.transaction.collectionSource
    if (!source || source.transactionSourceHash === source.sourceHash) continue
    const gateReasons = collectionGateReasons({ ...membership.transaction, totalAmount: source.entries.reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0)) })
      .filter((reason) => reason !== "TRANSACTION_ITEM_RECONCILIATION_FAILED" && reason !== "COLLECTION_SOURCE_HASH_DRIFT")
    if (gateReasons.length) {
      throw new GorutPackageWorkflowError("PACKAGE_SOURCE_CONFLICT", "Corrected collection is not eligible for rebridge.", { blockingReasons: gateReasons })
    }
    const beforeCollection = await findCollection(tx, source.collectionCode)
    const recordedAmount = source.entries.reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0))
    await tx.gorutTransaction.update({
      where: { id: membership.transactionId },
      data: { totalAmount: recordedAmount, updatedAt: now },
    })
    for (const entry of source.entries) {
      await tx.gorutTransactionItem.upsert({
        where: { transactionId_munfiqId: { transactionId: membership.transactionId, munfiqId: entry.munfiqId } },
        create: {
          transactionId: membership.transactionId,
          munfiqId: entry.munfiqId,
          amount: entry.amount,
          periodLabel: packageRow.periodStart.toISOString().slice(0, 7),
          notes: entry.note,
          createdAt: now,
        },
        update: { amount: entry.amount, periodLabel: packageRow.periodStart.toISOString().slice(0, 7), notes: entry.note },
      })
    }
    const nextCollectionRevision = beforeCollection.revision + 1
    await tx.gorutCollectionBatch.update({
      where: { id: beforeCollection.id, version: beforeCollection.version },
      data: {
        transactionSourceRevision: beforeCollection.revision,
        transactionSourceHash: beforeCollection.sourceHash,
        transactionBridgedAt: now,
        version: { increment: 1 },
        revision: nextCollectionRevision,
        updatedAt: now,
      },
    })
    const afterCollection = await findCollection(tx, source.collectionCode)
    await tx.gorutCollectionRevision.create({
      data: {
        batchId: beforeCollection.id,
        revision: nextCollectionRevision,
        action: GorutCollectionRevisionAction.BRIDGE_TRANSACTION,
        idempotencyKey: `${idempotencyKey}:rebridge:${source.collectionCode}`,
        commandHash: stableSourceHash({ action: "RETURNED_PACKAGE_REBRIDGE", packageCode: packageRow.packageCode, sourceHash: beforeCollection.sourceHash }),
        actorUserId,
        reason: "Returned package source reconciliation",
        beforeSnapshot: revisionSnapshot(beforeCollection),
        afterSnapshot: revisionSnapshot(afterCollection),
        createdAt: now,
      },
    })
    const refreshed = await tx.gorutTransaction.findUniqueOrThrow({ where: { id: membership.transactionId }, select: workflowTransactionSelect })
    await tx.gorutUpzisPackageTransaction.update({
      where: { id: membership.id },
      data: {
        sourceVersion: refreshed.updatedAt.toISOString(),
        sourceHash: transactionSourceHash(refreshed as MaterializationTransactionSource),
      },
    })
    changed = true
  }
  return changed
}

async function refreshedFinancial(tx: TxClient, packageId: string, nextRevision: number, now: Date) {
  const memberships = await tx.gorutUpzisPackageTransaction.findMany({
    where: { packageId },
    select: { sourceHash: true, transaction: { select: { collectionSource: { select: { grossAmount: true, totalPlpkFee: true, netAmount: true, financialStatus: true } } } } },
    orderBy: { sourceKey: "asc" },
  })
  let gross = new Prisma.Decimal(0)
  let fee = new Prisma.Decimal(0)
  for (const membership of memberships) {
    const source = membership.transaction.collectionSource
    if (!source || source.financialStatus !== "READY" || !source.grossAmount || !source.totalPlpkFee || !source.netAmount) {
      throw new GorutPackageWorkflowError("PACKAGE_GATE_BLOCKED", "Authoritative collection financial source is incomplete.")
    }
    if (!source.grossAmount.minus(source.totalPlpkFee).equals(source.netAmount)) {
      throw new GorutPackageWorkflowError("PACKAGE_GATE_BLOCKED", "Authoritative collection financial formula does not reconcile.")
    }
    gross = gross.plus(source.grossAmount)
    fee = fee.plus(source.totalPlpkFee)
  }
  return {
    financialStatus: GorutPackageFinancialStatus.READY,
    financialBlockingReasons: [],
    grossAmount: gross,
    totalPlpkFee: fee,
    netAmount: gross.minus(fee),
    calculatedAt: now,
    calculationPolicyVersion: AUTHORITATIVE_COLLECTION_PACKAGE_POLICY_VERSION,
    financialSourceRevision: nextRevision,
    financialSourceHash: stableSourceHash({
      calculationPolicyVersion: AUTHORITATIVE_COLLECTION_PACKAGE_POLICY_VERSION,
      grossAmount: gross.toFixed(2),
      sourceHashes: memberships.map((membership) => membership.sourceHash).sort(),
      totalPlpkFee: fee.toFixed(2),
    }),
  }
}

export async function getGorutPackageWorkflowAvailability(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  packageCode: string,
  options: { runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  const packageRow = await prisma.gorutUpzisPackage.findUnique({ where: { packageCode }, select: workflowPackageSelect })
  if (!packageRow) return undefined
  const gates = await prisma.$transaction((tx) => evaluatePackageGates(tx, packageRow, {
    resubmissionPreview: packageRow.currentState === GorutTransactionState.RETURNED_TO_RANTING,
  }))
  const availability = calculateGorutPackageAvailableActions(context, runtime, {
    packageState: packageRow.currentState,
    scopeMatches: context.operationalRole === "UPZIS" && context.kecamatanId === packageRow.kecamatanId,
    packageEligible: gates.eligible,
    hasOpenCorrections: packageRow.corrections.some((row) => row.status === GorutPackageCorrectionStatus.OPEN),
    submitterUserId: latestSubmitEvent(packageRow)?.actorUserId ?? null,
    blockingReasons: gates.blockingReasons,
  })
  const finalApprovalReadiness = {
    status: "BLOCKED" as const,
    blockingReasons: ["PC_FINALIZATION_OUT_OF_SCOPE"],
  }
  return { ...availability, finalApprovalReadiness }
}

export async function executeGorutPackageTransition(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: ExecuteGorutPackageTransitionInput,
  options: { now?: Date; runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  assertRuntime(runtime)
  const now = options.now ?? new Date()
  const idempotencyKey = input.idempotencyKey.trim()
  if (!idempotencyKey) throw new GorutPackageWorkflowError("PACKAGE_IDEMPOTENCY_CONFLICT", "Idempotency key is required.")
  const normalizedReason = input.reason?.trim() || null
  const commandHash = stableSourceHash({
    action: input.action,
    correctionTargets: input.correctionTargets ?? [],
    expectedVersion: input.expectedVersion,
    packageCode: input.packageCode,
    reason: normalizedReason,
    reasonCode: input.reasonCode ?? null,
    resolvedCorrectionCodes: [...new Set(input.resolvedCorrectionCodes ?? [])].sort(),
    resolutionNote: input.resolutionNote?.trim() || null,
  })

  return serializable(prisma, async (tx) => {
    let packageRow = await loadPackage(tx, input.packageCode)
    assertTransitionScope(context, packageRow)
    const existingEvent = await tx.gorutWorkflowEvent.findUnique({
      where: { packageId_idempotencyKey: { packageId: packageRow.id, idempotencyKey } },
      select: { commandHash: true },
    })
    if (existingEvent) {
      if (existingEvent.commandHash !== commandHash) {
        throw new GorutPackageWorkflowError("PACKAGE_IDEMPOTENCY_CONFLICT", "Transition idempotency key was reused with different command facts.")
      }
      const replayGates = await evaluatePackageGates(tx, packageRow)
      const replayAvailability = calculateGorutPackageAvailableActions(context, runtime, {
        packageState: packageRow.currentState,
        scopeMatches: true,
        packageEligible: replayGates.eligible,
        hasOpenCorrections: packageRow.corrections.some((row) => row.status === GorutPackageCorrectionStatus.OPEN),
        submitterUserId: latestSubmitEvent(packageRow)?.actorUserId ?? null,
        blockingReasons: replayGates.blockingReasons,
      })
      return publicWorkflowResult(packageRow, replayAvailability.availableActions, replayAvailability.blockingReasons, true)
    }
    if (packageRow.version !== input.expectedVersion) {
      throw new GorutPackageWorkflowError("PACKAGE_VERSION_CONFLICT", "Package version does not match expectedVersion.")
    }
    if (!packageRow.currentState) throw new GorutPackageWorkflowError("PACKAGE_STATE_INVALID", "Historical package without state cannot transition.")
    const targetState = phase2bTargetState(packageRow.currentState, input.action)
    if (!targetState) throw new GorutPackageWorkflowError("PACKAGE_ACTION_DISABLED", "Action is not enabled from the current package state.")

    let resolvedTargets: ReturnType<typeof resolveCorrectionTargets> = []
    if (input.action === GorutWorkflowAction.RETURN) {
      if (!validateGorutReturnReason(input.reasonCode, normalizedReason)) {
        throw new GorutPackageWorkflowError("PACKAGE_RETURN_REASON_INVALID", "RETURN reason code or required free-text reason is invalid.")
      }
      resolvedTargets = resolveCorrectionTargets(packageRow, input.correctionTargets ?? [])
    }

    let sourceChanged = false
    if (input.action === GorutWorkflowAction.SUBMIT && packageRow.currentState === GorutTransactionState.RETURNED_TO_RANTING) {
      const openCorrections = packageRow.corrections.filter((row) => row.status === GorutPackageCorrectionStatus.OPEN)
      const resolvedCodes = new Set(input.resolvedCorrectionCodes ?? [])
      if (
        !openCorrections.length ||
        resolvedCodes.size !== openCorrections.length ||
        openCorrections.some((row) => !resolvedCodes.has(row.correctionCode)) ||
        !input.resolutionNote?.trim()
      ) {
        throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_UNRESOLVED", "All open package corrections and a resolution note are required for resubmission.")
      }
      const resubmissionGates = await evaluatePackageGates(tx, packageRow, { resubmissionPreview: true })
      if (!resubmissionGates.eligible) {
        throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_UNRESOLVED", "Returned source corrections are not ready for reconciliation.", {
          blockingReasons: resubmissionGates.blockingReasons,
        })
      }
      sourceChanged = await reconcileReturnedSources(tx, packageRow, context.userId, idempotencyKey, now)
      if (!sourceChanged) {
        throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_UNRESOLVED", "No traceable authoritative source revision was available for resubmission.")
      }
      packageRow = await loadPackage(tx, input.packageCode)
      if (sourceChanged) {
        const sourceRevision = packageRow.revision + 1
        const financialData = await refreshedFinancial(tx, packageRow.id, sourceRevision, now)
        await tx.gorutUpzisPackage.update({
          where: { id: packageRow.id, version: packageRow.version },
          data: { revision: sourceRevision, ...financialData, updatedAt: now },
        })
        packageRow = await loadPackage(tx, input.packageCode)
      }
    }

    const gates = await evaluatePackageGates(tx, packageRow)
    if (
      input.action !== GorutWorkflowAction.RETURN &&
      !gates.eligible
    ) {
      throw new GorutPackageWorkflowError("PACKAGE_GATE_BLOCKED", "Package workflow gates are not satisfied.", { blockingReasons: gates.blockingReasons })
    }
    if (input.action === GorutWorkflowAction.APPROVE && packageRow.currentState === GorutTransactionState.WAITING_UPZIS_VERIFICATION) {
      const submitter = latestSubmitEvent(packageRow)?.actorUserId
      if (!submitter || submitter === context.userId) {
        throw new GorutPackageWorkflowError("PACKAGE_MAKER_CHECKER_VIOLATION", "Package submitter cannot approve the same package.")
      }
    }

    const firstSubmit = input.action === GorutWorkflowAction.SUBMIT && !packageRow.rosterFrozenAt
    const nextVersion = packageRow.version + 1
    const nextRevision = packageRow.revision + (firstSubmit ? 1 : 0)
    let rosterData: Prisma.GorutUpzisPackageUpdateInput = {}
    if (firstSubmit) {
      const activeIds = new Set(gates.rosterRows.map((row) => row.rantingId).filter((id): id is string => Boolean(id)))
      await tx.gorutUpzisPackageRantingCoverage.updateMany({
        where: { packageId: packageRow.id },
        data: { activeAtCutoff: false, updatedAt: now },
      })
      await tx.gorutUpzisPackageRantingCoverage.updateMany({
        where: { packageId: packageRow.id, rantingId: { in: [...activeIds] } },
        data: { activeAtCutoff: true, updatedAt: now },
      })
      rosterData = {
        rosterFrozenAt: now,
        rosterFrozenBy: { connect: { id: context.userId } },
        rosterSourceHash: rosterHash(packageRow, gates.rosterRows),
      }
    }

    const event = await tx.gorutWorkflowEvent.create({
      data: {
        packageId: packageRow.id,
        previousState: packageRow.currentState,
        resultingState: targetState,
        action: input.action,
        stage: GorutWorkflowStage.UPZIS,
        reasonCode: input.action === GorutWorkflowAction.RETURN ? input.reasonCode : null,
        reason: normalizedReason,
        metadata: input.action === GorutWorkflowAction.RETURN
          ? { correctionTargets: resolvedTargets.map((target) => ({ targetType: target.targetType, targetCode: target.targetCode })) }
          : input.action === GorutWorkflowAction.SUBMIT && packageRow.currentState === GorutTransactionState.RETURNED_TO_RANTING
            ? { resolvedCorrectionCodes: [...new Set(input.resolvedCorrectionCodes ?? [])].sort(), resolutionNote: input.resolutionNote!.trim(), sourceChanged }
            : Prisma.JsonNull,
        idempotencyKey,
        commandHash,
        actorUserId: context.userId,
        actorAssignmentId: context.assignmentId,
        createdAt: now,
      },
      select: { id: true },
    })

    if (input.action === GorutWorkflowAction.RETURN) {
      await tx.gorutPackageCorrection.createMany({
        data: resolvedTargets.map((target, index) => ({
          correctionCode: `${packageRow.packageCode}-COR-${nextVersion}-${index + 1}`,
          packageId: packageRow.id,
          returnEventId: event.id,
          targetType: target.targetType,
          rantingId: target.rantingId,
          transactionId: target.transactionId,
          collectionId: target.collectionId,
          reasonCode: input.reasonCode!,
          reasonText: normalizedReason,
          requestedByUserId: context.userId,
          requestedAt: now,
          requestedPackageVersion: nextVersion,
        })),
      })
    }
    if (input.action === GorutWorkflowAction.SUBMIT && packageRow.currentState === GorutTransactionState.RETURNED_TO_RANTING) {
      await tx.gorutPackageCorrection.updateMany({
        where: { packageId: packageRow.id, status: GorutPackageCorrectionStatus.OPEN },
        data: {
          status: GorutPackageCorrectionStatus.RESOLVED,
          resolvedByUserId: context.userId,
          resolvedAt: now,
          resolutionNote: input.resolutionNote!.trim(),
          resolvedPackageVersion: nextVersion,
        },
      })
    }

    await tx.gorutUpzisPackage.update({
      where: { id: packageRow.id, version: packageRow.version },
      data: {
        currentState: targetState,
        version: nextVersion,
        revision: nextRevision,
        lockedAt: packageRow.lockedAt ?? (input.action === GorutWorkflowAction.SUBMIT ? now : null),
        ...rosterData,
        updatedAt: now,
      },
    })
    const after = await loadPackage(tx, input.packageCode)
    const afterGates = await evaluatePackageGates(tx, after)
    const availability = calculateGorutPackageAvailableActions(context, runtime, {
      packageState: after.currentState,
      scopeMatches: true,
      packageEligible: afterGates.eligible,
      hasOpenCorrections: after.corrections.some((row) => row.status === GorutPackageCorrectionStatus.OPEN),
      submitterUserId: latestSubmitEvent(after)?.actorUserId ?? null,
      blockingReasons: afterGates.blockingReasons,
    })
    return publicWorkflowResult(after, availability.availableActions, availability.blockingReasons, false)
  })
}

export async function reopenReturnedCollectionForCorrection(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: {
    packageCode: string
    correctionCode: string
    collectionCode: string
    munfiqCodes?: string[]
    reason: string
    expectedCollectionVersion: number
    idempotencyKey: string
  },
  options: { now?: Date; runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  assertRuntime(runtime)
  const now = options.now ?? new Date()
  const reason = input.reason.trim()
  if (context.operationalRole !== "RANTING" || !context.rantingId || !reason) {
    throw new GorutPackageWorkflowError("PACKAGE_ACCESS_DENIED", "Ranting/Kordes scope and correction reason are required.")
  }
  return serializable(prisma, async (tx) => {
    const packageRow = await loadPackage(tx, input.packageCode)
    if (packageRow.currentState !== GorutTransactionState.RETURNED_TO_RANTING) {
      throw new GorutPackageWorkflowError("PACKAGE_STATE_INVALID", "Package is not returned to Ranting.")
    }
    const correction = packageRow.corrections.find((row) => row.correctionCode === input.correctionCode && row.status === GorutPackageCorrectionStatus.OPEN)
    if (!correction) throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_TARGET_INVALID", "Open package correction was not found.")
    const membership = packageRow.transactionMemberships.find((row) => row.transaction.collectionSource?.collectionCode === input.collectionCode)
    const collection = membership?.transaction.collectionSource
    if (!membership || !collection || collection.rantingId !== context.rantingId) {
      throw new GorutPackageWorkflowError("PACKAGE_ACCESS_DENIED", "Collection is outside the Ranting assignment.")
    }
    const targetMatches = correction.targetType === GorutPackageCorrectionTargetType.PACKAGE ||
      (correction.targetType === GorutPackageCorrectionTargetType.RANTING && correction.rantingId === collection.rantingId) ||
      (correction.targetType === GorutPackageCorrectionTargetType.TRANSACTION && correction.transactionId === membership.transactionId) ||
      (correction.targetType === GorutPackageCorrectionTargetType.COLLECTION && correction.collectionId === collection.id)
    if (!targetMatches) throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_TARGET_INVALID", "Collection is not covered by the correction target.")

    const before = await findCollection(tx, input.collectionCode)
    const existingCommand = await tx.gorutCollectionRevision.findUnique({
      where: { batchId_idempotencyKey: { batchId: before.id, idempotencyKey: input.idempotencyKey } },
      select: { commandHash: true },
    })
    const commandHash = stableSourceHash({ action: "PACKAGE_RETURN_CORRECTION", collectionCode: input.collectionCode, correctionCode: input.correctionCode, munfiqCodes: [...new Set(input.munfiqCodes ?? [])].sort(), reason })
    if (existingCommand) {
      if (existingCommand.commandHash !== commandHash) throw new GorutPackageWorkflowError("PACKAGE_IDEMPOTENCY_CONFLICT", "Correction idempotency key was reused.")
      return { collectionCode: before.collectionCode, status: before.status, version: before.version, idempotentReplay: true }
    }
    if (before.version !== input.expectedCollectionVersion || before.status !== GorutCollectionStatus.VERIFIED_BY_KORDES) {
      throw new GorutPackageWorkflowError("PACKAGE_VERSION_CONFLICT", "Verified collection version/state is not eligible for correction reopen.")
    }
    const requestedCodes = new Set(input.munfiqCodes?.length ? input.munfiqCodes : before.entries.map((entry) => entry.munfiq.code))
    const entries = before.entries.filter((entry) => requestedCodes.has(entry.munfiq.code))
    if (!entries.length || entries.length !== requestedCodes.size) {
      throw new GorutPackageWorkflowError("PACKAGE_CORRECTION_TARGET_INVALID", "One or more Munfiq correction targets are outside the collection.")
    }
    const nextRevision = before.revision + 1
    const nextSourceHash = sourceHashFor(before, GorutCollectionStatus.NEEDS_CORRECTION)
    await tx.gorutCollectionBatch.update({
      where: { id: before.id, version: before.version },
      data: {
        status: GorutCollectionStatus.NEEDS_CORRECTION,
        verifiedByKordesAt: null,
        returnedForCorrectionAt: now,
        kordesDecisionByUserId: context.userId,
        kordesMoneyMatches: false,
        kordesHasDamagedMoney: false,
        kordesCashReceived: false,
        kordesNote: reason,
        lockedAt: now,
        sourceHash: nextSourceHash,
        version: { increment: 1 },
        revision: nextRevision,
        updatedAt: now,
      },
    })
    await tx.gorutCollectionCorrection.createMany({
      data: entries.map((entry) => ({
        batchId: before.id,
        entryId: entry.id,
        reason,
        requestedByUserId: context.userId,
        requestedAt: now,
        requestRevision: nextRevision,
      })),
    })
    const after = await findCollection(tx, input.collectionCode)
    await tx.gorutCollectionRevision.create({
      data: {
        batchId: before.id,
        revision: nextRevision,
        action: GorutCollectionRevisionAction.REQUEST_CORRECTION,
        idempotencyKey: input.idempotencyKey,
        commandHash,
        reason,
        actorUserId: context.userId,
        beforeSnapshot: revisionSnapshot(before),
        afterSnapshot: revisionSnapshot(after),
        createdAt: now,
      },
    })
    return { collectionCode: after.collectionCode, status: after.status, version: after.version, idempotentReplay: false }
  })
}
