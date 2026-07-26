"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CircleDashed } from "lucide-react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import {
  calmCardHover,
  calmCardHoverTransition,
  calmCardTap,
  calmEase,
  LandingReveal,
  useCanHoverFine,
} from "@/components/piindung/landing-motion"
import { usePublicProducts } from "@/lib/public-products"
import { cn } from "@/lib/utils"

/**
 * Per-card reveal — each card animates individually when it enters the viewport
 * (not container-orchestrated). `custom` carries the index so cards cascade
 * left→right with a 0.14s stagger. opacity 0 / y 48 / scale 0.96 → settled.
 */
function productCardReveal(reduced: boolean): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 1, y: 0, scale: 1 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } },
    }
  }
  return {
    hidden: { opacity: 0, y: 48, scale: 0.96 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: calmEase, delay: i * 0.14 },
    }),
  }
}

export function PublicProducts() {
  const products = usePublicProducts().filter((product) => product.visible).slice(0, 4)
  const reduced = useReducedMotion()
  const canHover = useCanHoverFine()
  const cardVariants = productCardReveal(!!reduced)

  return (
    <section id="produk" className="scroll-mt-24 bg-[#f8fbf9] py-24 dark:bg-[#07131f] sm:py-32" aria-labelledby="products-heading">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_.68fr] lg:items-end">
          <div>
            <LandingReveal delay={0} distance={24} duration={0.7}>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Produk Digital PIINDUNG</p>
            </LandingReveal>
            <LandingReveal delay={0.08} distance={24} duration={0.7}>
              <h2 id="products-heading" className="mt-4 max-w-[620px] text-[clamp(2.55rem,4.5vw,4rem)] font-bold leading-[.98] tracking-[-.06em] text-[#08213b] dark:text-white">Satu ekosistem,<br />berbagai kebutuhan.</h2>
            </LandingReveal>
          </div>
          <LandingReveal delay={0.16} distance={24} duration={0.7}><p className="max-w-[390px] text-[15px] leading-8 text-[#6c7a89] dark:text-slate-300">Setiap produk dirancang untuk menyederhanakan pekerjaan, memperjelas alur, dan memperkuat kualitas pelayanan.</p></LandingReveal>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {products.map((item, index) => {
            const active = index === 0 || item.featured
            const clickable = Boolean(item.publicHref)
            const allowHover = clickable && !reduced && canHover
            return (
              <motion.article
                key={item.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover={allowHover ? calmCardHover : undefined}
                whileTap={allowHover ? calmCardTap : undefined}
                transition={calmCardHoverTransition}
                style={{ animation: "none" }}
                className={cn("group relative flex min-h-[300px] flex-col overflow-hidden rounded-[24px] border p-5 shadow-[0_16px_42px_rgba(9,43,32,.08)] transition-shadow duration-300 sm:min-h-[410px] sm:p-7", clickable && "cursor-pointer", active ? "border-[#07965d] bg-[linear-gradient(145deg,#08a969,#087b59)] text-white hover:shadow-[0_24px_56px_rgba(8,169,105,.32)]" : "border-[#dce8e2] bg-white hover:shadow-[0_24px_56px_rgba(9,43,32,.14)] dark:border-white/10 dark:bg-[#0d1e2d]")}>
                {clickable && <Link href={item.publicHref} className="absolute inset-0 z-20 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]" aria-label={`Buka informasi ${item.name}`} />}
                {active && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.16)_50%,transparent_65%)] transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                )}
                <div className="flex items-start justify-between">
                  <span className={cn("grid h-11 w-11 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 sm:h-14 sm:w-14", active ? "bg-white/14" : "bg-[#e7f7ef] dark:bg-emerald-400/10")}>
                    {item.iconUrl ? <Image src={item.iconUrl} alt="" width={40} height={40} className="h-7 w-7 object-contain sm:h-9 sm:w-9" /> : <span className={cn("text-xs font-bold", active ? "text-white" : "text-[#07965d]")}>PI</span>}
                  </span>
                  <span className={cn("rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em]", active ? "bg-white/15 text-white" : "bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-400/10")}>{index === 0 ? "Aktif" : "Segera"}</span>
                </div>
                <div className="relative z-10 mt-6 sm:mt-12">
                  <p className={cn("text-[9px] font-bold uppercase tracking-[.22em]", active ? "text-emerald-100" : "text-[#07965d]")}>{item.category}</p>
                  <h3 className={cn("mt-3 text-xl font-bold tracking-[-.045em] sm:text-[28px]", active ? "text-white" : "text-[#08213b] dark:text-white")}>{item.name}</h3>
                  <p className={cn("mt-2 text-sm leading-7 sm:mt-4", active ? "text-white/75" : "text-[#6c7a89] dark:text-slate-300")}>{item.description}</p>
                </div>
                <span className={cn("relative z-10 mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold sm:pt-8", active ? "text-white" : "text-[#07965d]")}>{clickable ? <>Buka Produk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></> : <><CircleDashed className="h-4 w-4" /> Pelajari Produk</>}</span>
                <span className={cn("pointer-events-none absolute -bottom-6 right-3 text-[80px] font-bold leading-none tracking-[-.1em] sm:text-[132px]", active ? "text-white/[.09]" : "text-[#08213b]/[.045] dark:text-white/[.045]")}>{String(index + 1).padStart(2, "0")}</span>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
