import type { NextRequest } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { errorResponse, json, parsePage, parsePageSize, parseSearch, parseState, endOfIsoDate, isDateRangeValid, parseIsoDate, requireGorutContext, transactionScopeWhere, decimal, dateRangeWhere, rejectInternalIdParams } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"
export async function GET(request: NextRequest) {
  const auth = await requireGorutContext(); if ("response" in auth) return auth.response
  const sp = request.nextUrl.searchParams
  if (rejectInternalIdParams(sp)) return json({ error: "Parameter internal tidak didukung." }, 400)
  const page = parsePage(sp.get("page")), pageSize = parsePageSize(sp.get("pageSize") ?? sp.get("limit")), search = parseSearch(sp.get("search")), state = parseState(sp.get("state")), from = parseIsoDate(sp.get("from")), to = endOfIsoDate(sp.get("to"))
  if (!isDateRangeValid(from, to)) return json({ error: "Rentang tanggal tidak valid." }, 400)
  try {
    const where = { ...transactionScopeWhere(auth.context), ...dateRangeWhere(from, to), ...(state ? { currentState: state } : {}), ...(search ? { OR: [{ code: { contains: search, mode: "insensitive" as const } }, { plpk: { name: { contains: search, mode: "insensitive" as const } } }] } : {}) }
    const prisma = getPrismaClient(), [total, rows] = await Promise.all([prisma.gorutTransaction.count({ where }), prisma.gorutTransaction.findMany({ where, select: { code: true, transactionDate: true, totalAmount: true, currentState: true, kecamatan: { select: { name: true } }, ranting: { select: { name: true } }, plpk: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: [{ transactionDate: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize })])
    const items = rows.map((row) => ({ transactionCode: row.code, transactionDate: row.transactionDate.toISOString(), totalAmount: decimal(row.totalAmount), currentState: row.currentState, kecamatan: row.kecamatan.name, ranting: row.ranting.name, plpk: row.plpk.name, munfiqCount: row._count.items }))
    return json({ items, transactions: items, page, pageSize, total })
  } catch { return errorResponse() }
}
