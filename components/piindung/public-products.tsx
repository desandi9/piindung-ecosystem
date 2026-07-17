"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, CircleDashed } from "lucide-react"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { DEFAULT_INTEGRATED_APPS, type IntegratedApp } from "@/lib/integrated-apps"
import { cn } from "@/lib/utils"

const productDetails: Record<IntegratedApp["id"], { name: string; description: string; status: string; featured?: boolean }> = {
  gorut: { name: "GORUT", description: "Sistem pengelolaan Gerakan Koin NU yang terintegrasi dengan PIINDUNG.", status: "Aktif", featured: true },
  etasyaruf: { name: "E-Tasyaruf", description: "Sistem pencatatan dan pemantauan penyaluran program agar lebih tertib dan terarah.", status: "Segera Hadir" },
  mobisnu: { name: "Mobisnu", description: "Layanan berbasis mobile untuk mendukung kegiatan kemanusiaan dan pelayanan masyarakat.", status: "Segera Hadir" },
  arsip: { name: "Arsip Digital", description: "Pusat penyimpanan dokumen organisasi yang terstruktur, aman, dan mudah ditemukan.", status: "Segera Hadir" },
}

const products = DEFAULT_INTEGRATED_APPS.map((app) => ({ ...app, ...productDetails[app.id] }))

export function PublicProducts() {
  const prefersReducedMotion = useReducedMotion()
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp

  return (
    <section id="produk" className="scroll-mt-24 border-y border-[#dde7e2] bg-[#f7faf8] py-16 dark:border-white/10 dark:bg-slate-900/60 sm:py-20" aria-labelledby="products-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PRODUK DIGITAL PIINDUNG</p>
          <h2 id="products-heading" className="mt-4 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">Produk PIINDUNG</h2>
          <p className="mt-5 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg">Setiap produk PIINDUNG dirancang untuk membantu kebutuhan penghimpunan, penyaluran, administrasi, informasi, dan pelayanan NU Care–LAZISNU Garut.</p>
        </motion.div>
        <motion.div variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {products.map((product) => (
            <motion.article key={product.id} variants={prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem} className={cn("group flex min-h-[300px] flex-col rounded-[22px] border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 dark:bg-slate-950", product.featured ? "border-[#15945b]/40 ring-1 ring-[#15945b]/10" : "border-[#dde7e2] dark:border-white/10")}>
              <div className="flex h-20 items-center justify-center">
                <Image src={product.iconUrl} alt={`Logo ${product.name}`} width={86} height={86} className="max-h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="mt-6 border-t border-[#dde7e2] pt-5 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#0b1f33] dark:text-white">{product.name}</h3>
                  <span className={cn("shrink-0 text-xs font-semibold", product.featured ? "text-[#15945b]" : "text-[#7b8792] dark:text-slate-400")}>{product.status}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{product.description}</p>
              </div>
              {product.featured ? <Link href={product.link} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#15945b] transition hover:text-[#0b1f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b]">Lihat GORUT <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#7b8792] dark:text-slate-400"><CircleDashed className="h-4 w-4" aria-hidden="true" /> Segera Hadir</span>}
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
