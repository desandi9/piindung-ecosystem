import assert from "node:assert/strict"
import { after, test } from "node:test"
import {
  GorutOperationalRole,
  GorutPackageFinancialStatus,
  GorutPackageRecordOrigin,
  GorutPackageSettlementMode,
  GorutTransactionState,
  PrismaClient,
} from "@prisma/client"
import {
  getGorutPackageSettlementAvailability,
  recordGorutPackageSettlement,
} from "./gorut-package-settlement-server"
import { GorutPackageSettlementError } from "./gorut-package-settlement-pure"
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

function operationalContext(
  userId: string,
  assignmentId: string,
  role: GorutOperationalRole,
  kecamatanId: string | null,
): GorutOperationalContext {
  return { userId, assignmentId, operationalRole: role, kecamatanId, rantingId: null, plpkId: null }
}

async function fixture() {
  sequence += 1
  const marker = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"[sequence]!
  const suffix = String(sequence).padStart(2, "0")
  const token = `SET${marker}`
  const [pcUser, upzisUser, wrongUpzisUser] = await Promise.all([
    prisma.user.create({ data: { memberId: `PID-AAAAAAAA${marker}PC2`, name: `${token} PC`, phone: `6288100${suffix}01`, passwordHash: "test", role: "pc" } }),
    prisma.user.create({ data: { memberId: `PID-AAAAAAAA${marker}UP2`, name: `${token} UPZIS`, phone: `6288100${suffix}02`, passwordHash: "test", role: "upzis" } }),
    prisma.user.create({ data: { memberId: `PID-AAAAAAAA${marker}WR2`, name: `${token} Wrong UPZIS`, phone: `6288100${suffix}03`, passwordHash: "test", role: "upzis" } }),
  ])
  const [kecamatan, otherKecamatan] = await Promise.all([
    prisma.gorutKecamatan.create({ data: { code: `${token}-KEC`, name: `${token} Kecamatan` } }),
    prisma.gorutKecamatan.create({ data: { code: `${token}-OTHER`, name: `${token} Other Kecamatan` } }),
  ])
  const [pcAssignment, upzisAssignment, wrongUpzisAssignment] = await Promise.all([
    prisma.gorutOperationalAssignment.create({ data: { userId: pcUser.id, role: GorutOperationalRole.PC } }),
    prisma.gorutOperationalAssignment.create({ data: { userId: upzisUser.id, role: GorutOperationalRole.UPZIS, kecamatanId: kecamatan.id } }),
    prisma.gorutOperationalAssignment.create({ data: { userId: wrongUpzisUser.id, role: GorutOperationalRole.UPZIS, kecamatanId: otherKecamatan.id } }),
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
    wrongUpzisUser,
    pcContext: operationalContext(pcUser.id, pcAssignment.id, GorutOperationalRole.PC, null),
    upzisContext: operationalContext(upzisUser.id, upzisAssignment.id, GorutOperationalRole.UPZIS, kecamatan.id),
    wrongUpzisContext: operationalContext(wrongUpzisUser.id, wrongUpzisAssignment.id, GorutOperationalRole.UPZIS, otherKecamatan.id),
  }
}

async function rejectsWithCode(run: () => Promise<unknown>, code: string) {
  await assert.rejects(run, (error: unknown) => error instanceof GorutPackageSettlementError && error.code === code)
}

function containsInternalDatabaseId(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  if (Array.isArray(value)) return value.some(containsInternalDatabaseId)
  const forbidden = new Set(["id", "packageId", "userId", "assignmentId", "evidenceId", "supersedesEvidenceId"])
  return Object.entries(value).some(([key, nested]) => forbidden.has(key) || containsInternalDatabaseId(nested))
}

test("Phase 2D.1 records pickup and bank facts without workflow transitions", async () => {
  const row = await fixture()
  const pickupAvailability = await getGorutPackageSettlementAvailability(prisma, row.pcContext, row.packageRow.packageCode, { runtime })
  assert.deepEqual(pickupAvailability?.availableActions, ["RECORD_PC_PICKUP"])
  const bankAvailability = await getGorutPackageSettlementAvailability(prisma, row.upzisContext, row.packageRow.packageCode, { runtime })
  assert.deepEqual(bankAvailability?.availableActions, ["RECORD_BANK_DEPOSIT"])

  const pickupInput = {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.PC_PICKUP,
    actualAmount: "27000.00",
    occurredAt: new Date("2026-08-21T02:00:00.000Z"),
    handedOverByMemberId: row.upzisUser.memberId,
    evidenceReference: "BA-UPZIS-PC-001",
    expectedVersion: 3,
    idempotencyKey: `${row.packageRow.packageCode}:pickup:1`,
  }
  const pickup = await recordGorutPackageSettlement(prisma, row.pcContext, pickupInput, { runtime })
  assert.equal(pickup.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
  assert.equal(pickup.revision, 2)
  assert.equal(pickup.version, 4)
  assert.equal(pickup.financial.grossAmount, "32500.00")
  assert.equal(pickup.financial.totalPlpkFee, "5000.00")
  assert.equal(pickup.financial.netAmount, "27500.00")
  assert.equal(pickup.settlement.expectedAmount, "27500.00")
  assert.equal(pickup.settlement.actualAmount, "27000.00")
  assert.equal(pickup.settlement.difference, "-500.00")
  assert.equal(pickup.settlement.comparison.status, "ADA_SELISIH")
  assert.equal(pickup.settlement.actors.handedOverBy?.memberId, row.upzisUser.memberId)
  assert.equal(pickup.settlement.actors.receivedBy?.memberId, row.pcUser.memberId)
  assert.deepEqual(pickup.validation, { status: "NOT_VALIDATED", result: null })

  const replay = await recordGorutPackageSettlement(prisma, row.pcContext, pickupInput, { runtime })
  assert.equal(replay.idempotentReplay, true)
  assert.equal(replay.settlement.evidenceCode, pickup.settlement.evidenceCode)
  assert.equal(await prisma.gorutPackageSettlementEvidence.count({ where: { packageId: row.packageRow.id } }), 1)

  await rejectsWithCode(() => recordGorutPackageSettlement(prisma, row.pcContext, {
    ...pickupInput,
    actualAmount: "26999.00",
  }, { runtime }), "SETTLEMENT_IDEMPOTENCY_CONFLICT")
  await rejectsWithCode(() => recordGorutPackageSettlement(prisma, row.pcContext, {
    ...pickupInput,
    idempotencyKey: `${row.packageRow.packageCode}:pickup:stale`,
  }, { runtime }), "SETTLEMENT_VERSION_CONFLICT")

  await rejectsWithCode(() => recordGorutPackageSettlement(prisma, row.pcContext, {
    ...pickupInput,
    handedOverByMemberId: row.wrongUpzisUser.memberId,
    expectedVersion: 4,
    idempotencyKey: `${row.packageRow.packageCode}:pickup:forged-actor`,
  }, { runtime }), "SETTLEMENT_ACCESS_DENIED")
  await rejectsWithCode(() => recordGorutPackageSettlement(prisma, row.wrongUpzisContext, {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: "27500.00",
    occurredAt: new Date("2026-08-21T03:00:00.000Z"),
    expectedVersion: 4,
    idempotencyKey: `${row.packageRow.packageCode}:bank:wrong-scope`,
  }, { runtime }), "SETTLEMENT_ACCESS_DENIED")

  const bank = await recordGorutPackageSettlement(prisma, row.upzisContext, {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: "28000.00",
    occurredAt: new Date("2026-08-21T04:00:00.000Z"),
    externalReference: "BNI-TRX-001",
    evidenceReference: "SLIP-BNI-001",
    expectedVersion: 4,
    idempotencyKey: `${row.packageRow.packageCode}:bank:1`,
  }, { runtime })
  assert.equal(bank.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
  assert.equal(bank.settlement.expectedAmount, "27500.00")
  assert.equal(bank.settlement.actualAmount, "28000.00")
  assert.equal(bank.settlement.difference, "500.00")
  assert.equal(bank.settlement.bank, "BNI")
  assert.equal(bank.settlement.externalReference, "BNI-TRX-001")
  assert.equal(bank.settlement.actors.depositedBy?.memberId, row.upzisUser.memberId)

  const corrected = await recordGorutPackageSettlement(prisma, row.upzisContext, {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: "27500.00",
    occurredAt: new Date("2026-08-21T04:00:00.000Z"),
    externalReference: "BNI-TRX-001-CORRECTED",
    supersedesEvidenceCode: bank.settlement.evidenceCode,
    expectedVersion: 5,
    idempotencyKey: `${row.packageRow.packageCode}:bank:correction`,
  }, { runtime })
  assert.equal(corrected.settlement.revision, 3)
  assert.equal(corrected.settlement.supersedesEvidenceCode, bank.settlement.evidenceCode)
  assert.equal(corrected.settlement.comparison.status, "NOMINAL_SESUAI")

  const persisted = await prisma.gorutPackageSettlementEvidence.findMany({
    where: { packageId: row.packageRow.id },
    orderBy: { revision: "asc" },
  })
  assert.equal(persisted.length, 3)
  assert.equal(persisted[1]?.actualAmount.toFixed(2), "28000.00")
  assert.equal(persisted[2]?.actualAmount.toFixed(2), "27500.00")
  assert.equal(persisted[2]?.supersedesEvidenceId, persisted[1]?.id)

  await assert.rejects(() => prisma.gorutPackageSettlementEvidence.create({
    data: {
      evidenceCode: `${row.packageRow.packageCode}-SET-NEGATIVE`,
      packageId: row.packageRow.id,
      mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
      revision: 4,
      expectedAmountSnapshot: "27500.00",
      actualAmount: "-1.00",
      occurredAt: new Date("2026-08-21T05:00:00.000Z"),
      recordedByUserId: row.upzisContext.userId,
      recordedByAssignmentId: row.upzisContext.assignmentId,
      depositedByUserId: row.upzisContext.userId,
      bankName: "BNI",
      idempotencyKey: `${row.packageRow.packageCode}:negative`,
      commandHash: "sha256:negative",
      packageVersionBefore: 6,
      packageVersionAfter: 7,
    },
  }))

  const packageAfter = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { id: row.packageRow.id } })
  assert.equal(packageAfter.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
  assert.equal(packageAfter.revision, 2)
  assert.equal(await prisma.gorutWorkflowEvent.count({ where: { packageId: row.packageRow.id } }), 0)

  const detail = await getGorutPackageDetail(prisma, row.pcContext, row.packageRow.packageCode)
  assert.ok(detail)
  assert.equal(detail?.settlement.history.length, 3)
  assert.equal(detail?.settlement.latest?.evidenceCode, corrected.settlement.evidenceCode)
  assert.equal(detail?.settlement.validation.status, "NOT_VALIDATED")
  assert.equal(containsInternalDatabaseId(detail), false)
})

test("parallel identical intent replays once while different intents respect package version", async () => {
  const row = await fixture()
  const command = {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: "27500.00",
    occurredAt: new Date("2026-08-21T06:00:00.000Z"),
    expectedVersion: 3,
    idempotencyKey: `${row.packageRow.packageCode}:parallel:same`,
  }
  const sameIntent = await Promise.all([
    recordGorutPackageSettlement(prisma, row.upzisContext, command, { runtime }),
    recordGorutPackageSettlement(prisma, row.upzisContext, command, { runtime }),
  ])
  assert.equal(new Set(sameIntent.map((result) => result.settlement.evidenceCode)).size, 1)
  assert.equal(await prisma.gorutPackageSettlementEvidence.count({ where: { packageId: row.packageRow.id } }), 1)

  const currentVersion = sameIntent[0]!.version
  const parallel = await Promise.allSettled([
    recordGorutPackageSettlement(prisma, row.upzisContext, {
      ...command,
      expectedVersion: currentVersion,
      idempotencyKey: `${row.packageRow.packageCode}:parallel:a`,
      actualAmount: "27400.00",
    }, { runtime }),
    recordGorutPackageSettlement(prisma, row.upzisContext, {
      ...command,
      expectedVersion: currentVersion,
      idempotencyKey: `${row.packageRow.packageCode}:parallel:b`,
      actualAmount: "27600.00",
    }, { runtime }),
  ])
  assert.equal(parallel.filter((result) => result.status === "fulfilled").length, 1)
  assert.equal(parallel.filter((result) => result.status === "rejected").length, 1)
  const rejected = parallel.find((result): result is PromiseRejectedResult => result.status === "rejected")
  assert.equal(rejected?.reason instanceof GorutPackageSettlementError, true)
  assert.equal(rejected?.reason.code, "SETTLEMENT_VERSION_CONFLICT")
  assert.equal(await prisma.gorutPackageSettlementEvidence.count({ where: { packageId: row.packageRow.id } }), 2)
  assert.equal(await prisma.gorutWorkflowEvent.count({ where: { packageId: row.packageRow.id } }), 0)
})

test("production provisional fee policy blocks new settlement evidence", async () => {
  const row = await fixture()
  await rejectsWithCode(() => recordGorutPackageSettlement(prisma, row.upzisContext, {
    packageCode: row.packageRow.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: "27500.00",
    occurredAt: new Date("2026-08-21T07:00:00.000Z"),
    expectedVersion: 3,
    idempotencyKey: `${row.packageRow.packageCode}:production`,
  }, { runtime: { deploymentEnvironment: "PRODUCTION", enabled: true } }), "SETTLEMENT_PROVISIONAL_POLICY_DISABLED")
  assert.equal(await prisma.gorutPackageSettlementEvidence.count({ where: { packageId: row.packageRow.id } }), 0)
})
