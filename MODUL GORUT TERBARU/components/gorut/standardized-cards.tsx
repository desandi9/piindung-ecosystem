// Standardized Card Component
// Replaces scattered card implementations with unified styling

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { COMPONENT_SPACING, SHADOWS, TRANSITIONS } from '@/lib/gorut/design-system'
import { getCardClass, getSpacingClass } from '@/lib/gorut/component-patterns'

interface StandardCardProps {
  children: ReactNode
  className?: string
  elevated?: boolean
  bordered?: boolean
  interactive?: boolean
  compact?: boolean
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
  title?: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  headerAction?: ReactNode
}

export function StandardCard({
  children,
  className,
  elevated = false,
  bordered = true,
  interactive = false,
  compact = false,
  padding = 'md',
  onClick,
  title,
  subtitle,
  footer,
  headerAction,
}: StandardCardProps) {
  const paddingClass = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  }[padding]

  return (
    <div
      className={cn(
        'rounded-lg bg-card',
        bordered && 'border border-border/50',
        elevated && SHADOWS.md,
        interactive && `cursor-pointer ${TRANSITIONS.base} hover:shadow-lg hover:border-primary/30`,
        paddingClass,
        className,
      )}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {(title || subtitle || headerAction) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
      {footer && (
        <div className="mt-4 border-t border-border/50 pt-4">
          {footer}
        </div>
      )}
    </div>
  )
}

// ============= CARD GRID =============
interface CardGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4 | 'auto'
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function CardGrid({
  children,
  columns = 'auto',
  gap = 'md',
  className,
}: CardGridProps) {
  const gapClass = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap]

  const columnClass =
    columns === 'auto'
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
      : columns === 1
        ? 'grid-cols-1'
        : columns === 2
          ? 'grid-cols-1 md:grid-cols-2'
          : columns === 3
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'

  return (
    <div className={cn('grid', columnClass, gapClass, className)}>
      {children}
    </div>
  )
}

// ============= STAT CARD (COMMON PATTERN) =============
interface StatCardProps {
  label: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({ label, value, change, icon, trend }: StatCardProps) {
  const trendClass = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground',
  }[trend || 'neutral']

  return (
    <StandardCard compact padding="lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change && (
            <p className={cn('text-xs font-medium mt-2', trendClass)}>
              {change.isPositive ? '+' : '-'}{change.value}%
            </p>
          )}
        </div>
        {icon && <div className="flex-shrink-0 text-primary opacity-60">{icon}</div>}
      </div>
    </StandardCard>
  )
}

// ============= INFO CARD =============
interface InfoCardProps {
  icon?: ReactNode
  title: string
  value: string
  details?: string
  action?: ReactNode
}

export function InfoCard({ icon, title, value, details, action }: InfoCardProps) {
  return (
    <StandardCard compact padding="md">
      <div className="flex items-center gap-3">
        {icon && <div className="flex-shrink-0 text-primary">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
          {details && <p className="text-xs text-muted-foreground mt-1">{details}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </StandardCard>
  )
}

// ============= LIST CARD =============
interface ListItem {
  id: string
  label: string
  value?: string
  secondary?: string
  icon?: ReactNode
  action?: ReactNode
}

interface ListCardProps {
  title?: string
  items: ListItem[]
  divider?: boolean
  interactive?: boolean
  onItemClick?: (id: string) => void
}

export function ListCard({
  title,
  items,
  divider = true,
  interactive = false,
  onItemClick,
}: ListCardProps) {
  return (
    <StandardCard title={title} compact padding="md">
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center justify-between gap-3 p-2',
              interactive && 'cursor-pointer hover:bg-muted rounded-md transition-colors',
              divider && idx !== items.length - 1 && 'border-b border-border/30 pb-2',
            )}
            onClick={() => onItemClick?.(item.id)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                {item.secondary && <p className="text-xs text-muted-foreground truncate">{item.secondary}</p>}
              </div>
            </div>
            {item.value && <p className="text-sm font-semibold text-foreground flex-shrink-0">{item.value}</p>}
            {item.action && <div className="flex-shrink-0">{item.action}</div>}
          </div>
        ))}
      </div>
    </StandardCard>
  )
}

// ============= EMPTY CARD =============
interface EmptyCardProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyCard({
  icon,
  title,
  description,
  action,
}: EmptyCardProps) {
  return (
    <StandardCard className="flex flex-col items-center justify-center min-h-[200px]" padding="xl">
      {icon && <div className="text-muted-foreground mb-3 opacity-50 scale-150">{icon}</div>}
      <h3 className="font-semibold text-foreground text-center">{title}</h3>
      {description && <p className="text-sm text-muted-foreground text-center mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </StandardCard>
  )
}

// ============= LOADING CARD =============
export function LoadingCard({ count = 3 }: { count?: number }) {
  return (
    <StandardCard compact padding="md">
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="size-10 rounded bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </StandardCard>
  )
}
