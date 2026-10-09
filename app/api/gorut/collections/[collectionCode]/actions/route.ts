import { getPrismaClient } from "@/lib/prisma"
import {
  executeGorutCollectionApiAction,
  gorutCollectionErrorResponse,
} from "@/lib/gorut-collection-api"
import {
  isPublicCollectionCode,
  parseCollectionActionBody,
} from "@/lib/gorut-collection-api-pure"
import { json, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ collectionCode: string }> | { collectionCode: string } },
) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response
  const { collectionCode: rawCollectionCode } = await Promise.resolve(params)
  const collectionCode = rawCollectionCode.trim()
  if (!isPublicCollectionCode(collectionCode)) return json({ error: "Kode collection tidak valid." }, 400)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: "Payload action collection tidak valid." }, 400)
  }
  const command = parseCollectionActionBody(body)
  if (!command) return json({ error: "Payload action collection tidak valid." }, 400)

  try {
    return json(await executeGorutCollectionApiAction(
      getPrismaClient(),
      auth.context,
      collectionCode,
      command,
    ))
  } catch (error) {
    return gorutCollectionErrorResponse(error)
  }
}
