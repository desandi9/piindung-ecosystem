"use client"

import { CheckCircle2 } from "lucide-react"
import { LandingReveal } from "@/components/piindung/landing-motion"
import { AnimatedStat } from "@/components/piindung/impact/animated-stat"
import { caseStudyVisuals } from "@/components/piindung/impact/impact-mockups"
import { caseStudies } from "@/lib/impact-page-data"
import { cn } from "@/lib/utils"

const glowClasses = ["bg-[#6ee7b7]/25", "bg-[#5eead4]/22", "bg-emerald-400/20", "bg-[#6ee7b7]/22"]

export function ImpactCaseStudies() {
  return (
    <section className="bg-[#f8fbf9] px-5 py-20 dark:bg-[#07131f] sm:px-8 sm:py-24" aria-labelledby="impact-case-studies-heading">
      <div className="mx-auto max-w-[1180px]">
        <LandingReveal className="mx-auto max-w-[720px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Studi Kasus</p>
          <h2 id="impact-case-studies-heading" className="mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)] font-bold leading-tight tracking-[-.045em] text-[#08213b] dark:text-white">
            Bagaimana PIINDUNG bekerja pada setiap tahap pelayanan
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-7 text-[#6c7a89] dark:text-slate-300">
            Empat gambaran alur kerja yang menunjukkan bagaimana data bergerak dari pencatatan hingga pelaporan.
          </p>
        </LandingReveal>

        <div className="mt-16 divide-y divide-[#d9e5df] dark:divide-white/10">
          {caseStudies.map((study) => {
            const Visual = caseStudyVisuals[study.visual]
            const isEven = study.index % 2 === 0
            const glow = glowClasses[(study.index - 1) % glowClasses.length]

            return (
              <article key={study.slug} className="py-16 first:pt-0 last:pb-0 sm:py-20">
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <LandingReveal direction={isEven ? "right" : "left"} className={cn(isEven ? "lg:order-2" : "lg:order-1")}>
                    <div className="flex items-center gap-4">
                      <span className="text-6xl font-bold leading-none tracking-[-.06em] text-[#08213b]/[.07] dark:text-white/[.07]">
                        {String(study.index).padStart(2, "0")}
                      </span>
                      <span className="h-px flex-1 bg-[#d9e5df] dark:bg-white/10" aria-hidden="true" />
                      <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#07965d]">Studi Kasus {study.index}</span>
                    </div>

                    <h3 className="mt-5 text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold leading-tight tracking-[-.03em] text-[#08213b] dark:text-white">
                      {study.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-8 text-[#6c7a89] dark:text-slate-300">{study.narrative}</p>

                    <div className="mt-7 grid grid-cols-2 gap-4 rounded-[18px] border border-[#d9e5df] bg-white p-5 dark:border-white/10 dark:bg-white/[.03]">
                      {study.metrics.map((metric) => (
                        <div key={metric.id}>
                          <AnimatedStat
                            value={metric.value}
                            prefix={metric.prefix}
                            suffix={metric.suffix}
                            decimals={metric.decimals}
                            className="block text-xl font-bold leading-none tracking-[-.02em] text-[#08213b] dark:text-white"
                          />
                          <p className="mt-1.5 text-xs leading-5 text-[#87948c] dark:text-slate-400">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-[#9aa6af] dark:text-slate-500">Ilustrasi tampilan — menunggu integrasi data operasional resmi.</p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {study.benefits.map((benefit) => (
                        <div key={benefit.title} className="rounded-[16px] border border-[#d9e5df] bg-white p-4 dark:border-white/10 dark:bg-white/[.03]">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <p className="mt-3 text-sm font-semibold text-[#08213b] dark:text-white">{benefit.title}</p>
                          <p className="mt-1 text-xs leading-6 text-[#6c7a89] dark:text-slate-300">{benefit.description}</p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-6 border-l-2 border-[#07965d] pl-4 text-sm italic leading-7 text-[#6c7a89] dark:text-slate-300">{study.conclusion}</p>
                  </LandingReveal>

                  <LandingReveal
                    direction={isEven ? "left" : "right"}
                    className={cn("relative", isEven ? "lg:order-1" : "lg:order-2")}
                  >
                    <div className={cn("pointer-events-none absolute -inset-6 -z-10 rounded-[32px] blur-[70px]", glow)} aria-hidden="true" />
                    <Visual />
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
