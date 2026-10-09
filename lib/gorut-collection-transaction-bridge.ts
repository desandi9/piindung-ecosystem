import {
  GorutCollectionAuthorityStatus,
  GorutCollectionRevisionAction,
  GorutCollectionStatus,
  GorutCollectionVisitStatus,
  GorutTransactionState,
  Prisma,
  type PrismaClient,
} from "@prisma/client"
import {
  buildCollectionTransactionCode,
  GorutCollectionError,
} from "./gorut-collection-pure"
import {
  findCollection,
  publicCollection,
  revisionSnapshot,
  serializable,
} from "./gorut-collection-server"
import { stableSourceHash } from "./gorut-package-materializer-pure"

export type GorutCollectionBridgePolicy = {
  /** Business-owned collection lifecycle allow-list. Omission is intentionally fail-closed. */
  allowedCollectionStatuses?: readonly GorutCollectionStatus[]
}

export async function bridgeAuthoritativeCollectionToTransaction(
  prisma: PrismaClient,
  input: {
    collectionCode: string
    expectedVersion: number
    idempotencyKey: string
  },
  policy: GorutCollectionBridgePolicy = {},
  options: { now?: Date; maxAttempts?: number } = {},
) {
  const now = options.now ?? new Date()
  const allowedStatuses = new Set(policy.allowedCollectionStatuses ?? [])
  return serializable(prisma, async (tx) => {
    const before = await findCollection(tx, input.collectionCode)
    if (allowedStatuses.size === 0) {
      return {
        collection: publicCollection(before),
        transaction: null,
        disposition: "blocked" as const,
        idempotentReplay: false,
        blockingReasons: ["COLLECTION_BRIDGE_POLICY_UNCONFIRMED"],
      }
    }
    if (!allowedStatuses.has(before.status)) {
      return {
        collection: publicCollection(before),
        transaction: null,
        disposition: "blocked" as const,
        idempotentReplay: false,
        blockingReasons: ["COLLECTION_STATE_NOT_BRIDGE_ELIGIBLE"],
      }
    }
    if (before.amountAuthorityStatus !== GorutCollectionAuthorityStatus.AUTHORITATIVE) {
      throw new GorutCollectionError("COLLECTION_FINANCIAL_INCOMPLETE", "Collection amount facts are not authoritative.")
    }
    if (!before.entries.length || before.entries.some((entry) => entry.visitStatus === GorutCollectionVisitStatus.PENDING)) {
      throw new GorutCollectionError("COLLECTION_STATE_INVALID", "Collection entries are incomplete for transaction bridge.")
    }
    const commandHash = stableSourceHash({
      action: "BRIDGE_TRANSACTION",
      collectionCode: before.collectionCode,
      sourceHash: before.sourceHash,
    })
    const existingCommand = await tx.gorutCollectionRevision.findUnique({
      where: { batchId_idempotencyKey: { batchId: before.id, idempotencyKey: input.idempotencyKey } },
      select: { action: true, commandHash: true },
    })
    if (existingCommand && existingCommand.commandHash !== commandHash) {
      throw new GorutCollectionError("COLLECTION_IDEMPOTENCY_CONFLICT", "Bridge idempotency key was reused with changed source facts.")
    }
    if (before.transactionId) {
      const transaction = await tx.gorutTransaction.findUniqueOrThrow({
        where: { id: before.transactionId },
        select: {
          id: true,
          code: true,
          currentState: true,
          totalAmount: true,
          packageMembership: {
            select: {
              package: {
                select: { currentState: true, lockedAt: true, rosterFrozenAt: true },
              },
            },
          },
        },
      })
      if (before.transactionSourceHash !== before.sourceHash) {
        if (before.version !== input.expectedVersion) {
          throw new GorutCollectionError("COLLECTION_VERSION_CONFLICT", "Collection version does not match expectedVersion.")
        }
        const packageRow = transaction.packageMembership?.package
        if (
          transaction.currentState !== GorutTransactionState.DRAFT ||
          (packageRow && (
            packageRow.currentState !== GorutTransactionState.DRAFT ||
            packageRow.lockedAt ||
            packageRow.rosterFrozenAt
          ))
        ) {
          throw new GorutCollectionError(
            "COLLECTION_SOURCE_CONFLICT",
            "Collection changed after transaction bridge and its submitted or locked package requires the explicit correction workflow.",
          )
        }

        const recordedAmount = before.entries.reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0))
        await tx.gorutTransaction.update({
          where: { id: transaction.id },
          data: { totalAmount: recordedAmount, updatedAt: now },
        })
        for (const entry of before.entries) {
          await tx.gorutTransactionItem.upsert({
            where: { transactionId_munfiqId: { transactionId: transaction.id, munfiqId: entry.munfiqId } },
            create: {
              transactionId: transaction.id,
              munfiqId: entry.munfiqId,
              amount: entry.amount,
              periodLabel: before.periodStart.toISOString().slice(0, 7),
              notes: entry.note,
              createdAt: now,
            },
            update: {
              amount: entry.amount,
              periodLabel: before.periodStart.toISOString().slice(0, 7),
              notes: entry.note,
            },
          })
        }
        const nextRevision = before.revision + 1
        await tx.gorutCollectionBatch.update({
          where: { id: before.id, version: before.version },
          data: {
            transactionSourceRevision: before.revision,
            transactionSourceHash: before.sourceHash,
            transactionBridgedAt: now,
            version: { increment: 1 },
            revision: nextRevision,
            updatedAt: now,
          },
        })
        const after = await findCollection(tx, before.collectionCode)
        await tx.gorutCollectionRevision.create({
          data: {
            batchId: before.id,
            revision: nextRevision,
            action: GorutCollectionRevisionAction.BRIDGE_TRANSACTION,
            idempotencyKey: input.idempotencyKey,
            commandHash,
            actorUserId: before.createdByUserId,
            reason: "Pre-submit authoritative source reconciliation",
            beforeSnapshot: revisionSnapshot(before),
            afterSnapshot: revisionSnapshot(after),
            createdAt: now,
          },
        })
        return {
          collection: publicCollection(after),
          transaction: {
            transactionCode: transaction.code,
            currentState: transaction.currentState,
            recordedAmount: recordedAmount.toFixed(2),
            recordedAmountSemantic: "Jumlah Tercatat" as const,
          },
          disposition: "reconciled" as const,
          idempotentReplay: false,
          blockingReasons: [],
        }
      }
      return {
        collection: publicCollection(before),
        transaction: {
          transactionCode: transaction.code,
          currentState: transaction.currentState,
          recordedAmount: transaction.totalAmount.toFixed(2),
          recordedAmountSemantic: "Jumlah Tercatat" as const,
        },
        disposition: "existing" as const,
        idempotentReplay: true,
        blockingReasons: [],
      }
    }
    if (before.version !== input.expectedVersion) {
      throw new GorutCollectionError("COLLECTION_VERSION_CONFLICT", "Collection version does not match expectedVersion.")
    }

    const recordedAmount = before.entries.reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0))
    const transactionCode = buildCollectionTransactionCode(before.collectionCode)
    const transaction = await tx.gorutTransaction.create({
      data: {
        code: transactionCode,
        transactionDate: before.periodStart,
        totalAmount: recordedAmount,
        sourceChannel: "AUTHORITATIVE_COLLECTION",
        notes: `Source collection: ${before.collectionCode}`,
        currentState: GorutTransactionState.DRAFT,
        kecamatanId: before.kecamatanId,
        rantingId: before.rantingId,
        plpkId: before.plpkId,
        createdByUserId: before.createdByUserId,
        items: {
          create: before.entries.map((entry) => ({
            munfiqId: entry.munfiqId,
            amount: entry.amount,
            periodLabel: before.periodStart.toISOString().slice(0, 7),
            notes: entry.note,
          })),
        },
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, code: true, currentState: true, totalAmount: true },
    })
    const nextRevision = before.revision + 1
    await tx.gorutCollectionBatch.update({
      where: { id: before.id, version: before.version },
      data: {
        transactionId: transaction.id,
        transactionSourceRevision: before.revision,
        transactionSourceHash: before.sourceHash,
        transactionBridgedAt: now,
        version: { increment: 1 },
        revision: nextRevision,
        updatedAt: now,
      },
    })
    const after = await findCollection(tx, before.collectionCode)
    await tx.gorutCollectionRevision.create({
      data: {
        batchId: before.id,
        revision: nextRevision,
        action: GorutCollectionRevisionAction.BRIDGE_TRANSACTION,
        idempotencyKey: input.idempotencyKey,
        commandHash,
        actorUserId: before.createdByUserId,
        beforeSnapshot: revisionSnapshot(before),
        afterSnapshot: revisionSnapshot(after),
        createdAt: now,
      },
    })
    return {
      collection: publicCollection(after),
      transaction: {
        transactionCode: transaction.code,
        currentState: transaction.currentState,
        recordedAmount: transaction.totalAmount.toFixed(2),
        recordedAmountSemantic: "Jumlah Tercatat" as const,
      },
      disposition: "created" as const,
      idempotentReplay: false,
      blockingReasons: [],
    }
  }, options.maxAttempts ?? 3)
}
