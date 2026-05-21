// GORUT Design System - Unified design tokens and component specifications
// Ensures consistency across all dashboard UI elements

// ============= SPACING SYSTEM =============
export const SPACING = {
  // Base spacing unit (rem)
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
} as const

// Component-specific spacing
export const COMPONENT_SPACING = {
  card: {
    padding: SPACING.lg,
    gap: SPACING.md,
    borderRadius: '0.625rem',
  },
  modal: {
    padding: SPACING.xl,
    headerPadding: SPACING.lg,
    footerPadding: SPACING.lg,
    maxWidth: '600px',
  },
  drawer: {
    padding: SPACING.lg,
    width: '480px',
    headerPadding: SPACING.lg,
    footerPadding: SPACING.lg,
  },
  table: {
    rowHeight: '44px',
    cellPadding: `${SPACING.md}`,
    headerPadding: `${SPACING.md}`,
    columnGap: SPACING.md,
  },
  form: {
    groupGap: SPACING.lg,
    fieldGap: SPACING.md,
    sectionGap: SPACING.xl,
  },
  badge: {
    paddingX: SPACING.md,
    paddingY: SPACING.xs,
    borderRadius: '0.375rem',
  },
  button: {
    paddingX: SPACING.md,
    paddingY: SPACING.sm,
    height: '40px',
    smallHeight: '32px',
  },
} as const

// ============= TYPOGRAPHY SCALE =============
export const TYPOGRAPHY = {
  // Font sizes
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
  // Font weights
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

// ============= COLOR SYSTEM & STATUS =============
export const STATUS_COLORS = {
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-600',
    badge: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30',
    light: 'bg-emerald-50 dark:bg-emerald-500/5',
    dark: 'bg-emerald-600',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-600',
    badge: 'bg-red-500/10 text-red-600 border border-red-500/30',
    light: 'bg-red-50 dark:bg-red-500/5',
    dark: 'bg-red-600',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-600',
    badge: 'bg-amber-500/10 text-amber-600 border border-amber-500/30',
    light: 'bg-amber-50 dark:bg-amber-500/5',
    dark: 'bg-amber-600',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-600',
    badge: 'bg-blue-500/10 text-blue-600 border border-blue-500/30',
    light: 'bg-blue-50 dark:bg-blue-500/5',
    dark: 'bg-blue-600',
  },
  pending: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-600',
    badge: 'bg-amber-500/10 text-amber-600 border border-amber-500/30',
    light: 'bg-amber-50 dark:bg-amber-500/5',
    dark: 'bg-amber-600',
  },
  approved: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-600',
    badge: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30',
    light: 'bg-emerald-50 dark:bg-emerald-500/5',
    dark: 'bg-emerald-600',
  },
  rejected: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-600',
    badge: 'bg-red-500/10 text-red-600 border border-red-500/30',
    light: 'bg-red-50 dark:bg-red-500/5',
    dark: 'bg-red-600',
  },
} as const

// ============= BADGE STYLES =============
export const BADGE_STYLES = {
  default: 'px-2.5 py-1 rounded-md text-xs font-medium border',
  outline: 'px-2.5 py-1 rounded-md text-xs font-medium border bg-transparent',
  subtle: 'px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground',
  compact: 'px-2 py-0.5 rounded text-xs font-medium border',
} as const

// ============= BUTTON SPECIFICATIONS =============
export const BUTTON_SPECS = {
  base: 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  sizes: {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  },
  variants: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
} as const

// ============= TABLE SPECIFICATIONS =============
export const TABLE_SPECS = {
  rowHeight: COMPONENT_SPACING.table.rowHeight,
  headerBg: 'bg-muted/40',
  headerPadding: COMPONENT_SPACING.table.headerPadding,
  cellPadding: COMPONENT_SPACING.table.cellPadding,
  hoverBg: 'hover:bg-muted/50 transition-colors',
  selectedBg: 'bg-primary/10 border-l-2 border-primary',
  striped: 'odd:bg-muted/20 even:bg-transparent',
  border: 'border-b border-border/50',
  sortIcon: 'size-4',
} as const

// ============= SHADOW SYSTEM =============
export const SHADOWS = {
  xs: 'shadow-sm',
  sm: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  // Card shadows
  card: 'shadow-sm',
  // Overlay shadows
  overlay: 'shadow-xl',
  // Hover elevation
  hoverElevate: 'hover:shadow-lg transition-shadow',
} as const

// ============= BORDER RADIUS =============
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.375rem',    // 6px
  md: '0.5rem',      // 8px
  lg: '0.625rem',    // 10px
  xl: '0.75rem',     // 12px
  full: '9999px',
  // Component specific
  card: '0.625rem',
  button: '0.5rem',
  input: '0.5rem',
  modal: '0.75rem',
  badge: '0.375rem',
} as const

// ============= ICON SIZES =============
export const ICON_SIZES = {
  xs: 'size-3',      // 12px
  sm: 'size-4',      // 16px
  md: 'size-5',      // 20px
  lg: 'size-6',      // 24px
  xl: 'size-8',      // 32px
  '2xl': 'size-10',  // 40px
} as const

// ============= TRANSITIONS & ANIMATIONS =============
export const TRANSITIONS = {
  fast: 'transition-all duration-150',
  base: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  // Specific transitions
  color: 'transition-colors duration-200',
  opacity: 'transition-opacity duration-200',
  transform: 'transition-transform duration-200',
} as const

// ============= RESPONSIVE BREAKPOINTS =============
export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============= Z-INDEX SCALE =============
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
} as const

// ============= UTILITY FUNCTIONS =============

// Get status color configuration
export function getStatusColor(status: keyof typeof STATUS_COLORS) {
  return STATUS_COLORS[status] || STATUS_COLORS.info
}

// Combine status color with badge style
export function getStatusBadge(status: keyof typeof STATUS_COLORS) {
  return `${getStatusColor(status).badge} ${BADGE_STYLES.default}`
}

// Get button combination
export function getButtonClass(variant: keyof typeof BUTTON_SPECS.variants, size: keyof typeof BUTTON_SPECS.sizes = 'md') {
  return `${BUTTON_SPECS.base} ${BUTTON_SPECS.sizes[size]} ${BUTTON_SPECS.variants[variant]}`
}

// Combine table cell styles
export function getTableCellClass(isHeader = false, isSelected = false) {
  return [
    COMPONENT_SPACING.table.cellPadding,
    isHeader && TABLE_SPECS.headerBg,
    isSelected && TABLE_SPECS.selectedBg,
    TABLE_SPECS.border,
  ]
    .filter(Boolean)
    .join(' ')
}

// ============= DARK MODE SPECIFIC =============
export const DARK_MODE = {
  background: 'dark:bg-slate-950',
  card: 'dark:bg-slate-900',
  border: 'dark:border-slate-800',
  text: 'dark:text-slate-100',
  muted: 'dark:text-slate-400',
  hover: 'dark:hover:bg-slate-800',
} as const

// ============= EXPORT CONSTANTS FOR TAILWIND =============
// These can be used directly in components or extended in tailwind.config.ts
export const DESIGN_SYSTEM_CONFIG = {
  spacing: SPACING,
  componentSpacing: COMPONENT_SPACING,
  typography: TYPOGRAPHY,
  colors: STATUS_COLORS,
  badges: BADGE_STYLES,
  buttons: BUTTON_SPECS,
  tables: TABLE_SPECS,
  shadows: SHADOWS,
  borderRadius: BORDER_RADIUS,
  icons: ICON_SIZES,
  transitions: TRANSITIONS,
  zIndex: Z_INDEX,
} as const
