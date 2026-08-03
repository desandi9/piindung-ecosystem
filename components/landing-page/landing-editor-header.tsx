"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { ArrowLeft, Sparkles } from "lucide-react"
import { motionEase } from "@/lib/motion"

export function LandingEditorHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref = "/dashboard/landing-page",
}: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  backHref?: string
}) {
  const reduced = useReducedMotion()
  const reveal: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: reduced ? { duration: 0 } : { duration: 0.6, ease: motionEase } },
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={reveal}
      className="relative overflow-hidden rounded-[28px] border border-[#dce8e2]/90 bg-gradient-to-br from-white via-[#f8fbf9] to-[#e7f7ef]/60 p-6 shadow-[0_18px_44px_rgba(9,43,32,0.07)] backdrop-blur-sm dark:border-white/10 dark:from-[#0d1e2d] dark:via-[#0d1e2d] dark:to-emerald-500/10 sm:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-teal-200/35 blur-3xl dark:bg-teal-500/10" />
      </div>
      <div className="relative">
        <Link
          href={backHref}
          className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#6c7a89] transition-colors hover:text-[#07965d] dark:text-slate-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f7ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {eyebrow}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#08213b] dark:text-white sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 max-w-3xl text-base leading-8 text-[#6c7a89] dark:text-slate-300">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </motion.section>
  )
}
