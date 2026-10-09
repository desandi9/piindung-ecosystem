import { GorutCollectionVisitStatus, Prisma, type PrismaClient } from "@prisma/client"
import type { GorutMunfiqSelfContext } from "./gorut-munfiq-identity-pure"
import { buildGorutMunfiqTimeline, currentGorutMunfiqStatus } from "./gorut-munfiq-transparency-pure"

const selfEntrySelect = {
  id: true,
  visitStatus: true,
  amount: true,
  collectedAt: true,
  createdAt: true,
  batch: {
    select: {
      collectionCode: true,
      periodStart: true,
      submittedToKordesAt: true,
      verifiedByKordesAt: true,
      plpk: { select: { code: true, name: true } },
      ranting: { select: { name: true, kecamatan: { select: { name: true } } } },
      transaction: {
        select: {
          packageMembership: {
            select: {
              package: {
                select: {
                  workflowEvents: {
                    where: {
                      OR: [
                        { action: "SUBMIT", stage: "UPZIS", resultingState: "WAITING_UPZIS_VERIFICATION" },
                        { action: "APPROVE", stage: "UPZIS", resultingState: "WAITING_PC_APPROVAL" },
                        { action: "APPROVE", stage: "PC", resultingState: "FINAL_APPROVED" },
                      ],
                    },
                    select: { action: true, stage: true, resultingState: true, createdAt: true },
                    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.GorutCollectionEntrySelect

type SelfEntry = Prisma.GorutCollectionEntryGetPayload<{ select: typeof selfEntrySelect }>

function serializeSelfEntry(entry: SelfEntry) {
  const workflowEvents = entry.batch.transaction?.packageMembership?.package.workflowEvents ?? []
  const timeline = buildGorutMunfiqTimeline({
    visitStatus: entry.visitStatus,
    entryCreatedAt: entry.createdAt,
    collectedAt: entry.collectedAt,
    submittedToKordesAt: entry.batch.submittedToKordesAt,
    verifiedByKordesAt: entry.batch.verifiedByKordesAt,
    workflowEvents,
  })
  const current = currentGorutMunfiqStatus(timeline)
  return {
    collectionCode: entry.batch.collectionCode,
    periodStart: entry.batch.periodStart.toISOString().slice(0, 10),
    amount: entry.amount.toFixed(2),
    currency: "IDR" as const,
    status: current?.label ?? null,
    statusAt: current?.at ?? null,
    historicalPlpk: { code: entry.batch.plpk.code, name: entry.batch.plpk.name },
    location: {
      ranting: entry.batch.ranting.name,
      kecamatan: entry.batch.ranting.kecamatan.name,
    },
    timeline,
  }
}

const visibleEntryWhere: Prisma.GorutCollectionEntryWhereInput = {
  visitStatus: { in: [GorutCollectionVisitStatus.PENDING, GorutCollectionVisitStatus.COLLECTED] },
}

export async function listGorutMunfiqOwnCollections(prisma: PrismaClient, context: GorutMunfiqSelfContext) {
  const rows = await prisma.gorutCollectionEntry.findMany({
    where: { munfiqId: context.munfiqId, ...visibleEntryWhere },
    select: selfEntrySelect,
    orderBy: [{ batch: { periodStart: "desc" } }, { id: "desc" }],
  })
  const collections = rows.map(serializeSelfEntry)
  return {
    owner: { munfiqCode: context.munfiqCode, name: context.munfiqName },
    summary: {
      collectionCount: collections.filter((item) => item.status !== "Belum dijemput").length,
      totalAmount: rows.filter((row) => row.visitStatus === "COLLECTED").reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0)).toFixed(2),
      currency: "IDR" as const,
    },
    collections,
  }
}

export async function getGorutMunfiqOwnCollection(
  prisma: PrismaClient,
  context: GorutMunfiqSelfContext,
  collectionCode: string,
) {
  const row = await prisma.gorutCollectionEntry.findFirst({
    where: { munfiqId: context.munfiqId, batch: { collectionCode }, ...visibleEntryWhere },
    select: selfEntrySelect,
  })
  return row ? { owner: { munfiqCode: context.munfiqCode, name: context.munfiqName }, collection: serializeSelfEntry(row) } : null
}
