'use client'

const DASHBOARD_ENTRY_KEY = 'gorut-dashboard-entry'
const DASHBOARD_ENTRY_WINDOW_MS = 2200

export function markDashboardEntry() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(DASHBOARD_ENTRY_KEY, String(Date.now()))
}

export function hasRecentDashboardEntry() {
  if (typeof window === 'undefined') return false

  const rawValue = window.sessionStorage.getItem(DASHBOARD_ENTRY_KEY)
  if (!rawValue) return false

  const timestamp = Number(rawValue)
  if (Number.isNaN(timestamp)) return false

  return Date.now() - timestamp < DASHBOARD_ENTRY_WINDOW_MS
}

export function clearDashboardEntryMarker() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(DASHBOARD_ENTRY_KEY)
}
