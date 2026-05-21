# Mobile Ecosystem Preparation Guide

## Overview

The Mobile Ecosystem feature prepares the GORUT Super Admin dashboard for future PLPK & Munfiq mobile applications. This comprehensive infrastructure provides the foundation for managing mobile devices, sessions, push notifications, and member QR codes without requiring backend integration.

## Architecture

### Access Point
- **URL**: `/gorut/mobile`
- **Navigation**: Sidebar → Mobile section → "Mobile Ecosystem"
- **Page Layout**: Tab-based interface with 4 main sections

### File Structure
```
lib/gorut/
├── mobile-types.ts          # TypeScript interfaces and types
└── mobile-data.ts           # Mock data for development

components/gorut/
├── mobile-devices.tsx       # Device management components
├── mobile-notifications.tsx # Push notification components
├── mobile-qr.tsx            # QR member card components
└── mobile-app-status.tsx    # App monitoring components

app/gorut/
└── mobile/
    └── page.tsx             # Main Mobile Ecosystem page
```

## Core Features

### 1. Device Management Tab

**Purpose**: Monitor and manage active mobile device sessions

**Components**:
- **MobileDeviceCard**: Individual device session display
- **MobileDevicesGrid**: Responsive grid layout for multiple devices
- **DeviceActivityTimeline**: Activity history for a device

**Functionality**:
- View active mobile sessions across iOS/Android
- Device status (active, idle, suspicious, blocked)
- Online/offline state with real-time indicators
- Battery level monitoring
- Device location and IP address
- Quick actions: Logout, Block, Mark as Trusted

**Device Statistics**:
- Total devices count
- Active sessions count
- Online devices count

**Session Actions** (Functional):
- **Logout**: Revoke device session immediately
- **Block**: Permanently block suspicious device (changes status to "blocked")
- **Mark as Trusted**: Add device to trusted list (removes future prompts)

### 2. Push Notifications Tab

**Purpose**: Manage notification templates and send notifications to audiences

**Components**:
- **PushTemplateCard**: Notification template preview
- **PushTemplatesGrid**: Grid of all notification templates
- **NotificationAudienceCard**: Selectable audience segments
- **NotificationTestDialog**: Send test notification dialog

**Templates Available** (5 predefined):
1. **New Approval Request** (Operational)
   - Category-specific triggering for approval workflow
   - Deep link to approval page

2. **Transaction Report** (Finance)
   - Monthly financial summaries
   - Regional transaction data

3. **Collection Reminder** (Reminder)
   - Periodic fund collection notifications
   - Time-based triggers

4. **System Announcement** (Announcement)
   - Broadcasting system-wide messages
   - Flexible template variables

5. **Security Alert** (Security)
   - Account security notifications
   - Suspicious activity warnings

**Audience Segmentation** (4 predefined):
1. **All Active Users** - Send to all active app users (287 users)
2. **PLPK Coordinators** - Coordinators and supervisors (45 users)
3. **Munfiq Officers** - Officers and managers (62 users)
4. **Bandung Region** - Regional targeting (78 users)

**Notification Categories**:
- Operational (Blue)
- Finance (Green)
- Reminder (Amber)
- Announcement (Purple)
- Security (Red)

**Functional Features**:
- Select template and audience
- Send test notification with confirmation dialog
- Toast notification feedback on send
- Display delivery counts

### 3. QR Member Cards Tab

**Purpose**: Prepare member identification for mobile QR scanning

**Components**:
- **QRMemberCardComponent**: Individual member QR card
- **QRMemberCardsGrid**: Grid of member cards
- **QRScanReadyLayout**: Mobile camera frame mockup
- **MemberQRStatusCard**: QR coverage metrics

**Functionality**:
- Display member details (name, kecamatan, role)
- QR code placeholder (ready for future implementation)
- Member join date and status
- Quick actions: Download QR, Copy Member ID
- QR code ready for scanning via mobile app

**QR Status Dashboard**:
- Coverage percentage
- Members with QR codes
- Scan activity tracking (this month)
- Visual progress indicator

**Scan-Ready Layout**:
- Mobile camera frame preview
- Scan area guidance
- Corner alignment guides
- Camera readiness status

### 4. Mobile App Monitoring Tab

**Purpose**: Monitor mobile application health and user activity

**Components**:
- **MobileAppStatusPanel**: Overall health status dashboard
- **MobileLoginActivityCard**: Recent login history
- **DeviceHealthChart**: Device distribution metrics
- **LatestMobileActivityCard**: Recent system events

**Metrics Displayed**:
- Active users (245 current)
- Total registered devices (312)
- Online devices now (187)
- Average device battery (62%)
- Notification delivery rate (94.8%)
- System error rate (1.2%)
- Last sync time (2 minutes ago)

**Health Status**:
- Critical: Error rate > 5%
- Warning: Error rate > 2%
- Healthy: Error rate ≤ 2%

**Activity Tracking**:
- Real-time login activity
- Sync operations
- Notification delivery
- System updates
- Device health changes

## Mock Data Structure

### Session Data
```typescript
interface MobileSession {
  id: string
  deviceId: string
  deviceName: string
  deviceType: 'iOS' | 'Android' | 'Web'
  lastLogin: Date
  appVersion: string
  status: 'active' | 'idle' | 'suspicious' | 'blocked'
  isTrusted: boolean
  isOnline: boolean
  ipAddress: string
  location: string
  batteryLevel?: number
}
```

### Device Data
```typescript
interface MobileDevice {
  id: string
  userId: string
  userName: string
  deviceName: string
  deviceType: DeviceType
  appVersion: string
  osVersion: string
  registeredDate: Date
  lastActive: Date
  status: DeviceStatus
  sessions: number
  isTrusted: boolean
}
```

### Push Templates
```typescript
interface PushNotificationTemplate {
  id: string
  name: string
  category: PushCategory
  title: string
  body: string
  deepLink?: string
  createdAt: Date
}
```

## State Management

The page uses local React state (no backend):
- `sessions`: Active mobile sessions
- `selectedAudience`: Current notification audience
- `testNotificationOpen`: Dialog state
- `pinnedInsightIds`: Saved insight tracking
- `refreshKey`: Data refresh trigger

## Functional Interactions

### Device Management
```
User Action          → State Change       → Visual Feedback
"Logout"             → Remove session     → Toast notification
"Block"              → Set status blocked → Toast notification
"Mark as Trusted"    → Set isTrusted true → Toast notification
"Refresh"            → Increment key      → Toast notification
```

### Notifications
```
Select Audience      → Update state       → Visual highlight
Select Template      → Store template ID  → Dialog opens
"Send Test"          → Dialog opens       → Confirmation step
Confirm Send         → Update state       → Success toast
```

### QR Cards
```
"Download QR"        → Console log        → (Ready for backend)
"Copy ID"            → Clipboard copy     → (System feedback)
```

## Integration Points (Future)

When integrating with backend:

1. **Device Management API**
   - GET `/api/mobile/sessions` - Fetch active sessions
   - POST `/api/mobile/sessions/{id}/revoke` - End session
   - POST `/api/mobile/sessions/{id}/block` - Block device
   - POST `/api/mobile/sessions/{id}/trust` - Mark trusted

2. **Push Notifications API**
   - GET `/api/push/templates` - List templates
   - POST `/api/push/send-test` - Send test notification
   - GET `/api/push/audiences` - List audience segments
   - POST `/api/push/audiences` - Create custom audience

3. **QR Member Cards API**
   - GET `/api/members/qr` - Fetch member QR data
   - POST `/api/members/{id}/generate-qr` - Generate actual QR
   - GET `/api/members/qr-stats` - QR coverage stats

4. **App Monitoring API**
   - GET `/api/mobile/status` - Real-time app metrics
   - GET `/api/mobile/login-activity` - Recent logins
   - GET `/api/mobile/health` - Device health metrics
   - GET `/api/mobile/events` - Activity log

## Styling & Design

### Color Scheme
- **Emerald**: Primary actions, success states
- **Blue**: Operational category
- **Amber**: Warnings, idle states
- **Red**: Errors, security alerts
- **Purple**: Announcements
- **Green**: Finance category

### Component Layout
- Desktop-first responsive design
- Grid layouts: 1, 2, 3 columns depending on content
- Card-based interface for devices
- Tab navigation for sections
- Consistent spacing and typography

### Dark Enterprise Theme
- Dark background (`bg-slate-950`)
- Light text (`text-foreground`)
- Subtle borders (`border-border`)
- Muted secondary text (`text-muted-foreground`)
- Consistent with existing GORUT dashboard

## Performance Considerations

- Local state only (no API calls)
- Mock data instantiated at page load
- Efficient grid layouts with CSS Grid
- Minimal re-renders using React.memo patterns
- Responsive images and icons

## Testing Checklist

- [x] Device tab displays all sessions
- [x] Logout removes device from list
- [x] Block changes device status
- [x] Mark as Trusted updates state
- [x] Notification templates display with categories
- [x] Audience selection works
- [x] Send test notification dialog opens
- [x] QR member cards render correctly
- [x] QR scan layout preview displays
- [x] Monitoring metrics display correctly
- [x] All tabs navigate correctly
- [x] Refresh button updates data
- [x] Toast notifications display feedback

## Future Roadmap

### Phase 2: Mobile App Integration
- Connect to actual PLPK mobile app
- Connect to actual Munfiq mobile app
- Real device registration flow
- Actual QR code generation

### Phase 3: Real-time Features
- WebSocket for live session updates
- Real-time push notifications
- Live device status updates
- Activity log streaming

### Phase 4: Advanced Features
- Device geofencing
- App version management
- Beta testing tracks
- Device analytics
- Crash reporting
