'use client'

import { AlertCircle, CheckCircle2, Info, AlertTriangle, Loader2, Package2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// Success Toast Component
export function SuccessToast({ message, description }: { message: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900 p-3">
      <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-emerald-900 dark:text-emerald-100">{message}</p>
        {description && <p className="text-xs text-emerald-700 dark:text-emerald-200 mt-1">{description}</p>}
      </div>
    </div>
  )
}

// Error Alert Component
export function ErrorAlert({ message, description }: { message: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900 p-3">
      <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-red-900 dark:text-red-100">{message}</p>
        {description && <p className="text-xs text-red-700 dark:text-red-200 mt-1">{description}</p>}
      </div>
    </div>
  )
}

// Warning Alert Component
export function WarningAlert({ message, description }: { message: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-900 p-3">
      <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-amber-900 dark:text-amber-100">{message}</p>
        {description && <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">{description}</p>}
      </div>
    </div>
  )
}

// Info Alert Component
export function InfoAlert({ message, description }: { message: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-900 p-3">
      <Info className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-blue-900 dark:text-blue-100">{message}</p>
        {description && <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">{description}</p>}
      </div>
    </div>
  )
}

// Loading Skeleton Component
export function SkeletonLoader({ count = 3, variant = 'card' }: { count?: number; variant?: 'card' | 'row' | 'text' }) {
  const skeletons = Array.from({ length: count })
  
  if (variant === 'row') {
    return (
      <div className="space-y-2">
        {skeletons.map((_, idx) => (
          <div key={idx} className="h-12 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }
  
  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {skeletons.map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-full animate-pulse" />
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {skeletons.map((_, idx) => (
        <div key={idx} className="rounded-lg border border-border bg-card p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-6 bg-muted rounded w-full" />
          <div className="h-6 bg-muted rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}

// Loading State Component
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="size-8 text-muted-foreground animate-spin mb-3" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

// Empty State Component
export function EmptyState({ 
  message = 'No data available', 
  description = 'Try adjusting your filters or creating new records',
  icon: Icon = Package2
}: { 
  message?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="size-12 text-muted-foreground/50 mb-3" />
      <p className="font-medium text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

// No Search Results Component
export function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Search className="size-12 text-muted-foreground/50 mb-3" />
      <p className="font-medium text-foreground">No results found</p>
      <p className="text-sm text-muted-foreground">We couldn&apos;t find anything for &quot;{query}&quot;</p>
    </div>
  )
}

// Validation Error Message
export function ValidationError({ message, field }: { message: string; field?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <AlertCircle className="size-4 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        {field && <span className="font-medium text-red-900">{field}: </span>}
        <span className="text-red-700">{message}</span>
      </div>
    </div>
  )
}

// Validation Errors List
export function ValidationErrorsList({ errors }: { errors: Array<{ field?: string; message: string }> }) {
  return (
    <div className="space-y-2">
      {errors.map((error, idx) => (
        <ValidationError key={idx} field={error.field} message={error.message} />
      ))}
    </div>
  )
}

// Status Badge with Loading State
export function StatusBadge({ 
  status, 
  isLoading = false,
  variant = 'default'
}: { 
  status: 'success' | 'error' | 'warning' | 'info' | 'pending'
  isLoading?: boolean
  variant?: 'default' | 'outlined'
}) {
  const configs = {
    success: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-200' },
    error: { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-200' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-200' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-200' },
    pending: { bg: 'bg-gray-500/10', text: 'text-gray-700', border: 'border-gray-200' },
  }
  
  const config = configs[status]
  const statusLabels = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    pending: 'Pending',
  }
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
      variant === 'outlined' ? `border ${config.border} ${config.text}` : `${config.bg} ${config.text}`
    )}>
      {isLoading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : status === 'success' ? (
        <CheckCircle2 className="size-3" />
      ) : status === 'error' ? (
        <AlertCircle className="size-3" />
      ) : null}
      {statusLabels[status]}
    </span>
  )
}
