'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Pin,
  PinOff,
  ArrowRight,
  Activity,
  BarChart3,
  Lock,
  Settings2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DashboardInsight, InsightCategory, InsightPriority } from '@/lib/gorut/insights'
import { formatInsightTime } from '@/lib/gorut/insights'

// Category icon mapping
const categoryIcons: Record<InsightCategory, typeof Activity> = {
  operational: Activity,
  finance: BarChart3,
  performance: TrendingUp,
  security: Lock,
  system: Settings2,
}

// Category colors
const categoryColors: Record<InsightCategory, { badge: string; text: string }> = {
  operational: { badge: 'bg-blue-500/10 text-blue-600', text: 'text-blue-600' },
  finance: { badge: 'bg-emerald-500/10 text-emerald-600', text: 'text-emerald-600' },
  performance: { badge: 'bg-purple-500/10 text-purple-600', text: 'text-purple-600' },
  security: { badge: 'bg-orange-500/10 text-orange-600', text: 'text-orange-600' },
  system: { badge: 'bg-slate-500/10 text-slate-600', text: 'text-slate-600' },
}

// Priority colors
const priorityColors: Record<InsightPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/5', text: 'text-red-700', border: 'border-red-500/20' },
  high: { bg: 'bg-orange-500/5', text: 'text-orange-700', border: 'border-orange-500/20' },
  medium: { bg: 'bg-amber-500/5', text: 'text-amber-700', border: 'border-amber-500/20' },
  low: { bg: 'bg-blue-500/5', text: 'text-blue-700', border: 'border-blue-500/20' },
}

interface InsightCardProps {
  insight: DashboardInsight
  onPin?: (id: string) => void
  isPinned?: boolean
  compact?: boolean
}

export function InsightCard({
  insight,
  onPin,
  isPinned = false,
  compact = false,
}: InsightCardProps) {
  const CategoryIcon = categoryIcons[insight.category]
  const categoryColor = categoryColors[insight.category]
  const priorityColor = priorityColors[insight.priority]

  // Status icon
  const getStatusIcon = () => {
    switch (insight.status) {
      case 'success':
        return <CheckCircle2 className="size-4 text-emerald-600" />
      case 'warning':
        return <AlertTriangle className="size-4 text-amber-600" />
      case 'error':
        return <AlertCircle className="size-4 text-red-600" />
      default:
        return <Zap className="size-4 text-blue-600" />
    }
  }

  // Trend icon
  const getTrendIcon = () => {
    if (!insight.trend) return null
    if (insight.trend === 'up') {
      return <TrendingUp className="size-3.5 text-emerald-600" />
    }
    if (insight.trend === 'down') {
      return <TrendingDown className="size-3.5 text-red-600" />
    }
    return null
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn('p-2 rounded-lg', categoryColor.badge)}>
            <CategoryIcon className={cn('size-4', categoryColor.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn('text-sm font-semibold leading-tight', priorityColor.text, 'line-clamp-2')}>
                {insight.title}
              </h3>
              {insight.trend && (
                <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                  {getTrendIcon()}
                  {insight.trendValue && (
                    <span className={insight.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                      {insight.trend === 'up' ? '+' : '-'}{insight.trendValue}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pin Button */}
        {onPin && !compact && (
          <button
            onClick={() => onPin(insight.id)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? (
              <Pin className="size-4 fill-amber-500 text-amber-500" />
            ) : (
              <PinOff className="size-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>

        {/* Details Grid */}
        {insight.details && !compact && (
          <div className="bg-muted/30 rounded-md p-2 space-y-1">
            {insight.details.metric && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Metric:</span>
                <span className="text-xs font-semibold text-foreground">{insight.details.metric}</span>
              </div>
            )}
            {insight.details.change && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Period:</span>
                <span className="text-xs text-foreground">{insight.details.change}</span>
              </div>
            )}
            {insight.details.target && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Target:</span>
                <span className="text-xs text-foreground">{insight.details.target}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">{formatInsightTime(insight.timestamp)}</span>
        {insight.actionUrl && !compact && (
          <Link href={insight.actionUrl}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 gap-1 hover:bg-muted"
            >
              {insight.actionLabel || 'View'}
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )

  if (compact) {
    return (
      <div className={cn(
        'p-3 rounded-lg border transition-colors',
        priorityColor.bg,
        priorityColor.border,
      )}>
        {content}
      </div>
    )
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-all hover:shadow-sm',
      priorityColor.bg,
      priorityColor.border,
    )}>
      {content}
    </div>
  )
}

interface InsightGridProps {
  insights: DashboardInsight[]
  maxCols?: number
  compact?: boolean
  onPin?: (id: string) => void
  pinnedIds?: string[]
}

export function InsightGrid({
  insights,
  maxCols = 3,
  compact = false,
  onPin,
  pinnedIds = [],
}: InsightGridProps) {
  if (!insights.length) {
    return (
      <div className="text-center py-8">
        <Activity className="size-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No insights available</p>
      </div>
    )
  }

  return (
    <div className={cn(
      'grid gap-4',
      maxCols === 1 && 'grid-cols-1',
      maxCols === 2 && 'grid-cols-1 md:grid-cols-2',
      maxCols === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      maxCols === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    )}>
      {insights.map(insight => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onPin={onPin}
          isPinned={pinnedIds.includes(insight.id)}
          compact={compact}
        />
      ))}
    </div>
  )
}

interface InsightPanelProps {
  insights: DashboardInsight[]
  onPin?: (id: string) => void
  pinnedIds?: string[]
}

export function InsightPanel({
  insights,
  onPin,
  pinnedIds = [],
}: InsightPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | 'all'>('all')

  const categories: Array<InsightCategory | 'all'> = ['all', 'operational', 'finance', 'performance', 'security', 'system']

  const filteredInsights =
    selectedCategory === 'all'
      ? insights
      : insights.filter(i => i.category === selectedCategory)

  const categoryLabel: Record<string, string> = {
    all: 'All Insights',
    operational: 'Operational',
    finance: 'Finance',
    performance: 'Performance',
    security: 'Security',
    system: 'System',
  }

  return (
    <div className="space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex min-w-0 items-center gap-2 text-left text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          Dashboard Intelligence
          <Badge variant="secondary" className="ml-2">
            {filteredInsights.length}
          </Badge>
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 rounded-lg text-xs"
          onClick={() => setSelectedCategory('all')}
        >
          <Zap className="size-3.5" />
          Refresh
        </Button>
      </div>

      {isExpanded && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedCategory === cat
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {categoryLabel[cat]}
              </button>
            ))}
          </div>

          {/* Insights Grid */}
          <InsightGrid
            insights={filteredInsights}
            maxCols={3}
            onPin={onPin}
            pinnedIds={pinnedIds}
          />
        </>
      )}
    </div>
  )
}

// Quick insight banner for critical alerts
interface CriticalInsightBannerProps {
  insights: DashboardInsight[]
  onDismiss?: () => void
}

export function CriticalInsightBanner({
  insights,
  onDismiss,
}: CriticalInsightBannerProps) {
  const criticalInsights = insights.filter(i => i.priority === 'critical')

  if (!criticalInsights.length) return null

  const insight = criticalInsights[0]
  const IconComponent = insight.status === 'error' ? AlertCircle : AlertTriangle

  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-4">
      <IconComponent className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-red-900">{insight.title}</p>
        <p className="text-xs text-red-800 mt-1">{insight.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {insight.actionUrl && (
          <Link href={insight.actionUrl}>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              {insight.actionLabel || 'Action'}
            </Button>
          </Link>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 px-2"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  )
}
