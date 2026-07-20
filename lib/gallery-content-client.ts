"use client"

import { useEffect, useState } from "react"
import type { GalleryItem, PublicGalleryContent } from "@/lib/gallery-content"

export function useGalleryItems(): GalleryItem[] {
  const [items, setItems] = useState<GalleryItem[]>([])
  useEffect(() => { let active = true; void fetch("/api/gallery-content", { cache: "no-store" }).then(async response => { if (!response.ok) throw new Error(`Gallery HTTP ${response.status}`); return response.json() as Promise<{ content?: PublicGalleryContent }> }).then(payload => { if (active) setItems(payload.content?.items ?? []) }).catch(error => console.error("Gagal memuat galeri:", error)); return () => { active = false } }, [])
  return items
}
export function getGalleryImages(item: Pick<GalleryItem, "image">): string[] { return [item.image.path] }
