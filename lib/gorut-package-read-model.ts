import { GorutTransactionState, Prisma } from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
import {
  GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY,
  GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION,
} from "./gorut-provisional-plpk-fee-policy"

export const packageStates = [
  GorutTransactionState.DRAFT,
  GorutTransactionState.WAITING_UPZIS_VERIFICATION,
  GorutTransactionState.RETURNED_TO_RANTING,
  GorutTransactionState.WAITING_PC_APPROVAL,
  GorutTransactionState.RETURNED_TO_UPZIS,
  GorutTransactionState.FINAL_APPROVED,
  GorutTransactionState.REJECTED,
  GorutTransactionState.CANCELLED,
] as const

type DecimalValue = { toString(): string }
type PackageState = (typeof packageStates)[number]

export type PackageReadScope = Prisma.GorutUpzisPackageWhereInput | null

export function packageReadScopeWhere(context: GorutOperationalContext): PackageReadScope {
  if (context.operationalRole === "PC") return {}
  if (context.operationalRole === "UPZIS") return { kecamatanId: context.kecamatanId! }
  return null
}

export function parsePackageState(value: string | null): PackageState | undefined {
  return value && packageStates.includes(value as PackageState) ? value as PackageState : undefined
}

export function parsePackagePeriod(value: string | null): { key: string; start: Date; end: Date } | null {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null
  const [year, month] = value.split("-").map(Number)
  return {
    key: value,
    start: new Date(Date.UTC(year!, month! - 1, 1)),
    end: new Date(Date.UTC(year!, month!, 1)),
  }
}

export function packagePeriodKey(value: Date) {
  return value.toISOString().slice(0, 7)
}

export function packagePeriodLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(value)
}

export function decimalString(value: DecimalValue) {
  return new Prisma.Decimal(value.toString()).toFixed(2)
}

function sumDecimals(values: DecimalValue[]): Prisma.Decimal {
  let sum = new Prisma.Decimal(0)
  for (const value of values) sum = sum.plus(value.toString())
  return sum
}

type RantingSource = { id: string; kecamatanId: string; code: string; name: string }
type MembershipSource = {
  sourceType: string
  sourceKey: string
  sourceVersion: string | null
  sourceHash: string
  includedAt: Date
  transaction: {
    code: string
    kecamatanId: string
    rantingId: string
    transactionDate: Date
    totalAmount: DecimalValue
    currentState: string
    ranting: RantingSource
    plpk: { code: string; name: string }
    _count: { items: number }
    collectionSource?: null | {
      collectionCode: string
      status: string
      recordOrigin: string
      amountAuthorityStatus: string
      feeAuthorityStatus: string
      financialStatus: string
      financialBlockingReasons: string[]
      grossAmount: DecimalValue | null
      totalPlpkFee: DecimalValue | null
      netAmount: DecimalValue | null
      calculationPolicyVersion: string | null
      financialSourceHash: string | null
      revision: number
      sourceHash: string
      transactionSourceHash: string | null
      confirmedByPlpkAt: Date | null
      submittedToKordesAt: Date | null
      verifiedByKordesAt: Date | null
      returnedForCorrectionAt: Date | null
    }
  }
}

type CoverageSource = {
  status: "INCLUDED" | "EXCLUDED" | "UNRESOLVED"
  sourceRantingKey: string | null
  sourceRantingName: string | null
  exclusionReason: string | null
  exclusionReference?: string | null
  recordedAt?: Date | null
  activeAtCutoff?: boolean | null
  recordedBy?: { name: string } | null
  ranting: RantingSource | null
}

type WorkflowEventSource = {
  previousState: string | null
  resultingState: string
  action: string
  stage: string | null
  reason: string | null
  reasonCode?: string | null
  metadata?: unknown
  createdAt: Date
  actor: { memberId?: string; name: string }
  actorAssignment: { role: string } | null
}

type SettlementEvidenceSource = {
  evidenceCode: string
  mode: "PC_PICKUP" | "UPZIS_BANK_DEPOSIT"
  revision: number
  expectedAmountSnapshot: DecimalValue
  actualAmount: DecimalValue
  occurredAt: Date
  recordedAt: Date
  receivedAt: Date | null
  bankName: string | null
  externalReference: string | null
  evidenceReference: string | null
  note: string | null
  packageVersionBefore: number
  packageVersionAfter: number
  supersedes: { evidenceCode: string } | null
  supersededBy: { evidenceCode: string } | null
  recordedBy: { memberId: string; name: string }
  recordedByAssignment: { role: string }
  handedOverBy: { memberId: string; name: string } | null
  receivedBy: { memberId: string; name: string } | null
  depositedBy: { memberId: string; name: string } | null
  validation?: SettlementValidationSource | null
}

type SettlementValidationSource = {
  validationCode: string
  settlementRevisionSnapshot: number
  expectedAmountSnapshot: DecimalValue
  actualAmountSnapshot: DecimalValue
  differenceAmount: DecimalValue
  result: "MATCHED" | "MISMATCH"
  validatedAt: Date
  note: string | null
  packageVersionBefore: number
  packageVersionAfter: number
  validator: { memberId: string; name: string }
  validatorAssignment: { role: string }
}

export type PackageSummarySource = {
  packageCode: string
  kecamatanId: string
  periodStart: Date
  currentState: string | null
  version: number
  revision: number
  recordOrigin: string
  isHistorical: boolean
  workflowHistoryComplete: boolean
  financialStatus: "UNVERIFIED" | "BLOCKED" | "READY"
  financialBlockingReasons: string[]
  grossAmount: DecimalValue | null
  totalPlpkFee: DecimalValue | null
  netAmount: DecimalValue | null
  calculatedAt: Date | null
  lockedAt: Date | null
  rosterFrozenAt?: Date | null
  rosterSourceHash?: string | null
  rosterFrozenBy?: { name: string } | null
  kecamatan: { code: string; name: string }
  transactionMemberships: MembershipSource[]
  rantingCoverages: CoverageSource[]
  settlementEvidence?: SettlementEvidenceSource[]
}

export type PackageDetailSource = PackageSummarySource & {
  legacyId: string | null
  sourceRowKey: string | null
  migrationBatchKey: string | null
  calculationPolicyVersion: string | null
  financialSourceRevision: number | null
  financialSourceHash: string | null
  workflowEvents: WorkflowEventSource[]
  corrections?: Array<{
    correctionCode: string
    targetType: string
    reasonCode: string
    reasonText: string | null
    status: string
    requestedAt: Date
    resolvedAt: Date | null
    resolutionNote: string | null
    ranting: { code: string; name: string } | null
    transaction: { code: string } | null
    collection: { collectionCode: string } | null
    requestedBy: { name: string }
    resolvedBy: { name: string } | null
  }>
}

function financial(source: PackageSummarySource) {
  const gross = source.grossAmount ? new Prisma.Decimal(source.grossAmount.toString()) : null
  const fee = source.totalPlpkFee ? new Prisma.Decimal(source.totalPlpkFee.toString()) : null
  const net = source.netAmount ? new Prisma.Decimal(source.netAmount.toString()) : null
  const recorded = source.transactionMemberships.length
    ? sumDecimals(source.transactionMemberships.map((membership) => membership.transaction.totalAmount)).toFixed(2)
    : null
  const feePolicyVersions = new Set(source.transactionMemberships
    .map((membership) => membership.transaction.collectionSource?.calculationPolicyVersion ?? null)
    .filter((version): version is string => Boolean(version)))
  const feePolicyVersion = feePolicyVersions.size === 1 ? [...feePolicyVersions][0]! : null

  return {
    status: source.financialStatus,
    blockingReasons: source.financialBlockingReasons,
    recordedAmount: recorded,
    recordedAmountSemantic: "Jumlah Tercatat" as const,
    grossAmount: gross?.toFixed(2) ?? null,
    totalPlpkFee: fee?.toFixed(2) ?? null,
    netAmount: net?.toFixed(2) ?? null,
    calculatedAt: source.calculatedAt?.toISOString() ?? null,
    lockedAt: source.lockedAt?.toISOString() ?? null,
    feePolicyVersion,
    feePolicyAuthority: feePolicyVersion === GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION
      ? GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY
      : null,
    consistency: {
      formulaMatches: gross && fee && net ? gross.minus(fee).equals(net) : null,
      transactionsWithinRegion: source.transactionMemberships.every((membership) => membership.transaction.kecamatanId === source.kecamatanId),
    },
  }
}

function transactionSummary(source: PackageSummarySource) {
  const plpk = new Map<string, {
    plpkCode: string
    plpkName: string
    rantingCode: string
    rantingName: string
    transactionCount: number
    munfiqCount: number
    recorded: Prisma.Decimal
  }>()

  for (const membership of source.transactionMemberships) {
    const transaction = membership.transaction
    const row = plpk.get(transaction.plpk.code)
    if (row) {
      row.transactionCount += 1
      row.munfiqCount += transaction._count.items
      row.recorded = row.recorded.plus(transaction.totalAmount.toString())
    } else {
      plpk.set(transaction.plpk.code, {
        plpkCode: transaction.plpk.code,
        plpkName: transaction.plpk.name,
        rantingCode: transaction.ranting.code,
        rantingName: transaction.ranting.name,
        transactionCount: 1,
        munfiqCount: transaction._count.items,
        recorded: new Prisma.Decimal(transaction.totalAmount.toString()),
      })
    }
  }

  return {
    count: source.transactionMemberships.length,
    munfiqCount: source.transactionMemberships.reduce((total, membership) => total + membership.transaction._count.items, 0),
    plpkCount: plpk.size,
    plpkSummaries: [...plpk.values()].map(({ recorded, ...row }) => ({ ...row, recordedAmount: recorded.toFixed(2) })),
    items: source.transactionMemberships.map((membership) => ({
      transactionCode: membership.transaction.code,
      transactionDate: membership.transaction.transactionDate.toISOString(),
      currentState: membership.transaction.currentState,
      recordedAmount: decimalString(membership.transaction.totalAmount),
      recordedAmountSemantic: "Jumlah Tercatat" as const,
      ranting: { code: membership.transaction.ranting.code, name: membership.transaction.ranting.name },
      plpk: { code: membership.transaction.plpk.code, name: membership.transaction.plpk.name },
      munfiqCount: membership.transaction._count.items,
      collectionSource: membership.transaction.collectionSource ? {
        collectionCode: membership.transaction.collectionSource.collectionCode,
        origin: membership.transaction.collectionSource.recordOrigin,
        lifecycleStatus: membership.transaction.collectionSource.status,
        amountAuthorityStatus: membership.transaction.collectionSource.amountAuthorityStatus,
        feeAuthorityStatus: membership.transaction.collectionSource.feeAuthorityStatus,
        financialStatus: membership.transaction.collectionSource.financialStatus,
        financialBlockingReasons: membership.transaction.collectionSource.financialBlockingReasons,
        grossAmount: membership.transaction.collectionSource.grossAmount
          ? decimalString(membership.transaction.collectionSource.grossAmount)
          : null,
        totalPlpkFee: membership.transaction.collectionSource.totalPlpkFee
          ? decimalString(membership.transaction.collectionSource.totalPlpkFee)
          : null,
        netAmount: membership.transaction.collectionSource.netAmount
          ? decimalString(membership.transaction.collectionSource.netAmount)
          : null,
        revision: membership.transaction.collectionSource.revision,
        sourceHash: membership.transaction.collectionSource.sourceHash,
        transactionSourceHash: membership.transaction.collectionSource.transactionSourceHash,
        calculationPolicyVersion: membership.transaction.collectionSource.calculationPolicyVersion,
        financialSourceHash: membership.transaction.collectionSource.financialSourceHash,
        reconciliationStatus: membership.transaction.collectionSource.transactionSourceHash === membership.transaction.collectionSource.sourceHash
          ? "READY" as const
          : "STALE" as const,
        verification: {
          confirmedByPlpkAt: membership.transaction.collectionSource.confirmedByPlpkAt?.toISOString() ?? null,
          submittedToKordesAt: membership.transaction.collectionSource.submittedToKordesAt?.toISOString() ?? null,
          verifiedByKordesAt: membership.transaction.collectionSource.verifiedByKordesAt?.toISOString() ?? null,
          returnedForCorrectionAt: membership.transaction.collectionSource.returnedForCorrectionAt?.toISOString() ?? null,
        },
      } : null,
      provenance: {
        sourceType: membership.sourceType,
        sourceKey: membership.sourceKey,
        sourceVersion: membership.sourceVersion,
        sourceHash: membership.sourceHash,
        includedAt: membership.includedAt.toISOString(),
      },
    })),
  }
}

function collectionSourceSummary(source: PackageSummarySource) {
  const sources = source.transactionMemberships
    .map((membership) => membership.transaction.collectionSource)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return {
    transactionCount: source.transactionMemberships.length,
    sourceCount: sources.length,
    authoritativeAmountCount: sources.filter((item) => item.amountAuthorityStatus === "AUTHORITATIVE").length,
    authoritativeFeeCount: sources.filter((item) => item.feeAuthorityStatus === "AUTHORITATIVE").length,
    financiallyReadyCount: sources.filter((item) => item.financialStatus === "READY").length,
    verifiedByKordesCount: sources.filter((item) => Boolean(item.verifiedByKordesAt)).length,
    completeForEveryTransaction: sources.length === source.transactionMemberships.length,
  }
}

function coverage(source: PackageSummarySource) {
  const includedRantingIds = new Set(source.rantingCoverages.filter((row) => row.status === "INCLUDED" && row.ranting).map((row) => row.ranting!.id))
  const labels = { INCLUDED: "included", EXCLUDED: "excluded-with-reason", UNRESOLVED: "unresolved" } as const
  const rows = source.rantingCoverages.map((row) => {
    const memberships = row.ranting
      ? source.transactionMemberships.filter((membership) => membership.transaction.rantingId === row.ranting!.id)
      : []
    return {
      status: labels[row.status],
      ranting: row.ranting ? { code: row.ranting.code, name: row.ranting.name } : null,
      sourceRantingKey: row.sourceRantingKey,
      sourceRantingName: row.sourceRantingName,
      exclusionReason: row.exclusionReason,
      exclusionReference: row.exclusionReference ?? null,
      recordedBy: row.recordedBy?.name ?? null,
      recordedAt: row.recordedAt?.toISOString() ?? null,
      activeAtCutoff: row.activeAtCutoff ?? null,
      transactionCount: memberships.length,
      plpkCount: new Set(memberships.map((membership) => membership.transaction.plpk.code)).size,
      munfiqCount: memberships.reduce((total, membership) => total + membership.transaction._count.items, 0),
      recordedAmount: memberships.length ? sumDecimals(memberships.map((membership) => membership.transaction.totalAmount)).toFixed(2) : null,
    }
  })

  return {
    included: rows.filter((row) => row.status === "included").length,
    excluded: rows.filter((row) => row.status === "excluded-with-reason").length,
    unresolved: rows.filter((row) => row.status === "unresolved").length,
    completenessEvaluated: Boolean(source.rosterFrozenAt),
    roster: {
      frozenAt: source.rosterFrozenAt?.toISOString() ?? null,
      frozenBy: source.rosterFrozenBy?.name ?? null,
      sourceHash: source.rosterSourceHash ?? null,
    },
    rantings: rows,
    consistency: {
      resolvedRantingsWithinRegion: source.rantingCoverages.every((row) => !row.ranting || row.ranting.kecamatanId === source.kecamatanId),
      everyTransactionHasIncludedRanting: source.transactionMemberships.every((membership) => includedRantingIds.has(membership.transaction.rantingId)),
    },
  }
}

function settlementValidationItem(row: SettlementValidationSource, evidenceCode: string, isCurrent: boolean) {
  return {
    status: isCurrent ? "CURRENT" as const : "STALE" as const,
    validationCode: row.validationCode,
    settlementEvidenceCode: evidenceCode,
    settlementRevision: row.settlementRevisionSnapshot,
    result: row.result,
    expectedAmount: decimalString(row.expectedAmountSnapshot),
    actualAmount: decimalString(row.actualAmountSnapshot),
    difference: decimalString(row.differenceAmount),
    currency: "IDR" as const,
    validator: { memberId: row.validator.memberId, name: row.validator.name, role: row.validatorAssignment.role },
    validatedAt: row.validatedAt.toISOString(),
    note: row.note,
    packageVersion: { before: row.packageVersionBefore, after: row.packageVersionAfter },
    assertion: "NOMINAL_AND_REFERENCED_EVIDENCE_REVIEWED" as const,
    doesNotAssert: ["BANK_SETTLED", "FUNDS_CLEARED", "CRYPTOGRAPHIC_PROOF_VALIDITY"] as const,
  }
}

function settlementEvidenceItem(row: SettlementEvidenceSource, currentEvidenceCode: string | null) {
  const expected = new Prisma.Decimal(row.expectedAmountSnapshot.toString())
  const actual = new Prisma.Decimal(row.actualAmount.toString())
  const difference = actual.minus(expected)
  return {
    evidenceCode: row.evidenceCode,
    mode: row.mode,
    revision: row.revision,
    supersedesEvidenceCode: row.supersedes?.evidenceCode ?? null,
    supersededByEvidenceCode: row.supersededBy?.evidenceCode ?? null,
    expectedAmount: expected.toFixed(2),
    actualAmount: actual.toFixed(2),
    difference: difference.toFixed(2),
    currency: "IDR" as const,
    comparison: difference.equals(0)
      ? { status: "NOMINAL_SESUAI" as const, label: "Nominal sesuai" }
      : { status: "ADA_SELISIH" as const, label: "Ada selisih — menunggu validasi/klarifikasi" },
    occurredAt: row.occurredAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
    actors: {
      recordedBy: { memberId: row.recordedBy.memberId, name: row.recordedBy.name, role: row.recordedByAssignment.role },
      handedOverBy: row.handedOverBy ? { memberId: row.handedOverBy.memberId, name: row.handedOverBy.name } : null,
      receivedBy: row.receivedBy ? { memberId: row.receivedBy.memberId, name: row.receivedBy.name } : null,
      receivedAt: row.receivedAt?.toISOString() ?? null,
      depositedBy: row.depositedBy ? { memberId: row.depositedBy.memberId, name: row.depositedBy.name } : null,
    },
    bank: row.mode === "UPZIS_BANK_DEPOSIT" ? row.bankName : null,
    externalReference: row.externalReference,
    evidenceReference: row.evidenceReference,
    note: row.note,
    packageVersion: { before: row.packageVersionBefore, after: row.packageVersionAfter },
    validation: row.validation
      ? settlementValidationItem(row.validation, row.evidenceCode, row.evidenceCode === currentEvidenceCode)
      : null,
  }
}

function settlement(source: PackageSummarySource) {
  const sourceRows = [...(source.settlementEvidence ?? [])].sort((left, right) => left.revision - right.revision)
  const currentEvidenceCode = sourceRows.filter((row) => !row.supersededBy).at(-1)?.evidenceCode ?? null
  const items = sourceRows.map((row) => settlementEvidenceItem(row, currentEvidenceCode))
  const active = items.filter((item) => !item.supersededByEvidenceCode)
  const latest = items.find((item) => item.evidenceCode === currentEvidenceCode) ?? null
  const validationHistory = items.flatMap((item) => item.validation ? [item.validation] : [])
  const currentValidation = latest?.validation ?? null
  const validationStatus = currentValidation
    ? "CURRENT" as const
    : validationHistory.length
      ? "STALE" as const
      : "NOT_VALIDATED" as const
  return {
    status: items.length ? "EVIDENCE_RECORDED" as const : "NOT_RECORDED" as const,
    completionStatus: "NOT_DETERMINED_UNTIL_VALIDATION" as const,
    latest,
    activeEvidenceCodes: active.map((item) => item.evidenceCode),
    history: items,
    availableActions: [] as string[],
    blockingReasons: ["SETTLEMENT_CAPABILITY_NOT_EVALUATED"] as string[],
    acknowledgements: {
      upzisChair: { status: "NOT_AVAILABLE" as const, note: null },
      tanfidziyah: { status: "NOT_AVAILABLE" as const, note: null },
    },
    validation: {
      status: validationStatus,
      validationCode: currentValidation?.validationCode ?? null,
      settlementEvidenceCode: currentValidation?.settlementEvidenceCode ?? null,
      result: currentValidation?.result ?? null,
      expectedAmount: currentValidation?.expectedAmount ?? null,
      actualAmount: currentValidation?.actualAmount ?? null,
      difference: currentValidation?.difference ?? null,
      validator: currentValidation?.validator ?? null,
      validatedAt: currentValidation?.validatedAt ?? null,
      note: currentValidation?.note ?? null,
      historical: validationHistory,
      availableActions: [] as string[],
      blockingReasons: ["VALIDATION_CAPABILITY_NOT_EVALUATED"] as string[],
    },
    finalApprovalReadiness: {
      status: "BLOCKED" as const,
      blockingReasons: ["FINAL_APPROVAL_READINESS_NOT_EVALUATED"],
    },
  }
}

function finalApproval(source: PackageDetailSource) {
  const event = source.workflowEvents.find((row) =>
    row.action === "APPROVE" &&
    row.previousState === "WAITING_PC_APPROVAL" &&
    row.resultingState === "FINAL_APPROVED",
  )
  const metadata = event?.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
    ? event.metadata as Record<string, unknown>
    : {}
  return {
    readiness: {
      status: event ? "READY" as const : "BLOCKED" as const,
      blockingReasons: event ? [] as string[] : ["FINAL_APPROVAL_READINESS_NOT_EVALUATED"],
    },
    approved: Boolean(event),
    approvedAt: event?.createdAt.toISOString() ?? null,
    approvedBy: event ? {
      memberId: event.actor.memberId ?? null,
      name: event.actor.name,
      role: event.actorAssignment?.role ?? null,
    } : null,
    sourceValidationCode: typeof metadata.validationCode === "string" ? metadata.validationCode : null,
    settlementEvidenceCode: typeof metadata.settlementEvidenceCode === "string" ? metadata.settlementEvidenceCode : null,
    packageVersion: typeof metadata.packageVersionBefore === "number" && typeof metadata.packageVersionAfter === "number"
      ? { before: metadata.packageVersionBefore, after: metadata.packageVersionAfter }
      : null,
    packageRevision: typeof metadata.packageRevision === "number" ? metadata.packageRevision : null,
    assertions: {
      bankSettled: false,
      fundsCleared: false,
      bankDepositCompleted: false,
      proofCryptographicallyVerified: false,
      f016Issued: false,
      finalClose: false,
      administrativeArchiveComplete: false,
    },
  }
}

function base(source: PackageSummarySource) {
  const settlementValue = settlement(source)
  return {
    identity: {
      packageCode: source.packageCode,
      origin: source.recordOrigin,
      isHistorical: source.isHistorical,
      workflowHistoryComplete: source.workflowHistoryComplete,
      version: source.version,
      revision: source.revision,
    },
    period: {
      key: packagePeriodKey(source.periodStart),
      start: source.periodStart.toISOString().slice(0, 10),
      label: packagePeriodLabel(source.periodStart),
    },
    region: {
      kecamatan: { code: source.kecamatan.code, name: source.kecamatan.name },
      upzis: { operationalLevel: "KECAMATAN" as const, kecamatanCode: source.kecamatan.code },
    },
    coverage: coverage(source),
    transactions: transactionSummary(source),
    collectionSource: collectionSourceSummary(source),
    financial: {
      ...financial(source),
      authority: {
        sourceType: "AUTHORITATIVE_COLLECTION" as const,
        completeForEveryTransaction: collectionSourceSummary(source).completeForEveryTransaction,
      },
    },
    settlement: settlementValue,
    workflow: {
      currentState: source.currentState,
      version: source.version,
      availableActions: [] as string[],
      blockingReasons: ["WORKFLOW_MUTATIONS_DISABLED_PHASE_1"],
    },
  }
}

export function serializePackageSummary(source: PackageSummarySource) {
  const value = base(source)
  return {
    identity: value.identity,
    period: value.period,
    region: value.region,
    coverage: {
      included: value.coverage.included,
      excluded: value.coverage.excluded,
      unresolved: value.coverage.unresolved,
      completenessEvaluated: value.coverage.completenessEvaluated,
    },
    transactions: {
      count: value.transactions.count,
      plpkCount: value.transactions.plpkCount,
      munfiqCount: value.transactions.munfiqCount,
    },
    collectionSource: value.collectionSource,
    financial: value.financial,
    settlement: {
      status: value.settlement.status,
      completionStatus: value.settlement.completionStatus,
      latest: value.settlement.latest,
      activeEvidenceCodes: value.settlement.activeEvidenceCodes,
      availableActions: value.settlement.availableActions,
      blockingReasons: value.settlement.blockingReasons,
      validation: value.settlement.validation,
      finalApprovalReadiness: value.settlement.finalApprovalReadiness,
    },
    workflow: value.workflow,
  }
}

export function serializePackageDetail(source: PackageDetailSource) {
  const value = base(source)
  const financialValue = financial(source)
  const finalApprovalValue = finalApproval(source)
  return {
    ...value,
    identity: value.identity,
    financial: {
      ...financialValue,
      authority: value.financial.authority,
      calculationPolicyVersion: source.calculationPolicyVersion,
      sourceRevision: source.financialSourceRevision,
      sourceHash: source.financialSourceHash,
      consistency: {
        ...financialValue.consistency,
        sourceRevisionMatches: source.financialSourceRevision === null || source.financialSourceRevision === source.revision,
      },
    },
    workflow: {
      currentState: source.currentState,
      version: source.version,
      history: source.workflowEvents.map((event, index) => ({
        sequence: index + 1,
        fromState: event.previousState,
        toState: event.resultingState,
        action: event.action,
        stage: event.stage,
        actor: { name: event.actor.name, role: event.actorAssignment?.role ?? null },
        occurredAt: event.createdAt.toISOString(),
        reason: event.reason,
        reasonCode: event.reasonCode ?? null,
        metadata: event.metadata ?? null,
      })),
      availableActions: [] as string[],
      blockingReasons: ["WORKFLOW_MUTATIONS_DISABLED_PHASE_1"],
      finalApproved: finalApprovalValue,
    },
    documents: [
      { code: "F.011", readiness: "UNAVAILABLE", executable: false, reason: "REQUIRES_OFFICIAL_GARUT_FORM_CONFIRMATION" },
      { code: "F.016", readiness: "SCAFFOLD", executable: false, reason: "REQUIRES_BUSINESS_AND_DOCUMENT_CONFIRMATION" },
    ],
    settlement: value.settlement,
    finalApproval: finalApprovalValue,
    corrections: (source.corrections ?? []).map((correction) => ({
      correctionCode: correction.correctionCode,
      targetType: correction.targetType,
      target: correction.ranting
        ? { code: correction.ranting.code, name: correction.ranting.name }
        : correction.transaction
          ? { code: correction.transaction.code }
          : correction.collection
            ? { code: correction.collection.collectionCode }
            : { code: source.packageCode },
      reasonCode: correction.reasonCode,
      reason: correction.reasonText,
      status: correction.status,
      requestedAt: correction.requestedAt.toISOString(),
      requestedBy: correction.requestedBy.name,
      resolvedAt: correction.resolvedAt?.toISOString() ?? null,
      resolvedBy: correction.resolvedBy?.name ?? null,
      resolutionNote: correction.resolutionNote,
    })),
  }
}
