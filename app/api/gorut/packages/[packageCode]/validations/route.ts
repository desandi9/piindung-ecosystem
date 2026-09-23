import { Prisma } from "@prisma/client"
import { getPrismaClient } from "@/lib/prisma"
import { validateGorutPackageSettlement } from "@/lib/gorut-package-validation-server"
import { gorutPackageValidationErrorResponse, parseGorutPackageValidationBody } from "@/lib/gorut-package-validation-api"
import { isGorutSettlementPublicCode } from "@/lib/gorut-package-settlement-api-pure"
import { json, requireGorutContext } from "@/lib/gorut/server"
import { readJsonMutation } from "@/lib/request-security"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ packageCode: string }> | { packageCode: string } }) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response
  const { packageCode: rawPackageCode } = await Promise.resolve(params)
  const packageCode = rawPackageCode.trim()
  if (!isGorutSettlementPublicCode(packageCode, 120)) return json({ error: "Kode package tidak valid." }, 400)

  const body = await readJsonMutation(request)
  if (body.failure) return json({ error: body.failure.error }, body.failure.status)
  const parsed = parseGorutPackageValidationBody(body.value)
  if (!parsed) return json({ error: "Contract validasi settlement tidak valid." }, 400)

  try {
    const result = await validateGorutPackageSettlement(getPrismaClient(), auth.context, { packageCode, ...parsed })
    return json(result)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("GORUT validation database failure", { code: error.code })
    }
    return gorutPackageValidationErrorResponse(error)
  }
}
