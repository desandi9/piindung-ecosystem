"use client"

import Link from "next/link"
import { ArrowRight, Check, LogIn, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

const chart = [42, 58, 51, 70, 62, 82]

export function HeroSection() {
  const reduced = useReducedMotion()

  return (
    <section id="beranda" className="relative isolate min-h-[750px] overflow-hidden bg-[#f8fbf9] pt-[86px] text-[#08213b] dark:bg-[#07131f] dark:text-white" aria-labelledby="hero-heading">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(8,33,59,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(8,33,59,.035)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-20" />
      <div className="pointer-events-none absolute -left-24 top-32 h-[360px] w-[360px] rounded-full bg-[#a8f0d1]/30 blur-[110px]" />
      <div className="pointer-events-none absolute right-24 top-36 h-[360px] w-[360px] rounded-full bg-[#b8e7ee]/28 blur-[120px]" />

      <div className="relative mx-auto grid min-h-[664px] max-w-[1040px] items-center px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[47%_53%] lg:px-0 lg:pb-0 lg:pt-4">
        <motion.div initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .65 }} className="relative z-10 lg:pb-3">
          <div className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.20em] text-[#078f61]">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#bfe8d5] bg-white/75 shadow-sm dark:border-white/10 dark:bg-white/5"><Sparkles className="h-3.5 w-3.5" /></span>
            Ekosistem Digital LAZISNU Garut
          </div>

          <h1 id="hero-heading" className="mt-7 max-w-[560px] text-[clamp(3.35rem,5.25vw,4.55rem)] font-bold leading-[.92] tracking-[-.065em]">
            Satu Ekosistem<br />untuk<br />Pelayanan yang<br />
            <span className="bg-gradient-to-r from-[#049961] via-[#13b97a] to-[#55ce91] bg-clip-text text-transparent">Lebih Unggul.</span>
          </h1>

          <p className="mt-7 max-w-[450px] text-[16px] leading-[1.9] text-[#687789] dark:text-slate-300">
            PIINDUNG menyatukan data, proses, dan layanan NU Care–LAZISNU Garut agar kerja pengurus lebih tertib, cepat, dan mudah dipantau.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/produk" className="group inline-flex h-[50px] items-center justify-center gap-3 rounded-[14px] bg-[#08a969] px-6 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(8,169,105,.22)] transition hover:-translate-y-0.5 hover:bg-[#079c61] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08a969] focus-visible:ring-offset-4">
              Jelajahi PIINDUNG <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/login" className="inline-flex h-[50px] items-center justify-center gap-3 rounded-[14px] border border-[#d9e5df] bg-white/80 px-6 text-[13px] font-semibold text-[#08213b] shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white">
              Masuk ke Sistem <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e5f7ef] text-[#08a969] dark:bg-emerald-400/10"><LogIn className="h-3 w-3" /></span>
            </Link>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <span className="flex -space-x-1.5"><i className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f8fbf9] bg-[#08213b] text-[8px] not-italic text-white dark:border-[#07131f]">PC</i><i className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f8fbf9] bg-[#07965d] text-[8px] not-italic text-white dark:border-[#07131f]">UP</i><i className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f8fbf9] bg-[#6d9a55] text-[8px] not-italic text-white dark:border-[#07131f]">PL</i></span>
            <span className="text-[10px] leading-4 text-[#748192] dark:text-slate-400"><strong className="block text-[11px] text-[#08213b] dark:text-white">Dibangun untuk kolaborasi</strong>PC, UPZIS, PLPK, dan seluruh pengurus</span>
          </div>
        </motion.div>

        <motion.div initial={reduced ? false : { opacity: 0, x: 28, scale: .97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: reduced ? 0 : .8, delay: reduced ? 0 : .12 }} className="relative mt-12 hidden h-[510px] lg:block">
          <div className="absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#9fd7c4]/40" />
          <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#9fd7c4]/45" />

          <div className="absolute left-6 top-[70px] w-[690px] overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_32px_85px_rgba(11,55,40,.20)] [transform:rotate(.8deg)] dark:border-white/10 dark:bg-[#0e2030]">
            <div className="flex h-[58px] items-center gap-4 border-b border-[#edf2ef] px-5 dark:border-white/10"><span className="rounded-md bg-[#6bcfa5] px-2.5 py-1.5 text-[8px] font-bold text-white">PIINDUNG</span><span className="ml-auto h-6 w-40 rounded-full bg-[#f0f4f2] dark:bg-white/5" /><span className="grid h-7 w-7 place-items-center rounded-full bg-[#08213b] text-[9px] text-white">A</span></div>
            <div className="flex h-[330px]">
              <aside className="w-[55px] border-r border-[#edf2ef] p-3 dark:border-white/10"><i className="block h-7 rounded-lg bg-[#e5f7ef]" />{Array.from({ length: 4 }).map((_, index) => <i key={index} className="mt-4 block h-3 rounded bg-[#eef3f0] dark:bg-white/5" />)}</aside>
              <div className="flex-1 p-5">
                <div className="flex items-center justify-between"><span><small className="block text-[9px] text-[#9aa6af]">Ringkasan Operasional</small><strong className="text-[13px] text-[#21394e] dark:text-white">Selamat datang kembali</strong></span><span className="rounded-lg bg-[#08a969] px-3 py-2 text-[8px] font-semibold text-white">Lihat laporan</span></div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[['Penghimpunan','Rp 184,2 jt','emerald'],['Munfiq aktif','3.482','blue'],['Laporan','96,4%','amber']].map(([label,value,color]) => <div key={label} className="rounded-xl border border-[#edf2ef] bg-white p-3 shadow-[0_5px_15px_rgba(8,33,59,.035)] dark:border-white/10 dark:bg-white/[.03]"><span className={color === 'emerald' ? 'block h-6 w-6 rounded-lg bg-emerald-100' : color === 'blue' ? 'block h-6 w-6 rounded-lg bg-blue-100' : 'block h-6 w-6 rounded-lg bg-amber-100'} /><small className="mt-2 block text-[8px] text-[#9aa6af]">{label}</small><strong className="text-[12px] text-[#21394e] dark:text-white">{value}</strong></div>)}
                </div>
                <div className="mt-4 grid grid-cols-[1.4fr_.8fr] gap-3">
                  <div className="rounded-xl border border-[#edf2ef] p-3 dark:border-white/10"><small className="text-[8px] font-semibold text-[#21394e] dark:text-white">Tren penghimpunan</small><div className="mt-4 flex h-[82px] items-end gap-3 px-3">{chart.map((height, index) => <i key={index} style={{ height: `${height}%` }} className="flex-1 rounded-t bg-gradient-to-t from-[#05935d] to-[#55d09a]" />)}</div></div>
                  <div className="rounded-xl border border-[#edf2ef] p-3 dark:border-white/10"><small className="text-[8px] font-semibold text-[#21394e] dark:text-white">Aktivitas terbaru</small>{Array.from({ length: 3 }).map((_, index) => <span key={index} className="mt-3 flex items-center gap-2"><i className="h-5 w-5 rounded-full bg-[#e5f7ef]" /><i className="h-2 flex-1 rounded-full bg-[#eef3f0] dark:bg-white/5" /></span>)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-[-28px] top-11 z-20 rounded-xl border border-white/90 bg-white/90 px-4 py-3 text-[9px] font-semibold text-[#21394e] shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#102536]/90 dark:text-white"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#18c483] shadow-[0_0_0_5px_rgba(24,196,131,.13)]" />Sistem terhubung</div>
          <div className="absolute bottom-6 right-[-40px] z-20 flex items-center gap-2 rounded-xl border border-white/90 bg-white/90 px-4 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#102536]/90"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e5f7ef] text-[#08a969]"><Check className="h-4 w-4" /></span><span className="text-[8px] text-[#8b98a4]">Data hari ini<strong className="block text-[9px] text-[#21394e] dark:text-white">Sudah diperbarui</strong></span></div>
        </motion.div>
      </div>
    </section>
  )
}
