import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ImageIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { PublicPageShell } from "@/components/piindung/public-page-shell"
import { ArticleShareActions } from "@/components/piindung/article-share-actions"
import { getPublishedArticleBySlug, readPublishedArticles, type Article, type ArticleContentType } from "@/lib/article-content"
import { isSafeArticleImage } from "@/lib/article-content-rules"

type ArticleDetailPageProps = { params: Promise<{ slug: string }> }

function labelType(type: ArticleContentType) {
  return type === "berita" ? "Berita" : "Artikel"
}

function articleDate(article: Article) {
  return article.publishedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(article.publishedAt)) : "Tanpa tanggal"
}

function canonicalPath(slug: string) {
  return `/artikel/${encodeURIComponent(slug)}`
}

function plainParagraphs(value: string) {
  return value.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
}

function Cover({ article, priority = false }: { article: Article; priority?: boolean }) {
  return <div className="relative aspect-[16/8] overflow-hidden rounded-[24px] bg-[#e8f3ee] shadow-[0_22px_60px_rgba(7,20,38,0.12)] dark:bg-slate-800">{article.coverImage ? <Image src={article.coverImage} alt={`Cover artikel ${article.title}`} fill priority={priority} className="object-cover" sizes="(min-width: 1280px) 1200px, 100vw" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-14 w-14 text-[#15945b]/70" aria-hidden="true" /></div>}</div>
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)
  if (!article) return {}
  const images = article.coverImage && isSafeArticleImage(article.coverImage) ? [{ url: article.coverImage, alt: article.title }] : undefined

  return {
    title: `${article.title} | PIINDUNG`,
    description: article.excerpt,
    alternates: { canonical: canonicalPath(article.slug) },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      url: canonicalPath(article.slug),
      publishedTime: article.publishedAt ?? undefined,
      authors: article.authorName ? [article.authorName] : undefined,
      images,
    },
  }
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params
  const articles = await readPublishedArticles()
  const article = articles.find((item) => item.slug === slug)
  if (!article) notFound()

  const related = articles.filter((item) => item.id !== article.id && item.contentType === article.contentType).slice(0, 3)
  const fallbackRelated = articles.filter((item) => item.id !== article.id && !related.some((relatedArticle) => relatedArticle.id === item.id)).slice(0, 3 - related.length)
  const relatedArticles = [...related, ...fallbackRelated]

  return (
    <PublicPageShell>
        <article>
          <header className="px-4 pb-10 pt-32 sm:px-6 sm:pb-14 sm:pt-36 lg:px-8 lg:pt-40"><div className="mx-auto max-w-[950px] text-center"><nav className="flex flex-wrap items-center justify-center gap-2 text-sm text-[#7b8792] dark:text-slate-400" aria-label="Breadcrumb"><Link href="/" className="transition hover:text-[#15945b]">Beranda</Link><span aria-hidden="true">/</span><Link href="/artikel" className="transition hover:text-[#15945b]">Artikel</Link><span aria-hidden="true">/</span><span className="max-w-[240px] truncate text-[#566473] dark:text-slate-300">{article.title}</span></nav><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">{labelType(article.contentType)} <span className="mx-1 text-[#a0ada7]">|</span> {articleDate(article)}</p>{article.featured && <p className="mx-auto mt-4 inline-flex rounded-full bg-[#e6f7ee] px-4 py-2 text-xs font-semibold text-[#15945b] dark:bg-emerald-500/10">Featured</p>}<h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[60px]">{article.title}</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#566473] dark:text-slate-300 sm:text-xl">{article.excerpt}</p></div></header>
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8"><Cover article={article} priority /></div>
          <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16 lg:px-0"><div className="flex flex-col gap-5 border-b border-[#dde7e2] pb-8 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#0b1f33] dark:text-white">{article.authorName || "PIINDUNG"}</p><p className="mt-1 text-sm text-[#7b8792] dark:text-slate-400">{articleDate(article)}</p></div><ArticleShareActions title={article.title} /></div><div className="prose prose-slate mt-10 max-w-none text-[17px] leading-[1.85] dark:prose-invert sm:text-[18px]">{plainParagraphs(article.body).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}</div><Link href="/artikel" className="mt-12 inline-flex items-center gap-2 text-sm font-semibold text-[#15945b] transition hover:text-[#0b1f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:hover:text-emerald-300"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke Artikel</Link></div>
        </article>
        {relatedArticles.length > 0 && <section className="border-t border-[#dde7e2] bg-white px-4 py-16 dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="related-heading"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><h2 id="related-heading" className="text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Artikel Terkait</h2><Link href="/artikel" className="hidden items-center gap-2 text-sm font-semibold text-[#15945b] sm:inline-flex">Lihat Semua <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><div className="mt-8 grid gap-5 md:grid-cols-3">{relatedArticles.map((item) => <Link key={item.id} href={`/artikel/${encodeURIComponent(item.slug)}`} className="group overflow-hidden rounded-[20px] border border-[#dde7e2] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:bg-slate-900"><div className="relative aspect-[16/9] overflow-hidden rounded-t-[20px] bg-[#e8f3ee] dark:bg-slate-800">{item.coverImage ? <Image src={item.coverImage} alt={`Cover artikel ${item.title}`} fill className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" sizes="(min-width: 768px) 33vw, 100vw" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-9 w-9 text-[#15945b]/70" aria-hidden="true" /></div>}</div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#15945b]">{labelType(item.contentType)} <span className="mx-1 text-[#a0ada7]">|</span> {articleDate(item)}</p><h3 className="mt-3 line-clamp-3 text-lg font-semibold leading-7 text-[#0b1f33] dark:text-white">{item.title}</h3></div></Link>)}</div></div></section>}
    </PublicPageShell>
  )
}
