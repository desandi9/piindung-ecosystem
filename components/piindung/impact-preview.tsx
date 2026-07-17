"use client"

import { motion, useReducedMotion } from "motion/react"
import { ClipboardCheck, FileText, GitBranch, MonitorCheck } from "lucide-react"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { Card, CardContent } from "@/components/ui/card"

const impacts = [
  {
    title: "Data Lebih Terpusat",
    description: "Informasi dari berbagai proses dapat dikelola dalam satu ekosistem.",
    icon: GitBranch,
  },
  {
    title: "Proses Lebih Efisien",
    description: "Mengurangi proses berulang dan mempercepat alur kerja pengurus.",
    icon: ClipboardCheck,
  },
  {
    title: "Monitoring Lebih Mudah",
    description: "Pengurus dapat melihat perkembangan kegiatan dan operasional secara lebih ringkas.",
    icon: MonitorCheck,
  },
  {
    title: "Laporan Lebih Tertata",
    description: "Data yang tercatat membantu proses rekap dan pertanggungjawaban organisasi.",
    icon: FileText,
  },
]

export function ImpactPreview() {
  const reduced = useReducedMotion()
  const reveal = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp

  return (
    <section id="dampak" className="scroll-mt-24 border-y border-slate-200/80 bg-[#f8fbff] py-16 dark:border-white/10 dark:bg-slate-900/60 sm:py-20" aria-labelledby="impact-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">DAMPAK DIGITALISASI</p>
            <h2 id="impact-heading" className="mt-4 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">
              Teknologi yang Membantu Pelayanan Lebih Tertib.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg">
              PIINDUNG dikembangkan untuk membantu pengurus bekerja lebih terarah, mengurangi proses berulang, dan menyediakan informasi yang lebih mudah dipahami.
            </p>
          </motion.div>

          <motion.div variants={reduced ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="grid gap-5 sm:grid-cols-2">
            {impacts.map((impact, index) => {
              const Icon = impact.icon

              return (
                <motion.div key={impact.title} variants={reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem} className="h-full">
                <Card className="group h-full gap-0 rounded-[22px] border border-[#dde7e2] bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-950">
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b] transition-transform duration-500 group-hover:scale-110 dark:bg-emerald-300/10 dark:text-emerald-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0b1f33] dark:text-white">{impact.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{impact.description}</p>
                  </CardContent>
                </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
