import assert from "node:assert/strict"
import test from "node:test"
import {
  parseMigrationAction,
  runGorutStagingMigration,
  validateGorutStagingMigrationEnvironment,
} from "./migrate-gorut-v2-staging.mjs"

const validEnvironment = {
  GORUT_DEPLOYMENT_ENV: "STAGING",
  GORUT_NON_PRODUCTION_DB_CONFIRMED: "true",
  DATABASE_URL: "postgresql://configured-by-platform/identity-is-not-inferred",
  VERCEL_ENV: "preview",
}

test("accepts only deploy or status as an explicit action", () => {
  assert.deepEqual(parseMigrationAction(["deploy"]), { ok: true, action: "deploy" })
  assert.deepEqual(parseMigrationAction(["status"]), { ok: true, action: "status" })
  assert.equal(parseMigrationAction([]).ok, false)
  assert.equal(parseMigrationAction(["deploy", "status"]).ok, false)
})

test("accepts a human-confirmed staging or UAT database without hostname inference", () => {
  assert.deepEqual(validateGorutStagingMigrationEnvironment(validEnvironment), {
    ok: true,
    deploymentEnvironment: "STAGING",
  })
  assert.deepEqual(validateGorutStagingMigrationEnvironment({
    ...validEnvironment,
    GORUT_DEPLOYMENT_ENV: "uat",
  }), {
    ok: true,
    deploymentEnvironment: "UAT",
  })
})

test("rejects Vercel production even when staging variables are set", () => {
  assert.equal(validateGorutStagingMigrationEnvironment({
    ...validEnvironment,
    VERCEL_ENV: "production",
  }).ok, false)
})

test("rejects a missing or unsupported deployment environment", () => {
  assert.equal(validateGorutStagingMigrationEnvironment({
    ...validEnvironment,
    GORUT_DEPLOYMENT_ENV: undefined,
  }).ok, false)
  assert.equal(validateGorutStagingMigrationEnvironment({
    ...validEnvironment,
    GORUT_DEPLOYMENT_ENV: "PRODUCTION",
  }).ok, false)
})

test("keeps provisional policy enablement separate from migration permission", () => {
  assert.equal(validateGorutStagingMigrationEnvironment({
    ...validEnvironment,
    GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "false",
  }).ok, true)
})

test("rejects missing database configuration or human confirmation", () => {
  assert.equal(validateGorutStagingMigrationEnvironment({
    ...validEnvironment,
    DATABASE_URL: "",
  }).ok, false)
  assert.equal(validateGorutStagingMigrationEnvironment({
    ...validEnvironment,
    GORUT_NON_PRODUCTION_DB_CONFIRMED: "",
  }).ok, false)
})

test("rejects development even with database confirmation", () => {
  assert.equal(validateGorutStagingMigrationEnvironment({
    ...validEnvironment,
    GORUT_DEPLOYMENT_ENV: "DEVELOPMENT",
  }).ok, false)
})

test("blocked execution returns before invoking Prisma", () => {
  assert.deepEqual(runGorutStagingMigration({
    args: ["deploy"],
    env: {
      ...validEnvironment,
      GORUT_NON_PRODUCTION_DB_CONFIRMED: "",
    },
  }), {
    ok: false,
    error: "Set GORUT_NON_PRODUCTION_DB_CONFIRMED=true only after a human verifies the database is dedicated non-production infrastructure.",
  })
})
