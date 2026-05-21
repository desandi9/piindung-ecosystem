'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Dashboard Page Wrapper
export function DashboardPage({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  )
}

// Page Header with consistent styling
export function DashboardPageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  )
}

// Dashboard Section with consistent spacing and styling
export function DashboardSection({
  title,
  description,
  children,
  className,
  headerAction,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerAction?: ReactNode
}) {
  if (!title) {
    return <div className={cn('space-y-4', className)}>{children}</div>
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {headerAction}
      </div>
      {children}
    </div>
  )
}

// Stats Grid with consistent card styling
export function StatsGrid({
  children,
  columns = 'auto',
  className,
}: {
  children: ReactNode
  columns?: 'auto' | '2' | '3' | '4'
  className?: string
}) {
  const gridClass = {
    auto: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
    '2': 'grid gap-4 sm:grid-cols-2',
    '3': 'grid gap-4 sm:grid-cols-3',
    '4': 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn(gridClass[columns], className)}>
      {children}
    </div>
  )
}

// Stat Card with consistent styling
export function StatCard({
  icon: Icon,
  label,
  value,
  description,
  trend,
  trendDirection = 'up',
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  description?: string
  trend?: string | number
  trendDirection?: 'up' | 'down' | 'stable'
  className?: string
}) {
  return (
    <Card className={cn('border-0 bg-card shadow-sm', className)}>
      <CardContent className="flex items-start gap-4 p-4 sm:p-6">
        {Icon && (
          <div className="flex size-10 sm:size-12 items-center justify-center rounded-lg bg-emerald-500/10">
            <Icon className="size-5 sm:size-6 text-emerald-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-bold">{value}</p>
            {trend && (
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                trendDirection === 'up' && 'text-emerald-600',
                trendDirection === 'down' && 'text-red-600',
                trendDirection === 'stable' && 'text-muted-foreground'
              )}>
                {trendDirection === 'up' && '↑'} {trend}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// Content Card with consistent styling
export function ContentCard({
  title,
  description,
  children,
  headerAction,
  footer,
  className,
}: {
  title?: string
  description?: string
  children: ReactNode
  headerAction?: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('border-0 bg-card shadow-sm', className)}>
      {(title || description) && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4 border-b border-border/50">
          <div className="space-y-1">
            {title && <CardTitle className="text-base sm:text-lg">{title}</CardTitle>}
            {description && <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>}
          </div>
          {headerAction}
        </CardHeader>
      )}
      <CardContent className="pt-4 sm:pt-6">
        {children}
      </CardContent>
      {footer && (
        <div className="px-4 sm:px-6 py-4 border-t border-border/50">
          {footer}
        </div>
      )}
    </Card>
  )
}

// Grid Layout for charts and content
export function ContentGrid({
  children,
  columns = 'auto',
  className,
}: {
  children: ReactNode
  columns?: 'auto' | '2' | '3'
  className?: string
}) {
  const gridClass = {
    auto: 'grid gap-6 lg:grid-cols-3',
    '2': 'grid gap-6 lg:grid-cols-2',
    '3': 'grid gap-6 lg:grid-cols-3',
  }

  return (
    <div className={cn(gridClass[columns], className)}>
      {children}
    </div>
  )
}

// Typography helpers
export function DashboardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cn('text-3xl font-bold tracking-tight', className)}>
      {children}
    </h1>
  )
}

export function DashboardSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-base text-muted-foreground', className)}>
      {children}
    </p>
  )
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-lg font-semibold tracking-tight', className)}>
      {children}
    </h2>
  )
}

export function SectionDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  )
}

// Metric Display
export function MetricDisplay({
  label,
  value,
  unit,
  size = 'md',
}: {
  label: string
  value: string | number
  unit?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-1 mt-2">
        <span className={cn('font-bold', sizeClasses[size])}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

// Spacing and layout utilities
export const DASHBOARD_SPACING = {
  page: 'space-y-6',
  section: 'space-y-4',
  grid: 'gap-4 sm:gap-6',
  card: 'p-4 sm:p-6',
}

export const DASHBOARD_COLORS = {
  primary: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900',
  secondary: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
  warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900',
  danger: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
  success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900',
}
