"use client"

import { createCollectionClient } from "@/services/api/record-client"

export type GalleryCategory = "Penyaluran" | "Pendidikan" | "Kesehatan" | "Relawan" | "Lingkungan"

export interface GalleryItem {
  id: string
  title: string
  caption: string
  category: GalleryCategory
  date: string
  location: string
  image: string
  images?: string[]
  instagramUrl?: string
  updatedAt: string
}

export const GALLERY_STORAGE_KEY = "piindung-gallery-content"
export const GALLERY_EVENT = "piindung-gallery-content-updated"

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gallery-1",
    title: "Penyaluran Bantuan Sosial",
    caption: "Dokumentasi penyaluran bantuan sosial untuk warga terdampak bencana.",
    category: "Penyaluran",
    date: "14 Mei 2026",
    location: "Tarogong Kidul, Garut",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1080&q=80",
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1080&q=80",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1080&q=80",
    ],
    instagramUrl: "https://www.instagram.com/lazisnu_garut",
    updatedAt: "14 Mei 2026, 09:20",
  },
  {
    id: "gallery-2",
    title: "Program Beasiswa Santri",
    caption: "Kegiatan pendampingan santri penerima program beasiswa.",
    category: "Pendidikan",
    date: "10 Mei 2026",
    location: "PCNU Kabupaten Garut",
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1080&q=80",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1080&q=80",
    ],
    instagramUrl: "https://www.instagram.com/lazisnu_garut",
    updatedAt: "10 Mei 2026, 11:30",
  },
  {
    id: "gallery-3",
    title: "Layanan Kesehatan Umat",
    caption: "Pelayanan kesehatan keliling untuk masyarakat Garut.",
    category: "Kesehatan",
    date: "7 Mei 2026",
    location: "Garut Kota",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1080&q=80",
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=1080&q=80",
    ],
    instagramUrl: "https://www.instagram.com/lazisnu_garut",
    updatedAt: "7 Mei 2026, 13:10",
  },
  {
    id: "gallery-4",
    title: "Distribusi Paket Ramadhan",
    caption: "Pembagian paket Ramadhan untuk penerima manfaat di Kabupaten Garut.",
    category: "Penyaluran",
    date: "28 April 2026",
    location: "Kabupaten Garut",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1080&q=80",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1080&q=80",
    ],
    instagramUrl: "https://www.instagram.com/lazisnu_garut",
    updatedAt: "28 April 2026, 16:05",
  },
]

const galleryClient = createCollectionClient<GalleryItem>({
  scope: "gallery-content",
  defaultItems: DEFAULT_GALLERY_ITEMS,
  eventName: GALLERY_EVENT,
})

export function formatGalleryDate(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function getGalleryImages(item: Pick<GalleryItem, "image" | "images">) {
  const normalizedImages = (item.images ?? []).map((image) => image.trim()).filter(Boolean)
  if (normalizedImages.length > 0) return normalizedImages
  return item.image ? [item.image] : []
}

function dispatchGalleryEvent(items: GalleryItem[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<GalleryItem[]>(GALLERY_EVENT, { detail: items }))
}

export function readGalleryItems() {
  return galleryClient.readItemsSync()
}

export function writeGalleryItems(items: GalleryItem[]) {
  void galleryClient.writeItems(items)
}

export function createGalleryItem(item: Omit<GalleryItem, "id" | "updatedAt">) {
  const nextItem: GalleryItem = {
    ...item,
    id: `gallery-${Date.now()}`,
    updatedAt: formatGalleryDate(),
  }
  writeGalleryItems([nextItem, ...readGalleryItems()])
  return nextItem
}

export function updateGalleryItem(id: string, updates: Partial<Omit<GalleryItem, "id">>) {
  const items = readGalleryItems().map((item) => (
    item.id === id ? { ...item, ...updates, updatedAt: formatGalleryDate() } : item
  ))
  writeGalleryItems(items)
  return items.find((item) => item.id === id)
}

export function deleteGalleryItem(id: string) {
  writeGalleryItems(readGalleryItems().filter((item) => item.id !== id))
}

export function useGalleryItems() {
  return galleryClient.useItems()
}
