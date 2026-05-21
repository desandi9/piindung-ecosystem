"use client"

import { createCollectionClient } from "@/services/api/record-client"

export type HomepageContentType = "Banner" | "Artikel" | "Berita"
export type HomepageContentStatus = "Published" | "Draft" | "Unpublished"

export interface HomepageContentItem {
  id: string
  type: HomepageContentType
  title: string
  subtitle: string
  description: string
  image: string
  link: string
  buttonText: string
  status: HomepageContentStatus
  order: number
  updatedAt: string
}

export const HOMEPAGE_CONTENT_STORAGE_KEY = "piindung-homepage-content"
export const HOMEPAGE_CONTENT_EVENT = "piindung-homepage-content-updated"

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContentItem[] = [
  {
    id: "content-1",
    type: "Banner",
    title: "LAZISNU Garut Salurkan Bantuan Untuk Korban Banjir",
    subtitle: "Bantuan darurat untuk warga terdampak bencana di Kecamatan Tarogong.",
    description: "Bantuan berupa paket sembako, air bersih, dan kebutuhan darurat lainnya disalurkan kepada warga terdampak banjir.",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&q=80",
    link: "https://nucare.id/category/berita",
    buttonText: "Baca Selengkapnya",
    status: "Published",
    order: 1,
    updatedAt: "14 Mei 2026, 09:20",
  },
  {
    id: "content-2",
    type: "Artikel",
    title: "Menguatkan Gerakan Zakat, Infaq, dan Sedekah",
    subtitle: "Artikel edukasi filantropi Islam",
    description: "Tulisan inspiratif tentang pengelolaan dana umat yang transparan, akuntabel, dan berdampak.",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80",
    link: "https://nucare.id/category/artikel",
    buttonText: "Buka Artikel",
    status: "Draft",
    order: 2,
    updatedAt: "12 Mei 2026, 15:45",
  },
  {
    id: "content-3",
    type: "Berita",
    title: "Program Beasiswa Santri Berprestasi Tahun 2026",
    subtitle: "Pendaftaran program pendidikan dibuka",
    description: "Pendaftaran beasiswa untuk santri berprestasi di wilayah Kabupaten Garut telah dibuka.",
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
    link: "https://nucare.id/category/berita",
    buttonText: "Buka Berita",
    status: "Published",
    order: 3,
    updatedAt: "10 Mei 2026, 11:30",
  },
  {
    id: "content-4",
    type: "Banner",
    title: "Laporan Penyaluran Dana Zakat Bulan April 2026",
    subtitle: "Transparansi laporan donasi",
    description: "Total penyaluran dana zakat mencapai Rp 500.000.000 untuk berbagai program pemberdayaan.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
    link: "/laporan",
    buttonText: "Lihat Laporan",
    status: "Unpublished",
    order: 4,
    updatedAt: "8 Mei 2026, 08:15",
  },
]

const homepageContentClient = createCollectionClient<HomepageContentItem>({
  scope: "homepage-content",
  defaultItems: DEFAULT_HOMEPAGE_CONTENT,
  eventName: HOMEPAGE_CONTENT_EVENT,
  sort: sortHomepageContent,
})

export function formatContentDate(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function dispatchHomepageContentEvent(items: HomepageContentItem[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<HomepageContentItem[]>(HOMEPAGE_CONTENT_EVENT, { detail: items }))
}

export function sortHomepageContent(items: HomepageContentItem[]) {
  return [...items].sort((first, second) => first.order - second.order)
}

function normalizeHomepageContentOrder(items: HomepageContentItem[]) {
  return sortHomepageContent(items).map((item, index) => ({ ...item, order: index + 1 }))
}

export function readHomepageContent() {
  return homepageContentClient.readItemsSync()
}

export function writeHomepageContent(items: HomepageContentItem[]) {
  void homepageContentClient.writeItems(normalizeHomepageContentOrder(items))
}

export function createHomepageContent(item: Omit<HomepageContentItem, "id" | "order" | "updatedAt">) {
  const nextOrder = normalizeHomepageContentOrder(readHomepageContent()).length + 1
  const nextItem: HomepageContentItem = {
    ...item,
    id: `content-${Date.now()}`,
    order: nextOrder,
    updatedAt: formatContentDate(),
  }
  void homepageContentClient.createItem(nextItem)
  return nextItem
}

export function updateHomepageContent(id: string, updates: Partial<Omit<HomepageContentItem, "id">>) {
  const nextItem = readHomepageContent().find((item) => item.id === id)
  if (!nextItem) return undefined

  const updatedItem = { ...nextItem, ...updates, updatedAt: formatContentDate() }
  void homepageContentClient.updateItem(id, updatedItem)
  return updatedItem
}

export function deleteHomepageContent(id: string) {
  const remainingItems = readHomepageContent().filter((item) => item.id !== id)
  writeHomepageContent(remainingItems)
}

export function moveHomepageContent(id: string, direction: "up" | "down") {
  const items = normalizeHomepageContentOrder(readHomepageContent())
  const currentIndex = items.findIndex((item) => item.id === id)
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) return items

  const nextItems = [...items]
  const currentItem = nextItems[currentIndex]
  nextItems[currentIndex] = nextItems[targetIndex]
  nextItems[targetIndex] = currentItem
  writeHomepageContent(nextItems)
  return nextItems
}

export function useHomepageContent() {
  return homepageContentClient.useItems()
}
