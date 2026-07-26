"use client"

import Link from "next/link"
import { ArrowRight, ClipboardCheck, FileText, GitBranch, MonitorCheck } from "lucide-react"
import { LandingCard, LandingReveal } from "@/components/piindung/landing-motion"

const impacts = [
  { title: "Data Lebih Terpusat", description: "Informasi dari berbagai proses dikelola dalam satu ekosistem.", icon: GitBranch },
  { title: "Proses Lebih Efisien", description: "Mengurangi pekerjaan berulang dan mempercepat alur kerja pengurus.", icon: ClipboardCheck },
  { title: "Monitoring Lebih Mudah", description: "Perkembangan kegiatan dan operasional terlihat secara ringkas.", icon: MonitorCheck },
  { title: "Laporan Lebih Tertata", description: "Rekap data mendukung akuntabilitas dan pertanggungjawaban organisasi.", icon: FileText },
]

export function ImpactPreview() {
  return (
    <section id="dampak" className="scroll-mt-24 bg-[#f8fbf9] py-24 dark:bg-[#07131f] sm:py-32" aria-labelledby="impact-heading">
      <div className="mx-auto grid max-w-[1180px] items-start gap-12 px-6 sm:px-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div className="pt-1 lg:sticky lg:top-28 lg:self-start">
          <LandingReveal delay={0} distance={24} duration={0.7}>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Dampak Digitalisasi</p>
          </LandingReveal>
          <LandingReveal delay={0.1} distance={24} duration={0.7}>
            <h2 id="impact-heading" className="mt-4 text-[clamp(2.4rem,4vw,3.65rem)] font-bold leading-[1.03] tracking-[-.06em] text-[#08213b] dark:text-white">Kerja lebih tertib. <span className="text-[#07965d]">Dampak lebih terasa.</span></h2>
          </LandingReveal>
          <LandingReveal delay={0.2} distance={24} duration={0.7}>
            <p className="mt-6 max-w-[460px] text-[15px] leading-8 text-[#6c7a89] dark:text-slate-300">Ketika informasi tersusun dan proses terhubung, pengurus dapat memberi lebih banyak perhatian pada hal yang paling penting: pelayanan kepada umat.</p>
          </LandingReveal>
          <LandingReveal delay={0.3} distance={24} duration={0.7}>
            <div className="mt-7 flex max-w-[460px] gap-3 rounded-[20px] border border-[#dce8e2] bg-white p-5 shadow-[0_10px_28px_rgba(9,43,32,.055)] dark:border-white/10 dark:bg-[#0d1e2d]">
              <p className="text-sm leading-7 text-[#08213b] dark:text-slate-200">Teknologi hadir untuk memperkuat amanah, bukan menggantikan nilai kemanusiaan di dalamnya.</p>
            </div>
          </LandingReveal>
          <LandingReveal delay={0.4} distance={24} duration={0.7}>
            <Link
              href="/dampak"
              className="group mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-[#dce8e2] bg-white px-5 text-sm font-semibold text-[#08213b] shadow-sm transition hover:-translate-y-0.5 hover:border-[#07965d]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#0d1e2d] dark:text-white"
            >
              Lihat Dampak Selengkapnya
              <ArrowRight className="h-4 w-4 text-[#07965d] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </LandingReveal>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {impacts.map((impact, index) => {
            const Icon = impact.icon
            return (
              <LandingCard key={impact.title} as="article" revealIndex={index} revealColumns={2} className="group flex min-h-[250px] flex-col rounded-[24px] border border-[#dce8e2] bg-white p-7 shadow-[0_12px_32px_rgba(9,43,32,.065)] transition-colors duration-300 hover:border-[#07965d]/45 hover:shadow-[0_20px_46px_rgba(9,43,32,.12)] dark:border-white/10 dark:bg-[#0d1e2d]">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e7f7ef] text-[#07965d] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 dark:bg-emerald-400/10"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="text-5xl font-bold leading-none text-[#08213b]/[.055] dark:text-white/[.055]">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-8 min-h-[56px] text-xl font-bold leading-7 tracking-[-.035em] text-[#08213b] dark:text-white">{impact.title}</h3>
                <p className="mt-auto pt-3 text-sm leading-7 text-[#6c7a89] dark:text-slate-300">{impact.description}</p>
              </LandingCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
