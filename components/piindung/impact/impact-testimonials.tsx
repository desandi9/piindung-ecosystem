"use client"

import { MessageCircleHeart, Quote } from "lucide-react"
import { LandingCard, LandingReveal } from "@/components/piindung/landing-motion"
import { impactTestimonials } from "@/lib/impact-page-data"

export function ImpactTestimonials() {
  const hasTestimonials = impactTestimonials.length > 0

  return (
    <section className="bg-white px-5 py-20 dark:bg-[#07131f] sm:px-8 sm:py-24" aria-labelledby="impact-testimonials-heading">
      <div className="mx-auto max-w-[1180px]">
        <LandingReveal className="mx-auto max-w-[680px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Apa Kata Mereka?</p>
          <h2 id="impact-testimonials-heading" className="mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)] font-bold leading-tight tracking-[-.045em] text-[#08213b] dark:text-white">
            Suara pengurus dan mitra layanan
          </h2>
        </LandingReveal>

        {hasTestimonials ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {impactTestimonials.slice(0, 6).map((testimonial, index) => (
              <LandingCard
                key={testimonial.id}
                as="article"
                revealIndex={index}
                revealColumns={3}
                className="flex h-full flex-col rounded-[20px] border border-[#d9e5df] bg-[#f7faf8] p-6 shadow-[0_10px_28px_rgba(9,43,32,.05)] dark:border-white/10 dark:bg-white/[.035]"
              >
                <Quote className="h-6 w-6 text-[#07965d]/70" aria-hidden="true" />
                <p className="mt-4 text-sm leading-7 text-[#08213b] dark:text-slate-200">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-auto pt-5">
                  <p className="text-sm font-semibold text-[#08213b] dark:text-white">{testimonial.name}</p>
                  <p className="text-xs text-[#87948c] dark:text-slate-400">
                    {testimonial.role} · {testimonial.institution}
                  </p>
                </div>
              </LandingCard>
            ))}
          </div>
        ) : (
          <LandingReveal className="mx-auto mt-12 max-w-[560px] rounded-[22px] border border-dashed border-[#d9e5df] bg-[#f7faf8] p-10 text-center dark:border-white/15 dark:bg-white/[.03]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300">
              <MessageCircleHeart className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-5 text-base font-semibold text-[#08213b] dark:text-white">Testimoni resmi sedang dihimpun</p>
            <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-[#6c7a89] dark:text-slate-300">
              Bagian ini akan menampilkan kutipan dari pengurus dan mitra layanan setelah testimoni resmi tersedia dan diverifikasi.
            </p>
          </LandingReveal>
        )}
      </div>
    </section>
  )
}
