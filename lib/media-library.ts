"use client"

import { createCollectionClient } from "@/services/api/record-client"

export type MediaType = "logo" | "banner" | "article thumbnail" | "document" | "gallery image"

export interface MediaItem {
  id: string
  name: string
  type: MediaType
  mimeType: string
  size: string
  url: string
  uploadedAt: string
}

export const MEDIA_LIBRARY_STORAGE_KEY = "piindung-media-manager"
export const MEDIA_LIBRARY_EVENT = "piindung-media-manager-updated"

export const DEFAULT_MEDIA_ITEMS: MediaItem[] = [
  {
    id: "media-1",
    name: "Logo PIINDUNG Biru",
    type: "logo",
    mimeType: "image/png",
    size: "120 KB",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PIINDUNG%20BIRU.-RwIMUrRjgQyDRv216W7LDokN9BO9L4.png",
    uploadedAt: "14 Mei 2026, 09:10",
  },
  {
    id: "media-2",
    name: "Banner Program Zakat",
    type: "banner",
    mimeType: "image/jpeg",
    size: "420 KB",
    url: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&q=80",
    uploadedAt: "13 Mei 2026, 16:45",
  },
  {
    id: "media-3",
    name: "Laporan Penyaluran.pdf",
    type: "document",
    mimeType: "application/pdf",
    size: "1.2 MB",
    url: "/laporan",
    uploadedAt: "12 Mei 2026, 11:20",
  },
]

const mediaClient = createCollectionClient<MediaItem>({
  scope: "media-library",
  defaultItems: DEFAULT_MEDIA_ITEMS,
  eventName: MEDIA_LIBRARY_EVENT,
})

function dispatchMediaLibraryEvent(items: MediaItem[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<MediaItem[]>(MEDIA_LIBRARY_EVENT, { detail: items }))
}

export function readStoredMediaItems() {
  return mediaClient.readItemsSync()
}

export function writeStoredMediaItems(items: MediaItem[]) {
  void mediaClient.writeItems(items)
}

export function useStoredMediaItems() {
  return mediaClient.useItems()
}
