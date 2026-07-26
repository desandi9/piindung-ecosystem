"use client"

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react"

export function LandingScrollProgress() {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 32, restDelta: 0.001 })

  if (reduced) return null

  return <motion.div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-gradient-to-r from-[#07965d] to-[#62d79e]" style={{ scaleX }} />
}
