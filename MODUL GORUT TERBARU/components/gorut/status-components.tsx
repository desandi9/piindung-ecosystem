// Standardized Status Components
// Unified status display across the entire dashboard

'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Info,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_COLORS, ICON_SIZES } from '@/lib/gorut/design-system'
import { getStatusBadgeClass } from '@/lib/gorut/component-patterns'

export type StatusType = keyof typeof STATUS_COLORS

interface StatusIndicatorProps {
  status: StatusType
  label?: string
  showIcon?: boolean
  variant?: 'default' | 'outline' | 'subtle' | 'compact' | 'dot'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Status icon mapping
const STATUS_ICON_MAP: Record<StatusType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  approved: CheckCircle2,
  error: XCircle,
  rejected: XCircle,
  warning: AlertTriangle,
  pending: Clock,
  info: Info,
}

// Main Status Indicator Component
export function StatusIndicator({
  status,
  label,
  showIcon = true,
  variant = 'default',
  size = 'md',
  className,
}: StatusIndicatorProps) {
  const statusColor = STATUS_COLORS[status]
  const Icon = STATUS_ICON_MAP[status]
  const iconSize = size === 'sm' ? ICON_SIZES.xs : size === 'lg' ? ICON_SIZES.lg : ICON_SIZES.sm

  // Dot variant (circular indicator only)
  if (variant === 'dot') {
    return (
      <div
        className={cn('rounded-full', statusColor.dark, className, {
          'size-2': size === 'sm',
          'size-3': size === 'md',
          'size-4': size === 'lg',
        })}
        title={label || status}
      />
    )
  }

  // Badge variant
  if (variant === 'outline' || variant === 'subtle' || variant === 'compact') {
    return (
      <Badge
        variant="outline"
        className={cn(
          getStatusBadgeClass(status, variant),
          className,
          'gap-1.5',
        )}
      >
        {showIcon && <Icon className={cn('flex-shrink-0', iconSize)} />}
        <span>{label || status}</span>
      </Badge>
    )
  }

  // Default variant (filled badge)
  return (
    <Badge
      className={cn(
        getStatusBadgeClass(status, 'default'),
        className,
        'gap-1.5 font-medium',
      )}
    >
      {showIcon && <Icon className={cn('flex-shrink-0', iconSize)} />}
      <span>{label || status}</span>
    </Badge>
  )
}

// Status row component (for displaying status with additional info)
interface StatusRowProps {
  status: StatusType
  label?: string
  sublabel?: string
  timestamp?: string
  icon?: ReactNode
}

export function StatusRow({
  status,
  label,
  sublabel,
  timestamp,
  icon,
}: StatusRowProps) {
  const statusColor = STATUS_COLORS[status]
  const Icon = STATUS_ICON_MAP[status]

  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex-shrink-0 rounded-full p-1', statusColor.light)}>
        <Icon className={cn('size-4', statusColor.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label || status}</p>
        {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
      </div>
      {timestamp && <span className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</span>}
    </div>
  )
}

// Status bar for timeline or progress visualization
interface StatusBarProps {
  statuses: Array<{
    status: StatusType
    label?: string
    completed?: boolean
  }>
  direction?: 'horizontal' | 'vertical'
  className?: string
}

export function StatusBar({
  statuses,
  direction = 'horizontal',
  className,
}: StatusBarProps) {
  if (direction === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {statuses.map((item, idx) => {
          const Icon = STATUS_ICON_MAP[item.status]
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    item.completed ? STATUS_COLORS[item.status].dark : 'bg-muted',
                  )}
                >
                  <Icon className="size-4 text-white" />
                </div>
                {idx < statuses.length - 1 && (
                  <div className={cn('w-0.5 h-12', item.completed ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium">{item.label || item.status}</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {statuses.map((item, idx) => {
        const Icon = STATUS_ICON_MAP[item.status]
        return (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                item.completed ? STATUS_COLORS[item.status].dark : 'bg-muted text-muted-foreground',
                item.completed && 'text-white',
              )}
            >
              {item.completed ? <Icon className="size-3.5" /> : idx + 1}
            </div>
            {idx < statuses.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-6',
                  item.completed ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Status summary (count/aggregate view)
interface StatusSummaryProps {
  counts: Record<StatusType, number>
  total?: number
  showPercentage?: boolean
}

export function StatusSummary({
  counts,
  total,
  showPercentage = false,
}: StatusSummaryProps) {
  const totalCount = total || Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(counts).map(([status, count]) => {
        const percentage = showPercentage ? Math.round((count / totalCount) * 100) : 0
        return (
          <div key={status} className="flex items-center gap-2">
            <StatusIndicator
              status={status as StatusType}
              variant="dot"
              size="md"
            />
            <span className="text-sm text-muted-foreground">
              {count}
              {showPercentage && ` (${percentage}%)`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Inline status tag (minimal, text-only)
export function StatusTag({
  status,
  className,
}: {
  status: StatusType
  className?: string
}) {
  const statusColor = STATUS_COLORS[status]
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-xs font-medium',
        statusColor.badge,
        className,
      )}
    >
      {status}
    </span>
  )
}

// Status group (multiple related statuses)
export function StatusGroup({
  statuses,
  className,
}: {
  statuses: StatusType[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {statuses.map(status => (
        <StatusTag key={status} status={status} />
      ))}
    </div>
  )
}

// Export all status types for use in parent components
export const ALL_STATUSES: StatusType[] = [
  'success',
  'error',
  'warning',
  'info',
  'pending',
  'approved',
  'rejected',
]
