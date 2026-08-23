import assert from "node:assert/strict"
import test from "node:test"
import { GorutCollectionVisitStatus, Prisma } from "@prisma/client"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { assertGorutProvisionalFeePolicyAllowed, calculateProvisionalPlpkFee, calculateProvisionalPlpkFeeByMunfiqPeriod, createGorutProvisionalPlpkFeePolicy, GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION, isGorutProvisionalFeePolicyAllowed, resolveGorutProvisionalFeeRuntime } from "./gorut-provisional-plpk-fee-policy.ts"

const stagingRuntime = { deploymentEnvironment: "STAGING" as const, enabled: true }

void test("provisional boundary is strictly greater than Rp7.000", () => {
  assert.deepEqual(calculateProvisionalPlpkFee("7000", GorutCollectionVisitStatus.COLLECTED), {
    eligible: false,
    feeAmount: new Prisma.Decimal(0),
  })
  const above = calculateProvisionalPlpkFee("7001", GorutCollectionVisitStatus.COLLECTED)
  assert.equal(above.eligible, true)
  assert.equal(above.feeAmount.toFixed(2), "2500.00")
  assert.equal(calculateProvisionalPlpkFee("9000", GorutCollectionVisitStatus.NOT_AROUND).eligible, false)
})

void test("PER_MUNFIQ_PER_PERIOD aggregation never multiplies a duplicate fee", () => {
  const result = calculateProvisionalPlpkFeeByMunfiqPeriod([
    { munfiqKey: "MF-01", visitStatus: GorutCollectionVisitStatus.COLLECTED, amount: "4000" },
    { munfiqKey: "MF-01", visitStatus: GorutCollectionVisitStatus.COLLECTED, amount: "4001" },
    { munfiqKey: "MF-02", visitStatus: GorutCollectionVisitStatus.COLLECTED, amount: "7000" },
    { munfiqKey: "MF-03", visitStatus: GorutCollectionVisitStatus.NOT_READY, amount: "0" },
  ])
  assert.equal(result.grossAmount.toFixed(2), "15001.00")
  assert.equal(result.totalPlpkFee.toFixed(2), "2500.00")
  assert.equal(result.netAmount.toFixed(2), "12501.00")
  assert.equal(result.snapshots.length, 2)
  assert.equal(result.snapshots.filter((snapshot) => snapshot.eligibleForPlpkFee).length, 1)
  assert.ok(result.snapshots.every((snapshot) => snapshot.feePolicyVersion === GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION))
})

void test("provisional policy requires explicit non-production enablement", () => {
  assert.equal(isGorutProvisionalFeePolicyAllowed(stagingRuntime), true)
  assert.equal(isGorutProvisionalFeePolicyAllowed({ deploymentEnvironment: "UAT", enabled: true }), true)
  assert.equal(isGorutProvisionalFeePolicyAllowed({ deploymentEnvironment: "DEVELOPMENT", enabled: true }), false)
  assert.equal(isGorutProvisionalFeePolicyAllowed({ deploymentEnvironment: "TEST", enabled: true }), false)
  assert.equal(isGorutProvisionalFeePolicyAllowed({ deploymentEnvironment: "PRODUCTION", enabled: true }), false)
  assert.equal(isGorutProvisionalFeePolicyAllowed({ deploymentEnvironment: "STAGING", enabled: false }), false)
  assert.equal(isGorutProvisionalFeePolicyAllowed({ deploymentEnvironment: "UAT", enabled: false }), false)
  assert.throws(() => createGorutProvisionalPlpkFeePolicy({ deploymentEnvironment: "PRODUCTION", enabled: true }), {
    code: "PROVISIONAL_FEE_POLICY_DISABLED",
  })
  assert.throws(() => assertGorutProvisionalFeePolicyAllowed(stagingRuntime, { deploymentEnvironment: "PRODUCTION", enabled: true }), {
    code: "PROVISIONAL_FEE_POLICY_DISABLED",
  })
  const policy = createGorutProvisionalPlpkFeePolicy(stagingRuntime)
  assert.equal(policy.authority, "PROVISIONAL_PENDING_SOP_CONFIRMATION")
  assert.equal(policy.basis, "PER_MUNFIQ_PER_PERIOD")
})

void test("a platform production signal cannot be disguised as staging", () => {
  const resolved = resolveGorutProvisionalFeeRuntime({
    GORUT_DEPLOYMENT_ENV: "STAGING",
    GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "true",
    NODE_ENV: "production",
    VERCEL_ENV: "production",
  })
  assert.deepEqual(resolved, { deploymentEnvironment: "PRODUCTION", enabled: true })
  assert.equal(isGorutProvisionalFeePolicyAllowed(resolved), false)
})

void test("production safety matrix remains fail-closed", () => {
  const cases = [
    { name: "production plus flag", environment: { GORUT_DEPLOYMENT_ENV: "PRODUCTION", GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "true" }, allowed: false },
    { name: "Vercel production disguising staging", environment: { GORUT_DEPLOYMENT_ENV: "STAGING", GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "true", VERCEL_ENV: "production" }, allowed: false },
    { name: "staging without flag", environment: { GORUT_DEPLOYMENT_ENV: "STAGING", GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "false" }, allowed: false },
    { name: "UAT without flag", environment: { GORUT_DEPLOYMENT_ENV: "UAT", GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "false" }, allowed: false },
    { name: "staging plus flag", environment: { GORUT_DEPLOYMENT_ENV: "STAGING", GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "true" }, allowed: true },
    { name: "UAT plus flag", environment: { GORUT_DEPLOYMENT_ENV: "UAT", GORUT_ENABLE_PROVISIONAL_FEE_POLICY: "true" }, allowed: true },
  ] as const

  for (const fixture of cases) {
    const runtime = resolveGorutProvisionalFeeRuntime(fixture.environment)
    assert.equal(isGorutProvisionalFeePolicyAllowed(runtime), fixture.allowed, fixture.name)
  }
})
