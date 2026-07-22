import { getPrismaClient } from "@/lib/prisma"
import { decimal, errorResponse, json, plpkScopeWhere, requireGorutContext, transactionScopeWhere } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"
export async function GET() {
  const auth = await requireGorutContext(); if ("response" in auth) return auth.response
  try {
    const prisma = getPrismaClient(), where = transactionScopeWhere(auth.context), month = new Date(); month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0)
    const [stateDistros, approved, monthApproved, returned, plpks] = await Promise.all([
      prisma.gorutTransaction.groupBy({ by: ["currentState"], where, _count: { id: true }, _sum: { totalAmount: true }, orderBy: { currentState: "asc" } }),
      prisma.gorutTransaction.aggregate({ where: { ...where, currentState: "FINAL_APPROVED" }, _count: { id: true }, _sum: { totalAmount: true } }),
      prisma.gorutTransaction.aggregate({ where: { ...where, currentState: "FINAL_APPROVED", transactionDate: { gte: month } }, _count: { id: true }, _sum: { totalAmount: true } }),
      prisma.gorutTransaction.findMany({ where: { ...where, currentState: { in: ["RETURNED_TO_PLPK", "RETURNED_TO_RANTING", "RETURNED_TO_UPZIS", "REJECTED"] } }, select: { id: true, code: true, currentState: true, totalAmount: true, transactionDate: true, kecamatan: { select: { name: true } }, ranting: { select: { name: true } }, plpk: { select: { name: true } } }, take: 30, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] }),
      prisma.gorutPlpk.findMany({ where: { ...plpkScopeWhere(auth.context), isActive: true }, select: { id: true, code: true, name: true, ranting: { select: { name: true, kecamatan: { select: { name: true } } } }, _count: { select: { munfiqs: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 50 }),
    ])
    const labels: Record<string, string> = { DRAFT: "Draft", WAITING_RANTING_VERIFICATION: "Tunggu Ranting", RETURNED_TO_PLPK: "Return PLPK", WAITING_UPZIS_VERIFICATION: "Tunggu UPZIS", RETURNED_TO_RANTING: "Return Ranting", WAITING_PC_APPROVAL: "Tunggu PC", RETURNED_TO_UPZIS: "Return UPZIS", FINAL_APPROVED: "Disetujui", REJECTED: "Ditolak", CANCELLED: "Dibatalkan" }
    return json({ metrics: null, api: null, database: null, gateway: null, recentEvents: null, statusDistribution: stateDistros.map((item) => ({ state: item.currentState, label: labels[item.currentState] ?? item.currentState, count: item._count.id, amount: decimal(item._sum.totalAmount) })), pendingByStage: stateDistros.filter((item) => item.currentState.startsWith("WAITING")).map((item) => ({ state: item.currentState, label: labels[item.currentState] ?? item.currentState, count: item._count.id })), plpkPerformance: plpks.map((item) => ({ id: item.id, code: item.code, name: item.name, kecamatan: item.ranting.kecamatan.name, ranting: item.ranting.name, munfiqCount: item._count.munfiqs, finalApprovedAmount: null, finalApprovedCount: null, pendingCount: null, returnedRejectedCount: null, progress: null })), upzisProgress: null, rantingProgress: null, finalApprovedTotals: { totalAmount: decimal(approved._sum.totalAmount), transactionCount: approved._count.id, currentMonthAmount: decimal(monthApproved._sum.totalAmount), currentMonthTransactionCount: monthApproved._count.id }, returnedRejectedTransactions: returned.map((item) => ({ id: item.id, transactionCode: item.code, currentState: item.currentState, totalAmount: decimal(item.totalAmount), transactionDate: item.transactionDate.toISOString(), kecamatan: item.kecamatan.name, ranting: item.ranting.name, plpk: item.plpk.name })), scope: { role: auth.context.operationalRole } })
  } catch { return errorResponse() }
}
