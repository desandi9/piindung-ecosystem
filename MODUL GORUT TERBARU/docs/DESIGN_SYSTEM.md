# GORUT Design System - Standardized Component Architecture

## Overview

The GORUT Dashboard Design System provides a unified, scalable, and enterprise-grade UI framework. It standardizes all visual elements, spacing, typography, colors, and interactive patterns across the dashboard to ensure consistency and maintainability.

## Core Files

### 1. Design Tokens (`lib/gorut/design-system.ts`)
Central repository of all design constants including:
- **Spacing System**: xs (4px) to 3xl (48px)
- **Typography Scale**: Sizes 12px-30px, weights 400-700
- **Status Colors**: Success, Error, Warning, Info, Pending, Approved, Rejected
- **Component Spacing**: Card, Modal, Drawer, Table, Form specifications
- **Shadows, Border Radius, Icon Sizes, Transitions**
- **Z-Index Scale, Breakpoints, Dark Mode**

### 2. Component Patterns (`lib/gorut/component-patterns.ts`)
Helper functions and utility functions:
- `getStatusBadgeClass()` - Unified badge styling
- `getTableRowClass()` - Consistent table styling
- `getCardClass()` - Card styling logic
- `getFormFieldClass()` - Form field layout
- `getEmptyStateClass()` - Empty state standardization
- `getSpacingClass()` - Consistent spacing helpers
- Modal, Drawer, Filter, Pagination, Dropdown configs

### 3. Status Components (`components/gorut/status-components.tsx`)
Unified status display across dashboard:
- `StatusIndicator` - Primary status component (variants: default, outline, subtle, compact, dot)
- `StatusRow` - Status with metadata
- `StatusBar` - Timeline/progress visualization
- `StatusSummary` - Count aggregation
- `StatusTag`, `StatusGroup` - Inline status displays

### 4. Standardized Cards (`components/gorut/standardized-cards.tsx`)
Reusable card components:
- `StandardCard` - Base card with optional title, footer, actions
- `CardGrid` - Responsive grid layout
- `StatCard` - Metric display with trend
- `InfoCard` - Icon + title + value
- `ListCard` - List item display
- `EmptyCard`, `LoadingCard` - State components

### 5. Standardized Forms (`components/gorut/standardized-forms.tsx`)
Complete form component library:
- `FormField` - Label + input + error + hint
- `StandardInput`, `PasswordInput` - Text inputs with icons/suffix
- `StandardTextArea`, `StandardSelect` - Textarea and dropdown
- `StandardCheckbox`, `StandardRadio` - Selection inputs
- `FormSection`, `FormGrid` - Layout helpers
- `FormAlert`, `FormLabel`, `FieldWrapper` - Additional helpers

## Status Color System

All status colors are unified across the dashboard:

```typescript
// Example usage
import { StatusIndicator } from '@/components/gorut'
import { STATUS_COLORS } from '@/lib/gorut/design-system'

// Use consistent colors everywhere
<StatusIndicator status="approved" label="Approved" />
<StatusIndicator status="pending" variant="outline" />
<StatusIndicator status="rejected" showIcon={true} />
```

**Status Types:**
- `success` - Emerald (completion, approval)
- `error` - Red (failures, rejections)
- `warning` - Amber (cautions, inactive)
- `info` - Blue (information)
- `pending` - Amber (awaiting action)
- `approved` - Emerald (approved state)
- `rejected` - Red (rejected state)

## Component Consistency

### Tables
```typescript
// Standardized row heights: 44px
// Cell padding: 1rem horizontal
// Header: bg-muted/40
// Hover: bg-muted/50
// Selected: bg-primary/10 with left border
// Striped: odd:bg-muted/20
```

### Cards
```typescript
// Padding: 1.5rem (lg)
// Border: border-border/50
// Border radius: 0.625rem (lg)
// Shadow: shadow-sm (default)
// Hover elevation: shadow-lg with transition
```

### Modals & Drawers
```typescript
// Modal max-width: 600px
// Drawer width: 480px
// Padding: 2rem (xl)
// Header/Footer padding: 1.5rem (lg)
// Scroll: internal content, sticky footer
```

### Forms
```typescript
// Input height: 40px
// Padding: 0.5rem horizontal, 0.5rem vertical
// Border radius: 0.5rem
// Focus: ring-2 ring-ring ring-offset-2
// Gap between fields: 1rem (md)
```

### Badges
```typescript
// Padding: 0.625rem horizontal, 0.25rem vertical
// Border radius: 0.375rem
// Font: text-xs, font-medium
// Variants: default (filled), outline, subtle, compact
```

## Spacing System

```typescript
// Usage
export const SPACING = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px (default)
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
}

// Component-specific spacing
COMPONENT_SPACING.card.padding     // 1.5rem
COMPONENT_SPACING.form.groupGap    // 1.5rem
COMPONENT_SPACING.table.cellPadding // 1rem
```

## Typography

```typescript
// Font sizes
sizes.sm: '0.875rem'  // 14px - secondary text
sizes.base: '1rem'    // 16px - body
sizes.lg: '1.125rem'  // 18px - subheading
sizes.xl: '1.25rem'   // 20px - heading

// Font weights
weight.normal: 400    // body text
weight.medium: 500    // labels, emphasis
weight.semibold: 600  // headings
weight.bold: 700      // strong emphasis
```

## Responsive Design

```typescript
// Desktop-first breakpoints
xs: '320px'   // Mobile
sm: '640px'   // Tablet
md: '768px'   // Small desktop
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large

// Example: grid layout
<CardGrid columns="auto" gap="lg">
  {/* 1 col on mobile, 2 on tablet, 3 on desktop, 4 on 2xl */}
</CardGrid>
```

## Usage Examples

### Status Badge
```tsx
import { StatusIndicator } from '@/components/gorut'

<StatusIndicator 
  status="approved" 
  label="Approved"
  variant="default"
  showIcon={true}
/>
```

### Card with Content
```tsx
import { StandardCard, CardGrid } from '@/components/gorut'

<CardGrid columns={3} gap="lg">
  <StandardCard 
    title="Active Users"
    padding="lg"
    elevated
  >
    <p className="text-2xl font-bold">245</p>
  </StandardCard>
</CardGrid>
```

### Form Section
```tsx
import { FormField, StandardInput, StandardSelect, FormSection } from '@/components/gorut'

<FormSection title="Personal Information">
  <FormField label="Full Name" required>
    <StandardInput placeholder="Enter your name" />
  </FormField>
  <FormField label="Status" required>
    <StandardSelect 
      options={[
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ]}
    />
  </FormField>
</FormSection>
```

### Status Timeline
```tsx
import { StatusBar } from '@/components/gorut'

<StatusBar
  direction="vertical"
  statuses={[
    { status: 'approved', label: 'PLPK Validation', completed: true },
    { status: 'pending', label: 'Rating Review', completed: false },
    { status: 'info', label: 'Final Approval', completed: false },
  ]}
/>
```

## Color Palette

### Light Mode
- **Background**: White (oklch 0.985)
- **Card**: White (oklch 1)
- **Text**: Dark blue (oklch 0.145)
- **Muted**: Light gray (oklch 0.96)
- **Border**: Light gray (oklch 0.9)
- **Primary**: Emerald (oklch 0.55)

### Dark Mode
- **Background**: Dark slate (oklch 0.14)
- **Card**: Charcoal (oklch 0.17)
- **Text**: White (oklch 0.95)
- **Muted**: Gray (oklch 0.96)
- **Border**: Slate (oklch 0.9)
- **Primary**: Emerald (oklch 0.55)

## Component Integration

When creating new dashboard features:

1. **Use existing components** instead of creating new ones
2. **Import from design system** (`lib/gorut/design-system.ts`)
3. **Use pattern helpers** for consistency (`lib/gorut/component-patterns.ts`)
4. **Follow spacing rules** - use SPACING constants
5. **Apply status colors** - use STATUS_COLORS for all status displays
6. **Maintain responsive layout** - use CardGrid, FormGrid helpers
7. **Use form components** - StandardInput, StandardSelect, etc.

## Maintenance

### Adding New Status
```typescript
// In design-system.ts
export const STATUS_COLORS = {
  // ... existing
  newStatus: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-600',
    badge: 'bg-purple-500/10 text-purple-600 border border-purple-500/30',
    // ...
  }
}
```

### Adding New Component Pattern
```typescript
// In component-patterns.ts
export function getNewComponentClass(config: NewConfig) {
  return cn(
    // base styles
    // conditional styles
  )
}
```

### Updating Spacing
```typescript
// In design-system.ts
export const COMPONENT_SPACING = {
  newComponent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    // ...
  }
}
```

## Best Practices

1. **Consistency Over Creativity**: Always use established patterns
2. **Reuse Components**: Prefer existing components to new ones
3. **Follow Spacing**: Use SPACING constants, avoid arbitrary values
4. **Use Status Colors**: Don't create custom status colors
5. **Maintain Responsive**: Test all breakpoints
6. **Dark Mode**: Test in dark mode using dark: prefix
7. **Accessibility**: All components include proper focus states and ARIA attributes

## Performance

- Design system files are lightweight and tree-shakeable
- Component patterns use pure functions (no runtime overhead)
- All animations use Tailwind transitions (GPU accelerated)
- No external dependencies beyond shadcn/ui
- Build-time optimization through constant definitions

## Future Extensions

Planned additions to the design system:
- Animation system (entrance, exit, transition presets)
- Micro-interactions library
- Responsive typography scale
- Extended color palette for charts
- Custom theme generator
