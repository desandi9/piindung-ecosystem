"use client"

import { Boxes, FileCheck2, Inbox, Send, ShieldCheck } from "lucide-react"
import { LandingReveal } from "@/components/piindung/landing-motion"

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

const steps = [
  { title: "Data Masuk", description: "Data munfiq dan transaksi dicatat melalui sistem secara terstruktur.", icon: Inbox },
  { title: "Pemeriksaan", description: "Data diperiksa sebelum diteruskan ke tahap berikutnya.", icon: ShieldCheck },
  { title: "Pengelolaan", description: "Informasi dikelola sesuai kebutuhan organisasi.", icon: Boxes },
  { title: "Penyaluran", description: "Program diteruskan secara lebih tertib dan terukur.", icon: Send },
  { title: "Pelaporan", description: "Hasil dirangkum agar mudah dipantau dan dipertanggungjawabkan.", icon: FileCheck2 },
]

export function HowItWorks() {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (reduced) return
    gsap.set(".how-step", { opacity: 0, y: 18 })
    const ctx = gsap.to(".how-step", {
      opacity: 1,
      y: 0,
      stagger: 0.08,
      duration: 0.55,
      ease: "power2.out",
      scrollTrigger: { trigger: ".how-process", start: "top 78%", once: true },
    })
    return () => {
      ctx.scrollTrigger?.kill()
      ctx.kill()
    }
  }, { scope: containerRef, dependencies: [reduced] })

  return (
    <section ref={containerRef} id="cara-kerja" className="scroll-mt-24 bg-[#f1f7f4] py-24 dark:bg-[#102536] sm:py-28" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <LandingReveal className="mx-auto max-w-[800px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07965d]">Cara Kerja PIINDUNG</p>
          <h2 id="how-it-works-heading" className="mt-4 text-[clamp(2.25rem,4vw,3.55rem)] font-bold leading-[1.06] tracking-[-0.055em] text-[#0b2239] dark:text-white">Dari proses lapangan hingga laporan, <span className="text-[#07965d]">semuanya terhubung.</span></h2>
          <p className="mx-auto mt-5 max-w-[680px] text-[15px] leading-7 text-[#64748b] dark:text-[#a5b4c5]">PIINDUNG menghubungkan penghimpunan, pemeriksaan, pengelolaan, penyaluran, dan pelaporan dalam alur yang tertib.</p>
        </LandingReveal>
        <ol className="how-process relative mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 xl:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="how-step group relative flex min-h-[260px] flex-col rounded-[18px] border border-[#d9e5df] bg-white p-6 text-left shadow-[0_8px_22px_rgba(7,38,28,.05)] transition duration-300 hover:-translate-y-1 hover:border-[#07965d]/45 hover:shadow-[0_14px_30px_rgba(7,38,28,.08)] dark:border-[#213a49] dark:bg-[#0d1e2d] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="how-node relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e6f7ef] text-[#07965d] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#d7f5e8] group-hover:shadow-[0_0_20px_rgba(7,150,93,.16)] dark:bg-emerald-400/10 dark:text-emerald-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="pt-1 text-xs font-semibold tracking-[0.14em] text-[#8a968e] dark:text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-8 text-[18px] font-semibold tracking-[-.025em] text-[#0b2239] dark:text-white">{step.title}</h3>
                <p className="mt-3 line-clamp-4 text-[14px] leading-6 text-[#64748b] dark:text-[#a5b4c5]">{step.description}</p>
                {index < steps.length - 1 ? <span className="absolute right-[-12px] top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-[#d9e5df] bg-white text-xs text-[#07965d] shadow-sm transition-transform duration-300 group-hover:translate-x-1 xl:grid dark:border-[#213a49] dark:bg-[#0d1e2d]" aria-hidden="true">→</span> : null}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
