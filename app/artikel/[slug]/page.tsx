import type { Metadata } from "next"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ImageIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { PublicPageShell } from "@/components/piindung/public-page-shell"
import { ArticleShareActions } from "@/components/piindung/article-share-actions"
import { LandingCard, LandingReveal } from "@/components/piindung/landing-motion"
import { getPublishedArticleBySlug, readPublishedArticles, type Article, type ArticleContentType } from "@/lib/article-content"
import { isSafeArticleImage } from "@/lib/article-content-rules"
import { articleMeta, SAMPLE_ARTICLES, withArticleFallback } from "@/lib/sample-articles"

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

function richParagraphs(value: string) {
  return value.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
}

function inlineMarkdown(value: string): ReactNode[] {
  const tokens = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\)]+\)|`[^`]+`)/g).filter(Boolean)
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>
    if (token.startsWith("*") && token.endsWith("*")) return <em key={index}>{token.slice(1, -1)}</em>
    if (token.startsWith("[") && token.includes("](")) {
      const match = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/)
      if (match && /^https?:\/\//i.test(match[2])) return <a key={index} href={match[2]} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#07965d] underline">{match[1]}</a>
    }
    if (token.startsWith("`") && token.endsWith("`")) return <code key={index} className="rounded bg-[#e7f7ef] px-1.5 py-0.5 text-[0.9em] dark:bg-white/10">{token.slice(1, -1)}</code>
    return <span key={index}>{token}</span>
  })
}

function renderArticleBody(value: string) {
  return richParagraphs(value).map((paragraph, index) => {
    if (paragraph.startsWith("![") && paragraph.includes("](")) {
      const match = paragraph.match(/^!\[([^\]]*)\]\(([^\)]+)\)(?:\n\*([^*]+)\*)?$/)
      if (match && /^\/(?:public\/)?uploads\//.test(match[2])) return <figure key={index} className="my-8"><img src={match[2]} alt={match[1]} className="w-full rounded-2xl" /><figcaption className="mt-2 text-center text-sm text-[#6c7a89]">{match[3] || match[1]}</figcaption></figure>
    }
    if (paragraph.startsWith("> ")) return <blockquote key={index} className="border-l-4 border-[#07965d] pl-5 italic text-[#45606b] dark:text-slate-300">{inlineMarkdown(paragraph.slice(2))}</blockquote>
    if (paragraph.split("\n").every((line) => line.startsWith("- "))) return <ul key={index} className="list-disc space-y-2 pl-6">{paragraph.split("\n").map((line) => <li key={line}>{inlineMarkdown(line.slice(2))}</li>)}</ul>
    if (paragraph.startsWith("## ")) return <h2 key={index} className="mt-8 text-2xl font-bold tracking-tight text-[#08213b] dark:text-white">{inlineMarkdown(paragraph.slice(3))}</h2>
    return <p key={index} className="whitespace-pre-line">{inlineMarkdown(paragraph)}</p>
  })
}

function Cover({ article, priority = false }: { article: Article; priority?: boolean }) {
  return <div className="relative aspect-[16/8] overflow-hidden rounded-[24px] bg-[#e7f7ef] shadow-[0_20px_60px_rgba(9,43,32,.09)] dark:bg-[#102536]">{article.coverImage ? <Image src={article.coverImage} alt={`Cover artikel ${article.title}`} fill priority={priority} className="object-cover" sizes="(min-width: 1280px) 1200px, 100vw" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-14 w-14 text-[#07965d]/70" aria-hidden="true" /></div>}</div>
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug) ?? SAMPLE_ARTICLES.find((item) => item.slug === slug)
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
  const articles = withArticleFallback(await readPublishedArticles(), SAMPLE_ARTICLES)
  const article = articles.find((item) => item.slug === slug)
  if (!article) notFound()

  const related = articles.filter((item) => item.id !== article.id && item.contentType === article.contentType).slice(0, 3)
  const fallbackRelated = articles.filter((item) => item.id !== article.id && !related.some((relatedArticle) => relatedArticle.id === item.id)).slice(0, 3 - related.length)
  const relatedArticles = [...related, ...fallbackRelated]
  const meta = articleMeta(article)

  return (
    <PublicPageShell>
        <article>
          <header className="px-4 pb-10 pt-32 sm:px-6 sm:pb-14 sm:pt-36 lg:px-8 lg:pt-40"><LandingReveal className="mx-auto max-w-[950px] text-center"><nav className="flex flex-wrap items-center justify-center gap-2 text-sm text-[#6c7a89] dark:text-slate-400" aria-label="Breadcrumb"><Link href="/" className="transition hover:text-[#07965d]">Beranda</Link><span aria-hidden="true">/</span><Link href="/artikel" className="transition hover:text-[#07965d]">Artikel</Link><span aria-hidden="true">/</span><span className="max-w-[240px] truncate text-[#6c7a89] dark:text-slate-300">{article.title}</span></nav><p className="mt-8 text-[10px] font-bold uppercase tracking-[.18em] text-[#07965d]">{meta.category} <span className="mx-1 text-[#a0ada7]">·</span> {articleDate(article)} <span className="mx-1 text-[#a0ada7]">·</span> {meta.readMinutes} menit baca</p>{article.featured && <p className="mx-auto mt-4 inline-flex rounded-full bg-[#e7f7ef] px-4 py-2 text-xs font-semibold text-[#07965d] dark:bg-emerald-500/10">Featured</p>}<h1 className="mt-5 text-[clamp(2.25rem,4.6vw,3.75rem)] font-bold leading-[1.08] tracking-[-.045em] text-[#08213b] dark:text-white">{article.title}</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#6c7a89] dark:text-slate-300 sm:text-xl">{article.excerpt}</p></LandingReveal></header>
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8"><LandingReveal delay={0.08} distance={28}><Cover article={article} priority /></LandingReveal></div>
          <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16 lg:px-0"><LandingReveal><div className="flex flex-col gap-5 border-b border-[#dce8e2] pb-8 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#08213b] dark:text-white">{article.authorName || "PIINDUNG"}</p><p className="mt-1 text-sm text-[#6c7a89] dark:text-slate-400">{articleDate(article)}</p></div><ArticleShareActions title={article.title} /></div><div className="prose prose-slate mt-10 max-w-none text-[17px] leading-[1.85] dark:prose-invert sm:text-[18px]">{renderArticleBody(article.body)}</div><Link href="/artikel" className="mt-12 inline-flex items-center gap-2 text-sm font-semibold text-[#07965d] transition hover:text-[#08213b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:hover:text-emerald-300"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke Artikel</Link></LandingReveal></div>
        </article>
        {relatedArticles.length > 0 && <section className="border-t border-[#dce8e2] bg-white px-4 py-16 dark:border-white/10 dark:bg-transparent sm:px-6 sm:py-20 lg:px-8" aria-labelledby="related-heading"><div className="mx-auto max-w-[1040px]"><LandingReveal className="flex items-end justify-between gap-4"><h2 id="related-heading" className="text-[clamp(2rem,3.4vw,2.8rem)] font-bold leading-none tracking-[-.05em] text-[#08213b] dark:text-white">Artikel Terkait</h2><Link href="/artikel" className="hidden items-center gap-2 text-sm font-semibold text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] sm:inline-flex">Lihat Semua <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></LandingReveal><div className="mt-8 grid gap-5 md:grid-cols-3">{relatedArticles.map((item, index) => <LandingCard key={item.id} revealIndex={index} revealColumns={3} interactive className="h-full"><Link href={`/artikel/${encodeURIComponent(item.slug)}`} className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#dce8e2] bg-white shadow-[0_12px_32px_rgba(9,43,32,.055)] transition duration-300 hover:border-[#07965d]/45 hover:shadow-[0_16px_38px_rgba(9,43,32,.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d]"><div className="relative aspect-[16/9] overflow-hidden bg-[#e7f7ef] dark:bg-[#102536]">{item.coverImage ? <Image src={item.coverImage} alt={`Cover artikel ${item.title}`} fill className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" sizes="(min-width: 768px) 33vw, 100vw" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-9 w-9 text-[#07965d]/70" aria-hidden="true" /></div>}</div><div className="p-5"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#07965d]">{labelType(item.contentType)} <span className="mx-1 text-[#a0ada7]">·</span> {articleDate(item)}</p><h3 className="mt-3 line-clamp-3 text-lg font-bold leading-7 tracking-[-.025em] text-[#08213b] transition group-hover:text-[#07965d] dark:text-white">{item.title}</h3></div></Link></LandingCard>)}</div></div></section>}
    </PublicPageShell>
  )
}
