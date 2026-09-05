import { randomUUID } from "crypto"
import type { PrismaClient } from "@prisma/client"
import { buildGorutMunfiqTimeline } from "./gorut-munfiq-transparency-pure"

const NOTIFICATION_SCOPE = "gorut-munfiq-milestone-notification"

const milestoneCopy = {
  recorded: { title: "Infak Anda sudah tercatat", body: "Catatan infak Anda sudah masuk ke proses penghimpunan GORUT." },
  verifying: { title: "Infak sedang diverifikasi", body: "Catatan infak Anda sedang diperiksa oleh petugas terkait." },
  verified: { title: "Infak sudah diverifikasi", body: "Catatan infak Anda telah selesai diverifikasi." },
  upzis: { title: "Infak sedang diproses UPZIS", body: "Penghimpunan yang memuat infak Anda sedang diproses di tingkat UPZIS." },
  pc: { title: "Infak sudah diteruskan ke PC", body: "Penghimpunan yang memuat infak Anda telah diteruskan ke tingkat PC." },
  complete: { title: "Proses penghimpunan selesai", body: "Proses penghimpunan yang memuat infak Anda telah selesai." },
} as const

type NotificationMilestone = keyof typeof milestoneCopy

export async function syncGorutMunfiqMilestoneNotifications(prisma: PrismaClient, munfiqId: string) {
  return prisma.$transaction(async (tx) => {
    const link = await tx.gorutMunfiqAccountLink.findFirst({
      where: { munfiqId, status: "ACTIVE", user: { status: "Aktif", role: "munfiq" } },
      select: { userId: true },
    })
    if (!link) return { created: 0 }

    const entries = await tx.gorutCollectionEntry.findMany({
      where: { munfiqId, visitStatus: "COLLECTED" },
      select: {
        createdAt: true,
        collectedAt: true,
        visitStatus: true,
        batch: {
          select: {
            collectionCode: true,
            submittedToKordesAt: true,
            verifiedByKordesAt: true,
            transaction: {
              select: {
                packageMembership: {
                  select: {
                    package: {
                      select: {
                        workflowEvents: {
                          select: { action: true, stage: true, resultingState: true, createdAt: true },
                          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    let created = 0
    for (const entry of entries) {
      const timeline = buildGorutMunfiqTimeline({
        visitStatus: entry.visitStatus,
        entryCreatedAt: entry.createdAt,
        collectedAt: entry.collectedAt,
        submittedToKordesAt: entry.batch.submittedToKordesAt,
        verifiedByKordesAt: entry.batch.verifiedByKordesAt,
        workflowEvents: entry.batch.transaction?.packageMembership?.package.workflowEvents ?? [],
      })
      for (const item of timeline) {
        if (item.key === "pending") continue
        const copy = milestoneCopy[item.key as NotificationMilestone]
        const key = `${link.userId}:${entry.batch.collectionCode}:${item.key}`
        const claimed = await tx.appRecord.createMany({
          data: [{
            id: randomUUID(),
            scope: NOTIFICATION_SCOPE,
            key,
            data: { collectionCode: entry.batch.collectionCode, milestone: item.key, occurredAt: item.at, targetUserId: link.userId },
          }],
          skipDuplicates: true,
        })
        if (claimed.count !== 1) continue
        await tx.portalNotification.create({
          data: {
            id: randomUUID(),
            title: copy.title,
            body: copy.body,
            category: "system",
            severity: item.key === "complete" ? "success" : "info",
            audience: "user",
            targetUserId: link.userId,
            publishedAt: new Date(item.at),
          },
        })
        created += 1
      }
    }
    return { created }
  })
}
