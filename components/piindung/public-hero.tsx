"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, Play } from "lucide-react"
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react"
import { motionEase } from "@/lib/motion"

const metrics = ["Penghimpunan", "Munfiq aktif", "Laporan"]

type DeviceVisual = { image: string; alt: string }

export function HeroSection() {
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const [deviceVisual, setDeviceVisual] = useState<DeviceVisual | null>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.001 })
  const copyY = useTransform(progress, [0, 1], [0, reduced ? 0 : -52])
  const visualY = useTransform(progress, [0, 1], [0, reduced ? 0 : -24])

  useEffect(() => {
    let mounted = true
    fetch("/api/homepage-content/public")
      .then((response) => response.json())
      .then((data) => {
        if (!mounted || !data?.hero?.image) return
        setDeviceVisual({ image: data.hero.image, alt: data.hero.title || "Visual layanan PIINDUNG" })
      })
      .catch(() => undefined)
    return () => { mounted = false }
  }, [])

  return (
    <section ref={sectionRef} id="beranda" className="relative isolate overflow-hidden bg-[#f7faf8] pb-16 pt-32 dark:bg-[#07131f] sm:pt-36 lg:min-h-[780px] lg:pb-20" aria-labelledby="hero-heading">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(7,150,93,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(7,150,93,0.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      <div className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-emerald-300/25 blur-[100px] dark:bg-emerald-400/10" />
      <div className="pointer-events-none absolute right-0 top-20 h-[430px] w-[430px] rounded-full bg-sky-300/20 blur-[120px] dark:bg-sky-400/10" />
      <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 px-6 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-[72px]">
        <motion.div style={{ y: copyY }} className="relative z-10">
          <motion.p initial={{ opacity: 0, y: reduced ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.55, ease: motionEase }} className="inline-flex items-center gap-2 rounded-xl bg-[#e6f7ef] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300"><span className="grid h-5 w-5 place-items-center rounded-md bg-white shadow-sm dark:bg-white/10">✦</span>Ekosistem Digital LAZISNU Garut</motion.p>
          <h1 id="hero-heading" className="mt-6 max-w-[660px] text-[clamp(3.1rem,5.1vw,4.9rem)] font-bold leading-[0.99] tracking-[-0.065em] text-[#0b2239] dark:text-[#effaf5]">Satu Ekosistem untuk Pelayanan yang <span className="bg-gradient-to-r from-[#06945c] via-[#18b97a] to-[#63c997] bg-clip-text text-transparent">Lebih Unggul.</span></h1>
          <p className="mt-7 max-w-[585px] text-[15px] leading-8 text-[#64748b] dark:text-[#a5b4c5] sm:text-[17px]">PIINDUNG menghubungkan informasi, program, penghimpunan, penyaluran, pelaporan, dan layanan NU Care–LAZISNU Garut dalam satu ekosistem digital.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/produk" className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#07965d] to-[#0eae70] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(7,150,93,0.22)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4">Jelajahi Produk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            <Link href="#cara-kerja" className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#d9e5df] bg-white/80 px-6 text-sm font-semibold text-[#0b2239] shadow-sm transition hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/5 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4"><span className="grid h-5 w-5 place-items-center rounded-full border border-[#15945b] text-[#15945b]"><Play className="ml-px h-3 w-3 fill-current" /></span>Lihat Cara Kerja</Link>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs text-[#64748b] dark:text-[#a5b4c5]"><span className="flex -space-x-2"><i className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f7faf8] bg-[#08213b] text-[9px] not-italic text-white dark:border-[#07131f]">PC</i><i className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f7faf8] bg-[#07965d] text-[9px] not-italic text-white dark:border-[#07131f]">UP</i><i className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f7faf8] bg-[#5e8d46] text-[9px] not-italic text-white dark:border-[#07131f]">PL</i></span><span><strong className="block text-[#0b2239] dark:text-white">Dibangun untuk kolaborasi</strong>PC, UPZIS, PLPK, dan seluruh pengurus</span></div>
        </motion.div>
        <motion.div style={{ y: visualY }} initial={reduced ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0 : 0.9, ease: motionEase, delay: reduced ? 0 : 0.18 }} className="relative hidden min-h-[500px] lg:block" aria-label={deviceVisual?.alt || "Pratinjau dashboard PIINDUNG versi demonstrasi"} data-content-image={deviceVisual?.image}>
          <div className="absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#07965d]/20" /><div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#07965d]/25" />
          <div className="absolute right-0 top-6 z-20 rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-xs font-semibold text-[#0b2239] shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#102536]/90 dark:text-white"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#18b97a] shadow-[0_0_0_5px_rgba(24,185,122,.14)]" />Sistem terhubung</div>
          <div className="absolute bottom-4 right-0 z-20 flex items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#102536]/90"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e6f7ef] text-[#07965d]"><Check className="h-4 w-4" /></span><span className="text-[10px] text-[#64748b] dark:text-slate-300">Data hari ini<strong className="block text-xs text-[#0b2239] dark:text-white">Sudah diperbarui</strong></span></div>
          <div className="absolute left-3 top-16 w-[620px] max-w-[calc(100%-2rem)] overflow-hidden rounded-[24px] border border-white/80 bg-[#f9fcfa] shadow-[0_30px_80px_rgba(5,39,28,.2)] [transform:rotateY(-8deg)_rotateX(2deg)_rotate(1.2deg)] dark:border-white/10">
            <div className="flex h-14 items-center gap-4 border-b border-slate-100 px-5"><span className="rounded-md bg-[#08213b] px-2 py-1 text-[9px] font-bold text-white">PIINDUNG</span><span className="h-7 flex-1 rounded-full bg-slate-100" /><span className="grid h-7 w-7 place-items-center rounded-full bg-[#5e8d46] text-[10px] text-white">A</span></div>
            <div className="flex min-h-[330px]"><aside className="w-14 border-r border-slate-100 p-3"><i className="mb-3 block h-7 rounded-lg bg-[#e6f7ef]" />{Array.from({ length: 4 }).map((_, index) => <i key={index} className="mb-3 block h-5 rounded-md bg-slate-100" />)}</aside><div className="flex-1 p-5"><div className="flex items-center justify-between"><span><small className="block text-[10px] text-slate-400">Ringkasan Operasional · Demo</small><strong className="text-sm text-[#0b2239]">Selamat datang kembali</strong></span><span className="rounded-lg bg-[#e6f7ef] px-2 py-1 text-[9px] font-semibold text-[#07965d]">Lihat laporan</span></div><div className="mt-4 grid grid-cols-3 gap-3">{metrics.map((metric, index) => <div key={metric} className="rounded-xl border border-slate-100 bg-white p-3"><span className="block h-6 w-6 rounded-lg bg-[#e6f7ef]" /><small className="mt-2 block text-[8px] text-slate-400">{metric}</small><strong className="text-[11px] text-[#0b2239]">{index === 0 ? "Data demo" : index === 1 ? "Terhubung" : "Tertib"}</strong></div>)}</div><div className="mt-4 grid grid-cols-[1.35fr_.85fr] gap-3"><div className="rounded-xl border border-slate-100 p-3"><small className="text-[9px] font-semibold text-[#0b2239]">Tren aktivitas</small><div className="mt-5 flex h-24 items-end gap-2">{[38, 52, 46, 72, 65, 90].map((height, index) => <i key={index} style={{ height: `${height}%` }} className="flex-1 rounded-t bg-gradient-to-t from-[#07965d] to-[#66d3a2]" />)}</div></div><div className="rounded-xl border border-slate-100 p-3"><small className="text-[9px] font-semibold text-[#0b2239]">Aktivitas terbaru</small>{Array.from({ length: 3 }).map((_, index) => <span key={index} className="mt-3 flex gap-2"><i className="h-5 w-5 rounded-full bg-[#e6f7ef]" /><i className="h-2 flex-1 rounded bg-slate-100" /></span>)}</div></div></div></div>
          </div>
        </motion.div>
      </div>
      <div className="relative mt-12 overflow-hidden border-y border-[#d9e5df] bg-white/55 py-3 dark:border-white/10 dark:bg-white/[.03] lg:absolute lg:bottom-0 lg:left-0 lg:right-0"><div className="flex min-w-max animate-[marquee_28s_linear_infinite] gap-8 px-8 text-[10px] font-bold uppercase tracking-[0.16em] text-[#07965d] [@media(prefers-reduced-motion:reduce)]:animate-none">{["Terintegrasi", "Amanah", "Transparan", "Efisien", "Mudah Dipantau", "Terintegrasi", "Amanah", "Transparan", "Efisien", "Mudah Dipantau"].map((item, index) => <span key={`${item}-${index}`} className="flex items-center gap-3"><i className="h-1.5 w-1.5 rounded-full bg-[#18b97a]" />{item}</span>)}</div></div>
    </section>
  )
}
