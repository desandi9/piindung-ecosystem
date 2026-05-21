"use client"

import { createCollectionClient } from "@/services/api/record-client"

export type DownloadCategory = "logo" | "template" | "document" | "media asset"

export interface DownloadItem {
  id: string
  name: string
  description: string
  category: DownloadCategory
  fileName: string
  link: string
  updatedAt: string
}

export const DOWNLOAD_CENTER_STORAGE_KEY = "piindung-download-center"
export const DOWNLOAD_CENTER_EVENT = "piindung-download-center-updated"

export const DEFAULT_DOWNLOAD_ITEMS: DownloadItem[] = [
  {
    id: "download-1",
    name: "Logo NU Care-LAZISNU Garut",
    description: "Paket logo untuk kebutuhan publikasi resmi.",
    category: "logo",
    fileName: "logo-nucare-lazisnu-garut.zip",
    link: "data:text/plain;charset=utf-8,Logo%20NU%20Care-LAZISNU%20Garut",
    updatedAt: "14 Mei 2026, 09:20",
  },
  {
    id: "download-2",
    name: "Template Surat Permohonan",
    description: "Format surat permohonan bantuan dan kerja sama.",
    category: "template",
    fileName: "template-surat-permohonan.docx",
    link: "data:text/plain;charset=utf-8,Template%20Surat%20Permohonan",
    updatedAt: "12 Mei 2026, 15:45",
  },
  {
    id: "download-3",
    name: "Profil Lembaga",
    description: "Dokumen profil singkat NU Care-LAZISNU PCNU Garut.",
    category: "document",
    fileName: "profil-lembaga.pdf",
    link: "data:text/plain;charset=utf-8,Profil%20Lembaga",
    updatedAt: "10 Mei 2026, 11:30",
  },
  {
    id: "download-4",
    name: "Media Kit Program",
    description: "Materi publikasi program dan aset media sosial.",
    category: "media asset",
    fileName: "media-kit-program.zip",
    link: "data:text/plain;charset=utf-8,Media%20Kit%20Program",
    updatedAt: "8 Mei 2026, 08:15",
  },
]

const downloadClient = createCollectionClient<DownloadItem>({
  scope: "download-center",
  defaultItems: DEFAULT_DOWNLOAD_ITEMS,
  eventName: DOWNLOAD_CENTER_EVENT,
})

export function formatDownloadDate(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function categoryLabel(category: DownloadCategory) {
  if (category === "logo") return "Logo Files"
  if (category === "template") return "Template Berkas"
  if (category === "document") return "Documents"
  return "Media Assets"
}

function dispatchDownloadEvent(items: DownloadItem[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<DownloadItem[]>(DOWNLOAD_CENTER_EVENT, { detail: items }))
}

export function readDownloadItems() {
  return downloadClient.readItemsSync()
}

export function writeDownloadItems(items: DownloadItem[]) {
  void downloadClient.writeItems(items)
}

export function createDownloadItem(item: Omit<DownloadItem, "id" | "updatedAt">) {
  const nextItem: DownloadItem = {
    ...item,
    id: `download-${Date.now()}`,
    updatedAt: formatDownloadDate(),
  }
  writeDownloadItems([nextItem, ...readDownloadItems()])
  return nextItem
}

export function updateDownloadItem(id: string, updates: Partial<Omit<DownloadItem, "id">>) {
  const items = readDownloadItems().map((item) => (
    item.id === id ? { ...item, ...updates, updatedAt: formatDownloadDate() } : item
  ))
  writeDownloadItems(items)
  return items.find((item) => item.id === id)
}

export function deleteDownloadItem(id: string) {
  writeDownloadItems(readDownloadItems().filter((item) => item.id !== id))
}

export function useDownloadItems() {
  return downloadClient.useItems()
}
