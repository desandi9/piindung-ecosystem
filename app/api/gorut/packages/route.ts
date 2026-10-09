import type { NextRequest } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { listGorutPackages } from "@/lib/gorut-package-server"
import { parsePackagePeriod, parsePackageState } from "@/lib/gorut-package-read-model"
import { errorResponse, json, parsePage, parsePageSize, parseSearch, rejectInternalIdParams, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response

  const params = request.nextUrl.searchParams
  if (rejectInternalIdParams(params) || params.has("packageId")) return json({ error: "Parameter internal tidak didukung." }, 400)

  const periodValue = params.get("period")
  const stateValue = params.get("state")
  const period = periodValue ? parsePackagePeriod(periodValue) : undefined
  const state = stateValue ? parsePackageState(stateValue) : undefined
  if (periodValue && !period) return json({ error: "Periode package tidak valid." }, 400)
  if (stateValue && !state) return json({ error: "State package tidak valid." }, 400)

  const kecamatanCode = parseSearch(params.get("kecamatanCode"), 80)
  const search = parseSearch(params.get("search"))
  try {
    const result = await listGorutPackages(getPrismaClient(), auth.context, {
      page: parsePage(params.get("page")),
      pageSize: parsePageSize(params.get("pageSize")),
      search: search || undefined,
      period: period ?? undefined,
      state,
      kecamatanCode: kecamatanCode || undefined,
    })
    return result ? json(result) : json({ error: "Akses package GORUT tidak tersedia untuk role ini." }, 403)
  } catch {
    return errorResponse()
  }
}
