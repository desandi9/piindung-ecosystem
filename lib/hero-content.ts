"use client"

import { createSingletonClient } from "@/services/api/record-client"

export const HERO_CONTENT_SCOPE = "hero-content"
export const HERO_CONTENT_EVENT = "piindung-hero-content-updated"

export interface HeroContent {
  eyebrow: string
  headingLine1: string
  headingLine2: string
  headingLine3: string
  headingAccent: string
  description: string
  ctaPrimaryLabel: string
  ctaPrimaryHref: string
  ctaSecondaryLabel: string
  ctaSecondaryHref: string
  badgeTop: string
  badgeBottom: string
  badgeBottomSub: string
  marqueeItems: string[]
  updatedAt: string
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  eyebrow: "Ekosistem Digital LAZISNU Garut",
  headingLine1: "Satu Ekosistem",
  headingLine2: "untuk Pelayanan",
  headingLine3: "yang ",
  headingAccent: "Lebih Unggul.",
  description:
    "PIINDUNG menyatukan data, proses, dan layanan NU Care–LAZISNU Garut agar kerja pengurus lebih tertib, cepat, dan mudah dipantau.",
  ctaPrimaryLabel: "Jelajahi PIINDUNG",
  ctaPrimaryHref: "/produk",
  ctaSecondaryLabel: "Masuk ke Sistem",
  ctaSecondaryHref: "/login",
  badgeTop: "Sistem terhubung",
  badgeBottom: "Data hari ini",
  badgeBottomSub: "Sudah diperbarui",
  marqueeItems: [
    "PENGHIMPUNAN",
    "PENGELOLAAN",
    "PENYALURAN",
    "PELAPORAN",
    "TRANSPARANSI",
    "PELAYANAN UMAT",
  ],
  updatedAt: new Date(0).toISOString(),
}

const heroContentClient = createSingletonClient<HeroContent>({
  scope: HERO_CONTENT_SCOPE,
  defaultValue: DEFAULT_HERO_CONTENT,
  eventName: HERO_CONTENT_EVENT,
})

export function useHeroContent() {
  return heroContentClient.useValue()
}

export function readHeroContentSync() {
  return heroContentClient.readValueSync()
}

export async function readHeroContent() {
  return heroContentClient.readValue()
}

export async function writeHeroContent(value: Omit<HeroContent, "updatedAt">) {
  const payload: HeroContent = {
    ...value,
    updatedAt: new Date().toISOString(),
  }
  return heroContentClient.writeValue(payload)
}
