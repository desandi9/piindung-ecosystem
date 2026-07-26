"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react"

/** Soft ambient glow that follows the pointer across the landing page. Desktop-only, purely decorative. */
export function CursorGlow() {
  const reduced = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const springX = useSpring(x, { stiffness: 60, damping: 22, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 60, damping: 22, mass: 0.6 })

  useEffect(() => {
    if (reduced) return
    const media = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setEnabled(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [reduced])

  useEffect(() => {
    if (!enabled) return
    const handleMove = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
    }
    window.addEventListener("pointermove", handleMove)
    return () => window.removeEventListener("pointermove", handleMove)
  }, [enabled, x, y])

  if (reduced || !enabled) return null

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[1] h-[560px] w-[560px] rounded-full mix-blend-normal"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        background: "radial-gradient(circle, rgba(24,185,129,.09) 0%, rgba(94,234,212,.05) 42%, transparent 72%)",
      }}
    />
  )
}
