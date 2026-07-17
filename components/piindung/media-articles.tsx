"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { staggerContainer, staggerItem } from "@/lib/motion"

const mediaCover = "/HERO%20PIINDUNG.png"

const articles = [
  {
    category: "Berita",
    date: "14 Mei 2026",
    title: "NU Care Lazisnu Kab. Garut Luncurkan Ekosistem Digital PIINDUNG",
  },
  {
    category: "Berita",
    date: "10 Mei 2026",
    title: "Digitalisasi Layanan untuk Pengelolaan Organisasi yang Lebih Tertib",
  },
  {
    category: "Artikel",
    date: "7 Mei 2026",
    title: "Mengenal Peran Data dalam Ekosistem Digital PIINDUNG",
  },
]

export function MediaArticles() {
  const reduced = useReducedMotion()

  return (
    <section className="border-t border-[#dde7e2] bg-white py-16 dark:border-white/10 dark:bg-slate-950 sm:py-20" aria-labelledby="media-articles-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 id="media-articles-heading" className="mt-4 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">Liputan Media &amp; Artikel</h2>
          </div>
          <Link href="/informasi" className="hidden items-center gap-2 text-sm font-semibold text-[#15945b] transition hover:text-[#0b1f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] sm:inline-flex dark:hover:text-emerald-300">Lihat Semua <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <motion.div variants={reduced ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <motion.article key={article.title} variants={reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem} className="group overflow-hidden rounded-[20px] border border-[#dde7e2] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#071426]">
                <Image src={mediaCover} alt="" fill className="object-cover opacity-75 transition-transform duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 33vw, 100vw" aria-hidden="true" />
                <div className="absolute inset-0 bg-[#071426]/30" aria-hidden="true" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#15945b]">{article.category} <span className="mx-1 text-[#a0ada7]">|</span> {article.date}</p>
                <h3 className="mt-3 line-clamp-3 text-lg font-semibold leading-7 text-[#0b1f33] dark:text-white">{article.title}</h3>
              </div>
            </motion.article>
          ))}
        </motion.div>
        <Link href="/informasi" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#15945b] sm:hidden">Lihat Semua <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </section>
  )
}
