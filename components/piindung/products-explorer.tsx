"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import {
  calmCardHover,
  calmCardHoverTransition,
  calmCardTap,
  calmEase,
  useCanHoverFine,
} from "@/components/piindung/landing-motion"
import { usePublicProducts } from "@/lib/public-products"
import { cn } from "@/lib/utils"

/**
 * Per-card reveal — each card animates individually when it enters the viewport
 * (not container-orchestrated). `custom` carries the index so cards cascade
 * top→bottom with a 0.14s stagger. opacity 0 / y 48 / scale 0.96 → settled.
 * Mirrors the reveal used by the landing-page product grid (public-products.tsx).
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

export function ProductsExplorer() {
  const products = usePublicProducts().filter((item) => item.visible).slice(0, 4)
  const reduced = useReducedMotion()
  const canHover = useCanHoverFine()
  const cardVariants = productCardReveal(!!reduced)

  return (
    <div className="mx-auto max-w-[1040px] px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="space-y-6">
        {products.map((item, index) => {
          const active = index === 0 || item.featured
          const clickable = Boolean(item.publicHref)
          const allowHover = clickable && !reduced && canHover
          const body = (
            <motion.article
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              whileHover={allowHover ? calmCardHover : undefined}
              whileTap={allowHover ? calmCardTap : undefined}
              transition={calmCardHoverTransition}
              style={{ animation: "none" }}
              className={cn(
                "group relative overflow-hidden rounded-[24px] border p-7 shadow-[0_18px_55px_rgba(9,43,32,.08)] transition-shadow duration-300 sm:p-9 lg:p-11",
                clickable && "cursor-pointer",
                active
                  ? "border-[#07965d] bg-[linear-gradient(135deg,#08a969,#087b59)] text-white hover:shadow-[0_24px_56px_rgba(8,169,105,.28)]"
                  : "border-[#dce8e2] bg-white hover:shadow-[0_24px_56px_rgba(9,43,32,.12)] dark:border-white/10 dark:bg-[#0d1e2d]",
              )}
            >
              <div className="relative z-10 max-w-[620px]">
                <p className={cn("text-[10px] font-bold uppercase tracking-[.22em]", active ? "text-emerald-100" : "text-[#07965d]")}>{item.category}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h2 className={cn("text-2xl font-bold tracking-[-.045em] sm:text-[28px]", active ? "text-white" : "text-[#08213b] dark:text-white")}>{item.name}</h2>
                  <span className={cn("rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em]", active ? "bg-white/15 text-white" : "bg-[#e7f7ef] text-[#07965d]")}>{active ? "Aktif" : "Dalam Pengembangan"}</span>
                </div>
                <p className={cn("mt-4 text-sm leading-7 sm:mt-5", active ? "text-white/75" : "text-[#6c7a89] dark:text-slate-300")}>{item.description}</p>
                {item.publicHref && (
                  <span className={cn("mt-6 inline-flex items-center gap-2 text-sm font-semibold sm:mt-7", active ? "text-white" : "text-[#07965d]")}>
                    Buka Produk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </div>
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute -bottom-2 right-5 select-none text-[56px] font-bold leading-none tracking-[-.1em] sm:-bottom-5 sm:right-6 sm:text-[130px]",
                  active ? "text-white/[.07]" : "text-[#08213b]/[.04] dark:text-white/[.04]",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </motion.article>
          )
          return clickable ? (
            <Link key={item.id} href={item.publicHref} className="block rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4">
              {body}
            </Link>
          ) : (
            <div key={item.id}>{body}</div>
          )
        })}
      </div>
    </div>
  )
}
