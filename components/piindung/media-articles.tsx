import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageIcon } from "lucide-react"
import { readPublishedArticles, type Article } from "@/lib/article-content"
import { LandingReveal } from "@/components/piindung/landing-motion"

function articleDate(article: Article) {
  return article.publishedAt ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(article.publishedAt)) : "Tanpa tanggal"
}

function Thumbnail({ article }: { article: Article }) {
  return <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-[#e7f7ef] dark:bg-[#102536]">{article.coverImage ? <Image src={article.coverImage} alt={`Cover ${article.title}`} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width:1024px) 33vw,100vw" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-[#07965d]" /></div>}<span className="absolute left-4 top-4 rounded-lg bg-white/90 px-2.5 py-1.5 text-[9px] font-bold text-[#07965d] shadow-sm backdrop-blur">PIINDUNG</span></div>
}

export async function MediaArticles() {
  const articles = (await readPublishedArticles()).sort((a,b) => Date.parse(b.publishedAt ?? b.updatedAt) - Date.parse(a.publishedAt ?? a.updatedAt)).slice(0,3)
  return (
    <section className="bg-[#f8fbf9] py-24 dark:bg-[#07131f] sm:py-28" aria-labelledby="media-articles-heading">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <LandingReveal className="flex items-end justify-between gap-6 border-b border-[#dce8e2] pb-8 dark:border-white/10">
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Wawasan &amp; Informasi</p><h2 id="media-articles-heading" className="mt-4 text-[clamp(2.4rem,4vw,3.55rem)] font-bold leading-none tracking-[-.055em] text-[#08213b] dark:text-white">Berita dan Artikel Terbaru</h2></div>
          <Link href="/artikel" className="hidden items-center gap-2 text-sm font-semibold text-[#07965d] sm:inline-flex">Lihat Semua <ArrowRight className="h-4 w-4" /></Link>
        </LandingReveal>
        {articles.length ? <div className="mt-9 grid gap-6 lg:grid-cols-3">{articles.map((article,index) => <Link key={article.id} href={`/artikel/${encodeURIComponent(article.slug)}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4"><Thumbnail article={article} /><p className="mt-5 text-[9px] font-bold uppercase tracking-[.14em] text-[#07965d]">{article.contentType === "berita" ? "Berita" : "Artikel"} <span className="mx-1 text-[#a0ada7]">·</span> {articleDate(article)}</p><h3 className="mt-3 line-clamp-3 text-xl font-bold leading-7 tracking-[-.035em] text-[#08213b] transition-colors group-hover:text-[#07965d] dark:text-white">{article.title}</h3><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#07965d]">Baca selengkapnya <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div> : <p className="py-12 text-sm text-[#6c7a89]">Publikasi terbaru akan ditampilkan setelah artikel diterbitkan.</p>}
        <Link href="/artikel" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#07965d] sm:hidden">Lihat Semua <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  )
}
