import assert from "node:assert/strict"
import test from "node:test"
import {
  GorutOperationalRole,
  GorutPackageFinancialStatus,
  GorutPackageSettlementMode,
  GorutTransactionState,
} from "@prisma/client"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { parseGorutPackageSettlementBody } from "./gorut-package-settlement-api-pure.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { calculateGorutPackageSettlementAvailability } from "./gorut-package-settlement-pure.ts"
import type { GorutOperationalContext } from "./gorut/server-pure.ts"

const runtime = { deploymentEnvironment: "UAT" as const, enabled: true }

function context(role: GorutOperationalRole, kecamatanId: string | null = null): GorutOperationalContext {
  return {
    userId: `user-${role}`,
    assignmentId: `assignment-${role}`,
    operationalRole: role,
    kecamatanId,
    rantingId: null,
    plpkId: null,
  }
}

const facts = {
  currentState: GorutTransactionState.WAITING_PC_APPROVAL,
  financialStatus: GorutPackageFinancialStatus.READY,
  netAmountAvailable: true,
  isHistorical: false,
  kecamatanId: "kecamatan-1",
}

test("settlement capabilities are server-derived by factual mode actor", () => {
  assert.deepEqual(
    calculateGorutPackageSettlementAvailability(context(GorutOperationalRole.PC), runtime, facts).availableActions,
    ["RECORD_PC_PICKUP"],
  )
  assert.deepEqual(
    calculateGorutPackageSettlementAvailability(context(GorutOperationalRole.UPZIS, "kecamatan-1"), runtime, facts).availableActions,
    ["RECORD_BANK_DEPOSIT"],
  )
  const wrongScope = calculateGorutPackageSettlementAvailability(context(GorutOperationalRole.UPZIS, "kecamatan-2"), runtime, facts)
  assert.deepEqual(wrongScope.availableActions, [])
  assert.equal(wrongScope.blockingReasons.includes("UPZIS_PACKAGE_SCOPE_REQUIRED"), true)
})

test("settlement capabilities fail closed outside WAITING_PC_APPROVAL and production provisional policy", () => {
  const draft = calculateGorutPackageSettlementAvailability(context(GorutOperationalRole.PC), runtime, {
    ...facts,
    currentState: GorutTransactionState.DRAFT,
  })
  assert.deepEqual(draft.availableActions, [])
  assert.equal(draft.blockingReasons.includes("PACKAGE_NOT_WAITING_PC_APPROVAL"), true)

  const production = calculateGorutPackageSettlementAvailability(
    context(GorutOperationalRole.PC),
    { deploymentEnvironment: "PRODUCTION", enabled: true },
    facts,
  )
  assert.deepEqual(production.availableActions, [])
  assert.equal(production.blockingReasons.includes("PROVISIONAL_FEE_POLICY_DISABLED"), true)
})

test("PC pickup parser accepts factual public fields and rejects forged authority", () => {
  const parsed = parseGorutPackageSettlementBody({
    mode: GorutPackageSettlementMode.PC_PICKUP,
    actualAmount: "27000.00",
    occurredAt: "2026-08-21T03:00:00.000Z",
    handedOverByMemberId: "PID-AAAAAAAAAA2P",
    evidenceReference: "BA-UPZIS-PC-001",
    expectedVersion: 3,
    idempotencyKey: "intent:settlement:pickup:1",
  })
  assert.equal(parsed?.mode, GorutPackageSettlementMode.PC_PICKUP)
  assert.equal(parsed?.actualAmount, "27000.00")

  assert.equal(parseGorutPackageSettlementBody({
    mode: GorutPackageSettlementMode.PC_PICKUP,
    actualAmount: "27000.00",
    occurredAt: "2026-08-21T03:00:00.000Z",
    handedOverByMemberId: "PID-AAAAAAAAAA2P",
    expectedAmount: "27500.00",
    expectedVersion: 3,
    idempotencyKey: "intent:settlement:pickup:2",
  }), null)
  assert.equal(parseGorutPackageSettlementBody({
    mode: GorutPackageSettlementMode.PC_PICKUP,
    actualAmount: "27000.00",
    occurredAt: "2026-08-21T03:00:00.000Z",
    handedOverByMemberId: "PID-AAAAAAAAAA2P",
    receivedByUserId: "forged-db-id",
    expectedVersion: 3,
    idempotencyKey: "intent:settlement:pickup:3",
  }), null)
})

test("bank parser keeps decimal strings strict and BNI optional server-side", () => {
  const parsed = parseGorutPackageSettlementBody({
    mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
    actualAmount: "27500",
    occurredAt: "2026-08-21T04:00:00.000Z",
    externalReference: "BNI-TRX-001",
    expectedVersion: 3,
    idempotencyKey: "intent:settlement:bank:1",
  })
  assert.equal(parsed?.mode, GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT)
  assert.equal(parsed?.bankName, null)
  for (const amount of ["27,500", "2.75e4", "-1", "1.234", 27500]) {
    assert.equal(parseGorutPackageSettlementBody({
      mode: GorutPackageSettlementMode.UPZIS_BANK_DEPOSIT,
      actualAmount: amount,
      occurredAt: "2026-08-21T04:00:00.000Z",
      expectedVersion: 3,
      idempotencyKey: "intent:settlement:bank:invalid",
    }), null)
  }
})
