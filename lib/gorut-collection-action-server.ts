import type { PrismaClient } from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
import {
  confirmAndSubmitCollectionByPlpk,
  decideCollectionByKordes,
} from "./gorut-collection-server"
import {
  resolveGorutProvisionalFeeRuntime,
  type GorutProvisionalFeeRuntime,
} from "./gorut-provisional-plpk-fee-policy"
import { assertGorutCollectionMutationRuntime, type ParsedCollectionAction } from "./gorut-collection-api-pure"
import { reconcileVerifiedCollection } from "./gorut-verified-collection-reconciliation"

export function assertGorutCollectionApiMutationAllowed(
  runtime: GorutProvisionalFeeRuntime = resolveGorutProvisionalFeeRuntime(),
) {
  assertGorutCollectionMutationRuntime(runtime)
}

export async function executeGorutCollectionApiAction(
  prisma: PrismaClient,
  context: GorutOperationalContext,
  collectionCode: string,
  command: ParsedCollectionAction,
  options: { runtime?: GorutProvisionalFeeRuntime } = {},
) {
  assertGorutCollectionApiMutationAllowed(options.runtime)
  if (command.action === "CONFIRM_AND_SUBMIT") {
    return confirmAndSubmitCollectionByPlpk(prisma, context, {
      collectionCode,
      expectedVersion: command.expectedVersion,
      idempotencyKey: command.idempotencyKey,
    })
  }
  const decision = await decideCollectionByKordes(prisma, context, {
    collectionCode,
    decision: command.action === "VERIFY_BY_KORDES" ? "VERIFY" : "CORRECTION",
    moneyMatches: command.moneyMatches,
    hasDamagedMoney: command.hasDamagedMoney,
    cashReceived: command.cashReceived,
    note: command.action === "VERIFY_BY_KORDES" ? command.note : command.reason,
    correctionMunfiqCodes: command.action === "RETURN_FOR_CORRECTION" ? command.correctionMunfiqCodes : undefined,
    expectedVersion: command.expectedVersion,
    idempotencyKey: command.idempotencyKey,
  })
  if (command.action !== "VERIFY_BY_KORDES") return decision
  return {
    ...decision,
    reconciliation: await reconcileVerifiedCollection(prisma, collectionCode, {
      runtime: options.runtime,
    }),
  }
}
