import "server-only"
import { Prisma } from "@prisma/client"
import { getPrismaClient } from "@/lib/prisma"
import { centralAuditActionsForQuery, centralAuditScopes, mapCentralAudit, type CentralAuditQuery } from "./central-audit"

type AuditRecord = { data: Prisma.JsonValue; createdAt: Date; actorName: string | null; targetName: string | null }

export async function getCentralAudit(query: CentralAuditQuery) {
  const actions = centralAuditActionsForQuery(query)
  if (actions.length === 0) return { entries: [], total: 0, hasMore: false }
  const scopes = Prisma.join([...centralAuditScopes])
  const actionValues = Prisma.join(actions)
  const from = query.from ? Prisma.sql` AND audit."createdAt" >= ${query.from}` : Prisma.empty
  const to = query.to ? Prisma.sql` AND audit."createdAt" <= ${query.to}` : Prisma.empty
  const search = query.search ? Prisma.sql` AND (actor.name ILIKE ${`%${query.search}%`} OR target.name ILIKE ${`%${query.search}%`})` : Prisma.empty
  const source = Prisma.sql`
    FROM "AppRecord" AS audit
    LEFT JOIN "User" AS actor ON actor.id = audit.data->>'actorId'
    LEFT JOIN "User" AS target ON target.id = audit.data->>'targetUserId'
    WHERE audit.scope IN (${scopes})
      AND audit.data->>'action' IN (${actionValues})${from}${to}${search}
  `
  const prisma = getPrismaClient()
  const [records, counts] = await Promise.all([
    prisma.$queryRaw<AuditRecord[]>(Prisma.sql`
      SELECT audit.data, audit."createdAt", actor.name AS "actorName", target.name AS "targetName"
      ${source}
      ORDER BY audit."createdAt" DESC, audit.id DESC
      LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit}
    `),
    prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`SELECT COUNT(*)::int AS total ${source}`)
  ])
  const total = counts[0]?.total ?? 0
  const entries = records.map(mapCentralAudit).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  return { entries, total, hasMore: query.page * query.limit < total }
}
