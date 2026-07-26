"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { usePublicProducts } from "@/lib/public-products"
import { cn } from "@/lib/utils"

const featureMap = [
  ["Pencatatan lapangan", "Validasi berjenjang", "Laporan terpusat"],
  ["Data penerima", "Riwayat pelayanan", "Monitoring program"],
  ["Ringkasan capaian", "Tren operasional", "Informasi terukur"],
]

export function ProductsExplorer() {
  const products = usePublicProducts().filter((item) => item.visible).slice(0, 3)
  return (
    <div className="mx-auto max-w-[1040px] px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="space-y-6">
        {products.map((item,index) => {
          const active = index === 0 || item.featured
          const body = <article className={cn("group relative grid min-h-[330px] overflow-hidden rounded-[28px] border p-7 shadow-[0_18px_55px_rgba(9,43,32,.08)] sm:p-10 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:p-12", active ? "border-[#07965d] bg-[linear-gradient(135deg,#08a969,#087b59)] text-white" : "border-[#dce8e2] bg-white dark:border-white/10 dark:bg-[#0d1e2d]")}>
            <div className="relative z-10">
              <p className={cn("text-[10px] font-bold uppercase tracking-[.20em]",active ? "text-emerald-100" : "text-[#07965d]")}>{item.category}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4"><h2 className={cn("text-4xl font-bold tracking-[-.055em] sm:text-5xl",active ? "text-white" : "text-[#08213b] dark:text-white")}>{item.name}</h2><span className={cn("rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em]",active ? "bg-white/15 text-white" : "bg-[#e7f7ef] text-[#07965d]")}>{active ? "Aktif" : "Dalam Pengembangan"}</span></div>
              <p className={cn("mt-5 max-w-[500px] text-sm leading-8",active ? "text-white/75" : "text-[#6c7a89] dark:text-slate-300")}>{item.description}</p>
              {item.publicHref && <span className={cn("mt-7 inline-flex items-center gap-2 text-sm font-semibold",active ? "text-white" : "text-[#07965d]")}>Buka Produk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>}
            </div>
            <div className={cn("relative z-10 mt-9 rounded-[22px] border p-6 lg:mt-0",active ? "border-white/15 bg-white/10" : "border-[#e3ece7] bg-[#f8fbf9] dark:border-white/10 dark:bg-white/[.03]")}>
              <p className={cn("text-[10px] font-bold uppercase tracking-[.18em]",active ? "text-emerald-100" : "text-[#07965d]")}>Fitur utama</p>
              <ul className="mt-5 space-y-4">{(featureMap[index] ?? featureMap[2]).map(feature => <li key={feature} className={cn("flex items-center gap-3 text-sm font-medium",active ? "text-white" : "text-[#08213b] dark:text-white")}><span className={cn("grid h-7 w-7 place-items-center rounded-full",active ? "bg-white/15" : "bg-[#e7f7ef] text-[#07965d]")}><Check className="h-3.5 w-3.5" /></span>{feature}</li>)}</ul>
              {item.iconUrl && <Image src={item.iconUrl} alt="" width={72} height={72} className="absolute bottom-5 right-5 h-14 w-14 object-contain opacity-20" />}
            </div>
            <span className={cn("pointer-events-none absolute -bottom-9 right-5 text-[180px] font-bold leading-none tracking-[-.12em]",active ? "text-white/[.06]" : "text-[#08213b]/[.035] dark:text-white/[.035]")}>{String(index+1).padStart(2,"0")}</span>
          </article>
          return item.publicHref ? <Link key={item.id} href={item.publicHref} className="block rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4">{body}</Link> : <div key={item.id}>{body}</div>
        })}
      </div>
    </div>
  )
}
