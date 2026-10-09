import assert from "node:assert/strict"
import { after, test } from "node:test"
import { PrismaClient } from "@prisma/client"
import { generateMemberId } from "./member-identity"
import { GorutMunfiqIdentityError, linkUserToGorutMunfiq, relinkUserToGorutMunfiq, resolveGorutMunfiqContextForUser, revokeUserGorutMunfiqLink } from "./gorut-munfiq-identity-server"

const prisma = new PrismaClient()
const marker = `MFI${Date.now().toString(36).toUpperCase()}`
let sequence = 0

after(async () => { await prisma.$disconnect() })

async function createUser(role: string, status = "Aktif") {
  sequence += 1
  return prisma.user.create({ data: { memberId: generateMemberId(), name: `${marker} User ${sequence}`, phone: `62877${Date.now().toString().slice(-7)}${String(sequence).padStart(2, "0")}`, passwordHash: "test", role, status } })
}

async function fixture() {
  const [admin, adminPc, upzis, userA, userB] = await Promise.all([createUser("super_admin_pc"), createUser("admin_pc"), createUser("admin_upzis"), createUser("munfiq"), createUser("munfiq")])
  const kecamatan = await prisma.gorutKecamatan.create({ data: { code: `${marker}-K-${sequence}`, name: `${marker} Kecamatan ${sequence}` } })
  const rantingA = await prisma.gorutRanting.create({ data: { kecamatanId: kecamatan.id, code: `${marker}-RA-${sequence}`, name: `${marker} Ranting A ${sequence}` } })
  const rantingB = await prisma.gorutRanting.create({ data: { kecamatanId: kecamatan.id, code: `${marker}-RB-${sequence}`, name: `${marker} Ranting B ${sequence}` } })
  const plpkA = await prisma.gorutPlpk.create({ data: { code: `${marker}-PA-${sequence}`, name: `${marker} PLPK A`, rantingId: rantingA.id } })
  const plpkB = await prisma.gorutPlpk.create({ data: { code: `${marker}-PB-${sequence}`, name: `${marker} PLPK B`, rantingId: rantingB.id } })
  const nikBase = `${Date.now()}${String(sequence).padStart(3, "0")}`
  const [munfiqA, munfiqB, munfiqInactive] = await Promise.all([
    prisma.gorutMunfiq.create({ data: { code: `${marker}-MA-${sequence}`, nik: `${nikBase}1`, name: `${marker} Munfiq A`, rantingId: rantingA.id, plpkId: plpkA.id } }),
    prisma.gorutMunfiq.create({ data: { code: `${marker}-MB-${sequence}`, nik: `${nikBase}2`, name: `${marker} Munfiq B`, rantingId: rantingA.id, plpkId: plpkA.id } }),
    prisma.gorutMunfiq.create({ data: { code: `${marker}-MI-${sequence}`, nik: `${nikBase}3`, name: `${marker} Munfiq Inactive`, rantingId: rantingA.id, plpkId: plpkA.id, isActive: false } }),
  ])
  return { admin, adminPc, upzis, userA, userB, munfiqA, munfiqB, munfiqInactive, rantingB, plpkB }
}

async function rejectsCode(run: () => Promise<unknown>, code: string) {
  await assert.rejects(run, (error: unknown) => error instanceof GorutMunfiqIdentityError && error.code === code)
}

test("ordinary User and Munfiq provisioning creates zero synthetic links", async () => {
  const row = await fixture()
  assert.equal(await prisma.gorutMunfiqAccountLink.count({ where: { userId: { in: [row.userA.id, row.userB.id] } } }), 0)
  assert.equal(await prisma.gorutMunfiqAccountLink.count({ where: { munfiqId: { in: [row.munfiqA.id, row.munfiqB.id, row.munfiqInactive.id] } } }), 0)
})

test("authoritative self context, lifecycle, relink, revoke, and PLPK movement", async () => {
  const row = await fixture()
  const linked = await linkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: row.userA.memberId, munfiqCode: row.munfiqA.code, reason: "Verified manual reconciliation" })
  assert.equal(linked.status, "ACTIVE")
  assert.equal(linked.userMemberId, row.userA.memberId)
  assert.equal(linked.munfiqCode, row.munfiqA.code)
  assert.equal("id" in linked || "userId" in linked || "munfiqId" in linked, false)

  const contextA = await resolveGorutMunfiqContextForUser(prisma, row.userA.id)
  assert.equal(contextA.kind, "authorized")
  if (contextA.kind === "authorized") assert.equal(contextA.context.munfiqCode, row.munfiqA.code)
  const attemptedForeignCode = row.munfiqB.code
  assert.notEqual(attemptedForeignCode, contextA.kind === "authorized" ? contextA.context.munfiqCode : null)
  assert.equal((await resolveGorutMunfiqContextForUser(prisma, row.userB.id)).kind, "mapping-unavailable")

  await prisma.gorutMunfiq.update({ where: { id: row.munfiqA.id }, data: { rantingId: row.rantingB.id, plpkId: row.plpkB.id } })
  const afterMove = await resolveGorutMunfiqContextForUser(prisma, row.userA.id)
  assert.equal(afterMove.kind, "authorized")
  if (afterMove.kind === "authorized") assert.equal(afterMove.context.munfiqCode, row.munfiqA.code)

  const relinked = await relinkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: row.userA.memberId, munfiqCode: row.munfiqInactive.code, reason: "Corrected duplicate selection" })
  assert.equal(relinked.munfiqCode, row.munfiqInactive.code)
  const inactiveMunfiqContext = await resolveGorutMunfiqContextForUser(prisma, row.userA.id)
  assert.equal(inactiveMunfiqContext.kind, "authorized")
  if (inactiveMunfiqContext.kind === "authorized") assert.equal(inactiveMunfiqContext.context.munfiqActive, false)
  assert.equal(await prisma.gorutMunfiqAccountLink.count({ where: { userId: row.userA.id, status: "REVOKED" } }), 1)

  const revoked = await revokeUserGorutMunfiqLink(prisma, row.admin.id, { userMemberId: row.userA.memberId, munfiqCode: row.munfiqInactive.code, reason: "Access withdrawn" })
  assert.equal(revoked.status, "REVOKED")
  assert.equal(revoked.reason, "Corrected duplicate selection")
  assert.equal(revoked.revokedReason, "Access withdrawn")
  assert.equal((await resolveGorutMunfiqContextForUser(prisma, row.userA.id)).kind, "mapping-unavailable")
  assert.equal(await prisma.gorutMunfiqAccountLink.count({ where: { userId: row.userA.id } }), 2)
})

test("admin authority and target lifecycle fail closed", async () => {
  const row = await fixture()
  for (const actor of [row.adminPc, row.upzis]) {
    await rejectsCode(() => linkUserToGorutMunfiq(prisma, actor.id, { userMemberId: row.userA.memberId, munfiqCode: row.munfiqA.code, reason: null }), "IDENTITY_ADMIN_ACCESS_DENIED")
  }
  const wrongRole = await createUser("admin_pc")
  await rejectsCode(() => linkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: wrongRole.memberId, munfiqCode: row.munfiqA.code, reason: null }), "IDENTITY_USER_ROLE_INVALID")
  const inactive = await createUser("munfiq", "Nonaktif")
  await rejectsCode(() => linkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: inactive.memberId, munfiqCode: row.munfiqA.code, reason: null }), "IDENTITY_USER_INACTIVE")
  assert.equal((await resolveGorutMunfiqContextForUser(prisma, inactive.id)).kind, "inactive-user")
})

test("parallel competing link attempts leave exactly one active winner", async () => {
  const row = await fixture()
  const attempts = await Promise.allSettled([
    linkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: row.userA.memberId, munfiqCode: row.munfiqA.code, reason: "parallel A" }),
    linkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: row.userA.memberId, munfiqCode: row.munfiqB.code, reason: "parallel B" }),
  ])
  assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 1)
  assert.equal(attempts.filter((attempt) => attempt.status === "rejected").length, 1)
  assert.equal(await prisma.gorutMunfiqAccountLink.count({ where: { userId: row.userA.id, status: "ACTIVE" } }), 1)
})

test("parallel account claims for one Munfiq leave exactly one active winner", async () => {
  const row = await fixture()
  const attempts = await Promise.allSettled([
    linkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: row.userA.memberId, munfiqCode: row.munfiqA.code, reason: "parallel user A" }),
    linkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: row.userB.memberId, munfiqCode: row.munfiqA.code, reason: "parallel user B" }),
  ])
  assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 1)
  assert.equal(attempts.filter((attempt) => attempt.status === "rejected").length, 1)
  assert.equal(await prisma.gorutMunfiqAccountLink.count({ where: { munfiqId: row.munfiqA.id, status: "ACTIVE" } }), 1)
})

test("database partial uniqueness and lifecycle checks reject invalid direct writes", async () => {
  const row = await fixture()
  await linkUserToGorutMunfiq(prisma, row.admin.id, { userMemberId: row.userA.memberId, munfiqCode: row.munfiqA.code, reason: null })
  await assert.rejects(() => prisma.gorutMunfiqAccountLink.create({ data: { linkCode: `GML-${marker}-DUP-U-${sequence}`, userId: row.userA.id, munfiqId: row.munfiqB.id, linkedByUserId: row.admin.id } }))
  await assert.rejects(() => prisma.gorutMunfiqAccountLink.create({ data: { linkCode: `GML-${marker}-DUP-M-${sequence}`, userId: row.userB.id, munfiqId: row.munfiqA.id, linkedByUserId: row.admin.id } }))
  await assert.rejects(() => prisma.$executeRaw`
    INSERT INTO "GorutMunfiqAccountLink" ("id", "linkCode", "userId", "munfiqId", "status", "linkedAt", "linkedByUserId", "createdAt", "updatedAt")
    VALUES (${`invalid-${marker}-${sequence}`}, ${`GML-${marker}-INVALID-${sequence}`}, ${row.userB.id}, ${row.munfiqB.id}, 'REVOKED', NOW(), ${row.admin.id}, NOW(), NOW())
  `)
})
