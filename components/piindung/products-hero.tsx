"use client"

import { motion, useReducedMotion } from "motion/react"

export function ProductsHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: React.ReactNode
  description: string
}) {
  const reduced = useReducedMotion()

  return (
    <section className="relative isolate overflow-hidden bg-[#f8fbf9] pt-32 pb-16 dark:bg-[#07131f] sm:pt-40 sm:pb-20 lg:pt-48 lg:pb-24" aria-labelledby="products-hero-heading">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(8,33,59,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(8,33,59,.035)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-20" />
      <div className="hero-soft-blob hero-soft-blob-one" aria-hidden="true" />
      <div className="hero-soft-blob hero-soft-blob-two" aria-hidden="true" />
      <div className="hero-soft-blob hero-soft-blob-three" aria-hidden="true" />

      <div className="relative mx-auto max-w-[860px] px-5 text-center sm:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center rounded-full border border-[#bfe8d5] bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[.2em] text-[#078f61] shadow-sm dark:border-white/10 dark:bg-white/5">
            {eyebrow}
          </div>
          <h1
            id="products-hero-heading"
            className="mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] font-bold leading-[1.08] tracking-[-.045em] text-[#08213b] dark:text-white"
          >
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-[620px] text-[15px] leading-[1.85] text-[#6c7a89] dark:text-slate-300 sm:text-base">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
