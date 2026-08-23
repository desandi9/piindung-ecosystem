import assert from "node:assert/strict"
import { after, test } from "node:test"
import {
  GorutOperationalRole,
  GorutPackageFinancialStatus,
  GorutPackageRecordOrigin,
  GorutPackageSettlementMode,
  GorutPackageSettlementValidationResult,
  GorutTransactionState,
  PrismaClient,
} from "@prisma/client"
import { recordGorutPackageSettlement } from "./gorut-package-settlement-server"
import {
  getGorutPackageValidationAvailability,
  validateGorutPackageSettlement,
} from "./gorut-package-validation-server"
import { GorutPackageValidationError } from "./gorut-package-validation-pure"
import { getGorutPackageDetail } from "./gorut-package-server"
import type { GorutOperationalContext } from "./gorut/server-pure"

process.env.GORUT_DEPLOYMENT_ENV = "UAT"
process.env.GORUT_ENABLE_PROVISIONAL_FEE_POLICY = "true"

const prisma = new PrismaClient()
const runtime = { deploymentEnvironment: "UAT" as const, enabled: true }
let sequence = 0

after(async () => {
  await prisma.$disconnect()
})

function context(
  userId: string,
  assignmentId: string,
  operationalRole: GorutOperationalRole,
  kecamatanId: string | null,
): GorutOperationalContext {
  return { userId, assignmentId, operationalRole, kecamatanId, rantingId: null, plpkId: null }
}

async function fixture() {
  sequence += 1
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
  const marker = alphabet[sequence]!
  const suffix = String(sequence).padStart(2, "0")
  const token = `VAL${marker}`
  const [pcUser, upzisUser] = await Promise.all([
    prisma.user.create({
      data: {
        memberId: `PID-VVVVVVVV${marker}PC2`,
        name: `${token} PC`,
        phone: `6288200${suffix}01`,
        passwordHash: "test",
        role: "pc",
      },
    }),
    prisma.user.create({
      data: {
        memberId: `PID-VVVVVVVV${marker}UP2`,
        name: `${token} UPZIS`,
        phone: `6288200${suffix}02`,
        passwordHash: "test",
        role: "upzis",
      },
    }),
  ])
  const kecamatan = await prisma.gorutKecamatan.create({
    data: { code: `${token}-KEC`, name: `${token} Kecamatan` },
  })
  const [pcAssignment, upzisAssignment] = await Promise.all([
    prisma.gorutOperationalAssignment.create({
      data: { userId: pcUser.id, role: GorutOperationalRole.PC },
    }),
    prisma.gorutOperationalAssignment.create({
      data: { userId: upzisUser.id, role: GorutOperationalRole.UPZIS, kecamatanId: kecamatan.id },
    }),
  ])
  const packageRow = await prisma.gorutUpzisPackage.create({
    data: {
      packageCode: `GPK-202608-${token}`,
      kecamatanId: kecamatan.id,
      periodStart: new Date("2026-08-01T00:00:00.000Z"),
      currentState: GorutTransactionState.WAITING_PC_APPROVAL,
      version: 3,
      revision: 2,
      recordOrigin: GorutPackageRecordOrigin.NATIVE,
      financialStatus: GorutPackageFinancialStatus.READY,
      grossAmount: "32500.00",
      totalPlpkFee: "5000.00",
      netAmount: "27500.00",
      calculatedAt: new Date("2026-08-20T03:00:00.000Z"),
      calculationPolicyVersion: "GORUT-PLPK-FEE-V1-PROVISIONAL",
      financialSourceRevision: 2,
      financialSourceHash: `sha256:${token}`,
    },
  })
  return {
    packageRow,
    pcUser,
    upzisUser,
    pcContext: context(pcUser.id, pcAssignment.id, GorutOperationalRole.PC, null),
    upzisContext: context(upzisUser.id, upzisAssignment.id, GorutOperationalRole.UPZIS, kecamatan.id),
  }
}

async function bankSettlement(
  row: Awaited<ReturnType<typeof fixture>>,
  actualAmount: string,
  expectedVersion = 3,
  suffix = "bank",
) {
  return recordGorutPackageSettlement(prisma, row.upzisContext, {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount,
    occurredAt: new Date("2026-08-21T08:00:00.000Z"),
    externalReference: `BNI-${suffix}`,
    evidenceReference: `SLIP-${suffix}`,
    expectedVersion,
    idempotencyKey: `${row.packageRow.packageCode}:settlement:${suffix}`,
  }, { runtime })
}

async function rejectValidation(run: () => Promise<unknown>, code: string) {
  await assert.rejects(
    run,
    (error: unknown) => error instanceof GorutPackageValidationError && error.code === code,
  )
}

function containsInternalDatabaseId(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  if (Array.isArray(value)) return value.some(containsInternalDatabaseId)
  const forbidden = new Set([
    "id",
    "packageId",
    "userId",
    "assignmentId",
    "evidenceId",
    "settlementEvidenceId",
    "validatorUserId",
    "validatorAssignmentId",
  ])
  return Object.entries(value).some(([key, nested]) => forbidden.has(key) || containsInternalDatabaseId(nested))
}

test("PC receiver may validate its own pickup as MATCHED without workflow transition", async () => {
  const row = await fixture()
  const pickup = await recordGorutPackageSettlement(prisma, row.pcContext, {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.PC_PICKUP,
    actualAmount: "27500.00",
    occurredAt: new Date("2026-08-21T09:00:00.000Z"),
    handedOverByMemberId: row.upzisUser.memberId,
    expectedVersion: 3,
    idempotencyKey: `${row.packageRow.packageCode}:pickup`,
  }, { runtime })
  assert.equal(pickup.settlement.actors.receivedBy?.memberId, row.pcUser.memberId)

  const result = await validateGorutPackageSettlement(prisma, row.pcContext, {
    packageCode: row.packageRow.packageCode,
    settlementEvidenceCode: pickup.settlement.evidenceCode,
    note: "Uang pickup dihitung ulang.",
    expectedVersion: 4,
    idempotencyKey: `${row.packageRow.packageCode}:validation:pickup`,
  }, { runtime, now: new Date("2026-08-21T09:10:00.000Z") })

  assert.equal(result.validation.result, GorutPackageSettlementValidationResult.MATCHED)
  assert.equal(result.validation.expectedAmount, "27500.00")
  assert.equal(result.validation.actualAmount, "27500.00")
  assert.equal(result.validation.difference, "0.00")
  assert.equal(result.validation.validator.memberId, row.pcUser.memberId)
  assert.equal(result.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
  assert.equal(result.version, 5)
  assert.equal(result.revision, 2)
  assert.equal(result.finalApprovalReadiness.status, "READY")
  assert.deepEqual(result.validation.doesNotAssert, ["BANK_SETTLED", "FUNDS_CLEARED", "CRYPTOGRAPHIC_PROOF_VALIDITY"])

  const persistedPackage = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { id: row.packageRow.id } })
  assert.equal(persistedPackage.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
  assert.equal(persistedPackage.revision, 2)
  assert.equal(await prisma.gorutWorkflowEvent.count({ where: { packageId: row.packageRow.id } }), 0)

  const detail = await getGorutPackageDetail(prisma, row.pcContext, row.packageRow.packageCode)
  assert.equal(detail?.settlement.validation.status, "CURRENT")
  assert.equal(detail?.settlement.validation.result, "MATCHED")
  assert.equal(detail?.settlement.finalApprovalReadiness.status, "READY")
  assert.deepEqual(detail?.settlement.validation.availableActions, [])
  assert.equal(detail?.workflow.availableActions.some((action: string) => action === "FINAL_APPROVED"), false)
  assert.equal(containsInternalDatabaseId(detail), false)
})

test("bank validation derives lower and higher MISMATCH amounts and never auto-returns", async () => {
  for (const [actualAmount, difference] of [["27000.00", "-500.00"], ["28000.00", "500.00"]] as const) {
    const row = await fixture()
    const settlement = await bankSettlement(row, actualAmount, 3, actualAmount.replace(".", "-"))
    const result = await validateGorutPackageSettlement(prisma, row.pcContext, {
      packageCode: row.packageRow.packageCode,
      settlementEvidenceCode: settlement.settlement.evidenceCode,
      expectedVersion: 4,
      idempotencyKey: `${row.packageRow.packageCode}:validation:${actualAmount}`,
    }, { runtime })
    assert.equal(result.validation.result, GorutPackageSettlementValidationResult.MISMATCH)
    assert.equal(result.validation.difference, difference)
    assert.equal(result.validation.settlementMode, GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT)
    assert.equal(result.validation.assertion, "NOMINAL_AND_REFERENCED_EVIDENCE_REVIEWED")
    assert.equal(result.finalApprovalReadiness.status, "BLOCKED")
    assert.ok(result.finalApprovalReadiness.blockingReasons.includes("SETTLEMENT_AMOUNT_MISMATCH"))
    assert.equal(result.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
    assert.equal(await prisma.gorutWorkflowEvent.count({ where: { packageId: row.packageRow.id } }), 0)
  }
})

test("UPZIS cannot validate and provisional production policy remains fail-closed", async () => {
  const row = await fixture()
  const settlement = await bankSettlement(row, "27500.00")
  const input = {
    packageCode: row.packageRow.packageCode,
    settlementEvidenceCode: settlement.settlement.evidenceCode,
    expectedVersion: 4,
    idempotencyKey: `${row.packageRow.packageCode}:validation:security`,
  }
  await rejectValidation(
    () => validateGorutPackageSettlement(prisma, row.upzisContext, input, { runtime }),
    "VALIDATION_ACCESS_DENIED",
  )
  await rejectValidation(
    () => validateGorutPackageSettlement(prisma, row.pcContext, input, {
      runtime: { deploymentEnvironment: "PRODUCTION", enabled: true },
    }),
    "VALIDATION_PROVISIONAL_POLICY_DISABLED",
  )
  assert.equal(await prisma.gorutPackageSettlementValidation.count({ where: { packageId: row.packageRow.id } }), 0)
})

test("settlement correction makes historical validation stale and requires a new immutable validation", async () => {
  const row = await fixture()
  const first = await bankSettlement(row, "27000.00", 3, "revision-1")
  const firstValidation = await validateGorutPackageSettlement(prisma, row.pcContext, {
    packageCode: row.packageRow.packageCode,
    settlementEvidenceCode: first.settlement.evidenceCode,
    expectedVersion: 4,
    idempotencyKey: `${row.packageRow.packageCode}:validation:revision-1`,
  }, { runtime })
  assert.equal(firstValidation.validation.result, "MISMATCH")

  const corrected = await recordGorutPackageSettlement(prisma, row.upzisContext, {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: "27500.00",
    occurredAt: new Date("2026-08-21T10:00:00.000Z"),
    externalReference: "BNI-revision-2",
    supersedesEvidenceCode: first.settlement.evidenceCode,
    expectedVersion: 5,
    idempotencyKey: `${row.packageRow.packageCode}:settlement:revision-2`,
  }, { runtime })

  const staleDetail = await getGorutPackageDetail(prisma, row.pcContext, row.packageRow.packageCode)
  assert.equal(staleDetail?.settlement.validation.status, "STALE")
  assert.equal(staleDetail?.settlement.validation.result, null)
  assert.equal(staleDetail?.settlement.validation.historical.length, 1)
  assert.equal(staleDetail?.settlement.validation.historical[0]?.status, "STALE")
  assert.deepEqual(staleDetail?.settlement.validation.availableActions, ["VALIDATE_SETTLEMENT"])
  assert.equal(staleDetail?.settlement.finalApprovalReadiness.status, "BLOCKED")

  await rejectValidation(() => validateGorutPackageSettlement(prisma, row.pcContext, {
    packageCode: row.packageRow.packageCode,
    settlementEvidenceCode: first.settlement.evidenceCode,
    expectedVersion: 6,
    idempotencyKey: `${row.packageRow.packageCode}:validation:stale`,
  }, { runtime }), "VALIDATION_STALE_SETTLEMENT")

  const secondValidation = await validateGorutPackageSettlement(prisma, row.pcContext, {
    packageCode: row.packageRow.packageCode,
    settlementEvidenceCode: corrected.settlement.evidenceCode,
    expectedVersion: 6,
    idempotencyKey: `${row.packageRow.packageCode}:validation:revision-2`,
  }, { runtime })
  assert.equal(secondValidation.validation.result, "MATCHED")
  assert.equal(secondValidation.validation.settlementRevision, 2)
  assert.equal(secondValidation.finalApprovalReadiness.status, "READY")

  const detail = await getGorutPackageDetail(prisma, row.pcContext, row.packageRow.packageCode)
  assert.equal(detail?.settlement.latest?.evidenceCode, corrected.settlement.evidenceCode)
  assert.equal(detail?.settlement.validation.status, "CURRENT")
  assert.equal(detail?.settlement.validation.historical.length, 2)
  assert.deepEqual(detail?.settlement.validation.historical.map((item) => item.status), ["STALE", "CURRENT"])
  assert.equal(await prisma.gorutPackageSettlementValidation.count({ where: { packageId: row.packageRow.id } }), 2)
})

test("validation retries are idempotent and parallel intents create exactly one result", async () => {
  const row = await fixture()
  const settlement = await bankSettlement(row, "27500.00")
  const command = {
    packageCode: row.packageRow.packageCode,
    settlementEvidenceCode: settlement.settlement.evidenceCode,
    note: "Evidence diperiksa.",
    expectedVersion: 4,
    idempotencyKey: `${row.packageRow.packageCode}:validation:parallel`,
  }
  const parallel = await Promise.all([
    validateGorutPackageSettlement(prisma, row.pcContext, command, { runtime }),
    validateGorutPackageSettlement(prisma, row.pcContext, command, { runtime }),
  ])
  assert.equal(new Set(parallel.map((item) => item.validation.validationCode)).size, 1)
  assert.equal(parallel.some((item) => item.idempotentReplay), true)
  assert.equal(await prisma.gorutPackageSettlementValidation.count({ where: { packageId: row.packageRow.id } }), 1)

  const replay = await validateGorutPackageSettlement(prisma, row.pcContext, command, { runtime })
  assert.equal(replay.idempotentReplay, true)
  await rejectValidation(() => validateGorutPackageSettlement(prisma, row.pcContext, {
    ...command,
    note: "Command facts berbeda.",
  }, { runtime }), "VALIDATION_IDEMPOTENCY_CONFLICT")
  await rejectValidation(() => validateGorutPackageSettlement(prisma, row.pcContext, {
    ...command,
    idempotencyKey: `${row.packageRow.packageCode}:validation:duplicate-fact`,
    expectedVersion: 5,
  }, { runtime }), "VALIDATION_ALREADY_CURRENT")

  const validation = await prisma.gorutPackageSettlementValidation.findFirstOrThrow({
    where: { packageId: row.packageRow.id },
  })
  await assert.rejects(() => prisma.gorutPackageSettlementValidation.update({
    where: { id: validation.id },
    data: { differenceAmount: "1.00" },
  }))
  await assert.rejects(() => prisma.gorutPackageSettlementValidation.update({
    where: { id: validation.id },
    data: { result: GorutPackageSettlementValidationResult.MISMATCH },
  }))
})

test("availability requires a current settlement and exposes mismatch clarification blockers", async () => {
  const empty = await fixture()
  const before = await getGorutPackageValidationAvailability(prisma, empty.pcContext, empty.packageRow.packageCode, { runtime })
  assert.deepEqual(before?.availableActions, [])
  assert.ok(before?.blockingReasons.includes("CURRENT_SETTLEMENT_EVIDENCE_MISSING"))

  const row = await fixture()
  const settlement = await bankSettlement(row, "27000.00")
  const open = await getGorutPackageValidationAvailability(prisma, row.pcContext, row.packageRow.packageCode, { runtime })
  assert.deepEqual(open?.availableActions, ["VALIDATE_SETTLEMENT"])
  await validateGorutPackageSettlement(prisma, row.pcContext, {
    packageCode: row.packageRow.packageCode,
    settlementEvidenceCode: settlement.settlement.evidenceCode,
    expectedVersion: 4,
    idempotencyKey: `${row.packageRow.packageCode}:validation:mismatch-blocker`,
  }, { runtime })
  const blocked = await getGorutPackageValidationAvailability(prisma, row.pcContext, row.packageRow.packageCode, { runtime })
  assert.deepEqual(blocked?.availableActions, [])
  assert.ok(blocked?.blockingReasons.includes("SETTLEMENT_AMOUNT_MISMATCH"))
  assert.ok(blocked?.blockingReasons.includes("SETTLEMENT_VALIDATION_REQUIRES_NEW_EVIDENCE"))
})
