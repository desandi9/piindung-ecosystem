import { LandingReveal } from "@/components/piindung/landing-motion"

/** Artikel & Berita hero — green gradient panel (same treatment as the
 * help-center preview on the landing page), centered layout matching the
 * /produk and /bantuan heroes. */
export function ArticlesHero({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description: string }) {
  return (
    <header className="relative overflow-hidden bg-[linear-gradient(118deg,#0a6b47_0%,#0b4f3a_42%,#08213b_100%)] pb-16 pt-32 text-white shadow-[0_16px_40px_rgba(4,24,18,0.18)] sm:pb-20 sm:pt-40 lg:pb-24 lg:pt-48">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="orbit-glow-pulse pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-emerald-300/10" aria-hidden="true" />
      <div className="orbit-glow-pulse-slow pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-sky-300/10" aria-hidden="true" />

      <div className="relative mx-auto max-w-[860px] px-5 text-center sm:px-8">
        <LandingReveal>
          <div className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[.2em] text-emerald-100 shadow-sm">
            {eyebrow}
          </div>
          <h1 className="mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] font-bold leading-[1.08] tracking-[-.045em] text-white">{title}</h1>
          <p className="mx-auto mt-6 max-w-[620px] text-[15px] leading-[1.85] text-white/80 sm:text-base">{description}</p>
        </LandingReveal>
      </div>
    </header>
  )
}
