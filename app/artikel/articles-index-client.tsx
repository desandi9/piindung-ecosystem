"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ImageIcon, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { Article, ArticleContentType } from "@/lib/article-content"

const pageSize = 6
type Filter = "Semua" | ArticleContentType

function labelType(type: ArticleContentType) {
  return type === "berita" ? "Berita" : "Artikel"
}

function articleDate(article: Article) {
  return article.publishedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(article.publishedAt)) : "Tanpa tanggal"
}

function contentHref(article: Article) {
  return `/artikel/${encodeURIComponent(article.slug)}`
}

function ArticleMeta({ article }: { article: Article }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#15945b]">{labelType(article.contentType)} <span className="mx-1 text-[#a0ada7]">|</span> {articleDate(article)}</p>
}

function ArticleImage({ article, className, priority = false }: { article: Article; className?: string; priority?: boolean }) {
  return <div className="relative h-full w-full bg-[#e8f3ee] dark:bg-slate-800">{article.coverImage ? <Image src={article.coverImage} alt={`Cover artikel ${article.title}`} fill priority={priority} className={cn("object-cover", className)} sizes="(min-width: 1024px) 33vw, 100vw" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-[#15945b]/70" aria-hidden="true" /></div>}</div>
}

export function ArticlesIndexClient({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("Semua")
  const [page, setPage] = useState(1)
  const filters = useMemo<Filter[]>(() => ["Semua", ...Array.from(new Set(articles.map((item) => item.contentType)))], [articles])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return articles.filter((item) => {
      const matchesFilter = filter === "Semua" || item.contentType === filter
      const matchesQuery = !normalized || `${item.title} ${item.excerpt} ${item.authorName} ${item.slug} ${labelType(item.contentType)}`.toLowerCase().includes(normalized)
      return matchesFilter && matchesQuery
    })
  }, [articles, filter, query])
  const featured = articles.find((item) => item.featured)
  const supporting = articles.filter((item) => item.id !== featured?.id).slice(0, 3)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleArticles = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const updateQuery = (value: string) => { setQuery(value); setPage(1) }
  const updateFilter = (value: Filter) => { setFilter(value); setPage(1) }
  const resetFilters = () => { setQuery(""); setFilter("Semua"); setPage(1) }

  return <>
    <section className="border-y border-[#dde7e2] bg-white px-4 py-8 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8" aria-label="Pencarian artikel">
      <div className="mx-auto max-w-7xl"><div className="mx-auto max-w-[900px]"><label htmlFor="article-search" className="sr-only">Cari artikel atau berita</label><div className="flex h-16 items-center gap-3 rounded-[20px] border border-[#dde7e2] bg-white px-5 shadow-sm transition focus-within:border-[#15945b]/45 focus-within:ring-4 focus-within:ring-[#15945b]/10 dark:border-white/10 dark:bg-slate-900"><Search className="h-5 w-5 shrink-0 text-[#15945b]" aria-hidden="true" /><input id="article-search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Cari artikel atau berita" className="min-w-0 flex-1 bg-transparent text-base text-[#0b1f33] outline-none placeholder:text-[#7b8792] dark:text-white dark:placeholder:text-slate-400 sm:text-lg" /><span className="hidden rounded-full bg-[#15945b] px-4 py-2 text-xs font-semibold text-white sm:inline-flex">Cari</span></div></div><div className="mt-5 flex gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible">{filters.map((item) => <button key={item} type="button" onClick={() => updateFilter(item)} className={cn("h-11 shrink-0 rounded-full border px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-2", filter === item ? "border-[#15945b] bg-[#15945b] text-white" : "border-[#dde7e2] bg-white text-[#0b1f33] hover:border-[#15945b]/40 dark:border-white/10 dark:bg-slate-900 dark:text-white")}>{item === "Semua" ? item : labelType(item)}</button>)}</div></div>
    </section>

    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {articles.length === 0 ? <EmptyState title="Belum Ada Artikel" description="Artikel dan berita terpublikasi dari CMS artikel belum tersedia." /> : <>
        {featured && <section aria-labelledby="featured-heading"><div className="flex items-end justify-between gap-4"><h2 id="featured-heading" className="text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Artikel Pilihan</h2></div><div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><Link href={contentHref(featured)} className="group overflow-hidden rounded-[24px] border border-[#dde7e2] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:bg-slate-900"><div className="relative aspect-[16/8] overflow-hidden"><ArticleImage article={featured} priority className="transition duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" /></div><div className="p-6 sm:p-7"><ArticleMeta article={featured} /><div className="mt-3 inline-flex rounded-full bg-[#e6f7ee] px-3 py-1 text-xs font-semibold text-[#15945b] dark:bg-emerald-500/10">Featured</div><h3 className="mt-3 text-2xl font-bold leading-tight text-[#0b1f33] dark:text-white sm:text-3xl">{featured.title}</h3><p className="mt-4 line-clamp-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{featured.excerpt}</p><p className="mt-4 text-sm font-medium text-[#7b8792] dark:text-slate-400">{featured.authorName || "PIINDUNG"}</p></div></Link><div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">{supporting.map((item) => <Link key={item.id} href={contentHref(item)} className="group flex gap-4 rounded-[22px] border border-[#dde7e2] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:bg-slate-900"><div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl"><ArticleImage article={item} className="transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" /></div><div className="min-w-0"><ArticleMeta article={item} /><h3 className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-[#0b1f33] dark:text-white">{item.title}</h3><p className="mt-1 truncate text-xs text-[#7b8792] dark:text-slate-400">{item.authorName || "PIINDUNG"}</p></div></Link>)}</div></div></section>}

        <section className={cn(featured ? "mt-16" : "mt-0")} aria-labelledby="latest-heading"><div className="flex items-end justify-between gap-4 border-b border-[#dde7e2] pb-4 dark:border-white/10"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PUBLIKASI TERBARU</p><h2 id="latest-heading" className="mt-3 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Artikel &amp; Berita Terbaru</h2></div><span className="text-sm text-[#7b8792] dark:text-slate-400">{filtered.length} publikasi</span></div>{visibleArticles.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visibleArticles.map((item, index) => <Link key={item.id} href={contentHref(item)} className="group overflow-hidden rounded-[20px] border border-[#dde7e2] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:bg-slate-900" style={{ animationDelay: `${index * 80}ms` }}><div className="relative aspect-[16/9] overflow-hidden"><ArticleImage article={item} className="transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" /></div><div className="p-5"><ArticleMeta article={item} /><h3 className="mt-3 line-clamp-3 text-lg font-semibold leading-7 text-[#0b1f33] dark:text-white">{item.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#566473] dark:text-slate-300">{item.excerpt}</p><p className="mt-4 text-sm font-medium text-[#7b8792] dark:text-slate-400">{item.authorName || "PIINDUNG"}</p></div></Link>)}</div> : <EmptyState title="Artikel tidak ditemukan" description="Coba gunakan kata kunci atau kategori lain." onReset={resetFilters} />}</section>
        {filtered.length > pageSize && <nav className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" aria-label="Paginasi artikel"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#dde7e2] bg-white px-4 text-sm font-semibold text-[#0b1f33] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-white"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Sebelumnya</button><span className="text-sm font-medium text-[#566473] dark:text-slate-300">Halaman {currentPage} dari {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#dde7e2] bg-white px-4 text-sm font-semibold text-[#0b1f33] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-white">Berikutnya <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></nav>}
      </>}
    </div>
  </>
}

function EmptyState({ title, description, onReset }: { title: string; description: string; onReset?: () => void }) {
  return <div className="mx-auto max-w-xl rounded-[24px] border border-[#dde7e2] bg-white px-6 py-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900"><h2 className="text-2xl font-bold text-[#0b1f33] dark:text-white">{title}</h2><p className="mt-3 leading-7 text-[#566473] dark:text-slate-300">{description}</p>{onReset && <button type="button" onClick={onReset} className="mt-5 inline-flex h-11 items-center rounded-full bg-[#15945b] px-5 text-sm font-semibold text-white">Reset Filter</button>}</div>
}
