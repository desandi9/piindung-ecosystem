"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, Play } from "lucide-react"
import { fadeLeft, fadeRight } from "@/lib/motion"

const mediaCover = "/HERO%20PIINDUNG.png"

export function ArticlePreview() {
  const reduced = useReducedMotion()
  const leftReveal = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeLeft
  const rightReveal = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeRight

  return (
    <section id="artikel" className="scroll-mt-24 border-y border-[#dde7e2] bg-[#f7faf8] py-16 dark:border-white/10 dark:bg-slate-900/60 sm:py-20" aria-labelledby="articles-heading">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <motion.div variants={leftReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="group relative aspect-video overflow-hidden rounded-[24px] shadow-[0_24px_60px_rgba(7,20,38,0.14)]">
          <Image src={mediaCover} alt="Pratinjau profil ekosistem PIINDUNG" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" sizes="(min-width: 1024px) 50vw, 100vw" />
          <div className="absolute inset-0 bg-[#071426]/45" />
          <span className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-[#15945b] shadow-xl transition-transform group-hover:scale-105" aria-hidden="true"><Play className="ml-1 h-6 w-6 fill-current" /></span>
        </motion.div>
        <motion.div variants={rightReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">WAWASAN DAN INFORMASI</p>
          <h2 id="articles-heading" className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl lg:text-5xl">Lihat Bagaimana<br /><span className="text-[#15945b]">PIINDUNG</span> Bekerja</h2>
          <div className="mt-5 space-y-4 text-base leading-8 text-[#566473] dark:text-slate-300">
            <p>PIINDUNG bukan sekadar aplikasi, tetapi ekosistem digital yang menghubungkan layanan, data, dan proses organisasi dalam satu kesatuan yang lebih tertib dan terintegrasi.</p>
            <p>Konten ini memperlihatkan bagaimana PIINDUNG membantu pengurus bekerja lebih efektif, terarah, dan mudah dipantau.</p>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <span className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white"><Play className="h-4 w-4" aria-hidden="true" /> Tonton Video Profil</span>
            <Link href="/produk" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#dde7e2] bg-white px-5 text-sm font-semibold text-[#0b1f33] transition hover:border-[#15945b]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:bg-white/5 dark:text-white">Lihat Produk PIINDUNG <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
