import {
  GorutCollectionFinancialStatus,
  GorutCollectionStatus,
  GorutCollectionVisitStatus,
  Prisma,
  type PrismaClient,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
import {
  calculateGorutCollectionAvailableActions,
  calculateGorutCollectionEntryActions,
  collectionReadScopeWhere,
} from "./gorut-collection-api-pure"
import { collectionSourceHash } from "./gorut-collection-pure"
import {
  GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY,
  GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION,
  resolveGorutProvisionalFeeRuntime,
  type GorutProvisionalFeeRuntime,
} from "./gorut-provisional-plpk-fee-policy"

const collectionReadSelect = {
  id: true,
  collectionCode: true,
  periodStart: true,
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
  submittedToKordesAt: true,
  verifiedByKordesAt: true,
  returnedForCorrectionAt: true,
  kordesMoneyMatches: true,
  kordesHasDamagedMoney: true,
  kordesCashReceived: true,
  kordesNote: true,
  lockedAt: true,
  transactionId: true,
  transactionSourceRevision: true,
  transactionSourceHash: true,
  transactionBridgedAt: true,
  createdAt: true,
  updatedAt: true,
  kecamatanId: true,
  rantingId: true,
  plpkId: true,
  createdByUserId: true,
  kecamatan: { select: { code: true, name: true } },
  ranting: { select: { code: true, name: true, kecamatanId: true } },
  plpk: { select: { code: true, name: true, rantingId: true } },
  createdBy: { select: { memberId: true, name: true } },
  confirmedByPlpk: { select: { memberId: true, name: true } },
  submittedToKordesBy: { select: { memberId: true, name: true } },
  kordesDecisionBy: { select: { memberId: true, name: true } },
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
      munfiq: { select: { code: true, name: true, rantingId: true, plpkId: true } },
    },
    orderBy: [{ munfiq: { code: "asc" as const } }, { id: "asc" as const }],
  },
  corrections: {
    select: {
      id: true,
      entryId: true,
      reason: true,
      requestedAt: true,
      requestRevision: true,
      resolvedAt: true,
      resolutionRevision: true,
      entry: { select: { munfiq: { select: { code: true, name: true } } } },
      requestedBy: { select: { memberId: true, name: true } },
      resolvedBy: { select: { memberId: true, name: true } },
    },
    orderBy: [{ requestedAt: "asc" as const }, { id: "asc" as const }],
  },
  transaction: {
    select: {
      code: true,
      currentState: true,
      packageMembership: {
        select: {
          package: {
            select: {
              packageCode: true,
              currentState: true,
              financialStatus: true,
              financialBlockingReasons: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.GorutCollectionBatchSelect

const collectionDetailSelect = {
  ...collectionReadSelect,
  revisions: {
    select: {
      revision: true,
      action: true,
      reason: true,
      createdAt: true,
      actor: { select: { memberId: true, name: true } },
    },
    orderBy: [{ revision: "asc" as const }],
  },
} satisfies Prisma.GorutCollectionBatchSelect

type CollectionReadSource = Prisma.GorutCollectionBatchGetPayload<{ select: typeof collectionReadSelect }>
type CollectionDetailSource = Prisma.GorutCollectionBatchGetPayload<{ select: typeof collectionDetailSelect }>

export type GorutCollectionListInput = {
  page: number
  pageSize: number
  search?: string
  period?: string
  status?: GorutCollectionStatus
}

function actor(value: { memberId: string; name: string } | null) {
  return value ? { memberCode: value.memberId, name: value.name } : null
}

function periodFacts(periodStart: Date) {
  const key = periodStart.toISOString().slice(0, 7)
  return {
    key,
    start: `${key}-01`,
    label: new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(periodStart),
  }
}

function actionFacts(row: CollectionReadSource) {
  const openCorrections = row.corrections.filter((correction) => !correction.resolvedAt)
  return {
    status: row.status,
    plpkId: row.plpkId,
    rantingId: row.rantingId,
    entryCount: row.entries.length,
    hasPendingEntry: row.entries.some((entry) => entry.visitStatus === GorutCollectionVisitStatus.PENDING),
    hasInvalidCollectedAmount: row.entries.some((entry) => entry.visitStatus === GorutCollectionVisitStatus.COLLECTED && !entry.amount.greaterThan(0)),
    openCorrectionCount: openCorrections.length,
    openCorrectionMunfiqCodes: openCorrections.map((correction) => correction.entry.munfiq.code),
  }
}

function mapCollection(
  row: CollectionReadSource,
  context: GorutOperationalContext,
  runtime: GorutProvisionalFeeRuntime,
) {
  const facts = actionFacts(row)
  const actions = calculateGorutCollectionAvailableActions(context, runtime, facts)
  const sourceHashClean = collectionSourceHash({
    collectionCode: row.collectionCode,
    periodStart: row.periodStart,
    kecamatanCode: row.kecamatan.code,
    rantingCode: row.ranting.code,
    plpkCode: row.plpk.code,
    status: row.status,
    entries: row.entries.map((entry) => ({
      munfiqCode: entry.munfiq.code,
      visitStatus: entry.visitStatus,
      amount: entry.amount,
      collectedAt: entry.collectedAt,
      note: entry.note,
      feeEligibleSnapshot: entry.feeEligibleSnapshot,
      plpkFeeSnapshot: entry.plpkFeeSnapshot,
      feePolicyVersion: entry.feePolicyVersion,
    })),
  }) === row.sourceHash
  const openCorrections = row.corrections.filter((correction) => !correction.resolvedAt)
  const bridgeBlockingReasons = [
    ...(row.status === GorutCollectionStatus.VERIFIED_BY_KORDES ? [] : ["COLLECTION_NOT_VERIFIED_BY_KORDES"]),
    ...(row.confirmedByPlpkAt ? [] : ["PLPK_CONFIRMATION_MISSING"]),
    ...(row.submittedToKordesAt ? [] : ["KORDES_SUBMISSION_MISSING"]),
    ...(row.verifiedByKordesAt && row.kordesDecisionBy ? [] : ["KORDES_VERIFICATION_FACT_MISSING"]),
    ...(openCorrections.length === 0 ? [] : ["OPEN_COLLECTION_CORRECTION"]),
    ...(row.financialStatus === GorutCollectionFinancialStatus.READY ? [] : ["COLLECTION_FINANCIAL_NOT_READY"]),
    ...(sourceHashClean ? [] : ["COLLECTION_SOURCE_DRIFT"]),
  ]
  const transactionReconciliationStatus = !row.transaction
    ? bridgeBlockingReasons.length === 0 ? "PENDING" : "BLOCKED"
    : row.transactionSourceHash === row.sourceHash ? "READY" : "STALE"
  const downstreamPackage = row.transaction?.packageMembership?.package
  const packageBlockingReasons = downstreamPackage
    ? [
      ...(transactionReconciliationStatus === "READY" ? [] : ["COLLECTION_TRANSACTION_SOURCE_STALE"]),
      ...(downstreamPackage.financialStatus === "READY" ? [] : downstreamPackage.financialBlockingReasons),
    ]
    : []

  return {
    identity: {
      collectionCode: row.collectionCode,
      origin: row.recordOrigin,
      status: row.status,
      version: row.version,
      revision: row.revision,
      sourceHash: row.sourceHash,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: actor(row.createdBy),
    },
    period: periodFacts(row.periodStart),
    region: {
      kecamatan: { code: row.kecamatan.code, name: row.kecamatan.name },
      ranting: { code: row.ranting.code, name: row.ranting.name },
    },
    plpk: { code: row.plpk.code, name: row.plpk.name },
    entries: row.entries.map((entry) => ({
      munfiq: { code: entry.munfiq.code, name: entry.munfiq.name },
      visitStatus: entry.visitStatus,
      amount: entry.amount.toFixed(2),
      collectedAt: entry.collectedAt?.toISOString() ?? null,
      note: entry.note,
      fee: {
        eligible: entry.feeEligibleSnapshot,
        amount: entry.plpkFeeSnapshot?.toFixed(2) ?? null,
        policyVersion: entry.feePolicyVersion,
      },
      provenance: {
        sourceType: entry.sourceType,
        sourceKey: entry.sourceKey,
        sourceHash: entry.sourceHash,
      },
      availableActions: calculateGorutCollectionEntryActions(context, runtime, facts, entry.munfiq.code),
    })),
    financial: {
      amountAuthorityStatus: row.amountAuthorityStatus,
      feeAuthorityStatus: row.feeAuthorityStatus,
      status: row.financialStatus,
      blockingReasons: row.financialBlockingReasons,
      grossAmount: row.grossAmount?.toFixed(2) ?? null,
      totalPlpkFee: row.totalPlpkFee?.toFixed(2) ?? null,
      netAmount: row.netAmount?.toFixed(2) ?? null,
      calculatedAt: row.calculatedAt?.toISOString() ?? null,
      calculationPolicyVersion: row.calculationPolicyVersion,
      policyAuthority: row.calculationPolicyVersion === GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION
        ? GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY
        : null,
      sourceHash: row.financialSourceHash,
    },
    confirmation: {
      confirmedByPlpkAt: row.confirmedByPlpkAt?.toISOString() ?? null,
      confirmedBy: actor(row.confirmedByPlpk),
      submittedToKordesAt: row.submittedToKordesAt?.toISOString() ?? null,
      submittedBy: actor(row.submittedToKordesBy),
    },
    kordesVerification: {
      verifiedByKordesAt: row.verifiedByKordesAt?.toISOString() ?? null,
      returnedForCorrectionAt: row.returnedForCorrectionAt?.toISOString() ?? null,
      decisionBy: actor(row.kordesDecisionBy),
      moneyMatches: row.kordesMoneyMatches,
      hasDamagedMoney: row.kordesHasDamagedMoney,
      cashReceived: row.kordesCashReceived,
      note: row.kordesNote,
    },
    corrections: row.corrections.map((correction) => ({
      target: { type: "MUNFIQ" as const, code: correction.entry.munfiq.code, name: correction.entry.munfiq.name },
      reason: correction.reason,
      requestedAt: correction.requestedAt.toISOString(),
      requestRevision: correction.requestRevision,
      requestedBy: actor(correction.requestedBy),
      resolvedAt: correction.resolvedAt?.toISOString() ?? null,
      resolutionRevision: correction.resolutionRevision,
      resolvedBy: actor(correction.resolvedBy),
    })),
    bridgeReadiness: {
      ready: bridgeBlockingReasons.length === 0,
      blockingReasons: bridgeBlockingReasons,
      sourceHashClean,
      transaction: row.transaction ? {
        transactionCode: row.transaction.code,
        state: row.transaction.currentState,
        status: transactionReconciliationStatus,
        sourceRevision: row.transactionSourceRevision,
        sourceHash: row.transactionSourceHash,
        bridgedAt: row.transactionBridgedAt?.toISOString() ?? null,
      } : null,
      package: downstreamPackage ? {
        packageCode: downstreamPackage.packageCode,
        state: downstreamPackage.currentState,
        financialStatus: downstreamPackage.financialStatus,
        reconciliationStatus: packageBlockingReasons.length === 0 ? "READY" : "BLOCKED",
        blockingReasons: packageBlockingReasons,
      } : null,
    },
    version: row.version,
    availableActions: actions.availableActions,
    blockingReasons: actions.blockingReasons,
  }
}

export function parseCollectionPeriod(value: string): Date | null {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) return null
  return new Date(`${value}-01T00:00:00.000Z`)
}

export function parseCollectionStatus(value: string): GorutCollectionStatus | null {
  return Object.values(GorutCollectionStatus).includes(value as GorutCollectionStatus)
    ? value as GorutCollectionStatus
    : null
}

export async function listGorutCollections(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: GorutCollectionListInput,
  options: { runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  const periodStart = input.period ? parseCollectionPeriod(input.period) : null
  const where: Prisma.GorutCollectionBatchWhereInput = {
    ...collectionReadScopeWhere(context),
    ...(periodStart ? { periodStart } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.search ? {
      OR: [
        { collectionCode: { contains: input.search, mode: "insensitive" as const } },
        { plpk: { is: { code: { contains: input.search, mode: "insensitive" as const } } } },
        { plpk: { is: { name: { contains: input.search, mode: "insensitive" as const } } } },
        { ranting: { is: { name: { contains: input.search, mode: "insensitive" as const } } } },
      ],
    } : {}),
  }
  const skip = (input.page - 1) * input.pageSize
  const [total, rows] = await prisma.$transaction([
    prisma.gorutCollectionBatch.count({ where }),
    prisma.gorutCollectionBatch.findMany({
      where,
      select: collectionReadSelect,
      orderBy: [{ periodStart: "desc" }, { collectionCode: "asc" }],
      skip,
      take: input.pageSize,
    }),
  ])
  return {
    data: rows.map((row) => mapCollection(row, context, runtime)),
    pagination: { page: input.page, pageSize: input.pageSize, total, totalPages: Math.ceil(total / input.pageSize) },
  }
}

export async function getGorutCollectionDetail(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  collectionCode: string,
  options: { runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  const row = await prisma.gorutCollectionBatch.findFirst({
    where: { collectionCode, ...collectionReadScopeWhere(context) },
    select: collectionDetailSelect,
  })
  if (!row) return null
  return {
    ...mapCollection(row, context, runtime),
    history: (row as CollectionDetailSource).revisions.map((revision) => ({
      revision: revision.revision,
      action: revision.action,
      reason: revision.reason,
      actor: actor(revision.actor),
      timestamp: revision.createdAt.toISOString(),
    })),
  }
}
