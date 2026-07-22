import { getPrismaClient } from "@/lib/prisma"
import { decimal, errorResponse, json, munfiqScopeWhere, rejectInternalIdParams, requireGorutContext, transactionScopeWhere } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  const auth = await requireGorutContext(); if ("response" in auth) return auth.response
  const sp = new URL(request.url).searchParams
  if (rejectInternalIdParams(sp)) return json({ error: "Parameter internal tidak didukung." }, 400)
  if (auth.context.operationalRole !== "PLPK") return json({ error: "Dashboard ini hanya tersedia untuk PLPK." }, 403)
  try {
    const prisma = getPrismaClient(), plpkId = auth.context.plpkId!, txWhere = transactionScopeWhere(auth.context), month = new Date(); month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0)
    const [user, plpkRow, munfiqs, transactions, monthApproved, pending, completed, totalMunfiq] = await Promise.all([
      prisma.user.findUnique({ where: { id: auth.context.userId }, select: { name: true, phone: true } }), prisma.gorutPlpk.findUnique({ where: { id: plpkId }, select: { id: true, code: true, name: true, phone: true, ranting: { select: { name: true, kecamatan: { select: { name: true } } } } } }),
      prisma.gorutMunfiq.findMany({ where: munfiqScopeWhere(auth.context), select: { code: true, name: true, phone: true, address: true, isActive: true }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 100 }),
      prisma.gorutTransaction.findMany({ where: txWhere, select: { code: true, transactionDate: true, currentState: true, totalAmount: true, createdAt: true, finalApprovedAt: true }, orderBy: [{ transactionDate: "desc" }, { id: "desc" }], take: 50 }),
      prisma.gorutTransaction.aggregate({ where: { ...txWhere, currentState: "FINAL_APPROVED", transactionDate: { gte: month } }, _sum: { totalAmount: true } }), prisma.gorutTransaction.count({ where: { ...txWhere, currentState: { notIn: ["FINAL_APPROVED", "REJECTED", "CANCELLED"] } } }), prisma.gorutTransaction.count({ where: { ...txWhere, currentState: "FINAL_APPROVED" } }), prisma.gorutMunfiq.count({ where: munfiqScopeWhere(auth.context) }),
    ])
    const plpk = plpkRow ? { code: plpkRow.code, name: plpkRow.name, phone: plpkRow.phone ?? "", upzis: { name: plpkRow.ranting.kecamatan.name, kecamatanName: plpkRow.ranting.kecamatan.name }, ranting: { name: plpkRow.ranting.name, desaKelurahanName: plpkRow.ranting.name } } : null
    return json({ profile: { name: user?.name ?? "", phone: user?.phone ?? "", plpk }, summary: { totalMunfiq, setoranBulanIni: decimal(monthApproved._sum.totalAmount), transaksiPending: pending, transaksiSelesai: completed }, munfiq: munfiqs.map((item) => ({ munfiqCode: item.code, name: item.name, phone: item.phone, address: item.address, desa: plpkRow?.ranting.name ?? "", status: item.isActive ? "aktif" : "nonaktif" })), transactions: transactions.map((item) => ({ transactionCode: item.code, transactionDate: item.transactionDate.toISOString().slice(0, 10), currentState: item.currentState, totalAmount: decimal(item.totalAmount), submittedAt: item.createdAt.toISOString(), finalApprovedAt: item.finalApprovedAt?.toISOString() ?? null })) })
  } catch { return errorResponse() }
}
