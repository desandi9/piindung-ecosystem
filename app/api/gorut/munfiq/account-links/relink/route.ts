import { readJsonMutation } from "@/lib/request-security"
import { getPrismaClient } from "@/lib/prisma"
import { requirePortalPermission } from "@/lib/portal-access-server"
import { parseGorutMunfiqLinkInput } from "@/lib/gorut-munfiq-identity-api"
import { GorutMunfiqIdentityError, relinkUserToGorutMunfiq } from "@/lib/gorut-munfiq-identity-server"
import { json } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const required = await requirePortalPermission("munfiq.account_links.manage")
  if (required.response) return required.response
  const parsedJson = await readJsonMutation(request)
  if (parsedJson.failure) return json({ error: parsedJson.failure.error }, parsedJson.failure.status)
  const input = parseGorutMunfiqLinkInput(parsedJson.value)
  if (!input) return json({ error: "Payload relink identitas Munfiq tidak valid." }, 400)
  try {
    return json({ link: await relinkUserToGorutMunfiq(getPrismaClient(), required.access.user.id, input) })
  } catch (error) {
    if (!(error instanceof GorutMunfiqIdentityError)) return json({ error: "Relink identitas Munfiq tidak dapat diproses." }, 500)
    if (error.code === "IDENTITY_USER_NOT_FOUND" || error.code === "IDENTITY_MUNFIQ_NOT_FOUND") return json({ error: error.message }, 404)
    if (error.code === "IDENTITY_ADMIN_ACCESS_DENIED") return json({ error: "Akses tidak diizinkan." }, 403)
    return json({ error: error.message }, 409)
  }
}
