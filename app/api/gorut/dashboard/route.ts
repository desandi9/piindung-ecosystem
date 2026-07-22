import { getPrismaClient } from "@/lib/prisma"
import { decimal, errorResponse, json, kecamatanScopeWhere, munfiqScopeWhere, plpkScopeWhere, rejectInternalIdParams, requireGorutContext, transactionScopeWhere } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  const auth = await requireGorutContext(); if ("response" in auth) return auth.response
  const sp = new URL(request.url).searchParams
  if (rejectInternalIdParams(sp)) return json({ error: "Parameter internal tidak didukung." }, 400)
  try {
    const prisma = getPrismaClient(), txWhere = transactionScopeWhere(auth.context), month = new Date(); month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0)
    const [plpkCount, munfiqCount, activeMunfiqCount, transactionCount, approved, currentMonth, kecamatan, events] = await Promise.all([
      prisma.gorutPlpk.count({ where: { ...plpkScopeWhere(auth.context), isActive: true } }), prisma.gorutMunfiq.count({ where: munfiqScopeWhere(auth.context) }), prisma.gorutMunfiq.count({ where: { ...munfiqScopeWhere(auth.context), isActive: true } }), prisma.gorutTransaction.count({ where: txWhere }),
      prisma.gorutTransaction.aggregate({ where: { ...txWhere, currentState: "FINAL_APPROVED" }, _sum: { totalAmount: true } }), prisma.gorutTransaction.aggregate({ where: { ...txWhere, currentState: "FINAL_APPROVED", transactionDate: { gte: month } }, _sum: { totalAmount: true } }),
      prisma.gorutKecamatan.findMany({ where: { ...kecamatanScopeWhere(auth.context), isActive: true }, select: { code: true, name: true, _count: { select: { rantings: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 50 }),
      prisma.gorutWorkflowEvent.findMany({ where: { transaction: txWhere }, select: { action: true, createdAt: true, actor: { select: { name: true } }, transaction: { select: { code: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20 }),
    ])
    return json({ stats: { totalKotak: munfiqCount, kotakAktif: activeMunfiqCount, kotakNonaktif: munfiqCount - activeMunfiqCount, kotakPending: null, totalTerkumpul: decimal(approved._sum.totalAmount), terkumpulBulanIni: decimal(currentMonth._sum.totalAmount), totalKecamatan: kecamatan.length, totalDesa: kecamatan.reduce((sum, item) => sum + item._count.rantings, 0), pertumbuhan: null }, kecamatanData: kecamatan.map((item) => ({ code: item.code, nama: item.name, jumlahKotak: null, jumlahKotakAktif: null, totalTerkumpul: null, jumlahDesa: item._count.rantings })), recentActivities: events.map((event) => ({ type: "admin", title: event.action, description: event.transaction.code, timestamp: event.createdAt.toISOString(), user: event.actor.name })), priorityApprovals: [], priorityNotifications: [], roleSummary: { role: auth.context.operationalRole, plpkCount, auditActionsToday: null }, auditSummary: { transactionCount } })
  } catch { return errorResponse() }
}
