import { getPrismaClient } from "@/lib/prisma"
import { recordGorutPackageRantingExclusion } from "@/lib/gorut-package-workflow-server"
import { gorutWorkflowErrorResponse, isExpectedVersion, isPublicGorutCode } from "@/lib/gorut-package-workflow-api"
import { json, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ packageCode: string }> | { packageCode: string } }) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response
  const { packageCode: rawPackageCode } = await Promise.resolve(params)
  const packageCode = rawPackageCode.trim()
  if (!isPublicGorutCode(packageCode, 120)) return json({ error: "Kode package tidak valid." }, 400)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: "Payload JSON tidak valid." }, 400)
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Contract coverage tidak valid." }, 400)
  const value = body as Record<string, unknown>
  if (
    !isPublicGorutCode(value.rantingCode, 80) ||
    typeof value.reason !== "string" || !value.reason.trim() || value.reason.length > 500 ||
    (value.reference !== undefined && value.reference !== null && (typeof value.reference !== "string" || value.reference.length > 300)) ||
    !isExpectedVersion(value.expectedVersion) ||
    !isPublicGorutCode(value.idempotencyKey, 120)
  ) return json({ error: "Contract coverage tidak valid." }, 400)

  try {
    const result = await recordGorutPackageRantingExclusion(getPrismaClient(), auth.context, {
      packageCode,
      rantingCode: value.rantingCode,
      reason: value.reason,
      reference: typeof value.reference === "string" ? value.reference : null,
      expectedVersion: value.expectedVersion,
      idempotencyKey: value.idempotencyKey,
    })
    return json(result)
  } catch (error) {
    return gorutWorkflowErrorResponse(error)
  }
}
