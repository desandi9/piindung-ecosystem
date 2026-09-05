import {
  GorutOperationalRole,
  GorutPackageSettlementMode,
  Prisma,
  type PrismaClient,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
import {
  assertGorutProvisionalFeePolicyAllowed,
  resolveGorutProvisionalFeeRuntime,
  type GorutProvisionalFeeRuntime,
} from "./gorut-provisional-plpk-fee-policy"
import { stableSourceHash } from "./gorut-package-materializer-pure"
import {
  calculateGorutPackageSettlementAvailability,
  GorutPackageSettlementError,
} from "./gorut-package-settlement-pure"

export const GORUT_SETTLEMENT_DEFAULT_BANK = "BNI"

const settlementEvidenceSelect = {
  evidenceCode: true,
  mode: true,
  revision: true,
  expectedAmountSnapshot: true,
  actualAmount: true,
  occurredAt: true,
  recordedAt: true,
  externalReference: true,
  evidenceReference: true,
  bankName: true,
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
  receivedAt: true,
  commandHash: true,
} satisfies Prisma.GorutPackageSettlementEvidenceSelect

const settlementPackageSelect = {
  id: true,
  packageCode: true,
  kecamatanId: true,
  currentState: true,
  version: true,
  revision: true,
  isHistorical: true,
  financialStatus: true,
  grossAmount: true,
  totalPlpkFee: true,
  netAmount: true,
} satisfies Prisma.GorutUpzisPackageSelect

type TxClient = Prisma.TransactionClient
type SettlementEvidence = Prisma.GorutPackageSettlementEvidenceGetPayload<{ select: typeof settlementEvidenceSelect }>
type SettlementPackage = Prisma.GorutUpzisPackageGetPayload<{ select: typeof settlementPackageSelect }>

export type RecordGorutPackageSettlementInput = {
  packageCode: string
  mode: GorutPackageSettlementMode
  actualAmount: string
  occurredAt: Date
  handedOverByMemberId?: string | null
  bankName?: string | null
  externalReference?: string | null
  evidenceReference?: string | null
  note?: string | null
  supersedesEvidenceCode?: string | null
  expectedVersion: number
  idempotencyKey: string
}

function normalizedText(value: string | null | undefined) {
  return value?.trim() || null
}

export function serializeGorutSettlementEvidence(row: SettlementEvidence) {
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
    bank: row.mode === GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT ? row.bankName : null,
    externalReference: row.externalReference,
    evidenceReference: row.evidenceReference,
    note: row.note,
    packageVersion: {
      before: row.packageVersionBefore,
      after: row.packageVersionAfter,
    },
  }
}

function packageFacts(row: SettlementPackage) {
  return {
    currentState: row.currentState,
    financialStatus: row.financialStatus,
    netAmountAvailable: row.netAmount !== null,
    isHistorical: row.isHistorical,
    kecamatanId: row.kecamatanId,
  }
}

function publicResult(packageRow: SettlementPackage, evidence: SettlementEvidence, idempotentReplay: boolean) {
  return {
    packageCode: packageRow.packageCode,
    currentState: packageRow.currentState,
    version: packageRow.version,
    revision: packageRow.revision,
    financial: {
      status: packageRow.financialStatus,
      grossAmount: packageRow.grossAmount?.toFixed(2) ?? null,
      totalPlpkFee: packageRow.totalPlpkFee?.toFixed(2) ?? null,
      netAmount: packageRow.netAmount?.toFixed(2) ?? null,
    },
    settlement: serializeGorutSettlementEvidence(evidence),
    validation: { status: "NOT_VALIDATED" as const, result: null },
    idempotentReplay,
  }
}

function assertRuntime(runtime: GorutProvisionalFeeRuntime) {
  try {
    assertGorutProvisionalFeePolicyAllowed(runtime)
  } catch {
    throw new GorutPackageSettlementError(
      "SETTLEMENT_PROVISIONAL_POLICY_DISABLED",
      "Settlement GORUT provisional tidak tersedia pada environment ini.",
    )
  }
}

async function assertRecorderAssignment(tx: TxClient, context: GorutOperationalContext, packageRow: SettlementPackage) {
  const assignment = await tx.gorutOperationalAssignment.findFirst({
    where: {
      id: context.assignmentId,
      userId: context.userId,
      role: context.operationalRole,
      isActive: true,
      ...(context.operationalRole === GorutOperationalRole.PC
        ? { kecamatanId: null, rantingId: null, plpkId: null }
        : context.operationalRole === GorutOperationalRole.UPZIS
          ? { kecamatanId: packageRow.kecamatanId, rantingId: null, plpkId: null }
          : { id: "__SETTLEMENT_ROLE_NOT_ALLOWED__" }),
    },
    select: { id: true },
  })
  if (!assignment) {
    throw new GorutPackageSettlementError("SETTLEMENT_ACCESS_DENIED", "Actor settlement tidak memiliki assignment yang sesuai package.")
  }
  return assignment
}

async function resolveHandedOverBy(tx: TxClient, memberId: string, packageRow: SettlementPackage) {
  const user = await tx.user.findFirst({
    where: {
      memberId,
      status: "Aktif",
      gorutAssignments: {
        some: {
          role: GorutOperationalRole.UPZIS,
          kecamatanId: packageRow.kecamatanId,
          rantingId: null,
          plpkId: null,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      gorutAssignments: {
        where: {
          role: GorutOperationalRole.UPZIS,
          kecamatanId: packageRow.kecamatanId,
          rantingId: null,
          plpkId: null,
          isActive: true,
        },
        select: { id: true },
        orderBy: { id: "asc" },
        take: 1,
      },
    },
  })
  const assignment = user?.gorutAssignments[0]
  if (!user || !assignment) {
    throw new GorutPackageSettlementError(
      "SETTLEMENT_ACCESS_DENIED",
      "Petugas handover bukan pengurus UPZIS aktif dalam scope Kecamatan package.",
    )
  }
  return { userId: user.id, assignmentId: assignment.id }
}

function retryable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2025", "P2034"].includes(error.code)
}

async function serializable<T>(prisma: PrismaClient, run: (tx: TxClient) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (!retryable(error)) throw error
      if (attempt === 3) {
        const code = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "SETTLEMENT_IDEMPOTENCY_CONFLICT"
          : "SETTLEMENT_VERSION_CONFLICT"
        throw new GorutPackageSettlementError(code, "Concurrent settlement command tidak dapat direkonsiliasi secara otomatis.")
      }
    }
  }
  throw new GorutPackageSettlementError("SETTLEMENT_VERSION_CONFLICT", "Settlement command mencapai batas retry.")
}

async function loadPackage(tx: TxClient, packageCode: string) {
  const row = await tx.gorutUpzisPackage.findUnique({ where: { packageCode }, select: settlementPackageSelect })
  if (!row) throw new GorutPackageSettlementError("SETTLEMENT_PACKAGE_NOT_FOUND", "Package GORUT tidak ditemukan.")
  return row
}

export async function getGorutPackageSettlementAvailability(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  packageCode: string,
  options: { runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const row = await prisma.gorutUpzisPackage.findUnique({ where: { packageCode }, select: settlementPackageSelect })
  if (!row) return undefined
  return calculateGorutPackageSettlementAvailability(
    context,
    options.runtime ?? resolveGorutProvisionalFeeRuntime(),
    packageFacts(row),
  )
}

export async function recordGorutPackageSettlement(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: RecordGorutPackageSettlementInput,
  options: { now?: Date; runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  assertRuntime(runtime)
  const now = options.now ?? new Date()
  if (!/^(?:0|[1-9]\d{0,16})(?:\.\d{1,2})?$/.test(input.actualAmount)) {
    throw new GorutPackageSettlementError("SETTLEMENT_AMOUNT_INVALID", "Nominal factual wajib berupa decimal string canonical.")
  }
  if (Number.isNaN(input.occurredAt.getTime())) {
    throw new GorutPackageSettlementError("SETTLEMENT_OCCURRENCE_INVALID", "Waktu kejadian settlement tidak valid.")
  }
  const actualAmount = new Prisma.Decimal(input.actualAmount)
  const idempotencyKey = input.idempotencyKey.trim()
  const handedOverByMemberId = normalizedText(input.handedOverByMemberId)
  const bankName = normalizedText(input.bankName) ?? (input.mode === GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT ? GORUT_SETTLEMENT_DEFAULT_BANK : null)
  const externalReference = normalizedText(input.externalReference)
  const evidenceReference = normalizedText(input.evidenceReference)
  const note = normalizedText(input.note)
  const supersedesEvidenceCode = normalizedText(input.supersedesEvidenceCode)
  if (actualAmount.isNegative()) throw new GorutPackageSettlementError("SETTLEMENT_AMOUNT_INVALID", "Nominal factual tidak boleh negatif.")
  if (!idempotencyKey) throw new GorutPackageSettlementError("SETTLEMENT_IDEMPOTENCY_CONFLICT", "Idempotency key wajib diisi.")

  const commandHash = stableSourceHash({
    action: input.mode === GorutPackageSettlementMode.PC_PICKUP ? "RECORD_PC_PICKUP" : "RECORD_BANK_DEPOSIT",
    actualAmount: actualAmount.toFixed(2),
    bankName,
    evidenceReference,
    expectedVersion: input.expectedVersion,
    externalReference,
    handedOverByMemberId,
    note,
    occurredAt: input.occurredAt.toISOString(),
    packageCode: input.packageCode,
    supersedesEvidenceCode,
  })

  return serializable(prisma, async (tx) => {
    const packageRow = await loadPackage(tx, input.packageCode)
    const recorderAssignment = await assertRecorderAssignment(tx, context, packageRow)
    const existing = await tx.gorutPackageSettlementEvidence.findUnique({
      where: { packageId_idempotencyKey: { packageId: packageRow.id, idempotencyKey } },
      select: settlementEvidenceSelect,
    })
    if (existing) {
      if (existing.commandHash !== commandHash) {
        throw new GorutPackageSettlementError("SETTLEMENT_IDEMPOTENCY_CONFLICT", "Idempotency key digunakan ulang dengan fakta yang berbeda.")
      }
      return publicResult(packageRow, existing, true)
    }
    if (packageRow.version !== input.expectedVersion) {
      throw new GorutPackageSettlementError("SETTLEMENT_VERSION_CONFLICT", "Versi package berubah; muat ulang data sebelum mencatat evidence baru.", {
        expectedVersion: input.expectedVersion,
        actualVersion: packageRow.version,
      })
    }

    const availability = calculateGorutPackageSettlementAvailability(context, runtime, packageFacts(packageRow))
    const requiredAction = input.mode === GorutPackageSettlementMode.PC_PICKUP ? "RECORD_PC_PICKUP" : "RECORD_BANK_DEPOSIT"
    if (!availability.availableActions.includes(requiredAction)) {
      const accessBlocked = context.operationalRole !== GorutOperationalRole.PC && context.operationalRole !== GorutOperationalRole.UPZIS
      throw new GorutPackageSettlementError(
        accessBlocked ? "SETTLEMENT_ACCESS_DENIED" : "SETTLEMENT_GATE_BLOCKED",
        "Pencatatan settlement tidak tersedia untuk actor atau kondisi package ini.",
        { blockingReasons: availability.blockingReasons },
      )
    }

    let handedOver: { userId: string; assignmentId: string } | null = null
    if (input.mode === GorutPackageSettlementMode.PC_PICKUP) {
      if (!handedOverByMemberId) throw new GorutPackageSettlementError("SETTLEMENT_HANDOVER_ACTOR_REQUIRED", "Petugas UPZIS yang menyerahkan uang wajib dicatat.")
      handedOver = await resolveHandedOverBy(tx, handedOverByMemberId, packageRow)
    }

    let supersedes: { id: string; mode: GorutPackageSettlementMode; supersededBy: { evidenceCode: string } | null } | null = null
    if (supersedesEvidenceCode) {
      supersedes = await tx.gorutPackageSettlementEvidence.findFirst({
        where: { packageId: packageRow.id, evidenceCode: supersedesEvidenceCode },
        select: { id: true, mode: true, supersededBy: { select: { evidenceCode: true } } },
      })
      if (!supersedes || supersedes.mode !== input.mode || supersedes.supersededBy) {
        throw new GorutPackageSettlementError(
          "SETTLEMENT_SUPERSESSION_CONFLICT",
          "Evidence yang dikoreksi tidak ditemukan, berbeda mode, atau sudah memiliki revisi pengganti.",
        )
      }
    }

    const aggregate = await tx.gorutPackageSettlementEvidence.aggregate({
      where: { packageId: packageRow.id },
      _max: { revision: true },
    })
    const evidenceRevision = (aggregate._max.revision ?? 0) + 1
    const nextPackageVersion = packageRow.version + 1
    const evidenceCode = `${packageRow.packageCode}-SET-${String(evidenceRevision).padStart(3, "0")}`

    const created = await tx.gorutPackageSettlementEvidence.create({
      data: {
        evidenceCode,
        packageId: packageRow.id,
        mode: input.mode,
        revision: evidenceRevision,
        supersedesEvidenceId: supersedes?.id ?? null,
        expectedAmountSnapshot: packageRow.netAmount!,
        actualAmount,
        occurredAt: input.occurredAt,
        recordedAt: now,
        recordedByUserId: context.userId,
        recordedByAssignmentId: recorderAssignment.id,
        handedOverByUserId: handedOver?.userId ?? null,
        handedOverByAssignmentId: handedOver?.assignmentId ?? null,
        receivedByUserId: input.mode === GorutPackageSettlementMode.PC_PICKUP ? context.userId : null,
        receivedAt: input.mode === GorutPackageSettlementMode.PC_PICKUP ? input.occurredAt : null,
        depositedByUserId: input.mode === GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT ? context.userId : null,
        bankName,
        externalReference,
        evidenceReference,
        note,
        idempotencyKey,
        commandHash,
        packageVersionBefore: packageRow.version,
        packageVersionAfter: nextPackageVersion,
        createdAt: now,
      },
      select: settlementEvidenceSelect,
    })
    const updated = await tx.gorutUpzisPackage.update({
      where: { id: packageRow.id, version: packageRow.version },
      data: { version: nextPackageVersion, updatedAt: now },
      select: settlementPackageSelect,
    })
    return publicResult(updated, created, false)
  })
}
