import { getPrismaClient } from "@/lib/prisma"
import { reopenReturnedCollectionForCorrection } from "@/lib/gorut-package-workflow-server"
import { gorutWorkflowErrorResponse, isExpectedVersion, isPublicGorutCode } from "@/lib/gorut-package-workflow-api"
import { json, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

type RouteParams = { packageCode: string; correctionCode: string }

export async function POST(request: Request, { params }: { params: Promise<RouteParams> | RouteParams }) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response
  const raw = await Promise.resolve(params)
  const packageCode = raw.packageCode.trim()
  const correctionCode = raw.correctionCode.trim()
  if (!isPublicGorutCode(packageCode, 120) || !isPublicGorutCode(correctionCode, 160)) {
    return json({ error: "Kode package atau correction tidak valid." }, 400)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: "Payload JSON tidak valid." }, 400)
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Contract correction tidak valid." }, 400)
  const value = body as Record<string, unknown>
  const munfiqCodes = value.munfiqCodes === undefined
    ? undefined
    : Array.isArray(value.munfiqCodes) && value.munfiqCodes.length <= 500 && value.munfiqCodes.every((code) => isPublicGorutCode(code, 80))
      ? value.munfiqCodes as string[]
      : null
  if (
    !isPublicGorutCode(value.collectionCode, 120) ||
    typeof value.reason !== "string" || !value.reason.trim() || value.reason.length > 500 ||
    !isExpectedVersion(value.expectedCollectionVersion) ||
    !isPublicGorutCode(value.idempotencyKey, 120) ||
    munfiqCodes === null
  ) return json({ error: "Contract correction tidak valid." }, 400)

  try {
    const result = await reopenReturnedCollectionForCorrection(getPrismaClient(), auth.context, {
      packageCode,
      correctionCode,
      collectionCode: value.collectionCode,
      munfiqCodes,
      reason: value.reason,
      expectedCollectionVersion: value.expectedCollectionVersion,
      idempotencyKey: value.idempotencyKey,
    })
    return json(result)
  } catch (error) {
    return gorutWorkflowErrorResponse(error)
  }
}
