"use client"

import { useEffect, useState } from "react"
import { DEFAULT_PUBLIC_PRODUCTS, PUBLIC_PRODUCTS_EVENT, type PublicProduct, type PublicProductId } from "@/lib/public-products-data"

export { DEFAULT_PUBLIC_PRODUCTS, isValidPublicProductRoute, PUBLIC_PRODUCTS_EVENT, PUBLIC_PRODUCTS_STORAGE_KEY, type PublicProduct, type PublicProductCategory, type PublicProductId, type PublicProductStatus } from "@/lib/public-products-data"

let publicProductsCache: PublicProduct[] = []

function dispatchProducts(products: PublicProduct[]) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PUBLIC_PRODUCTS_EVENT, { detail: products }))
}

export function sortPublicProducts(products: PublicProduct[]) {
  return sortPublicProductsInternal(products)
}

function sortPublicProductsInternal(products: PublicProduct[]) {
  return [...products].sort((first, second) => first.position - second.position)
}

export function readPublicProducts() {
  return sortPublicProductsInternal(publicProductsCache.length ? publicProductsCache : DEFAULT_PUBLIC_PRODUCTS)
}

export async function refreshPublicProducts() {
  const response = await fetch("/api/public-products", { credentials: "include" })
  if (!response.ok) throw new Error("Gagal memuat produk publik.")
  const payload = await response.json() as { products: PublicProduct[] }
  publicProductsCache = sortPublicProductsInternal(payload.products)
  dispatchProducts(publicProductsCache)
  return publicProductsCache
}

export async function updatePublicProduct(id: PublicProductId, updates: Partial<Omit<PublicProduct, "id">>) {
  const response = await fetch(`/api/public-products?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  const payload = await response.json().catch(() => null) as { product?: PublicProduct; error?: string } | null
  if (!response.ok) throw new Error(payload?.error || "Gagal menyimpan perubahan produk.")
  await refreshPublicProducts()
  return payload?.product ?? null
}

export async function reorderPublicProducts(orderedIds: PublicProductId[]) {
  const response = await fetch("/api/public-products?action=reorder", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  })
  const payload = await response.json().catch(() => null) as { products?: PublicProduct[]; error?: string } | null
  if (!response.ok) throw new Error(payload?.error || "Gagal menyimpan urutan produk.")
  await refreshPublicProducts()
  return payload?.products ?? []
}

export function usePublicProducts() {
  const [products, setProducts] = useState<PublicProduct[]>(readPublicProducts)
  useEffect(() => {
    void refreshPublicProducts().then(setProducts).catch(() => undefined)
    const handleUpdate = (event: Event) => setProducts(sortPublicProductsInternal((event as CustomEvent<PublicProduct[]>).detail ?? readPublicProducts()))
    window.addEventListener(PUBLIC_PRODUCTS_EVENT, handleUpdate)
    return () => window.removeEventListener(PUBLIC_PRODUCTS_EVENT, handleUpdate)
  }, [])
  return sortPublicProductsInternal(products)
}
