// Standardized Component Patterns and Helpers
// Ensures consistency across all GORUT dashboard components

import { COMPONENT_SPACING, STATUS_COLORS, TABLE_SPECS, BADGE_STYLES, BUTTON_SPECS, TRANSITIONS } from './design-system'
import { cn } from '@/lib/utils'

// ============= STATUS BADGE COMPONENT HELPER =============
export interface StatusBadgeProps {
  status: keyof typeof STATUS_COLORS
  variant?: 'default' | 'outline' | 'subtle' | 'compact'
  showIcon?: boolean
  icon?: React.ReactNode
}

export function getStatusBadgeClass(status: keyof typeof STATUS_COLORS, variant: StatusBadgeProps['variant'] = 'default') {
  const statusColor = STATUS_COLORS[status]
  const baseStyle = BADGE_STYLES[variant]
  
  return cn(
    baseStyle,
    variant === 'default' || variant === 'compact' ? statusColor.badge : statusColor.text,
    variant === 'outline' && `border-2 ${statusColor.border} text-${statusColor.text}`,
    variant === 'subtle' && `${statusColor.light}`,
  )
}

// ============= TABLE ROW SPECIFICATIONS =============
export interface TableRowConfig {
  isHeader?: boolean
  isSelected?: boolean
  isHoverable?: boolean
  isStriped?: boolean
}

export function getTableRowClass(config: TableRowConfig) {
  return cn(
    'transition-colors',
    config.isHeader && TABLE_SPECS.headerBg,
    config.isSelected && TABLE_SPECS.selectedBg,
    config.isHoverable && TABLE_SPECS.hoverBg,
    config.isStriped && TABLE_SPECS.striped,
  )
}

export function getTableCellClass(config: { isHeader?: boolean; isCompact?: boolean }) {
  return cn(
    'px-4 py-3',
    config.isCompact && 'px-3 py-2',
    'text-sm align-middle',
  )
}

// ============= CARD COMPONENT SPECIFICATIONS =============
export interface CardConfig {
  elevated?: boolean
  bordered?: boolean
  interactive?: boolean
  compact?: boolean
}

export function getCardClass(config: CardConfig = {}) {
  return cn(
    'rounded-lg bg-card border border-border/50',
    config.elevated && 'shadow-md',
    config.interactive && 'hover:shadow-lg hover:border-border transition-all cursor-pointer',
    config.compact && 'p-4',
    !config.compact && 'p-6',
  )
}

// ============= MODAL & DRAWER CONFIGURATIONS =============
export const MODAL_CONFIG = {
  width: 'max-w-md',
  padding: 'p-6',
  headerGap: 'gap-4',
  footerGap: 'gap-3',
  borderRadius: 'rounded-lg',
} as const

export const DRAWER_CONFIG = {
  width: 'w-[480px]',
  padding: 'p-6',
  headerPadding: 'pb-4',
  footerPadding: 'pt-4',
  borderRadius: 'rounded-l-lg',
  animation: 'slide-in-from-right',
} as const

// ============= FORM FIELD SPECIFICATIONS =============
export interface FormFieldConfig {
  required?: boolean
  error?: string
  hint?: string
  fullWidth?: boolean
}

export function getFormFieldClass(config: FormFieldConfig = {}) {
  return cn(
    'flex flex-col gap-2',
    config.fullWidth && 'w-full',
  )
}

export function getFormInputClass(hasError?: boolean) {
  return cn(
    'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    hasError && 'border-destructive focus:ring-destructive',
  )
}

// ============= FILTER BAR SPECIFICATIONS =============
export const FILTER_BAR_CONFIG = {
  container: 'flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50',
  chipGap: 'gap-2',
  chipClass: 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors',
  buttonGap: 'gap-2',
} as const

// ============= PAGINATION SPECIFICATIONS =============
export const PAGINATION_CONFIG = {
  container: 'flex items-center justify-between gap-4 py-4 px-2',
  controlsGap: 'gap-2',
  controlButton: 'h-8 w-8 p-0 border border-input hover:bg-muted disabled:opacity-50',
  pageButton: 'h-8 w-8 p-0 border border-input rounded-md hover:bg-muted data-[current="true"]:bg-primary data-[current="true"]:text-primary-foreground data-[current="true"]:border-primary',
} as const

// ============= EMPTY STATE SPECIFICATIONS =============
export interface EmptyStateConfig {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function getEmptyStateClass() {
  return cn(
    'flex flex-col items-center justify-center gap-4 py-12 px-4',
    'text-center min-h-[300px]',
  )
}

// ============= LOADING STATE SPECIFICATIONS =============
export function getSkeletonClass(width?: string, height?: string) {
  return cn(
    'animate-pulse rounded-md bg-muted',
    width || 'w-full',
    height || 'h-4',
  )
}

// ============= RESPONSIVE GRID CONFIGURATIONS =============
export const GRID_CONFIG = {
  // Dashboard cards grid
  cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6',
  // Two column layout
  twoCol: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  // Auto-fit grid
  autoFit: 'grid auto-fit-columns gap-6',
} as const

// ============= ICON BUTTON SPECIFICATIONS =============
export function getIconButtonClass(size: 'sm' | 'md' | 'lg' = 'md') {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }
  return cn(
    'inline-flex items-center justify-center rounded-md border border-input',
    'hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    sizeMap[size],
  )
}

// ============= DROPDOWN MENU SPECIFICATIONS =============
export const DROPDOWN_CONFIG = {
  content: 'min-w-[200px] p-1 bg-popover border border-border rounded-md shadow-md',
  item: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  separator: 'my-1 h-px bg-border',
  group: 'overflow-hidden p-1',
  groupLabel: 'px-2 py-1.5 text-xs font-medium text-muted-foreground',
} as const

// ============= TOOLTIP SPECIFICATIONS =============
export const TOOLTIP_CONFIG = {
  container: 'px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md',
  arrow: 'data-[side=bottom]:translate-y-2 data-[side=left]:-translate-x-2 data-[side=right]:translate-x-2 data-[side=top]:-translate-y-2',
} as const

// ============= BADGE SPECIFIC CONFIGURATIONS =============
export const BADGE_CONFIG = {
  // Variant styles
  variants: {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-primary text-primary',
    destructive: 'bg-destructive text-destructive-foreground',
  },
  // Size options
  sizes: {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  },
} as const

// ============= DIALOG/ALERT SPECIFICATIONS =============
export const DIALOG_CONFIG = {
  overlay: 'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm',
  content: 'fixed z-50 gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
  header: 'flex flex-col space-y-1.5 text-center sm:text-left',
  title: 'text-lg font-semibold text-foreground',
  description: 'text-sm text-muted-foreground',
  footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
} as const

// ============= CONSISTENT SPACING HELPER =============
export function getSpacingClass(type: 'section' | 'component' | 'element', spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl') {
  const spacingMap: Record<string, Record<string, string>> = {
    section: {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
    component: {
      xs: 'gap-1.5',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-6',
    },
    element: {
      xs: 'gap-1',
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-3',
      xl: 'gap-4',
    },
  }
  return spacingMap[type]?.[spacing || 'md'] || spacingMap[type].md
}

// ============= CONSISTENT HOVER STATES =============
export const HOVER_STATES = {
  card: 'hover:shadow-md hover:border-primary/50 transition-all',
  row: 'hover:bg-muted/50 transition-colors',
  button: 'hover:opacity-90 transition-opacity',
  link: 'hover:text-primary underline underline-offset-4 transition-colors',
} as const

// ============= FOCUS STATES =============
export const FOCUS_STATES = {
  default: 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  input: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary',
  button: 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
} as const

// ============= COMBINE ALL COMMON STYLES =============
export function getCommonComponentStyles(type: 'card' | 'button' | 'input' | 'badge') {
  const styles = {
    card: cn(getCardClass(), TRANSITIONS.base),
    button: cn(BUTTON_SPECS.base, BUTTON_SPECS.sizes.md, BUTTON_SPECS.variants.primary),
    input: cn(getFormInputClass(), TRANSITIONS.color),
    badge: cn(BADGE_STYLES.default, TRANSITIONS.base),
  }
  return styles[type]
}
