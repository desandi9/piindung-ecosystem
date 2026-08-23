import assert from "node:assert/strict"
import test from "node:test"
import { PrismaClient } from "@prisma/client"
import {
  gorutUatFixtureExpectedSummary,
  gorutUatFixtureMemberIds,
  seedGorutV2UatFixture,
  verifyGorutV2UatFixture,
} from "./seed-gorut-v2-uat.mjs"

const databaseUrl = process.env.GORUT_UAT_SEED_TEST_DATABASE_URL

test("isolated PostgreSQL seed rolls back on failure and is idempotent", { skip: !databaseUrl }, async () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl })
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
      passwordHash: "synthetic-isolated-test-hash",
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

    const first = await seedGorutV2UatFixture({ prisma, passwordHash: "synthetic-isolated-test-hash" })
    assert.deepEqual(await verifyGorutV2UatFixture({ prisma, kecamatanId: first.kecamatanId }), gorutUatFixtureExpectedSummary)

    const second = await seedGorutV2UatFixture({ prisma, passwordHash: "synthetic-isolated-test-hash" })
    assert.deepEqual(await verifyGorutV2UatFixture({ prisma, kecamatanId: second.kecamatanId }), gorutUatFixtureExpectedSummary)
    assert.equal(first.kecamatanId, second.kecamatanId)

    const actorCount = await prisma.user.count({ where: { memberId: { in: gorutUatFixtureMemberIds } } })
    const assignmentCount = await prisma.gorutOperationalAssignment.count({
      where: { user: { memberId: { in: gorutUatFixtureMemberIds } } },
    })
    assert.equal(actorCount, 9)
    assert.equal(assignmentCount, 9)
  } finally {
    await prisma.$disconnect()
  }
})
