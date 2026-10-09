import assert from "node:assert/strict"
import test from "node:test"
import {
  GorutCollectionAuthorityStatus,
  GorutCollectionStatus,
  GorutCollectionVisitStatus,
  GorutTransactionState,
  Prisma,
} from "@prisma/client"
// @ts-expect-error Node's strip-types runner requires the explicit TypeScript extension.
import { buildCollectionCode, buildInitialPendingCollectionEntries, calculateCollectionFinancialFacts, canVerifyCollectionAsKordes, canWriteCollectionAsPlpk, collectionSourceHash, normalizeCollectionPeriod } from "./gorut-collection-pure.ts"
// @ts-expect-error Node's strip-types runner requires the explicit TypeScript extension.
import { createAuthoritativeCollectionFinancialAuthority } from "./gorut-collection-package-adapter.ts"
import type { GorutOperationalContext } from "./gorut/server-pure.ts"

const context = (role: GorutOperationalContext["operationalRole"], rantingId: string | null = null, plpkId: string | null = null): GorutOperationalContext => ({
  userId: "user-1",
  assignmentId: "assignment-1",
  operationalRole: role,
  kecamatanId: role === "UPZIS" ? "kecamatan-1" : null,
  rantingId,
  plpkId,
})

test("authoritative collection grain and public code are deterministic", () => {
  const period = normalizeCollectionPeriod("2026-08")
  assert.equal(period.start.toISOString(), "2026-08-01T00:00:00.000Z")
  assert.equal(buildCollectionCode("PLPK-001", period), "GORUT-COL-PLPK-001-202608")
})

test("native collection creation seeds only assigned Munfiq as canonical pending entries", () => {
  const rows = buildInitialPendingCollectionEntries("GORUT-COL-PLPK-001-202608", [
    { id: "munfiq-2", code: "M-002" },
    { id: "munfiq-1", code: "M-001" },
  ])
  assert.deepEqual(rows.map((row) => row.munfiqCode), ["M-001", "M-002"])
  assert.ok(rows.every((row) => row.visitStatus === GorutCollectionVisitStatus.PENDING))
  assert.ok(rows.every((row) => row.amount === "0.00" && row.feeEligibleSnapshot === null && row.plpkFeeSnapshot === null))
  assert.deepEqual(rows.map((row) => row.sourceKey), [
    "GORUT-COL-PLPK-001-202608:M-001",
    "GORUT-COL-PLPK-001-202608:M-002",
  ])
  assert.notEqual(rows[0]?.sourceHash, rows[1]?.sourceHash)
})

test("amount authority remains separate from missing PLPK fee authority", () => {
  const facts = calculateCollectionFinancialFacts([{
    visitStatus: GorutCollectionVisitStatus.COLLECTED,
    amount: new Prisma.Decimal("100.25"),
    feeEligibleSnapshot: null,
    plpkFeeSnapshot: null,
    feePolicyVersion: null,
  }], GorutCollectionAuthorityStatus.AUTHORITATIVE)
  assert.equal(facts.amountAuthorityStatus, "AUTHORITATIVE")
  assert.equal(facts.feeAuthorityStatus, "UNVERIFIED")
  assert.equal(facts.financialStatus, "BLOCKED")
  assert.equal(facts.grossAmount?.toFixed(2), "100.25")
  assert.deepEqual(facts.financialBlockingReasons, ["COLLECTION_FEE_POLICY_UNAVAILABLE"])
})

test("versioned fee snapshots produce decimal-safe gross, fee, and net", () => {
  const facts = calculateCollectionFinancialFacts([{
    visitStatus: GorutCollectionVisitStatus.COLLECTED,
    amount: new Prisma.Decimal("10000000000000000.10"),
    feeEligibleSnapshot: true,
    plpkFeeSnapshot: new Prisma.Decimal("2500.00"),
    feePolicyVersion: "GORUT-PLPK-FEE-V1-PROVISIONAL",
  }, {
    visitStatus: GorutCollectionVisitStatus.NOT_AROUND,
    amount: new Prisma.Decimal("0"),
    feeEligibleSnapshot: false,
    plpkFeeSnapshot: new Prisma.Decimal("0"),
    feePolicyVersion: "GORUT-PLPK-FEE-V1-PROVISIONAL",
  }], GorutCollectionAuthorityStatus.AUTHORITATIVE)
  assert.equal(facts.financialStatus, "READY")
  assert.equal(facts.grossAmount?.toFixed(2), "10000000000000000.10")
  assert.equal(facts.totalPlpkFee?.toFixed(2), "2500.00")
  assert.equal(facts.netAmount?.toFixed(2), "9999999999997500.10")
})

test("financial authority rejects snapshots that do not match provisional V1", () => {
  const forged = calculateCollectionFinancialFacts([{
    visitStatus: GorutCollectionVisitStatus.COLLECTED,
    amount: new Prisma.Decimal("7000.00"),
    feeEligibleSnapshot: true,
    plpkFeeSnapshot: new Prisma.Decimal("2500.00"),
    feePolicyVersion: "GORUT-PLPK-FEE-V1-PROVISIONAL",
  }], GorutCollectionAuthorityStatus.AUTHORITATIVE)
  assert.equal(forged.financialStatus, "BLOCKED")
  assert.equal(forged.feeAuthorityStatus, "UNVERIFIED")
  assert.ok(forged.financialBlockingReasons.includes("COLLECTION_FEE_SNAPSHOT_MISMATCH"))

  const unsupported = calculateCollectionFinancialFacts([{
    visitStatus: GorutCollectionVisitStatus.COLLECTED,
    amount: new Prisma.Decimal("7001.00"),
    feeEligibleSnapshot: true,
    plpkFeeSnapshot: new Prisma.Decimal("2500.00"),
    feePolicyVersion: "GORUT-PLPK-FEE-V2-NOT-CONFIGURED",
  }], GorutCollectionAuthorityStatus.AUTHORITATIVE)
  assert.equal(unsupported.financialStatus, "BLOCKED")
  assert.ok(unsupported.financialBlockingReasons.includes("COLLECTION_FEE_POLICY_VERSION_UNSUPPORTED"))
})

test("collection write scopes fail closed for the wrong operational assignment", () => {
  assert.equal(canWriteCollectionAsPlpk(context("PLPK", null, "plpk-1"), "plpk-1"), true)
  assert.equal(canWriteCollectionAsPlpk(context("PLPK", null, "plpk-2"), "plpk-1"), false)
  assert.equal(canWriteCollectionAsPlpk(context("PC"), "plpk-1"), false)
  assert.equal(canVerifyCollectionAsKordes(context("RANTING", "ranting-1"), "ranting-1"), true)
  assert.equal(canVerifyCollectionAsKordes(context("UPZIS"), "ranting-1"), false)
})

test("collection source hash ignores entry ordering but changes with correction facts", () => {
  const base = {
    collectionCode: "GORUT-COL-PLPK-001-202608",
    periodStart: new Date("2026-08-01T00:00:00.000Z"),
    kecamatanCode: "KEC-001",
    rantingCode: "RAN-001",
    plpkCode: "PLPK-001",
    status: GorutCollectionStatus.COLLECTING,
    entries: [{
      munfiqCode: "MUN-002",
      visitStatus: GorutCollectionVisitStatus.COLLECTED,
      amount: new Prisma.Decimal("20"),
      collectedAt: new Date("2026-08-10T00:00:00.000Z"),
      note: null,
      feeEligibleSnapshot: true,
      plpkFeeSnapshot: new Prisma.Decimal("2"),
      feePolicyVersion: "TEST_V1",
    }, {
      munfiqCode: "MUN-001",
      visitStatus: GorutCollectionVisitStatus.NOT_AROUND,
      amount: new Prisma.Decimal("0"),
      collectedAt: null,
      note: "Tidak di tempat",
      feeEligibleSnapshot: false,
      plpkFeeSnapshot: new Prisma.Decimal("0"),
      feePolicyVersion: "TEST_V1",
    }],
  }
  assert.equal(collectionSourceHash(base), collectionSourceHash({ ...base, entries: [...base.entries].reverse() }))
  assert.notEqual(collectionSourceHash(base), collectionSourceHash({
    ...base,
    entries: base.entries.map((entry, index) => index === 0 ? { ...entry, amount: new Prisma.Decimal("21") } : entry),
  }))
})

test("package adapter is READY only for complete authoritative collection relations", () => {
  const authority = createAuthoritativeCollectionFinancialAuthority()
  const transaction = {
    id: "transaction-id",
    code: "TRX-COL-1",
    kecamatanId: "kecamatan-id",
    rantingId: "ranting-id",
    plpkId: "plpk-id",
    transactionDate: new Date("2026-08-01T00:00:00.000Z"),
    totalAmount: new Prisma.Decimal("999.00"),
    currentState: GorutTransactionState.DRAFT,
    updatedAt: new Date("2026-08-20T00:00:00.000Z"),
    kecamatan: { id: "kecamatan-id", code: "KEC-1" },
    ranting: { id: "ranting-id", kecamatanId: "kecamatan-id", code: "RAN-1" },
    plpk: { id: "plpk-id", rantingId: "ranting-id", code: "PLPK-1" },
    items: [],
    collectionSource: {
      collectionCode: "GORUT-COL-PLPK-1-202608",
      status: "VERIFIED_BY_KORDES",
      recordOrigin: "NATIVE",
      amountAuthorityStatus: "AUTHORITATIVE",
      feeAuthorityStatus: "AUTHORITATIVE",
      financialStatus: "READY",
      financialBlockingReasons: [],
      grossAmount: new Prisma.Decimal("120.00"),
      totalPlpkFee: new Prisma.Decimal("20.00"),
      netAmount: new Prisma.Decimal("100.00"),
      calculationPolicyVersion: "GORUT-PLPK-FEE-V1-PROVISIONAL",
      financialSourceHash: "sha256:financial",
      revision: 4,
      sourceHash: "sha256:source",
      transactionSourceHash: "sha256:source",
      confirmedByPlpkAt: new Date("2026-08-10T00:00:00.000Z"),
      submittedToKordesAt: new Date("2026-08-10T00:00:00.000Z"),
      verifiedByKordesAt: new Date("2026-08-11T00:00:00.000Z"),
      returnedForCorrectionAt: null,
    },
  }
  const ready = authority.calculate([transaction])
  assert.equal(ready.ready, true)
  if (ready.ready) {
    assert.equal(new Prisma.Decimal(ready.grossAmount.toString()).toFixed(2), "120.00")
    assert.equal(new Prisma.Decimal(ready.totalPlpkFee.toString()).toFixed(2), "20.00")
  }
  const blocked = authority.calculate([{ ...transaction, collectionSource: { ...transaction.collectionSource, feeAuthorityStatus: "UNVERIFIED", financialStatus: "BLOCKED", grossAmount: null, totalPlpkFee: null, netAmount: null, financialBlockingReasons: ["COLLECTION_FEE_POLICY_UNAVAILABLE"] } }])
  assert.equal(blocked.ready, false)
})
