"use client"

import { Check } from "lucide-react"
import { LandingReveal } from "@/components/piindung/landing-motion"

export function LandingIntro() {
  return (
    <section className="bg-[#f7faf8] py-16 dark:bg-[#07131f] sm:py-20" aria-labelledby="intro-heading">
      <LandingReveal className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_95%_0,rgba(43,195,132,.25),transparent_32%),linear-gradient(125deg,#071f37,#0b2d42_55%,#0a5440_130%)] px-6 py-12 text-white shadow-[0_24px_70px_rgba(5,39,28,.2)] sm:px-12 sm:py-14 lg:grid lg:grid-cols-[1fr_.85fr] lg:gap-16 lg:px-16">
        <div className="orbit-ring-a pointer-events-none absolute -bottom-44 right-4 h-80 w-80 rounded-full border border-white/10" /><div className="orbit-ring-b pointer-events-none absolute -bottom-28 right-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="orbit-glow-pulse pointer-events-none absolute -top-24 right-[18%] h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />
        <LandingReveal direction="right" className="relative flex gap-5"><span className="text-sm font-bold text-emerald-300">01</span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Tentang PIINDUNG</p><h2 id="intro-heading" className="mt-4 max-w-[560px] text-[clamp(2rem,3.3vw,3.15rem)] font-bold leading-[1.08] tracking-[-0.055em]">Teknologi yang tetap dekat dengan nilai pelayanan.</h2></div></LandingReveal>
        <LandingReveal direction="left" delay={0.1} className="relative mt-8 lg:mt-1"><p className="text-[15px] leading-8 text-white/72">Pusat Instalasi dan Informasi Donasi Unggulan Nahdliyyin Garut adalah ruang kerja digital yang membantu setiap proses berjalan dengan arah, kejelasan, dan tanggung jawab yang sama.</p><div className="mt-7 grid gap-3 text-sm font-medium text-white/90"><span className="flex items-center gap-2 transition-transform duration-300 hover:translate-x-1"><Check className="h-4 w-4 text-emerald-300" />Berbasis kebutuhan lapangan</span><span className="flex items-center gap-2 transition-transform duration-300 hover:translate-x-1"><Check className="h-4 w-4 text-emerald-300" />Bertumbuh bersama organisasi</span></div></LandingReveal>
      </LandingReveal>
    </section>
  )
}
