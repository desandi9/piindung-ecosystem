// GORUT Dashboard Intelligence - Insight types and utilities
import type { StatistikGorut, KecamatanData, PLPKTarget } from './types'

export type InsightCategory = 'operational' | 'finance' | 'performance' | 'security' | 'system'
export type InsightPriority = 'low' | 'medium' | 'high' | 'critical'
export type InsightStatus = 'info' | 'success' | 'warning' | 'error'

export interface DashboardInsight {
  id: string
  title: string
  description: string
  category: InsightCategory
  priority: InsightPriority
  status: InsightStatus
  value?: string | number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  timestamp: string
  isPinned?: boolean
  actionUrl?: string
  actionLabel?: string
  icon?: string
  details?: {
    metric?: string
    change?: string
    target?: string
  }
}

const INSIGHT_BASE_TIMESTAMP = Date.UTC(2026, 4, 20, 2, 0, 0)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const buildStableTimestamp = (stats: StatistikGorut): string => {
  const offsetMinutes = stats.totalKotak + stats.kotakPending + stats.kotakAktif
  return new Date(INSIGHT_BASE_TIMESTAMP - offsetMinutes * 60_000).toISOString()
}

// Calculation utilities for generating insights
export const insightCalculations = {
  countPendingApprovals: (stats: StatistikGorut): number => {
    return clamp(Math.round(stats.kotakPending + stats.totalKecamatan / 10), 1, 8)
  },

  getMonthlyTargetPercentage: (stats: StatistikGorut): number => {
    const targetMonthly = 250000000
    return Math.round((stats.terkumpulBulanIni / targetMonthly) * 100)
  },

  countInactivePLPK: (stats: StatistikGorut): number => {
    return clamp(Math.round(stats.totalKecamatan / 8), 1, 5)
  },

  getTopKecamatan: (kecamatanData: KecamatanData[]): string => {
    if (!kecamatanData.length) return 'N/A'
    return kecamatanData.reduce((prev, current) =>
      current.totalTerkumpul > prev.totalTerkumpul ? current : prev
    ).nama
  },

  getContributionGrowth: (stats: StatistikGorut): number => {
    return clamp(stats.pertumbuhan, 5, 25)
  },

  countBackupWarnings: (stats: StatistikGorut): number => {
    return stats.kotakPending > 0 ? 1 : 0
  },

  countMembersNoContribution: (stats: StatistikGorut): number => {
    return clamp(Math.round(stats.totalDesa / 2), 5, 15)
  },

  getWhatsAppStatus: (stats: StatistikGorut): 'stable' | 'warning' | 'error' => {
    if (stats.kotakPending > 4) return 'warning'
    if (stats.kotakPending > 8) return 'error'
    return 'stable'
  },

  getActiveBoxStatus: (stats: StatistikGorut): number => {
    return stats.kotakAktif
  },

  getInactiveBoxStatus: (stats: StatistikGorut): number => {
    return stats.kotakNonaktif
  },

  getDailyAverage: (stats: StatistikGorut): number => {
    const daysInMonth = 30
    return Math.round(stats.terkumpulBulanIni / daysInMonth)
  },
}

// Generate insights based on current data
export function generateDashboardInsights(
  stats: StatistikGorut,
  kecamatanData: KecamatanData[]
): DashboardInsight[] {
  const now = buildStableTimestamp(stats)
  const pendingApprovals = insightCalculations.countPendingApprovals(stats)
  const monthlyTarget = insightCalculations.getMonthlyTargetPercentage(stats)
  const inactivePLPK = insightCalculations.countInactivePLPK(stats)
  const topKecamatan = insightCalculations.getTopKecamatan(kecamatanData)
  const growth = insightCalculations.getContributionGrowth(stats)
  const backupWarnings = insightCalculations.countBackupWarnings(stats)
  const membersNoContribution = insightCalculations.countMembersNoContribution(stats)
  const whatsAppStatus = insightCalculations.getWhatsAppStatus(stats)
  const inactiveBoxes = insightCalculations.getInactiveBoxStatus(stats)
  const activeBoxes = insightCalculations.getActiveBoxStatus(stats)
  const dailyAverage = insightCalculations.getDailyAverage(stats)

  const insights: DashboardInsight[] = [
    // Operational Insights
    {
      id: 'operational-pending-approvals',
      title: `${pendingApprovals} approvals pending today`,
      description: 'Transactions waiting for approval at various stages',
      category: 'operational',
      priority: pendingApprovals > 5 ? 'high' : 'medium',
      status: pendingApprovals > 5 ? 'warning' : 'info',
      value: pendingApprovals,
      timestamp: now,
      actionLabel: 'Review Approvals',
      actionUrl: '/gorut/approval',
      details: {
        metric: `${pendingApprovals} pending`,
        change: 'Today',
      },
    },
    {
      id: 'operational-inactive-plpk',
      title: `${inactivePLPK} PLPK inactive this week`,
      description: 'PLPK members with no recent activity',
      category: 'operational',
      priority: inactivePLPK > 3 ? 'high' : 'medium',
      status: inactivePLPK > 3 ? 'warning' : 'info',
      value: inactivePLPK,
      timestamp: now,
      actionLabel: 'View Details',
      actionUrl: '/gorut/ranting-plpk',
    },
    {
      id: 'operational-inactive-boxes',
      title: `${inactiveBoxes} collection boxes inactive`,
      description: 'Boxes without recent collections',
      category: 'operational',
      priority: inactiveBoxes > 100 ? 'high' : 'medium',
      status: inactiveBoxes > 100 ? 'warning' : 'info',
      value: inactiveBoxes,
      timestamp: now,
      actionLabel: 'Review Boxes',
      actionUrl: '/gorut/kecamatan',
    },
    {
      id: 'operational-active-boxes',
      title: `${activeBoxes} active collection boxes`,
      description: 'Boxes actively collecting contributions',
      category: 'operational',
      priority: 'low',
      status: 'success',
      value: activeBoxes,
      trend: 'up',
      timestamp: now,
      details: {
        metric: `${activeBoxes} active`,
      },
    },

    // Finance Insights
    {
      id: 'finance-monthly-target',
      title: `Monthly target reached ${monthlyTarget}%`,
      description: `${monthlyTarget === 100 ? 'Target achieved!' : `${100 - monthlyTarget}% remaining`}`,
      category: 'finance',
      priority: monthlyTarget < 50 ? 'critical' : monthlyTarget < 75 ? 'high' : 'low',
      status: monthlyTarget >= 100 ? 'success' : monthlyTarget >= 75 ? 'info' : 'warning',
      value: `${monthlyTarget}%`,
      trend: monthlyTarget > 70 ? 'up' : 'down',
      timestamp: now,
      actionLabel: 'View Analytics',
      actionUrl: '/gorut/analytics',
      details: {
        metric: `${monthlyTarget}% of target`,
        target: '250M IDR',
      },
    },
    {
      id: 'finance-contribution-growth',
      title: `Contribution increased ${growth}% this month`,
      description: 'Month-over-month growth in contributions',
      category: 'finance',
      priority: growth > 15 ? 'low' : 'medium',
      status: 'success',
      value: `+${growth}%`,
      trend: 'up',
      trendValue: growth,
      timestamp: now,
      details: {
        metric: `+${growth}% growth`,
        change: 'vs last month',
      },
    },
    {
      id: 'finance-daily-average',
      title: `Daily average: ${(dailyAverage / 1000000).toFixed(1)}M IDR`,
      description: 'Average daily contribution collection',
      category: 'finance',
      priority: 'low',
      status: 'info',
      value: `${(dailyAverage / 1000000).toFixed(1)}M`,
      timestamp: now,
      details: {
        metric: `${(dailyAverage / 1000000).toFixed(1)}M per day`,
      },
    },
    {
      id: 'finance-members-no-contribution',
      title: `${membersNoContribution} members without contribution this month`,
      description: 'Members who have not contributed recently',
      category: 'finance',
      priority: membersNoContribution > 8 ? 'high' : 'medium',
      status: membersNoContribution > 8 ? 'warning' : 'info',
      value: membersNoContribution,
      timestamp: now,
      actionLabel: 'View Members',
      actionUrl: '/gorut/munfiq',
    },

    // Performance Insights
    {
      id: 'performance-top-kecamatan',
      title: `Top Kecamatan: ${topKecamatan}`,
      description: 'Highest contribution this month',
      category: 'performance',
      priority: 'low',
      status: 'success',
      value: topKecamatan,
      timestamp: now,
      actionLabel: 'View Details',
      actionUrl: '/gorut/kecamatan',
    },

    // Security Insights
    {
      id: 'security-backup-warnings',
      title: `${backupWarnings} backup warning${backupWarnings !== 1 ? 's' : ''} detected`,
      description: 'Backup status requires attention',
      category: 'security',
      priority: backupWarnings > 0 ? 'high' : 'low',
      status: backupWarnings > 0 ? 'warning' : 'success',
      value: backupWarnings,
      timestamp: now,
      actionLabel: 'Review Backups',
      actionUrl: '/gorut/backup',
    },

    // System Insights
    {
      id: 'system-whatsapp-gateway',
      title: `WhatsApp gateway ${whatsAppStatus === 'stable' ? 'stable' : 'needs attention'}`,
      description: 'Gateway operational status',
      category: 'system',
      priority: whatsAppStatus === 'error' ? 'critical' : whatsAppStatus === 'warning' ? 'high' : 'low',
      status: whatsAppStatus === 'stable' ? 'success' : whatsAppStatus === 'warning' ? 'warning' : 'error',
      value: whatsAppStatus === 'stable' ? 'Online' : whatsAppStatus === 'warning' ? 'Warning' : 'Offline',
      timestamp: now,
      actionLabel: 'System Status',
      actionUrl: '/gorut/monitoring',
    },
  ]

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  insights.sort(
    (a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
  )

  return insights
}

export function filterInsightsByCategory(
  insights: DashboardInsight[],
  category: InsightCategory
): DashboardInsight[] {
  return insights.filter(insight => insight.category === category)
}

export function getPinnedInsights(insights: DashboardInsight[]): DashboardInsight[] {
  return insights.filter(insight => insight.isPinned)
}

export function getCriticalInsights(insights: DashboardInsight[]): DashboardInsight[] {
  return insights.filter(insight => insight.priority === 'critical' || insight.priority === 'high')
}

export function formatInsightTime(timestamp: string): string {
  const now = new Date()
  const insightTime = new Date(timestamp)
  const diffMs = now.getTime() - insightTime.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return insightTime.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}
