import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageIcon } from "lucide-react"
import { readPublishedArticles, type Article } from "@/lib/article-content"
import { LandingReveal } from "@/components/piindung/landing-motion"

function articleDate(article: Article) {
  return article.publishedAt ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(article.publishedAt)) : "Tanpa tanggal"
}

function Thumbnail({ article, index }: { article: Article; index: number }) {
  return (
    <div className={`relative h-[132px] w-full shrink-0 overflow-hidden rounded-[18px] sm:h-[142px] sm:w-[260px] ${index === 0 ? "bg-[#08704f]" : index === 1 ? "bg-[#0a3f5d]" : "bg-[#167ca0]"}`}>
      {article.coverImage ? <Image src={article.coverImage} alt={`Cover ${article.title}`} fill className="object-cover transition duration-700 group-hover:scale-[1.03]" sizes="260px" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-white/85" /></div>}
      <span className="absolute bottom-3 left-4 text-[9px] font-bold tracking-[.15em] text-white">PIINDUNG</span>
    </div>
  )
}

export async function MediaArticles() {
  const articles = (await readPublishedArticles()).sort((a,b) => Date.parse(b.publishedAt ?? b.updatedAt) - Date.parse(a.publishedAt ?? a.updatedAt)).slice(0,3)

  return (
    <section className="bg-[#f8fbf9] py-20 dark:bg-[#07131f] sm:py-24" aria-labelledby="media-articles-heading">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <LandingReveal className="flex items-end justify-between gap-6 border-b border-[#dce8e2] pb-8 dark:border-white/10">
          <h2 id="media-articles-heading" className="text-[clamp(2.35rem,4vw,3.7rem)] font-medium leading-none tracking-[-.06em] text-[#08213b] dark:text-white">Berita dan Artikel Terbaru</h2>
          <Link href="/artikel" className="hidden h-12 items-center gap-3 rounded-2xl border border-[#d9e5df] px-5 text-sm font-semibold text-[#08213b] transition hover:border-[#07965d] hover:text-[#07965d] sm:inline-flex dark:border-white/10 dark:text-white">Lihat Semua <ArrowRight className="h-4 w-4" /></Link>
        </LandingReveal>

        {articles.length ? <div>{articles.map((article,index) => (
          <LandingReveal key={article.id} delay={index * .06}>
            <Link href={`/artikel/${encodeURIComponent(article.slug)}`} className="group grid gap-5 border-b border-[#dce8e2] py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] sm:grid-cols-[260px_1fr_auto] sm:items-center sm:gap-8 dark:border-white/10">
              <Thumbnail article={article} index={index} />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#07965d]">{article.contentType === "berita" ? "Berita" : "Artikel"} <span className="mx-2 text-[#a0ada7]">•</span> {articleDate(article)}</p>
                <h3 className="mt-3 max-w-[700px] text-[clamp(1.25rem,2vw,1.75rem)] font-medium leading-[1.25] tracking-[-.04em] text-[#08213b] transition-colors group-hover:text-[#07965d] dark:text-white">{article.title}</h3>
                <span className="mt-3 block text-xs text-[#718096]">Baca selengkapnya</span>
              </div>
              <span className="hidden h-11 w-11 place-items-center rounded-full border border-[#d9e5df] text-[#07965d] transition group-hover:border-[#07965d] group-hover:bg-[#e7f7ef] sm:grid dark:border-white/10"><ArrowRight className="h-4 w-4" /></span>
            </Link>
          </LandingReveal>
        ))}</div> : <p className="py-12 text-sm text-[#6c7a89]">Publikasi terbaru akan ditampilkan setelah artikel diterbitkan.</p>}
        <Link href="/artikel" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#07965d] sm:hidden">Lihat Semua <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  )
}
