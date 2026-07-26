"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { usePublicProducts } from "@/lib/public-products"
import { cn } from "@/lib/utils"
import { softSpring } from "@/lib/motion"

const displayCategories = ["Tata Kelola", "Penghimpunan", "Penyaluran & Pelayanan", "Informasi & Media"] as const

type Category = "Semua" | (typeof displayCategories)[number]
type Product = {
  id: string
  name: string
  shortName?: string
  category: Exclude<Category, "Semua">
  description: string
  status: string
  logo?: string
  href?: string
  featured?: boolean
}

const categories: Category[] = ["Semua", ...displayCategories]

function ProductCard({ product, index }: { product: Product; index: number }) {
  const reduced = useReducedMotion()

  const card = (
    <motion.article
      initial={reduced ? undefined : { opacity: 0, y: 18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      whileHover={reduced ? undefined : { y: -5, scale: 1.01 }}
      transition={reduced ? undefined : { duration: 0.55, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full min-h-[286px] flex-col rounded-[24px] border border-[#dde7e2] bg-white p-7 shadow-sm dark:border-white/10 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-5">
        <div className="flex h-[68px] min-w-0 items-center justify-start">
          {product.logo ? (
            <motion.div whileHover={reduced ? undefined : { scale: 1.05 }} transition={softSpring}>
              <Image src={product.logo} alt={`Logo ${product.name}`} width={112} height={112} className="max-h-16 w-auto max-w-[150px] object-contain" />
            </motion.div>
          ) : (
            <span className="rounded-2xl border border-dashed border-[#dde7e2] px-3 py-2 text-center text-xs font-medium leading-4 text-[#7b8792] dark:border-white/10 dark:text-slate-400">Logo belum tersedia</span>
          )}
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", product.featured ? "bg-[#e6f7ee] text-[#15945b]" : "bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200")}>{product.status}</span>
      </div>
      <div className="mt-7 border-t border-[#dde7e2] pt-6 dark:border-white/10">
        <h3 className="text-2xl font-bold tracking-tight text-[#0b1f33] dark:text-white">{product.name}</h3>
        <p className="mt-4 text-sm leading-7 text-[#566473] dark:text-slate-300">{product.description}</p>
      </div>
      {product.href ? (
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-[#15945b] transition group-hover:text-[#0b1f33] dark:group-hover:text-emerald-300">
          Buka Produk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-[3px]" aria-hidden="true" />
        </span>
      ) : null}
    </motion.article>
  )

  return product.href ? <Link href={product.href} className="block h-full rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-4">{card}</Link> : <div className="h-full">{card}</div>
}

export function ProductsExplorer() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<Category>("Semua")
  const publicProducts = usePublicProducts()
  const products: Product[] = publicProducts.filter((product) => product.visible).map((product) => ({
    id: product.id,
    name: product.name,
    shortName: product.shortName || undefined,
    category: product.category as Exclude<Category, "Semua">,
    description: product.description,
    status: product.status,
    logo: product.iconUrl || undefined,
    href: product.publicHref || undefined,
    featured: product.featured,
  }))

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = activeCategory === "Semua" || product.category === activeCategory
      const haystack = `${product.name} ${product.shortName ?? ""} ${product.category} ${product.description}`.toLowerCase()
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [activeCategory, query])

  const productSections = useMemo(() => {
    const sectionCategories = activeCategory === "Semua" ? displayCategories : [activeCategory]
    return sectionCategories.map((category) => ({ category, products: filteredProducts.filter((product) => product.category === category) })).filter((section) => section.products.length)
  }, [activeCategory, filteredProducts])

  const resetFilters = () => {
    setQuery("")
    setActiveCategory("Semua")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="mx-auto mt-9 max-w-[900px] sm:mt-10">
        <label htmlFor="product-search" className="sr-only">Cari produk PIINDUNG</label>
        <div className="flex h-16 items-center gap-3 rounded-[20px] border border-[#dde7e2] bg-white px-5 shadow-[0_18px_50px_rgba(7,20,38,0.08)] transition focus-within:border-[#15945b]/45 focus-within:ring-4 focus-within:ring-[#15945b]/10 dark:border-white/10 dark:bg-slate-900">
          <input id="product-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk PIINDUNG" className="min-w-0 flex-1 bg-transparent text-base text-[#0b1f33] outline-none placeholder:text-[#7b8792] dark:text-white dark:placeholder:text-slate-400 sm:text-lg" />
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#15945b] text-white" aria-hidden="true"><Search className="h-5 w-5" /></span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {categories.map((category) => (
          <button key={category} type="button" onClick={() => setActiveCategory(category)} className={cn("h-11 rounded-full border px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-2", activeCategory === category ? "border-[#15945b] bg-[#15945b] text-white shadow-[0_10px_24px_rgba(21,148,91,0.18)]" : "border-[#dde7e2] bg-white text-[#0b1f33] hover:border-[#15945b]/40 hover:bg-[#f7faf8] dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-white/10")}>{category}</button>
        ))}
      </div>

      <div className="mt-12 space-y-12">
        {productSections.map((section) => (
          <section key={section.category} aria-labelledby={`products-${section.category.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`}>
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#dde7e2] pb-4 dark:border-white/10">
              <h2 id={`products-${section.category.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`} className="text-2xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-3xl">{section.category}</h2>
              <span className="text-sm font-medium text-[#7b8792] dark:text-slate-400">{section.products.length} produk</span>
            </div>
            <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
              {section.products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>
          </section>
        ))}
      </div>

      {!filteredProducts.length && (
        <div className="mx-auto mt-12 max-w-xl rounded-[24px] border border-[#dde7e2] bg-white px-6 py-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-2xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Produk tidak ditemukan</h2>
          <p className="mt-3 text-base leading-7 text-[#566473] dark:text-slate-300">Coba gunakan kata kunci atau kategori lain.</p>
          <button type="button" onClick={resetFilters} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#15945b] px-5 text-sm font-semibold text-white transition hover:bg-[#107947] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-2">Reset filter</button>
        </div>
      )}
    </div>
  )
}
