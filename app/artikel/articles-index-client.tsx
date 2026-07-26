"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageIcon } from "lucide-react"
import type { Article } from "@/lib/article-content"

function date(article: Article) {
  return article.publishedAt ? new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date(article.publishedAt)) : "Tanpa tanggal"
}
function href(article: Article) { return `/artikel/${encodeURIComponent(article.slug)}` }
function Cover({ article }: { article: Article }) {
  return <div className="relative h-full w-full overflow-hidden bg-[#e7f7ef] dark:bg-[#102536]">{article.coverImage ? <Image src={article.coverImage} alt={`Cover ${article.title}`} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width:1024px) 60vw,100vw" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-[#07965d]" /></div>}<span className="absolute left-5 top-5 rounded-lg bg-white/90 px-3 py-2 text-[9px] font-bold text-[#07965d] shadow-sm backdrop-blur">PIINDUNG</span></div>
}

export function ArticlesIndexClient({ articles }: { articles: Article[] }) {
  const ordered=[...articles].sort((a,b)=>Date.parse(b.publishedAt ?? b.updatedAt)-Date.parse(a.publishedAt ?? a.updatedAt))
  const featured=ordered.find(item=>item.featured) ?? ordered[0]
  const rest=ordered.filter(item=>item.id!==featured?.id)
  if(!featured) return <div className="mx-auto max-w-[1040px] px-5 pb-24 text-center text-[#6c7a89] sm:px-8">Belum ada artikel yang diterbitkan.</div>
  return (
    <div className="mx-auto max-w-[1040px] px-5 pb-24 sm:px-8 sm:pb-32">
      <Link href={href(featured)} className="group grid overflow-hidden rounded-[28px] border border-[#dce8e2] bg-white shadow-[0_20px_60px_rgba(9,43,32,.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d] lg:grid-cols-[1.16fr_.84fr]">
        <div className="min-h-[300px] lg:min-h-[470px]"><Cover article={featured} /></div>
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#07965d]">{featured.contentType === "berita" ? "Berita" : "Transformasi Digital"} <span className="mx-1 text-[#a0ada7]">·</span> {date(featured)}</p><h2 className="mt-5 text-[clamp(2rem,3.5vw,3.2rem)] font-bold leading-[1.08] tracking-[-.055em] text-[#08213b] transition group-hover:text-[#07965d] dark:text-white">{featured.title}</h2><p className="mt-5 line-clamp-4 text-sm leading-8 text-[#6c7a89] dark:text-slate-300">{featured.excerpt}</p><strong className="mt-7 inline-flex items-center gap-2 text-sm text-[#07965d]">Baca artikel <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></strong></div>
      </Link>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{rest.map(article=><Link key={article.id} href={href(article)} className="group block overflow-hidden rounded-[24px] border border-[#dce8e2] bg-white shadow-[0_14px_38px_rgba(9,43,32,.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d]"><div className="aspect-[16/10]"><Cover article={article} /></div><div className="p-6"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#07965d]">{article.contentType === "berita" ? "Berita" : "Artikel"} · {date(article)}</p><h2 className="mt-4 line-clamp-3 text-xl font-bold leading-7 tracking-[-.035em] text-[#08213b] transition group-hover:text-[#07965d] dark:text-white">{article.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6c7a89] dark:text-slate-300">{article.excerpt}</p><strong className="mt-5 inline-flex items-center gap-2 text-sm text-[#07965d]">Baca selengkapnya <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></strong></div></Link>)}</div>
    </div>
  )
}
