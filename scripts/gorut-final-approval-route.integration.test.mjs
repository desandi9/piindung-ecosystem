import assert from "node:assert/strict"
import { after, before, describe, test } from "node:test"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve, join } from "node:path"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { createFinalApprovalQaFixture, cleanupFinalApprovalQaFixture } from "./gorut-final-approval-qa-fixture.mjs"

const databaseUrl = process.env.GORUT_FINAL_HTTP_TEST_DATABASE_URL

describe("PC final approval HTTP with real auth and PostgreSQL", { skip: !databaseUrl, concurrency: false }, () => {
  const database = new URL(databaseUrl)
  assert.ok(["127.0.0.1", "localhost"].includes(database.hostname))
  assert.ok(database.pathname.startsWith("/gorut_final_"), "Dedicated disposable database required")
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl })
  const port = process.env.GORUT_FINAL_HTTP_TEST_PORT ?? "3069"
  const base = `http://localhost:${port}`
  const password = "Local-only-final-approval-QA"
  const markers = []
  const logDir = mkdtempSync(join(tmpdir(), "gorut-final-http-"))
  let server
  let serverOutput = ""
  let passwordHash

  async function stopServer() {
    if (server && server.exitCode === null) {
      const exited = once(server, "exit")
      server.kill("SIGTERM")
      await exited
    }
    writeFileSync(join(logDir, "server.log"), serverOutput)
  }

  async function startServer(extraEnv = {}) {
    server = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", port], {
      env: { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET: "local-final-http-test-secret", GORUT_DEPLOYMENT_ENV: "UAT", GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "true", VERCEL_ENV: "preview", ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
    })
    for (const stream of [server.stdout, server.stderr]) stream.on("data", chunk => { serverOutput += chunk.toString() })
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      assert.equal(server.exitCode, null, `Next server exited; see ${logDir}/server.log`)
      try { if ((await fetch(`${base}/api/auth/me`)).status === 401) return } catch { /* wait for socket */ }
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.fail(`Next server not ready; see ${logDir}/server.log`)
  }

  async function login(user) {
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ phoneNumber: user.phone, password, remember: false }),
    })
    assert.equal(response.status, 200, await response.text())
    return response.headers.get("set-cookie").split(";")[0]
  }

  async function post(row, body, cookie = row.cookie, headers = {}, endpoint = "transition") {
    const response = await fetch(`${base}/api/gorut/packages/${row.package.packageCode}/${endpoint}`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
    return { status: response.status, body: await response.json(), cache: response.headers.get("cache-control") }
  }

  async function fixture() {
    const marker = `QA-PC-FINAL-HTTP-${Date.now()}-${markers.length}`
    markers.push(marker)
    const row = await createFinalApprovalQaFixture(prisma, marker, passwordHash)
    row.cookie = await login(row.actors.pc.user)
    return row
  }

  async function ready() {
    const row = await fixture()
    const settlement = await post(row, { mode: "PC_PICKUP", actualAmount: row.package.netAmount.toFixed(2), occurredAt: "2026-09-13T10:00:00.000Z", handedOverByMemberId: row.actors.maker.user.memberId, evidenceReference: "QA-ONLY", expectedVersion: row.package.version, idempotencyKey: "qa:settlement" }, row.cookie, {}, "settlements")
    assert.equal(settlement.status, 200, JSON.stringify(settlement.body))
    row.settlement = settlement.body.settlement
    const validation = await post(row, { settlementEvidenceCode: row.settlement.evidenceCode, expectedVersion: settlement.body.version, idempotencyKey: "qa:validation" }, row.cookie, {}, "validations")
    assert.equal(validation.status, 200, JSON.stringify(validation.body))
    assert.equal(validation.body.validation.result, "MATCHED")
    row.command = { action: "APPROVE", expectedVersion: validation.body.version, idempotencyKey: "qa-approve" }
    return row
  }

  async function snapshot(row) {
    const where = { packageId: row.package.id }
    return {
      package: await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { id: row.package.id } }),
      evidence: await prisma.gorutPackageSettlementEvidence.findMany({ where, orderBy: { revision: "asc" } }),
      validation: await prisma.gorutPackageSettlementValidation.findMany({ where, orderBy: { id: "asc" } }),
      events: await prisma.gorutWorkflowEvent.findMany({ where, orderBy: { id: "asc" } }),
    }
  }

  before(async () => {
    process.env.DATABASE_URL = databaseUrl
    process.env.GORUT_DEPLOYMENT_ENV = "UAT"
    process.env.GORUT_ENABLE_PROVISIONAL_FEE_POLICY = "true"
    passwordHash = await bcrypt.hash(password, 10)
    await startServer()
  })
  after(async () => {
    await stopServer()
    try { for (const marker of markers) await cleanupFinalApprovalQaFixture(prisma, marker) }
    finally { await prisma.$disconnect() }
  })

  test("concurrent APPROVE and replay produce exactly one PC event, version +1, unchanged evidence", async () => {
    const row = await ready()
    const before = await snapshot(row)
    const detail = await fetch(`${base}/api/gorut/packages/${row.package.packageCode}`, { headers: { Cookie: row.cookie } })
    assert.equal(detail.status, 200)
    const canonicalBefore = await detail.json()
    assert.deepEqual(canonicalBefore.workflow.availableActions, ["APPROVE"])
    assert.equal(canonicalBefore.finalApproval.readiness.status, "READY")
    const results = await Promise.all([post(row, row.command), post(row, row.command)])
    for (const result of results) {
      assert.equal(result.status, 200, JSON.stringify(result.body))
      assert.equal(result.body.currentState, "FINAL_APPROVED")
      assert.equal(result.body.version, row.command.expectedVersion + 1)
      assert.equal(result.cache, "private, no-store")
    }
    assert.equal(results.filter(result => result.body.idempotentReplay).length, 1)
    const replay = await post(row, row.command)
    assert.equal(replay.status, 200)
    assert.equal(replay.body.idempotentReplay, true)
    assert.equal((await post(row, { ...row.command, expectedVersion: row.command.expectedVersion + 1 })).body.code, "PACKAGE_IDEMPOTENCY_CONFLICT")
    assert.equal((await post(row, { ...row.command, idempotencyKey: "stale" })).body.code, "PACKAGE_VERSION_CONFLICT")
    assert.equal((await post(row, { ...row.command, expectedVersion: row.command.expectedVersion + 1, idempotencyKey: "second-final" })).body.code, "PACKAGE_ACTION_DISABLED")
    const after = await snapshot(row)
    assert.deepEqual(after.evidence, before.evidence)
    assert.deepEqual(after.validation, before.validation)
    assert.deepEqual(after.package, { ...before.package, currentState: "FINAL_APPROVED", version: before.package.version + 1, updatedAt: after.package.updatedAt })
    assert.equal(after.events.length, before.events.length + 1)
    assert.equal(after.events.filter(event => event.stage === "PC" && event.resultingState === "FINAL_APPROVED").length, 1)
    const finalDetail = await fetch(`${base}/api/gorut/packages/${row.package.packageCode}`, { headers: { Cookie: row.cookie } })
    assert.equal(finalDetail.status, 200)
    const canonicalAfter = await finalDetail.json()
    assert.equal(canonicalAfter.workflow.currentState, "FINAL_APPROVED")
    assert.deepEqual(canonicalAfter.workflow.availableActions, [])
    assert.equal(canonicalAfter.finalApproval.approved, true)
    assert.equal(canonicalAfter.finalApproval.sourceValidationCode, before.validation[0].validationCode)
    await prisma.gorutOperationalAssignment.update({ where: { id: row.actors.pc.context.assignmentId }, data: { isActive: false } })
    assert.equal((await post(row, row.command)).status, 403)
    assert.deepEqual(await snapshot(row), after)
  })

  test("every factual gate rejects APPROVE atomically", async () => {
    const row = await ready()
    const initial = await snapshot(row)
    for (const [model, original, mutation] of [
      ["gorutUpzisPackage", initial.package, { financialStatus: "UNVERIFIED" }],
      ["gorutUpzisPackage", initial.package, { isHistorical: true }],
      ["gorutUpzisPackage", initial.package, { financialSourceHash: null }],
      ["gorutUpzisPackage", initial.package, { currentState: "DRAFT" }],
      ["gorutUpzisPackage", initial.package, { currentState: "RETURNED_TO_RANTING" }],
      ["gorutPackageSettlementValidation", initial.validation[0], { result: "MISMATCH", actualAmountSnapshot: "64000.01", differenceAmount: "0.01" }],
      ["gorutPackageSettlementValidation", initial.validation[0], { result: "MISMATCH", actualAmountSnapshot: "63999.99", differenceAmount: "-0.01" }],
      ["gorutPackageSettlementValidation", initial.validation[0], { settlementRevisionSnapshot: 99 }],
      ["gorutPackageSettlementValidation", initial.validation[0], { actualAmountSnapshot: "1", expectedAmountSnapshot: "1" }],
      ["gorutPackageSettlementValidation", initial.validation[0], { validatorUserId: row.actors.maker.user.id }],
      ["gorutPackageSettlementEvidence", initial.evidence[0], { actualAmount: "64000.01" }],
      ["gorutPackageSettlementEvidence", initial.evidence[0], { expectedAmountSnapshot: "1" }],
    ]) {
      await prisma[model].update({ where: { id: original.id }, data: mutation })
      const before = await snapshot(row)
      const result = await post(row, row.command)
      assert.equal(result.status, 422, JSON.stringify({ mutation, result }))
      assert.deepEqual(await snapshot(row), before)
      await prisma[model].update({ where: { id: original.id }, data: Object.fromEntries([...Object.keys(mutation), ...(original.updatedAt ? ["updatedAt"] : [])].map(key => [key, original[key]])) })
    }
    const correction = await prisma.gorutPackageCorrection.create({ data: { correctionCode: `${row.package.packageCode}-QA-OPEN`, packageId: row.package.id, returnEventId: initial.events[0].id, targetType: "PACKAGE", reasonCode: "DATA_INCOMPLETE", requestedByUserId: row.actors.maker.user.id, requestedPackageVersion: row.command.expectedVersion } })
    assert.equal((await post(row, row.command)).status, 422)
    await prisma.gorutPackageCorrection.delete({ where: { id: correction.id } })
    assert.deepEqual(await snapshot(row), initial)
  })

  test("missing and superseded evidence block finalization until revalidation", async () => {
    const empty = await fixture()
    const before = await snapshot(empty)
    assert.equal((await post(empty, { action: "APPROVE", expectedVersion: empty.package.version, idempotencyKey: "no-evidence" })).status, 422)
    assert.deepEqual(await snapshot(empty), before)
    const row = await ready()
    const correction = await post(row, { mode: "PC_PICKUP", actualAmount: row.package.netAmount.toFixed(2), occurredAt: "2026-09-13T10:05:00.000Z", handedOverByMemberId: row.actors.maker.user.memberId, supersedesEvidenceCode: row.settlement.evidenceCode, expectedVersion: row.command.expectedVersion, idempotencyKey: "qa:corrected" }, row.cookie, {}, "settlements")
    assert.equal(correction.status, 200, JSON.stringify(correction.body))
    const staleCommand = { ...row.command, expectedVersion: correction.body.version }
    const staleBefore = await snapshot(row)
    const blocked = await post(row, staleCommand)
    assert.equal(blocked.status, 422)
    assert.ok(blocked.body.details.blockingReasons.includes("SETTLEMENT_VALIDATION_STALE"))
    assert.deepEqual(await snapshot(row), staleBefore)
  })

  test("canonical assignment, account and HTTP security reject unauthorized or forged commands", async () => {
    const row = await ready()
    const before = await snapshot(row)
    assert.equal((await post(row, row.command, "")).status, 401)
    assert.equal((await post(row, row.command, await login(row.actors.maker.user))).status, 403)
    assert.equal((await post(row, row.command, row.cookie, { Origin: "https://untrusted.invalid" })).status, 403)
    assert.equal((await post(row, row.command, row.cookie, { "Content-Type": "text/plain" })).status, 415)
    assert.equal((await post(row, "{")).status, 400)
    for (const fields of [{ currentState: "FINAL_APPROVED" }, { action: "FINAL_CLOSE" }, { action: "REJECT" }, { version: 99 }, { actorUserId: "forged" }, { difference: "0" }, { expectedVersion: -1 }]) {
      assert.equal((await post(row, { ...row.command, ...fields })).status, 400)
    }
    assert.equal((await post(row, { ...row.command, action: "RETURN", reasonCode: "DATA_INCOMPLETE", correctionTargets: [{ targetType: "PACKAGE" }] })).status, 422)
    await assert.rejects(prisma.gorutOperationalAssignment.update({ where: { id: row.actors.pc.context.assignmentId }, data: { kecamatanId: row.kecamatan.id } }), /GorutOperationalAssignment_scope_check/)
    await prisma.gorutOperationalAssignment.update({ where: { id: row.actors.pc.context.assignmentId }, data: { role: "UPZIS", kecamatanId: row.kecamatan.id } })
    assert.equal((await post(row, row.command)).status, 403)
    await prisma.gorutOperationalAssignment.update({ where: { id: row.actors.pc.context.assignmentId }, data: { role: "PC", kecamatanId: null, isActive: false } })
    assert.equal((await post(row, row.command)).status, 403)
    await prisma.gorutOperationalAssignment.update({ where: { id: row.actors.pc.context.assignmentId }, data: { isActive: true } })
    await prisma.user.update({ where: { id: row.actors.pc.user.id }, data: { status: "Nonaktif" } })
    assert.equal((await post(row, row.command)).status, 403)
    assert.deepEqual(await snapshot(row), before)
  })

  test("competing distinct keys cannot create a second final event", async () => {
    const row = await ready()
    const results = await Promise.all([post(row, row.command), post(row, { ...row.command, idempotencyKey: "competing" })])
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409])
    const after = await snapshot(row)
    assert.equal(after.events.filter(event => event.stage === "PC").length, 1)
    assert.equal(after.package.version, row.command.expectedVersion + 1)
  })

  test("VERCEL_ENV production fails closed for new commands and replay despite UAT flags", async () => {
    const waiting = await ready()
    const approved = await ready()
    assert.equal((await post(approved, approved.command)).status, 200)
    const snapshots = await Promise.all([snapshot(waiting), snapshot(approved)])
    await stopServer()
    await startServer({ VERCEL_ENV: "production" })
    for (const [index, row] of [waiting, approved].entries()) {
      const response = await post(row, row.command)
      assert.equal(response.status, 503)
      assert.equal(response.body.code, "PACKAGE_PROVISIONAL_POLICY_DISABLED")
      assert.deepEqual(await snapshot(row), snapshots[index])
    }
  })
})
