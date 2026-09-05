"use client"

import Link from "next/link"
import { ArrowRight, LogIn } from "lucide-react"
import { LandingReveal } from "@/components/piindung/landing-motion"
import { impactCta } from "@/lib/impact-page-data"

export function ImpactCta() {
  return (
    <section className="relative isolate scroll-mt-[calc(72px+1rem)] overflow-hidden bg-[#062318] px-5 py-20 text-white sm:px-8 sm:py-24 lg:scroll-mt-[calc(78px+1rem)]" aria-labelledby="impact-cta-heading">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#04140d] via-[#0a3626] to-[#062318]" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-[#18b97a]/20 blur-[100px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-[#5eead4]/12 blur-[110px]" aria-hidden="true" />

      <LandingReveal className="relative mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#6ee7b7]">{impactCta.eyebrow}</p>
          <h2 id="impact-cta-heading" className="mt-4 text-[clamp(1.9rem,3.4vw,2.85rem)] font-bold leading-tight tracking-[-.04em]">
            {impactCta.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/75">{impactCta.description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Link
            href={impactCta.primaryHref}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#062318] transition hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#062318]"
          >
            {impactCta.primaryLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href={impactCta.secondaryHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#062318]"
          >
            {impactCta.secondaryLabel}
            <LogIn className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </LandingReveal>
    </section>
  )
}
