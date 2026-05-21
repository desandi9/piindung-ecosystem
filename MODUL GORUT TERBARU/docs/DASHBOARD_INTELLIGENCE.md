# Dashboard Intelligence System - Implementation Guide

## Overview

The Dashboard Intelligence feature provides real-time operational insights directly on the GORUT main dashboard. It generates smart, actionable insights using mock dashboard data and local state management, helping administrators stay informed about critical operational metrics.

## Architecture

### Core Files

1. **`/lib/gorut/insights.ts`** - Insight generation utilities and calculations
   - `DashboardInsight` interface - Type definition for insight objects
   - `InsightCategory` - Categorizes insights: operational, finance, performance, security, system
   - `InsightPriority` - Priority levels: critical, high, medium, low
   - `generateDashboardInsights()` - Main function to generate all insights from current data
   - Calculation utilities for dynamic insight generation

2. **`/components/gorut/insight-cards.tsx`** - UI components for displaying insights
   - `InsightCard` - Individual insight card component
   - `InsightGrid` - Grid layout for multiple insights
   - `InsightPanel` - Main panel with category filtering and collapse
   - `CriticalInsightBanner` - Prominent banner for critical alerts

3. **`/app/gorut/page.tsx`** - Dashboard page with insight integration
   - Integrates `InsightPanel` into main dashboard
   - Manages pinned insights state
   - Handles critical insight dismissal

## Features

### 1. Dynamic Insight Generation

The system generates insights from mock dashboard data:

```typescript
generateDashboardInsights(statistikGorut, kecamatanData): DashboardInsight[]
```

**Operational Insights:**
- Pending approvals count
- Inactive PLPK members
- Inactive collection boxes
- Active collection boxes status

**Finance Insights:**
- Monthly target achievement percentage
- Contribution growth month-over-month
- Daily average contribution
- Members without recent contribution

**Performance Insights:**
- Top performing kecamatan

**Security Insights:**
- Backup system warnings

**System Insights:**
- WhatsApp gateway status

### 2. Category Filtering

Users can filter insights by category:
- All Insights
- Operational
- Finance
- Performance
- Security
- System

Filter state is managed in the `InsightPanel` component using `selectedCategory` state.

### 3. Priority Sorting

Insights are automatically sorted by priority:
1. Critical (highest)
2. High
3. Medium
4. Low (lowest)

### 4. Pin/Unpin Functionality

Users can pin important insights for quick access. Pinned state is tracked in the dashboard component:

```typescript
const [pinnedInsightIds, setPinnedInsightIds] = useState<string[]>([])
const handlePinInsight = (id: string) => {
  setPinnedInsightIds(prev =>
    prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
  )
}
```

### 5. Actionable Links

Each insight can include an action link:
- "Review Approvals" → `/gorut/approval`
- "View Analytics" → `/gorut/analytics`
- "View Members" → `/gorut/munfiq`
- "Review Backups" → `/gorut/system/backup`
- "System Status" → `/gorut/system/gateway`

### 6. Critical Alert Banner

A prominent red banner displays at the top for critical insights:
- Automatically highlighted in red
- Shows action button
- Can be dismissed

### 7. Collapsible Panel

The entire insight panel can be collapsed to save screen space:
- Toggle controlled by `isExpanded` state in `InsightPanel`
- Displays insight count in header

### 8. Refresh Functionality

Users can refresh insights by clicking the "Refresh" button, which reloads the page to generate new insight values.

## Component Structure

### InsightCard Props

```typescript
interface InsightCardProps {
  insight: DashboardInsight
  onPin?: (id: string) => void
  isPinned?: boolean
  compact?: boolean
}
```

### InsightPanel Props

```typescript
interface InsightPanelProps {
  insights: DashboardInsight[]
  onPin?: (id: string) => void
  pinnedIds?: string[]
}
```

## Styling

The system uses:
- **Category colors** - Different background colors for each category
- **Priority colors** - Color-coded borders and backgrounds based on priority
- **Status icons** - Visual indicators for success, warning, error, info states
- **Trend indicators** - Up/down arrows with percentage change
- **Enterprise styling** - Dark SaaS aesthetic matching existing dashboard

### Color Scheme

- **Operational**: Blue (`bg-blue-500/10`, `text-blue-600`)
- **Finance**: Emerald (`bg-emerald-500/10`, `text-emerald-600`)
- **Performance**: Purple (`bg-purple-500/10`, `text-purple-600`)
- **Security**: Orange (`bg-orange-500/10`, `text-orange-600`)
- **System**: Slate (`bg-slate-500/10`, `text-slate-600`)

Priority backgrounds:
- **Critical**: Red (`bg-red-500/5`, `border-red-500/20`)
- **High**: Orange (`bg-orange-500/5`, `border-orange-500/20`)
- **Medium**: Amber (`bg-amber-500/5`, `border-amber-500/20`)
- **Low**: Blue (`bg-blue-500/5`, `border-blue-500/20`)

## Mock Data Implementation

The system uses calculation utilities that return mock values based on random ranges:

```typescript
// Example: Pending approvals between 1-8
countPendingApprovals: (): number => {
  return Math.floor(Math.random() * 8) + 1
}

// Example: Monthly target percentage
getMonthlyTargetPercentage: (stats: StatistikGorut): number => {
  const targetMonthly = 250000000
  return Math.round((stats.terkumpulBulanIni / targetMonthly) * 100)
}
```

Each calculation is self-contained and returns realistic mock data that changes on page refresh.

## Usage in Dashboard

```tsx
'use client'

import { InsightPanel, CriticalInsightBanner } from '@/components/gorut/insight-cards'
import { generateDashboardInsights } from '@/lib/gorut/insights'

export default function GorutDashboard() {
  const [pinnedInsightIds, setPinnedInsightIds] = useState<string[]>([])

  const insights = useMemo(
    () => generateDashboardInsights(statistikGorut, kecamatanData),
    []
  )

  const handlePinInsight = (id: string) => {
    setPinnedInsightIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <CriticalInsightBanner insights={criticalInsights} />
      <div className="bg-muted/20 rounded-lg border p-4">
        <InsightPanel
          insights={insights}
          onPin={handlePinInsight}
          pinnedIds={pinnedInsightIds}
        />
      </div>
    </div>
  )
}
```

## Performance Considerations

- **Client-side only**: No backend requests needed
- **Memoized calculations**: Uses `useMemo` to avoid recalculation on every render
- **Lightweight state**: Only tracks pinned insight IDs
- **No animations**: Minimal animations for better performance
- **Responsive grid**: Automatically adjusts columns: 1 (mobile) → 2 (tablet) → 3 (desktop)

## Future Enhancement Opportunities

1. **Persist pinned insights** - Store in localStorage or database
2. **Custom insight schedules** - Refresh at specific intervals
3. **Real-time updates** - Connect to WebSocket for live data
4. **Insight history** - Track how insights change over time
5. **Custom thresholds** - Allow admins to set alert thresholds
6. **Insight analytics** - Track which insights are most frequently viewed
7. **Email digest** - Send daily digest of critical insights
8. **Mobile optimizations** - Compact view for mobile devices
9. **Snooze functionality** - Temporarily hide non-critical insights
10. **Advanced filtering** - Filter by multiple categories, date range, etc.

## Testing the System

1. Navigate to `/gorut` dashboard
2. Scroll to "Dashboard Intelligence" panel
3. Click category filters to see filtered insights
4. Click pin icons to pin/unpin insights
5. Click action buttons (View Details, View Analytics, etc.) to navigate
6. Click Refresh button to generate new insight values
7. Collapse/expand panel using header toggle

## Integration with Existing Features

The Dashboard Intelligence system:
- Maintains existing dashboard layout
- Does not redesign any existing UI
- Works alongside existing dashboard components (Stats Cards, Quick Actions, Charts, etc.)
- Uses same styling patterns and typography
- Integrates seamlessly with sidebar and navigation

## Files Modified/Created

### Created:
- `/lib/gorut/insights.ts` - Insight utilities and calculations
- `/components/gorut/insight-cards.tsx` - Insight UI components

### Modified:
- `/app/gorut/page.tsx` - Added insight panel integration
- `/components/gorut/index.ts` - Exported new components

## Key Implementation Details

1. **Type Safety** - Fully typed with TypeScript
2. **Reusable Components** - Can be used on other dashboard pages
3. **Accessible** - Uses semantic HTML and proper ARIA labels
4. **Responsive** - Works on desktop, tablet, and mobile
5. **Themeable** - Color scheme can be customized via Tailwind tokens
6. **Enterprise-ready** - Follows SaaS best practices
