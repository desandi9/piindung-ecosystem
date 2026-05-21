# GORUT Module Package Documentation

## Overview

GORUT is a **standalone feature module** designed to be integrated into the PIINDUNG ecosystem as a modular component. It provides a complete subsystem for managing koin infaq (coin charity) operations within the larger digital philanthropy platform.

GORUT does NOT include:
- Authentication system
- Global layout shell
- Session management
- User provisioning
- Route-level access control

GORUT ONLY provides:
- Feature routes
- Pages and components
- Sidebar navigation configuration
- Module-specific services
- Mock data and demonstrations
- UI/UX for koin infaq management

---

## Module Structure

```
app/gorut/                          # GORUT Module Root
├── layout.tsx                       # Module layout (inherits from parent)
├── page.tsx                         # Module dashboard
├── munfiq/
├── setoran/
├── validasi/
├── kecamatan/
├── upzis/
├── ranting/
├── statistik/
├── laporan/
├── rekap/
├── arsip/
├── archive/
├── announcement/
├── whatsapp/
├── notifikasi/
├── activity/
├── akses/
├── settings/
├── monitoring/
├── audit/
├── backup/
├── mobile/
├── performance/
├── keuangan/
└── transaksi/

components/gorut/                   # GORUT Components
├── gorut-sidebar.tsx               # Module sidebar navigation config
├── gorut-navbar.tsx                # Module-specific navbar
├── stats-cards.tsx                 # Dashboard stats
├── kecamatan-chart.tsx             # Regional analytics
├── recent-activity.tsx             # Activity feed
├── quick-actions.tsx               # Quick action buttons
├── feedback-components.tsx         # Toast, alerts, spinners
├── enhanced-table.tsx              # Data table component
├── modal-drawer-layouts.tsx        # Modal/drawer patterns
├── dashboard-layouts.tsx           # Dashboard grid patterns
├── smart-insights.tsx              # Insight cards
├── insight-cards.tsx               # Additional insights
├── mobile-*.tsx                    # Mobile ecosystem features
├── index.ts                        # Component exports
└── search-dropdown.tsx             # Search functionality

lib/gorut/                          # GORUT Utilities
├── design-system.ts                # Design tokens & constants
├── component-patterns.ts           # Reusable styling functions
└── [other utilities]               # Module-specific helpers

docs/                               # Module Documentation
├── DESIGN_SYSTEM.md                # Design specification
├── DESIGN_SYSTEM_IMPLEMENTATION.md # Usage patterns
├── DESIGN_SYSTEM_CHEATSHEET.md     # Quick reference
├── DESIGN_SYSTEM_SUMMARY.md        # Feature summary
└── PIINDUNG_ECOSYSTEM_ARCHITECTURE.md # Integration guide
```

---

## How GORUT Integrates with PIINDUNG

### 1. Layout Inheritance

GORUT's layout inherits from the parent PIINDUNG application:

```tsx
// app/gorut/layout.tsx
export default function GorutLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  return (
    <div className="min-h-screen bg-background">
      <GorutSidebar onCollapsedChange={setSidebarCollapsed} />
      <div className={cn('flex min-h-screen flex-col', ...)}>
        <GorutNavbar sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

The parent PIINDUNG layout handles:
- Root theme provider
- Global auth context
- Session management
- Overall page structure

### 2. Sidebar Configuration

GORUT provides sidebar navigation configuration that integrates into the parent navigation system:

```tsx
// components/gorut/gorut-sidebar.tsx
const navGroups: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { title: 'Dashboard', href: '/gorut', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { title: 'Data Munfiq', href: '/gorut/munfiq', icon: Users },
      { title: 'Setoran Koin', href: '/gorut/setoran', icon: Coins, badge: 12 },
      { title: 'Validasi Setoran', href: '/gorut/validasi', icon: CheckCircle2, badge: 8 },
    ],
  },
  // ... more navigation groups
]
```

### 3. Component Exports

All GORUT components are exported from a single index for easy importing:

```tsx
// components/gorut/index.ts
export { GorutSidebar } from './gorut-sidebar'
export { GorutNavbar } from './gorut-navbar'
export { StatsCards, RevenueCard } from './stats-cards'
// ... all components
```

### 4. Design System Standardization

GORUT defines its own design system with:
- Spacing scale (4px - 48px)
- Typography presets
- Color system (dark SaaS theme)
- Component patterns
- Reusable styling utilities

```tsx
// lib/gorut/design-system.ts
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  // ...
}

export const COLORS = {
  success: '#10b981',
  error: '#ef4444',
  // ...
}
```

---

## Routes Provided by GORUT

All routes are prefixed with `/gorut` and inherit authentication from parent:

### Dashboard & Core
- `/gorut` - Main GORUT dashboard
- `/gorut/transaksi` - Transaction history

### Operational
- `/gorut/munfiq` - Donor management
- `/gorut/setoran` - Coin deposits
- `/gorut/validasi` - Deposit validation
- `/gorut/approval` - Approval workflow

### Regional Management
- `/gorut/kecamatan` - District-level management
- `/gorut/upzis` - UPZIS (regional units)
- `/gorut/ranting` - Branch/PLPK management
- `/gorut/monitoring-plpk` - Branch monitoring

### Analytics & Reporting
- `/gorut/statistik` - Statistics dashboard
- `/gorut/laporan` - Reports & exports
- `/gorut/rekap` - Monthly summaries
- `/gorut/performance` - Target & performance
- `/gorut/keuangan` - Financial dashboard

### Communications
- `/gorut/announcement` - Announcements
- `/gorut/whatsapp` - WhatsApp templates
- `/gorut/notifikasi` - Notifications
- `/gorut/activity` - Activity log

### Administration
- `/gorut/akses` - Access control
- `/gorut/settings` - Module settings
- `/gorut/monitoring` - System monitoring
- `/gorut/audit` - Audit center
- `/gorut/backup` - Data backup

### Digital Archive
- `/gorut/archive` - Document archive
- `/gorut/arsip` - Archived records

### Mobile Ecosystem
- `/gorut/mobile` - Mobile app management

---

## Key Features

### 1. No Standalone Authentication
GORUT relies entirely on parent PIINDUNG authentication:
- No login page
- No signup flow
- No session management
- No auth context

### 2. Modular Components
All components are self-contained and reusable:
- Stats cards
- Data tables
- Charts and analytics
- Forms and inputs
- Modals and drawers
- Feedback components

### 3. Design System Consistency
Unified design system across all GORUT features:
- Consistent spacing and typography
- Enterprise dark SaaS theme
- Green accent color (#10b981)
- Responsive layouts

### 4. Mock Data Integration
Complete mock data for demonstration:
- Sample donors (munfiq)
- Transaction history
- Regional statistics
- Deposit validations
- Activity logs

---

## Integration Checklist

When integrating GORUT into a PIINDUNG project:

- [ ] Parent project has authentication system
- [ ] Parent project has session management
- [ ] Parent project has theme provider
- [ ] GORUT routes are added to parent routing
- [ ] GORUT sidebar config is injected into parent navigation
- [ ] GORUT components folder is accessible
- [ ] Design system tokens are imported correctly
- [ ] Mock data is configured (or replaced with real APIs)

---

## Customization Points

### 1. Sidebar Navigation
Modify `components/gorut/gorut-sidebar.tsx` to:
- Add/remove menu items
- Change icons
- Update badges
- Adjust hierarchy

### 2. Design System
Update `lib/gorut/design-system.ts` to:
- Change color schemes
- Adjust spacing scales
- Modify typography
- Add new tokens

### 3. Mock Data
Replace `lib/gorut/mock-data.ts` with real API calls:
- Swap mock endpoints with real backend
- Update data fetching logic
- Maintain same interface

### 4. Routes
Add new routes under `/gorut`:
- Create new folder: `app/gorut/feature-name/`
- Add `page.tsx` and components
- Update sidebar navigation

---

## Dependencies

GORUT requires parent PIINDUNG to provide:

```tsx
// Root layout context
<ThemeProvider> - For dark/light theme
<html lang="id"> - For internationalization

// Global utilities
@/components/ui/* - Base UI components (button, input, dropdown, etc.)
@/lib/utils - Utility functions
@/hooks/* - React hooks if any

// Styling
Tailwind CSS v4 with @theme support
```

---

## Example Integration

```tsx
// In PIINDUNG root layout
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ThemeProvider>
          {children} {/* Routes from app/ including /gorut */}
        </ThemeProvider>
      </body>
    </html>
  )
}

// Then GORUT routes are automatically available:
// - /gorut
// - /gorut/munfiq
// - /gorut/setoran
// - etc.
```

---

## Performance Considerations

- Lightweight component library (no external dependencies)
- Optimized images and assets
- Server-side rendering support
- Mock data cached in memory
- Responsive design for all screen sizes

---

## Versioning

Current GORUT Module Package Version: 1.0.0

- Design System v1.0
- Component Library v1.0  
- Route Structure v1.0
- Mock Data v1.0

---

## Support & Documentation

Additional documentation files:
- `DESIGN_SYSTEM.md` - Complete design specification
- `DESIGN_SYSTEM_IMPLEMENTATION.md` - Implementation guide
- `DESIGN_SYSTEM_CHEATSHEET.md` - Quick reference
- `DESIGN_SYSTEM_SUMMARY.md` - Feature overview

