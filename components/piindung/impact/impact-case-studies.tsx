"use client"

import Image from "next/image"
import { BarChart3, Building2, Calendar, HandHeart, MapPin, Package, Shield, Users } from "lucide-react"
import { LandingReveal } from "@/components/piindung/landing-motion"
import { AnimatedStat } from "@/components/piindung/impact/animated-stat"
import { motion, useReducedMotion } from "motion/react"

function AnimatedSummaryValue({ value, className }: { value: string; className?: string }) {
  const match = value.match(/^(\D*?)([\d.]+)(.*)$/)
  if (!match) return <motion.strong initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className={className}>{value}</motion.strong>
  const numeric = Number(match[2].replace(/\./g, ""))
  return <AnimatedStat value={numeric} prefix={match[1]} suffix={match[3]} duration={1.1} className={className} />
}

function SummaryItem({ children, index }: { children: React.ReactNode; index: number }) {
  const reduced = useReducedMotion()
  return <motion.div initial={{ opacity: 0, y: reduced ? 0 : 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : index * 0.08 }}>{children}</motion.div>
}

import { caseStudyVisuals } from "@/components/piindung/impact/impact-mockups"
import { cn } from "@/lib/utils"
import type { CaseStudyVisualKind } from "@/lib/impact-page-data"
import type { ImpactCaseStudySection } from "@/lib/impact-content"

const glowClasses = ["bg-[#6ee7b7]/25", "bg-[#5eead4]/22", "bg-emerald-400/20", "bg-[#6ee7b7]/22"]
const summaryIconMap = { users: Users, "hand-heart": HandHeart, building: Building2, "map-pin": MapPin, package: Package, chart: BarChart3, calendar: Calendar, shield: Shield }

export function ImpactCaseStudies({ content }: { content?: ImpactCaseStudySection }) {
  const eyebrow = content?.eyebrow || "Studi Kasus"
  const title = content?.title || "Bagaimana PIINDUNG bekerja pada setiap tahap pelayanan"
  const description = content?.description || "Empat gambaran alur kerja yang menunjukkan bagaimana data bergerak dari pencatatan hingga pelaporan."
  const items = content?.items ?? []

  return (
    <section className="scroll-mt-[calc(72px+1rem)] bg-[#f8fbf9] px-5 py-20 dark:bg-[#07131f] sm:px-8 sm:py-24 lg:scroll-mt-[calc(78px+1rem)]" aria-labelledby="impact-case-studies-heading">
      <div className="mx-auto max-w-[1180px]">
        <LandingReveal className="mx-auto max-w-[720px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]"> {eyebrow} </p>
          <h2 id="impact-case-studies-heading" className="mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)] font-bold leading-tight tracking-[-.045em] text-[#08213b] dark:text-white">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-7 text-[#6c7a89] dark:text-slate-300">
            {description}
          </p>
        </LandingReveal>

        <div className="mt-16 divide-y divide-[#d9e5df] dark:divide-white/10">
          {items.map((item, idx) => {
                const index = idx + 1
                const isEven = index % 2 === 0
                const glow = glowClasses[(index - 1) % glowClasses.length]
                const visualKeys: CaseStudyVisualKind[] = ["transaksi", "munfiq", "validasi", "laporan"]
                const Visual = caseStudyVisuals[visualKeys[idx % visualKeys.length]]

                return (
                  <article key={item.id} className="py-16 first:pt-0 last:pb-0 sm:py-20">
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                      <LandingReveal direction={isEven ? "right" : "left"} className={cn(isEven ? "lg:order-2" : "lg:order-1")}>
                        <div className="flex items-center gap-4">
                          <span className="text-6xl font-bold leading-none tracking-[-.06em] text-[#08213b]/[.07] dark:text-white/[.07]">
                            {String(index).padStart(2, "0")}
                          </span>
                          <span className="h-px flex-1 bg-[#d9e5df] dark:bg-white/10" aria-hidden="true" />
                          <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#07965d]">{item.step}</span>
                        </div>

                        <h3 className="mt-5 text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold leading-tight tracking-[-.03em] text-[#08213b] dark:text-white">
                           {item.title}
                        </h3>
                        <p className="mt-4 text-[15px] leading-8 text-[#6c7a89] dark:text-slate-300">{item.description}</p>
                        {item.summaryItems && item.summaryItems.length > 0 && (
                          <div className="mt-7 grid grid-cols-2 gap-4 rounded-[18px] border border-[#d9e5df] bg-white p-5 dark:border-white/10 dark:bg-white/[.03]">
                            {item.summaryItems.filter((summary) => summary.visible).map((summary, summaryIndex) => {
                              const Icon = summaryIconMap[summary.iconKey as keyof typeof summaryIconMap] || BarChart3
                              return (
                                <SummaryItem key={summary.id} index={summaryIndex}>
                                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                                  <AnimatedSummaryValue value={summary.value} className="mt-2 block text-xl font-bold leading-none tracking-[-.02em] text-[#08213b] dark:text-white" />
                                  <p className="mt-1.5 text-xs leading-5 text-[#87948c] dark:text-slate-400">{summary.label}</p>
                                  {summary.status && <span className="mt-1 inline-flex rounded-full bg-[#e6f7ef] px-2 py-0.5 text-[9px] font-bold text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300">{summary.status}</span>}
                                </SummaryItem>
                              )
                            })}
                          </div>
                        )}
                      </LandingReveal>

                      <LandingReveal
                        direction={isEven ? "left" : "right"}
                        className={cn("relative", isEven ? "lg:order-1" : "lg:order-2")}
                      >
                        <div className={cn("pointer-events-none absolute -inset-6 -z-10 rounded-[32px] blur-[70px]", glow)} aria-hidden="true" />
                        {item.image ? (
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] border border-[#d9e5df] bg-white shadow-sm dark:border-white/10 dark:bg-white/[.03]">
                            <Image
                              src={item.image.path}
                              alt={item.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <Visual />
                        )}
                      </LandingReveal>
                    </div>
                  </article>
                )
              })}
        </div>
      </div>
    </section>
  )
}
