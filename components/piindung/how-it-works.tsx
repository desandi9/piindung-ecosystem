"use client"

import { Boxes, FileCheck2, Inbox, Send, ShieldCheck } from "lucide-react"
import { LandingCard, LandingCardGrid, LandingReveal } from "@/components/piindung/landing-motion"

const steps = [
  { title: "Data Masuk", description: "Informasi dicatat langsung dari proses lapangan.", icon: Inbox },
  { title: "Pemeriksaan", description: "Data diperiksa sebelum diteruskan ke tahap berikutnya.", icon: ShieldCheck },
  { title: "Pengelolaan", description: "Informasi dikelola sesuai kebutuhan organisasi.", icon: Boxes },
  { title: "Penyaluran", description: "Program diteruskan secara lebih tertib dan terukur.", icon: Send },
  { title: "Pelaporan", description: "Hasil dirangkum agar mudah dipantau dan dipertanggungjawabkan.", icon: FileCheck2 },
]

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-24 bg-[#f1f7f4] py-24 dark:bg-[#102536] sm:py-28" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <LandingReveal className="mx-auto max-w-[900px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#07965d]">Cara Kerja PIINDUNG</p>
          <h2 id="how-it-works-heading" className="mt-4 text-[clamp(2.4rem,4.5vw,4rem)] font-bold leading-[1.03] tracking-[-0.06em] text-[#0b2239] dark:text-white">Dari proses lapangan hingga<br className="hidden sm:block" /> laporan, <span className="text-[#07965d]">semuanya terhubung.</span></h2>
          <p className="mx-auto mt-6 max-w-[760px] text-[15px] leading-7 text-[#64748b] dark:text-[#a5b4c5]">PIINDUNG menghubungkan penghimpunan, pemeriksaan, pengelolaan, penyaluran, dan pelaporan dalam alur yang tertib.</p>
        </LandingReveal>

        <LandingCardGrid className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-5" stagger={0.08}>
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <LandingCard key={step.title} as="article" interactive className="group relative min-h-[330px] rounded-[24px] border border-[#d9e5df] bg-white p-7 text-left shadow-[0_18px_42px_rgba(9,43,32,.07)] transition-colors hover:border-[#83cdb0] dark:border-white/10 dark:bg-[#0d1e2d]">
                <span className="absolute right-6 top-5 text-[11px] font-bold tracking-[.16em] text-[#bbc3c8]">{String(index + 1).padStart(2, "0")}</span>
                <span className="grid h-[62px] w-[62px] place-items-center rounded-[20px] border border-[#d5e5de] bg-[#e7f7ef] text-[#07965d] transition group-hover:bg-[#daf4e7] group-hover:shadow-[0_8px_24px_rgba(7,150,93,.14)] dark:border-white/10 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-10 text-[20px] font-medium tracking-[-.035em] text-[#0b2239] dark:text-white">{step.title}</h3>
                <p className="mt-5 text-[14px] leading-7 text-[#64748b] dark:text-[#a5b4c5]">{step.description}</p>
                {index < steps.length - 1 ? <span className="absolute -right-[16px] top-[66px] z-10 hidden h-8 w-8 place-items-center rounded-full border border-[#d9e5df] bg-white text-sm text-[#07965d] shadow-sm xl:grid dark:border-white/10 dark:bg-[#0d1e2d]">→</span> : null}
              </LandingCard>
            )
          })}
        </LandingCardGrid>
      </div>
    </section>
  )
}
