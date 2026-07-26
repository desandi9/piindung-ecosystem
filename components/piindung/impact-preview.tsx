"use client"

import { ClipboardCheck, FileText, GitBranch, MonitorCheck, Sparkles } from "lucide-react"
import { LandingCard, LandingCardGrid, LandingReveal } from "@/components/piindung/landing-motion"

const impacts = [
  { title: "Data Lebih Terpusat", description: "Informasi dari berbagai proses dapat dikelola dalam satu ekosistem.", icon: GitBranch },
  { title: "Proses Lebih Efisien", description: "Mengurangi proses berulang dan mempercepat alur kerja pengurus.", icon: ClipboardCheck },
  { title: "Monitoring Lebih Mudah", description: "Pengurus dapat melihat perkembangan kegiatan dan operasional secara lebih ringkas.", icon: MonitorCheck },
  { title: "Laporan Lebih Tertata", description: "Data yang tercatat membantu proses rekap dan pertanggungjawaban organisasi.", icon: FileText },
]

export function ImpactPreview() {
  return (
    <section id="dampak" className="scroll-mt-24 bg-[#f7faf8] py-24 dark:bg-[#07131f] sm:py-32" aria-labelledby="impact-heading"><div className="mx-auto grid max-w-[1180px] gap-14 px-6 sm:px-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20"><LandingReveal className="lg:sticky lg:top-32 lg:self-start"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07965d]">Dampak Digitalisasi</p><h2 id="impact-heading" className="mt-4 text-[clamp(2.25rem,4vw,3.55rem)] font-bold leading-[1.06] tracking-[-0.055em] text-[#0b2239] dark:text-white">Kerja lebih tertib. Dampak lebih terasa.</h2><p className="mt-6 text-[15px] leading-8 text-[#64748b] dark:text-[#a5b4c5]">Ketika informasi tersusun dan proses terhubung, pengurus dapat memberi lebih banyak perhatian pada hal yang paling penting: pelayanan kepada umat.</p><div className="mt-8 flex gap-3 rounded-2xl border border-[#d9e5df] bg-white p-5 shadow-sm dark:border-[#213a49] dark:bg-[#0d1e2d]"><Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#07965d]" /><p className="text-sm leading-7 text-[#0b2239] dark:text-slate-200">Teknologi hadir untuk memperkuat amanah, bukan menggantikan nilai kemanusiaan di dalamnya.</p></div></LandingReveal><LandingCardGrid className="grid gap-4 sm:grid-cols-2" stagger={0.08}>{impacts.map((impact, index) => { const Icon = impact.icon; return <LandingCard key={impact.title} as="article" className={`min-h-[240px] rounded-[20px] border border-[#d9e5df] bg-white p-7 shadow-[0_10px_28px_rgba(7,38,28,.06)] dark:border-[#213a49] dark:bg-[#0d1e2d] ${index % 2 ? "sm:translate-y-8" : ""}`}><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300"><Icon className="h-5 w-5" /></span><span className="text-4xl font-bold text-[#0b2239]/[.06] dark:text-white/[.06]">{String(index + 1).padStart(2, "0")}</span></div><h3 className="mt-8 text-xl font-bold tracking-[-0.03em] text-[#0b2239] dark:text-white">{impact.title}</h3><p className="mt-3 text-sm leading-7 text-[#64748b] dark:text-[#a5b4c5]">{impact.description}</p></LandingCard>})}</LandingCardGrid></div></section>
  )
}
