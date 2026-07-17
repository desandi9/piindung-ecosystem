import type { Variants } from "motion/react"

export const motionEase = [0.22, 1, 0.36, 1] as const

export const motionTransition = {
  duration: 0.8,
  ease: motionEase,
}

export const softSpring = {
  type: "spring" as const,
  stiffness: 240,
  damping: 30,
  mass: 0.8,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: motionTransition },
}

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: motionTransition },
}

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: motionTransition },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: motionTransition },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: motionEase } },
}

export function getReducedVariants(variants: Variants, reducedMotion: boolean): Variants {
  if (!reducedMotion) return variants

  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
  }
}

export const mobileMenuPanel: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: motionEase } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.28, ease: motionEase } },
}

export const mobileMenuItems: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: motionEase } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.24, ease: motionEase } },
}
