import type { Metadata } from "next"
import { ProductsExplorer } from "@/components/piindung/products-explorer"
import { PublicPageHeader, PublicPageShell } from "@/components/piindung/public-page-shell"

export const metadata: Metadata = {
  title: "Produk | PIINDUNG",
  description: "Katalog produk digital dalam ekosistem PIINDUNG NU Care–LAZISNU Garut.",
}

export default function ProductsPage() {
  return (
    <PublicPageShell>
      <PublicPageHeader
        eyebrow="PRODUK DIGITAL PIINDUNG"
        title="Ekosistem Solusi Digital"
        description="Rangkaian produk digital PIINDUNG dirancang untuk mendukung penghimpunan, penyaluran, administrasi, pelayanan, dan pengelolaan organisasi NU Care–LAZISNU Garut dalam satu ekosistem yang terhubung."
      />
      <ProductsExplorer />
    </PublicPageShell>
  )
}
