"use client"

import { ClipboardCheck, FileText, GitBranch, MonitorCheck } from "lucide-react"
import { LandingCard, LandingReveal } from "@/components/piindung/landing-motion"
import { impactHighlights } from "@/lib/impact-page-data"

const icons = [GitBranch, ClipboardCheck, MonitorCheck, FileText]

export function ImpactHighlights() {
  return (
    <section className="bg-[#f1f7f4] px-5 py-20 dark:bg-[#0a1826] sm:px-8 sm:py-24" aria-labelledby="impact-highlights-heading">
      <div className="mx-auto max-w-[1180px]">
        <LandingReveal className="mx-auto max-w-[680px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Ringkasan Dampak Utama</p>
          <h2 id="impact-highlights-heading" className="mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)] font-bold leading-tight tracking-[-.045em] text-[#08213b] dark:text-white">
            Empat perubahan yang terasa di setiap studi kasus
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-7 text-[#6c7a89] dark:text-slate-300">
            Merangkum benang merah dari seluruh studi kasus di atas, sederhana namun konsisten.
          </p>
        </LandingReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {impactHighlights.map((impact, index) => {
            const Icon = icons[index % icons.length]
            return (
              <LandingCard
                key={impact.title}
                as="article"
                revealIndex={index}
                revealColumns={2}
                className="flex min-h-[220px] flex-col rounded-[20px] border border-[#d9e5df] bg-white p-7 shadow-[0_10px_28px_rgba(9,43,32,.05)] transition duration-300 hover:-translate-y-1.5 hover:border-[#07965d]/45 hover:shadow-[0_16px_36px_rgba(9,43,32,.08)] dark:border-white/10 dark:bg-[#0d1e2d]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-4xl font-bold leading-none text-[#08213b]/[.06] dark:text-white/[.06]">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-7 text-lg font-bold leading-6 tracking-[-.025em] text-[#08213b] dark:text-white">{impact.title}</h3>
                <p className="mt-auto pt-3 text-sm leading-6 text-[#6c7a89] dark:text-slate-300">{impact.description}</p>
              </LandingCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
