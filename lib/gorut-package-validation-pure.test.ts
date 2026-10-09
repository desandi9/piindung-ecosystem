import assert from "node:assert/strict"
import test from "node:test"
import {
  GorutOperationalRole,
  GorutPackageFinancialStatus,
  GorutPackageSettlementValidationResult,
  GorutTransactionState,
} from "@prisma/client"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { parseGorutPackageValidationBody } from "./gorut-package-validation-api-pure.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { calculateGorutFinalApprovalReadiness, calculateGorutPackageValidationAvailability, calculateGorutValidationAmounts } from "./gorut-package-validation-pure.ts"
import type { GorutOperationalContext } from "./gorut/server-pure.ts"

const runtime = { deploymentEnvironment: "UAT" as const, enabled: true }

function context(role: GorutOperationalRole): GorutOperationalContext {
  return {
    userId: `user-${role}`,
    assignmentId: `assignment-${role}`,
    operationalRole: role,
    kecamatanId: role === GorutOperationalRole.UPZIS ? "kecamatan-1" : null,
    rantingId: null,
    plpkId: null,
  }
}

const facts = {
  currentState: GorutTransactionState.WAITING_PC_APPROVAL,
  financialStatus: GorutPackageFinancialStatus.READY,
  financialSourceClean: true,
  isHistorical: false,
  hasCurrentSettlement: true,
  currentValidationResult: null,
}

test("V1 amount comparison uses Decimal with zero tolerance", () => {
  assert.deepEqual(calculateGorutValidationAmounts("27500.00", "27500.00"), {
    expectedAmount: "27500.00",
    actualAmount: "27500.00",
    differenceAmount: "0.00",
    result: GorutPackageSettlementValidationResult.MATCHED,
  })
  assert.deepEqual(calculateGorutValidationAmounts("27500.00", "27000.00"), {
    expectedAmount: "27500.00",
    actualAmount: "27000.00",
    differenceAmount: "-500.00",
    result: GorutPackageSettlementValidationResult.MISMATCH,
  })
  assert.deepEqual(calculateGorutValidationAmounts("27500.00", "28000.00"), {
    expectedAmount: "27500.00",
    actualAmount: "28000.00",
    differenceAmount: "500.00",
    result: GorutPackageSettlementValidationResult.MISMATCH,
  })
})

test("only PC gets VALIDATE_SETTLEMENT and no maker-checker blocker is added", () => {
  const pc = calculateGorutPackageValidationAvailability(context(GorutOperationalRole.PC), runtime, facts)
  assert.deepEqual(pc.availableActions, ["VALIDATE_SETTLEMENT"])
  assert.equal(pc.blockingReasons.some((reason) => reason.includes("MAKER_CHECKER")), false)

  const upzis = calculateGorutPackageValidationAvailability(context(GorutOperationalRole.UPZIS), runtime, facts)
  assert.deepEqual(upzis.availableActions, [])
  assert.equal(upzis.blockingReasons.includes("PC_VALIDATOR_ASSIGNMENT_REQUIRED"), true)
})

test("current validation cannot be repeated until factual settlement changes", () => {
  const matched = calculateGorutPackageValidationAvailability(context(GorutOperationalRole.PC), runtime, {
    ...facts,
    currentValidationResult: GorutPackageSettlementValidationResult.MATCHED,
  })
  assert.deepEqual(matched.availableActions, [])
  assert.equal(matched.blockingReasons.includes("SETTLEMENT_VALIDATION_ALREADY_MATCHED"), true)

  const mismatch = calculateGorutPackageValidationAvailability(context(GorutOperationalRole.PC), runtime, {
    ...facts,
    currentValidationResult: GorutPackageSettlementValidationResult.MISMATCH,
  })
  assert.deepEqual(mismatch.availableActions, [])
  assert.equal(mismatch.blockingReasons.includes("SETTLEMENT_AMOUNT_MISMATCH"), true)
  assert.equal(mismatch.blockingReasons.includes("SETTLEMENT_VALIDATION_REQUIRES_NEW_EVIDENCE"), true)
})

test("final approval readiness is factual only and requires current MATCHED validation", () => {
  assert.deepEqual(calculateGorutFinalApprovalReadiness(runtime, facts), {
    status: "BLOCKED",
    blockingReasons: ["CURRENT_SETTLEMENT_VALIDATION_MISSING"],
  })
  assert.deepEqual(calculateGorutFinalApprovalReadiness(runtime, {
    ...facts,
    currentValidationResult: GorutPackageSettlementValidationResult.MATCHED,
  }), { status: "READY", blockingReasons: [] })
  const mismatch = calculateGorutFinalApprovalReadiness(runtime, {
    ...facts,
    currentValidationResult: GorutPackageSettlementValidationResult.MISMATCH,
  })
  assert.equal(mismatch.status, "BLOCKED")
  assert.equal(mismatch.blockingReasons.includes("SETTLEMENT_AMOUNT_MISMATCH"), true)
})

test("validation parser requires evidence selection and rejects forged authority fields", () => {
  assert.deepEqual(parseGorutPackageValidationBody({
    settlementEvidenceCode: "GPK-202608-KEC-SET-001",
    note: "Bukti dan nominal diperiksa",
    expectedVersion: 4,
    idempotencyKey: "validation:intent:1",
  }), {
    settlementEvidenceCode: "GPK-202608-KEC-SET-001",
    note: "Bukti dan nominal diperiksa",
    expectedVersion: 4,
    idempotencyKey: "validation:intent:1",
  })
  for (const forged of [
    { result: "MATCHED" },
    { expectedAmount: "27500.00" },
    { actualAmount: "27500.00" },
    { difference: "0.00" },
    { validatorUserId: "database-id" },
    { toState: "FINAL_APPROVED" },
  ]) {
    assert.equal(parseGorutPackageValidationBody({
      settlementEvidenceCode: "GPK-202608-KEC-SET-001",
      expectedVersion: 4,
      idempotencyKey: "validation:intent:forged",
      ...forged,
    }), null)
  }
})
