"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CircleDashed } from "lucide-react"
import { LandingCard, LandingCardGrid, LandingReveal } from "@/components/piindung/landing-motion"
import { usePublicProducts } from "@/lib/public-products"
import { cn } from "@/lib/utils"

export function PublicProducts() {
  const products = usePublicProducts().filter((product) => product.visible)

  return (
    <section id="produk" className="scroll-mt-24 bg-[#f7faf8] py-24 dark:bg-[#07131f] sm:py-28" aria-labelledby="products-heading">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_.65fr] lg:items-end">
          <LandingReveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07965d]">Produk Digital PIINDUNG</p>
            <h2 id="products-heading" className="mt-4 max-w-[650px] text-[clamp(2.25rem,4vw,3.55rem)] font-bold leading-[1.06] tracking-[-0.055em] text-[#0b2239] dark:text-[#effaf5]">Satu ekosistem, berbagai kebutuhan.</h2>
          </LandingReveal>
          <LandingReveal delay={0.1}><p className="max-w-[420px] text-[15px] leading-7 text-[#64748b] dark:text-[#a5b4c5]">Setiap produk dirancang untuk menyederhanakan pekerjaan, memperjelas alur, dan memperkuat kualitas pelayanan.</p></LandingReveal>
        </div>
        <LandingCardGrid className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3" stagger={0.09} mobileStagger={0.06} delayChildren={0.1}>
          {products.map((product, index) => {
            const clickable = Boolean(product.publicHref)
            const featured = product.featured
            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <span className={cn("grid h-12 w-12 place-items-center rounded-xl", featured ? "bg-white/15" : "bg-[#e6f7ef] dark:bg-emerald-400/10")}>
                    {product.iconUrl ? <Image src={product.iconUrl} alt={`Logo ${product.name}`} width={42} height={42} className="h-8 w-8 object-contain" /> : <span className={cn("text-xs font-bold", featured ? "text-white" : "text-[#07965d]")}>PI</span>}
                  </span>
                  <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", featured ? "bg-white/15 text-white" : product.status === "Aktif" ? "bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300")}>{product.status}</span>
                </div>
                <div className="relative z-10 mt-10">
                  <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", featured ? "text-emerald-100" : "text-[#07965d]")}>{product.category}</p>
                  <h3 className={cn("mt-3 text-[27px] font-bold tracking-[-0.045em]", featured ? "text-white" : "text-[#0b2239] dark:text-white")}>{product.name}</h3>
                  <p className={cn("mt-4 max-w-[310px] text-sm leading-7", featured ? "text-white/75" : "text-[#64748b] dark:text-[#a5b4c5]")}>{product.description}</p>
                </div>
                <span className={cn("relative z-10 mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold", featured ? "text-white" : clickable ? "text-[#07965d]" : "text-slate-500 dark:text-slate-300")}>{clickable ? <>Buka Produk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></> : <><CircleDashed className="h-4 w-4" /> Segera Hadir</>}</span>
                <span className={cn("pointer-events-none absolute bottom-[-22px] right-4 text-[122px] font-bold leading-none tracking-[-0.1em]", featured ? "text-white/10" : "text-[#0b2239]/[.045] dark:text-white/[.045]")}>{String(index + 1).padStart(2, "0")}</span>
              </>
            )

            return (
              <LandingCard key={product.id} as="article" interactive={clickable} className={cn("group relative flex min-h-[390px] flex-col overflow-hidden rounded-[20px] border p-7 shadow-[0_10px_28px_rgba(7,38,28,.07)]", featured ? "border-[#07965d] bg-[linear-gradient(135deg,#07965d,#0a6a4d)]" : "border-[#d9e5df] bg-white dark:border-[#213a49] dark:bg-[#0d1e2d]", featured && "md:col-span-2 lg:col-span-1")}>
                {clickable ? <Link href={product.publicHref} className="absolute inset-0 z-20 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4" aria-label={`Buka produk ${product.name}`} /> : null}
                {content}
              </LandingCard>
            )
          })}
        </LandingCardGrid>
      </div>
    </section>
  )
}
