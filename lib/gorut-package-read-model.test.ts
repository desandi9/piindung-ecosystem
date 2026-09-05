import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { packageReadScopeWhere, packageStates, parsePackagePeriod, parsePackageState, serializePackageDetail, type PackageDetailSource } from "./gorut-package-read-model.ts"
import type { GorutOperationalContext } from "./gorut/server-pure.ts"

const context = (operationalRole: GorutOperationalContext["operationalRole"], kecamatanId: string | null = null): GorutOperationalContext => ({
  userId: "user-1",
  assignmentId: "assignment-1",
  operationalRole,
  kecamatanId,
  rantingId: operationalRole === "RANTING" ? "ranting-1" : null,
  plpkId: operationalRole === "PLPK" ? "plpk-1" : null,
})

const money = (value: string) => ({ toString: () => value })

function source(overrides: Partial<PackageDetailSource> = {}): PackageDetailSource {
  return {
    packageCode: "GPK-202608-KEC-001",
    kecamatanId: "kecamatan-1",
    periodStart: new Date("2026-08-01T00:00:00.000Z"),
    currentState: "DRAFT",
    version: 1,
    revision: 1,
    recordOrigin: "NATIVE",
    isHistorical: false,
    workflowHistoryComplete: true,
    financialStatus: "READY",
    financialBlockingReasons: [],
    legacyId: null,
    sourceRowKey: null,
    migrationBatchKey: null,
    grossAmount: money("14000.2"),
    totalPlpkFee: money("2000"),
    netAmount: money("12000.2"),
    calculatedAt: new Date("2026-08-20T03:00:00.000Z"),
    calculationPolicyVersion: "plpk-fee-v1",
    financialSourceRevision: 1,
    financialSourceHash: "sha256:financial-example",
    lockedAt: null,
    kecamatan: { code: "KEC-001", name: "Garut Kota" },
    transactionMemberships: [{
      sourceType: "GORUT_TRANSACTION",
      sourceKey: "TRX-001",
      sourceVersion: "1",
      sourceHash: "sha256:example",
      includedAt: new Date("2026-08-20T02:00:00.000Z"),
      transaction: {
        code: "TRX-001",
        kecamatanId: "kecamatan-1",
        rantingId: "ranting-1",
        transactionDate: new Date("2026-08-15T00:00:00.000Z"),
        totalAmount: money("15000.50"),
        currentState: "WAITING_UPZIS_VERIFICATION",
        ranting: { id: "ranting-1", kecamatanId: "kecamatan-1", code: "RAN-001", name: "Sukamentri" },
        plpk: { code: "PLPK-001", name: "Dede Rahmat" },
        _count: { items: 3 },
      },
    }],
    rantingCoverages: [
      { status: "INCLUDED", sourceRantingKey: "RAN-001", sourceRantingName: null, exclusionReason: null, ranting: { id: "ranting-1", kecamatanId: "kecamatan-1", code: "RAN-001", name: "Sukamentri" } },
      { status: "EXCLUDED", sourceRantingKey: "RAN-002", sourceRantingName: null, exclusionReason: "Tidak beroperasi pada periode ini", ranting: { id: "ranting-2", kecamatanId: "kecamatan-1", code: "RAN-002", name: "Pakuwon" } },
      { status: "UNRESOLVED", sourceRantingKey: "legacy-ranting", sourceRantingName: "Nama Lama", exclusionReason: null, ranting: null },
    ],
    workflowEvents: [],
    ...overrides,
  }
}

test("DRAFT is an existing package state while child-only states remain excluded", () => {
  assert.equal(packageStates.includes("DRAFT"), true)
  assert.equal(parsePackageState("DRAFT"), "DRAFT")
  assert.equal(parsePackageState("WAITING_RANTING_VERIFICATION"), undefined)
  assert.equal(parsePackageState("RETURNED_TO_PLPK"), undefined)
})

test("package reads fail closed outside PC and UPZIS scopes", () => {
  assert.deepEqual(packageReadScopeWhere(context("PC")), {})
  assert.deepEqual(packageReadScopeWhere(context("UPZIS", "kecamatan-1")), { kecamatanId: "kecamatan-1" })
  assert.equal(packageReadScopeWhere(context("RANTING")), null)
  assert.equal(packageReadScopeWhere(context("PLPK")), null)
})

test("package period parser accepts only canonical year-month values", () => {
  const period = parsePackagePeriod("2026-08")
  assert.equal(period?.start.toISOString(), "2026-08-01T00:00:00.000Z")
  assert.equal(period?.end.toISOString(), "2026-09-01T00:00:00.000Z")
  assert.equal(parsePackagePeriod("2026-13"), null)
  assert.equal(parsePackagePeriod("2026-8"), null)
})

test("canonical detail preserves decimal strings, recorded semantics, coverage facts, and disabled actions", () => {
  const detail = serializePackageDetail(source())
  assert.equal(detail.identity.packageCode, "GPK-202608-KEC-001")
  assert.equal("id" in detail.identity, false)
  assert.equal("id" in detail.transactions.items[0]!, false)
  assert.equal(detail.financial.recordedAmount, "15000.50")
  assert.equal(detail.financial.recordedAmountSemantic, "Jumlah Tercatat")
  assert.equal(detail.financial.grossAmount, "14000.20")
  assert.equal(detail.financial.totalPlpkFee, "2000.00")
  assert.equal(detail.financial.netAmount, "12000.20")
  assert.notEqual(detail.financial.recordedAmount, detail.financial.grossAmount)
  assert.equal(detail.financial.consistency.formulaMatches, true)
  assert.equal(detail.coverage.included, 1)
  assert.equal(detail.coverage.excluded, 1)
  assert.equal(detail.coverage.unresolved, 1)
  assert.equal(detail.coverage.completenessEvaluated, false)
  assert.equal(detail.coverage.consistency.resolvedRantingsWithinRegion, true)
  assert.equal(detail.transactions.munfiqCount, 3)
  assert.deepEqual(detail.workflow.availableActions, [])
  assert.deepEqual(detail.workflow.blockingReasons, ["WORKFLOW_MUTATIONS_DISABLED_PHASE_1"])
})

test("historical package may expose incomplete history and no current state without synthetic events", () => {
  const detail = serializePackageDetail(source({
    currentState: null,
    recordOrigin: "LEGACY_EXCEL",
    isHistorical: true,
    workflowHistoryComplete: false,
    legacyId: "excel-row-42",
    workflowEvents: [],
  }))
  assert.equal(detail.identity.origin, "LEGACY_EXCEL")
  assert.equal(detail.identity.isHistorical, true)
  assert.equal(detail.identity.workflowHistoryComplete, false)
  assert.equal("legacyId" in detail.identity, false)
  assert.equal("sourceRowKey" in detail.identity, false)
  assert.equal("migrationBatchKey" in detail.identity, false)
  assert.equal(detail.workflow.currentState, null)
  assert.deepEqual(detail.workflow.history, [])
})

test("financially blocked package exposes null canonical amounts instead of fake zero", () => {
  const detail = serializePackageDetail(source({
    financialStatus: "BLOCKED",
    financialBlockingReasons: ["NORMALIZED_GROSS_SOURCE_UNAVAILABLE", "NORMALIZED_PLPK_FEE_SOURCE_UNAVAILABLE"],
    grossAmount: null,
    totalPlpkFee: null,
    netAmount: null,
    calculatedAt: null,
    calculationPolicyVersion: null,
    financialSourceRevision: null,
    financialSourceHash: null,
  }))
  assert.equal(detail.financial.status, "BLOCKED")
  assert.equal(detail.financial.grossAmount, null)
  assert.equal(detail.financial.totalPlpkFee, null)
  assert.equal(detail.financial.netAmount, null)
  assert.equal(detail.financial.consistency.formulaMatches, null)
})

test("canonical detail exposes authoritative collection facts without database IDs", () => {
  const fixture = source()
  fixture.transactionMemberships[0]!.transaction.collectionSource = {
    collectionCode: "GORUT-COL-PLPK-001-202608",
    status: "VERIFIED_BY_KORDES",
    recordOrigin: "NATIVE",
    amountAuthorityStatus: "AUTHORITATIVE",
    feeAuthorityStatus: "AUTHORITATIVE",
    financialStatus: "READY",
    financialBlockingReasons: [],
    grossAmount: money("14000.20"),
    totalPlpkFee: money("2000.00"),
    netAmount: money("12000.20"),
    calculationPolicyVersion: "GORUT-PLPK-FEE-V1-PROVISIONAL",
    financialSourceHash: "sha256:financial",
    revision: 4,
    sourceHash: "sha256:collection",
    transactionSourceHash: "sha256:collection",
    confirmedByPlpkAt: new Date("2026-08-10T00:00:00.000Z"),
    submittedToKordesAt: new Date("2026-08-10T00:00:00.000Z"),
    verifiedByKordesAt: new Date("2026-08-11T00:00:00.000Z"),
    returnedForCorrectionAt: null,
  }
  const detail = serializePackageDetail(fixture)
  assert.equal(detail.collectionSource.sourceCount, 1)
  assert.equal(detail.collectionSource.financiallyReadyCount, 1)
  assert.equal(detail.transactions.items[0]!.collectionSource?.collectionCode, "GORUT-COL-PLPK-001-202608")
  assert.equal(detail.transactions.items[0]!.collectionSource?.verification.verifiedByKordesAt, "2026-08-11T00:00:00.000Z")
  assert.equal(detail.transactions.items[0]!.collectionSource?.grossAmount, "14000.20")
  assert.equal(detail.transactions.items[0]!.collectionSource?.totalPlpkFee, "2000.00")
  assert.equal(detail.transactions.items[0]!.collectionSource?.netAmount, "12000.20")
  assert.equal(detail.transactions.items[0]!.collectionSource?.reconciliationStatus, "READY")
  assert.equal(detail.financial.feePolicyVersion, "GORUT-PLPK-FEE-V1-PROVISIONAL")
  assert.equal(detail.financial.feePolicyAuthority, "PROVISIONAL_PENDING_SOP_CONFIRMATION")
  assert.equal("id" in detail.transactions.items[0]!.collectionSource!, false)
})

test("document contract keeps F.011 unavailable and F.016 scaffold-only", () => {
  const detail = serializePackageDetail(source())
  assert.deepEqual(detail.documents.map((document) => [document.code, document.readiness, document.executable]), [
    ["F.011", "UNAVAILABLE", false],
    ["F.016", "SCAFFOLD", false],
  ])
})

test("settlement read model exposes factual decimal comparison, actors, revisions, and no validation result", () => {
  const detail = serializePackageDetail(source({
    currentState: "WAITING_PC_APPROVAL",
    settlementEvidence: [{
      evidenceCode: "GPK-202608-KEC-001-SET-001",
      mode: "PC_PICKUP",
      revision: 1,
      expectedAmountSnapshot: money("12000.20"),
      actualAmount: money("11500.20"),
      occurredAt: new Date("2026-08-21T03:00:00.000Z"),
      recordedAt: new Date("2026-08-21T03:05:00.000Z"),
      receivedAt: new Date("2026-08-21T03:00:00.000Z"),
      bankName: null,
      externalReference: null,
      evidenceReference: "BA-UPZIS-PC-001",
      note: "Dihitung ulang PC",
      packageVersionBefore: 3,
      packageVersionAfter: 4,
      supersedes: null,
      supersededBy: null,
      recordedBy: { memberId: "PID-PC-001", name: "PC Receiver" },
      recordedByAssignment: { role: "PC" },
      handedOverBy: { memberId: "PID-UPZIS-001", name: "UPZIS Petugas" },
      receivedBy: { memberId: "PID-PC-001", name: "PC Receiver" },
      depositedBy: null,
    }],
  }))
  assert.equal(detail.settlement.status, "EVIDENCE_RECORDED")
  assert.equal(detail.settlement.completionStatus, "NOT_DETERMINED_UNTIL_VALIDATION")
  assert.equal(detail.settlement.latest?.expectedAmount, "12000.20")
  assert.equal(detail.settlement.latest?.actualAmount, "11500.20")
  assert.equal(detail.settlement.latest?.difference, "-500.00")
  assert.equal(detail.settlement.latest?.comparison.status, "ADA_SELISIH")
  assert.equal(detail.settlement.latest?.actors.receivedBy?.name, "PC Receiver")
  assert.equal(detail.settlement.validation.status, "NOT_VALIDATED")
  assert.equal(detail.settlement.validation.result, null)
  assert.deepEqual(detail.settlement.validation.historical, [])
  assert.equal("id" in detail.settlement.latest!, false)
  assert.equal(JSON.stringify(detail.settlement).includes("UserId"), false)
})

test("settlement validation read model marks old result stale and latest result current without aggregating revisions", () => {
  const baseEvidence = {
    mode: "UPZIS_BANK_DEPOSIT" as const,
    expectedAmountSnapshot: money("12000.20"),
    occurredAt: new Date("2026-08-21T03:00:00.000Z"),
    recordedAt: new Date("2026-08-21T03:05:00.000Z"),
    receivedAt: null,
    bankName: "BNI",
    externalReference: "BNI-001",
    evidenceReference: "SLIP-001",
    note: null,
    recordedBy: { memberId: "PID-UPZIS-001", name: "UPZIS Petugas" },
    recordedByAssignment: { role: "UPZIS" },
    handedOverBy: null,
    receivedBy: null,
    depositedBy: { memberId: "PID-UPZIS-001", name: "UPZIS Petugas" },
  }
  const detail = serializePackageDetail(source({
    currentState: "WAITING_PC_APPROVAL",
    settlementEvidence: [
      {
        ...baseEvidence,
        evidenceCode: "GPK-202608-KEC-001-SET-001",
        revision: 1,
        actualAmount: money("11500.20"),
        packageVersionBefore: 3,
        packageVersionAfter: 4,
        supersedes: null,
        supersededBy: { evidenceCode: "GPK-202608-KEC-001-SET-002" },
        validation: {
          validationCode: "GPK-202608-KEC-001-VAL-001",
          settlementRevisionSnapshot: 1,
          expectedAmountSnapshot: money("12000.20"),
          actualAmountSnapshot: money("11500.20"),
          differenceAmount: money("-500.00"),
          result: "MISMATCH",
          validatedAt: new Date("2026-08-21T04:00:00.000Z"),
          note: "Perlu klarifikasi",
          packageVersionBefore: 4,
          packageVersionAfter: 5,
          validator: { memberId: "PID-PC-001", name: "PC Validator" },
          validatorAssignment: { role: "PC" },
        },
      },
      {
        ...baseEvidence,
        evidenceCode: "GPK-202608-KEC-001-SET-002",
        revision: 2,
        actualAmount: money("12000.20"),
        packageVersionBefore: 5,
        packageVersionAfter: 6,
        supersedes: { evidenceCode: "GPK-202608-KEC-001-SET-001" },
        supersededBy: null,
        validation: {
          validationCode: "GPK-202608-KEC-001-VAL-002",
          settlementRevisionSnapshot: 2,
          expectedAmountSnapshot: money("12000.20"),
          actualAmountSnapshot: money("12000.20"),
          differenceAmount: money("0.00"),
          result: "MATCHED",
          validatedAt: new Date("2026-08-21T05:00:00.000Z"),
          note: null,
          packageVersionBefore: 6,
          packageVersionAfter: 7,
          validator: { memberId: "PID-PC-001", name: "PC Validator" },
          validatorAssignment: { role: "PC" },
        },
      },
    ],
  }))
  assert.equal(detail.settlement.latest?.evidenceCode, "GPK-202608-KEC-001-SET-002")
  assert.equal(detail.settlement.latest?.actualAmount, "12000.20")
  assert.equal(detail.settlement.validation.status, "CURRENT")
  assert.equal(detail.settlement.validation.result, "MATCHED")
  assert.equal(detail.settlement.validation.historical.length, 2)
  assert.equal(detail.settlement.validation.historical[0]?.status, "STALE")
  assert.equal(detail.settlement.validation.historical[0]?.result, "MISMATCH")
  assert.equal(detail.settlement.validation.historical[1]?.status, "CURRENT")
  assert.equal(detail.settlement.validation.historical[1]?.difference, "0.00")
  assert.equal(JSON.stringify(detail.settlement.validation).includes("validatorUserId"), false)
})

test("final approval read model derives factual actor, timestamp, and source codes from the PC workflow event", () => {
  const detail = serializePackageDetail(source({
    currentState: "FINAL_APPROVED",
    version: 8,
    revision: 2,
    workflowEvents: [{
      previousState: "WAITING_PC_APPROVAL",
      resultingState: "FINAL_APPROVED",
      action: "APPROVE",
      stage: "PC",
      reason: null,
      reasonCode: null,
      metadata: {
        validationCode: "GPK-202608-KEC-001-VAL-002",
        settlementEvidenceCode: "GPK-202608-KEC-001-SET-002",
        packageVersionBefore: 7,
        packageVersionAfter: 8,
        packageRevision: 2,
      },
      createdAt: new Date("2026-08-21T06:00:00.000Z"),
      actor: { memberId: "PID-PC-001", name: "PC Approver" },
      actorAssignment: { role: "PC" },
    }],
  }))
  assert.equal(detail.finalApproval.approved, true)
  assert.equal(detail.finalApproval.approvedAt, "2026-08-21T06:00:00.000Z")
  assert.equal(detail.finalApproval.approvedBy?.memberId, "PID-PC-001")
  assert.equal(detail.finalApproval.sourceValidationCode, "GPK-202608-KEC-001-VAL-002")
  assert.equal(detail.finalApproval.settlementEvidenceCode, "GPK-202608-KEC-001-SET-002")
  assert.deepEqual(detail.finalApproval.packageVersion, { before: 7, after: 8 })
  assert.equal(detail.workflow.finalApproved.approved, true)
  assert.equal(detail.finalApproval.assertions.bankSettled, false)
  assert.equal(detail.finalApproval.assertions.finalClose, false)
  assert.equal(JSON.stringify(detail.finalApproval).includes("actorUserId"), false)
})
