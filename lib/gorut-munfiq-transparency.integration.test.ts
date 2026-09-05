import assert from "node:assert/strict"
import { after, test } from "node:test"
import { PrismaClient } from "@prisma/client"
import { syncGorutMunfiqMilestoneNotifications } from "./gorut-munfiq-notifications-server"
import { getGorutMunfiqOwnCollection, listGorutMunfiqOwnCollections } from "./gorut-munfiq-transparency-server"
import { resolveGorutMunfiqContextForUser } from "./gorut-munfiq-identity-server"
import { generateMemberId } from "./member-identity"

const prisma = new PrismaClient()
const marker = `MTR${Date.now().toString(36).toUpperCase()}`

after(async () => { await prisma.$disconnect() })

function userData(suffix: string, role = "munfiq") {
  return { memberId: generateMemberId(), name: `${marker} ${suffix}`, phone: `628${Date.now().toString().slice(-9)}${suffix.charCodeAt(0)}`.slice(0, 15), passwordHash: "test", role }
}

async function createFixture() {
  const [actor, userA, userB] = await Promise.all([
    prisma.user.create({ data: userData("A", "super_admin_pc") }),
    prisma.user.create({ data: userData("B") }),
    prisma.user.create({ data: userData("C") }),
  ])
  const kecamatan = await prisma.gorutKecamatan.create({ data: { code: `${marker}-K`, name: `${marker} Kecamatan` } })
  const ranting = await prisma.gorutRanting.create({ data: { kecamatanId: kecamatan.id, code: `${marker}-R`, name: `${marker} Ranting` } })
  const [historicalPlpk, currentPlpk] = await Promise.all([
    prisma.gorutPlpk.create({ data: { rantingId: ranting.id, code: `${marker}-P-HIST`, name: "PLPK Historis Amanah" } }),
    prisma.gorutPlpk.create({ data: { rantingId: ranting.id, code: `${marker}-P-NOW`, name: "PLPK Saat Ini" } }),
  ])
  const [munfiqA, munfiqB] = await Promise.all([
    prisma.gorutMunfiq.create({ data: { rantingId: ranting.id, plpkId: historicalPlpk.id, code: `${marker}-MA`, nik: `${Date.now()}101`, name: `${marker} Munfiq A` } }),
    prisma.gorutMunfiq.create({ data: { rantingId: ranting.id, plpkId: historicalPlpk.id, code: `${marker}-MB`, nik: `${Date.now()}202`, name: `${marker} Munfiq B` } }),
  ])
  await Promise.all([
    prisma.gorutMunfiqAccountLink.create({ data: { linkCode: `${marker}-LA`, userId: userA.id, munfiqId: munfiqA.id, linkedByUserId: actor.id } }),
    prisma.gorutMunfiqAccountLink.create({ data: { linkCode: `${marker}-LB`, userId: userB.id, munfiqId: munfiqB.id, linkedByUserId: actor.id } }),
  ])

  const completedBatch = await prisma.gorutCollectionBatch.create({
    data: {
      collectionCode: `${marker}-COL-COMPLETE`, creationIdempotencyKey: `${marker}-CREATE-1`, periodStart: new Date("2026-07-01T00:00:00.000Z"),
      kecamatanId: kecamatan.id, rantingId: ranting.id, plpkId: historicalPlpk.id, status: "VERIFIED_BY_KORDES", recordOrigin: "NATIVE",
      amountAuthorityStatus: "AUTHORITATIVE", feeAuthorityStatus: "AUTHORITATIVE", financialStatus: "READY", grossAmount: "1012345.67", totalPlpkFee: "2500.00", netAmount: "1009845.67", calculatedAt: new Date("2026-07-13T03:00:00.000Z"), calculationPolicyVersion: "SECRET-COLLECTION-POLICY", financialSourceHash: `${marker}-FIN-HASH`,
      sourceHash: `${marker}-HASH-1`, confirmedByPlpkAt: new Date("2026-07-12T02:00:00.000Z"), confirmedByPlpkUserId: actor.id, submittedToKordesAt: new Date("2026-07-12T02:00:00.000Z"), submittedToKordesByUserId: actor.id, verifiedByKordesAt: new Date("2026-07-13T03:00:00.000Z"), kordesDecisionByUserId: actor.id, kordesMoneyMatches: true, kordesHasDamagedMoney: false, kordesCashReceived: true, lockedAt: new Date("2026-07-13T03:00:00.000Z"), createdByUserId: actor.id,
      entries: { create: [
        { munfiqId: munfiqA.id, visitStatus: "COLLECTED", amount: "12345.67", collectedAt: new Date("2026-07-11T01:00:00.000Z"), feeEligibleSnapshot: true, plpkFeeSnapshot: "2500.00", feePolicyVersion: "SECRET-FEE-POLICY", sourceType: "TEST", sourceKey: `${marker}-EA1`, sourceHash: `${marker}-EA1-HASH` },
        { munfiqId: munfiqB.id, visitStatus: "COLLECTED", amount: "999999.99", collectedAt: new Date("2026-07-11T01:05:00.000Z"), note: "PRIVATE OTHER MUNFIQ", feeEligibleSnapshot: true, plpkFeeSnapshot: "2500.00", feePolicyVersion: "SECRET-OTHER", sourceType: "TEST", sourceKey: `${marker}-EB1`, sourceHash: `${marker}-EB1-HASH` },
      ] },
    },
  })
  const transaction = await prisma.gorutTransaction.create({ data: { code: `${marker}-TRX`, transactionDate: new Date("2026-07-01T00:00:00.000Z"), totalAmount: "1012345.66", sourceChannel: "AUTHORITATIVE_COLLECTION", currentState: "DRAFT", kecamatanId: kecamatan.id, rantingId: ranting.id, plpkId: historicalPlpk.id, createdByUserId: actor.id } })
  const packageRow = await prisma.gorutUpzisPackage.create({ data: { packageCode: `${marker}-PKG`, kecamatanId: kecamatan.id, periodStart: new Date("2026-07-01T00:00:00.000Z"), currentState: "FINAL_APPROVED", recordOrigin: "COLLECTION_BRIDGE", grossAmount: "1012345.66", totalPlpkFee: "5000.00", netAmount: "1007345.66" } })
  await prisma.gorutCollectionBatch.update({ where: { id: completedBatch.id }, data: { transactionId: transaction.id, transactionSourceRevision: 1, transactionSourceHash: `${marker}-HASH-1`, transactionBridgedAt: new Date("2026-07-14T04:00:00.000Z") } })
  await prisma.gorutUpzisPackageTransaction.create({ data: { packageId: packageRow.id, transactionId: transaction.id, sourceType: "TEST", sourceKey: `${marker}-MEMBER`, sourceHash: `${marker}-MEMBER-HASH` } })
  await prisma.gorutWorkflowEvent.createMany({ data: [
    { packageId: packageRow.id, previousState: "DRAFT", resultingState: "WAITING_UPZIS_VERIFICATION", action: "SUBMIT", stage: "UPZIS", actorUserId: actor.id, createdAt: new Date("2026-07-15T05:00:00.000Z") },
    { packageId: packageRow.id, previousState: "WAITING_UPZIS_VERIFICATION", resultingState: "WAITING_PC_APPROVAL", action: "APPROVE", stage: "UPZIS", actorUserId: actor.id, createdAt: new Date("2026-07-16T06:00:00.000Z") },
    { packageId: packageRow.id, previousState: "WAITING_PC_APPROVAL", resultingState: "FINAL_APPROVED", action: "APPROVE", stage: "PC", actorUserId: actor.id, createdAt: new Date("2026-07-17T07:00:00.000Z") },
  ] })
  const [ownEntry, otherEntry] = await Promise.all([
    prisma.gorutCollectionEntry.findUniqueOrThrow({ where: { batchId_munfiqId: { batchId: completedBatch.id, munfiqId: munfiqA.id } } }),
    prisma.gorutCollectionEntry.findUniqueOrThrow({ where: { batchId_munfiqId: { batchId: completedBatch.id, munfiqId: munfiqB.id } } }),
  ])
  await prisma.gorutCollectionCorrection.createMany({ data: [
    { batchId: completedBatch.id, entryId: ownEntry.id, reason: "SECRET OWN CORRECTION REASON", requestedByUserId: actor.id, requestRevision: 2 },
    { batchId: completedBatch.id, entryId: otherEntry.id, reason: "SECRET CORRECTION FOR OTHER ACCOUNT", requestedByUserId: actor.id, requestRevision: 2 },
  ] })

  const incompleteBatch = await prisma.gorutCollectionBatch.create({
    data: {
      collectionCode: `${marker}-COL-INCOMPLETE`, creationIdempotencyKey: `${marker}-CREATE-2`, periodStart: new Date("2026-06-01T00:00:00.000Z"), kecamatanId: kecamatan.id, rantingId: ranting.id, plpkId: historicalPlpk.id,
      status: "VERIFIED_BY_KORDES", recordOrigin: "LEGACY_IMPORT", financialBlockingReasons: ["LEGACY_HISTORY_INCOMPLETE"], sourceHash: `${marker}-HASH-2`, confirmedByPlpkAt: new Date("2026-06-12T02:00:00.000Z"), confirmedByPlpkUserId: actor.id, submittedToKordesAt: new Date("2026-06-12T02:00:00.000Z"), submittedToKordesByUserId: actor.id, verifiedByKordesAt: new Date("2026-06-13T03:00:00.000Z"), kordesDecisionByUserId: actor.id, kordesMoneyMatches: true, kordesHasDamagedMoney: false, kordesCashReceived: true, lockedAt: new Date("2026-06-13T03:00:00.000Z"), createdByUserId: actor.id,
      entries: { create: { munfiqId: munfiqA.id, visitStatus: "COLLECTED", amount: "7654.33", collectedAt: new Date("2026-06-11T01:00:00.000Z"), sourceType: "TEST", sourceKey: `${marker}-EA2`, sourceHash: `${marker}-EA2-HASH` } },
    },
  })
  const incompleteTransaction = await prisma.gorutTransaction.create({ data: { code: `${marker}-TRX-OLD`, transactionDate: new Date("2026-06-01T00:00:00.000Z"), totalAmount: "7654.33", sourceChannel: "LEGACY", currentState: "FINAL_APPROVED", kecamatanId: kecamatan.id, rantingId: ranting.id, plpkId: historicalPlpk.id, createdByUserId: actor.id, finalApprovedAt: new Date("2026-06-20T00:00:00.000Z") } })
  const incompletePackage = await prisma.gorutUpzisPackage.create({ data: { packageCode: `${marker}-PKG-OLD`, kecamatanId: kecamatan.id, periodStart: new Date("2026-06-01T00:00:00.000Z"), currentState: "FINAL_APPROVED", recordOrigin: "LEGACY_EXCEL", isHistorical: true, workflowHistoryComplete: false } })
  await prisma.gorutCollectionBatch.update({ where: { id: incompleteBatch.id }, data: { transactionId: incompleteTransaction.id, transactionSourceRevision: 1, transactionSourceHash: `${marker}-HASH-2`, transactionBridgedAt: new Date("2026-06-14T00:00:00.000Z") } })
  await prisma.gorutUpzisPackageTransaction.create({ data: { packageId: incompletePackage.id, transactionId: incompleteTransaction.id, sourceType: "TEST", sourceKey: `${marker}-MEMBER-OLD`, sourceHash: `${marker}-MEMBER-OLD-HASH` } })
  const foreignBatch = await prisma.gorutCollectionBatch.create({
    data: {
      collectionCode: `${marker}-COL-FOREIGN`, creationIdempotencyKey: `${marker}-CREATE-FOREIGN`, periodStart: new Date("2026-05-01T00:00:00.000Z"), kecamatanId: kecamatan.id, rantingId: ranting.id, plpkId: historicalPlpk.id,
      status: "DRAFT", recordOrigin: "NATIVE", financialBlockingReasons: ["COLLECTION_INCOMPLETE"], sourceHash: `${marker}-HASH-FOREIGN`, createdByUserId: actor.id,
      entries: { create: { munfiqId: munfiqB.id, visitStatus: "PENDING", amount: "0.00", sourceType: "TEST", sourceKey: `${marker}-EB-FOREIGN`, sourceHash: `${marker}-EB-FOREIGN-HASH` } },
    },
  })
  await prisma.gorutMunfiq.update({ where: { id: munfiqA.id }, data: { plpkId: currentPlpk.id } })

  const [resolvedA, resolvedB] = await Promise.all([resolveGorutMunfiqContextForUser(prisma, userA.id), resolveGorutMunfiqContextForUser(prisma, userB.id)])
  if (resolvedA.kind !== "authorized" || resolvedB.kind !== "authorized") throw new Error("fixture context failed")
  return { actor, userA, userB, munfiqA, munfiqB, contextA: resolvedA.context, contextB: resolvedB.context, completedCode: completedBatch.collectionCode, incompleteCode: incompleteBatch.collectionCode, foreignCode: foreignBatch.collectionCode }
}

let sharedFixture: ReturnType<typeof createFixture> | null = null
function fixture() {
  sharedFixture ??= createFixture()
  return sharedFixture
}

function recursivelyHasKey(value: unknown, blocked: Set<string>): boolean {
  if (!value || typeof value !== "object") return false
  if (Array.isArray(value)) return value.some((item) => recursivelyHasKey(item, blocked))
  return Object.entries(value).some(([key, nested]) => blocked.has(key) || recursivelyHasKey(nested, blocked))
}

test("self read model isolates accounts, preserves personal amount and historical PLPK, and leaks no internal finance or correction data", async () => {
  const row = await fixture()
  const listA = await listGorutMunfiqOwnCollections(prisma, row.contextA)
  assert.equal(listA.collections.length, 2)
  assert.equal(listA.summary.totalAmount, "20000.00")
  const completed = await getGorutMunfiqOwnCollection(prisma, row.contextA, row.completedCode)
  assert.equal(completed?.collection.amount, "12345.67")
  assert.equal(completed?.collection.historicalPlpk.name, "PLPK Historis Amanah")
  assert.equal(completed?.collection.status, "Proses penghimpunan selesai")
  assert.equal((await getGorutMunfiqOwnCollection(prisma, row.contextB, row.completedCode))?.collection.amount, "999999.99")
  assert.equal(await getGorutMunfiqOwnCollection(prisma, row.contextA, row.foreignCode), null)
  const serialized = JSON.stringify({ listA, completed })
  assert.equal(serialized.includes("999999.99"), false)
  assert.equal(serialized.includes("PRIVATE OTHER MUNFIQ"), false)
  assert.equal(serialized.includes("SECRET CORRECTION"), false)
  assert.equal(serialized.includes("SECRET OWN CORRECTION"), false)
  assert.equal(serialized.includes("SECRET-FEE-POLICY"), false)
  assert.equal(serialized.includes("SECRET-COLLECTION-POLICY"), false)
  assert.equal(recursivelyHasKey({ listA, completed }, new Set(["grossAmount", "netAmount", "totalPlpkFee", "plpkFeeSnapshot", "feeEligibleSnapshot", "feePolicyVersion", "settlementEvidence", "corrections", "note"])), false)

  const incomplete = await getGorutMunfiqOwnCollection(prisma, row.contextA, row.incompleteCode)
  assert.deepEqual(incomplete?.collection.timeline.map((item) => item.label), ["Infak sudah tercatat", "Sedang diverifikasi", "Sudah diverifikasi"])
  assert.equal(incomplete?.collection.status, "Sudah diverifikasi")
})

test("milestone notification sync targets only linked Munfiq account and is idempotent", async () => {
  const row = await fixture()
  const concurrent = await Promise.all([
    syncGorutMunfiqMilestoneNotifications(prisma, row.munfiqA.id),
    syncGorutMunfiqMilestoneNotifications(prisma, row.munfiqA.id),
  ])
  const replay = await syncGorutMunfiqMilestoneNotifications(prisma, row.munfiqA.id)
  assert.equal(concurrent.reduce((total, result) => total + result.created, 0), 9)
  assert.equal(replay.created, 0)
  const [targetedA, targetedB, broad] = await Promise.all([
    prisma.portalNotification.findMany({ where: { targetUserId: row.userA.id }, select: { audience: true, targetUserId: true, title: true, body: true } }),
    prisma.portalNotification.count({ where: { targetUserId: row.userB.id } }),
    prisma.portalNotification.count({ where: { targetUserId: null, title: { contains: "Infak" } } }),
  ])
  assert.equal(targetedA.length, 9)
  assert.equal(targetedA.every((item) => item.audience === "user" && item.targetUserId === row.userA.id), true)
  assert.equal(targetedA.some((item) => /Rp|12345|7654|fee|bisyaroh|settlement/i.test(`${item.title} ${item.body}`)), false)
  assert.equal(targetedB, 0)
  assert.equal(broad, 0)
})
