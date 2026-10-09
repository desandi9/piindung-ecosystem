import { getPrismaClient } from "@/lib/prisma"
import { gorutCollectionErrorResponse } from "@/lib/gorut-collection-api"
import { isPublicCollectionCode } from "@/lib/gorut-collection-api-pure"
import { getGorutCollectionDetail } from "@/lib/gorut-collection-query-server"
import { json, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function GET(
  _: Request,
  { params }: { params: Promise<{ collectionCode: string }> | { collectionCode: string } },
) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response
  const { collectionCode: rawCollectionCode } = await Promise.resolve(params)
  const collectionCode = rawCollectionCode.trim()
  if (!isPublicCollectionCode(collectionCode)) return json({ error: "Kode collection tidak valid." }, 400)

  try {
    const result = await getGorutCollectionDetail(getPrismaClient(), auth.context, collectionCode)
    return result ? json(result) : json({ error: "Collection GORUT tidak ditemukan." }, 404)
  } catch (error) {
    return gorutCollectionErrorResponse(error)
  }
}
