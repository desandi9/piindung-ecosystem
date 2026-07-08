/**
 * ds-patterns.tsx — GORUT Module Design System Components
 * Shared primitive components for consistent UI across GORUT.
 * Compatible with the gorut module's Badge, Card, and Button components.
 */

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

// ─── Icon Box ────────────────────────────────────────────────────────────────

type IconTone = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'muted'

const iconToneClasses: Record<IconTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-amber-500/10 text-amber-600',
  destructive: 'bg-red-500/10 text-red-600',
  info: 'bg-blue-500/10 text-blue-600',
  muted: 'bg-muted text-muted-foreground',
}

const iconSizeClasses = {
  sm: 'size-7 [&>svg]:size-3.5',
  md: 'size-9 [&>svg]:size-4.5',
  lg: 'size-11 [&>svg]:size-5',
}

function IconBox({
  icon: Icon,
  tone = 'primary',
  size = 'md',
  className,
}: {
  icon: LucideIcon
  tone?: IconTone
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-xl', iconToneClasses[tone], iconSizeClasses[size], className)}>
      <Icon />
    </div>
  )
}

// ─── MetricCard ──────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  description,
  icon,
  accent,
  iconTone = 'primary',
}: {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  accent?: string
  iconTone?: IconTone
}) {
  return (
    <Card className="group overflow-hidden border-border shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="relative p-5">
        {accent && (
          <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90', accent)} />
        )}
        <div className="relative z-10">
          <div className="mb-4 flex items-start justify-between gap-3">
            <IconBox icon={icon} tone={iconTone} size="md" />
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({
  variant = 'inline',
  title,
  message,
  action,
}: {
  variant?: 'inline' | 'card'
  title: string
  message?: string
  action?: React.ReactNode
}) {
  if (variant === 'card') {
    return (
      <Card className="border-dashed border-border/60 bg-background/30 shadow-none">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {message && <p className="mt-1 text-xs text-muted-foreground">{message}</p>}
          {action && <div className="mt-4">{action}</div>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-5 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {message && <p className="mt-1 text-xs text-muted-foreground">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── LoadingCard ──────────────────────────────────────────────────────────────
// Full-card shimmer skeleton. Use where an entire card region is loading.

function LoadingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl border border-border/40 bg-card/50 p-5',
        className,
      )}
      aria-hidden="true"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="size-9 rounded-xl bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
      </div>
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="mt-2 h-7 w-1/2 rounded bg-muted" />
      <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
    </div>
  )
}

// ─── LoadingRow ───────────────────────────────────────────────────────────────
// Single row shimmer. Use inside a list or table while data is fetching.

function LoadingRow({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl border border-border/40 bg-muted/30 p-3', className)}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div className="size-8 shrink-0 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-muted" />
          <div className="h-2.5 w-1/2 rounded bg-muted" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
    </div>
  )
}

// ─── InlineAlert ──────────────────────────────────────────────────────────────
// Contextual notice bar — info, warning, error, success, or muted.

const inlineAlertVariantClasses = {
  info: 'border-blue-500/20 bg-blue-500/8 text-blue-700 dark:text-blue-400',
  warning: 'border-amber-500/20 bg-amber-500/8 text-amber-700 dark:text-amber-400',
  error: 'border-red-500/20 bg-red-500/8 text-red-700 dark:text-red-400',
  success: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400',
  muted: 'border-border/40 bg-muted/40 text-muted-foreground',
}

function InlineAlert({
  variant = 'info',
  className,
  children,
}: {
  variant?: 'info' | 'warning' | 'error' | 'success' | 'muted'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm leading-relaxed',
        inlineAlertVariantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
// Small all-caps label above a section. Provides visual hierarchy.

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75', className)}>
      {children}
    </p>
  )
}

// ─── ActionCard ───────────────────────────────────────────────────────────────
// Compact clickable card for quick-action grids.
// Wraps children in a div with hover micro-interaction.

function ActionCard({
  title,
  description,
  icon,
  tone = 'primary',
  className,
  onClick,
  href,
}: {
  title: string
  description?: string
  icon: LucideIcon
  tone?: IconTone
  className?: string
  onClick?: () => void
  href?: string
}) {
  const inner = (
    <div className={cn(
      'group flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border/60 hover:shadow-md',
      className,
    )}>
      <IconBox icon={icon} tone={tone} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
    </div>
  )

  if (href) {
    return <a href={href} className="block">{inner}</a>
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export { MetricCard, EmptyState, IconBox, LoadingCard, LoadingRow, InlineAlert, SectionLabel, ActionCard }
export type { IconTone }