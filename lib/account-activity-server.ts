import "server-only"
import { Prisma } from "@prisma/client"
import { getPrismaClient } from "@/lib/prisma"
import { accountActivityActions, accountActivityScopes, parseAccountActivity, type AccountActivityQuery } from "./account-activity"

type RawRecord = { data: Prisma.JsonValue; createdAt: Date }

export async function getAccountActivity(targetUserId: string, query: AccountActivityQuery) {
  const scopes = Prisma.join([...accountActivityScopes])
  const actions = Prisma.join([...accountActivityActions])
  const source = Prisma.sql`
    FROM "AppRecord"
    WHERE scope IN (${scopes})
      AND data->>'targetUserId' = ${targetUserId}
      AND data->>'action' IN (${actions})
  `
  const prisma = getPrismaClient()
  const [records, counts] = await Promise.all([
    prisma.$queryRaw<RawRecord[]>(Prisma.sql`
      SELECT data, "createdAt"
      ${source}
      ORDER BY "createdAt" DESC, id DESC
      LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit}
    `),
    prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`SELECT COUNT(*)::int AS total ${source}`)
  ])
  const total = counts[0]?.total ?? 0
  const activities = records.map(parseAccountActivity).filter((activity): activity is NonNullable<typeof activity> => activity !== null)
  return { activities, total, hasMore: query.page * query.limit < total }
}
