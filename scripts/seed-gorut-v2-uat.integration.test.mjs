import assert from "node:assert/strict"
import test from "node:test"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import {
  gorutUatFixtureExpectedSummary,
  gorutUatFixtureMemberIds,
  gorutUatLoginPhones,
  gorutUatUpzisLoginPhones,
  normalizeGorutUatFixturePhone,
  seedGorutV2UatFixture,
  verifyGorutV2UatAuthFixture,
  verifyGorutV2UatFixture,
} from "./seed-gorut-v2-uat.mjs"

const databaseUrl = process.env.GORUT_UAT_SEED_TEST_DATABASE_URL

test("isolated PostgreSQL seed rolls back on failure and is idempotent", { skip: !databaseUrl }, async () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl })
  const fixturePassword = "isolated-auth-fixture-password"
  const passwordHash = await bcrypt.hash(fixturePassword, 10)
  let failNextMunfiq = true
  prisma.$use(async (params, next) => {
    if (failNextMunfiq && params.model === "GorutMunfiq" && params.action === "upsert") {
      failNextMunfiq = false
      throw new Error("synthetic fixture transaction failure")
    }
    return next(params)
  })

  try {
    await assert.rejects(seedGorutV2UatFixture({
      prisma,
      passwordHash,
    }), /synthetic fixture transaction failure/)

    const rollbackCounts = await Promise.all([
      prisma.gorutKecamatan.count({ where: { code: "UAT-KEC-01" } }),
      prisma.gorutRanting.count({ where: { code: { in: ["UAT-R01", "UAT-R02", "UAT-R03"] } } }),
      prisma.gorutPlpk.count({ where: { code: { in: ["UAT-P01", "UAT-P02", "UAT-P03", "UAT-P04"] } } }),
      prisma.gorutMunfiq.count({ where: { code: { startsWith: "UAT-M" } } }),
      prisma.user.count({ where: { memberId: { in: gorutUatFixtureMemberIds } } }),
      prisma.gorutOperationalAssignment.count({ where: { user: { memberId: { in: gorutUatFixtureMemberIds } } } }),
    ])
    assert.deepEqual(rollbackCounts, [0, 0, 0, 0, 0, 0])

    const first = await seedGorutV2UatFixture({ prisma, passwordHash })
    const pcUser = await prisma.user.findUniqueOrThrow({ where: { memberId: "PID-DDDDDDDDA234" } })
    const pcAssignments = await prisma.gorutOperationalAssignment.findMany({
      where: { userId: pcUser.id, isActive: true },
      select: { role: true, kecamatanId: true, rantingId: true, plpkId: true },
    })
    assert.deepEqual(pcAssignments, [{ role: "PC", kecamatanId: null, rantingId: null, plpkId: null }],
      "PC login requires exactly one canonical operational assignment, independent of its AppRole")
    assert.deepEqual(await verifyGorutV2UatFixture({ prisma, kecamatanId: first.kecamatanId }), gorutUatFixtureExpectedSummary)
    const expectedAuthSummary = {
      loginAccountCount: 11,
      plpkLoginAccountCount: 4,
      kordesLoginAccountCount: 3,
      upzisLoginAccountCount: 2,
      pcLoginAccountCount: 1,
      munfiqLoginAccountCount: 1,
      passwordMatch: true,
      wrongPasswordRejected: true,
      activeRoleScopeReady: true,
      explicitMunfiqAccountLinkReady: true,
    }
    assert.deepEqual(await verifyGorutV2UatAuthFixture({ prisma, password: fixturePassword }), expectedAuthSummary)

    const second = await seedGorutV2UatFixture({ prisma, passwordHash })
    assert.deepEqual(await verifyGorutV2UatFixture({ prisma, kecamatanId: second.kecamatanId }), gorutUatFixtureExpectedSummary)
    assert.deepEqual(await verifyGorutV2UatAuthFixture({ prisma, password: fixturePassword }), expectedAuthSummary)
    assert.equal(first.kecamatanId, second.kecamatanId)

    for (const loginPhone of gorutUatUpzisLoginPhones) {
      const authPhone = normalizeGorutUatFixturePhone(loginPhone)
      const users = await prisma.$queryRaw`SELECT id, phone, "passwordHash", role, status FROM "User" WHERE phone = ${authPhone} LIMIT 1`
      assert.equal(users.length, 1)
      assert.equal(users[0].phone, authPhone)
      assert.equal(users[0].status, "Aktif")
      assert.equal(users[0].role, "admin_upzis")
      assert.equal(await bcrypt.compare(fixturePassword, users[0].passwordHash), true)
      assert.equal(await bcrypt.compare("definitely-wrong-password", users[0].passwordHash), false)
    }

    for (const loginPhone of gorutUatLoginPhones) {
      const authPhone = normalizeGorutUatFixturePhone(loginPhone)
      assert.equal(await prisma.user.count({ where: { phone: authPhone, status: "Aktif" } }), 1)
    }

    assert.equal(await prisma.gorutMunfiqAccountLink.count({
      where: {
        status: "ACTIVE",
        user: { memberId: "PID-EEEEEEEEA234", role: "munfiq" },
        munfiq: { code: "UAT-M001" },
        linkedBy: { memberId: "PID-DDDDDDDDA234", role: "super_admin_pc" },
      },
    }), 1)

    const actorCount = await prisma.user.count({ where: { memberId: { in: gorutUatFixtureMemberIds } } })
    const assignmentCount = await prisma.gorutOperationalAssignment.count({
      where: { user: { memberId: { in: gorutUatFixtureMemberIds } } },
    })
    assert.equal(actorCount, 11)
    assert.equal(assignmentCount, 10)

    // Login/AppRole alone must never make an incomplete PC fixture pass verification.
    const pcAssignment = await prisma.gorutOperationalAssignment.findFirstOrThrow({ where: { userId: pcUser.id, role: "PC" } })
    for (const boundary of ["missing", "inactive", "role mismatch", "duplicate active scope"]) {
      const rollback = new Error("rollback PC boundary probe")
      await assert.rejects(prisma.$transaction(async (tx) => {
        if (boundary === "missing") {
          await tx.gorutOperationalAssignment.delete({ where: { id: pcAssignment.id } })
        } else if (boundary === "inactive") {
          await tx.gorutOperationalAssignment.update({ where: { id: pcAssignment.id }, data: { isActive: false } })
        } else if (boundary === "role mismatch") {
          await tx.gorutOperationalAssignment.update({ where: { id: pcAssignment.id }, data: { role: "UPZIS", kecamatanId: first.kecamatanId } })
        } else {
          await tx.gorutOperationalAssignment.create({ data: { userId: pcUser.id, role: "UPZIS", kecamatanId: first.kecamatanId } })
        }
        await assert.rejects(verifyGorutV2UatAuthFixture({ prisma: tx, password: fixturePassword }),
          /requires exactly one active unscoped PC assignment/, boundary)
        throw rollback
      }, { timeout: 60_000 }), (error) => error === rollback)
    }

    await prisma.gorutOperationalAssignment.update({ where: { id: pcAssignment.id }, data: { isActive: false } })
    await seedGorutV2UatFixture({ prisma, passwordHash })
    const reactivated = await prisma.gorutOperationalAssignment.findMany({ where: { userId: pcUser.id } })
    assert.equal(reactivated.length, 1)
    assert.equal(reactivated[0].id, pcAssignment.id)
    assert.equal(reactivated[0].isActive, true)
    assert.deepEqual(await verifyGorutV2UatAuthFixture({ prisma, password: fixturePassword }), expectedAuthSummary)
  } finally {
    await prisma.$disconnect()
  }
})
