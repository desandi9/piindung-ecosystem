"use client"

import { useRef } from "react"
import { useReducedMotion } from "motion/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Boxes, FileCheck2, Inbox, Send, ShieldCheck } from "lucide-react"
import { LandingReveal } from "@/components/piindung/landing-motion"

gsap.registerPlugin(ScrollTrigger)

const steps = [
  { title: "Data Masuk", description: "Informasi dicatat dari proses lapangan.", icon: Inbox },
  { title: "Pemeriksaan", description: "Data diperiksa sebelum diteruskan.", icon: ShieldCheck },
  { title: "Pengelolaan", description: "Informasi dikelola sesuai kebutuhan.", icon: Boxes },
  { title: "Penyaluran", description: "Program diteruskan secara lebih tertib.", icon: Send },
  { title: "Pelaporan", description: "Hasil dirangkum agar mudah dipantau.", icon: FileCheck2 },
]

export function HowItWorks() {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (reduced) return
    const mm = gsap.matchMedia()
    mm.add("(min-width: 768px)", () => {
      gsap.set(".how-line", { scaleX: 0, transformOrigin: "left center" })
      gsap.set(".how-step", { opacity: 0.56, y: 18 })
      gsap.set(".how-node", { scale: 0.82 })
      gsap.timeline({ scrollTrigger: { trigger: ".how-process", start: "top 70%", end: "bottom 58%", scrub: 0.7 } })
        .to(".how-line", { scaleX: 1, ease: "none", duration: 1 })
        .to(".how-step", { opacity: 1, y: 0, stagger: 0.12, duration: 0.56, ease: "power2.out" }, 0.05)
        .to(".how-node", { scale: 1, stagger: 0.12, duration: 0.42, ease: "power2.out" }, 0.08)
    })
    mm.add("(max-width: 767px)", () => {
      gsap.set(".how-line", { scaleY: 0, transformOrigin: "top center" })
      gsap.set(".how-step", { opacity: 0.72, x: 12 })
      gsap.timeline({ scrollTrigger: { trigger: ".how-process", start: "top 78%", end: "bottom 70%", scrub: 0.8 } })
        .to(".how-line", { scaleY: 1, ease: "none", duration: 1 })
        .to(".how-step", { opacity: 1, x: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }, 0.06)
    })
    return () => mm.revert()
  }, { scope: containerRef, dependencies: [reduced] })

  return (
    <section ref={containerRef} id="cara-kerja" className="scroll-mt-24 bg-[#f1f7f4] py-24 dark:bg-[#102536] sm:py-28" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <LandingReveal className="mx-auto max-w-[800px] text-center"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07965d]">Cara Kerja PIINDUNG</p><h2 id="how-it-works-heading" className="mt-4 text-[clamp(2.25rem,4vw,3.55rem)] font-bold leading-[1.06] tracking-[-0.055em] text-[#0b2239] dark:text-white">Dari proses lapangan hingga laporan, <span className="text-[#07965d]">semuanya terhubung.</span></h2><p className="mx-auto mt-5 max-w-[680px] text-[15px] leading-7 text-[#64748b] dark:text-[#a5b4c5]">PIINDUNG menghubungkan penghimpunan, pemeriksaan, pengelolaan, penyaluran, dan pelaporan dalam alur yang tertib.</p></LandingReveal>
        <ol className="how-process relative mt-14 grid gap-7 md:grid-cols-5 md:gap-4">
          <span className="pointer-events-none absolute left-[27px] top-[27px] h-[calc(100%-54px)] w-px bg-[#d9e5df] dark:bg-[#213a49] md:left-[10%] md:right-[10%] md:top-[59px] md:h-px md:w-auto" aria-hidden="true" /><span className="how-line pointer-events-none absolute left-[27px] top-[27px] h-[calc(100%-54px)] w-px bg-gradient-to-b from-[#07965d] to-[#63c997] md:left-[10%] md:right-[10%] md:top-[59px] md:h-px md:w-auto md:bg-gradient-to-r" aria-hidden="true" />
          {steps.map((step, index) => { const Icon = step.icon; return <li key={step.title} className="how-step relative grid grid-cols-[54px_1fr] gap-5 md:block md:text-center"><div className="how-node relative z-10 grid h-[54px] w-[54px] place-items-center rounded-2xl bg-[#e6f7ef] text-[#07965d] ring-[8px] ring-[#f1f7f4] dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-[#102536]"><Icon className="h-5 w-5" /></div><div className="pt-1 md:pt-8"><span className="text-[10px] font-bold tracking-[0.18em] text-[#07965d]">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 text-base font-bold text-[#0b2239] dark:text-white">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#64748b] dark:text-[#a5b4c5]">{step.description}</p></div>{index < steps.length - 1 ? <span className="absolute right-[-21px] top-[46px] z-10 hidden h-6 w-6 place-items-center rounded-full border border-[#d9e5df] bg-white text-xs text-[#07965d] md:grid dark:border-[#213a49] dark:bg-[#0d1e2d]">→</span> : null}</li> })}
        </ol>
      </div>
    </section>
  )
}
