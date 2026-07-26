import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ImageIcon } from "lucide-react"
import { readPublishedArticles, type Article, type ArticleContentType } from "@/lib/article-content"
import { LandingReveal } from "@/components/piindung/landing-motion"

function articleDate(article: Article) {
  return article.publishedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(article.publishedAt)) : "Tanpa tanggal"
}

function articleType(type: ArticleContentType) {
  return type === "berita" ? "Berita" : "Artikel"
}

function ArticleThumbnail({ article }: { article: Article }) {
  if (!article.coverImage) {
    return <div className="flex h-full min-h-32 items-center justify-center bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-300/10 dark:text-emerald-300"><ImageIcon className="h-7 w-7" aria-hidden="true" /></div>
  }
  return <Image src={article.coverImage} alt={`Cover ${article.title}`} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.01] motion-reduce:transition-none motion-reduce:group-hover:scale-100" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 36vw, 100vw" />
}

export async function MediaArticles() {
  const articles = (await readPublishedArticles()).sort((a, b) => Date.parse(b.publishedAt ?? b.updatedAt) - Date.parse(a.publishedAt ?? a.updatedAt)).slice(0, 3)

  return (
    <section className="bg-[#f7faf8] py-20 dark:bg-[#07131f] sm:py-24" aria-labelledby="media-articles-heading">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <LandingReveal className="flex flex-col gap-4 border-b border-[#d9e5df] pb-8 dark:border-[#213a49] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07965d]">Wawasan &amp; Informasi</p>
            <h2 id="media-articles-heading" className="mt-3 text-[clamp(2rem,3.5vw,3rem)] font-bold tracking-[-0.045em] text-[#0b2239] dark:text-white">Berita dan Artikel Terbaru</h2>
          </div>
          <Link href="/artikel" className="hidden min-h-11 items-center gap-2 text-sm font-semibold text-[#07965d] transition hover:text-[#0b2239] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] sm:inline-flex dark:hover:text-emerald-300">Lihat Semua <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </LandingReveal>
        {articles.length ? (
          <div className="divide-y divide-[#d9e5df] dark:divide-[#213a49]">
            {articles.map((article) => (
              <Link key={article.id} href={`/artikel/${encodeURIComponent(article.slug)}`} className="group grid min-h-44 gap-5 py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4 sm:grid-cols-[210px_minmax(0,1fr)_auto] sm:items-center sm:gap-7">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-[#e6f7ef] dark:bg-[#102536]"><ArticleThumbnail article={article} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#07965d]">{articleType(article.contentType)} <span className="mx-1 text-[#a0ada7]">|</span> {articleDate(article)}</p>
                  <h3 className="mt-3 line-clamp-3 text-xl font-semibold leading-7 tracking-[-0.03em] text-[#0b2239] transition-colors group-hover:text-[#07965d] dark:text-white sm:text-2xl">{article.title}</h3>
                  {article.excerpt ? <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-7 text-[#64748b] dark:text-[#a5b4c5]">{article.excerpt}</p> : null}
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center self-end rounded-full border border-[#d9e5df] text-[#07965d] transition-transform duration-300 group-hover:translate-x-1 dark:border-[#213a49] sm:self-center" aria-label={`Baca ${article.title}`}><ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-10 text-sm leading-7 text-[#64748b] dark:text-[#a5b4c5]">Publikasi terbaru akan ditampilkan setelah artikel atau berita diterbitkan.</div>
        )}
        <Link href="/artikel" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] sm:hidden">Lihat Semua <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </section>
  )
}
