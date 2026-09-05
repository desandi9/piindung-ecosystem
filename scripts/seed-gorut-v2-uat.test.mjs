import assert from "node:assert/strict"
import test from "node:test"
import {
  gorutUatFixtureTransactionOptions,
  gorutUatUpzisLoginPhones,
  normalizeGorutUatFixturePhone,
  runGorutV2UatSeed,
  validateGorutUatFixtureEnvironment,
} from "./seed-gorut-v2-uat.mjs"

const validEnvironment = {
  GORUT_DEPLOYMENT_ENV: "STAGING",
  GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "true",
  GORUT_UAT_FIXTURE_CONFIRM: "NON_PRODUCTION_ONLY",
  GORUT_UAT_FIXTURE_PASSWORD: "fixture-only-password",
  DATABASE_URL: "postgresql://configured-outside-the-test/uat",
  VERCEL_ENV: "preview",
}

test("fixture guard accepts explicit STAGING and UAT only", () => {
  assert.deepEqual(validateGorutUatFixtureEnvironment(validEnvironment), {
    ok: true,
    deploymentEnvironment: "STAGING",
  })
  assert.deepEqual(validateGorutUatFixtureEnvironment({
    ...validEnvironment,
    GORUT_DEPLOYMENT_ENV: "uat",
  }), {
    ok: true,
    deploymentEnvironment: "UAT",
  })
  assert.equal(validateGorutUatFixtureEnvironment({ ...validEnvironment, GORUT_DEPLOYMENT_ENV: "DEVELOPMENT" }).ok, false)
  assert.equal(validateGorutUatFixtureEnvironment({ ...validEnvironment, GORUT_DEPLOYMENT_ENV: "PRODUCTION" }).ok, false)
})

test("fixture guard remains fail closed for platform production and missing requirements", () => {
  assert.equal(validateGorutUatFixtureEnvironment({ ...validEnvironment, VERCEL_ENV: "production" }).ok, false)
  assert.equal(validateGorutUatFixtureEnvironment({ ...validEnvironment, DATABASE_URL: "" }).ok, false)
  assert.equal(validateGorutUatFixtureEnvironment({ ...validEnvironment, GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "false" }).ok, false)
  assert.equal(validateGorutUatFixtureEnvironment({ ...validEnvironment, GORUT_UAT_FIXTURE_CONFIRM: "" }).ok, false)
  assert.equal(validateGorutUatFixtureEnvironment({ ...validEnvironment, GORUT_UAT_FIXTURE_PASSWORD: "short" }).ok, false)
})

test("interactive transaction uses a bounded 60 second timeout", () => {
  assert.deepEqual(gorutUatFixtureTransactionOptions, { maxWait: 10_000, timeout: 60_000 })
})

test("fixture canonicalizes documented UPZIS login phones exactly like auth", () => {
  assert.deepEqual(gorutUatUpzisLoginPhones, ["628990010001", "628990010002"])
  assert.deepEqual(
    gorutUatUpzisLoginPhones.map(normalizeGorutUatFixturePhone),
    ["08990010001", "08990010002"],
  )
})

test("password hashing stays outside the transaction and failed transaction is not success", async () => {
  const events = []
  const prisma = {
    $transaction: async (_callback, options) => {
      events.push(["transaction", options])
      throw new Error("synthetic transaction failure")
    },
    $disconnect: async () => events.push(["disconnect"]),
  }
  const logger = { log: (...args) => events.push(["log", ...args]) }

  await assert.rejects(runGorutV2UatSeed({
    env: validEnvironment,
    createPrisma: () => prisma,
    hashPassword: async () => {
      events.push(["hash"])
      return "synthetic-hash"
    },
    logger,
  }), /synthetic transaction failure/)

  assert.deepEqual(events, [
    ["hash"],
    ["transaction", gorutUatFixtureTransactionOptions],
    ["disconnect"],
  ])
})

test("guard failure happens before hashing or Prisma client creation", async () => {
  let touched = false
  await assert.rejects(runGorutV2UatSeed({
    env: { ...validEnvironment, GORUT_UAT_FIXTURE_CONFIRM: "" },
    createPrisma: () => {
      touched = true
      return null
    },
    hashPassword: async () => {
      touched = true
      return "unused"
    },
  }), /NON_PRODUCTION_ONLY/)
  assert.equal(touched, false)
})
