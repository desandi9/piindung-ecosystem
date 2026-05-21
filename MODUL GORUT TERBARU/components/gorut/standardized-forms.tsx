// Standardized Form Components
// Unified form field styling and behavior across the dashboard

'use client'

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Info, Eye, EyeOff } from 'lucide-react'
import { COMPONENT_SPACING, TRANSITIONS } from '@/lib/gorut/design-system'
import { getFormFieldClass, getFormInputClass, getSpacingClass, FOCUS_STATES } from '@/lib/gorut/component-patterns'
import { useState } from 'react'

// ============= FORM FIELD GROUP =============
interface FormFieldProps {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  layout?: 'vertical' | 'horizontal'
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  layout = 'vertical',
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', layout === 'horizontal' && 'flex-row items-center')}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}
      {children}
      {error && (
        <Alert variant="destructive" className="mt-2 py-2">
          <AlertCircle className="size-4" />
          <AlertDescription className="ml-2 text-xs">{error}</AlertDescription>
        </Alert>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  )
}

// ============= STANDARDIZED TEXT INPUT =============
interface StandardInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  icon?: ReactNode
  suffix?: ReactNode
}

export function StandardInput({
  error,
  icon,
  suffix,
  className,
  ...props
}: StandardInputProps) {
  return (
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-3 flex-shrink-0 text-muted-foreground pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={cn(
          getFormInputClass(error),
          icon && 'pl-10',
          suffix && 'pr-10',
          TRANSITIONS.color,
          className,
        )}
        {...props}
      />
      {suffix && (
        <div className="absolute right-3 flex-shrink-0 pointer-events-none text-muted-foreground">
          {suffix}
        </div>
      )}
    </div>
  )
}

// ============= PASSWORD INPUT =============
interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function PasswordInput({
  error,
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        className={cn(
          getFormInputClass(error),
          'pr-10',
          TRANSITIONS.color,
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {showPassword ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  )
}

// ============= TEXTAREA =============
interface TextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  rows?: number
}

export function StandardTextArea({
  error,
  rows = 4,
  className,
  ...props
}: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'rounded-md border border-input bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'resize-vertical font-mono',
        error && 'border-destructive focus:ring-destructive',
        TRANSITIONS.color,
        className,
      )}
      {...props}
    />
  )
}

// ============= SELECT/DROPDOWN =============
interface StandardSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: Array<{ value: string | number; label: string; disabled?: boolean }>
  placeholder?: string
}

export function StandardSelect({
  error,
  options,
  placeholder,
  className,
  ...props
}: StandardSelectProps) {
  return (
    <select
      className={cn(
        'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus:ring-destructive',
        TRANSITIONS.color,
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled selected>
          {placeholder}
        </option>
      )}
      {options.map(opt => (
        <option
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
        >
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// ============= CHECKBOX =============
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export function StandardCheckbox({
  label,
  description,
  className,
  ...props
}: CheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        className={cn(
          'mt-1 h-4 w-4 rounded border border-input',
          'checked:bg-primary checked:border-primary',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          TRANSITIONS.color,
          className,
        )}
        {...props}
      />
      <div>
        {label && <p className="text-sm font-medium text-foreground">{label}</p>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </label>
  )
}

// ============= RADIO BUTTON =============
interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function StandardRadio({
  label,
  className,
  ...props
}: RadioProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        className={cn(
          'h-4 w-4 rounded-full border border-input',
          'checked:bg-primary checked:border-primary',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          TRANSITIONS.color,
          className,
        )}
        {...props}
      />
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
    </label>
  )
}

// ============= FORM SECTION =============
interface FormSectionProps {
  title?: string
  description?: string
  children: ReactNode
  divider?: boolean
}

export function FormSection({
  title,
  description,
  children,
  divider = true,
}: FormSectionProps) {
  return (
    <div className={cn(divider && 'border-b border-border/50 pb-6 mb-6 last:border-0')}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="font-semibold text-foreground">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// ============= FORM GRID =============
interface FormGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function FormGrid({
  children,
  columns = 1,
  gap = 'md',
}: FormGridProps) {
  const gapClass = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap]

  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <div className={cn('grid', colClass, gapClass)}>
      {children}
    </div>
  )
}

// ============= FORM INFO ALERT =============
interface FormAlertProps {
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  description?: string
}

export function FormAlert({
  type,
  title,
  description,
}: FormAlertProps) {
  const variantMap = {
    info: 'border-blue-500/30 bg-blue-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    success: 'border-emerald-500/30 bg-emerald-500/10',
  }

  const iconMap = {
    info: <Info className="size-4 text-blue-600" />,
    warning: <AlertCircle className="size-4 text-amber-600" />,
    error: <AlertCircle className="size-4 text-red-600" />,
    success: <AlertCircle className="size-4 text-emerald-600" />,
  }

  return (
    <Alert className={variantMap[type]}>
      {iconMap[type]}
      <div className="ml-3">
        <AlertDescription className="text-sm font-medium">{title}</AlertDescription>
        {description && (
          <AlertDescription className="text-xs mt-1 opacity-80">
            {description}
          </AlertDescription>
        )}
      </div>
    </Alert>
  )
}

// ============= LABEL =============
interface LabelProps {
  children: ReactNode
  required?: boolean
  optional?: boolean
  className?: string
}

export function FormLabel({
  children,
  required,
  optional,
  className,
}: LabelProps) {
  return (
    <label className={cn('text-sm font-medium text-foreground', className)}>
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
      {optional && <span className="ml-1 text-muted-foreground text-xs">(Optional)</span>}
    </label>
  )
}

// ============= FIELD WRAPPER =============
interface FieldWrapperProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export function FieldWrapper({
  label,
  error,
  hint,
  required,
  children,
}: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      {label && <FormLabel required={required}>{label}</FormLabel>}
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
