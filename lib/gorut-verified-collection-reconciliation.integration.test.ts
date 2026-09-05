import assert from "node:assert/strict"
import { after, test } from "node:test"
import {
  GorutCollectionRevisionAction,
  GorutCollectionStatus,
  GorutCollectionVisitStatus,
  GorutOperationalRole,
  GorutPackageCorrectionTargetType,
  GorutPackageSettlementMode,
  GorutTransactionState,
  GorutWorkflowAction,
  PrismaClient,
  Prisma,
} from "@prisma/client"
import { executeGorutCollectionApiAction } from "./gorut-collection-action-server"
import {
  createAuthoritativeCollection,
  confirmAndSubmitCollectionByPlpk,
  findCollection,
  publicCollection,
  recordAuthoritativeCollectionEntry,
  revisionSnapshot,
  sourceHashFor,
} from "./gorut-collection-server"
import { getGorutCollectionDetail } from "./gorut-collection-query-server"
import { getGorutPackageWorkflowAvailability, executeGorutPackageTransition, reopenReturnedCollectionForCorrection } from "./gorut-package-workflow-server"
import { recordGorutPackageSettlement } from "./gorut-package-settlement-server"
import { validateGorutPackageSettlement } from "./gorut-package-validation-server"
import { getGorutPackageDetail, listGorutPackages } from "./gorut-package-server"
import { reconcileVerifiedCollection } from "./gorut-verified-collection-reconciliation"
import type { GorutOperationalContext } from "./gorut/server-pure"

process.env.GORUT_DEPLOYMENT_ENV = "UAT"
process.env.GORUT_ENABLE_PROVISIONAL_FEE_POLICY = "true"

const prisma = new PrismaClient()
const runtime = { deploymentEnvironment: "UAT" as const, enabled: true }
let fixtureSequence = 0

after(async () => {
  await prisma.$disconnect()
})

function context(
  userId: string,
  operationalRole: GorutOperationalContext["operationalRole"],
  scope: { kecamatanId?: string; rantingId?: string; plpkId?: string } = {},
  assignmentId = `assignment-${userId}`,
): GorutOperationalContext {
  return {
    userId,
    assignmentId,
    operationalRole,
    kecamatanId: scope.kecamatanId ?? null,
    rantingId: scope.rantingId ?? null,
    plpkId: scope.plpkId ?? null,
  }
}

async function createFixture(rantingPlpkCounts: number[]) {
  fixtureSequence += 1
  const token = `IT${fixtureSequence}`
  const sequenceCode = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"[fixtureSequence]!
  const memberPrefix = `${"A".repeat(10)}${sequenceCode}`
  const [plpkUser, kordesUser, upzisUser] = await Promise.all([
    prisma.user.create({ data: { memberId: `PID-${memberPrefix}P`, name: `${token} PLPK`, phone: `62081${fixtureSequence}01`, passwordHash: "test", role: "plpk" } }),
    prisma.user.create({ data: { memberId: `PID-${memberPrefix}K`, name: `${token} Kordes`, phone: `62081${fixtureSequence}02`, passwordHash: "test", role: "kordes" } }),
    prisma.user.create({ data: { memberId: `PID-${memberPrefix}U`, name: `${token} UPZIS`, phone: `62081${fixtureSequence}03`, passwordHash: "test", role: "upzis" } }),
  ])
  const kecamatan = await prisma.gorutKecamatan.create({ data: { code: `${token}-KEC`, name: `${token} Kecamatan` } })
  const rantings = []
  const plpks = []
  for (let rantingIndex = 0; rantingIndex < rantingPlpkCounts.length; rantingIndex += 1) {
    const ranting = await prisma.gorutRanting.create({
      data: { kecamatanId: kecamatan.id, code: `${token}-R${rantingIndex + 1}`, name: `${token} Ranting ${rantingIndex + 1}` },
    })
    rantings.push(ranting)
    for (let plpkIndex = 0; plpkIndex < rantingPlpkCounts[rantingIndex]!; plpkIndex += 1) {
      const plpk = await prisma.gorutPlpk.create({
        data: { rantingId: ranting.id, code: `${token}-R${rantingIndex + 1}-P${plpkIndex + 1}`, name: `${token} PLPK ${rantingIndex + 1}.${plpkIndex + 1}` },
      })
      const munfiq = await prisma.gorutMunfiq.create({
        data: {
          rantingId: ranting.id,
          plpkId: plpk.id,
          code: `${token}-M${rantingIndex + 1}${plpkIndex + 1}`,
          nik: `${fixtureSequence}`.padStart(4, "0") + `${rantingIndex + 1}${plpkIndex + 1}`.padEnd(12, "0"),
          name: `${token} Munfiq ${rantingIndex + 1}.${plpkIndex + 1}`,
        },
      })
      plpks.push({ ...plpk, munfiq, ranting })
    }
  }
  const assignment = await prisma.gorutOperationalAssignment.create({
    data: { userId: upzisUser.id, role: GorutOperationalRole.UPZIS, kecamatanId: kecamatan.id },
  })
  return { token, kecamatan, rantings, plpks, plpkUser, kordesUser, upzisUser, assignment }
}

async function prepareWaitingCollection(
  fixture: Awaited<ReturnType<typeof createFixture>>,
  plpkIndex: number,
  period: string,
  amount: string,
) {
  const row = fixture.plpks[plpkIndex]!
  const plpkContext = context(fixture.plpkUser.id, "PLPK", { plpkId: row.id })
  const created = await createAuthoritativeCollection(prisma, plpkContext, {
    period,
    idempotencyKey: `${fixture.token}:create:${row.code}:${period}`,
  })
  const recorded = await recordAuthoritativeCollectionEntry(prisma, plpkContext, {
    collectionCode: created.collection.collectionCode,
    munfiqCode: row.munfiq.code,
    visitStatus: GorutCollectionVisitStatus.COLLECTED,
    amount,
    expectedVersion: created.collection.version,
    idempotencyKey: `${fixture.token}:record:${row.code}:${period}`,
  }, { feeRuntime: runtime })
  const confirmed = await confirmAndSubmitCollectionByPlpk(prisma, plpkContext, {
    collectionCode: created.collection.collectionCode,
    expectedVersion: recorded.collection.version,
    idempotencyKey: `${fixture.token}:confirm:${row.code}:${period}`,
  })
  return {
    collectionCode: created.collection.collectionCode,
    expectedVersion: confirmed.collection.version,
    plpkContext,
    kordesContext: context(fixture.kordesUser.id, "RANTING", { rantingId: row.ranting.id }),
    command: {
      action: "VERIFY_BY_KORDES" as const,
      expectedVersion: confirmed.collection.version,
      moneyMatches: true,
      hasDamagedMoney: false,
      cashReceived: true,
      note: null,
      idempotencyKey: `${fixture.token}:verify:${row.code}:${period}`,
    },
  }
}

async function executeVerify(
  kordesContext: GorutOperationalContext,
  collectionCode: string,
  command: Awaited<ReturnType<typeof prepareWaitingCollection>>["command"],
  commandRuntime = runtime,
) {
  const result = await executeGorutCollectionApiAction(prisma, kordesContext, collectionCode, command, { runtime: commandRuntime })
  if (!("reconciliation" in result)) throw new Error("VERIFY response did not include technical reconciliation.")
  return result
}

async function requestCollectionCorrection(
  collectionCode: string,
  actorUserId: string,
  idempotencyKey: string,
) {
  const now = new Date()
  return prisma.$transaction(async (tx) => {
    const before = await findCollection(tx, collectionCode)
    const entry = before.entries[0]!
    const nextRevision = before.revision + 1
    const nextSourceHash = sourceHashFor(before, GorutCollectionStatus.NEEDS_CORRECTION)
    await tx.gorutCollectionBatch.update({
      where: { id: before.id, version: before.version },
      data: {
        status: GorutCollectionStatus.NEEDS_CORRECTION,
        verifiedByKordesAt: null,
        returnedForCorrectionAt: now,
        sourceHash: nextSourceHash,
        version: { increment: 1 },
        revision: nextRevision,
        updatedAt: now,
      },
    })
    await tx.gorutCollectionCorrection.create({
      data: {
        batchId: before.id,
        entryId: entry.id,
        reason: "Koreksi sumber terarah",
        requestedByUserId: actorUserId,
        requestedAt: now,
        requestRevision: nextRevision,
      },
    })
    const after = await findCollection(tx, collectionCode)
    await tx.gorutCollectionRevision.create({
      data: {
        batchId: before.id,
        revision: nextRevision,
        action: GorutCollectionRevisionAction.REQUEST_CORRECTION,
        idempotencyKey,
        commandHash: `test:${idempotencyKey}`,
        reason: "Koreksi sumber terarah",
        actorUserId,
        beforeSnapshot: revisionSnapshot(before),
        afterSnapshot: revisionSnapshot(after),
        createdAt: now,
      },
    })
    return publicCollection(after)
  })
}

async function correctAndReverify(
  fixture: Awaited<ReturnType<typeof createFixture>>,
  prepared: Awaited<ReturnType<typeof prepareWaitingCollection>>,
  amount: string,
  suffix: string,
) {
  const requested = await requestCollectionCorrection(
    prepared.collectionCode,
    fixture.kordesUser.id,
    `${fixture.token}:request-correction:${suffix}`,
  )
  const row = fixture.plpks.find((candidate) => candidate.id === prepared.plpkContext.plpkId)!
  const corrected = await recordAuthoritativeCollectionEntry(prisma, prepared.plpkContext, {
    collectionCode: prepared.collectionCode,
    munfiqCode: row.munfiq.code,
    visitStatus: GorutCollectionVisitStatus.COLLECTED,
    amount,
    reason: "Perbaikan nominal terverifikasi",
    expectedVersion: requested.version,
    idempotencyKey: `${fixture.token}:correct:${suffix}`,
  }, { feeRuntime: runtime })
  const confirmed = await confirmAndSubmitCollectionByPlpk(prisma, prepared.plpkContext, {
    collectionCode: prepared.collectionCode,
    expectedVersion: corrected.collection.version,
    idempotencyKey: `${fixture.token}:reconfirm:${suffix}`,
  })
  return executeVerify(prepared.kordesContext, prepared.collectionCode, {
    action: "VERIFY_BY_KORDES",
    expectedVersion: confirmed.collection.version,
    moneyMatches: true,
    hasDamagedMoney: false,
    cashReceived: true,
    note: null,
    idempotencyKey: `${fixture.token}:reverify:${suffix}`,
  })
}

function hasDatabaseIdKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  if (Array.isArray(value)) return value.some(hasDatabaseIdKey)
  return Object.entries(value).some(([key, nested]) =>
    key === "id" || (key.endsWith("Id") && key !== "memberId") || hasDatabaseIdKey(nested),
  )
}

async function createSecondUpzisActor(fixture: Awaited<ReturnType<typeof createFixture>>, suffix: string) {
  const sequenceCode = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"[fixtureSequence]!
  const user = await prisma.user.create({
    data: {
      memberId: `PID-${"B".repeat(9)}${sequenceCode}U2`,
      name: `${fixture.token} UPZIS Checker ${suffix}`,
      phone: `6299${fixtureSequence}${suffix.length}02`,
      passwordHash: "test",
      role: "upzis",
    },
  })
  const assignment = await prisma.gorutOperationalAssignment.create({
    data: { userId: user.id, role: GorutOperationalRole.UPZIS, kecamatanId: fixture.kecamatan.id },
  })
  return context(user.id, "UPZIS", { kecamatanId: fixture.kecamatan.id }, assignment.id)
}

async function createPcActor(fixture: Awaited<ReturnType<typeof createFixture>>, suffix: string) {
  const sequenceCode = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"[fixtureSequence]!
  const user = await prisma.user.create({
    data: {
      memberId: `PID-${"C".repeat(9)}${sequenceCode}PC`,
      name: `${fixture.token} PC ${suffix}`,
      phone: `6277${fixtureSequence}${suffix.length}03`,
      passwordHash: "test",
      role: "pc",
    },
  })
  const assignment = await prisma.gorutOperationalAssignment.create({
    data: { userId: user.id, role: GorutOperationalRole.PC },
  })
  return {
    user,
    context: context(user.id, "PC", {}, assignment.id),
  }
}

async function prepareWaitingPcPackage(period: string, amount: string, suffix: string) {
  const fixture = await createFixture([1])
  const prepared = await prepareWaitingCollection(fixture, 0, period, amount)
  const verified = await executeVerify(prepared.kordesContext, prepared.collectionCode, prepared.command)
  const packageCode = verified.reconciliation.packageCode!
  const actorA = context(fixture.upzisUser.id, "UPZIS", { kecamatanId: fixture.kecamatan.id }, fixture.assignment.id)
  const actorB = await createSecondUpzisActor(fixture, `${suffix}-checker`)
  const pc = await createPcActor(fixture, suffix)
  const draft = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode } })
  const submitted = await executeGorutPackageTransition(prisma, actorA, {
    packageCode,
    action: GorutWorkflowAction.SUBMIT,
    expectedVersion: draft.version,
    idempotencyKey: `${fixture.token}:${suffix}:submit`,
  }, { runtime })
  const approvedByUpzis = await executeGorutPackageTransition(prisma, actorB, {
    packageCode,
    action: GorutWorkflowAction.APPROVE,
    expectedVersion: submitted.version,
    idempotencyKey: `${fixture.token}:${suffix}:upzis-approve`,
  }, { runtime })
  assert.equal(approvedByUpzis.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
  return { fixture, prepared, packageCode, actorA, actorB, pc, waiting: approvedByUpzis }
}

test("parallel verified collections reconcile to one DRAFT package without double counting or workflow events", async () => {
  const fixture = await createFixture([2, 1])
  const prepared = [
    await prepareWaitingCollection(fixture, 0, "2026-08", "10000.00"),
    await prepareWaitingCollection(fixture, 1, "2026-08", "8000.00"),
    await prepareWaitingCollection(fixture, 2, "2026-08", "7000.00"),
  ]
  const results = await Promise.all(prepared.map((item) => executeVerify(
    item.kordesContext,
    item.collectionCode,
    item.command,
  )))

  assert.equal(results.every((result) => result.collection.status === GorutCollectionStatus.VERIFIED_BY_KORDES), true)
  assert.equal(results.every((result) => result.reconciliation.transactionCode?.startsWith("TRX-GORUT-COL-") === true), true)
  assert.equal(results.every((result) => result.reconciliation.packageCode === `GORUT-${fixture.kecamatan.code}-202608`), true)
  assert.equal(results.some((result) => result.reconciliation.packageStatus === "RETRYABLE"), false)
  assert.equal(results.some(hasDatabaseIdKey), false)

  const packages = await prisma.gorutUpzisPackage.findMany({
    where: { kecamatanId: fixture.kecamatan.id },
    include: { transactionMemberships: { include: { transaction: true } }, rantingCoverages: true, workflowEvents: true },
  })
  assert.equal(packages.length, 1)
  const packageRow = packages[0]!
  assert.equal(packageRow.currentState, GorutTransactionState.DRAFT)
  assert.equal(packageRow.recordOrigin, "COLLECTION_BRIDGE")
  assert.equal(packageRow.transactionMemberships.length, 3)
  assert.equal(new Set(packageRow.transactionMemberships.map((row) => row.transactionId)).size, 3)
  assert.equal(packageRow.transactionMemberships.every((row) => row.transaction.currentState === GorutTransactionState.DRAFT), true)
  assert.equal(packageRow.transactionMemberships.every((row) => row.transaction.sourceChannel === "AUTHORITATIVE_COLLECTION"), true)
  assert.equal(packageRow.rantingCoverages.filter((row) => row.status === "INCLUDED").length, 2)
  assert.equal(packageRow.grossAmount?.toFixed(2), "25000.00")
  assert.equal(packageRow.totalPlpkFee?.toFixed(2), "5000.00")
  assert.equal(packageRow.netAmount?.toFixed(2), "20000.00")
  assert.equal(packageRow.transactionMemberships.reduce((sum, row) => sum + Number(row.transaction.totalAmount), 0), 25000)
  assert.equal(packageRow.workflowEvents.length, 0)
  assert.equal(packageRow.lockedAt, null)
  assert.equal(packageRow.rosterFrozenAt, null)

  const revisionBeforeReplay = packageRow.revision
  const replayResults = await Promise.all(prepared.map((item) => executeVerify(
    item.kordesContext,
    item.collectionCode,
    item.command,
  )))
  assert.equal(replayResults.every((result) => result.reconciliation.idempotentReplay), true)
  const replayPackage = await prisma.gorutUpzisPackage.findUniqueOrThrow({
    where: { packageCode: packageRow.packageCode },
    include: { transactionMemberships: true, workflowEvents: true },
  })
  assert.equal(replayPackage.revision, revisionBeforeReplay)
  assert.equal(replayPackage.transactionMemberships.length, 3)
  assert.equal(replayPackage.workflowEvents.length, 0)

  const availability = await getGorutPackageWorkflowAvailability(
    prisma,
    context(fixture.upzisUser.id, "UPZIS", { kecamatanId: fixture.kecamatan.id }, fixture.assignment.id),
    packageRow.packageCode,
    { runtime },
  )
  assert.equal(availability?.availableActions.includes("SUBMIT"), true)
  const detail = await getGorutCollectionDetail(prisma, prepared[0]!.kordesContext, prepared[0]!.collectionCode, { runtime })
  assert.equal(detail?.bridgeReadiness.package?.financialStatus, "READY")
  assert.equal(detail?.bridgeReadiness.package?.reconciliationStatus, "READY")
  assert.equal(hasDatabaseIdKey(detail), false)
})

test("different periods materialize different deterministic packages", async () => {
  const fixture = await createFixture([1])
  const august = await prepareWaitingCollection(fixture, 0, "2026-08", "9000.00")
  const september = await prepareWaitingCollection(fixture, 0, "2026-09", "11000.00")
  const [augustResult, septemberResult] = await Promise.all([
    executeVerify(august.kordesContext, august.collectionCode, august.command),
    executeVerify(september.kordesContext, september.collectionCode, september.command),
  ])
  assert.notEqual(augustResult.reconciliation.packageCode, septemberResult.reconciliation.packageCode)
  assert.equal(await prisma.gorutUpzisPackage.count({ where: { kecamatanId: fixture.kecamatan.id } }), 2)
})

test("non-verified and production provisional-policy sources fail closed before bridge", async () => {
  const fixture = await createFixture([1])
  const prepared = await prepareWaitingCollection(fixture, 0, "2026-10", "10000.00")
  const nonVerified = await reconcileVerifiedCollection(prisma, prepared.collectionCode, { runtime })
  assert.equal(nonVerified.bridgeStatus, "BLOCKED")
  assert.equal(nonVerified.blockingReasons.includes("COLLECTION_NOT_VERIFIED_BY_KORDES"), true)
  assert.equal(await prisma.gorutTransaction.count({ where: { collectionSource: { is: { collectionCode: prepared.collectionCode } } } }), 0)

  const verified = await executeGorutCollectionApiAction(prisma, prepared.kordesContext, prepared.collectionCode, prepared.command, { runtime: { deploymentEnvironment: "PRODUCTION", enabled: true } }).catch((error) => error)
  assert.equal(verified instanceof Error, true)
  const factual = await (await import("./gorut-collection-server")).decideCollectionByKordes(prisma, prepared.kordesContext, {
    collectionCode: prepared.collectionCode,
    decision: "VERIFY",
    moneyMatches: true,
    hasDamagedMoney: false,
    cashReceived: true,
    note: null,
    expectedVersion: prepared.expectedVersion,
    idempotencyKey: `${fixture.token}:direct-verify-production-gate`,
  })
  assert.equal(factual.collection.status, GorutCollectionStatus.VERIFIED_BY_KORDES)
  const unavailable = await reconcileVerifiedCollection(prisma, prepared.collectionCode, {
    runtime: { deploymentEnvironment: "UAT", enabled: false },
  })
  assert.equal(unavailable.bridgeStatus, "BLOCKED")
  assert.equal(unavailable.financialStatus, "BLOCKED")
  assert.equal(unavailable.blockingReasons.includes("PROVISIONAL_FEE_POLICY_UNAVAILABLE"), true)
  const blocked = await reconcileVerifiedCollection(prisma, prepared.collectionCode, {
    runtime: { deploymentEnvironment: "PRODUCTION", enabled: true },
  })
  assert.equal(blocked.bridgeStatus, "BLOCKED")
  assert.equal(blocked.financialStatus, "BLOCKED")
  assert.equal(blocked.blockingReasons.includes("PRODUCTION_PROVISIONAL_FEE_POLICY_BLOCKED"), true)
  assert.equal(await prisma.gorutTransaction.count({ where: { collectionSource: { is: { collectionCode: prepared.collectionCode } } } }), 0)
})

test("retryable bridge failure leaves factual Kordes verification intact", async () => {
  const fixture = await createFixture([1])
  const prepared = await prepareWaitingCollection(fixture, 0, "2027-01", "10000.00")
  const { decideCollectionByKordes } = await import("./gorut-collection-server")
  await decideCollectionByKordes(prisma, prepared.kordesContext, {
    collectionCode: prepared.collectionCode,
    decision: "VERIFY",
    moneyMatches: true,
    hasDamagedMoney: false,
    cashReceived: true,
    note: null,
    expectedVersion: prepared.expectedVersion,
    idempotencyKey: `${fixture.token}:verify-before-retryable-failure`,
  })
  const result = await reconcileVerifiedCollection(prisma, prepared.collectionCode, {
    runtime,
    services: {
      bridge: async () => {
        throw new Prisma.PrismaClientKnownRequestError("test retryable bridge failure", {
          code: "P2034",
          clientVersion: "5.22.0",
        })
      },
    },
  })
  assert.equal(result.bridgeStatus, "RETRYABLE")
  assert.equal(result.packageStatus, "NOT_RUN")
  assert.equal(result.blockingReasons.includes("RECONCILIATION_TECHNICAL_RETRYABLE"), true)
  const collection = await prisma.gorutCollectionBatch.findUniqueOrThrow({ where: { collectionCode: prepared.collectionCode } })
  assert.equal(collection.status, GorutCollectionStatus.VERIFIED_BY_KORDES)
  assert.ok(collection.verifiedByKordesAt)
  assert.equal(collection.transactionId, null)
})

test("clean pre-submit correction rebridges the same transaction and revises the same package", async () => {
  const fixture = await createFixture([1])
  const prepared = await prepareWaitingCollection(fixture, 0, "2026-11", "10000.00")
  const initial = await executeVerify(prepared.kordesContext, prepared.collectionCode, prepared.command)
  const packageBefore = await prisma.gorutUpzisPackage.findUniqueOrThrow({
    where: { packageCode: initial.reconciliation.packageCode! },
    include: { transactionMemberships: true },
  })
  const transactionBefore = packageBefore.transactionMemberships[0]!.transactionId
  const sourceBefore = await prisma.gorutCollectionBatch.findUniqueOrThrow({ where: { collectionCode: prepared.collectionCode } })
  await prisma.gorutCollectionBatch.update({ where: { id: sourceBefore.id }, data: { sourceHash: "sha256:drift" } })
  const drift = await reconcileVerifiedCollection(prisma, prepared.collectionCode, { runtime })
  assert.equal(drift.bridgeStatus, "BLOCKED")
  assert.equal(drift.blockingReasons.includes("COLLECTION_SOURCE_DRIFT"), true)
  await prisma.gorutCollectionBatch.update({ where: { id: sourceBefore.id }, data: { sourceHash: sourceBefore.sourceHash } })

  const corrected = await correctAndReverify(fixture, prepared, "15000.00", "pre-submit")
  assert.equal(corrected.reconciliation.bridgeStatus, "RECONCILED")
  assert.equal(corrected.reconciliation.packageStatus, "UPDATED")
  assert.equal(corrected.reconciliation.packageCode, packageBefore.packageCode)
  const packageAfter = await prisma.gorutUpzisPackage.findUniqueOrThrow({
    where: { packageCode: packageBefore.packageCode },
    include: { transactionMemberships: { include: { transaction: true } }, workflowEvents: true },
  })
  assert.equal(packageAfter.transactionMemberships.length, 1)
  assert.equal(packageAfter.transactionMemberships[0]!.transactionId, transactionBefore)
  assert.equal(packageAfter.transactionMemberships[0]!.transaction.totalAmount.toFixed(2), "15000.00")
  assert.equal(packageAfter.grossAmount?.toFixed(2), "15000.00")
  assert.equal(packageAfter.totalPlpkFee?.toFixed(2), "2500.00")
  assert.equal(packageAfter.netAmount?.toFixed(2), "12500.00")
  assert.equal(packageAfter.revision > packageBefore.revision, true)
  assert.equal(packageAfter.workflowEvents.length, 0)
  assert.equal(packageAfter.currentState, GorutTransactionState.DRAFT)
})

test("a package that has crossed first SUBMIT does not auto-reconcile changed collection source", async () => {
  const fixture = await createFixture([1])
  const prepared = await prepareWaitingCollection(fixture, 0, "2026-12", "10000.00")
  const initial = await executeVerify(prepared.kordesContext, prepared.collectionCode, prepared.command)
  const packageBeforeSubmit = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode: initial.reconciliation.packageCode! } })
  const upzisContext = context(fixture.upzisUser.id, "UPZIS", { kecamatanId: fixture.kecamatan.id }, fixture.assignment.id)
  await executeGorutPackageTransition(prisma, upzisContext, {
    packageCode: packageBeforeSubmit.packageCode,
    action: GorutWorkflowAction.SUBMIT,
    expectedVersion: packageBeforeSubmit.version,
    idempotencyKey: `${fixture.token}:first-submit`,
  }, { runtime })
  const transactionBefore = await prisma.gorutTransaction.findFirstOrThrow({ where: { collectionSource: { is: { collectionCode: prepared.collectionCode } } } })
  const packageAfterSubmit = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode: packageBeforeSubmit.packageCode } })
  assert.equal(packageAfterSubmit.currentState, GorutTransactionState.WAITING_UPZIS_VERIFICATION)
  assert.ok(packageAfterSubmit.lockedAt)
  assert.ok(packageAfterSubmit.rosterFrozenAt)

  const corrected = await correctAndReverify(fixture, prepared, "16000.00", "after-submit")
  assert.equal(corrected.collection.status, GorutCollectionStatus.VERIFIED_BY_KORDES)
  assert.equal(corrected.reconciliation.bridgeStatus, "BLOCKED")
  assert.equal(corrected.reconciliation.packageStatus, "NOT_RUN")
  assert.equal(corrected.reconciliation.blockingReasons.includes("COLLECTION_SOURCE_CONFLICT"), true)
  const transactionAfter = await prisma.gorutTransaction.findUniqueOrThrow({ where: { id: transactionBefore.id } })
  const packageAfter = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode: packageBeforeSubmit.packageCode } })
  assert.equal(transactionAfter.totalAmount.toFixed(2), transactionBefore.totalAmount.toFixed(2))
  assert.equal(packageAfter.grossAmount?.toFixed(2), packageAfterSubmit.grossAmount?.toFixed(2))
  assert.equal(await prisma.gorutWorkflowEvent.count({ where: { packageId: packageAfter.id } }), 1)
})

test("Phase 2C.4 Case A reaches WAITING_PC_APPROVAL with strict maker-checker and canonical reads", async () => {
  const fixture = await createFixture([1])
  const prepared = await prepareWaitingCollection(fixture, 0, "2027-02", "12500.00")
  const verified = await executeVerify(prepared.kordesContext, prepared.collectionCode, prepared.command)
  const packageCode = verified.reconciliation.packageCode!
  const actorA = context(fixture.upzisUser.id, "UPZIS", { kecamatanId: fixture.kecamatan.id }, fixture.assignment.id)
  const actorB = await createSecondUpzisActor(fixture, "case-a")
  const draft = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode } })

  const submitted = await executeGorutPackageTransition(prisma, actorA, {
    packageCode,
    action: GorutWorkflowAction.SUBMIT,
    expectedVersion: draft.version,
    idempotencyKey: `${fixture.token}:case-a:submit`,
  }, { runtime })
  assert.equal(submitted.currentState, GorutTransactionState.WAITING_UPZIS_VERIFICATION)
  assert.equal(submitted.availableActions.includes(GorutWorkflowAction.APPROVE), false)
  assert.equal(submitted.blockingReasons.includes("MAKER_CHECKER_REQUIRED"), true)

  const [makerList, checkerList] = await Promise.all([
    listGorutPackages(prisma, actorA, { page: 1, pageSize: 10 }),
    listGorutPackages(prisma, actorB, { page: 1, pageSize: 10 }),
  ])
  assert.deepEqual(makerList?.items[0]?.workflow.availableActions, [GorutWorkflowAction.RETURN])
  assert.equal(makerList?.items[0]?.workflow.blockingReasons.includes("MAKER_CHECKER_REQUIRED"), true)
  assert.deepEqual(checkerList?.items[0]?.workflow.availableActions, [GorutWorkflowAction.APPROVE, GorutWorkflowAction.RETURN])

  const checkerAvailability = await getGorutPackageWorkflowAvailability(prisma, actorB, packageCode, { runtime })
  assert.equal(checkerAvailability?.availableActions.includes(GorutWorkflowAction.APPROVE), true)
  const approved = await executeGorutPackageTransition(prisma, actorB, {
    packageCode,
    action: GorutWorkflowAction.APPROVE,
    expectedVersion: submitted.version,
    idempotencyKey: `${fixture.token}:case-a:approve`,
  }, { runtime })
  assert.equal(approved.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
  assert.equal(approved.finalApproval.enabled, false)
  assert.deepEqual(approved.availableActions, [])
  assert.ok(approved.blockingReasons.includes("PC_FINALIZATION_OUT_OF_SCOPE"))
  const finalizationAttempt = await executeGorutPackageTransition(prisma, actorB, {
    packageCode,
    action: GorutWorkflowAction.APPROVE,
    expectedVersion: approved.version,
    idempotencyKey: `${fixture.token}:case-a:pc-finalization-must-stay-disabled`,
  }, { runtime }).catch((error) => error)
  assert.equal(finalizationAttempt?.code, "PACKAGE_ACTION_DISABLED")

  const canonical = await getGorutPackageDetail(prisma, actorB, packageCode)
  assert.ok(canonical)
  assert.equal(canonical!.identity.packageCode, packageCode)
  assert.equal(canonical!.financial.grossAmount, "12500.00")
  assert.equal(canonical!.financial.totalPlpkFee, "2500.00")
  assert.equal(canonical!.financial.netAmount, "10000.00")
  assert.equal(canonical!.financial.feePolicyAuthority, "PROVISIONAL_PENDING_SOP_CONFIRMATION")
  assert.equal(canonical!.financial.feePolicyVersion, "GORUT-PLPK-FEE-V1-PROVISIONAL")
  assert.equal(canonical!.workflow.currentState, GorutTransactionState.WAITING_PC_APPROVAL)
  assert.deepEqual(canonical!.workflow.history.map((event) => event.action), ["SUBMIT", "APPROVE"])
  assert.equal(canonical!.coverage.roster.frozenBy, fixture.upzisUser.name)
  assert.ok(canonical!.coverage.roster.frozenAt)
  assert.equal(hasDatabaseIdKey(canonical), false)
})

test("Phase 2C.4 Case B returns a collection target, reconciles correction, and resubmits the same package", async () => {
  const fixture = await createFixture([1])
  const prepared = await prepareWaitingCollection(fixture, 0, "2027-03", "10000.00")
  const verified = await executeVerify(prepared.kordesContext, prepared.collectionCode, prepared.command)
  const packageCode = verified.reconciliation.packageCode!
  const actorA = context(fixture.upzisUser.id, "UPZIS", { kecamatanId: fixture.kecamatan.id }, fixture.assignment.id)
  const actorB = await createSecondUpzisActor(fixture, "case-b")
  const draft = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode } })
  const firstSubmit = await executeGorutPackageTransition(prisma, actorA, {
    packageCode,
    action: GorutWorkflowAction.SUBMIT,
    expectedVersion: draft.version,
    idempotencyKey: `${fixture.token}:case-b:first-submit`,
  }, { runtime })
  const returned = await executeGorutPackageTransition(prisma, actorB, {
    packageCode,
    action: GorutWorkflowAction.RETURN,
    expectedVersion: firstSubmit.version,
    idempotencyKey: `${fixture.token}:case-b:return`,
    reasonCode: "AMOUNT_MISMATCH",
    reason: null,
    correctionTargets: [{ targetType: GorutPackageCorrectionTargetType.COLLECTION, targetCode: prepared.collectionCode }],
  }, { runtime })
  assert.equal(returned.currentState, GorutTransactionState.RETURNED_TO_RANTING)
  const correction = await prisma.gorutPackageCorrection.findFirstOrThrow({ where: { package: { packageCode }, status: "OPEN" } })
  const collectionBeforeReopen = await prisma.gorutCollectionBatch.findUniqueOrThrow({ where: { collectionCode: prepared.collectionCode } })
  const reopened = await reopenReturnedCollectionForCorrection(prisma, prepared.kordesContext, {
    packageCode,
    correctionCode: correction.correctionCode,
    collectionCode: prepared.collectionCode,
    munfiqCodes: [fixture.plpks[0]!.munfiq.code],
    reason: "Nominal target harus diperbaiki",
    expectedCollectionVersion: collectionBeforeReopen.version,
    idempotencyKey: `${fixture.token}:case-b:reopen`,
  }, { runtime })
  const corrected = await recordAuthoritativeCollectionEntry(prisma, prepared.plpkContext, {
    collectionCode: prepared.collectionCode,
    munfiqCode: fixture.plpks[0]!.munfiq.code,
    visitStatus: GorutCollectionVisitStatus.COLLECTED,
    amount: "15000.00",
    reason: "Nominal dikoreksi sesuai target UPZIS",
    expectedVersion: reopened.version,
    idempotencyKey: `${fixture.token}:case-b:correct`,
  }, { feeRuntime: runtime })
  const reconfirmed = await confirmAndSubmitCollectionByPlpk(prisma, prepared.plpkContext, {
    collectionCode: prepared.collectionCode,
    expectedVersion: corrected.collection.version,
    idempotencyKey: `${fixture.token}:case-b:reconfirm`,
  })
  const reverified = await executeVerify(prepared.kordesContext, prepared.collectionCode, {
    action: "VERIFY_BY_KORDES",
    expectedVersion: reconfirmed.collection.version,
    moneyMatches: true,
    hasDamagedMoney: false,
    cashReceived: true,
    note: null,
    idempotencyKey: `${fixture.token}:case-b:reverify`,
  })
  assert.equal(reverified.collection.status, GorutCollectionStatus.VERIFIED_BY_KORDES)
  assert.equal(reverified.reconciliation.packageCode, packageCode)
  assert.equal(reverified.reconciliation.bridgeStatus, "BLOCKED")

  const returnedCanonical = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode } })
  const resubmitAvailability = await getGorutPackageWorkflowAvailability(prisma, actorA, packageCode, { runtime })
  assert.equal(resubmitAvailability?.availableActions.includes(GorutWorkflowAction.SUBMIT), true)
  const resubmitted = await executeGorutPackageTransition(prisma, actorA, {
    packageCode,
    action: GorutWorkflowAction.SUBMIT,
    expectedVersion: returnedCanonical.version,
    idempotencyKey: `${fixture.token}:case-b:resubmit`,
    resolvedCorrectionCodes: [correction.correctionCode],
    resolutionNote: "Collection sudah dikoreksi dan diverifikasi ulang Kordes.",
  }, { runtime })
  const approved = await executeGorutPackageTransition(prisma, actorB, {
    packageCode,
    action: GorutWorkflowAction.APPROVE,
    expectedVersion: resubmitted.version,
    idempotencyKey: `${fixture.token}:case-b:approve`,
  }, { runtime })
  assert.equal(approved.currentState, GorutTransactionState.WAITING_PC_APPROVAL)

  const canonical = await getGorutPackageDetail(prisma, actorB, packageCode)
  assert.ok(canonical)
  assert.equal(canonical!.identity.packageCode, packageCode)
  assert.equal(canonical!.identity.revision > draft.revision, true)
  assert.equal(canonical!.financial.grossAmount, "15000.00")
  assert.equal(canonical!.financial.totalPlpkFee, "2500.00")
  assert.equal(canonical!.financial.netAmount, "12500.00")
  assert.equal(canonical!.financial.feePolicyAuthority, "PROVISIONAL_PENDING_SOP_CONFIRMATION")
  assert.equal(canonical!.transactions.count, 1)
  assert.equal(canonical!.transactions.items[0]!.recordedAmount, "15000.00")
  assert.deepEqual(canonical!.workflow.history.map((event) => event.action), ["SUBMIT", "RETURN", "SUBMIT", "APPROVE"])
  assert.equal(canonical!.corrections[0]?.status, "RESOLVED")
  assert.equal(canonical!.corrections[0]?.resolutionNote, "Collection sudah dikoreksi dan diverifikasi ulang Kordes.")
  assert.equal(hasDatabaseIdKey(canonical), false)
})

test("Phase 2D.3 PC_PICKUP reaches FINAL_APPROVED with one factual PC event and no bank claims", async () => {
  const row = await prepareWaitingPcPackage("2027-04", "12500.00", "pc-pickup")
  const packageBefore = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode: row.packageCode } })
  const netAmount = packageBefore.netAmount!.toFixed(2)
  const settlement = await recordGorutPackageSettlement(prisma, row.pc.context, {
    packageCode: row.packageCode,
    mode: GorutPackageSettlementMode.PC_PICKUP,
    actualAmount: netAmount,
    occurredAt: new Date("2027-04-25T03:00:00.000Z"),
    handedOverByMemberId: row.fixture.upzisUser.memberId,
    evidenceReference: "BA-PICKUP-FACTUAL-001",
    expectedVersion: packageBefore.version,
    idempotencyKey: `${row.fixture.token}:pc-pickup:settlement`,
  }, { runtime })
  const validation = await validateGorutPackageSettlement(prisma, row.pc.context, {
    packageCode: row.packageCode,
    settlementEvidenceCode: settlement.settlement.evidenceCode,
    expectedVersion: settlement.version,
    idempotencyKey: `${row.fixture.token}:pc-pickup:validation`,
  }, { runtime, now: new Date("2027-04-25T03:05:00.000Z") })
  assert.equal(validation.validation.result, "MATCHED")

  const availability = await getGorutPackageWorkflowAvailability(prisma, row.pc.context, row.packageCode, { runtime })
  assert.deepEqual(availability?.availableActions, [GorutWorkflowAction.APPROVE])
  assert.equal(availability?.finalApprovalReadiness.status, "READY")

  const forgedPcContext = { ...row.pc.context, assignmentId: "forged-pc-assignment" }
  const forgedAvailability = await getGorutPackageWorkflowAvailability(prisma, forgedPcContext, row.packageCode, { runtime })
  assert.deepEqual(forgedAvailability?.availableActions, [])
  assert.ok(forgedAvailability?.blockingReasons.includes("PC_ASSIGNMENT_REQUIRED"))
  const productionAvailability = await getGorutPackageWorkflowAvailability(prisma, row.pc.context, row.packageCode, {
    runtime: { deploymentEnvironment: "PRODUCTION", enabled: true },
  })
  assert.deepEqual(productionAvailability?.availableActions, [])
  assert.ok(productionAvailability?.blockingReasons.includes("PROVISIONAL_FEE_POLICY_DISABLED"))

  const command = {
    packageCode: row.packageCode,
    action: GorutWorkflowAction.APPROVE,
    expectedVersion: validation.version,
    idempotencyKey: `${row.fixture.token}:pc-pickup:final-approve`,
  }
  const beforeEvidence = await prisma.gorutPackageSettlementEvidence.findUniqueOrThrow({
    where: { evidenceCode: settlement.settlement.evidenceCode },
  })
  const beforeValidation = await prisma.gorutPackageSettlementValidation.findUniqueOrThrow({
    where: { validationCode: validation.validation.validationCode },
  })
  await assert.rejects(
    executeGorutPackageTransition(prisma, row.actorA, command, { runtime }),
    (error: unknown) => (error as { code?: string }).code === "PACKAGE_ACCESS_DENIED",
  )
  await assert.rejects(
    executeGorutPackageTransition(prisma, forgedPcContext, command, { runtime }),
    (error: unknown) => (error as { code?: string }).code === "PACKAGE_ACCESS_DENIED",
  )
  await assert.rejects(
    executeGorutPackageTransition(prisma, row.pc.context, command, {
      runtime: { deploymentEnvironment: "PRODUCTION", enabled: true },
    }),
    (error: unknown) => (error as { code?: string }).code === "PACKAGE_PROVISIONAL_POLICY_DISABLED",
  )
  const [first, replay] = await Promise.all([
    executeGorutPackageTransition(prisma, row.pc.context, command, { runtime, now: new Date("2027-04-25T03:10:00.000Z") }),
    executeGorutPackageTransition(prisma, row.pc.context, command, { runtime, now: new Date("2027-04-25T03:10:00.000Z") }),
  ])
  assert.equal(first.currentState, GorutTransactionState.FINAL_APPROVED)
  assert.equal(replay.currentState, GorutTransactionState.FINAL_APPROVED)
  assert.equal([first, replay].filter((item) => !item.idempotentReplay).length, 1)
  assert.deepEqual(first.availableActions, [])
  assert.equal(first.finalApproval.approved, true)
  assert.equal(first.finalApproval.sourceValidationCode, validation.validation.validationCode)
  assert.equal(first.finalApproval.settlementEvidenceCode, settlement.settlement.evidenceCode)
  assert.equal(first.finalApproval.assertions.bankSettled, false)
  assert.equal(first.finalApproval.assertions.finalClose, false)

  const finalEvents = await prisma.gorutWorkflowEvent.findMany({
    where: {
      package: { packageCode: row.packageCode },
      previousState: GorutTransactionState.WAITING_PC_APPROVAL,
      resultingState: GorutTransactionState.FINAL_APPROVED,
      action: GorutWorkflowAction.APPROVE,
    },
  })
  assert.equal(finalEvents.length, 1)
  assert.equal(finalEvents[0]?.stage, "PC")
  assert.equal(finalEvents[0]?.actorUserId, row.pc.user.id)
  assert.notEqual(finalEvents[0]?.createdAt.toISOString(), validation.validation.validatedAt)

  const afterEvidence = await prisma.gorutPackageSettlementEvidence.findUniqueOrThrow({ where: { id: beforeEvidence.id } })
  const afterValidation = await prisma.gorutPackageSettlementValidation.findUniqueOrThrow({ where: { id: beforeValidation.id } })
  assert.equal(afterEvidence.actualAmount.toFixed(2), beforeEvidence.actualAmount.toFixed(2))
  assert.equal(afterEvidence.revision, beforeEvidence.revision)
  assert.equal(afterValidation.result, beforeValidation.result)
  assert.equal(afterValidation.validatedAt.toISOString(), beforeValidation.validatedAt.toISOString())

  const detail = await getGorutPackageDetail(prisma, row.pc.context, row.packageCode)
  assert.equal(detail?.workflow.currentState, GorutTransactionState.FINAL_APPROVED)
  assert.deepEqual(detail?.workflow.availableActions, [])
  assert.equal(detail?.finalApproval.approved, true)
  assert.equal(detail?.finalApproval.approvedBy?.memberId, row.pc.user.memberId)
  assert.equal(detail?.finalApproval.approvedAt, finalEvents[0]?.createdAt.toISOString())
  assert.equal(detail?.finalApproval.sourceValidationCode, validation.validation.validationCode)
  assert.equal(detail?.finalApproval.assertions.bankDepositCompleted, false)
  assert.equal(detail?.documents.find((document) => document.code === "F.016")?.executable, false)
  assert.equal(hasDatabaseIdKey(detail), false)

  await assert.rejects(
    executeGorutPackageTransition(prisma, row.pc.context, { ...command, expectedVersion: first.version }, { runtime }),
    (error: unknown) => (error as { code?: string }).code === "PACKAGE_IDEMPOTENCY_CONFLICT",
  )
  await assert.rejects(
    executeGorutPackageTransition(prisma, row.pc.context, {
      ...command,
      idempotencyKey: `${row.fixture.token}:pc-pickup:stale-version`,
    }, { runtime }),
    (error: unknown) => (error as { code?: string }).code === "PACKAGE_VERSION_CONFLICT",
  )
})

test("Phase 2D.3 direct bank evidence remains factual through FINAL_APPROVED", async () => {
  const row = await prepareWaitingPcPackage("2027-05", "15000.00", "direct-bank")
  const packageBefore = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode: row.packageCode } })
  const settlement = await recordGorutPackageSettlement(prisma, row.actorA, {
    packageCode: row.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: packageBefore.netAmount!.toFixed(2),
    occurredAt: new Date("2027-05-25T03:00:00.000Z"),
    externalReference: "BNI-DIRECT-FACTUAL-001",
    evidenceReference: "SLIP-BNI-FACTUAL-001",
    expectedVersion: packageBefore.version,
    idempotencyKey: `${row.fixture.token}:direct-bank:settlement`,
  }, { runtime })
  const validation = await validateGorutPackageSettlement(prisma, row.pc.context, {
    packageCode: row.packageCode,
    settlementEvidenceCode: settlement.settlement.evidenceCode,
    expectedVersion: settlement.version,
    idempotencyKey: `${row.fixture.token}:direct-bank:validation`,
  }, { runtime })
  const approved = await executeGorutPackageTransition(prisma, row.pc.context, {
    packageCode: row.packageCode,
    action: GorutWorkflowAction.APPROVE,
    expectedVersion: validation.version,
    idempotencyKey: `${row.fixture.token}:direct-bank:approve`,
  }, { runtime })
  assert.equal(approved.currentState, GorutTransactionState.FINAL_APPROVED)
  assert.equal(approved.finalApproval.assertions.bankSettled, false)
  assert.equal(approved.finalApproval.assertions.fundsCleared, false)
  assert.equal(approved.finalApproval.assertions.proofCryptographicallyVerified, false)

  const detail = await getGorutPackageDetail(prisma, row.pc.context, row.packageCode)
  assert.equal(detail?.settlement.latest?.mode, GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT)
  assert.equal(detail?.settlement.latest?.externalReference, "BNI-DIRECT-FACTUAL-001")
  assert.equal(detail?.settlement.latest?.evidenceReference, "SLIP-BNI-FACTUAL-001")
  assert.equal(detail?.settlement.validation.result, "MATCHED")
  assert.equal(detail?.finalApproval.assertions.bankSettled, false)
})

test("Phase 2D.3 mismatch blocks approval until correction creates a current MATCHED validation", async () => {
  const row = await prepareWaitingPcPackage("2027-06", "15000.00", "mismatch")
  const packageBefore = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode: row.packageCode } })
  const expected = packageBefore.netAmount!.toFixed(2)
  const mismatchAmount = packageBefore.netAmount!.minus(500).toFixed(2)
  const mismatchEvidence = await recordGorutPackageSettlement(prisma, row.actorA, {
    packageCode: row.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: mismatchAmount,
    occurredAt: new Date("2027-06-25T03:00:00.000Z"),
    expectedVersion: packageBefore.version,
    idempotencyKey: `${row.fixture.token}:mismatch:settlement`,
  }, { runtime })
  const mismatchValidation = await validateGorutPackageSettlement(prisma, row.pc.context, {
    packageCode: row.packageCode,
    settlementEvidenceCode: mismatchEvidence.settlement.evidenceCode,
    expectedVersion: mismatchEvidence.version,
    idempotencyKey: `${row.fixture.token}:mismatch:validation`,
  }, { runtime })
  assert.equal(mismatchValidation.validation.result, "MISMATCH")
  const blocked = await getGorutPackageWorkflowAvailability(prisma, row.pc.context, row.packageCode, { runtime })
  assert.deepEqual(blocked?.availableActions, [])
  assert.ok(blocked?.blockingReasons.includes("SETTLEMENT_AMOUNT_MISMATCH"))
  await assert.rejects(
    executeGorutPackageTransition(prisma, row.pc.context, {
      packageCode: row.packageCode,
      action: GorutWorkflowAction.APPROVE,
      expectedVersion: mismatchValidation.version,
      idempotencyKey: `${row.fixture.token}:mismatch:blocked-approve`,
    }, { runtime }),
    (error: unknown) => (error as { code?: string }).code === "PACKAGE_GATE_BLOCKED",
  )

  const correctedEvidence = await recordGorutPackageSettlement(prisma, row.actorA, {
    packageCode: row.packageCode,
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: expected,
    occurredAt: new Date("2027-06-25T03:15:00.000Z"),
    supersedesEvidenceCode: mismatchEvidence.settlement.evidenceCode,
    expectedVersion: mismatchValidation.version,
    idempotencyKey: `${row.fixture.token}:mismatch:corrected-settlement`,
  }, { runtime })
  const stale = await getGorutPackageWorkflowAvailability(prisma, row.pc.context, row.packageCode, { runtime })
  assert.deepEqual(stale?.availableActions, [])
  assert.ok(stale?.blockingReasons.includes("SETTLEMENT_VALIDATION_STALE"))
  await assert.rejects(
    executeGorutPackageTransition(prisma, row.pc.context, {
      packageCode: row.packageCode,
      action: GorutWorkflowAction.APPROVE,
      expectedVersion: correctedEvidence.version,
      idempotencyKey: `${row.fixture.token}:mismatch:stale-approve`,
    }, { runtime }),
    (error: unknown) => (error as { metadata?: { blockingReasons?: string[] } }).metadata?.blockingReasons?.includes("SETTLEMENT_VALIDATION_STALE") === true,
  )

  const currentValidation = await validateGorutPackageSettlement(prisma, row.pc.context, {
    packageCode: row.packageCode,
    settlementEvidenceCode: correctedEvidence.settlement.evidenceCode,
    expectedVersion: correctedEvidence.version,
    idempotencyKey: `${row.fixture.token}:mismatch:revalidation`,
  }, { runtime })
  assert.equal(currentValidation.validation.result, "MATCHED")
  const approved = await executeGorutPackageTransition(prisma, row.pc.context, {
    packageCode: row.packageCode,
    action: GorutWorkflowAction.APPROVE,
    expectedVersion: currentValidation.version,
    idempotencyKey: `${row.fixture.token}:mismatch:final-approve`,
  }, { runtime })
  assert.equal(approved.currentState, GorutTransactionState.FINAL_APPROVED)

  const detail = await getGorutPackageDetail(prisma, row.pc.context, row.packageCode)
  assert.equal(detail?.settlement.validation.status, "CURRENT")
  assert.equal(detail?.settlement.validation.result, "MATCHED")
  assert.equal(detail?.settlement.validation.historical.length, 2)
  assert.deepEqual(detail?.settlement.validation.historical.map((item) => item.result), ["MISMATCH", "MATCHED"])
  assert.deepEqual(detail?.settlement.validation.historical.map((item) => item.status), ["STALE", "CURRENT"])
  assert.equal(detail?.finalApproval.sourceValidationCode, currentValidation.validation.validationCode)
})
