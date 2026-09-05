import assert from "node:assert/strict"
import test from "node:test"
import { GorutTransactionState, GorutWorkflowAction } from "@prisma/client"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { calculateGorutPackageAvailableActions, gorutPhase2bActions, phase2bTargetState, validateGorutReturnReason } from "./gorut-package-workflow-pure.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { parseTransitionBody } from "./gorut-package-workflow-api-pure.ts"
import type { GorutOperationalContext } from "./gorut/server-pure.ts"

const runtime = { deploymentEnvironment: "STAGING" as const, enabled: true }
const upzis = (userId = "upzis-1"): GorutOperationalContext => ({
  userId,
  assignmentId: `assignment-${userId}`,
  operationalRole: "UPZIS",
  kecamatanId: "kecamatan-1",
  rantingId: null,
  plpkId: null,
})
const pc = (): GorutOperationalContext => ({
  userId: "pc-1",
  assignmentId: "assignment-pc-1",
  operationalRole: "PC",
  kecamatanId: null,
  rantingId: null,
  plpkId: null,
})

function pcAvailability(packageState: GorutTransactionState = GorutTransactionState.WAITING_PC_APPROVAL) {
  return calculateGorutPackageAvailableActions(pc(), runtime, {
    packageState,
    scopeMatches: false,
    packageEligible: true,
    hasOpenCorrections: false,
    submitterUserId: "upzis-maker",
    blockingReasons: [],
  })
}

void test("minimum Phase 2B matrix exposes only approved transitions", () => {
  assert.equal(phase2bTargetState(GorutTransactionState.DRAFT, GorutWorkflowAction.SUBMIT), GorutTransactionState.WAITING_UPZIS_VERIFICATION)
  assert.equal(phase2bTargetState(GorutTransactionState.RETURNED_TO_RANTING, GorutWorkflowAction.SUBMIT), GorutTransactionState.WAITING_UPZIS_VERIFICATION)
  assert.equal(phase2bTargetState(GorutTransactionState.WAITING_UPZIS_VERIFICATION, GorutWorkflowAction.APPROVE), GorutTransactionState.WAITING_PC_APPROVAL)
  assert.equal(phase2bTargetState(GorutTransactionState.WAITING_PC_APPROVAL, GorutWorkflowAction.APPROVE), null)
  assert.equal(phase2bTargetState(GorutTransactionState.WAITING_UPZIS_VERIFICATION, GorutWorkflowAction.RETURN), GorutTransactionState.RETURNED_TO_RANTING)
  assert.equal(gorutPhase2bActions.includes(GorutWorkflowAction.REJECT as never), false)
  assert.equal(gorutPhase2bActions.includes(GorutWorkflowAction.FINAL_CLOSE as never), false)
})

void test("PC finalization remains explicitly out of scope and fail-closed", () => {
  const result = pcAvailability()
  assert.deepEqual(result.availableActions, [])
  assert.deepEqual(result.blockingReasons, ["PC_FINALIZATION_OUT_OF_SCOPE"])
})

void test("FINAL_APPROVED exposes no RETURN, REJECT, FINAL_CLOSE, or further workflow action", () => {
  const result = pcAvailability(GorutTransactionState.FINAL_APPROVED)
  assert.deepEqual(result.availableActions, [])
  assert.deepEqual(result.blockingReasons, ["PACKAGE_ALREADY_FINAL_APPROVED"])
  assert.equal(phase2bTargetState(GorutTransactionState.FINAL_APPROVED, GorutWorkflowAction.APPROVE), null)
  assert.equal(phase2bTargetState(GorutTransactionState.WAITING_PC_APPROVAL, GorutWorkflowAction.RETURN), null)
  assert.equal(phase2bTargetState(GorutTransactionState.WAITING_PC_APPROVAL, GorutWorkflowAction.REJECT as never), null)
  assert.equal(phase2bTargetState(GorutTransactionState.WAITING_PC_APPROVAL, GorutWorkflowAction.FINAL_CLOSE as never), null)
})

void test("APPROVE API accepts only command facts and rejects server-owned fields", () => {
  const command = { action: "APPROVE", expectedVersion: 7, idempotencyKey: "approve-1" }
  assert.deepEqual(parseTransitionBody(command), command)
  for (const forged of [
    { toState: "FINAL_APPROVED" },
    { finalApprovedAt: "2026-08-21T00:00:00.000Z" },
    { approverActorId: "user-1" },
    { validationResult: "MATCHED" },
    { expectedAmount: "27500.00" },
    { actualAmount: "27500.00" },
    { netAmount: "27500.00" },
  ]) assert.equal(parseTransitionBody({ ...command, ...forged }), null)
})

void test("availableActions are server-derived and enforce maker-checker", () => {
  const submittedByMaker = calculateGorutPackageAvailableActions(upzis("maker"), runtime, {
    packageState: GorutTransactionState.WAITING_UPZIS_VERIFICATION,
    scopeMatches: true,
    packageEligible: true,
    hasOpenCorrections: false,
    submitterUserId: "maker",
    blockingReasons: [],
  })
  assert.deepEqual(submittedByMaker.availableActions, [GorutWorkflowAction.RETURN])
  assert.ok(submittedByMaker.blockingReasons.includes("MAKER_CHECKER_REQUIRED"))

  const checker = calculateGorutPackageAvailableActions(upzis("checker"), runtime, {
    packageState: GorutTransactionState.WAITING_UPZIS_VERIFICATION,
    scopeMatches: true,
    packageEligible: true,
    hasOpenCorrections: false,
    submitterUserId: "maker",
    blockingReasons: [],
  })
  assert.deepEqual(checker.availableActions, [GorutWorkflowAction.APPROVE, GorutWorkflowAction.RETURN])

  const correctedReturn = calculateGorutPackageAvailableActions(upzis("maker"), runtime, {
    packageState: GorutTransactionState.RETURNED_TO_RANTING,
    scopeMatches: true,
    packageEligible: true,
    hasOpenCorrections: true,
    submitterUserId: "maker",
    blockingReasons: [],
  })
  assert.deepEqual(correctedReturn.availableActions, [GorutWorkflowAction.SUBMIT])
})

void test("production remains fail closed even when an enable flag is attempted", () => {
  const result = calculateGorutPackageAvailableActions(upzis(), { deploymentEnvironment: "PRODUCTION", enabled: true }, {
    packageState: GorutTransactionState.DRAFT,
    scopeMatches: true,
    packageEligible: true,
    hasOpenCorrections: false,
    submitterUserId: null,
    blockingReasons: [],
  })
  assert.deepEqual(result.availableActions, [])
  assert.ok(result.blockingReasons.includes("PROVISIONAL_FEE_POLICY_DISABLED"))
})

void test("RETURN reason V1 requires free text only for OTHER", () => {
  assert.equal(validateGorutReturnReason("AMOUNT_MISMATCH", null), true)
  assert.equal(validateGorutReturnReason("OTHER", "Penjelasan khusus"), true)
  assert.equal(validateGorutReturnReason("OTHER", "  "), false)
  assert.equal(validateGorutReturnReason("UNKNOWN", "reason"), false)
})
