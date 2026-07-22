import { NextResponse, type NextRequest } from "next/server"
import { requirePortalPermission } from "@/lib/portal-access-server"
import { getCentralAudit } from "@/lib/central-audit-server"
import { parseCentralAuditQuery } from "@/lib/central-audit"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store" }

export async function GET(request: NextRequest) {
  try {
    const access = await requirePortalPermission("audit.view")
    if (access.response) return access.response
    const validation = parseCentralAuditQuery(new URL(request.url).searchParams)
    if (validation.error || !validation.value) return NextResponse.json({ error: validation.error }, { status: 400, headers })
    const { entries, total, hasMore } = await getCentralAudit(validation.value)
    return NextResponse.json({ entries, page: validation.value.page, limit: validation.value.limit, total, hasMore }, { headers })
  } catch {
    return NextResponse.json({ error: "Data audit gagal dimuat." }, { status: 500, headers })
  }
}
