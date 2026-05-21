'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  Activity,
  Zap,
  Target,
  Database
} from 'lucide-react'

// Smart Insight Card Component
export function SmartInsight({
  type,
  title,
  value,
  message,
  icon: Icon,
  action,
  priority = 'info',
}: {
  type: 'pending' | 'achievement' | 'warning' | 'info' | 'success'
  title: string
  value?: string | number
  message: string
  icon?: React.ComponentType<{ className?: string }>
  action?: { label: string; onClick: () => void }
  priority?: 'low' | 'info' | 'warning' | 'critical'
}) {
  const configs = {
    pending: {
      icon: Clock,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-900',
      text: 'text-amber-900 dark:text-amber-100',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600',
    },
    achievement: {
      icon: TrendingUp,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-900',
      text: 'text-emerald-900 dark:text-emerald-100',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-900',
      text: 'text-red-900 dark:text-red-100',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconColor: 'text-red-600',
    },
    success: {
      icon: CheckCircle2,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-900',
      text: 'text-emerald-900 dark:text-emerald-100',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600',
    },
    info: {
      icon: Activity,
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-900',
      text: 'text-blue-900 dark:text-blue-100',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600',
    },
  }

  const config = configs[type]
  const DisplayIcon = Icon || config.icon

  return (
    <div className={cn('rounded-lg border p-4 transition-all hover:shadow-md', config.bg, config.border)}>
      <div className="flex items-start gap-3">
        <div className={cn('flex size-10 items-center justify-center rounded-lg flex-shrink-0', config.iconBg)}>
          <DisplayIcon className={cn('size-5', config.iconColor)} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn('text-sm font-semibold', config.text)}>{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{message}</p>
            </div>
            {value && (
              <span className={cn('text-lg font-bold whitespace-nowrap', config.text)}>
                {value}
              </span>
            )}
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 mt-2 transition-colors"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Insights Grid
export function SmartInsightsGrid({
  children,
  columns = 'auto',
}: {
  children: ReactNode
  columns?: 'auto' | '2' | '3'
}) {
  const gridClass = {
    auto: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '2': 'grid gap-4 sm:grid-cols-2',
    '3': 'grid gap-4 lg:grid-cols-3',
  }

  return <div className={gridClass[columns]}>{children}</div>
}

// Operational Metrics Section
export function OperationalInsights() {
  const insights = [
    {
      type: 'pending' as const,
      title: '5 Approvals Pending',
      message: 'Awaiting your review for processing',
      value: '5',
      action: { label: 'Review', onClick: () => {} },
    },
    {
      type: 'warning' as const,
      title: '3 PLPK Inactive',
      message: 'This week with no activity logged',
      value: '3',
      action: { label: 'Check', onClick: () => {} },
    },
    {
      type: 'achievement' as const,
      title: 'Monthly Target',
      message: 'Reached 78% of this month&apos;s goal',
      value: '78%',
    },
    {
      type: 'success' as const,
      title: 'Backup Completed',
      message: 'System backup finished successfully',
      icon: Database,
      action: { label: 'Details', onClick: () => {} },
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Operational Insights</h3>
        <p className="text-xs text-muted-foreground">Quick updates on system status and pending actions</p>
      </div>
      <SmartInsightsGrid>
        {insights.map((insight, idx) => (
          <SmartInsight
            key={idx}
            {...insight}
          />
        ))}
      </SmartInsightsGrid>
    </div>
  )
}

// Performance Insights
export function PerformanceInsights() {
  const insights = [
    {
      type: 'achievement' as const,
      title: 'Top Performer',
      message: 'Kecamatan Garut leads monthly collections',
      value: 'Rp 45M',
    },
    {
      type: 'info' as const,
      title: 'Active Users',
      message: 'PLPKs active in the last 24 hours',
      value: '12',
    },
    {
      type: 'pending' as const,
      title: 'Pending Validations',
      message: 'Transactions awaiting confirmation',
      value: '8',
      action: { label: 'Validate', onClick: () => {} },
    },
    {
      type: 'success' as const,
      title: 'Accuracy Rate',
      message: 'Data validation success this month',
      value: '99.2%',
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Performance Metrics</h3>
        <p className="text-xs text-muted-foreground">System performance and data quality indicators</p>
      </div>
      <SmartInsightsGrid>
        {insights.map((insight, idx) => (
          <SmartInsight
            key={idx}
            {...insight}
          />
        ))}
      </SmartInsightsGrid>
    </div>
  )
}

// Alert Banner for critical insights
export function CriticalInsightBanner({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900 dark:text-red-100">{title}</p>
          <p className="text-xs text-red-700 dark:text-red-200 mt-1">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs font-medium text-red-600 hover:text-red-700 mt-2 transition-colors"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Quick Stats Pills
export function StatPill({
  label,
  value,
  trend,
  trendDirection = 'up',
}: {
  label: string
  value: string | number
  trend?: string | number
  trendDirection?: 'up' | 'down' | 'stable'
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}:</span>
      <span className="font-semibold text-sm">{value}</span>
      {trend && (
        <span
          className={cn(
            'text-xs font-medium',
            trendDirection === 'up' && 'text-emerald-600',
            trendDirection === 'down' && 'text-red-600',
            trendDirection === 'stable' && 'text-muted-foreground'
          )}
        >
          {trendDirection === 'up' && '↑'}{trendDirection === 'down' && '↓'} {trend}
        </span>
      )}
    </div>
  )
}

// Stats Pill Row
export function StatPillRow({
  pills,
}: {
  pills: Array<{
    label: string
    value: string | number
    trend?: string | number
    trendDirection?: 'up' | 'down' | 'stable'
  }>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill, idx) => (
        <StatPill key={idx} {...pill} />
      ))}
    </div>
  )
}

// Lightweight Timeline for recent insights
export function InsightTimeline({
  items,
}: {
  items: Array<{
    label: string
    value: string
    time: string
    type?: 'success' | 'info' | 'warning'
  }>
}) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-3 pb-3" style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div className="min-w-24">
            <p className="text-xs font-medium text-muted-foreground">{item.time}</p>
          </div>
          <div>
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
