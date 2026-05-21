'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Enhanced Sheet with sticky footer
export function EnhancedSheetContent({
  children,
  className,
  scrollable = true,
}: {
  children: ReactNode
  className?: string
  scrollable?: boolean
}) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {children}
    </div>
  )
}

export function EnhancedSheetBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6', className)}>
      <div className="space-y-6 py-6">
        {children}
      </div>
    </div>
  )
}

export function EnhancedSheetFooter({
  children,
  className,
  sticky = true,
}: {
  children: ReactNode
  className?: string
  sticky?: boolean
}) {
  return (
    <div
      className={cn(
        'border-t border-border px-6 py-4',
        sticky && 'sticky bottom-0 bg-background',
        className
      )}
    >
      <div className="flex gap-3 justify-end">
        {children}
      </div>
    </div>
  )
}

// Form Group for consistent spacing in drawers/modals
export function FormGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('space-y-2', className)}>{children}</div>
}

// Form Row for horizontal layouts
export function FormRow({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode
  columns?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  )
}

// Modal Section with title and spacing
export function ModalSection({
  title,
  children,
  className,
  divider = false,
}: {
  title?: string
  children: ReactNode
  className?: string
  divider?: boolean
}) {
  return (
    <div className={cn('space-y-4', divider && 'border-b border-border pb-4', className)}>
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
      {children}
    </div>
  )
}

// Responsive Dialog Wrapper
export function ResponsiveDialogContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('w-full max-h-[90vh] overflow-y-auto', className)}>
      {children}
    </div>
  )
}

// Action Bar for drawer/modal footer
export function ActionBar({
  children,
  variant = 'default',
  sticky = true,
}: {
  children: ReactNode
  variant?: 'default' | 'compact'
  sticky?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        variant === 'compact' && 'justify-end',
        sticky && 'sticky bottom-0 bg-background border-t border-border p-4'
      )}
    >
      {children}
    </div>
  )
}

// Split View Layout for side-by-side content
export function SplitViewDrawer({
  left,
  right,
  className,
}: {
  left: ReactNode
  right: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-6', className)}>
      <div className="space-y-6 border-r border-border pr-6">
        {left}
      </div>
      <div className="space-y-6">{right}</div>
    </div>
  )
}

// Info Section with muted styling
export function InfoSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-lg bg-muted/50 p-4 border border-border/50', className)}>
      {children}
    </div>
  )
}

// Info Item for displaying key-value pairs
export function InfoItem({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

// Badge Row for multiple badges
export function BadgeRow({
  badges,
  className,
}: {
  badges: Array<{ label: string; variant?: string }>
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {badges.map(badge => (
        <span
          key={badge.label}
          className={cn(
            'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
            badge.variant === 'success' && 'bg-emerald-500/10 text-emerald-700',
            badge.variant === 'warning' && 'bg-amber-500/10 text-amber-700',
            badge.variant === 'error' && 'bg-red-500/10 text-red-700',
            !badge.variant && 'bg-muted text-muted-foreground'
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  )
}

// Divider with optional label
export function SectionDivider({ label }: { label?: string }) {
  if (!label) {
    return <div className="h-px bg-border" />
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
