import type { GorutTransactionState, Prisma, PrismaClient } from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
import {
  packageReadScopeWhere,
  serializePackageDetail,
  serializePackageSummary,
} from "./gorut-package-read-model"
import { getGorutPackageWorkflowAvailability } from "./gorut-package-workflow-server"
import { getGorutPackageSettlementAvailability } from "./gorut-package-settlement-server"
import { getGorutPackageValidationAvailability } from "./gorut-package-validation-server"

const transactionMembershipSelect = {
  sourceType: true,
  sourceKey: true,
  sourceVersion: true,
  sourceHash: true,
  includedAt: true,
  transaction: {
    select: {
      code: true,
      kecamatanId: true,
      rantingId: true,
      transactionDate: true,
      totalAmount: true,
      currentState: true,
      ranting: { select: { id: true, kecamatanId: true, code: true, name: true } },
      plpk: { select: { code: true, name: true } },
      _count: { select: { items: true } },
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
    },
  },
} satisfies Prisma.GorutUpzisPackageTransactionSelect

const rantingCoverageSelect = {
  status: true,
  sourceRantingKey: true,
  sourceRantingName: true,
  exclusionReason: true,
  exclusionReference: true,
  recordedAt: true,
  activeAtCutoff: true,
  recordedBy: { select: { name: true } },
  ranting: { select: { id: true, kecamatanId: true, code: true, name: true } },
} satisfies Prisma.GorutUpzisPackageRantingCoverageSelect

const settlementEvidenceSelect = {
  evidenceCode: true,
  mode: true,
  revision: true,
  expectedAmountSnapshot: true,
  actualAmount: true,
  occurredAt: true,
  recordedAt: true,
  receivedAt: true,
  bankName: true,
  externalReference: true,
  evidenceReference: true,
  note: true,
  packageVersionBefore: true,
  packageVersionAfter: true,
  supersedes: { select: { evidenceCode: true } },
  supersededBy: { select: { evidenceCode: true } },
  recordedBy: { select: { memberId: true, name: true } },
  recordedByAssignment: { select: { role: true } },
  handedOverBy: { select: { memberId: true, name: true } },
  receivedBy: { select: { memberId: true, name: true } },
  depositedBy: { select: { memberId: true, name: true } },
  validation: {
    select: {
      validationCode: true,
      settlementRevisionSnapshot: true,
      expectedAmountSnapshot: true,
      actualAmountSnapshot: true,
      differenceAmount: true,
      result: true,
      validatedAt: true,
      note: true,
      packageVersionBefore: true,
      packageVersionAfter: true,
      validator: { select: { memberId: true, name: true } },
      validatorAssignment: { select: { role: true } },
    },
  },
} satisfies Prisma.GorutPackageSettlementEvidenceSelect

const packageSummarySelect = {
  packageCode: true,
  kecamatanId: true,
  periodStart: true,
  currentState: true,
  version: true,
  revision: true,
  recordOrigin: true,
  isHistorical: true,
  workflowHistoryComplete: true,
  financialStatus: true,
  financialBlockingReasons: true,
  grossAmount: true,
  totalPlpkFee: true,
  netAmount: true,
  calculatedAt: true,
  lockedAt: true,
  rosterFrozenAt: true,
  rosterSourceHash: true,
  rosterFrozenBy: { select: { name: true } },
  kecamatan: { select: { code: true, name: true } },
  transactionMemberships: { select: transactionMembershipSelect, orderBy: [{ includedAt: "asc" as const }, { id: "asc" as const }] },
  rantingCoverages: { select: rantingCoverageSelect, orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }] },
  settlementEvidence: { select: settlementEvidenceSelect, orderBy: [{ revision: "asc" as const }, { evidenceCode: "asc" as const }] },
} satisfies Prisma.GorutUpzisPackageSelect

const packageDetailSelect = {
  ...packageSummarySelect,
  legacyId: true,
  sourceRowKey: true,
  migrationBatchKey: true,
  calculationPolicyVersion: true,
  financialSourceRevision: true,
  financialSourceHash: true,
  workflowEvents: {
    select: {
      previousState: true,
      resultingState: true,
      action: true,
      stage: true,
      reason: true,
      reasonCode: true,
      metadata: true,
      createdAt: true,
      actor: { select: { memberId: true, name: true } },
      actorAssignment: { select: { role: true } },
    },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
  corrections: {
    select: {
      correctionCode: true,
      targetType: true,
      reasonCode: true,
      reasonText: true,
      status: true,
      requestedAt: true,
      resolvedAt: true,
      resolutionNote: true,
      ranting: { select: { code: true, name: true } },
      transaction: { select: { code: true } },
      collection: { select: { collectionCode: true } },
      requestedBy: { select: { name: true } },
      resolvedBy: { select: { name: true } },
    },
    orderBy: [{ requestedAt: "asc" as const }, { id: "asc" as const }],
  },
} satisfies Prisma.GorutUpzisPackageSelect

export type GorutPackageListInput = {
  page: number
  pageSize: number
  search?: string
  period?: { start: Date; end: Date }
  state?: GorutTransactionState
  kecamatanCode?: string
}

function packageWhere(context: GorutOperationalContext, input: Omit<GorutPackageListInput, "page" | "pageSize"> = {}) {
  const scope = packageReadScopeWhere(context)
  if (!scope) return null
  return {
    ...scope,
    ...(input.period ? { periodStart: { gte: input.period.start, lt: input.period.end } } : {}),
    ...(input.state ? { currentState: input.state } : {}),
    ...(input.kecamatanCode ? { kecamatan: { code: input.kecamatanCode } } : {}),
    ...(input.search ? {
      OR: [
        { packageCode: { contains: input.search, mode: "insensitive" as const } },
        { kecamatan: { name: { contains: input.search, mode: "insensitive" as const } } },
      ],
    } : {}),
  } satisfies Prisma.GorutUpzisPackageWhereInput
}

export async function listGorutPackages(prisma: PrismaClient, context: GorutOperationalContext, input: GorutPackageListInput) {
  const where = packageWhere(context, input)
  if (!where) return null
  const [total, rows] = await Promise.all([
    prisma.gorutUpzisPackage.count({ where }),
    prisma.gorutUpzisPackage.findMany({
      where,
      select: packageSummarySelect,
      orderBy: [{ periodStart: "desc" }, { packageCode: "asc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ])
  const items = await Promise.all(rows.map(async (row) => {
    const summary = serializePackageSummary(row)
    const [availability, settlementAvailability, validationAvailability] = await Promise.all([
      getGorutPackageWorkflowAvailability(prisma, context, row.packageCode),
      getGorutPackageSettlementAvailability(prisma, context, row.packageCode),
      getGorutPackageValidationAvailability(prisma, context, row.packageCode),
    ])
    return {
      ...summary,
      settlement: {
        ...summary.settlement,
        availableActions: settlementAvailability?.availableActions ?? [],
        blockingReasons: settlementAvailability?.blockingReasons ?? ["SETTLEMENT_CAPABILITY_UNAVAILABLE"],
        validation: {
          ...summary.settlement.validation,
          availableActions: validationAvailability?.availableActions ?? [],
          blockingReasons: validationAvailability?.blockingReasons ?? ["VALIDATION_CAPABILITY_UNAVAILABLE"],
        },
        finalApprovalReadiness: validationAvailability?.finalApprovalReadiness ?? {
          status: "BLOCKED" as const,
          blockingReasons: ["FINAL_APPROVAL_READINESS_UNAVAILABLE"],
        },
      },
      workflow: {
        ...summary.workflow,
        availableActions: availability?.availableActions ?? [],
        blockingReasons: availability?.blockingReasons ?? ["WORKFLOW_AVAILABILITY_UNAVAILABLE"],
      },
    }
  }))
  return { items, page: input.page, pageSize: input.pageSize, total }
}

export async function getGorutPackageDetail(prisma: PrismaClient, context: GorutOperationalContext, packageCode: string) {
  const where = packageWhere(context)
  if (!where) return null
  const row = await prisma.gorutUpzisPackage.findFirst({
    where: { ...where, packageCode },
    select: packageDetailSelect,
  })
  if (!row) return undefined
  const detail = serializePackageDetail(row)
  const [availability, settlementAvailability, validationAvailability] = await Promise.all([
    getGorutPackageWorkflowAvailability(prisma, context, packageCode),
    getGorutPackageSettlementAvailability(prisma, context, packageCode),
    getGorutPackageValidationAvailability(prisma, context, packageCode),
  ])
  return {
    ...detail,
    settlement: {
      ...detail.settlement,
      availableActions: settlementAvailability?.availableActions ?? [],
      blockingReasons: settlementAvailability?.blockingReasons ?? ["SETTLEMENT_CAPABILITY_UNAVAILABLE"],
      validation: {
        ...detail.settlement.validation,
        availableActions: validationAvailability?.availableActions ?? [],
        blockingReasons: validationAvailability?.blockingReasons ?? ["VALIDATION_CAPABILITY_UNAVAILABLE"],
      },
      finalApprovalReadiness: validationAvailability?.finalApprovalReadiness ?? {
        status: "BLOCKED" as const,
        blockingReasons: ["FINAL_APPROVAL_READINESS_UNAVAILABLE"],
      },
    },
    workflow: {
      ...detail.workflow,
      availableActions: availability?.availableActions ?? [],
      blockingReasons: availability?.blockingReasons ?? ["WORKFLOW_AVAILABILITY_UNAVAILABLE"],
      finalApproved: {
        ...detail.workflow.finalApproved,
        readiness: detail.workflow.finalApproved.approved
          ? { status: "READY" as const, blockingReasons: [] }
          : availability?.finalApprovalReadiness ?? {
            status: "BLOCKED" as const,
            blockingReasons: ["FINAL_APPROVAL_READINESS_UNAVAILABLE"],
          },
      },
    },
    finalApproval: {
      ...detail.finalApproval,
      readiness: detail.finalApproval.approved
        ? { status: "READY" as const, blockingReasons: [] }
        : availability?.finalApprovalReadiness ?? {
          status: "BLOCKED" as const,
          blockingReasons: ["FINAL_APPROVAL_READINESS_UNAVAILABLE"],
        },
    },
  }
}
