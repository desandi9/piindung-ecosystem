"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { motionEase } from "@/lib/motion"
import { getHomepageHeroContent, useHomepageContent } from "@/lib/homepage-content"

const heroVisual = "/background-hero.png"

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()
  const [isDesktop, setIsDesktop] = useState(false)
  const heroContent = getHomepageHeroContent(useHomepageContent())
  const textTransition = { duration: prefersReducedMotion ? 0 : 0.75, ease: motionEase }

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const update = () => setIsDesktop(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return (
    <section className="relative w-full overflow-x-clip bg-[#f7faf8] pb-20 dark:bg-slate-950 lg:min-h-[780px] lg:pb-0">
      <motion.div initial={prefersReducedMotion ? { opacity: 0.85 } : { opacity: 0, scale: 1.05 }} animate={{ opacity: 0.85, scale: 1 }} transition={{ duration: prefersReducedMotion ? 0 : 2, ease: "easeOut" }} className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <Image
          src={heroVisual}
          alt="Background ekosistem digital PIINDUNG"
          width={1920}
          height={1080}
          priority
          className="h-full w-full max-w-none object-cover object-center"
        />
      </motion.div>
      <motion.div initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 45, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: prefersReducedMotion ? 0 : isDesktop ? 1.2 : 0.95, ease: motionEase, delay: prefersReducedMotion ? 0 : isDesktop ? 0.75 : 0.58 }} className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-full lg:block">
        <Image src={heroContent?.image || "/image-hero.png"} alt={heroContent?.title || "Tampilan layanan digital PIINDUNG"} width={1435} height={773} priority className="absolute bottom-0 right-0 h-auto w-full max-w-none object-contain object-right-bottom" />
      </motion.div>
      <div className="relative z-20 mx-auto max-w-7xl px-4 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-[104px]">
        <div className="relative isolate overflow-x-clip md:px-8 lg:px-10">

          <div className="pointer-events-none absolute right-[2%] top-[18%] -z-20 h-[300px] w-[320px] rounded-full bg-[#15945b]/12 blur-[95px]" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-4%] right-[-4%] -z-20 h-[280px] w-[360px] rounded-full bg-sky-200/24 blur-[105px] dark:bg-sky-500/10" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[4%] right-[16%] -z-20 h-[180px] w-[220px] rounded-full bg-amber-100/38 blur-[80px] dark:bg-amber-300/10" aria-hidden="true" />

          <div className="relative z-20 flex flex-col justify-center lg:min-h-[620px] lg:w-[50%]">
            <motion.p initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: motionEase, delay: prefersReducedMotion ? 0 : 0.1 }} className="w-fit rounded-full bg-[#15945b]/10 px-4 py-2 text-sm font-medium text-[#15945b]">
              {heroContent?.subtitle || "PIINDUNG — Ekosistem Digital NU Care Lazisnu Garut"}
            </motion.p>
            <h1 className="mt-6 text-[2.5rem] font-bold leading-[1.06] tracking-[-0.03em] text-[#0b1f33] dark:text-white sm:text-[3.15rem] md:text-[3.35rem] lg:text-[3.8rem] xl:text-[4rem]">
              {(heroContent?.title || "Satu\nEkosistem untuk\nPelayanan yang\nLebih Unggul").split("\n").map((line, index, lines) => (
                <motion.span key={line} initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.85, ease: motionEase, delay: prefersReducedMotion ? 0 : 0.18 + index * 0.13 }} className={index >= Math.max(lines.length - 2, 1) ? "block text-[#15945b]" : "block"}>{line}</motion.span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...textTransition, delay: prefersReducedMotion ? 0 : 0.52 }} className="mt-8 max-w-[560px] text-lg font-normal leading-[1.65] text-[#566473] dark:text-slate-300 lg:text-[1.18rem]">
              {heroContent?.description || "PIINDUNG menghubungkan informasi, program, penghimpunan, penyaluran, pelaporan, dan layanan NU Care–LAZISNU Garut dalam satu ekosistem digital."}
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1, delayChildren: prefersReducedMotion ? 0 : 0.82 } }, hidden: {} }} className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <motion.div variants={{ hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 }, visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.65, ease: motionEase } } }} whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }} className="w-full sm:w-auto">
<Link href={heroContent?.link || "/produk"} className="group inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#15945b] px-7 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(21,148,91,0.22)] transition hover:bg-[#107947] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-4 sm:w-auto">
                   {heroContent?.buttonText || "Jelajahi Produk"}

                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px]" aria-hidden="true" />
                </Link>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 }, visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.65, ease: motionEase } } }} whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }} className="w-full sm:w-auto">
                <Link href="/login" className="group inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-[#dde7e2] bg-white/90 px-7 text-sm font-semibold text-[#0b1f33] shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-4 dark:border-white/15 dark:bg-white/10 dark:text-white sm:w-auto">
                  Masuk Sistem
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px]" aria-hidden="true" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
