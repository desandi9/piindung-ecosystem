import {
  GorutOperationalRole,
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
  calculateGorutFinalApprovalReadiness,
  calculateGorutPackageValidationAvailability,
  calculateGorutValidationAmounts,
  GorutPackageValidationError,
  type GorutPackageValidationFacts,
} from "./gorut-package-validation-pure"

const validationSelect = {
  validationCode: true,
  settlementRevisionSnapshot: true,
  expectedAmountSnapshot: true,
  actualAmountSnapshot: true,
  differenceAmount: true,
  result: true,
  validatedAt: true,
  note: true,
  idempotencyKey: true,
  commandHash: true,
  packageVersionBefore: true,
  packageVersionAfter: true,
  validator: { select: { memberId: true, name: true } },
  validatorAssignment: { select: { role: true } },
  settlementEvidence: { select: { evidenceCode: true, mode: true, revision: true } },
} satisfies Prisma.GorutPackageSettlementValidationSelect

const validationSettlementSelect = {
  id: true,
  evidenceCode: true,
  mode: true,
  revision: true,
  expectedAmountSnapshot: true,
  actualAmount: true,
  supersededBy: { select: { evidenceCode: true } },
  validation: { select: validationSelect },
} satisfies Prisma.GorutPackageSettlementEvidenceSelect

const validationPackageSelect = {
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
  settlementEvidence: {
    select: validationSettlementSelect,
    orderBy: [{ revision: "desc" as const }, { evidenceCode: "desc" as const }],
  },
} satisfies Prisma.GorutUpzisPackageSelect

type TxClient = Prisma.TransactionClient
type Validation = Prisma.GorutPackageSettlementValidationGetPayload<{ select: typeof validationSelect }>
type ValidationSettlement = Prisma.GorutPackageSettlementEvidenceGetPayload<{ select: typeof validationSettlementSelect }>
type ValidationPackage = Prisma.GorutUpzisPackageGetPayload<{ select: typeof validationPackageSelect }>

export type ValidateGorutPackageSettlementInput = {
  packageCode: string
  settlementEvidenceCode: string
  note?: string | null
  expectedVersion: number
  idempotencyKey: string
}

function currentSettlement(rows: ValidationSettlement[]) {
  return rows.find((row) => !row.supersededBy) ?? null
}

function financialSourceClean(packageRow: ValidationPackage, settlement: ValidationSettlement | null) {
  if (!packageRow.grossAmount || !packageRow.totalPlpkFee || !packageRow.netAmount || !settlement) return false
  return packageRow.grossAmount.minus(packageRow.totalPlpkFee).equals(packageRow.netAmount) &&
    settlement.expectedAmountSnapshot.equals(packageRow.netAmount)
}

function validationFacts(packageRow: ValidationPackage): GorutPackageValidationFacts {
  const settlement = currentSettlement(packageRow.settlementEvidence)
  return {
    currentState: packageRow.currentState,
    financialStatus: packageRow.financialStatus,
    financialSourceClean: financialSourceClean(packageRow, settlement),
    isHistorical: packageRow.isHistorical,
    hasCurrentSettlement: Boolean(settlement),
    currentValidationResult: settlement?.validation?.result ?? null,
  }
}

export function serializeGorutPackageValidation(
  validation: Validation,
  currentSettlementEvidenceCode: string | null,
) {
  const isCurrent = validation.settlementEvidence.evidenceCode === currentSettlementEvidenceCode
  return {
    status: isCurrent ? "CURRENT" as const : "STALE" as const,
    validationCode: validation.validationCode,
    settlementEvidenceCode: validation.settlementEvidence.evidenceCode,
    settlementMode: validation.settlementEvidence.mode,
    settlementRevision: validation.settlementRevisionSnapshot,
    result: validation.result,
    expectedAmount: validation.expectedAmountSnapshot.toFixed(2),
    actualAmount: validation.actualAmountSnapshot.toFixed(2),
    difference: validation.differenceAmount.toFixed(2),
    currency: "IDR" as const,
    validator: {
      memberId: validation.validator.memberId,
      name: validation.validator.name,
      role: validation.validatorAssignment.role,
    },
    validatedAt: validation.validatedAt.toISOString(),
    note: validation.note,
    packageVersion: { before: validation.packageVersionBefore, after: validation.packageVersionAfter },
    assertion: "NOMINAL_AND_REFERENCED_EVIDENCE_REVIEWED" as const,
    doesNotAssert: ["BANK_SETTLED", "FUNDS_CLEARED", "CRYPTOGRAPHIC_PROOF_VALIDITY"] as const,
  }
}

function publicResult(
  packageRow: ValidationPackage,
  validation: Validation,
  runtime: GorutProvisionalFeeRuntime,
  idempotentReplay: boolean,
) {
  const current = currentSettlement(packageRow.settlementEvidence)
  const facts = validationFacts(packageRow)
  return {
    packageCode: packageRow.packageCode,
    currentState: packageRow.currentState,
    version: packageRow.version,
    revision: packageRow.revision,
    validation: serializeGorutPackageValidation(validation, current?.evidenceCode ?? null),
    finalApprovalReadiness: calculateGorutFinalApprovalReadiness(runtime, facts),
    idempotentReplay,
  }
}

function assertRuntime(runtime: GorutProvisionalFeeRuntime) {
  try {
    assertGorutProvisionalFeePolicyAllowed(runtime)
  } catch {
    throw new GorutPackageValidationError(
      "VALIDATION_PROVISIONAL_POLICY_DISABLED",
      "Validasi settlement provisional tidak tersedia pada environment ini.",
    )
  }
}

async function assertValidatorAssignment(tx: TxClient, context: GorutOperationalContext) {
  if (context.operationalRole !== GorutOperationalRole.PC) {
    throw new GorutPackageValidationError("VALIDATION_ACCESS_DENIED", "Validasi settlement hanya tersedia untuk assignment PC canonical.")
  }
  const assignment = await tx.gorutOperationalAssignment.findFirst({
    where: {
      id: context.assignmentId,
      userId: context.userId,
      role: GorutOperationalRole.PC,
      kecamatanId: null,
      rantingId: null,
      plpkId: null,
      isActive: true,
    },
    select: { id: true },
  })
  if (!assignment) {
    throw new GorutPackageValidationError("VALIDATION_ACCESS_DENIED", "Assignment PC validator tidak aktif atau tidak canonical.")
  }
  return assignment
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
          ? "VALIDATION_IDEMPOTENCY_CONFLICT"
          : "VALIDATION_VERSION_CONFLICT"
        throw new GorutPackageValidationError(code, "Concurrent validation command tidak dapat direkonsiliasi otomatis.")
      }
    }
  }
  throw new GorutPackageValidationError("VALIDATION_VERSION_CONFLICT", "Validation command mencapai batas retry.")
}

async function loadPackage(tx: TxClient, packageCode: string) {
  const row = await tx.gorutUpzisPackage.findUnique({ where: { packageCode }, select: validationPackageSelect })
  if (!row) throw new GorutPackageValidationError("VALIDATION_PACKAGE_NOT_FOUND", "Package GORUT tidak ditemukan.")
  return row
}

export async function getGorutPackageValidationAvailability(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  packageCode: string,
  options: { runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const packageRow = await prisma.gorutUpzisPackage.findUnique({ where: { packageCode }, select: validationPackageSelect })
  if (!packageRow) return undefined
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  return {
    ...calculateGorutPackageValidationAvailability(context, runtime, validationFacts(packageRow)),
    finalApprovalReadiness: calculateGorutFinalApprovalReadiness(runtime, validationFacts(packageRow)),
  }
}

export async function validateGorutPackageSettlement(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  input: ValidateGorutPackageSettlementInput,
  options: { now?: Date; runtime?: GorutProvisionalFeeRuntime } = {},
) {
  const runtime = options.runtime ?? resolveGorutProvisionalFeeRuntime()
  assertRuntime(runtime)
  const now = options.now ?? new Date()
  const note = input.note?.trim() || null
  const idempotencyKey = input.idempotencyKey.trim()
  if (!idempotencyKey) throw new GorutPackageValidationError("VALIDATION_IDEMPOTENCY_CONFLICT", "Idempotency key wajib diisi.")
  const commandHash = stableSourceHash({
    action: "VALIDATE_SETTLEMENT",
    expectedVersion: input.expectedVersion,
    idempotencyKey,
    note,
    packageCode: input.packageCode,
    settlementEvidenceCode: input.settlementEvidenceCode,
  })

  return serializable(prisma, async (tx) => {
    const packageRow = await loadPackage(tx, input.packageCode)
    const assignment = await assertValidatorAssignment(tx, context)
    const existing = await tx.gorutPackageSettlementValidation.findUnique({
      where: { packageId_idempotencyKey: { packageId: packageRow.id, idempotencyKey } },
      select: validationSelect,
    })
    if (existing) {
      if (existing.commandHash !== commandHash) {
        throw new GorutPackageValidationError("VALIDATION_IDEMPOTENCY_CONFLICT", "Idempotency key digunakan ulang dengan command facts berbeda.")
      }
      return publicResult(packageRow, existing, runtime, true)
    }
    if (packageRow.version !== input.expectedVersion) {
      throw new GorutPackageValidationError("VALIDATION_VERSION_CONFLICT", "Versi package berubah; muat ulang sebelum validasi.", {
        expectedVersion: input.expectedVersion,
        actualVersion: packageRow.version,
      })
    }

    const settlement = currentSettlement(packageRow.settlementEvidence)
    if (!settlement || settlement.evidenceCode !== input.settlementEvidenceCode) {
      throw new GorutPackageValidationError(
        "VALIDATION_STALE_SETTLEMENT",
        "Settlement evidence yang dipilih bukan evidence factual current package.",
        { currentSettlementEvidenceCode: settlement?.evidenceCode ?? null },
      )
    }
    if (settlement.validation) {
      throw new GorutPackageValidationError(
        "VALIDATION_ALREADY_CURRENT",
        "Settlement evidence current sudah memiliki validation result immutable; revisi evidence diperlukan untuk validasi baru.",
      )
    }
    const availability = calculateGorutPackageValidationAvailability(context, runtime, validationFacts(packageRow))
    if (!availability.availableActions.includes("VALIDATE_SETTLEMENT")) {
      throw new GorutPackageValidationError(
        "VALIDATION_GATE_BLOCKED",
        "Prerequisite validation settlement belum terpenuhi.",
        { blockingReasons: availability.blockingReasons },
      )
    }

    const calculated = calculateGorutValidationAmounts(
      settlement.expectedAmountSnapshot.toFixed(2),
      settlement.actualAmount.toFixed(2),
    )
    const nextPackageVersion = packageRow.version + 1
    const validationCode = `${packageRow.packageCode}-VAL-${String(settlement.revision).padStart(3, "0")}`
    const validation = await tx.gorutPackageSettlementValidation.create({
      data: {
        validationCode,
        packageId: packageRow.id,
        settlementEvidenceId: settlement.id,
        settlementRevisionSnapshot: settlement.revision,
        expectedAmountSnapshot: calculated.expectedAmount,
        actualAmountSnapshot: calculated.actualAmount,
        differenceAmount: calculated.differenceAmount,
        result: calculated.result,
        validatedAt: now,
        validatorUserId: context.userId,
        validatorAssignmentId: assignment.id,
        note,
        idempotencyKey,
        commandHash,
        packageVersionBefore: packageRow.version,
        packageVersionAfter: nextPackageVersion,
        createdAt: now,
      },
      select: validationSelect,
    })
    const updated = await tx.gorutUpzisPackage.update({
      where: { id: packageRow.id, version: packageRow.version },
      data: { version: nextPackageVersion, updatedAt: now },
      select: validationPackageSelect,
    })
    return publicResult(updated, validation, runtime, false)
  })
}
