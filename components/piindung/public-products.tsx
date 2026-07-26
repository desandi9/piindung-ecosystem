"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CircleDashed } from "lucide-react"
import { LandingCard, LandingCardGrid, LandingReveal } from "@/components/piindung/landing-motion"
import { usePublicProducts } from "@/lib/public-products"
import { cn } from "@/lib/utils"

export function PublicProducts() {
  const products = usePublicProducts().filter((product) => product.visible).slice(0, 3)

  return (
    <section id="produk" className="scroll-mt-24 bg-[#f8fbf9] py-24 dark:bg-[#07131f] sm:py-32" aria-labelledby="products-heading">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_.68fr] lg:items-end">
          <LandingReveal>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Produk Digital PIINDUNG</p>
            <h2 id="products-heading" className="mt-4 max-w-[620px] text-[clamp(2.55rem,4.5vw,4rem)] font-bold leading-[.98] tracking-[-.06em] text-[#08213b] dark:text-white">Satu ekosistem,<br />berbagai kebutuhan.</h2>
          </LandingReveal>
          <LandingReveal delay={.08}><p className="max-w-[390px] text-[15px] leading-8 text-[#6c7a89] dark:text-slate-300">Setiap produk dirancang untuk menyederhanakan pekerjaan, memperjelas alur, dan memperkuat kualitas pelayanan.</p></LandingReveal>
        </div>

        <LandingCardGrid className="mt-12 grid gap-5 lg:grid-cols-3" stagger={.09}>
          {products.map((item, index) => {
            const active = index === 0 || item.featured
            const clickable = Boolean(item.publicHref)
            return (
              <LandingCard key={item.id} as="article" interactive={clickable} className={cn("group relative flex min-h-[410px] flex-col overflow-hidden rounded-[24px] border p-7 shadow-[0_16px_42px_rgba(9,43,32,.08)]", active ? "border-[#07965d] bg-[linear-gradient(145deg,#08a969,#087b59)] text-white" : "border-[#dce8e2] bg-white dark:border-white/10 dark:bg-[#0d1e2d]")}>
                {clickable && <Link href={item.publicHref} className="absolute inset-0 z-20 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]" aria-label={`Buka informasi ${item.name}`} />}
                <div className="flex items-start justify-between">
                  <span className={cn("grid h-14 w-14 place-items-center rounded-2xl", active ? "bg-white/14" : "bg-[#e7f7ef] dark:bg-emerald-400/10")}>
                    {item.iconUrl ? <Image src={item.iconUrl} alt="" width={40} height={40} className="h-9 w-9 object-contain" /> : <span className={cn("text-xs font-bold", active ? "text-white" : "text-[#07965d]")}>PI</span>}
                  </span>
                  <span className={cn("rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em]", active ? "bg-white/15 text-white" : "bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-400/10")}>{index === 0 ? "Aktif" : "Segera"}</span>
                </div>
                <div className="relative z-10 mt-12">
                  <p className={cn("text-[9px] font-bold uppercase tracking-[.20em]", active ? "text-emerald-100" : "text-[#07965d]")}>{item.category}</p>
                  <h3 className={cn("mt-3 text-[28px] font-bold tracking-[-.045em]", active ? "text-white" : "text-[#08213b] dark:text-white")}>{item.name}</h3>
                  <p className={cn("mt-4 text-sm leading-7", active ? "text-white/75" : "text-[#6c7a89] dark:text-slate-300")}>{item.description}</p>
                </div>
                <span className={cn("relative z-10 mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold", active ? "text-white" : "text-[#07965d]")}>{clickable ? <>Buka Produk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></> : <><CircleDashed className="h-4 w-4" /> Pelajari Produk</>}</span>
                <span className={cn("pointer-events-none absolute -bottom-6 right-3 text-[132px] font-bold leading-none tracking-[-.1em]", active ? "text-white/[.09]" : "text-[#08213b]/[.045] dark:text-white/[.045]")}>{String(index + 1).padStart(2, "0")}</span>
              </LandingCard>
            )
          })}
        </LandingCardGrid>
      </div>
    </section>
  )
}
