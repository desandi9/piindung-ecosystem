# PIINDUNG Ecosystem - Global Authentication & SSO Architecture

## Overview

PIINDUNG is an enterprise ecosystem for managing multiple interconnected modules (GORUT, Penghimpunan, Arsip) with a unified authentication and authorization system. This document outlines the complete architecture, authentication flow, and role-based access control.

## System Architecture

### Core Components

1. **Global Authentication Context** (`lib/auth/auth-context.tsx`)
   - Centralized auth state management using React Context
   - Handles login, logout, and session persistence
   - Available globally via `useAuth()` hook

2. **Session Management** (`lib/auth/mock-sessions.ts`)
   - Mock user database with 5 demo accounts
   - LocalStorage-based session persistence
   - Token generation and validation
   - Simulated network delay for realistic UX

3. **Authorization System** (`lib/auth/auth-utils.ts`)
   - Role-based permission mapping
   - Module access control
   - Phone number validation and formatting
   - Password validation rules

4. **Type Definitions** (`lib/auth/types.ts`)
   - User, AuthSession, LoginCredentials interfaces
   - UserRole: super-admin, admin-pc, admin-upzis, admin-ranting, plpk
   - ModuleType: gorut, penghimpunan, arsip

## Authentication Flow

### 1. User Accesses Application

User navigates to `http://localhost:3000` → Home page redirects based on auth state:
- **Authenticated**: Redirect to `/workspace`
- **Not authenticated**: Redirect to `/login`

### 2. Login Page (`/login`)

**Fields:**
- Nomor HP (phone number in +62 format or 08x)
- Password (minimum 6 characters)
- Ingat saya (Remember Me checkbox)

**Features:**
- Show/hide password toggle
- Real-time validation feedback
- Loading state during authentication
- Demo credentials display
- Error handling with user-friendly messages

**Mock Credentials:**
```
Super Admin:      6281234567890 / admin123
Admin PC:         6281234567891 / admin123
Admin UPZIS:      6281234567892 / admin123
Admin Ranting:    6281234567893 / admin123
PLPK:             6281234567894 / plpk123
```

### 3. Session Persistence

After successful login:
- User data stored in localStorage (key: `piindung_user`)
- Auth token generated (key: `piindung_token`)
- Session restored on app reload
- Users stay logged in until explicit logout

### 4. Workspace Selector (`/workspace`)

After login, users see:
- **Available Modules**: Based on their role permissions
- **User Info Card**: Name, phone, role, module count
- **Module Selection**: Click to enter module
- **Logout Button**: Top-right navigation

**Module Access Matrix:**

| Module | Super Admin | Admin PC | Admin UPZIS | Admin Ranting | PLPK |
|--------|-------------|----------|-------------|---------------|------|
| GORUT | ✓ | ✓ | ✓ | ✓ | ✓ |
| Penghimpunan | ✓ | ✓ | ✓ | ✓ | ✗ |
| Arsip | ✓ | ✓ | ✗ | ✗ | ✗ |

### 5. Protected Module Access

Each module layout (e.g., `/gorut/layout.tsx`) implements:
- Authentication check on mount
- Redirect to login if not authenticated
- Loading state during verification
- User info display in navbar

### 6. Logout Flow

Clicking "Keluar" (Logout):
- Clears localStorage
- Removes session token
- Resets auth context
- Redirects to `/login`

## Role-Based Access Control

### User Roles

1. **Super Admin** (super-admin)
   - Full access to all modules
   - All administrative functions
   - System-wide permissions

2. **Admin PC** (admin-pc)
   - Access to GORUT, Penghimpunan, Arsip
   - Administrative functions for PC level
   - Regional management

3. **Admin UPZIS** (admin-upzis)
   - Access to GORUT, Penghimpunan
   - UPZIS-level management
   - Sub-regional coordination

4. **Admin Ranting** (admin-ranting)
   - Access to GORUT, Penghimpunan
   - Ranting/branch level management
   - Local operations

5. **PLPK** (plpk)
   - Access to GORUT only
   - Limited to collection operations
   - Field-level data entry

### Permission System

```typescript
const rolePermissions = {
  gorut: { super-admin: true, admin-pc: true, ... },
  penghimpunan: { super-admin: true, admin-pc: true, ... },
  arsip: { super-admin: true, admin-pc: true, ... }
}
```

## Implementation Details

### Authentication Context Usage

```tsx
import { useAuth } from '@/lib/auth/auth-context'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  if (!isAuthenticated) return <Redirect to="/login" />
  return <div>Welcome {user.name}</div>
}
```

### Protected Route Pattern

```tsx
// In layout.tsx
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/login')
  }
}, [isAuthenticated, isLoading, router])
```

### Permission Check

```typescript
import { canAccessModule } from '@/lib/auth/auth-utils'

const hasAccess = canAccessModule(user.role, 'gorut')
```

## Session Storage Keys

- `piindung_user`: Serialized user object
- `piindung_token`: Authentication token
- `piindung_session`: Optional session metadata

## Features Implemented

- ✓ Global phone-based login
- ✓ Mock session management
- ✓ Role-based module access
- ✓ Session persistence across page reloads
- ✓ Protected route redirects
- ✓ Logout with session clearing
- ✓ Error handling and validation
- ✓ Loading states and transitions
- ✓ User info display throughout app
- ✓ Workspace module selector
- ✓ "Back to PIINDUNG" navigation in modules

## API Simulation

The `authenticateUser()` function simulates API with 800ms delay to provide realistic loading state feedback.

## Future Enhancements

- Add actual backend authentication endpoints
- Implement refresh token rotation
- Add session expiration timer
- Add biometric login option
- Add two-factor authentication
- Add activity logging and audit trail
