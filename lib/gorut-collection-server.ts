import {
  GorutCollectionAuthorityStatus,
  GorutCollectionFinancialStatus,
  GorutCollectionRecordOrigin,
  GorutCollectionRevisionAction,
  GorutCollectionStatus,
  GorutCollectionVisitStatus,
  Prisma,
  type PrismaClient,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
import {
  buildCollectionCode,
  buildInitialPendingCollectionEntries,
  calculateCollectionFinancialFacts,
  canVerifyCollectionAsKordes,
  canWriteCollectionAsPlpk,
  collectionEntrySourceHash,
  collectionSourceHash,
  GorutCollectionError,
  normalizeCollectionPeriod,
} from "./gorut-collection-pure"
import { stableSourceHash } from "./gorut-package-materializer-pure"
import {
  assertGorutProvisionalFeePolicyAllowed,
  getConfiguredGorutProvisionalPlpkFeePolicy,
  GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY,
  resolveGorutProvisionalFeeRuntime,
  type GorutProvisionalFeeRuntime,
} from "./gorut-provisional-plpk-fee-policy"

const SERVER_COLLECTION_SOURCE_TYPE = "SERVER_COLLECTION_COMMAND"
const COLLECTION_TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 10_000,
  timeout: 60_000,
} as const

const collectionSelect = {
  id: true,
  collectionCode: true,
  creationIdempotencyKey: true,
  periodStart: true,
  kecamatanId: true,
  rantingId: true,
  plpkId: true,
  status: true,
  recordOrigin: true,
  amountAuthorityStatus: true,
  feeAuthorityStatus: true,
  financialStatus: true,
  financialBlockingReasons: true,
  grossAmount: true,
  totalPlpkFee: true,
  netAmount: true,
  calculatedAt: true,
  calculationPolicyVersion: true,
  financialSourceHash: true,
  version: true,
  revision: true,
  sourceHash: true,
  confirmedByPlpkAt: true,
  confirmedByPlpkUserId: true,
  submittedToKordesAt: true,
  submittedToKordesByUserId: true,
  verifiedByKordesAt: true,
  returnedForCorrectionAt: true,
  kordesMoneyMatches: true,
  kordesHasDamagedMoney: true,
  kordesCashReceived: true,
  kordesNote: true,
  kordesDecisionByUserId: true,
  lockedAt: true,
  transactionId: true,
  transactionSourceRevision: true,
  transactionSourceHash: true,
  transactionBridgedAt: true,
  createdByUserId: true,
  kecamatan: { select: { code: true } },
  ranting: { select: { code: true, kecamatanId: true } },
  plpk: { select: { code: true, rantingId: true } },
  entries: {
    select: {
      id: true,
      munfiqId: true,
      visitStatus: true,
      amount: true,
      collectedAt: true,
      note: true,
      feeEligibleSnapshot: true,
      plpkFeeSnapshot: true,
      feePolicyVersion: true,
      sourceType: true,
      sourceKey: true,
      sourceHash: true,
      munfiq: { select: { code: true, rantingId: true, plpkId: true } },
    },
    orderBy: [{ munfiq: { code: "asc" as const } }, { id: "asc" as const }],
  },
  corrections: {
    where: { resolvedAt: null },
    select: { id: true, entryId: true, reason: true, requestRevision: true },
    orderBy: [{ requestedAt: "asc" as const }, { id: "asc" as const }],
  },
} satisfies Prisma.GorutCollectionBatchSelect

export type GorutCollectionSource = Prisma.GorutCollectionBatchGetPayload<{ select: typeof collectionSelect }>
type TxClient = Prisma.TransactionClient

export type GorutCollectionFeePolicy = {
  authority: "BUSINESS_CONFIRMED" | typeof GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY
  version: string
  calculate(input: { amount: Prisma.Decimal; visitStatus: GorutCollectionVisitStatus }): {
    eligible: boolean
    feeAmount: Prisma.Decimal | string
  }
}

function publicCollection(batch: GorutCollectionSource) {
  return {
    collectionCode: batch.collectionCode,
    period: batch.periodStart.toISOString().slice(0, 7),
    status: batch.status,
    origin: batch.recordOrigin,
    version: batch.version,
    revision: batch.revision,
    sourceHash: batch.sourceHash,
    region: {
      kecamatanCode: batch.kecamatan.code,
      rantingCode: batch.ranting.code,
      plpkCode: batch.plpk.code,
    },
    financial: {
      amountAuthorityStatus: batch.amountAuthorityStatus,
      feeAuthorityStatus: batch.feeAuthorityStatus,
      status: batch.financialStatus,
      blockingReasons: batch.financialBlockingReasons,
      grossAmount: batch.grossAmount?.toFixed(2) ?? null,
      totalPlpkFee: batch.totalPlpkFee?.toFixed(2) ?? null,
      netAmount: batch.netAmount?.toFixed(2) ?? null,
      calculationPolicyVersion: batch.calculationPolicyVersion,
      sourceHash: batch.financialSourceHash,
    },
    facts: {
      confirmedByPlpkAt: batch.confirmedByPlpkAt?.toISOString() ?? null,
      submittedToKordesAt: batch.submittedToKordesAt?.toISOString() ?? null,
      verifiedByKordesAt: batch.verifiedByKordesAt?.toISOString() ?? null,
      returnedForCorrectionAt: batch.returnedForCorrectionAt?.toISOString() ?? null,
    },
    entryCount: batch.entries.length,
    openCorrectionCount: batch.corrections.length,
    transactionBridge: batch.transactionId ? {
      sourceRevision: batch.transactionSourceRevision,
      sourceHash: batch.transactionSourceHash,
      bridgedAt: batch.transactionBridgedAt?.toISOString() ?? null,
    } : null,
  }
}

function revisionSnapshot(batch: GorutCollectionSource): Prisma.InputJsonObject {
  return {
    collectionCode: batch.collectionCode,
    period: batch.periodStart.toISOString().slice(0, 7),
    status: batch.status,
    version: batch.version,
    revision: batch.revision,
    sourceHash: batch.sourceHash,
    financialStatus: batch.financialStatus,
    amountAuthorityStatus: batch.amountAuthorityStatus,
    feeAuthorityStatus: batch.feeAuthorityStatus,
    financialBlockingReasons: batch.financialBlockingReasons,
    grossAmount: batch.grossAmount?.toFixed(2) ?? null,
    totalPlpkFee: batch.totalPlpkFee?.toFixed(2) ?? null,
    netAmount: batch.netAmount?.toFixed(2) ?? null,
    calculatedAt: batch.calculatedAt?.toISOString() ?? null,
    calculationPolicyVersion: batch.calculationPolicyVersion,
    financialSourceHash: batch.financialSourceHash,
    confirmedByPlpkAt: batch.confirmedByPlpkAt?.toISOString() ?? null,
    submittedToKordesAt: batch.submittedToKordesAt?.toISOString() ?? null,
    verifiedByKordesAt: batch.verifiedByKordesAt?.toISOString() ?? null,
    returnedForCorrectionAt: batch.returnedForCorrectionAt?.toISOString() ?? null,
    transactionBridge: batch.transactionId ? {
      transactionSourceRevision: batch.transactionSourceRevision,
      transactionSourceHash: batch.transactionSourceHash,
      transactionBridgedAt: batch.transactionBridgedAt?.toISOString() ?? null,
    } : null,
    entries: batch.entries.map((entry) => ({
      munfiqCode: entry.munfiq.code,
      visitStatus: entry.visitStatus,
      amount: entry.amount.toFixed(2),
      collectedAt: entry.collectedAt?.toISOString() ?? null,
      note: entry.note,
      eligibleForPlpkFee: entry.feeEligibleSnapshot,
      plpkFee: entry.plpkFeeSnapshot?.toFixed(2) ?? null,
      feePolicyVersion: entry.feePolicyVersion,
      sourceHash: entry.sourceHash,
    })),
  }
}

function sourceHashFor(batch: GorutCollectionSource, status = batch.status) {
  return collectionSourceHash({
    collectionCode: batch.collectionCode,
    periodStart: batch.periodStart,
    kecamatanCode: batch.kecamatan.code,
    rantingCode: batch.ranting.code,
    plpkCode: batch.plpk.code,
    status,
    entries: batch.entries.map((entry) => ({
      munfiqCode: entry.munfiq.code,
      visitStatus: entry.visitStatus,
      amount: entry.amount,
      collectedAt: entry.collectedAt,
      note: entry.note,
      feeEligibleSnapshot: entry.feeEligibleSnapshot,
      plpkFeeSnapshot: entry.plpkFeeSnapshot,
      feePolicyVersion: entry.feePolicyVersion,
    })),
  })
}

function financialData(batch: GorutCollectionSource, now: Date) {
  const facts = calculateCollectionFinancialFacts(batch.entries, batch.amountAuthorityStatus)
  return facts.financialStatus === GorutCollectionFinancialStatus.READY ? {
    amountAuthorityStatus: facts.amountAuthorityStatus,
    feeAuthorityStatus: facts.feeAuthorityStatus,
    financialStatus: facts.financialStatus,
    financialBlockingReasons: facts.financialBlockingReasons,
    grossAmount: facts.grossAmount,
    totalPlpkFee: facts.totalPlpkFee,
    netAmount: facts.netAmount,
    calculatedAt: now,
    calculationPolicyVersion: facts.calculationPolicyVersion,
    financialSourceHash: facts.financialSourceHash,
  } : {
    amountAuthorityStatus: facts.amountAuthorityStatus,
    feeAuthorityStatus: facts.feeAuthorityStatus,
    financialStatus: facts.financialStatus,
    financialBlockingReasons: facts.financialBlockingReasons,
    grossAmount: facts.grossAmount,
    totalPlpkFee: null,
    netAmount: null,
    calculatedAt: null,
    calculationPolicyVersion: null,
    financialSourceHash: null,
  }
}

async function findCollection(tx: TxClient, collectionCode: string) {
  const batch = await tx.gorutCollectionBatch.findUnique({ where: { collectionCode }, select: collectionSelect })
  if (!batch) throw new GorutCollectionError("COLLECTION_NOT_FOUND", "Authoritative collection was not found.")
  if (
    batch.ranting.kecamatanId !== batch.kecamatanId ||
    batch.plpk.rantingId !== batch.rantingId ||
    batch.entries.some((entry) => entry.munfiq.rantingId !== batch.rantingId || entry.munfiq.plpkId !== batch.plpkId)
  ) {
    throw new GorutCollectionError("COLLECTION_HIERARCHY_MISMATCH", "Collection hierarchy is inconsistent.")
  }
  return batch
}

async function idempotentRevision(tx: TxClient, batch: GorutCollectionSource, idempotencyKey: string, commandHash: string) {
  const existing = await tx.gorutCollectionRevision.findUnique({
    where: { batchId_idempotencyKey: { batchId: batch.id, idempotencyKey } },
    select: { commandHash: true },
  })
  if (!existing) return false
  if (existing.commandHash !== commandHash) {
    throw new GorutCollectionError("COLLECTION_IDEMPOTENCY_CONFLICT", "Idempotency key was reused with different command facts.")
  }
  return true
}

function retryable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2025", "P2034"].includes(error.code)
}

async function serializable<T>(prisma: PrismaClient, run: (tx: TxClient) => Promise<T>, maxAttempts = 6): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(run, COLLECTION_TRANSACTION_OPTIONS)
    } catch (error) {
      if (!retryable(error)) throw error
      if (attempt === maxAttempts) {
        const code = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "COLLECTION_IDEMPOTENCY_CONFLICT"
          : "COLLECTION_VERSION_CONFLICT"
        throw new GorutCollectionError(code, "Concurrent collection command could not be reconciled.")
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 5))
    }
  }
  throw new GorutCollectionError("COLLECTION_VERSION_CONFLICT", "Collection command retry limit was reached.")
}

function requireExpectedVersion(batch: GorutCollectionSource, expectedVersion: number) {
  if (batch.version !== expectedVersion) {
    throw new GorutCollectionError("COLLECTION_VERSION_CONFLICT", "Collection version does not match expectedVersion.", {
      expectedVersion,
      actualVersion: batch.version,
    })
  }
}

export async function createAuthoritativeCollection(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: { period: string | Date; idempotencyKey: string },
  options: { now?: Date } = {},
) {
  if (context.operationalRole !== "PLPK" || !context.plpkId) {
    throw new GorutCollectionError("COLLECTION_ACCESS_DENIED", "Only a canonical PLPK assignment may create a collection.")
  }
  const period = normalizeCollectionPeriod(input.period)
  const now = options.now ?? new Date()
  const commandHash = stableSourceHash({ action: "CREATE", period: period.key, plpkId: context.plpkId })

  return serializable(prisma, async (tx) => {
    const plpk = await tx.gorutPlpk.findUnique({
      where: { id: context.plpkId! },
      select: { id: true, code: true, rantingId: true, ranting: { select: { id: true, code: true, kecamatanId: true, kecamatan: { select: { id: true, code: true } } } } },
    })
    if (!plpk) throw new GorutCollectionError("COLLECTION_ACCESS_DENIED", "PLPK assignment is unresolved.")
    const collectionCode = buildCollectionCode(plpk.code, period)
    const byKey = await tx.gorutCollectionBatch.findUnique({ where: { creationIdempotencyKey: input.idempotencyKey }, select: collectionSelect })
    if (byKey) {
      if (byKey.collectionCode !== collectionCode) {
        throw new GorutCollectionError("COLLECTION_IDEMPOTENCY_CONFLICT", "Creation idempotency key belongs to another grain.")
      }
      return { collection: publicCollection(byKey), created: false, idempotentReplay: true }
    }
    const byGrain = await tx.gorutCollectionBatch.findUnique({
      where: { plpkId_periodStart: { plpkId: plpk.id, periodStart: period.start } },
      select: { collectionCode: true },
    })
    if (byGrain) throw new GorutCollectionError("COLLECTION_GRAIN_CONFLICT", "Canonical PLPK and period already have a collection.")

    const assignedMunfiqs = await tx.gorutMunfiq.findMany({
      where: { plpkId: plpk.id, rantingId: plpk.ranting.id, isActive: true },
      select: { id: true, code: true },
      orderBy: [{ code: "asc" }, { id: "asc" }],
    })
    const initialEntries = buildInitialPendingCollectionEntries(collectionCode, assignedMunfiqs)
    const emptyFinancial = calculateCollectionFinancialFacts(initialEntries.map((entry) => ({
      visitStatus: entry.visitStatus,
      amount: new Prisma.Decimal(entry.amount),
      feeEligibleSnapshot: entry.feeEligibleSnapshot,
      plpkFeeSnapshot: entry.plpkFeeSnapshot,
      feePolicyVersion: entry.feePolicyVersion,
    })), GorutCollectionAuthorityStatus.AUTHORITATIVE)
    const initialSourceHash = collectionSourceHash({
      collectionCode,
      periodStart: period.start,
      kecamatanCode: plpk.ranting.kecamatan.code,
      rantingCode: plpk.ranting.code,
      plpkCode: plpk.code,
      status: GorutCollectionStatus.DRAFT,
      entries: initialEntries.map((entry) => ({
        munfiqCode: entry.munfiqCode,
        visitStatus: entry.visitStatus,
        amount: new Prisma.Decimal(entry.amount),
        collectedAt: entry.collectedAt,
        note: entry.note,
        feeEligibleSnapshot: entry.feeEligibleSnapshot,
        plpkFeeSnapshot: entry.plpkFeeSnapshot,
        feePolicyVersion: entry.feePolicyVersion,
      })),
    })
    const batch = await tx.gorutCollectionBatch.create({
      data: {
        collectionCode,
        creationIdempotencyKey: input.idempotencyKey,
        periodStart: period.start,
        kecamatanId: plpk.ranting.kecamatan.id,
        rantingId: plpk.ranting.id,
        plpkId: plpk.id,
        status: GorutCollectionStatus.DRAFT,
        recordOrigin: GorutCollectionRecordOrigin.NATIVE,
        amountAuthorityStatus: GorutCollectionAuthorityStatus.AUTHORITATIVE,
        feeAuthorityStatus: emptyFinancial.feeAuthorityStatus,
        financialStatus: emptyFinancial.financialStatus,
        financialBlockingReasons: emptyFinancial.financialBlockingReasons,
        grossAmount: emptyFinancial.grossAmount,
        totalPlpkFee: emptyFinancial.totalPlpkFee,
        netAmount: emptyFinancial.netAmount,
        sourceHash: initialSourceHash,
        createdByUserId: context.userId,
        createdAt: now,
        updatedAt: now,
        entries: {
          create: initialEntries.map((entry) => ({
            munfiqId: entry.munfiqId,
            visitStatus: entry.visitStatus,
            amount: entry.amount,
            collectedAt: entry.collectedAt,
            note: entry.note,
            feeEligibleSnapshot: entry.feeEligibleSnapshot,
            plpkFeeSnapshot: entry.plpkFeeSnapshot,
            feePolicyVersion: entry.feePolicyVersion,
            sourceType: entry.sourceType,
            sourceKey: entry.sourceKey,
            sourceHash: entry.sourceHash,
            createdAt: now,
            updatedAt: now,
          })),
        },
      },
      select: collectionSelect,
    })
    await tx.gorutCollectionRevision.create({
      data: {
        batchId: batch.id,
        revision: 1,
        action: GorutCollectionRevisionAction.CREATE,
        idempotencyKey: input.idempotencyKey,
        commandHash,
        actorUserId: context.userId,
        afterSnapshot: revisionSnapshot(batch),
        createdAt: now,
      },
    })
    return { collection: publicCollection(batch), created: true, idempotentReplay: false }
  })
}

export async function recordAuthoritativeCollectionEntry(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: {
    collectionCode: string
    munfiqCode: string
    visitStatus: GorutCollectionVisitStatus
    amount: string
    note?: string | null
    reason?: string | null
    expectedVersion: number
    idempotencyKey: string
  },
  options: { now?: Date; feePolicy?: GorutCollectionFeePolicy; feeRuntime?: GorutProvisionalFeeRuntime } = {},
) {
  const now = options.now ?? new Date()
  const amount = new Prisma.Decimal(input.amount)
  const normalizedNote = input.note?.trim() || null
  const feeRuntime = options.feeRuntime ?? resolveGorutProvisionalFeeRuntime()
  const feePolicy = options.feePolicy ?? getConfiguredGorutProvisionalPlpkFeePolicy(feeRuntime)
  if (feePolicy?.authority === GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY) {
    assertGorutProvisionalFeePolicyAllowed(feeRuntime)
  }
  if (feePolicy && !feePolicy.version.trim()) {
    throw new GorutCollectionError("COLLECTION_FINANCIAL_INCOMPLETE", "Fee policy authority or version is invalid.")
  }
  if (amount.isNegative() || (input.visitStatus !== GorutCollectionVisitStatus.COLLECTED && !amount.isZero())) {
    throw new GorutCollectionError("COLLECTION_AMOUNT_INVALID", "Amount must be non-negative and zero for non-collected outcomes.")
  }
  if (input.visitStatus !== GorutCollectionVisitStatus.PENDING && input.visitStatus !== GorutCollectionVisitStatus.COLLECTED && !normalizedNote) {
    throw new GorutCollectionError("COLLECTION_NOTE_REQUIRED", "A factual note is required for a non-collected outcome.")
  }
  const feeSnapshot = feePolicy?.calculate({ amount, visitStatus: input.visitStatus })
  const feeAmount = feeSnapshot ? new Prisma.Decimal(feeSnapshot.feeAmount.toString()) : null
  if (feeAmount?.isNegative() || (feeSnapshot && !feeSnapshot.eligible && !feeAmount!.isZero())) {
    throw new GorutCollectionError("COLLECTION_AMOUNT_INVALID", "Fee policy returned an inconsistent snapshot.")
  }
  const commandHash = stableSourceHash({
    action: "RECORD_ENTRY",
    collectionCode: input.collectionCode,
    munfiqCode: input.munfiqCode,
    visitStatus: input.visitStatus,
    amount: amount.toFixed(2),
    note: normalizedNote,
    reason: input.reason?.trim() || null,
    feePolicyVersion: feePolicy?.version ?? null,
    feeEligibleSnapshot: feeSnapshot?.eligible ?? null,
    plpkFeeSnapshot: feeAmount?.toFixed(2) ?? null,
  })

  return serializable(prisma, async (tx) => {
    const before = await findCollection(tx, input.collectionCode)
    if (!canWriteCollectionAsPlpk(context, before.plpkId)) {
      throw new GorutCollectionError("COLLECTION_ACCESS_DENIED", "PLPK may only write its own collection.")
    }
    if (await idempotentRevision(tx, before, input.idempotencyKey, commandHash)) {
      return { collection: publicCollection(before), idempotentReplay: true }
    }
    requireExpectedVersion(before, input.expectedVersion)
    if (!(new Set<GorutCollectionStatus>([GorutCollectionStatus.DRAFT, GorutCollectionStatus.COLLECTING, GorutCollectionStatus.COLLECTION_COMPLETED, GorutCollectionStatus.NEEDS_CORRECTION])).has(before.status)) {
      throw new GorutCollectionError("COLLECTION_STATE_INVALID", "Collection is locked for entry changes.")
    }
    const munfiq = await tx.gorutMunfiq.findUnique({ where: { code: input.munfiqCode }, select: { id: true, code: true, rantingId: true, plpkId: true } })
    if (!munfiq || munfiq.rantingId !== before.rantingId || munfiq.plpkId !== before.plpkId) {
      throw new GorutCollectionError("COLLECTION_HIERARCHY_MISMATCH", "Munfiq is outside the collection PLPK/Ranting scope.")
    }
    const existingEntry = before.entries.find((entry) => entry.munfiqId === munfiq.id)
    const openCorrection = existingEntry ? before.corrections.find((row) => row.entryId === existingEntry.id) : undefined
    if (before.status === GorutCollectionStatus.NEEDS_CORRECTION && (!openCorrection || !input.reason?.trim())) {
      throw new GorutCollectionError("COLLECTION_CORRECTION_REQUIRED", "Only a requested correction with a reason may change this collection.")
    }

    const nextRevision = before.revision + 1
    const collectedAt = input.visitStatus === GorutCollectionVisitStatus.COLLECTED ? now : null
    const entrySourceKey = `${before.collectionCode}:${munfiq.code}`
    const entryHash = collectionEntrySourceHash({
      collectionCode: before.collectionCode,
      munfiqCode: munfiq.code,
      visitStatus: input.visitStatus,
      amount,
      collectedAt,
      note: normalizedNote,
      feeEligibleSnapshot: feeSnapshot?.eligible ?? null,
      plpkFeeSnapshot: feeAmount,
      feePolicyVersion: feePolicy?.version ?? null,
    })
    await tx.gorutCollectionEntry.upsert({
      where: { batchId_munfiqId: { batchId: before.id, munfiqId: munfiq.id } },
      create: {
        batchId: before.id,
        munfiqId: munfiq.id,
        visitStatus: input.visitStatus,
        amount,
        collectedAt,
        note: normalizedNote,
        feeEligibleSnapshot: feeSnapshot?.eligible ?? null,
        plpkFeeSnapshot: feeAmount,
        feePolicyVersion: feePolicy?.version ?? null,
        sourceType: SERVER_COLLECTION_SOURCE_TYPE,
        sourceKey: entrySourceKey,
        sourceHash: entryHash,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        visitStatus: input.visitStatus,
        amount,
        collectedAt,
        note: normalizedNote,
        feeEligibleSnapshot: feeSnapshot?.eligible ?? null,
        plpkFeeSnapshot: feeAmount,
        feePolicyVersion: feePolicy?.version ?? null,
        sourceHash: entryHash,
        updatedAt: now,
      },
    })
    if (openCorrection) {
      await tx.gorutCollectionCorrection.update({
        where: { id: openCorrection.id },
        data: { resolvedByUserId: context.userId, resolvedAt: now, resolutionRevision: nextRevision },
      })
    }
    const withEntry = await findCollection(tx, input.collectionCode)
    const nextStatus = before.status === GorutCollectionStatus.NEEDS_CORRECTION ? before.status : GorutCollectionStatus.COLLECTING
    const financial = financialData(withEntry, now)
    const nextSourceHash = sourceHashFor(withEntry, nextStatus)
    await tx.gorutCollectionBatch.update({
      where: { id: before.id, version: before.version },
      data: {
        status: nextStatus,
        version: { increment: 1 },
        revision: nextRevision,
        sourceHash: nextSourceHash,
        ...financial,
        updatedAt: now,
      },
    })
    const after = await findCollection(tx, input.collectionCode)
    await tx.gorutCollectionRevision.create({
      data: {
        batchId: before.id,
        revision: nextRevision,
        action: openCorrection ? GorutCollectionRevisionAction.CORRECT_ENTRY : GorutCollectionRevisionAction.RECORD_ENTRY,
        idempotencyKey: input.idempotencyKey,
        commandHash,
        reason: input.reason?.trim() || null,
        actorUserId: context.userId,
        beforeSnapshot: revisionSnapshot(before),
        afterSnapshot: revisionSnapshot(after),
        createdAt: now,
      },
    })
    return { collection: publicCollection(after), idempotentReplay: false }
  })
}

export async function confirmAndSubmitCollectionByPlpk(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: { collectionCode: string; expectedVersion: number; idempotencyKey: string },
  options: { now?: Date } = {},
) {
  const now = options.now ?? new Date()
  const commandHash = stableSourceHash({ action: "CONFIRM_AND_SUBMIT", collectionCode: input.collectionCode })
  return serializable(prisma, async (tx) => {
    const before = await findCollection(tx, input.collectionCode)
    if (!canWriteCollectionAsPlpk(context, before.plpkId)) throw new GorutCollectionError("COLLECTION_ACCESS_DENIED", "PLPK may only confirm its own collection.")
    if (await idempotentRevision(tx, before, input.idempotencyKey, commandHash)) return { collection: publicCollection(before), idempotentReplay: true }
    requireExpectedVersion(before, input.expectedVersion)
    if (!(new Set<GorutCollectionStatus>([GorutCollectionStatus.DRAFT, GorutCollectionStatus.COLLECTING, GorutCollectionStatus.COLLECTION_COMPLETED, GorutCollectionStatus.NEEDS_CORRECTION])).has(before.status)) {
      throw new GorutCollectionError("COLLECTION_STATE_INVALID", "Collection cannot be confirmed from its current state.")
    }
    if (!before.entries.length || before.entries.some((entry) => entry.visitStatus === GorutCollectionVisitStatus.PENDING)) {
      throw new GorutCollectionError("COLLECTION_STATE_INVALID", "All recorded collection entries must have a factual visit result.")
    }
    if (before.entries.some((entry) => entry.visitStatus === GorutCollectionVisitStatus.COLLECTED && !entry.amount.greaterThan(0))) {
      throw new GorutCollectionError("COLLECTION_AMOUNT_INVALID", "Collected entries must have an amount greater than zero before confirmation.")
    }
    if (before.corrections.length) throw new GorutCollectionError("COLLECTION_CORRECTION_REQUIRED", "All requested corrections must be resolved before resubmission.")

    const nextRevision = before.revision + 1
    const nextStatus = GorutCollectionStatus.WAITING_KORDES_VERIFICATION
    const nextSourceHash = sourceHashFor(before, nextStatus)
    await tx.gorutCollectionBatch.update({
      where: { id: before.id, version: before.version },
      data: {
        status: nextStatus,
        confirmedByPlpkAt: now,
        confirmedByPlpkUserId: context.userId,
        submittedToKordesAt: now,
        submittedToKordesByUserId: context.userId,
        verifiedByKordesAt: null,
        returnedForCorrectionAt: null,
        kordesDecisionByUserId: null,
        kordesMoneyMatches: null,
        kordesHasDamagedMoney: null,
        kordesCashReceived: null,
        kordesNote: null,
        lockedAt: now,
        sourceHash: nextSourceHash,
        version: { increment: 1 },
        revision: nextRevision,
        updatedAt: now,
      },
    })
    const after = await findCollection(tx, input.collectionCode)
    await tx.gorutCollectionRevision.create({
      data: {
        batchId: before.id,
        revision: nextRevision,
        action: GorutCollectionRevisionAction.CONFIRM_AND_SUBMIT,
        idempotencyKey: input.idempotencyKey,
        commandHash,
        actorUserId: context.userId,
        beforeSnapshot: revisionSnapshot(before),
        afterSnapshot: revisionSnapshot(after),
        createdAt: now,
      },
    })
    return { collection: publicCollection(after), idempotentReplay: false }
  })
}

export async function decideCollectionByKordes(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: {
    collectionCode: string
    decision: "VERIFY" | "CORRECTION"
    moneyMatches: boolean
    hasDamagedMoney: boolean
    cashReceived: boolean
    note?: string | null
    correctionMunfiqCodes?: string[]
    expectedVersion: number
    idempotencyKey: string
  },
  options: { now?: Date } = {},
) {
  const now = options.now ?? new Date()
  const note = input.note?.trim() || null
  const correctionCodes = [...new Set(input.correctionMunfiqCodes ?? [])].sort()
  const commandHash = stableSourceHash({
    action: input.decision,
    collectionCode: input.collectionCode,
    moneyMatches: input.moneyMatches,
    hasDamagedMoney: input.hasDamagedMoney,
    cashReceived: input.cashReceived,
    note,
    correctionCodes,
  })
  return serializable(prisma, async (tx) => {
    const before = await findCollection(tx, input.collectionCode)
    if (!canVerifyCollectionAsKordes(context, before.rantingId)) throw new GorutCollectionError("COLLECTION_ACCESS_DENIED", "Kordes may only decide collections in its own Ranting.")
    if (await idempotentRevision(tx, before, input.idempotencyKey, commandHash)) return { collection: publicCollection(before), idempotentReplay: true }
    requireExpectedVersion(before, input.expectedVersion)
    if (before.status !== GorutCollectionStatus.WAITING_KORDES_VERIFICATION) throw new GorutCollectionError("COLLECTION_STATE_INVALID", "Collection is not waiting for Kordes verification.")
    if (input.decision === "VERIFY") {
      if (!input.moneyMatches || !input.cashReceived || (input.hasDamagedMoney && !note)) {
        throw new GorutCollectionError("COLLECTION_STATE_INVALID", "Kordes verification facts are incomplete.")
      }
    } else if (!note || correctionCodes.length === 0) {
      throw new GorutCollectionError("COLLECTION_CORRECTION_REQUIRED", "Correction requires a reason and at least one Munfiq.")
    }

    const correctionEntries = input.decision === "CORRECTION"
      ? before.entries.filter((entry) => correctionCodes.includes(entry.munfiq.code))
      : []
    if (input.decision === "CORRECTION" && correctionEntries.length !== correctionCodes.length) {
      throw new GorutCollectionError("COLLECTION_HIERARCHY_MISMATCH", "A correction target is outside this collection.")
    }
    const nextRevision = before.revision + 1
    const targetStatus = input.decision === "VERIFY" ? GorutCollectionStatus.VERIFIED_BY_KORDES : GorutCollectionStatus.NEEDS_CORRECTION
    const nextSourceHash = sourceHashFor(before, targetStatus)
    await tx.gorutCollectionBatch.update({
      where: { id: before.id, version: before.version },
      data: {
        status: targetStatus,
        verifiedByKordesAt: input.decision === "VERIFY" ? now : null,
        returnedForCorrectionAt: input.decision === "CORRECTION" ? now : null,
        kordesDecisionByUserId: context.userId,
        kordesMoneyMatches: input.moneyMatches,
        kordesHasDamagedMoney: input.hasDamagedMoney,
        kordesCashReceived: input.cashReceived,
        kordesNote: note,
        lockedAt: now,
        sourceHash: nextSourceHash,
        version: { increment: 1 },
        revision: nextRevision,
        updatedAt: now,
      },
    })
    if (input.decision === "CORRECTION") {
      await tx.gorutCollectionCorrection.createMany({
        data: correctionEntries.map((entry) => ({
          batchId: before.id,
          entryId: entry.id,
          reason: note!,
          requestedByUserId: context.userId,
          requestedAt: now,
          requestRevision: nextRevision,
        })),
      })
    }
    const after = await findCollection(tx, input.collectionCode)
    await tx.gorutCollectionRevision.create({
      data: {
        batchId: before.id,
        revision: nextRevision,
        action: input.decision === "VERIFY" ? GorutCollectionRevisionAction.VERIFY_BY_KORDES : GorutCollectionRevisionAction.REQUEST_CORRECTION,
        idempotencyKey: input.idempotencyKey,
        commandHash,
        reason: note,
        actorUserId: context.userId,
        beforeSnapshot: revisionSnapshot(before),
        afterSnapshot: revisionSnapshot(after),
        createdAt: now,
      },
    })
    return { collection: publicCollection(after), idempotentReplay: false }
  })
}

export { collectionSelect, findCollection, publicCollection, revisionSnapshot, serializable, sourceHashFor }
