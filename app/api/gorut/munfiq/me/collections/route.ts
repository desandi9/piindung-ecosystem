import { getPrismaClient } from "@/lib/prisma"
import { requireGorutMunfiqContext } from "@/lib/gorut-munfiq-identity-server"
import { syncGorutMunfiqMilestoneNotifications } from "@/lib/gorut-munfiq-notifications-server"
import { listGorutMunfiqOwnCollections } from "@/lib/gorut-munfiq-transparency-server"
import { errorResponse, json } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireGorutMunfiqContext()
  if ("response" in auth) return auth.response
  try {
    const prisma = getPrismaClient()
    await syncGorutMunfiqMilestoneNotifications(prisma, auth.context.munfiqId)
    return json(await listGorutMunfiqOwnCollections(prisma, auth.context))
  } catch {
    return errorResponse()
  }
}
