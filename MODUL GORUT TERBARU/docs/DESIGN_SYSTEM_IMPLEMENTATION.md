# GORUT Design System - Implementation Guide

## Quick Start

### 1. Import Design Tokens
```tsx
import { 
  SPACING, 
  STATUS_COLORS, 
  COMPONENT_SPACING,
  TRANSITIONS 
} from '@/lib/gorut/design-system'
```

### 2. Use Helper Functions
```tsx
import { 
  getStatusBadge, 
  getStatusColor,
  getTableRowClass,
  getFormInputClass 
} from '@/lib/gorut/component-patterns'
```

### 3. Use Pre-built Components
```tsx
import { 
  StatusIndicator,
  StandardCard,
  StandardInput,
  FormField 
} from '@/components/gorut'
```

## Component Library Reference

### Status Components

**StatusIndicator** - Unified status display
```tsx
<StatusIndicator 
  status="approved"           // 'success' | 'error' | 'warning' | 'info' | 'pending' | 'approved' | 'rejected'
  label="Approved"            // Optional label
  variant="default"           // 'default' | 'outline' | 'subtle' | 'compact' | 'dot'
  showIcon={true}             // Show/hide icon
  size="md"                   // 'sm' | 'md' | 'lg'
/>
```

**StatusRow** - Status with metadata
```tsx
<StatusRow
  status="pending"
  label="Waiting Approval"
  sublabel="From Admin"
  timestamp="2 hours ago"
/>
```

**StatusBar** - Timeline visualization
```tsx
<StatusBar
  statuses={[
    { status: 'approved', label: 'Validation', completed: true },
    { status: 'pending', label: 'Review', completed: false },
  ]}
  direction="vertical"  // 'vertical' | 'horizontal'
/>
```

### Card Components

**StandardCard** - Base card component
```tsx
<StandardCard 
  title="Revenue"
  subtitle="Monthly breakdown"
  elevated={true}
  bordered={true}
  padding="lg"           // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  compact={false}
  interactive={false}
  headerAction={<Button>Action</Button>}
  footer={<div>Footer content</div>}
>
  Card content here
</StandardCard>
```

**CardGrid** - Responsive grid
```tsx
<CardGrid 
  columns={3}            // 1 | 2 | 3 | 4 | 'auto'
  gap="lg"               // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
>
  <StandardCard>...</StandardCard>
</CardGrid>
```

**StatCard** - Metric display
```tsx
<StatCard
  label="Active Users"
  value={245}
  change={{ value: 12, isPositive: true }}
  icon={<Users />}
  trend="up"             // 'up' | 'down' | 'neutral'
/>
```

**InfoCard** - Icon + info
```tsx
<InfoCard
  icon={<Activity />}
  title="Daily Active"
  value="187 devices"
  details="Last 24 hours"
/>
```

**ListCard** - List display
```tsx
<ListCard
  title="Recent Activities"
  items={[
    { id: '1', label: 'User login', icon: <LogIn /> },
    { id: '2', label: 'Data sync', icon: <Sync /> },
  ]}
  divider={true}
  interactive={true}
/>
```

### Form Components

**FormField** - Complete form field
```tsx
<FormField
  label="Email"
  required={true}
  error="Invalid email"
  hint="We'll never share your email"
>
  <StandardInput type="email" placeholder="your@email.com" />
</FormField>
```

**StandardInput** - Text input
```tsx
<StandardInput
  type="text"
  placeholder="Enter value"
  icon={<Search />}
  suffix="@gmail.com"
  error={hasError}
/>
```

**FormSection** - Organized form section
```tsx
<FormSection
  title="Personal Details"
  description="Update your information"
  divider={true}
>
  {/* Form fields */}
</FormSection>
```

**FormGrid** - Field layout
```tsx
<FormGrid columns={2} gap="md">
  <FormField label="First Name">
    <StandardInput />
  </FormField>
  <FormField label="Last Name">
    <StandardInput />
  </FormField>
</FormGrid>
```

## Migration Guide

### Old Pattern → New Pattern

**Before (Scattered Styles)**
```tsx
<div className="p-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-md">
  Approved
</div>
```

**After (Unified System)**
```tsx
<StatusIndicator status="approved" label="Approved" />
```

---

**Before (Custom Card)**
```tsx
<div className="rounded-lg border border-border/50 bg-card p-6 shadow-md">
  <h3 className="font-semibold">Title</h3>
  Content
</div>
```

**After (Standard Card)**
```tsx
<StandardCard title="Title" padding="lg" elevated>
  Content
</StandardCard>
```

---

**Before (Inconsistent Form)**
```tsx
<div>
  <label className="text-sm font-medium">Email</label>
  <input 
    type="email"
    className="h-10 rounded-md border border-input px-3"
  />
  {error && <p className="text-xs text-destructive">{error}</p>}
</div>
```

**After (Standard Form)**
```tsx
<FormField label="Email" error={error}>
  <StandardInput type="email" />
</FormField>
```

## Spacing Reference

| Token | Value | Use Case |
|-------|-------|----------|
| xs | 4px | Icon gaps, tight spacing |
| sm | 8px | Compact element spacing |
| md | 16px | Default spacing, form fields |
| lg | 24px | Card padding, section spacing |
| xl | 32px | Modal padding, large gaps |
| 2xl | 40px | Wide gaps |
| 3xl | 48px | Extra wide spacing |

## Color Reference

| Status | Primary | Secondary | Use Case |
|--------|---------|-----------|----------|
| success | Emerald 600 | Emerald 500/10 | Approved, completed |
| error | Red 600 | Red 500/10 | Rejected, failed |
| warning | Amber 600 | Amber 500/10 | Caution, needs review |
| info | Blue 600 | Blue 500/10 | Information, help |
| pending | Amber 600 | Amber 500/10 | Awaiting action |

## Typography Hierarchy

| Size | Weight | Usage |
|------|--------|-------|
| 12px (xs) | 400 | Captions, hints |
| 14px (sm) | 400/500 | Body text, labels |
| 16px (base) | 400 | Default body |
| 18px (lg) | 500 | Subheadings |
| 20px (xl) | 600 | Card titles |
| 24px (2xl) | 600/700 | Page titles |

## Common Layouts

### Dashboard Grid
```tsx
<CardGrid columns="auto" gap="lg">
  <StatCard label="Users" value="245" />
  <StatCard label="Devices" value="312" />
</CardGrid>
```

### Sidebar Form
```tsx
<div className="space-y-6">
  <FormSection title="Settings">
    {/* Fields */}
  </FormSection>
</div>
```

### Status Timeline
```tsx
<div className="space-y-4">
  <StatusRow status="approved" label="Step 1" sublabel="Completed" />
  <StatusRow status="pending" label="Step 2" sublabel="In progress" />
</div>
```

## Best Practices

1. **Always use StatusIndicator for status displays** - Never hardcode status colors
2. **Use StandardCard for content containers** - Don't use raw divs with custom styling
3. **Use FormField for form inputs** - Ensures consistent error/hint handling
4. **Use CardGrid for layouts** - Automatic responsive behavior
5. **Leverage SPACING constants** - Avoid magic numbers
6. **Follow naming conventions** - "Standard" prefix for generic components

## Performance Tips

- Import only what you need
- Use TypeScript for better IDE support
- Leverage tree-shaking with named imports
- Components are lightweight (no animation overhead)
- All styling uses Tailwind (no CSS-in-JS)

## Accessibility

All standardized components include:
- Proper focus states
- ARIA attributes where needed
- Keyboard navigation support
- Color contrast compliance
- Semantic HTML

## Testing

When testing components:
```tsx
// Test status colors
expect(StatusIndicator).toHaveClass('text-emerald-600')

// Test card padding
expect(StandardCard).toHaveClass('p-6')

// Test form validation
expect(FormField).toShowError('Invalid input')
```

## Next Steps

1. Update existing pages to use StandardCard
2. Replace custom status badges with StatusIndicator
3. Migrate forms to use FormField + standard inputs
4. Apply CardGrid to dashboard layouts
5. Use StatusBar for approval workflows
