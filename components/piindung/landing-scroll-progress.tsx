"use client"

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react"

export function LandingScrollProgress() {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 32, restDelta: 0.001 })
  const dotLeft = useTransform(scaleX, (value) => `${value * 100}%`)

  if (reduced) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <motion.div className="h-full origin-left bg-gradient-to-r from-[#07965d] to-[#62d79e]" style={{ scaleX }} />
      <motion.div
        className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#62d79e] shadow-[0_0_10px_3px_rgba(98,215,158,.65)]"
        style={{ left: dotLeft, x: "-50%" }}
      />
    </div>
  )
}
