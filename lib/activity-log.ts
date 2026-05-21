"use client"

import { createCollectionClient } from "@/services/api/record-client"

export type ActivityType = "Login" | "Settings" | "User" | "Article/Banner" | "System" | "Permission"
export type ActivityStatus = "Success" | "Warning" | "Failed"
export type LoginActionType = "Login" | "Logout"

export interface ActivityLogItem {
  id: string
  userName: string
  type: ActivityType
  action: string
  dateTime: string
  device?: string
  roleLabel?: string
  loginAction?: LoginActionType
  status: ActivityStatus
  optimizationMetrics?: {
    originalSize: number
    optimizedSize: number
    savedBytes: number
    savedPercent: number
    folder?: string
    fileName?: string
  }
}

export const ACTIVITY_LOG_STORAGE_KEY = "piindung-activity-log"
export const ACTIVITY_LOG_EVENT = "piindung-activity-log-updated"

const DEFAULT_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: "log-1",
    userName: "Desandi Herdiansyah",
    type: "Login",
    action: "Login ke Admin Dashboard",
    dateTime: "14 Mei 2026, 09:30",
    device: "Chrome on Windows",
    roleLabel: "Super Admin PC",
    loginAction: "Login",
    status: "Success",
  },
  {
    id: "log-2",
    userName: "Admin PC",
    type: "Settings",
    action: "Mengubah theme sistem ke Blue",
    dateTime: "14 Mei 2026, 09:10",
    device: "Edge on Windows",
    status: "Success",
  },
  {
    id: "log-3",
    userName: "Admin PC",
    type: "Article/Banner",
    action: "Memperbarui status Banner Homepage",
    dateTime: "13 Mei 2026, 16:45",
    device: "Chrome on Android",
    status: "Success",
  },
  {
    id: "log-4",
    userName: "System",
    type: "System",
    action: "Backup konfigurasi sistem berhasil dibuat",
    dateTime: "13 Mei 2026, 08:00",
    device: "Server",
    status: "Success",
  },
]

const activityLogClient = createCollectionClient<ActivityLogItem>({
  scope: "activity-log",
  defaultItems: DEFAULT_ACTIVITY_LOGS,
  eventName: ACTIVITY_LOG_EVENT,
})

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatActivityDateTime(date: Date) {
  return formatDateTime(date)
}

function getDeviceLabel() {
  if (typeof navigator === "undefined") return "Unknown device"

  const userAgent = navigator.userAgent
  const browser = userAgent.includes("Edg") ? "Edge" : userAgent.includes("Firefox") ? "Firefox" : userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : "Browser"
  const platform = navigator.platform || "Device"

  return `${browser} on ${platform}`
}

function dispatchActivityLogEvent(logs: ActivityLogItem[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<ActivityLogItem[]>(ACTIVITY_LOG_EVENT, { detail: logs }))
}

export function readActivityLogs() {
  return activityLogClient.readItemsSync()
}

export function writeActivityLogs(logs: ActivityLogItem[]) {
  void activityLogClient.writeItems(logs)
}

export function addActivityLog(log: Omit<ActivityLogItem, "id" | "dateTime" | "device"> & Partial<Pick<ActivityLogItem, "dateTime" | "device">>) {
  const nextLog: ActivityLogItem = {
    id: `log-${Date.now()}`,
    dateTime: formatDateTime(new Date()),
    device: getDeviceLabel(),
    ...log,
  }

  writeActivityLogs([nextLog, ...readActivityLogs()].slice(0, 100))
}

export function clearActivityLogs() {
  writeActivityLogs([])
}

export function exportActivityLogs(logs: ActivityLogItem[]) {
  if (typeof window === "undefined") return

  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `piindung-activity-log-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function useActivityLogs() {
  return activityLogClient.useItems()
}
