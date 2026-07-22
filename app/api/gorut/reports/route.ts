import type { NextRequest } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { decimal, errorResponse, json, requireGorutContext, transactionScopeWhere } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"
function monthRange(value: string | null) {
  const raw = value ?? new Date().toISOString().slice(0, 7)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return null
  const [year, month] = raw.split("-").map(Number), start = new Date(Date.UTC(year!, month! - 1, 1)), end = new Date(Date.UTC(year!, month!, 1))
  return { raw, start, end, label: start.toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }) }
}
export async function GET(request: NextRequest) {
  const auth = await requireGorutContext(); if ("response" in auth) return auth.response
  const period = monthRange(request.nextUrl.searchParams.get("month")); if (!period) return json({ error: "Bulan tidak valid." }, 400)
  const kecamatanId = request.nextUrl.searchParams.get("kecamatanId"), scoped = transactionScopeWhere(auth.context), base = { ...scoped, currentState: "FINAL_APPROVED" as const, transactionDate: { gte: period.start, lt: period.end }, ...(kecamatanId ? { kecamatanId } : {}) }
  try {
    const prisma = getPrismaClient()
    const [headline, byKecamatan, byRanting, byPlpk, contributing, transactions] = await Promise.all([
      prisma.gorutTransaction.aggregate({ where: base, _sum: { totalAmount: true }, _count: { id: true } }),
      prisma.gorutTransaction.groupBy({ by: ["kecamatanId"], where: base, _sum: { totalAmount: true }, _count: { id: true }, orderBy: { kecamatanId: "asc" }, take: 50 }),
      prisma.gorutTransaction.groupBy({ by: ["rantingId"], where: base, _sum: { totalAmount: true }, _count: { id: true }, orderBy: { rantingId: "asc" }, take: 100 }),
      prisma.gorutTransaction.groupBy({ by: ["plpkId"], where: base, _sum: { totalAmount: true }, _count: { id: true }, orderBy: { plpkId: "asc" }, take: 200 }),
      prisma.gorutTransactionItem.groupBy({ by: ["munfiqId"], where: { transaction: base }, _count: { munfiqId: true }, orderBy: { munfiqId: "asc" }, take: 10000 }),
      prisma.gorutTransaction.findMany({ where: base, select: { id: true, code: true, transactionDate: true, totalAmount: true, kecamatan: { select: { name: true } }, ranting: { select: { name: true } }, plpk: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: [{ transactionDate: "desc" }, { id: "desc" }], take: 100 }),
    ])
    const [kecamatan, ranting, plpk] = await Promise.all([
      prisma.gorutKecamatan.findMany({ where: { id: { in: byKecamatan.map((item) => item.kecamatanId) } }, select: { id: true, code: true, name: true } }),
      prisma.gorutRanting.findMany({ where: { id: { in: byRanting.map((item) => item.rantingId) } }, select: { id: true, code: true, name: true, kecamatan: { select: { name: true } } } }),
      prisma.gorutPlpk.findMany({ where: { id: { in: byPlpk.map((item) => item.plpkId) } }, select: { id: true, code: true, name: true, ranting: { select: { name: true, kecamatan: { select: { name: true } } } } } }),
    ]), kMap = new Map(kecamatan.map((item) => [item.id, item])), rMap = new Map(ranting.map((item) => [item.id, item])), pMap = new Map(plpk.map((item) => [item.id, item]))
    return json({ period: { month: period.raw, label: period.label, start: period.start.toISOString(), end: period.end.toISOString() }, headline: { totalPenghimpunan: decimal(headline._sum.totalAmount), totalTransaksiSelesai: headline._count.id, totalMunfiqBerkontribusi: contributing.length }, availableKecamatan: kecamatan.map((item) => ({ id: item.id, name: item.name })), perUpzis: byKecamatan.map((item) => ({ ...kMap.get(item.kecamatanId), totalAmount: decimal(item._sum.totalAmount), transactionCount: item._count.id, munfiqCount: null })), perRanting: byRanting.map((item) => ({ ...rMap.get(item.rantingId), kecamatan: rMap.get(item.rantingId)?.kecamatan.name, totalAmount: decimal(item._sum.totalAmount), transactionCount: item._count.id, munfiqCount: null })), perPlpk: byPlpk.map((item) => ({ ...pMap.get(item.plpkId), kecamatan: pMap.get(item.plpkId)?.ranting.kecamatan.name, ranting: pMap.get(item.plpkId)?.ranting.name, totalAmount: decimal(item._sum.totalAmount), transactionCount: item._count.id, munfiqCount: null })), transactions: transactions.map((item) => ({ id: item.id, transactionCode: item.code, transactionDate: item.transactionDate.toISOString(), totalAmount: decimal(item.totalAmount), upzis: item.kecamatan.name, kecamatan: item.kecamatan.name, ranting: item.ranting.name, plpk: item.plpk.name, munfiqCount: item._count.items })), rekapScope: null, rekapDana: [] })
  } catch { return errorResponse() }
}
