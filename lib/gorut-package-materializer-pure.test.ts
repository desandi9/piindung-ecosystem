import assert from "node:assert/strict"
import test from "node:test"
import { GorutTransactionState, Prisma } from "@prisma/client"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { buildGorutPackageCode, calculateFinancialSnapshot, evaluateTransactionEligibility, GorutPackageMaterializationError, normalizePackagePeriod, transactionSourceHash, type MaterializationTransactionSource } from "./gorut-package-materializer-pure.ts"

function source(overrides: Partial<MaterializationTransactionSource> = {}): MaterializationTransactionSource {
  return {
    id: "transaction-db-id",
    code: "TRX-202608-001",
    kecamatanId: "kecamatan-db-id",
    rantingId: "ranting-db-id",
    plpkId: "plpk-db-id",
    transactionDate: new Date("2026-08-31T23:59:59.999Z"),
    totalAmount: new Prisma.Decimal("15000.50"),
    currentState: GorutTransactionState.WAITING_UPZIS_VERIFICATION,
    updatedAt: new Date("2026-08-20T01:00:00.000Z"),
    kecamatan: { id: "kecamatan-db-id", code: "KEC-001" },
    ranting: { id: "ranting-db-id", kecamatanId: "kecamatan-db-id", code: "RAN-001" },
    plpk: { id: "plpk-db-id", rantingId: "ranting-db-id", code: "PLPK-001" },
    items: [{
      munfiqId: "munfiq-db-id-1",
      amount: new Prisma.Decimal("10000.25"),
      periodLabel: "2026-08",
      munfiq: { id: "munfiq-db-id-1", code: "MUN-001", rantingId: "ranting-db-id", plpkId: "plpk-db-id" },
    }, {
      munfiqId: "munfiq-db-id-2",
      amount: new Prisma.Decimal("5000.25"),
      periodLabel: "2026-08",
      munfiq: { id: "munfiq-db-id-2", code: "MUN-002", rantingId: "ranting-db-id", plpkId: "plpk-db-id" },
    }],
    ...overrides,
  }
}

test("period normalization uses deterministic UTC calendar-month boundaries", () => {
  const period = normalizePackagePeriod("2026-08")
  assert.equal(period.start.toISOString(), "2026-08-01T00:00:00.000Z")
  assert.equal(period.end.toISOString(), "2026-09-01T00:00:00.000Z")
  assert.equal(normalizePackagePeriod(new Date("2026-08-31T23:59:59.999Z")).key, "2026-08")
  assert.throws(() => normalizePackagePeriod("2026-8"), (error) =>
    error instanceof GorutPackageMaterializationError && error.code === "INVALID_PERIOD")
})

test("package code is stable, public, and does not use mutable names or database IDs", () => {
  const period = normalizePackagePeriod("2026-08")
  assert.equal(buildGorutPackageCode("KEC-001", period), "GORUT-KEC-001-202608")
  assert.notEqual(buildGorutPackageCode("KEC-001", period), buildGorutPackageCode("KEC-002", period))
  assert.throws(() => buildGorutPackageCode("Garut Kota / renamed", period), (error) =>
    error instanceof GorutPackageMaterializationError && error.code === "INVALID_KECAMATAN_CODE")
})

test("technical eligibility validates region, PLPK graph, period, reconciliation, and explicit state policy", () => {
  const period = normalizePackagePeriod("2026-08")
  const allowed = new Set([GorutTransactionState.WAITING_UPZIS_VERIFICATION])
  assert.deepEqual(evaluateTransactionEligibility(source(), "kecamatan-db-id", period, allowed), {
    eligible: true,
    blockingReasons: [],
  })

  const regionMismatch = evaluateTransactionEligibility(source({ kecamatanId: "other-kecamatan" }), "kecamatan-db-id", period, allowed)
  assert.equal(regionMismatch.eligible, false)
  assert.equal(regionMismatch.blockingReasons.includes("UNRESOLVED_REGION"), true)

  const plpkMismatch = evaluateTransactionEligibility(source({ plpk: { id: "plpk-db-id", rantingId: "other-ranting", code: "PLPK-001" } }), "kecamatan-db-id", period, allowed)
  assert.equal(plpkMismatch.blockingReasons.includes("UNRESOLVED_PLPK"), true)

  const periodMismatch = evaluateTransactionEligibility(source({ transactionDate: new Date("2026-09-01T00:00:00.000Z") }), "kecamatan-db-id", period, allowed)
  assert.equal(periodMismatch.blockingReasons.includes("PERIOD_MISMATCH"), true)

  const amountMismatch = evaluateTransactionEligibility(source({ totalAmount: new Prisma.Decimal("1.00") }), "kecamatan-db-id", period, allowed)
  assert.equal(amountMismatch.blockingReasons.includes("TRANSACTION_RECONCILIATION_FAILED"), true)
})

test("workflow-state eligibility fails closed when business policy is absent", () => {
  const result = evaluateTransactionEligibility(source(), "kecamatan-db-id", normalizePackagePeriod("2026-08"), new Set())
  assert.equal(result.eligible, false)
  assert.deepEqual(result.blockingReasons, ["BUSINESS_WORKFLOW_ELIGIBILITY_UNCONFIRMED"])
})

test("source hash is stable across item ordering and volatile update timestamps", () => {
  const original = source()
  const reordered = source({
    updatedAt: new Date("2027-01-01T00:00:00.000Z"),
    items: [...original.items].reverse(),
  })
  assert.equal(transactionSourceHash(original), transactionSourceHash(reordered))
  assert.notEqual(
    transactionSourceHash(original),
    transactionSourceHash(source({ totalAmount: new Prisma.Decimal("15001.50") })),
  )
})

test("financial calculation uses Decimal and enforces gross minus PLPK fee", () => {
  const result = calculateFinancialSnapshot(new Prisma.Decimal("10000000000000000.10"), new Prisma.Decimal("0.09"))
  assert.equal(result.grossAmount.toFixed(2), "10000000000000000.10")
  assert.equal(result.totalPlpkFee.toFixed(2), "0.09")
  assert.equal(result.netAmount.toFixed(2), "10000000000000000.01")
  assert.throws(() => calculateFinancialSnapshot("10", "11"), (error) =>
    error instanceof GorutPackageMaterializationError && error.code === "AMOUNT_INVALID")
})
