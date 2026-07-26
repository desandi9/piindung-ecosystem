"use client"

import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { LandingReveal } from "@/components/piindung/landing-motion"

export function HelpCenterPreview() {
  return (
    <section
      id="bantuan"
      className="scroll-mt-24 bg-[#f7faf8] py-10 dark:bg-[#07131f] sm:py-12"
      aria-labelledby="help-heading"
    >
      <LandingReveal className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[28px] bg-[linear-gradient(118deg,#0a6b47_0%,#0b4f3a_42%,#08213b_100%)] px-6 py-10 text-white shadow-[0_16px_40px_rgba(4,24,18,0.18)] sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10 lg:px-12 lg:py-12">
        <div className="orbit-glow-pulse pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-emerald-300/10" aria-hidden="true" />
        <div className="orbit-glow-pulse-slow pointer-events-none absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-sky-300/10" aria-hidden="true" />

        <div className="relative max-w-[620px]">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/25 bg-white/10 text-white transition-transform duration-300 hover:scale-110 hover:rotate-6">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
            Pusat Bantuan
          </p>
          <h2
            id="help-heading"
            className="mt-3 text-[clamp(1.9rem,3.4vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.045em] text-white"
          >
            Butuh panduan? Kami siap membantu.
          </h2>
          <p className="mt-4 max-w-[540px] text-[15px] leading-7 text-white/90">
            Temukan panduan penggunaan, jawaban atas pertanyaan umum, dan informasi bantuan untuk setiap produk PIINDUNG.
          </p>
        </div>

        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col xl:flex-row">
          <Link
            href="/bantuan"
            className="group inline-flex h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-[#08213b] shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b4f3a]"
          >
            Buka Pusat Bantuan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href="/kontak"
            className="inline-flex h-[48px] items-center justify-center gap-2 rounded-2xl border-2 border-white bg-transparent px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b4f3a]"
          >
            Hubungi Kami
          </Link>
        </div>
      </LandingReveal>
    </section>
  )
}
