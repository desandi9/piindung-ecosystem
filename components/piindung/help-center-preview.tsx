"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { Poppins } from "next/font/google"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] })

export function HelpCenterPreview() {
  const reduced = useReducedMotion()

  return (
    <section id="bantuan" className={`scroll-mt-24 min-h-[320px] text-white sm:min-h-[340px] ${poppins.className}`} aria-labelledby="help-heading">
      <div
        className="relative isolate flex min-h-[320px] items-center overflow-hidden sm:min-h-[340px]"
        style={{
          backgroundImage: "url('/BACKGROUND.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
        }}
      >
        <motion.div variants={reduced ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-8 lg:px-8 lg:py-20">
          <motion.div variants={reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem} className="max-w-[520px]">
            <h2 id="help-heading" className="text-[2.5rem] font-bold leading-[1.1] tracking-normal sm:text-5xl lg:text-[60px]">Butuh Bantuan?</h2>
            <p className="mt-[20px] text-[17px] font-normal leading-[1.5] text-white/92 sm:text-lg lg:text-[20px]">Temukan panduan penggunaan, jawaban atas<br className="hidden lg:block"/>pertanyaan umum, serta informasi bantuan untuk<br className="hidden lg:block"/>setiap produk PIINDUNG.</p>
          </motion.div>
          <motion.div variants={reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem} className="flex flex-col gap-[15px] sm:flex-row lg:justify-end">
            <Link href="/bantuan" className="inline-flex h-[56px] items-center justify-center gap-[12px] rounded-2xl bg-white px-8 text-[15px] font-semibold text-[#071426] shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">Pusat Bantuan <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" /></Link>
            <Link href="/kontak" className="inline-flex h-[56px] items-center justify-center gap-[12px] rounded-2xl border border-white bg-transparent px-8 text-[15px] font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">Hubungi Kami <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" /></Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
