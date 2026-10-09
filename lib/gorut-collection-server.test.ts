import assert from "node:assert/strict"
import test from "node:test"
import { Prisma, type PrismaClient } from "@prisma/client"
import { createAuthoritativeCollection } from "./gorut-collection-server"

type InteractiveTransactionOptions = {
  isolationLevel?: Prisma.TransactionIsolationLevel
  maxWait?: number
  timeout?: number
}

test("collection commands extend the interactive transaction window for remote staging databases", async () => {
  const stopped = new Error("stop-before-database-work")
  let transactionOptions: InteractiveTransactionOptions | undefined
  const prisma = {
    $transaction: async (_run: unknown, options: InteractiveTransactionOptions | undefined) => {
      transactionOptions = options
      throw stopped
    },
  } as unknown as PrismaClient

  await assert.rejects(
    createAuthoritativeCollection(prisma, {
      userId: "test-user",
      assignmentId: "test-assignment",
      operationalRole: "PLPK",
      kecamatanId: null,
      rantingId: null,
      plpkId: "test-plpk",
    }, {
      period: "2026-09",
      idempotencyKey: "test-collection-transaction-timeout",
    }),
    (error: unknown) => error === stopped,
  )

  assert.deepEqual(transactionOptions, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 60_000,
  })
})
