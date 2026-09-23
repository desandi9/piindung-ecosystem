import assert from "node:assert/strict"
import { after, before, describe, test } from "node:test"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve, join } from "node:path"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { seedGorutV2UatFixture } from "./seed-gorut-v2-uat.mjs"

const databaseUrl = process.env.GORUT_SETTLEMENT_HTTP_TEST_DATABASE_URL

describe("settlement route with real auth and isolated PostgreSQL", { skip: !databaseUrl, concurrency: false }, () => {
  const database = new URL(databaseUrl)
  assert.ok(["127.0.0.1", "localhost"].includes(database.hostname))
  assert.ok(database.pathname.startsWith("/gorut_settlement_route"), "Use a dedicated disposable test database")
  const mode = process.env.GORUT_SETTLEMENT_HTTP_TEST_SERVER_MODE ?? "start"
  assert.ok(["dev", "start"].includes(mode))
  const port = process.env.GORUT_SETTLEMENT_HTTP_TEST_PORT ?? "3067"
  const serverDir = process.env.GORUT_SETTLEMENT_HTTP_TEST_SERVER_DIR ?? process.cwd()
  const base = `http://localhost:${port}`
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl })
  const password = "Local-only-settlement-route-test"
  const logDir = mkdtempSync(join(tmpdir(), "gorut-settlement-http-"))
  let server
  let serverOutput = ""
  let sequence = 0
  let kecamatanId
  let pcUserId
  const cookies = {}

  async function stopServer() {
    if (server && server.exitCode === null) {
      const exited = once(server, "exit")
      server.kill("SIGTERM")
      await exited
    }
    writeFileSync(join(logDir, "server.log"), serverOutput)
  }

  async function startServer(extraEnv = {}) {
    server = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), mode, ...(mode === "dev" ? ["--webpack"] : []), "-H", "127.0.0.1", "-p", port], {
      cwd: serverDir,
      env: { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET: "local-settlement-http-test-secret", GORUT_DEPLOYMENT_ENV: "UAT", GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "true", VERCEL_ENV: "preview", ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
    })
    for (const stream of [server.stdout, server.stderr]) stream.on("data", chunk => { serverOutput += chunk.toString() })
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      assert.equal(server.exitCode, null, `Next server exited; see ${logDir}/server.log`)
      try { if ((await fetch(`${base}/api/auth/me`)).status === 401) return } catch { /* wait for the listening socket */ }
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.fail(`Next server not ready; see ${logDir}/server.log`)
  }

  async function login(phone) {
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ phoneNumber: phone, password, remember: false }),
    })
    assert.equal(response.status, 200, response.status === 200 ? undefined : await response.text())
    return response.headers.get("set-cookie").split(";")[0]
  }

  async function fixture(data = {}) {
    sequence += 1
    return prisma.gorutUpzisPackage.create({ data: {
      packageCode: `HTTP-SET-${Date.now()}-${sequence}`, kecamatanId,
      periodStart: new Date(Date.UTC(2028, sequence, 1)),
      currentState: "WAITING_PC_APPROVAL", version: 5, revision: 4, recordOrigin: "NATIVE",
      financialStatus: "READY", grossAmount: "79000", totalPlpkFee: "15000", netAmount: "64000",
      calculatedAt: new Date("2026-09-08T04:00:00.000Z"), calculationPolicyVersion: "GORUT-PLPK-FEE-V1-PROVISIONAL",
      financialSourceRevision: 4, financialSourceHash: "sha256:isolated-http-regression", ...data,
    } })
  }

  function command(overrides = {}) {
    return { mode: "PC_PICKUP", actualAmount: "64000.00", occurredAt: "2026-09-08T05:00:00.000Z", handedOverByMemberId: "PID-AAAAAAAAB234", evidenceReference: "ISOLATED-HTTP-REGRESSION", expectedVersion: 5, idempotencyKey: "http:settlement:1", ...overrides }
  }

  async function post(row, body = command(), cookie = cookies.pc, headers = {}) {
    const response = await fetch(`${base}/api/gorut/packages/${row.packageCode}/settlements`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
    return { status: response.status, body: await response.json(), cache: response.headers.get("cache-control") }
  }

  async function untouched(row) {
    assert.deepEqual(await prisma.gorutUpzisPackage.findUniqueOrThrow({ where: { id: row.id } }), row)
    assert.equal(await prisma.gorutPackageSettlementEvidence.count({ where: { packageId: row.id } }), 0)
    assert.equal(await prisma.gorutWorkflowEvent.count({ where: { packageId: row.id } }), 0)
  }

  before(async () => {
    const passwordHash = await bcrypt.hash(password, 10)
    const seeded = await seedGorutV2UatFixture({ prisma, passwordHash })
    kecamatanId = seeded.kecamatanId
    pcUserId = (await prisma.user.findUniqueOrThrow({ where: { memberId: "PID-DDDDDDDDA234" } })).id
    const other = await prisma.gorutKecamatan.upsert({ where: { code: "HTTP-OTHER" }, create: { code: "HTTP-OTHER", name: "Isolated foreign scope" }, update: {} })
    await prisma.user.upsert({ where: { memberId: "PID-FFFFFFFFA234" }, create: { memberId: "PID-FFFFFFFFA234", name: "Foreign UPZIS", phone: "08990010991", passwordHash, role: "admin_upzis", gorutAssignments: { create: { role: "UPZIS", kecamatanId: other.id } } }, update: { passwordHash } })
    await prisma.user.upsert({ where: { memberId: "PID-GGGGGGGGA234" }, create: { memberId: "PID-GGGGGGGGA234", name: "AppRole without assignment", phone: "08990010992", passwordHash, role: "super_admin_pc" }, update: { passwordHash } })
    await startServer()
    for (const [actor, phone] of Object.entries({ pc: "628990010010", kordes: "628990010003", foreign: "08990010991", unassigned: "08990010992" })) cookies[actor] = await login(phone)
  })

  after(async () => { await stopServer(); await prisma.$disconnect() })

  test("PC READY settlement returns 2xx, authoritative expected 64000, and idempotent replay", async () => {
    const row = await fixture()
    const result = await post(row)
    assert.equal(result.status, 200, JSON.stringify(result.body))
    assert.equal(result.cache, "private, no-store")
    assert.equal(result.body.settlement.expectedAmount, "64000.00")
    assert.equal(result.body.settlement.actualAmount, "64000.00")
    assert.equal(result.body.settlement.comparison.status, "NOMINAL_SESUAI")
    assert.equal(result.body.currentState, "WAITING_PC_APPROVAL")
    assert.equal(result.body.version, 6)
    assert.equal(result.body.revision, 4)
    assert.equal(result.body.validation.status, "NOT_VALIDATED")
    const replay = await post(row)
    assert.equal(replay.status, 200)
    assert.equal(replay.body.idempotentReplay, true)
    assert.equal(replay.body.settlement.evidenceCode, result.body.settlement.evidenceCode)
    assert.equal((await post(row, command({ actualAmount: "63000" }))).status, 409)
    assert.equal((await post(row, command({ idempotencyKey: "stale-intent" }))).status, 409)
    assert.equal(await prisma.gorutPackageSettlementEvidence.count({ where: { packageId: row.id } }), 1)
    assert.equal(await prisma.gorutWorkflowEvent.count({ where: { packageId: row.id } }), 0)
  })

  test("session, assignment, role and foreign handover gates still reject", async () => {
    const row = await fixture()
    assert.equal((await post(row, command(), null)).status, 401)
    for (const actor of ["unassigned", "kordes", "foreign"]) assert.equal((await post(row, command(), cookies[actor])).status, 403, actor)
    assert.equal((await post(row, command({ handedOverByMemberId: "PID-FFFFFFFFA234" }))).status, 403)
    await prisma.user.update({ where: { id: pcUserId }, data: { status: "Nonaktif" } })
    try { assert.equal((await post(row)).status, 403) }
    finally { await prisma.user.update({ where: { id: pcUserId }, data: { status: "Aktif" } }) }
    await untouched(row)
  })

  test("malformed input, forged authority, content type and cross-origin requests fail closed", async () => {
    const row = await fixture()
    for (const body of ["{", {}, command({ expectedAmount: "1" }), command({ receivedByUserId: pcUserId }), command({ actualAmount: "-1" })]) assert.equal((await post(row, body)).status, 400)
    assert.equal((await post(row, command(), cookies.pc, { "Content-Type": "text/plain" })).status, 415)
    assert.equal((await post(row, command(), cookies.pc, { Origin: "https://foreign.invalid" })).status, 403)
    assert.equal((await post({ packageCode: "invalid!package" })).status, 400)
    assert.equal((await post({ packageCode: "UNKNOWN-PACKAGE" })).status, 404)
    await untouched(row)
  })

  test("state, financial and historical gates remain executable rejections", async () => {
    for (const data of [
      { currentState: "DRAFT" },
      { financialStatus: "BLOCKED", financialBlockingReasons: ["TEST_BLOCKER"], grossAmount: null, totalPlpkFee: null, netAmount: null, calculatedAt: null, calculationPolicyVersion: null, financialSourceRevision: null, financialSourceHash: null },
      { isHistorical: true },
    ]) {
      const row = await fixture(data)
      const result = await post(row)
      assert.equal(result.status, 422)
      assert.equal(result.body.code, "SETTLEMENT_GATE_BLOCKED")
      await untouched(row)
    }
  })

  test("production host remains blocked despite UAT and enable flag", async () => {
    const row = await fixture()
    await stopServer()
    await startServer({ VERCEL_ENV: "production" })
    const result = await post(row)
    assert.equal(result.status, 503)
    assert.equal(result.body.code, "SETTLEMENT_PROVISIONAL_POLICY_DISABLED")
    await untouched(row)
  })
})
