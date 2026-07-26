"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { motionEase } from "@/lib/motion"
import { cn } from "@/lib/utils"

export const calmEase = motionEase

export const cardViewport = {
  once: true,
  amount: 0.26,
  margin: "0px 0px -10% 0px",
} as const

export const sectionRevealTransition = { duration: 0.78, ease: calmEase }

export function useIsMobileCardLayout(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [breakpoint])

  return isMobile
}

/** Fine pointer + hover capability — skip lift/tap sticky states on touch. */
export function useCanHoverFine() {
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setCanHover(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return canHover
}

export function cardContainerVariants(stagger = 0.12, delayChildren = 0.12, reduced = false): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
        delayChildren: reduced ? 0 : delayChildren,
      },
    },
  }
}

/** Product / visual impact cards — opacity + y + subtle scale */
export function visualCardReveal(duration = 0.85, reduced = false): Variants {
  if (reduced) {
    return { hidden: { opacity: 1, y: 0, scale: 1 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } } }
  }
  return {
    hidden: { opacity: 0, y: 28, scale: 0.985 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration, ease: calmEase } },
  }
}

/** Article / help / text-first cards — opacity + y only (no scale; images may scale separately) */
export function textCardReveal(duration = 0.88, reduced = false): Variants {
  if (reduced) {
    return { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
  }
  return {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration, ease: calmEase } },
  }
}

export const calmCardHover = { y: -4, scale: 1.01 }
export const calmCardHoverTransition = { duration: 0.32, ease: calmEase }
export const calmCardTap = { scale: 0.992 }
export const calmCardTapTransition = { duration: 0.16, ease: calmEase }

export const articleImageReveal: Variants = {
  hidden: { scale: 1.025, opacity: 0.92 },
  visible: { scale: 1, opacity: 1, transition: { duration: 1, ease: calmEase } },
}

export function LandingReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  amount = 0.26,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "left" | "right" | "none"
  amount?: number
}) {
  const reduced = useReducedMotion()
  const distance = reduced ? 0 : 22
  const initial =
    direction === "left"
      ? { opacity: 0, x: distance }
      : direction === "right"
        ? { opacity: 0, x: -distance }
        : direction === "up"
          ? { opacity: 0, y: distance }
          : { opacity: 0 }

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -10% 0px" }}
      transition={{ duration: reduced ? 0 : 0.78, delay: reduced ? 0 : delay, ease: calmEase }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function LandingCardGrid({
  children,
  className,
  stagger = 0.12,
  mobileStagger,
  delayChildren = 0.12,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  mobileStagger?: number
  delayChildren?: number
}) {
  const reduced = useReducedMotion()
  const isMobile = useIsMobileCardLayout()
  const resolvedStagger = isMobile && mobileStagger != null ? mobileStagger : stagger

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={cardViewport}
      variants={cardContainerVariants(resolvedStagger, delayChildren, !!reduced)}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function LandingCard({
  children,
  className,
  duration = 0.85,
  variant = "visual",
  interactive = false,
  as: Tag = "div",
}: {
  children: React.ReactNode
  className?: string
  duration?: number
  variant?: "visual" | "text"
  /** Only clickable cards get hover lift + tap + pointer cursor */
  interactive?: boolean
  as?: "div" | "article"
}) {
  const reduced = useReducedMotion()
  const canHover = useCanHoverFine()
  const Component = Tag === "article" ? motion.article : motion.div
  const reveal = variant === "text" ? textCardReveal(duration, !!reduced) : visualCardReveal(duration, !!reduced)
  const allowMotionHover = interactive && !reduced && canHover

  return (
    <Component
      variants={reveal}
      whileHover={allowMotionHover ? calmCardHover : undefined}
      whileTap={allowMotionHover ? calmCardTap : undefined}
      transition={calmCardHoverTransition}
      className={cn(className, interactive ? "cursor-pointer" : undefined)}
    >
      {children}
    </Component>
  )
}

export function cardRevealVariants(duration = 0.85, reduced = false, withScale = true): Variants {
  return withScale ? visualCardReveal(duration, reduced) : textCardReveal(duration, reduced)
}

export const LandingStagger = LandingCardGrid
export const landingItemVariants = visualCardReveal(0.85)
