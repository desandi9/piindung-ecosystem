# GORUT Module Package

**Gerakan Koin Infak Nahdlaul Ulama Garut** - A reusable feature module for the PIINDUNG digital philanthropy ecosystem.

## What is GORUT?

GORUT is a **standalone feature module** that manages all aspects of koin infaq (coin charity) operations. It provides:

- Complete user interface for donor management
- Deposit tracking and validation workflows
- Regional hierarchy management (districts, branches, collection points)
- Analytics dashboards and reporting
- Mobile ecosystem integration
- System monitoring and audit trails

## Module-Only Package

GORUT is **NOT** a standalone application. It is a feature module that:

- Uses parent PIINDUNG's authentication system
- Inherits parent theme and layout system
- Relies on parent session management
- Provides routes, pages, and components only
- Can be seamlessly inserted into any PIINDUNG installation

## Quick Start

### 1. Already Integrated
If you're using the PIINDUNG project that includes GORUT:

```bash
pnpm install
pnpm dev
```

Then navigate to `/gorut` - the module will be available with the parent's authentication.

### 2. Access GORUT

The GORUT module is available at:
- **Root**: `/gorut`
- **Dashboard**: `/gorut` (main view with stats and charts)
- **Features**: `/gorut/munfiq`, `/gorut/setoran`, etc.

### 3. Mock Data

GORUT includes complete mock data for demonstration:
- 50+ sample donors (munfiq)
- Transaction history
- Regional statistics
- Deposit validations
- Activity logs

---

## Module Structure

```
GORUT provides these directories:

app/gorut/                    # Routes and pages
├── page.tsx                 # Main dashboard
├── munfiq/                  # Donor management
├── setoran/                 # Deposits
├── validasi/                # Validations
└── [20+ other routes]       # Full feature set

components/gorut/           # UI Components
├── gorut-sidebar.tsx       # Navigation
├── gorut-navbar.tsx        # Top bar
├── stats-cards.tsx         # Dashboard cards
├── enhanced-table.tsx      # Data tables
└── [15+ more components]   # Full component library

lib/gorut/                  # Utilities & Config
├── design-system.ts       # Design tokens
├── component-patterns.ts  # Styling helpers
└── mock-data.ts          # Sample data
```

---

## Key Features

### Operational Management
- **Donor Database**: Track and manage all donors
- **Deposit Recording**: Record and categorize deposits
- **Validation Workflow**: Approve and validate transactions
- **Transaction History**: Complete audit trail

### Regional Hierarchy
- **Districts** (Kecamatan)
- **UPZIS** (Regional units)
- **Branches** (Ranting/PLPK)
- **Monitoring Dashboard**: Track branch performance

### Analytics & Intelligence
- **Statistics**: Revenue trends and distributions
- **Reports**: Exportable data and summaries
- **Financial Dashboard**: Revenue tracking
- **Target & Performance**: Goals and achievement metrics

### Communications
- **Announcements**: Broadcast messages
- **WhatsApp Templates**: Pre-built message templates
- **Notifications**: Alert system
- **Activity Log**: Complete action audit trail

### Administration
- **System Monitoring**: Health and performance checks
- **Audit Center**: Security and compliance logs
- **Data Backup**: Backup and recovery
- **Access Control**: Permission management

---

## Design System

GORUT includes a complete, standardized design system:

- **Dark SaaS Theme**: Enterprise-grade dark interface
- **Green Accent Color**: #10b981 for primary actions
- **Responsive Layout**: Mobile-first design
- **Spacing Scale**: Consistent 4px-based spacing
- **Typography**: Clear information hierarchy
- **Components**: 20+ reusable UI components

See `docs/DESIGN_SYSTEM.md` for complete specification.

---

## Integration with PIINDUNG

GORUT is designed to work seamlessly with PIINDUNG:

### What PIINDUNG Provides
- Authentication system (phone login)
- Session management
- Theme provider (dark/light)
- Global layout shell
- Route structure

### What GORUT Provides
- Feature routes (`/gorut/*`)
- Pages and components
- Sidebar navigation items
- Module-specific services
- Mock data

### How It Works
1. User logs in to PIINDUNG
2. Session is established globally
3. User navigates to `/gorut`
4. GORUT module inherits authentication
5. All GORUT routes use parent session
6. No re-authentication needed

---

## Routes Available

All routes begin with `/gorut` and are protected by parent authentication:

```
Dashboard
  /gorut                         Main GORUT dashboard

Operational
  /gorut/munfiq                 Donor management
  /gorut/setoran                Deposit recording (12 pending)
  /gorut/validasi               Validation workflow (8 pending)
  /gorut/approval               Approval workflow (4 pending)
  /gorut/transaksi              Transaction history

Regional
  /gorut/kecamatan              District management
  /gorut/upzis                  UPZIS units
  /gorut/ranting                Branches/Collection points
  /gorut/monitoring-plpk        Branch monitoring

Analytics
  /gorut/statistik              Statistics dashboard
  /gorut/laporan                Reports & exports
  /gorut/rekap                  Monthly summaries
  /gorut/performance            Target & performance
  /gorut/keuangan               Financial dashboard

Communications
  /gorut/announcement           Announcements
  /gorut/whatsapp               WhatsApp templates
  /gorut/notifikasi             Notifications (5 unread)
  /gorut/activity               Activity log

Administration
  /gorut/akses                  Access control
  /gorut/settings               Settings
  /gorut/monitoring             System monitoring
  /gorut/audit                  Audit center
  /gorut/backup                 Data backup

Digital Archive
  /gorut/archive                Document archive
  /gorut/arsip                  Archived records

Mobile
  /gorut/mobile                 Mobile app management
```

---

## Mock Data Examples

GORUT includes realistic mock data:

### Donors (Munfiq)
- 50+ sample donors
- Contact information
- Donation history
- Regional assignments

### Deposits
- Recent transactions
- Status tracking
- Validation state
- Amount tracking

### Regional Data
- 6 districts
- 12 UPZIS units
- 24 branches/collection points
- Performance metrics

### Statistics
- Total collected: Rp 47,534,892
- Active donors: 384
- Pending validations: 8
- Monthly trends

---

## Customization

### Replace Mock Data
```tsx
// In your API integration, replace:
import { MOCK_DONORS } from '@/lib/gorut/mock-data'

// With your API calls:
const donors = await fetchDonors()
```

### Customize Design System
```tsx
// Update tokens in:
lib/gorut/design-system.ts

// Change:
- Colors
- Spacing
- Typography
- Component patterns
```

### Add New Routes
```tsx
// Create new route folder:
app/gorut/new-feature/page.tsx

// Add sidebar config:
lib/gorut/design-system.ts -> navGroups
```

---

## Dependencies

GORUT requires the parent project to have:

```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwindcss": "^4.0.0",
  "next-themes": "^0.2.0",
  "lucide-react": "^0.263.0"
}
```

All UI components use Tailwind CSS and shadcn/ui base components.

---

## Documentation

Complete documentation available in:

- `docs/GORUT_MODULE_PACKAGE.md` - Full module specification
- `docs/DESIGN_SYSTEM.md` - Design system details
- `docs/DESIGN_SYSTEM_IMPLEMENTATION.md` - Implementation guide
- `docs/DESIGN_SYSTEM_CHEATSHEET.md` - Quick reference

---

## Development

### Build
```bash
pnpm build
```

### Development Server
```bash
pnpm dev
# Open http://localhost:3000/gorut
```

### Code Structure

GORUT follows strict modular patterns:
- No standalone auth files
- No app-level providers
- Components are pure presentational
- Services handle mock data
- Design system is centralized

---

## Performance

- Lightweight (no heavy dependencies)
- Optimized images and assets
- Server-side rendering
- Responsive design
- Mobile-optimized

---

## Version

**GORUT Module Package v1.0.0**

- Design System v1.0
- Component Library v1.0
- Route Structure v1.0
- Documentation v1.0

---

## License

GORUT is part of the PIINDUNG ecosystem. Follow your organization's licensing terms.

---

## Support

For integration questions or customization needs:
1. Review `docs/GORUT_MODULE_PACKAGE.md`
2. Check `docs/DESIGN_SYSTEM_CHEATSHEET.md` for quick answers
3. Examine component source code in `components/gorut/`
4. Review mock data patterns in `lib/gorut/`

---

**GORUT** - Gerakan Koin Infak Nahdlaul Ulama Garut

A modular, reusable feature package for digital philanthropy management.
