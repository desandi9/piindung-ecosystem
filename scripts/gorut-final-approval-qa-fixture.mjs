import { randomBytes } from "node:crypto"
import { createAuthoritativeCollection, recordAuthoritativeCollectionEntry, confirmAndSubmitCollectionByPlpk } from "../lib/gorut-collection-server.ts"
import { executeGorutCollectionApiAction } from "../lib/gorut-collection-action-server.ts"
import { executeGorutPackageTransition } from "../lib/gorut-package-workflow-server.ts"

const runtime = { deploymentEnvironment: "UAT", enabled: true }

// Every row belongs to a fresh QA scope. Cleanup never selects an existing UAT scope.
export async function createFinalApprovalQaFixture(prisma, marker, passwordHash) {
  if (!/^QA-PC-FINAL-[A-Z0-9-]+$/.test(marker)) throw new Error("Explicit QA marker required")
  const fixture = await prisma.$transaction(async tx => {
    const kecamatan = await tx.gorutKecamatan.create({ data: { code: marker, name: marker } })
    const ranting = await tx.gorutRanting.create({ data: { kecamatanId: kecamatan.id, code: `${marker}-R`, name: `${marker} Ranting` } })
    const plpk = await tx.gorutPlpk.create({ data: { rantingId: ranting.id, code: `${marker}-P`, name: `${marker} PLPK` } })
    const munfiq = await tx.gorutMunfiq.create({ data: { rantingId: ranting.id, plpkId: plpk.id, code: `${marker}-M`, name: `${marker} Synthetic`, nik: randomBytes(8).readBigUInt64BE().toString().padStart(20, "0").slice(-16) } })
    const actors = {}
    for (const [key, role, appRole, scope] of [
      ["plpk", "PLPK", "plpk", { plpkId: plpk.id }],
      ["kordes", "RANTING", "kordes", { rantingId: ranting.id }],
      ["maker", "UPZIS", "upzis", { kecamatanId: kecamatan.id }],
      ["checker", "UPZIS", "upzis", { kecamatanId: kecamatan.id }],
      ["pc", "PC", "pc", {}],
    ]) {
      const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
      const memberId = `PID-${Array.from(randomBytes(12), byte => alphabet[byte % alphabet.length]).join("")}`
      const user = await tx.user.create({ data: { memberId, name: `${marker} ${key}`, phone: `0899${randomBytes(6).readUIntBE(0, 6).toString().slice(-10)}`, passwordHash, role: appRole } })
      const assignment = await tx.gorutOperationalAssignment.create({ data: { userId: user.id, role, ...scope } })
      actors[key] = { user, context: { userId: user.id, assignmentId: assignment.id, operationalRole: role, kecamatanId: null, rantingId: null, plpkId: null, ...scope } }
    }
    return { kecamatan, ranting, plpk, munfiq, actors }
  }, { maxWait: 10000, timeout: 60000 })
  const { actors, munfiq } = fixture
  const created = await createAuthoritativeCollection(prisma, actors.plpk.context, { period: "2026-09", idempotencyKey: `${marker}:create` })
  const recorded = await recordAuthoritativeCollectionEntry(prisma, actors.plpk.context, {
    collectionCode: created.collection.collectionCode, munfiqCode: munfiq.code, visitStatus: "COLLECTED", amount: "66500.00", expectedVersion: created.collection.version, idempotencyKey: `${marker}:record`,
  }, { feeRuntime: runtime })
  const confirmed = await confirmAndSubmitCollectionByPlpk(prisma, actors.plpk.context, { collectionCode: created.collection.collectionCode, expectedVersion: recorded.collection.version, idempotencyKey: `${marker}:confirm` })
  const verified = await executeGorutCollectionApiAction(prisma, actors.kordes.context, created.collection.collectionCode, {
    action: "VERIFY_BY_KORDES", expectedVersion: confirmed.collection.version, moneyMatches: true, hasDamagedMoney: false, cashReceived: true, note: null, idempotencyKey: `${marker}:verify`,
  }, { runtime })
  if (!verified.reconciliation?.packageCode) throw new Error("QA source did not reconcile")
  const packageCode = verified.reconciliation.packageCode
  const draft = await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode } })
  const submitted = await executeGorutPackageTransition(prisma, actors.maker.context, { packageCode, action: "SUBMIT", expectedVersion: draft.version, idempotencyKey: `${marker}:submit` }, { runtime })
  await executeGorutPackageTransition(prisma, actors.checker.context, { packageCode, action: "APPROVE", expectedVersion: submitted.version, idempotencyKey: `${marker}:upzis-approve` }, { runtime })
  return { ...fixture, package: await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { packageCode } }) }
}

export async function cleanupFinalApprovalQaFixture(prisma, marker) {
  if (!/^QA-PC-FINAL-[A-Z0-9-]+$/.test(marker)) throw new Error("Explicit QA marker required")
  await prisma.$transaction(async tx => {
    const kecamatan = await tx.gorutKecamatan.findUnique({ where: { code: marker } })
    if (!kecamatan) return
    const packages = await tx.gorutUpzisPackage.findMany({ where: { kecamatanId: kecamatan.id }, select: { id: true } })
    const packageIds = packages.map(row => row.id)
    await tx.gorutPackageCorrection.deleteMany({ where: { packageId: { in: packageIds } } })
    await tx.gorutPackageSettlementValidation.deleteMany({ where: { packageId: { in: packageIds } } })
    const evidence = await tx.gorutPackageSettlementEvidence.findMany({ where: { packageId: { in: packageIds } }, orderBy: { revision: "desc" } })
    for (const row of evidence) await tx.gorutPackageSettlementEvidence.delete({ where: { id: row.id } })
    await tx.gorutWorkflowEvent.deleteMany({ where: { packageId: { in: packageIds } } })
    await tx.gorutUpzisPackageTransaction.deleteMany({ where: { packageId: { in: packageIds } } })
    await tx.gorutUpzisPackageRantingCoverage.deleteMany({ where: { packageId: { in: packageIds } } })
    await tx.gorutUpzisPackage.deleteMany({ where: { id: { in: packageIds } } })
    const batches = await tx.gorutCollectionBatch.findMany({ where: { kecamatanId: kecamatan.id }, select: { id: true } })
    const batchIds = batches.map(row => row.id)
    await tx.gorutCollectionCorrection.deleteMany({ where: { batchId: { in: batchIds } } })
    await tx.gorutCollectionRevision.deleteMany({ where: { batchId: { in: batchIds } } })
    await tx.gorutCollectionEntry.deleteMany({ where: { batchId: { in: batchIds } } })
    await tx.gorutCollectionBatch.deleteMany({ where: { id: { in: batchIds } } })
    await tx.gorutTransactionItem.deleteMany({ where: { transaction: { kecamatanId: kecamatan.id } } })
    await tx.gorutTransaction.deleteMany({ where: { kecamatanId: kecamatan.id } })
    await tx.gorutMunfiq.deleteMany({ where: { ranting: { kecamatanId: kecamatan.id } } })
    const users = await tx.user.findMany({ where: { name: { startsWith: `${marker} ` } }, select: { id: true } })
    const userIds = users.map(row => row.id)
    await tx.gorutOperationalAssignment.deleteMany({ where: { userId: { in: userIds } } })
    await tx.gorutPlpk.deleteMany({ where: { ranting: { kecamatanId: kecamatan.id } } })
    await tx.gorutRanting.deleteMany({ where: { kecamatanId: kecamatan.id } })
    await tx.gorutKecamatan.delete({ where: { id: kecamatan.id } })
    await tx.user.deleteMany({ where: { id: { in: userIds } } })
  }, { maxWait: 10000, timeout: 60000 })
}
