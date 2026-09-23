"use client"

import { createSingletonClient } from "@/services/api/record-client"

export const IMPACT_PREVIEW_SCOPE = "impact-preview-content"
export const IMPACT_PREVIEW_EVENT = "piindung-impact-preview-updated"

export type ImpactCardIconKey =
  | "git-branch"
  | "clipboard-check"
  | "monitor-check"
  | "file-text"
  | "users"
  | "heart"
  | "shield"
  | "chart"

export interface ImpactCard {
  id: string
  title: string
  description: string
  iconKey: ImpactCardIconKey
  visible: boolean
}

export interface ImpactPreviewContent {
  eyebrow: string
  headingLine1: string
  headingLine2: string
  headingAccent: string
  description: string
  quote: string
  ctaLabel: string
  ctaHref: string
  cards: ImpactCard[]
  updatedAt: string
}

export const DEFAULT_IMPACT_PREVIEW_CONTENT: ImpactPreviewContent = {
  eyebrow: "Dampak Digitalisasi",
  headingLine1: "Kerja lebih tertib.",
  headingLine2: "",
  headingAccent: "Dampak lebih terasa.",
  description:
    "Ketika informasi tersusun dan proses terhubung, pengurus dapat memberi lebih banyak perhatian pada hal yang paling penting: pelayanan kepada umat.",
  quote:
    "Teknologi hadir untuk memperkuat amanah, bukan menggantikan nilai kemanusiaan di dalamnya.",
  ctaLabel: "Lihat Dampak Selengkapnya",
  ctaHref: "/dampak",
  cards: [
    {
      id: "card-1",
      title: "Data Lebih Terpusat",
      description: "Informasi dari berbagai proses dikelola dalam satu ekosistem.",
      iconKey: "git-branch",
      visible: true,
    },
    {
      id: "card-2",
      title: "Proses Lebih Efisien",
      description: "Mengurangi pekerjaan berulang dan mempercepat alur kerja pengurus.",
      iconKey: "clipboard-check",
      visible: true,
    },
    {
      id: "card-3",
      title: "Monitoring Lebih Mudah",
      description: "Perkembangan kegiatan dan operasional terlihat secara ringkas.",
      iconKey: "monitor-check",
      visible: true,
    },
    {
      id: "card-4",
      title: "Laporan Lebih Tertata",
      description: "Rekap data mendukung akuntabilitas dan pertanggungjawaban organisasi.",
      iconKey: "file-text",
      visible: true,
    },
  ],
  updatedAt: new Date(0).toISOString(),
}

const impactPreviewClient = createSingletonClient<ImpactPreviewContent>({
  scope: IMPACT_PREVIEW_SCOPE,
  defaultValue: DEFAULT_IMPACT_PREVIEW_CONTENT,
  eventName: IMPACT_PREVIEW_EVENT,
})

export function useImpactPreviewContent() {
  return impactPreviewClient.useValue()
}

export function readImpactPreviewContentSync() {
  return impactPreviewClient.readValueSync()
}

export async function readImpactPreviewContent() {
  return impactPreviewClient.readValue()
}

export async function writeImpactPreviewContent(
  value: Omit<ImpactPreviewContent, "updatedAt">,
) {
  const payload: ImpactPreviewContent = {
    ...value,
    updatedAt: new Date().toISOString(),
  }
  return impactPreviewClient.writeValue(payload)
}
