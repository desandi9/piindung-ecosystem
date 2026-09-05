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
    await syncGorutMunfiqMilestoneNotifications(prisma, auth.context.munfiqId)
    const result = await getGorutMunfiqOwnCollection(prisma, auth.context, collectionCode)
    return result ? json(result) : json({ error: "Riwayat infak tidak ditemukan." }, 404)
  } catch {
    return errorResponse()
  }
}
