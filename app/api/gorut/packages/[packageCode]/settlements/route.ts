import { json, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function POST() {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response
  return json({
    error: "Mutation setoran belum termasuk boundary Phase 2B.",
    code: "PHASE_2B_MUTATION_OUT_OF_SCOPE",
  }, 503)
}
