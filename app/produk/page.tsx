import { Poppins } from "next/font/google"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"
import { ProductsExplorer } from "@/components/piindung/products-explorer"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export default function ProductsPage() {
  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />
        <header className="px-4 pb-2 pt-32 text-center sm:px-6 sm:pt-36 lg:px-8 lg:pt-40">
          <div className="mx-auto max-w-[820px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PRODUK DIGITAL PIINDUNG</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[60px]">Ekosistem Solusi Digital</h1>
            <p className="mt-6 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg lg:text-xl">Rangkaian produk digital PIINDUNG dirancang untuk mendukung penghimpunan, penyaluran, administrasi, pelayanan, dan pengelolaan organisasi NU Care–LAZISNU Garut dalam satu ekosistem yang terhubung.</p>
          </div>
        </header>
        <ProductsExplorer />
      </main>
      <PublicFooter />
    </div>
  )
}
