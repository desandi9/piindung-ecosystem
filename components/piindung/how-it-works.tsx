"use client"

import { motion, useReducedMotion } from "motion/react"
import { Boxes, FileCheck2, Inbox, Send, ShieldCheck } from "lucide-react"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    title: "Data Masuk",
    description: "Informasi dicatat dari proses lapangan.",
    icon: Inbox,
  },
  {
    title: "Pemeriksaan",
    description: "Data diperiksa sebelum diteruskan.",
    icon: ShieldCheck,
  },
  {
    title: "Pengelolaan",
    description: "Informasi dikelola sesuai kebutuhan.",
    icon: Boxes,
  },
  {
    title: "Penyaluran",
    description: "Program diteruskan secara lebih tertib.",
    icon: Send,
  },
  {
    title: "Pelaporan",
    description: "Hasil dirangkum agar mudah dipantau.",
    icon: FileCheck2,
  },
]

export function HowItWorks() {
  const reduced = useReducedMotion()
  const reveal = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp

  return (
    <section id="cara-kerja" className="scroll-mt-24 bg-white py-16 dark:bg-slate-950 sm:py-20" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">CARA KERJA PIINDUNG</p>
          <h2 id="how-it-works-heading" className="mt-4 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">
            Dari Proses Lapangan hingga Laporan, Semuanya Bisa Terhubung.
          </h2>
          <p className="mt-5 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg">
            PIINDUNG membantu menghubungkan proses penghimpunan, pemeriksaan, pengelolaan, penyaluran, dan pelaporan dalam alur yang lebih tertib dan mudah dipantau.
          </p>
        </motion.div>

        <motion.ol variants={reduced ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="mt-12 grid gap-5 md:grid-cols-5 md:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon
              return (
              <motion.li key={step.title} variants={reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem} className="group relative flex md:block">

                {index < steps.length - 1 ? <div className="absolute left-6 top-12 h-[calc(100%+1.25rem)] w-px bg-[#dde7e2] dark:bg-white/10 md:left-[calc(50%+2rem)] md:top-7 md:h-px md:w-[calc(100%-2.5rem)]" aria-hidden="true" /> : null}
                <Card className="relative z-10 h-full w-full gap-0 rounded-[22px] border border-[#dde7e2] bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="mb-5 flex items-center gap-3 md:flex-col md:items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b] transition-transform duration-500 group-hover:scale-110 dark:bg-emerald-300/10 dark:text-emerald-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-[#0b1f33] dark:text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.li>
            )
          })}
        </motion.ol>
      </div>
    </section>
  )
}
