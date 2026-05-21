# PIINDUNG Architecture Foundation

## Current direction

PIINDUNG tetap memakai UI, spacing, typography, dan branding yang sudah ada. Fondasi ini ditambahkan untuk membuat struktur lebih siap ke production scale tanpa merombak layar yang sudah berjalan.

## Main folders

- `app/`: route-level composition for public pages and admin pages
- `components/`: shared UI and admin/public composite components
- `features/`: feature registries, auth access rules, and future module boundaries
- `lib/`: existing browser-side state modules that currently back the app
- `hooks/`: route/auth hooks and future page behavior hooks
- `types/`: shared domain types for auth and scalable data entities
- `services/`: storage/session services and future API/service adapters
- `utils/`: shared route and low-level helpers

## Feature boundaries

- `PIINDUNG Core`: branding, public pages, auth shell, shared systems
- `Super Admin`: governance, maintenance, backup, logs, permissions, settings
- `Admin PC`: portal content and communication operations
- `GORUT`: future operational namespace under `/gorut`
- `E-Tasyaruf`: future operational namespace under `/e-tasyaruf`

## Auth foundation

- phone number + password login remains intact
- session persistence now supports `remember me`
- role-based access rules are centralized under `features/auth/`
- protected admin route rules are reusable and maintenance-aware

## Reusable systems prepared

- notifications
- activity logs
- media uploads
- popup system
- FAQ
- maintenance mode

Each system has a route, storage key, and reusable feature definition so it can later be moved behind API/database services without changing page contracts first.

## Database-ready domain model preparation

Shared entity contracts were added for:

- users
- roles
- articles
- banners
- notifications
- gallery
- downloads
- activity logs
- media assets

These types are intentionally storage-agnostic so the current local browser state can later be replaced with API/database adapters.
