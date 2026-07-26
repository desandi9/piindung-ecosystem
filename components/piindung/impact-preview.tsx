"use client"

import { ClipboardCheck, FileText, GitBranch, MonitorCheck, Sparkles } from "lucide-react"
import { LandingCard, LandingCardGrid, LandingReveal } from "@/components/piindung/landing-motion"

const impacts = [
  { title: "Data Lebih Terpusat", description: "Informasi dari berbagai proses dikelola dalam satu ekosistem.", icon: GitBranch },
  { title: "Proses Lebih Efisien", description: "Mengurangi pekerjaan berulang dan mempercepat alur kerja pengurus.", icon: ClipboardCheck },
  { title: "Monitoring Lebih Mudah", description: "Perkembangan kegiatan dan operasional terlihat secara ringkas.", icon: MonitorCheck },
  { title: "Laporan Lebih Tertata", description: "Rekap data mendukung akuntabilitas dan pertanggungjawaban organisasi.", icon: FileText },
]

export function ImpactPreview() {
  return (
    <section id="dampak" className="scroll-mt-24 bg-[#f8fbf9] py-24 dark:bg-[#07131f] sm:py-32" aria-labelledby="impact-heading">
      <div className="mx-auto grid max-w-[1040px] gap-14 px-5 sm:px-8 lg:grid-cols-[.74fr_1.26fr] lg:gap-20">
        <LandingReveal className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Dampak Digitalisasi</p>
          <h2 id="impact-heading" className="mt-4 text-[clamp(2.55rem,4.3vw,3.8rem)] font-bold leading-[.99] tracking-[-.06em] text-[#08213b] dark:text-white">Kerja lebih tertib.<br /><span className="text-[#07965d]">Dampak lebih terasa.</span></h2>
          <p className="mt-7 text-[15px] leading-8 text-[#6c7a89] dark:text-slate-300">Ketika informasi tersusun dan proses terhubung, pengurus dapat memberi lebih banyak perhatian pada hal yang paling penting: pelayanan kepada umat.</p>
          <div className="mt-8 flex gap-3 rounded-[20px] border border-[#dce8e2] bg-white p-5 shadow-[0_12px_32px_rgba(9,43,32,.06)] dark:border-white/10 dark:bg-[#0d1e2d]">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#07965d]" />
            <p className="text-sm leading-7 text-[#08213b] dark:text-slate-200">Teknologi hadir untuk memperkuat amanah, bukan menggantikan nilai kemanusiaan di dalamnya.</p>
          </div>
        </LandingReveal>
        <LandingCardGrid className="grid gap-5 sm:grid-cols-2" stagger={.08}>
          {impacts.map((impact, index) => {
            const Icon = impact.icon
            return <LandingCard key={impact.title} as="article" className={`min-h-[250px] rounded-[24px] border border-[#dce8e2] bg-white p-7 shadow-[0_16px_42px_rgba(9,43,32,.07)] dark:border-white/10 dark:bg-[#0d1e2d] ${index % 2 ? "sm:translate-y-10" : ""}`}>
              <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-400/10"><Icon className="h-5 w-5" /></span><span className="text-5xl font-bold text-[#08213b]/[.055] dark:text-white/[.055]">{String(index + 1).padStart(2, "0")}</span></div>
              <h3 className="mt-9 text-xl font-bold tracking-[-.035em] text-[#08213b] dark:text-white">{impact.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#6c7a89] dark:text-slate-300">{impact.description}</p>
            </LandingCard>
          })}
        </LandingCardGrid>
      </div>
    </section>
  )
}
