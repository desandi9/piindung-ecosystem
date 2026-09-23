import { requireGorutMunfiqContext } from "@/lib/gorut-munfiq-identity-server"
import { serializeGorutMunfiqSelfIdentity } from "@/lib/gorut-munfiq-identity-pure"
import { json } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireGorutMunfiqContext()
  if ("response" in auth) return auth.response
  return json(serializeGorutMunfiqSelfIdentity(auth.context))
}
