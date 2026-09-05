import type { NextRequest } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import {
  assertGorutCollectionApiMutationAllowed,
  gorutCollectionErrorResponse,
} from "@/lib/gorut-collection-api"
import {
  parseCollectionCreateBody,
} from "@/lib/gorut-collection-api-pure"
import {
  listGorutCollections,
  parseCollectionPeriod,
  parseCollectionStatus,
} from "@/lib/gorut-collection-query-server"
import { createAuthoritativeCollection } from "@/lib/gorut-collection-server"
import {
  json,
  parsePage,
  parsePageSize,
  parseSearch,
  rejectInternalIdParams,
  requireGorutContext,
} from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response

  const params = request.nextUrl.searchParams
  if (rejectInternalIdParams(params)) return json({ error: "Parameter internal tidak didukung." }, 400)
  const periodValue = params.get("period")
  const statusValue = params.get("status")
  if (periodValue && !parseCollectionPeriod(periodValue)) return json({ error: "Periode collection tidak valid." }, 400)
  const parsedStatus = statusValue ? parseCollectionStatus(statusValue) : undefined
  const status = parsedStatus ?? undefined
  if (statusValue && !status) return json({ error: "Status collection tidak valid." }, 400)

  try {
    return json(await listGorutCollections(getPrismaClient(), auth.context, {
      page: parsePage(params.get("page")),
      pageSize: parsePageSize(params.get("pageSize")),
      search: parseSearch(params.get("search")) || undefined,
      period: periodValue || undefined,
      status,
    }))
  } catch (error) {
    return gorutCollectionErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: "Payload collection tidak valid." }, 400)
  }
  const command = parseCollectionCreateBody(body)
  if (!command) return json({ error: "Payload collection tidak valid." }, 400)

  try {
    assertGorutCollectionApiMutationAllowed()
    const result = await createAuthoritativeCollection(getPrismaClient(), auth.context, {
      period: command.period,
      idempotencyKey: command.idempotencyKey,
    })
    return json(result, result.created ? 201 : 200)
  } catch (error) {
    return gorutCollectionErrorResponse(error)
  }
}
