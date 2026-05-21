import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"

export type RecordData = Record<string, unknown>

async function fetchRecord(scope: string, key: string) {
  const records = await prisma.$queryRaw<Array<{ id: string; scope: string; key: string; data: RecordData; createdAt: Date; updatedAt: Date }>>`
    SELECT id, scope, key, data, "createdAt", "updatedAt"
    FROM "AppRecord"
    WHERE scope = ${scope} AND key = ${key}
    LIMIT 1
  `

  return records[0]
}

export async function listRecords(scope: string) {
  return prisma.$queryRaw<Array<{ id: string; scope: string; key: string; data: RecordData; createdAt: Date; updatedAt: Date }>>`
    SELECT id, scope, key, data, "createdAt", "updatedAt"
    FROM "AppRecord"
    WHERE scope = ${scope}
    ORDER BY "updatedAt" DESC
  `
}

export async function createRecord(scope: string, key: string, data: RecordData) {
  await prisma.$executeRaw`
    INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
    VALUES (${randomUUID()}, ${scope}, ${key}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT ("scope", "key") DO UPDATE SET "data" = EXCLUDED."data", "updatedAt" = NOW()
  `

  return fetchRecord(scope, key)
}

export async function updateRecord(scope: string, key: string, data: RecordData) {
  await prisma.$executeRaw`
    INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
    VALUES (${randomUUID()}, ${scope}, ${key}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT ("scope", "key") DO UPDATE SET "data" = EXCLUDED."data", "updatedAt" = NOW()
  `

  return fetchRecord(scope, key)
}

export async function deleteRecord(scope: string, key: string) {
  await prisma.$executeRaw`DELETE FROM "AppRecord" WHERE scope = ${scope} AND key = ${key}`
}
