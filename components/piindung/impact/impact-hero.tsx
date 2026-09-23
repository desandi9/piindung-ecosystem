"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react"
import { impactHero } from "@/lib/impact-page-data"
import { FeaturedDashboardMockup, FeaturedMobileMockup } from "@/components/piindung/impact/impact-mockups"

export function ImpactHero() {
  const reduced = useReducedMotion()
  const [canTilt, setCanTilt] = useState(false)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { stiffness: 130, damping: 24, mass: 0.5 })
  const springY = useSpring(pointerY, { stiffness: 130, damping: 24, mass: 0.5 })
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, -1])
  const rotateX = useTransform(springY, [-0.5, 0.5], [2, -1])
  const glowX = useTransform(springX, [-0.5, 0.5], [38, 62])
  const glowY = useTransform(springY, [-0.5, 0.5], [30, 58])
  const glowBackground = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(24,185,122,.12), transparent 38%)`)

  useEffect(() => {
    if (reduced) {
      setCanTilt(false)
      return
    }
    const media = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setCanTilt(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [reduced])

  return (
    <section className="relative isolate scroll-mt-[calc(72px+1rem)] overflow-hidden bg-[#f8fbf9] pt-[calc(72px+2.75rem)] pb-20 dark:bg-[#07131f] sm:pt-[calc(72px+3.75rem)] sm:pb-24 lg:scroll-mt-[calc(78px+1rem)] lg:pt-[calc(78px+4.5rem)] lg:pb-28" aria-labelledby="impact-hero-heading">
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
            {impactHero.eyebrow}
          </div>
          <h1
            id="impact-hero-heading"
            className="mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] font-bold leading-[1.08] tracking-[-.045em] text-[#08213b] dark:text-white"
          >
            {impactHero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-[620px] text-[15px] leading-[1.85] text-[#6c7a89] dark:text-slate-300 sm:text-base">
            {impactHero.description}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.85, delay: reduced ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-14 max-w-[980px] px-5 pb-16 sm:px-8 sm:pb-20 lg:mt-16"
        onPointerMove={(event) => {
          if (!canTilt) return
          const rect = event.currentTarget.getBoundingClientRect()
          pointerX.set((event.clientX - rect.left) / rect.width - 0.5)
          pointerY.set((event.clientY - rect.top) / rect.height - 0.5)
        }}
        onPointerLeave={() => {
          pointerX.set(0)
          pointerY.set(0)
        }}
      >
        <div className="pointer-events-none absolute -right-8 top-4 hidden h-44 w-44 rounded-full bg-[#6ee7b7]/25 blur-[80px] sm:block" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-10 bottom-6 hidden h-48 w-48 rounded-full bg-[#5eead4]/20 blur-[90px] sm:block" aria-hidden="true" />

        <div className="dashboard-float-wrapper">
          <motion.div
            className="relative [transform-style:preserve-3d]"
            style={{ rotateX: canTilt ? rotateX : 1, rotateY: canTilt ? rotateY : -2, transformPerspective: 1400 }}
          >
            <motion.div className="pointer-events-none absolute inset-0 z-10 rounded-[22px]" style={{ background: glowBackground }} />
            <FeaturedDashboardMockup />
          </motion.div>
        </div>

        <div className="relative mt-4 flex justify-center sm:absolute sm:-bottom-4 sm:left-6 sm:mt-0 sm:block sm:justify-start">
          <div className="hero-float-badge">
            <FeaturedMobileMockup />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
