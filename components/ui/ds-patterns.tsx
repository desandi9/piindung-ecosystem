/**
 * PIINDUNG Design System — Enterprise Patterns
 * 
 * Reusable visual primitives that enforce consistent spacing, typography,
 * colour usage, and interaction patterns across the entire application.
 * 
 * Usage: import { MetricCard, ActionCard, IconBox, ... } from "@/components/ui/ds-patterns"
 */

import * as React from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// DS TOKENS  (Tailwind class strings — single source of truth)
// ─────────────────────────────────────────────────────────────────────────────

export const ds = {
  /** Uppercase tracking label used everywhere (e.g. card kicker, metric label) */
  label: "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground",

  /** Standard icon container — brand tinted */
  iconBox: "rounded-2xl bg-primary/10 p-2.5 text-primary",

  /** Standard icon container — small variant */
  iconBoxSm: "rounded-xl bg-primary/10 p-2 text-primary",

  /** Hover-able bordered card (action/preview tiles) */
  actionCard:
    "rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md",

  /** Section card wrapper consistent with all Card usages */
  sectionCard: "border-border shadow-sm",

  /** Standard content padding inside cards */
  cardPad: "p-4",
  cardPadLg: "p-5",
} as const

// ─────────────────────────────────────────────────────────────────────────────
// ICON BOX
// Small coloured container that wraps a Lucide icon.
// ─────────────────────────────────────────────────────────────────────────────

const iconBoxVariants = cva(
  "flex shrink-0 items-center justify-center transition-transform duration-300",
  {
    variants: {
      size: {
        sm: "h-8 w-8 rounded-xl",
        md: "h-9 w-9 rounded-xl",
        lg: "h-10 w-10 rounded-2xl",
        xl: "h-11 w-11 rounded-2xl",
      },
      tone: {
        primary: "bg-primary/10 text-primary",
        success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        destructive: "bg-destructive/10 text-destructive",
        info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        muted: "bg-muted text-muted-foreground",
        secondary: "bg-secondary/10 text-secondary",
      },
    },
    defaultVariants: {
      size: "lg",
      tone: "primary",
    },
  },
)

export interface IconBoxProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof iconBoxVariants> {
  icon: LucideIcon
  iconClassName?: string
  /** Scale on hover — wrap parent with group class to activate */
  groupHover?: boolean
}

export function IconBox({
  icon: Icon,
  size,
  tone,
  groupHover = false,
  iconClassName,
  className,
  ...props
}: IconBoxProps) {
  return (
    <div
      className={cn(
        iconBoxVariants({ size, tone }),
        groupHover && "group-hover:scale-105",
        className,
      )}
      {...props}
    >
      <Icon
        className={cn(
          size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5",
          iconClassName,
        )}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// Uppercase tracking kicker text used above values / inside card headers.
// ─────────────────────────────────────────────────────────────────────────────

export function SectionLabel({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD
// Analytics/KPI card: gradient accent, icon, numeric value, description.
// ─────────────────────────────────────────────────────────────────────────────

export interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  /** Tailwind gradient class e.g. "from-primary/20 via-primary/5 to-transparent" */
  accent?: string
  /** Tailwind icon tone class e.g. "bg-primary/10 text-primary" */
  iconTone?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "from-primary/20 via-primary/5 to-transparent",
  iconTone = "bg-primary/10 text-primary",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      {/* gradient wash */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
          accent,
        )}
      />
      <div className="relative z-10 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className={cn("rounded-2xl p-2.5 shadow-sm", iconTone)}>
            <Icon className="h-5 w-5" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        {description && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION CARD
// Clickable tile: icon, title, description, arrow. Used for quick-actions
// and preview/workflow cards. Accepts href (renders Link) or onClick (button).
// ─────────────────────────────────────────────────────────────────────────────

interface ActionCardBase {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
  iconTone?: VariantProps<typeof iconBoxVariants>["tone"]
}

interface ActionCardLink extends ActionCardBase {
  href: string
  onClick?: never
}

interface ActionCardButton extends ActionCardBase {
  href?: never
  onClick: () => void
}

export type ActionCardProps = ActionCardLink | ActionCardButton

export function ActionCard({
  icon,
  title,
  description,
  className,
  iconTone = "primary",
  ...rest
}: ActionCardProps) {
  const inner = (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <IconBox icon={icon} tone={iconTone} groupHover />
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </>
  )

  const baseClass = cn(
    "group block rounded-2xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md",
    className,
  )

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={baseClass}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={(rest as ActionCardButton).onClick} className={baseClass}>
      {inner}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW CARD
// Like ActionCard but shows a kicker label + bold value + body text.
// Used for "Active Banner", "Latest Article" etc.
// ─────────────────────────────────────────────────────────────────────────────

export interface PreviewCardProps {
  icon: LucideIcon
  title: string
  value: string
  description: string
  href: string
  className?: string
}

export function PreviewCard({
  icon: Icon,
  title,
  value,
  description,
  href,
  className,
}: PreviewCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <IconBox icon={Icon} groupHover />
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <SectionLabel>{title}</SectionLabel>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
        {description}
      </p>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS SNAPSHOT ITEM
// A small info tile: icon, label, value. Used in sidebar snapshots.
// ─────────────────────────────────────────────────────────────────────────────

export interface StatusSnapshotItemProps {
  icon: LucideIcon
  label: string
  value: string
  className?: string
}

export function StatusSnapshotItem({
  icon: Icon,
  label,
  value,
  className,
}: StatusSnapshotItemProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-muted/30 p-4",
        className,
      )}
    >
      <IconBox icon={Icon} size="md" className="mb-3" />
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE ALERT
// Contextual alert banner inside cards — replaces ad-hoc colored divs.
// ─────────────────────────────────────────────────────────────────────────────

const inlineAlertVariants = cva(
  "rounded-2xl border p-4 text-sm",
  {
    variants: {
      variant: {
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive",
        info:
          "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        muted:
          "border-dashed border-border bg-muted/30 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  },
)

export interface InlineAlertProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof inlineAlertVariants> {}

export function InlineAlert({
  variant,
  className,
  ...props
}: InlineAlertProps) {
  return (
    <div
      className={cn(inlineAlertVariants({ variant }), className)}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOCUS ITEM
// Mini stat tile used in "Catatan Operasional" / focus sidebar cards.
// ─────────────────────────────────────────────────────────────────────────────

export interface FocusItemProps {
  icon: LucideIcon
  label: string
  value: string
  detail?: string
  className?: string
}

export function FocusItem({
  icon,
  label,
  value,
  detail,
  className,
}: FocusItemProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-muted/20 p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>{label}</SectionLabel>
          <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
        </div>
        <IconBox icon={icon} size="md" />
      </div>
      {detail && (
        <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY ROW
// A single activity log entry with status colour coding.
// ─────────────────────────────────────────────────────────────────────────────

const activityStatusClass = {
  Success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Failed: "bg-destructive/10 text-destructive",
} as const

export type ActivityStatus = keyof typeof activityStatusClass

export interface ActivityRowProps {
  icon: LucideIcon
  userName: string
  action: string
  type: string
  device?: string
  dateTime: string
  status: ActivityStatus
  className?: string
}

export function ActivityRow({
  icon: Icon,
  userName,
  action,
  type,
  device,
  dateTime,
  status,
  className,
}: ActivityRowProps) {
  const statusCls = activityStatusClass[status]
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 gap-3">
        <div className={cn("mt-0.5 rounded-xl p-2", statusCls)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{userName}</p>
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                statusCls,
              )}
            >
              {status}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground">{action}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {type}
            {device ? ` • ${device}` : ""}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-xs text-muted-foreground sm:pl-4">
        {dateTime}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO STAT TILE
// The semi-transparent tiles inside dark hero banners.
// ─────────────────────────────────────────────────────────────────────────────

export interface HeroStatTileProps {
  label: string
  value: string | number
  description?: string
  className?: string
}

export function HeroStatTile({
  label,
  value,
  description,
  className,
}: HeroStatTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-white/70">{description}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SECTION HEADER
// Standardised card header slot: title + description + optional action.
// ─────────────────────────────────────────────────────────────────────────────

export interface PageSectionHeaderProps {
  title: React.ReactNode
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageSectionHeader({
  title,
  description,
  action,
  className,
}: PageSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <p className="text-lg font-semibold leading-none text-foreground">
          {title}
        </p>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNANCE CARD
// A larger link tile with tracking label + big value + body.
// Used in Executive Snapshot.
// ─────────────────────────────────────────────────────────────────────────────

export interface GovernanceCardProps {
  icon: LucideIcon
  title: string
  value: string
  description: string
  href: string
  className?: string
}

export function GovernanceCard({
  icon,
  title,
  value,
  description,
  href,
  className,
}: GovernanceCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <IconBox icon={icon} groupHover />
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <SectionLabel>{title}</SectionLabel>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE  (opinionated wrapper around ui/empty)
// Standardises empty states across tables, lists, and cards.
// ─────────────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Alias for description (gorut module compat) */
  message?: string
  action?: React.ReactNode
  className?: string
  /** If true, renders as a dashed bordered box (inline within a card) */
  inline?: boolean
  /** Variant alias: 'inline' maps to inline=true, 'card' maps to inline=false */
  variant?: 'inline' | 'card'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  message,
  action,
  className,
  inline = false,
  variant,
}: EmptyStateProps) {
  const body = description ?? message
  const isInline = inline || variant === 'inline'
  if (isInline) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {title}
        {body && <p className="mt-1 text-xs">{body}</p>}
        {/* gorut module compat: inline variant must also render `action` */}
        {action && <div className="mt-4">{action}</div>}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {body && (
          <p className="text-xs text-muted-foreground">{body}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATE
// Skeleton shimmer placeholder for cards, lists, and tables.
// ─────────────────────────────────────────────────────────────────────────────

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-border bg-card p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="h-10 w-10 rounded-2xl bg-muted" />
        <div className="h-4 w-4 rounded-md bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-1/2 rounded-md bg-muted" />
        <div className="h-6 w-3/4 rounded-md bg-muted" />
        <div className="h-3 w-full rounded-md bg-muted" />
      </div>
    </div>
  )
}

export function LoadingRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex animate-pulse items-center gap-3 rounded-2xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="h-9 w-9 shrink-0 rounded-xl bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded-md bg-muted" />
        <div className="h-3 w-2/3 rounded-md bg-muted" />
      </div>
      <div className="h-3 w-16 rounded-md bg-muted" />
    </div>
  )
}

export function LoadingTable({
  rows = 5,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <LoadingRow key={i} />
      ))}
    </div>
  )
}