# GORUT Design System - Quick Reference Cheatsheet

## Essential Imports

```tsx
// Design tokens
import {
  SPACING,
  COMPONENT_SPACING,
  STATUS_COLORS,
  TRANSITIONS,
  BUTTON_SPECS,
  TABLE_SPECS,
} from '@/lib/gorut/design-system'

// Helper functions
import {
  getStatusColor,
  getStatusBadge,
  getButtonClass,
  getTableCellClass,
  getSpacingClass,
} from '@/lib/gorut/component-patterns'

// Components
import {
  StatusIndicator,
  StatusRow,
  StatusBar,
  StandardCard,
  CardGrid,
  StatCard,
  StandardInput,
  FormField,
  FormSection,
} from '@/components/gorut'
```

## Status System - One Line Reference

```tsx
// All these produce consistent styling
<StatusIndicator status="approved" />
<StatusIndicator status="rejected" />
<StatusIndicator status="pending" />
<StatusIndicator status="error" />
<StatusIndicator status="warning" />
```

## Card Components Matrix

| Component | Use When | Key Props |
|-----------|----------|-----------|
| StandardCard | Generic container | title, padding, elevated |
| StatCard | Showing metrics | label, value, change |
| InfoCard | Icon + info combo | icon, title, value |
| ListCard | List of items | items, title |
| EmptyCard | No data state | icon, title |
| LoadingCard | Loading state | count |

## Form Field Patterns

**Simple Input**
```tsx
<FormField label="Name">
  <StandardInput placeholder="Enter name" />
</FormField>
```

**With Validation**
```tsx
<FormField label="Email" error="Invalid email">
  <StandardInput type="email" />
</FormField>
```

**With Hint**
```tsx
<FormField label="Password" hint="Min 8 characters">
  <PasswordInput />
</FormField>
```

**Grouped Fields**
```tsx
<FormSection title="Contact">
  <FormGrid columns={2}>
    <FormField label="Phone">
      <StandardInput />
    </FormField>
    <FormField label="Email">
      <StandardInput type="email" />
    </FormField>
  </FormGrid>
</FormSection>
```

## Layout Patterns

**Cards Grid**
```tsx
<CardGrid columns="auto" gap="lg">
  <StatCard />
  <StatCard />
</CardGrid>
```

**Two Column**
```tsx
<CardGrid columns={2} gap="lg">
  <StandardCard />
  <StandardCard />
</CardGrid>
```

**Custom Grid**
```tsx
<CardGrid columns={3} gap="md">
  {/* 3 columns on desktop, responsive below */}
</CardGrid>
```

## Status Colors - Quick Map

```
SUCCESS  → text-emerald-600,  bg-emerald-500/10
ERROR    → text-red-600,      bg-red-500/10
WARNING  → text-amber-600,    bg-amber-500/10
INFO     → text-blue-600,     bg-blue-500/10
PENDING  → text-amber-600,    bg-amber-500/10
```

## Spacing Quick Reference

```
xs  = 4px      (gaps between small elements)
sm  = 8px      (compact spacing)
md  = 16px     ← DEFAULT (most common)
lg  = 24px     (card padding, section spacing)
xl  = 32px     (modal padding)
```

## Button Classes

```tsx
// Primary button
className={getButtonClass('primary', 'md')}

// Secondary button
className={getButtonClass('secondary', 'md')}

// Sizes: 'sm' | 'md' | 'lg'
// Variants: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
```

## Table Patterns

**Row hover effect**
```tsx
<TableRow className={TABLE_SPECS.hoverBg}>
  {/* content */}
</TableRow>
```

**Selected row**
```tsx
<TableRow className={TABLE_SPECS.selectedBg}>
  {/* content */}
</TableRow>
```

**Header row**
```tsx
<TableRow className={TABLE_SPECS.headerBg}>
  {/* headers */}
</TableRow>
```

## Modal & Drawer Sizes

```typescript
// Modal
MODAL_CONFIG.width        = 'max-w-md'     (448px)
MODAL_CONFIG.padding      = 'p-6'

// Drawer
DRAWER_CONFIG.width       = 'w-[480px]'
DRAWER_CONFIG.padding     = 'p-6'
```

## Icon Sizing

```typescript
ICON_SIZES.xs   = 'size-3'    (12px)
ICON_SIZES.sm   = 'size-4'    (16px)  ← Default
ICON_SIZES.md   = 'size-5'    (20px)
ICON_SIZES.lg   = 'size-6'    (24px)
ICON_SIZES.xl   = 'size-8'    (32px)
```

## Transition Effects

```typescript
TRANSITIONS.fast       = 'transition-all duration-150'
TRANSITIONS.base       = 'transition-all duration-200'  ← Default
TRANSITIONS.slow       = 'transition-all duration-300'
TRANSITIONS.color      = 'transition-colors duration-200'
TRANSITIONS.opacity    = 'transition-opacity duration-200'
```

## Component Defaults

| Component | Default Padding | Default Gap | Default Variant |
|-----------|-----------------|-------------|-----------------|
| StandardCard | lg (24px) | md (16px) | default |
| FormField | - | 8px | vertical |
| CardGrid | - | lg (24px) | auto |
| StatusIndicator | - | - | default |

## Common Mistakes to Avoid

❌ **Don't hardcode status colors**
```tsx
// ❌ WRONG
<div className="bg-emerald-500/10 text-emerald-600">Approved</div>

// ✅ RIGHT
<StatusIndicator status="approved" />
```

❌ **Don't use arbitrary spacing**
```tsx
// ❌ WRONG
<div className="p-[14px] gap-[13px]">content</div>

// ✅ RIGHT
<div className="p-4 gap-4">content</div>  // Use SPACING scale
```

❌ **Don't create custom card styling**
```tsx
// ❌ WRONG
<div className="bg-card border border-border/50 rounded-lg p-6">Card</div>

// ✅ RIGHT
<StandardCard>Card</StandardCard>
```

❌ **Don't mix status displays**
```tsx
// ❌ WRONG - inconsistent
<span className="bg-emerald-500">✓ Approved</span>
<span className="text-red-600">✗ Rejected</span>

// ✅ RIGHT - unified
<StatusIndicator status="approved" />
<StatusIndicator status="rejected" />
```

## File Locations

```
/lib/gorut/
  ├── design-system.ts           ← All tokens & constants
  ├── component-patterns.ts      ← Helper functions
  └── types.ts                   ← Type definitions

/components/gorut/
  ├── status-components.tsx      ← Status UI
  ├── standardized-cards.tsx     ← Card components
  ├── standardized-forms.tsx     ← Form components
  └── index.ts                   ← Export all
```

## Development Workflow

1. **Design new component**
   - Check if existing component matches
   - Use StandardCard, StandardInput, etc.

2. **Need custom styling?**
   - First check COMPONENT_SPACING
   - Use SPACING constants
   - Apply TRANSITIONS

3. **Status displays**
   - Always use StatusIndicator
   - Pick status from STATUS_COLORS

4. **Forms**
   - Use FormField wrapper
   - Use Standard* input components
   - Use FormGrid for layout

5. **Layouts**
   - Use CardGrid for responsive
   - Use FormGrid for forms
   - Use SPACING for gaps

## Support

For questions on design system usage:
1. Check DESIGN_SYSTEM.md for complete reference
2. Check DESIGN_SYSTEM_IMPLEMENTATION.md for examples
3. Review existing components in components/gorut/
4. Check lib/gorut/design-system.ts for all constants
