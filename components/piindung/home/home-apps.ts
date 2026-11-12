"use client"

import { useEffect, useState } from "react"
import { PUBLIC_PRODUCTS_EVENT, readPublicProducts, refreshPublicProducts, type PublicProduct } from "@/lib/public-products"

export const LANDING_APP_IDS = ["gorut", "etasyaruf", "mobisnu", "arsip"] as const
export type LandingAppId = (typeof LANDING_APP_IDS)[number]

/** Ikon CMS berukuran 2–4 MB per file; landing memakai salinan WebP 192px dari berkas yang sama. */
const localIcons: Record<LandingAppId, string> = {
  gorut: "/images/landing/app-gorut.webp",
  etasyaruf: "/images/landing/app-etasyaruf.webp",
  mobisnu: "/images/landing/app-mobisnu.webp",
  arsip: "/images/landing/app-arsip.webp",
}

export interface LandingApp {
  id: LandingAppId
  name: string
  category: string
  description: string
  icon: string
  available: boolean
  /** Tautan publik aplikasi non-GORUT. GORUT selalu memakai rute V2 dari resolveLandingGorutRoute. */
  href: string | null
}

export function toLandingApps(products: PublicProduct[]): LandingApp[] {
  const byId = new Map(products.map((product) => [product.id, product]))
  return LANDING_APP_IDS.flatMap((id): LandingApp[] => {
    const product = byId.get(id)
    if (!product?.visible) return []
    // Aturan sama dengan dasbor (portal-hub): aplikasi baru dianggap aktif bila berstatus
    // Aktif dan punya tautan yang bisa dibuka. publicHref GORUT di CMS masih /gorut (V1),
    // jadi tidak pernah dipakai.
    const available = id === "gorut" ? product.status === "Aktif" : product.status === "Aktif" && Boolean(product.publicHref)
    return [{
      id,
      name: product.name,
      category: product.category,
      description: product.description,
      icon: localIcons[id],
      available,
      href: id !== "gorut" && available ? product.publicHref : null,
    }]
  })
}

export function useLandingApps() {
  const [apps, setApps] = useState(() => toLandingApps(readPublicProducts()))

  useEffect(() => {
    const update = (event: Event) => setApps(toLandingApps((event as CustomEvent<PublicProduct[]>).detail ?? readPublicProducts()))
    window.addEventListener(PUBLIC_PRODUCTS_EVENT, update)
    void refreshPublicProducts().catch(() => undefined)
    return () => window.removeEventListener(PUBLIC_PRODUCTS_EVENT, update)
  }, [])

  return apps
}
