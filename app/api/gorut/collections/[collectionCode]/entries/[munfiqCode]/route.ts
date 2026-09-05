import { getPrismaClient } from "@/lib/prisma"
import {
  assertGorutCollectionApiMutationAllowed,
  gorutCollectionErrorResponse,
} from "@/lib/gorut-collection-api"
import {
  isPublicCollectionCode,
  parseCollectionEntryBody,
} from "@/lib/gorut-collection-api-pure"
import { recordAuthoritativeCollectionEntry } from "@/lib/gorut-collection-server"
import { json, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function PUT(
  request: Request,
  { params }: {
    params: Promise<{ collectionCode: string; munfiqCode: string }> | { collectionCode: string; munfiqCode: string }
  },
) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response
  const resolved = await Promise.resolve(params)
  const collectionCode = resolved.collectionCode.trim()
  const munfiqCode = resolved.munfiqCode.trim()
  if (!isPublicCollectionCode(collectionCode) || !isPublicCollectionCode(munfiqCode, 80)) {
    return json({ error: "Kode collection atau Munfiq tidak valid." }, 400)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: "Payload entry collection tidak valid." }, 400)
  }
  const command = parseCollectionEntryBody(body)
  if (!command) return json({ error: "Payload entry collection tidak valid." }, 400)

  try {
    assertGorutCollectionApiMutationAllowed()
    const result = await recordAuthoritativeCollectionEntry(getPrismaClient(), auth.context, {
      collectionCode,
      munfiqCode,
      ...command,
    })
    return json(result)
  } catch (error) {
    return gorutCollectionErrorResponse(error)
  }
}
