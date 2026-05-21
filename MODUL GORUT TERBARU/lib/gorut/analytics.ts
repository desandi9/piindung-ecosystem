import {
  activityLogData,
  approvalTransactionData,
  backupDataList,
  financeStats,
  monthlyProgressData,
  notificationData,
  transactionData,
  statistikGorut,
  formatRupiah,
} from './data'
import { generateDashboardInsights } from './insights'
import { getWilayahOverview } from './wilayah'

export type MonitoringMetric = {
  label: string
  value: string | number
  unit?: string
  status: 'online' | 'warning' | 'offline'
}

export type MonitoringEvent = {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  detail: string
  timestamp: string
}

export function getMonitoringSnapshot() {
  const wilayah = getWilayahOverview()
  const pendingApprovals = approvalTransactionData.filter((item) => item.overallStatus === 'pending').length
  const failedTransactions = notificationData.filter((item) => item.category === 'failed_transaction').length
  const whatsappAlerts = notificationData.filter(
    (item) => item.category === 'whatsapp_gateway' && item.priority === 'critical',
  ).length
  const latestBackup = backupDataList[0]
  const latestBackupHours = latestBackup?.tanggal
    ? Math.max(1, Math.round((Date.now() - Date.parse(latestBackup.tanggal)) / 36e5))
    : 0
  const activePlpkDevices = wilayah.plpk.filter((item) => item.status !== 'nonaktif').length
  const warningRegions = wilayah.kecamatan.filter((item) => item.healthScore < 80).length
  const onlineAdmins = activityLogData.filter((item) => item.timestamp.startsWith('2026-05-14')).length

  const metrics: MonitoringMetric[] = [
    { label: 'Kecamatan Dimonitor', value: wilayah.kecamatan.length, status: 'online' },
    { label: 'PLPK Aktif', value: activePlpkDevices, status: activePlpkDevices >= 5 ? 'online' : 'warning' },
    { label: 'Pending Approval', value: pendingApprovals, status: pendingApprovals > 2 ? 'warning' : 'online' },
    { label: 'Failed Transactions', value: failedTransactions, status: failedTransactions > 0 ? 'warning' : 'online' },
    { label: 'WhatsApp Gateway', value: whatsappAlerts > 0 ? 'Degraded' : 'Connected', status: whatsappAlerts > 0 ? 'warning' : 'online' },
    { label: 'Backup Terakhir', value: `${latestBackupHours} jam lalu`, status: latestBackup?.status === 'gagal' ? 'offline' : latestBackup?.status === 'proses' ? 'warning' : 'online' },
    { label: 'Rata-rata Health Score', value: Math.round(wilayah.kecamatan.reduce((sum, item) => sum + item.healthScore, 0) / wilayah.kecamatan.length), unit: '/100', status: warningRegions > 2 ? 'warning' : 'online' },
    { label: 'Admin Sessions', value: onlineAdmins, status: 'online' },
  ]

  const api = {
    responseTime: Math.max(72, 60 + pendingApprovals * 7 + failedTransactions * 8),
    uptime: warningRegions > 3 ? 98.7 : 99.94,
    errorRate: Number((failedTransactions / Math.max(1, transactionData.length) * 100).toFixed(2)),
  }

  const database = {
    connectionPool: `${24 + pendingApprovals}/${50}`,
    queryTime: Math.max(12, 9 + pendingApprovals * 3),
    replicationLag: failedTransactions > 0 ? failedTransactions * 3 : 0,
  }

  const gateway = {
    status: whatsappAlerts > 0 ? 'warning' : 'online',
    messagesSent24h: 1180 + activityLogData.filter((item) => item.action === 'setoran').length * 20,
    failedMessages: whatsappAlerts > 0 ? 2 : 0,
    lastSyncMinutes: whatsappAlerts > 0 ? 17 : 5,
  }

  const recentEvents: MonitoringEvent[] = [
    ...activityLogData.slice(0, 4).map((item) => ({
      id: `activity-${item.id}`,
      type: item.action === 'login' || item.action === 'validasi' ? 'success' : item.action === 'settings' ? 'info' : 'warning',
      message: `${item.userName} melakukan ${item.action}`,
      detail: item.detail,
      timestamp: item.timestamp,
    })),
    ...notificationData.slice(0, 4).map((item) => ({
      id: `notif-${item.id}`,
      type: item.priority === 'critical' ? 'error' : item.priority === 'warning' ? 'warning' : 'info',
      message: item.title,
      detail: item.message,
      timestamp: item.timestamp,
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8)

  return { metrics, api, database, gateway, recentEvents }
}

export function getAnalyticsOverview() {
  const wilayah = getWilayahOverview()
  const insights = generateDashboardInsights(statistikGorut, wilayah.kecamatan)
  const totalPending = wilayah.kecamatan.reduce((sum, item) => sum + item.pendingTransactions, 0)
  const totalHealth = Math.round(
    wilayah.kecamatan.reduce((sum, item) => sum + item.healthScore, 0) / wilayah.kecamatan.length,
  )
  const topKecamatan = [...wilayah.kecamatan].sort((a, b) => b.totalTerkumpul - a.totalTerkumpul).slice(0, 5)
  const riskKecamatan = [...wilayah.kecamatan]
    .sort((a, b) => a.healthScore - b.healthScore || b.pendingTransactions - a.pendingTransactions)
    .slice(0, 5)
  const topPlpk = [...wilayah.plpk].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5)
  const topUpzis = [...wilayah.upzis].sort((a, b) => b.totalSetoran - a.totalSetoran).slice(0, 5)
  const monthlySeries = monthlyProgressData.map((item) => ({
    label: item.bulan,
    target: item.target,
    actual: item.actual,
    gap: item.actual - item.target,
    achievement: Math.round((item.actual / item.target) * 100),
  }))

  return {
    headline: {
      totalCollected: formatRupiah(financeStats.totalPendapatan),
      monthlyCollected: formatRupiah(financeStats.pendapatanBulanIni),
      growth: financeStats.pertumbuhanPendapatan,
      totalHealth,
      totalPending,
    },
    insights,
    topKecamatan,
    riskKecamatan,
    topPlpk,
    topUpzis,
    monthlySeries,
  }
}
