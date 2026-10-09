"use client"

import { createCollectionClient, RecordRequestError } from "@/services/api/record-client"
import { isAbortedRequest } from "@/services/api/actor-session"

export type ActivityType = "Login" | "Settings" | "User" | "Article/Banner" | "System" | "Permission" | "Inbox"
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

const activityLogClient = createCollectionClient<ActivityLogItem>({
  scope: "activity-log",
  defaultItems: [],
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

export function readActivityLogs() {
  return activityLogClient.readItemsSync()
}

export function writeActivityLogs(logs: ActivityLogItem[]) {
  void activityLogClient.writeItems(logs).catch(handleActivityWriteFailure)
}

function handleActivityWriteFailure(error: unknown) {
  // Logging must not turn a successful login/logout into a rejected promise.
  // The server remains authoritative: never retain an optimistic denied write.
  if (isAbortedRequest(error) || (error instanceof RecordRequestError && [401, 403].includes(error.status))) return
  console.error("Activity log could not be saved", error)
}

export function addActivityLog(log: Omit<ActivityLogItem, "id" | "dateTime" | "device"> & Partial<Pick<ActivityLogItem, "dateTime" | "device">>) {
  const nextLog: ActivityLogItem = {
    id: `log-${Date.now()}`,
    dateTime: formatDateTime(new Date()),
    device: getDeviceLabel(),
    ...log,
  }

  // Append only this event, rather than rewriting cached events from another login.
  void activityLogClient.createItem(nextLog).catch(handleActivityWriteFailure)
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
