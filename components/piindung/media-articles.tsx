import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageIcon } from "lucide-react"
import { readPublishedArticles, type Article } from "@/lib/article-content"
import { articleMeta, SAMPLE_ARTICLES, withArticleFallback } from "@/lib/sample-articles"
import { LandingReveal } from "@/components/piindung/landing-motion"

function articleDate(article: Article) {
  return article.publishedAt ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(article.publishedAt)) : "Tanpa tanggal"
}

function Thumbnail({ article }: { article: Article }) {
  return (
    <div className="relative h-[88px] w-[120px] shrink-0 overflow-hidden rounded-[12px] bg-[#e7f7ef] sm:h-auto sm:w-[190px] sm:aspect-[16/10] sm:rounded-[14px]">
      {article.coverImage ? <Image src={article.coverImage} alt={`Cover ${article.title}`} fill className="object-cover transition duration-500 group-hover:scale-[1.02]" sizes="(min-width: 640px) 190px, 120px" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-6 w-6 text-[#07965d] sm:h-7 sm:w-7" /></div>}
    </div>
  )
}

export async function MediaArticles() {
  const articles = withArticleFallback(await readPublishedArticles(), SAMPLE_ARTICLES).sort((a, b) => Date.parse(b.publishedAt ?? b.updatedAt) - Date.parse(a.publishedAt ?? a.updatedAt)).slice(0, 3)

  return (
    <section className="bg-[#f8fbf9] py-16 dark:bg-[#07131f] sm:py-20" aria-labelledby="media-articles-heading">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <LandingReveal className="flex items-end justify-between gap-6 border-b border-[#dce8e2] pb-6 dark:border-white/10">
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">Wawasan &amp; Informasi</p><h2 id="media-articles-heading" className="mt-3 text-[clamp(2rem,3.4vw,2.8rem)] font-bold leading-none tracking-[-.05em] text-[#08213b] dark:text-white">Berita dan Artikel Terbaru</h2></div>
          <Link href="/artikel" className="hidden items-center gap-2 text-sm font-semibold text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] sm:inline-flex">Lihat Semua Artikel <ArrowRight className="h-4 w-4" /></Link>
        </LandingReveal>
        {articles.length ? (
          <div className="divide-y divide-[#dce8e2] dark:divide-white/10">
            {articles.map((article, index) => {
              const meta = articleMeta(article)
              return (
                <LandingReveal key={article.id} delay={index * 0.08} distance={18} duration={0.7}>
                <Link
                  href={`/artikel/${encodeURIComponent(article.slug)}`}
                  className="group grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 rounded-2xl px-2 py-4 -mx-2 transition-colors duration-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4 sm:grid-cols-[190px_minmax(0,1fr)_auto] sm:gap-5 sm:py-5 dark:hover:bg-white/[.03]"
                >
                  <Thumbnail article={article} />
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#07965d]">
                      {meta.category} <span className="mx-1 text-[#a0ada7]">·</span> {articleDate(article)} <span className="mx-1 text-[#a0ada7]">·</span> {meta.readMinutes} menit baca
                    </p>
                    <h3 className="mt-1.5 line-clamp-2 text-[17px] font-bold leading-6 tracking-[-.025em] text-[#08213b] transition-colors group-hover:text-[#07965d] dark:text-white sm:mt-2 sm:text-[19px]">
                      {article.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#6c7a89] dark:text-slate-300 sm:mt-2 sm:text-sm sm:leading-6">
                      {article.excerpt}
                    </p>
                  </div>
                  <span className="hidden h-9 w-9 place-items-center rounded-full border border-[#dce8e2] text-[#07965d] transition group-hover:translate-x-1 group-hover:border-[#07965d]/45 sm:grid dark:border-white/10">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                </LandingReveal>
              )
            })}
          </div>
        ) : (
          <p className="py-10 text-sm text-[#6c7a89]">Publikasi terbaru akan ditampilkan setelah artikel diterbitkan.</p>
        )}
        <Link href="/artikel" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] sm:hidden">Lihat Semua Artikel <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  )
}
