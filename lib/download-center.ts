"use client"

import { useEffect, useState } from "react"
import type { PublicDownloadContent, PublicDownloadItem } from "./download-content"

export type DownloadCategory = "logo" | "template" | "document" | "media asset"
export type DownloadItem = { id: string; name: string; description: string; category: DownloadCategory; fileName: string; link: string; updatedAt: string }
export const DEFAULT_DOWNLOAD_ITEMS: DownloadItem[] = []
export function categoryLabel(category: DownloadCategory) { return category === "logo" ? "Logo Files" : category === "template" ? "Template Berkas" : category === "document" ? "Documents" : "Media Assets" }

function toDownloadItem(item: PublicDownloadItem): DownloadItem | null {
  const link = item.sourceType === "uploaded" ? item.file?.url : item.externalUrl
  if (!link) return null
  return { id: item.id, name: item.title, description: item.description, category: "document", fileName: item.file?.originalDisplayName || item.title, link, updatedAt: item.updatedLabel || item.publishedAt || "" }
}

export function useDownloadItems() {
  const [items, setItems] = useState<DownloadItem[]>([])
  useEffect(() => {
    let active = true
    fetch("/api/download-content")
      .then(async response => {
        if (!response.ok) throw new Error("Gagal memuat dokumen")
        return response.json() as Promise<{ content: PublicDownloadContent }>
      })
      .then(({ content }) => {
        if (active) setItems(content.items.map(toDownloadItem).filter((item): item is DownloadItem => item !== null))
      })
      .catch(error => {
        console.error("Download items failed:", error)
        if (active) setItems([])
      })
    return () => { active = false }
  }, [])
  return items
}
