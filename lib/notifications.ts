"use client"

import { createCollectionClient } from "@/services/api/record-client"

export type NotificationType = "success" | "info" | "warning"
export type NotificationIconKey = "credit-card" | "file-text" | "users" | "alert-circle" | "bell"

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  date: string
  unread: boolean
  published: boolean
  type: NotificationType
  iconKey: NotificationIconKey
}

export const NOTIFICATIONS_STORAGE_KEY = "piindung-user-notifications"
export const NOTIFICATIONS_EVENT = "piindung-user-notifications-updated"

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notification-1",
    title: "Pembayaran Zakat Berhasil",
    description: "Pembayaran zakat sebesar Rp 500.000 telah berhasil diproses.",
    time: "5 menit lalu",
    date: "14 Mei 2026",
    unread: true,
    published: true,
    type: "success",
    iconKey: "credit-card",
  },
  {
    id: "notification-2",
    title: "Laporan Bulanan Tersedia",
    description: "Laporan kegiatan bulan Januari 2024 sudah dapat diunduh.",
    time: "1 jam lalu",
    date: "14 Mei 2026",
    unread: true,
    published: true,
    type: "info",
    iconKey: "file-text",
  },
  {
    id: "notification-3",
    title: "Program Baru Ditambahkan",
    description: "Program NU Care Hijau telah ditambahkan ke daftar program.",
    time: "3 jam lalu",
    date: "14 Mei 2026",
    unread: false,
    published: true,
    type: "info",
    iconKey: "users",
  },
  {
    id: "notification-4",
    title: "Pengingat Pembayaran",
    description: "Jatuh tempo pembayaran infaq bulanan dalam 3 hari.",
    time: "1 hari lalu",
    date: "13 Mei 2026",
    unread: false,
    published: false,
    type: "warning",
    iconKey: "alert-circle",
  },
]

const notificationsClient = createCollectionClient<NotificationItem>({
  scope: "notifications",
  defaultItems: DEFAULT_NOTIFICATIONS,
  eventName: NOTIFICATIONS_EVENT,
})

function dispatchNotificationsEvent(notifications: NotificationItem[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<NotificationItem[]>(NOTIFICATIONS_EVENT, { detail: notifications }))
}

export function readNotifications() {
  try {
    const parsedNotifications = notificationsClient.readItemsSync()
    const storedById = new Map(parsedNotifications.map((item) => [item.id, item]))
    const mergedDefaults = DEFAULT_NOTIFICATIONS.map((item) => storedById.get(item.id) ?? item)
    const extraStored = parsedNotifications.filter((item) => !DEFAULT_NOTIFICATIONS.some((defaultItem) => defaultItem.id === item.id))

    return [...mergedDefaults, ...extraStored]
  } catch {
    return DEFAULT_NOTIFICATIONS
  }
}

export function writeNotifications(notifications: NotificationItem[]) {
  void notificationsClient.writeItems(notifications)
}

export function updateNotification(notificationId: string, updates: Partial<Omit<NotificationItem, "id">>) {
  const nextNotifications = readNotifications().map((notification) => {
    if (notification.id !== notificationId) return notification
    return { ...notification, ...updates }
  })

  writeNotifications(nextNotifications)
  return nextNotifications
}

export function deleteNotification(notificationId: string) {
  writeNotifications(readNotifications().filter((notification) => notification.id !== notificationId))
}

export function markAllNotificationsAsRead() {
  writeNotifications(readNotifications().map((notification) => ({ ...notification, unread: false })))
}

export function getPublishedNotifications(notifications: NotificationItem[]) {
  return notifications.filter((notification) => notification.published)
}

export function getUnreadNotificationsCount(notifications: NotificationItem[]) {
  return notifications.filter((notification) => notification.published && notification.unread).length
}

export function useNotifications() {
  return notificationsClient.useItems()
}
