import { Prisma } from "@prisma/client"
import { readJsonMutation } from "@/lib/request-security"
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

  const body = await readJsonMutation(request)
  if (body.failure) return json({ error: body.failure.error }, body.failure.status)
  const parsed = parseTransitionBody(body.value)
  if (!parsed) return json({ error: "Contract transition package tidak valid." }, 400)

  try {
    const result = await executeGorutPackageTransition(getPrismaClient(), auth.context, { packageCode, ...parsed })
    return json(result)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) console.error("GORUT workflow database failure", { code: error.code })
    return gorutWorkflowErrorResponse(error)
  }
}
