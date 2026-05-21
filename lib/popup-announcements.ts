"use client"

import { createCollectionClient } from "@/services/api/record-client"

export interface PopupAnnouncement {
  id: string
  title: string
  message: string
  image: string
  buttonText: string
  buttonLink: string
  active: boolean
  scheduleDate: string
  updatedAt: string
}

export const POPUP_STORAGE_KEY = "piindung-popup-announcements"
export const POPUP_EVENT = "piindung-popup-announcements-updated"

export const DEFAULT_POPUP_ANNOUNCEMENTS: PopupAnnouncement[] = [
  {
    id: "popup-1",
    title: "Program Donasi Kemanusiaan Dibuka",
    message: "Salurkan bantuan terbaik untuk program kemanusiaan NU Care-LAZISNU Garut.",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900&q=80",
    buttonText: "Donasi Sekarang",
    buttonLink: "/rekening-donasi",
    active: true,
    scheduleDate: "2026-05-14",
    updatedAt: "14 Mei 2026, 09:20",
  },
]

const popupClient = createCollectionClient<PopupAnnouncement>({
  scope: "popup-announcements",
  defaultItems: DEFAULT_POPUP_ANNOUNCEMENTS,
  eventName: POPUP_EVENT,
})

export function formatPopupDate(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function dispatchPopupEvent(items: PopupAnnouncement[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<PopupAnnouncement[]>(POPUP_EVENT, { detail: items }))
}

export function readPopupAnnouncements() {
  return popupClient.readItemsSync()
}

export function writePopupAnnouncements(items: PopupAnnouncement[]) {
  void popupClient.writeItems(items)
}

export function createPopupAnnouncement(item: Omit<PopupAnnouncement, "id" | "updatedAt">) {
  const nextItem: PopupAnnouncement = { ...item, id: `popup-${Date.now()}`, updatedAt: formatPopupDate() }
  writePopupAnnouncements([nextItem, ...readPopupAnnouncements()])
  return nextItem
}

export function updatePopupAnnouncement(id: string, updates: Partial<Omit<PopupAnnouncement, "id">>) {
  const items = readPopupAnnouncements().map((item) => item.id === id ? { ...item, ...updates, updatedAt: formatPopupDate() } : item)
  writePopupAnnouncements(items)
  return items.find((item) => item.id === id)
}

export function deletePopupAnnouncement(id: string) {
  writePopupAnnouncements(readPopupAnnouncements().filter((item) => item.id !== id))
}

export function getActivePopup(items: PopupAnnouncement[]) {
  const today = new Date().toISOString().slice(0, 10)
  return items.find((item) => item.active && (!item.scheduleDate || item.scheduleDate <= today)) ?? null
}

export function usePopupAnnouncements() {
  return popupClient.useItems()
}
