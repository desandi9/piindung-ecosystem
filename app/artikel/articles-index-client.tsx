"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, ImageIcon, Newspaper, Search } from "lucide-react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { calmEase } from "@/components/piindung/landing-motion"
import type { Article } from "@/lib/article-content"
import { articleMeta } from "@/lib/sample-articles"
import { cn } from "@/lib/utils"

type Filter = "semua" | "berita" | "artikel"

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "semua", label: "Semua" },
  { id: "berita", label: "Berita" },
  { id: "artikel", label: "Artikel" },
]

function date(article: Article) {
  return article.publishedAt ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(article.publishedAt)) : "Tanpa tanggal"
}
function href(article: Article) { return `/artikel/${encodeURIComponent(article.slug)}` }

function Cover({ article, badge }: { article: Article; badge?: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e7f7ef] dark:bg-[#102536]">
      {article.coverImage ? (
        <Image src={article.coverImage} alt={`Cover ${article.title}`} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width:1024px) 60vw,100vw" />
      ) : (
        <div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-[#07965d]" /></div>
      )}
      <span className="absolute left-5 top-5 rounded-lg bg-white/90 px-3 py-2 text-[9px] font-bold uppercase tracking-[.12em] text-[#07965d] shadow-sm backdrop-blur">{badge ?? "PIINDUNG"}</span>
    </div>
  )
}

/** Per-card reveal — same motion language as the product cards: each card animates
 * individually on viewport entry; delay cycles per grid column so rows cascade. */
function articleCardReveal(reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 1, y: 0, scale: 1 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } } }
  }
  return {
    hidden: { opacity: 0, y: 48, scale: 0.96 },
    visible: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: calmEase, delay: (i % 3) * 0.12 } }),
  }
}

function heroReveal(reduced: boolean, delay = 0): Variants {
  if (reduced) {
    return { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
  }
  return {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: calmEase, delay } },
  }
}

export function ArticlesIndexClient({ articles }: { articles: Article[] }) {
  const reduced = useReducedMotion()
  const [filter, setFilter] = useState<Filter>("semua")
  const [query, setQuery] = useState("")

  const ordered = useMemo(() => [...articles].sort((a, b) => Date.parse(b.publishedAt ?? b.updatedAt) - Date.parse(a.publishedAt ?? a.updatedAt)), [articles])
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(() => ordered.filter((article) => {
    if (filter !== "semua" && article.contentType !== filter) return false
    if (!normalizedQuery) return true
    const meta = articleMeta(article)
    return `${article.title} ${article.excerpt} ${meta.category} ${article.authorName}`.toLowerCase().includes(normalizedQuery)
  }), [ordered, filter, normalizedQuery])

  const featured = filtered.find((item) => item.featured) ?? filtered[0]
  const rest = filtered.filter((item) => item.id !== featured?.id)
  const cardVariants = articleCardReveal(!!reduced)

  if (!ordered.length) return <div className="mx-auto max-w-[1040px] px-5 pb-24 text-center text-[#6c7a89] sm:px-8">Belum ada artikel yang diterbitkan.</div>

  return (
    <div className="mx-auto max-w-[1040px] px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-12">
      <motion.div
        variants={heroReveal(!!reduced)}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 border-b border-[#dce8e2] pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
      >
        <div className="flex items-center gap-2" role="group" aria-label="Filter jenis konten">
          {FILTERS.map((item) => {
            const active = filter === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.1em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]",
                  active ? "bg-[#08213b] text-white shadow-[0_10px_24px_rgba(8,33,59,.22)] dark:bg-white dark:text-[#08213b]" : "border border-[#dce8e2] bg-white text-[#6c7a89] hover:border-[#07965d]/45 hover:text-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d] dark:text-slate-300",
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        <label className="flex h-11 w-full items-center gap-2.5 rounded-full border border-[#dce8e2] bg-white px-4 transition focus-within:border-[#07965d]/45 focus-within:ring-4 focus-within:ring-[#07965d]/10 sm:w-[270px] dark:border-white/10 dark:bg-[#0d1e2d]">
          <Search className="h-4 w-4 shrink-0 text-[#07965d]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari berita atau artikel"
            aria-label="Cari berita atau artikel"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#08213b] outline-none placeholder:text-[#a0ada7] dark:text-white dark:placeholder:text-slate-400"
          />
        </label>
      </motion.div>

      {!featured ? (
        <div className="mt-16 rounded-[24px] border border-[#dce8e2] bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-[#0d1e2d]">
          <Newspaper className="mx-auto h-8 w-8 text-[#07965d]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold tracking-[-.035em] text-[#08213b] dark:text-white">Tidak ada hasil yang cocok</h2>
          <p className="mt-2 text-sm leading-7 text-[#6c7a89] dark:text-slate-300">Coba kata kunci lain, atau tampilkan kembali semua publikasi.</p>
          <button type="button" onClick={() => { setQuery(""); setFilter("semua") }} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#07965d] px-6 text-sm font-semibold text-white transition hover:bg-[#08a969] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2">Tampilkan Semua</button>
        </div>
      ) : (
        <div key={`${filter}-${normalizedQuery}`}>
          <motion.div variants={heroReveal(!!reduced, 0.08)} initial="hidden" animate="visible" className="mt-8">
            <Link href={href(featured)} className="group grid overflow-hidden rounded-[28px] border border-[#dce8e2] bg-white shadow-[0_20px_60px_rgba(9,43,32,.09)] transition-shadow duration-300 hover:shadow-[0_26px_70px_rgba(9,43,32,.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d] lg:grid-cols-[1.16fr_.84fr]">
              <div className="min-h-[300px] lg:min-h-[470px]"><Cover article={featured} badge={featured.contentType === "berita" ? "Berita Utama" : "Sorotan"} /></div>
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#07965d]">{articleMeta(featured).category} <span className="mx-1 text-[#a0ada7]">·</span> {date(featured)}</p>
                <h2 className="mt-5 text-[clamp(2rem,3.5vw,3.2rem)] font-bold leading-[1.08] tracking-[-.055em] text-[#08213b] transition group-hover:text-[#07965d] dark:text-white">{featured.title}</h2>
                <p className="mt-5 line-clamp-4 text-sm leading-8 text-[#6c7a89] dark:text-slate-300">{featured.excerpt}</p>
                <p className="mt-6 text-xs font-semibold text-[#6c7a89] dark:text-slate-400">{featured.authorName} · {articleMeta(featured).readMinutes} menit baca</p>
                <strong className="mt-4 inline-flex items-center gap-2 text-sm text-[#07965d]">Baca selengkapnya <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></strong>
              </div>
            </Link>
          </motion.div>

          {rest.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((article, index) => {
                const meta = articleMeta(article)
                return (
                  <motion.div
                    key={article.id}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={reduced ? undefined : { y: -6 }}
                    transition={{ duration: 0.38, ease: calmEase }}
                    style={{ animation: "none" }}
                  >
                    <Link href={href(article)} className="group flex h-full min-h-[420px] flex-col overflow-hidden rounded-[24px] border border-[#dce8e2] bg-white shadow-[0_12px_32px_rgba(9,43,32,.055)] transition duration-300 hover:border-[#07965d]/45 hover:shadow-[0_16px_38px_rgba(9,43,32,.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d]">
                      <div className="aspect-[16/10]"><Cover article={article} badge={article.contentType === "berita" ? "Berita" : "Artikel"} /></div>
                      <div className="flex flex-1 flex-col p-6">
                        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#07965d]">{meta.category} · {date(article)} · {meta.readMinutes} menit</p>
                        <h2 className="mt-4 line-clamp-3 text-xl font-bold leading-7 tracking-[-.035em] text-[#08213b] transition group-hover:text-[#07965d] dark:text-white">{article.title}</h2>
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6c7a89] dark:text-slate-300">{article.excerpt}</p>
                        <strong className="mt-auto inline-flex items-center gap-2 pt-5 text-sm text-[#07965d]">Baca selengkapnya <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></strong>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
