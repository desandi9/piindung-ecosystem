import type { NextRequest } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { errorResponse, json, parsePage, parsePageSize, parseSearch, parseStatus, munfiqScopeWhere, rejectInternalIdParams, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"
export async function GET(request: NextRequest) {
  const auth = await requireGorutContext(); if ("response" in auth) return auth.response
  const sp = request.nextUrl.searchParams
  if (rejectInternalIdParams(sp)) return json({ error: "Parameter internal tidak didukung." }, 400)
  const page = parsePage(sp.get("page")), pageSize = parsePageSize(sp.get("pageSize")), search = parseSearch(sp.get("search")), status = parseStatus(sp.get("status"))
  try {
    const where = { ...munfiqScopeWhere(auth.context), ...(status === undefined ? {} : { isActive: status }), ...(search ? { OR: [{ code: { contains: search, mode: "insensitive" as const } }, { name: { contains: search, mode: "insensitive" as const } }, { phone: { contains: search, mode: "insensitive" as const } }] } : {}) }
    const prisma = getPrismaClient(), [total, items] = await Promise.all([prisma.gorutMunfiq.count({ where }), prisma.gorutMunfiq.findMany({ where, select: { code: true, name: true, phone: true, address: true, isActive: true, ranting: { select: { name: true } }, plpk: { select: { name: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize })])
    return json({ items: items.map((item) => ({ munfiqCode: item.code, name: item.name, phone: item.phone, address: item.address, ranting: item.ranting.name, plpk: item.plpk.name, status: item.isActive ? "aktif" : "nonaktif" })), page, pageSize, total })
  } catch { return errorResponse() }
}
