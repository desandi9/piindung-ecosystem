import type { Metadata } from "next"
import { ProductsExplorer } from "@/components/piindung/products-explorer"
import { PublicPageHeader, PublicPageShell } from "@/components/piindung/public-page-shell"

export const metadata: Metadata = { title: "Produk | PIINDUNG", description: "Katalog produk digital dalam ekosistem PIINDUNG NU Care–LAZISNU Garut." }

export default function ProductsPage() {
  return <PublicPageShell><PublicPageHeader index="01" eyebrow="EKOSISTEM PRODUK" title={<>Perangkat digital untuk setiap <span className="text-[#07965d]">kebutuhan pelayanan.</span></>} description="Produk PIINDUNG tumbuh dari kebutuhan nyata di lapangan—sederhana digunakan, mudah dipantau, dan tetap selaras dengan tata kelola organisasi." /><ProductsExplorer /></PublicPageShell>
}
