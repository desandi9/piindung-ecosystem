import { getPrismaClient } from "@/lib/prisma"
import { requireGorutMunfiqContext } from "@/lib/gorut-munfiq-identity-server"
import { syncGorutMunfiqMilestoneNotifications } from "@/lib/gorut-munfiq-notifications-server"
import { getGorutMunfiqOwnCollection } from "@/lib/gorut-munfiq-transparency-server"
import { errorResponse, json } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ collectionCode: string }> }) {
  const auth = await requireGorutMunfiqContext()
  if ("response" in auth) return auth.response
  try {
    const prisma = getPrismaClient()
    const { collectionCode } = await params
    const result = await getGorutMunfiqOwnCollection(prisma, auth.context, collectionCode)
    if (!result) return json({ error: "Riwayat infak tidak ditemukan." }, 404)
    await syncGorutMunfiqMilestoneNotifications(prisma, auth.context.munfiqId)
    return json(result)
  } catch (error) {
    console.error("GORUT Munfiq own detail failed", error)
    return errorResponse()
  }
}
