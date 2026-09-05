"use client"

import { BarChart3, Building2, MapPin, Users, HandHeart, Package, Calendar, Shield } from "lucide-react"
import { LandingCard, LandingReveal } from "@/components/piindung/landing-motion"
import { AnimatedStat } from "@/components/piindung/impact/animated-stat"
import { impactSummaryNote } from "@/lib/impact-page-data"
import type { ImpactStatSection } from "@/lib/impact-content"

const iconMap = {
  users: Users,
  "hand-heart": HandHeart,
  building: Building2,
  "map-pin": MapPin,
  package: Package,
  chart: BarChart3,
  calendar: Calendar,
  shield: Shield,
}

export function ImpactStats({ content }: { content?: ImpactStatSection }) {
  const eyebrow = content?.eyebrow || "Gambaran Dampak Sistem"
  const title = content?.title || "Skala ekosistem yang terus tumbuh"
  const description = content?.description || impactSummaryNote
  const items = content?.items ?? []

  return (
    <section className="scroll-mt-[calc(72px+1rem)] border-y border-[#d9e5df] bg-white px-5 py-20 dark:border-white/10 dark:bg-[#0a1826] sm:px-8 sm:py-24 lg:scroll-mt-[calc(78px+1rem)]" aria-labelledby="impact-stats-heading">
      <div className="mx-auto max-w-[1180px]">
        <LandingReveal className="mx-auto max-w-[680px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">{eyebrow}</p>
          <h2 id="impact-stats-heading" className="mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)] font-bold leading-tight tracking-[-.045em] text-[#08213b] dark:text-white">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-7 text-[#6c7a89] dark:text-slate-300">{description}</p>
        </LandingReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((stat, index) => {
                const Icon = iconMap[stat.iconKey as keyof typeof iconMap] || BarChart3
                const num = parseFloat(stat.value.replace(/[^0-9.-]/g, ""))
                const displayVal = isNaN(num) ? 0 : num
                const displaySuffix = stat.suffix || stat.value.replace(/[0-9.-]/g, "")

                return (
                  <LandingCard
                    key={stat.id}
                    as="article"
                    revealIndex={index}
                    revealColumns={4}
                    className="flex h-full min-h-[188px] flex-col rounded-[22px] border border-[#d9e5df] bg-[#f7faf8] p-6 shadow-[0_10px_28px_rgba(9,43,32,.05)] dark:border-white/10 dark:bg-white/[.035]"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <AnimatedStat
                      value={displayVal}
                      prefix={stat.prefix}
                      suffix={displaySuffix}
                      className="mt-6 block text-3xl font-bold leading-none tracking-[-.03em] text-[#08213b] dark:text-white"
                    />
                    <p className="mt-2 text-xs text-[#87948c] dark:text-slate-400">{stat.description}</p>
                    <p className="mt-auto pt-3 text-sm font-semibold text-[#6c7a89] dark:text-slate-300">{stat.label}</p>
                  </LandingCard>
                )
              })}
        </div>
      </div>
    </section>
  )
}
