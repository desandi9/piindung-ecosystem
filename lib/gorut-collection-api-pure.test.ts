import assert from "node:assert/strict"
import test from "node:test"
import { GorutCollectionStatus } from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { GorutCollectionError } from "./gorut-collection-pure.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { assertGorutCollectionMutationRuntime, calculateGorutCollectionAvailableActions, calculateGorutCollectionEntryActions, collectionReadScopeWhere, isGorutDecimalString, mapGorutCollectionError, parseCollectionActionBody, parseCollectionCreateBody, parseCollectionEntryBody } from "./gorut-collection-api-pure.ts"

const enabledRuntime = { deploymentEnvironment: "UAT" as const, enabled: true }
const productionRuntime = { deploymentEnvironment: "PRODUCTION" as const, enabled: true }

function context(
  role: GorutOperationalContext["operationalRole"],
  scope: Partial<Pick<GorutOperationalContext, "kecamatanId" | "rantingId" | "plpkId">> = {},
): GorutOperationalContext {
  return {
    userId: `user-${role}`,
    assignmentId: `assignment-${role}`,
    operationalRole: role,
    kecamatanId: scope.kecamatanId ?? null,
    rantingId: scope.rantingId ?? null,
    plpkId: scope.plpkId ?? null,
  }
}

const baseFacts = {
  status: GorutCollectionStatus.COLLECTING,
  plpkId: "plpk-1",
  rantingId: "ranting-1",
  entryCount: 1,
  hasPendingEntry: false,
  hasInvalidCollectedAmount: false,
  openCorrectionCount: 0,
  openCorrectionMunfiqCodes: [] as string[],
}

void test("collection API accepts decimal strings only", () => {
  for (const value of ["0", "0.00", "7000.00", "7001.25", "99999999999999999.99"]) {
    assert.equal(isGorutDecimalString(value), true, value)
  }
  for (const value of [7001, -1, "-1", "7,001", "1e3", "01", "1.001", "100000000000000000.00"]) {
    assert.equal(isGorutDecimalString(value), false, String(value))
  }
  assert.ok(parseCollectionEntryBody({
    visitStatus: "COLLECTED",
    amount: "7001.25",
    note: null,
    reason: null,
    expectedVersion: 1,
    idempotencyKey: "entry-1",
  }))
  assert.equal(parseCollectionEntryBody({
    visitStatus: "COLLECTED",
    amount: 7001.25,
    note: null,
    reason: null,
    expectedVersion: 1,
    idempotencyKey: "entry-1",
  }), null)
})

void test("strict commands reject client-controlled identity, timestamp, and policy fields", () => {
  assert.deepEqual(parseCollectionCreateBody({ period: "2026-08", expectedVersion: 0, idempotencyKey: "create-1" }), {
    period: "2026-08",
    expectedVersion: 0,
    idempotencyKey: "create-1",
  })
  assert.equal(parseCollectionCreateBody({ period: "2026-08", expectedVersion: 0, idempotencyKey: "create-1", plpkId: "forged" }), null)
  assert.equal(parseCollectionCreateBody({ period: "2026-08", expectedVersion: 0, idempotencyKey: "create-1", userId: "forged" }), null)
  assert.equal(parseCollectionCreateBody({ period: "2026-13", expectedVersion: 0, idempotencyKey: "create-1" }), null)
  assert.equal(parseCollectionActionBody({
    action: "CONFIRM_AND_SUBMIT",
    expectedVersion: 2,
    idempotencyKey: "confirm-1",
    confirmedByPlpkAt: "2026-08-20T00:00:00.000Z",
  }), null)
  assert.equal(parseCollectionActionBody({
    action: "CONFIRM_AND_SUBMIT",
    expectedVersion: 2,
    idempotencyKey: "confirm-2",
    actorUserId: "forged",
  }), null)
  assert.equal(parseCollectionActionBody({
    action: "VERIFY_BY_KORDES",
    expectedVersion: 3,
    idempotencyKey: "verify-forged-kordes",
    moneyMatches: true,
    hasDamagedMoney: false,
    cashReceived: true,
    note: null,
    kordesId: "forged",
  }), null)
  assert.equal(parseCollectionActionBody({
    action: "VERIFY_BY_KORDES",
    expectedVersion: 3,
    idempotencyKey: "verify-1",
    moneyMatches: true,
    hasDamagedMoney: false,
    cashReceived: true,
    note: null,
    enableProvisionalPolicy: true,
  }), null)
})

void test("read scope follows the authenticated operational assignment", () => {
  assert.deepEqual(collectionReadScopeWhere(context("PC")), {})
  assert.deepEqual(collectionReadScopeWhere(context("UPZIS", { kecamatanId: "kec-1" })), { kecamatanId: "kec-1" })
  assert.deepEqual(collectionReadScopeWhere(context("RANTING", { rantingId: "ranting-1" })), { rantingId: "ranting-1" })
  assert.deepEqual(collectionReadScopeWhere(context("PLPK", { plpkId: "plpk-1" })), { plpkId: "plpk-1" })
})

void test("PLPK actions are own-scope and production policy is fail-closed", () => {
  const own = calculateGorutCollectionAvailableActions(context("PLPK", { plpkId: "plpk-1" }), enabledRuntime, baseFacts)
  assert.deepEqual(own.availableActions, ["RECORD_ENTRY", "CONFIRM_AND_SUBMIT"])
  const other = calculateGorutCollectionAvailableActions(context("PLPK", { plpkId: "plpk-2" }), enabledRuntime, baseFacts)
  assert.deepEqual(other.availableActions, [])
  assert.ok(other.blockingReasons.includes("PLPK_SCOPE_REQUIRED"))
  const production = calculateGorutCollectionAvailableActions(context("PLPK", { plpkId: "plpk-1" }), productionRuntime, baseFacts)
  assert.deepEqual(production.availableActions, [])
  assert.ok(production.blockingReasons.includes("PROVISIONAL_FEE_POLICY_DISABLED"))
  assert.throws(
    () => assertGorutCollectionMutationRuntime(productionRuntime, enabledRuntime),
    { name: "GorutProvisionalFeePolicyDisabledError" },
  )
  assert.throws(
    () => assertGorutCollectionMutationRuntime(enabledRuntime, productionRuntime),
    { name: "GorutProvisionalFeePolicyDisabledError" },
  )
})

void test("Kordes actions require own Ranting and waiting state", () => {
  const waiting = { ...baseFacts, status: GorutCollectionStatus.WAITING_KORDES_VERIFICATION }
  const own = calculateGorutCollectionAvailableActions(context("RANTING", { rantingId: "ranting-1" }), enabledRuntime, waiting)
  assert.deepEqual(own.availableActions, ["VERIFY_BY_KORDES", "RETURN_FOR_CORRECTION"])
  const other = calculateGorutCollectionAvailableActions(context("RANTING", { rantingId: "ranting-2" }), enabledRuntime, waiting)
  assert.deepEqual(other.availableActions, [])
})

void test("correction entry action is limited to an explicit open target", () => {
  const correcting = {
    ...baseFacts,
    status: GorutCollectionStatus.NEEDS_CORRECTION,
    openCorrectionCount: 1,
    openCorrectionMunfiqCodes: ["M-001"],
  }
  const plpk = context("PLPK", { plpkId: "plpk-1" })
  assert.deepEqual(calculateGorutCollectionEntryActions(plpk, enabledRuntime, correcting, "M-001"), ["RECORD_ENTRY"])
  assert.deepEqual(calculateGorutCollectionEntryActions(plpk, enabledRuntime, correcting, "M-002"), [])
})

void test("domain errors are mapped and raw infrastructure errors never leak", () => {
  const conflict = mapGorutCollectionError(new GorutCollectionError("COLLECTION_VERSION_CONFLICT", "version mismatch"))
  assert.equal(conflict.status, 409)
  assert.equal(conflict.body.code, "COLLECTION_VERSION_CONFLICT")
  const raw = mapGorutCollectionError(new Error("password=secret postgresql://private"))
  assert.deepEqual(raw, { status: 500, body: { error: "Collection GORUT tidak dapat diproses." } })
})
