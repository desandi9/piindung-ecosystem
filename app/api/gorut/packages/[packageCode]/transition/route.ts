import { getPrismaClient } from "@/lib/prisma"
import { executeGorutPackageTransition } from "@/lib/gorut-package-workflow-server"
import { gorutWorkflowErrorResponse, isPublicGorutCode, parseTransitionBody } from "@/lib/gorut-package-workflow-api"
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
  const parsed = parseTransitionBody(body)
  if (!parsed) return json({ error: "Contract transition package tidak valid." }, 400)

  try {
    const result = await executeGorutPackageTransition(getPrismaClient(), auth.context, { packageCode, ...parsed })
    return json(result)
  } catch (error) {
    return gorutWorkflowErrorResponse(error)
  }
}
