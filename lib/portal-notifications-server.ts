import { randomUUID } from "crypto"
import type { Prisma } from "@prisma/client"
import { getPrismaClient } from "@/lib/prisma"
import { canUseActionPath, serializeNotification, type NotificationInput } from "@/lib/portal-notifications"
import { getModuleGrantsForUserIds } from "@/lib/portal-access-server"

const MAX_PAGE = 50
const MARK_BATCH = 500
const AUDIT_SCOPE = "portal-notification-audit"
type NotificationClient = Pick<Prisma.TransactionClient, "portalNotification">

function eligibleWhere(userId: string, role: string, now = new Date()): Prisma.PortalNotificationWhereInput {
  return { publishedAt: { not: null }, withdrawnAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }], AND: [{ OR: [{ audience: "all" }, { audience: "role", targetRole: role }, { audience: "user", targetUserId: userId }] }] }
}

export async function listNotificationsForUser(userId: string, role: string, page = 1, limit = 20) {
  const prisma = getPrismaClient()
  const take = Math.min(Math.max(limit, 1), MAX_PAGE)
  const skip = (Math.max(page, 1) - 1) * take
  const grants = await getModuleGrantsForUserIds([userId]).then((map) => (map.get(userId) ?? []).filter((grant) => grant.enabled).map((grant) => grant.moduleKey))
  const where = eligibleWhere(userId, role)
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.portalNotification.findMany({ where, orderBy: [{ publishedAt: "desc" }, { id: "desc" }], skip, take: take + 1, select: { id: true, title: true, body: true, category: true, severity: true, actionPath: true, publishedAt: true, createdAt: true, receipts: { where: { userId }, select: { readAt: true }, take: 1 } } }),
    prisma.portalNotification.count({ where }),
    prisma.portalNotification.count({ where: { ...where, receipts: { none: { userId, readAt: { not: null } } } } }),
  ])
  return { notifications: items.slice(0, take).map((item) => serializeNotification({ ...item, actionPath: canUseActionPath(item.actionPath, role, grants), readAt: item.receipts[0]?.readAt ?? null })), unreadCount, page, limit: take, hasMore: skip + items.length > skip + take || skip + take < total }
}

export async function markNotificationRead(notificationId: string, userId: string, role: string) {
  const prisma = getPrismaClient()
  const notification = await prisma.portalNotification.findFirst({ where: { id: notificationId, ...eligibleWhere(userId, role) }, select: { id: true } })
  if (!notification) return false
  await prisma.portalNotificationReceipt.upsert({ where: { notificationId_userId: { notificationId, userId } }, create: { notificationId, userId, readAt: new Date() }, update: { readAt: new Date() } })
  return true
}

export async function markAllNotificationsRead(userId: string, role: string) {
  const prisma = getPrismaClient()
  return prisma.$transaction(async (tx) => {
    const now = new Date()
    const pending = await tx.portalNotification.findMany({ where: { ...eligibleWhere(userId, role, now), receipts: { none: { userId, readAt: { not: null } } } }, orderBy: [{ publishedAt: "desc" }, { id: "desc" }], take: MARK_BATCH, select: { id: true } })
    if (pending.length === 0) return 0
    await tx.portalNotificationReceipt.createMany({ data: pending.map(({ id }) => ({ notificationId: id, userId, readAt: now })), skipDuplicates: true })
    await tx.portalNotificationReceipt.updateMany({ where: { userId, notificationId: { in: pending.map(({ id }) => id) }, readAt: null }, data: { readAt: now } })
    return pending.length
  })
}

export async function listNotificationsManage(page = 1, limit = 20) {
  const prisma = getPrismaClient()
  const take = Math.min(Math.max(limit, 1), MAX_PAGE)
  const skip = (Math.max(page, 1) - 1) * take
  const [items, total] = await prisma.$transaction([
    prisma.portalNotification.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take: take + 1, select: { id: true, title: true, body: true, category: true, severity: true, audience: true, actionPath: true, targetUserId: true, targetRole: true, expiresAt: true, publishedAt: true, withdrawnAt: true, createdAt: true } }),
    prisma.portalNotification.count(),
  ])
  return { notifications: items.slice(0, take).map((n) => ({ ...n, expiresAt: n.expiresAt?.toISOString() ?? null, publishedAt: n.publishedAt?.toISOString() ?? null, withdrawnAt: n.withdrawnAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() })), hasMore: skip + items.length > skip + take || skip + take < total }
}

export async function publishNotification(creatorId: string, input: NotificationInput) {
  const prisma = getPrismaClient()
  return prisma.$transaction(async (tx) => {
    if (input.audience === "user") {
      const target = await tx.user.findUnique({ where: { id: input.targetUserId! }, select: { status: true } })
      if (!target) throw new Error("TARGET_NOT_FOUND")
      if (target.status !== "Aktif") throw new Error("TARGET_INACTIVE")
    }
    const now = new Date()
    const notification = await tx.portalNotification.create({ data: { id: randomUUID(), creatorId, title: input.title, body: input.body, category: input.category, severity: input.severity, audience: input.audience, actionPath: input.actionPath ?? null, targetUserId: input.audience === "user" ? input.targetUserId : null, targetRole: input.audience === "role" ? input.targetRole : null, expiresAt: input.expiresAt ?? null, publishedAt: now }, select: { id: true, createdAt: true, publishedAt: true } })
    await tx.appRecord.create({ data: { id: randomUUID(), scope: AUDIT_SCOPE, key: `publish-${randomUUID()}`, data: { actorId: creatorId, notificationId: notification.id, action: "notification_published", timestamp: now.toISOString() } } })
    return notification
  })
}

export async function withdrawNotification(notificationId: string, actorId: string) {
  const prisma = getPrismaClient()
  return prisma.$transaction(async (tx) => {
    const existing = await tx.portalNotification.findUnique({ where: { id: notificationId }, select: { id: true, withdrawnAt: true } })
    if (!existing) return null
    if (existing.withdrawnAt) return existing
    const now = new Date()
    const notification = await tx.portalNotification.update({ where: { id: notificationId }, data: { withdrawnAt: now }, select: { id: true, withdrawnAt: true } })
    await tx.appRecord.create({ data: { id: randomUUID(), scope: AUDIT_SCOPE, key: `withdraw-${randomUUID()}`, data: { actorId, notificationId, action: "notification_withdrawn", timestamp: now.toISOString() } } })
    return notification
  })
}

export async function createSystemNotification(tx: NotificationClient, input: Omit<NotificationInput, "audience" | "targetRole" | "expiresAt"> & { targetUserId: string }) {
  return tx.portalNotification.create({ data: { id: randomUUID(), creatorId: null, publishedAt: new Date(), title: input.title, body: input.body, category: input.category, severity: input.severity, audience: "user", targetUserId: input.targetUserId, actionPath: input.actionPath ?? null }, select: { id: true } })
}
