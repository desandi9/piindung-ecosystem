import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { notFound } from "next/navigation"
import { Poppins } from "next/font/google"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"
import { getPrismaClient } from "@/lib/prisma"
import { ArticleShareActions } from "@/components/piindung/article-share-actions"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const fallbackImage = "/HERO%20PIINDUNG.png"

type ArticleDetailPageProps = { params: Promise<{ slug: string }> }

type ArticleItem = {
  id: string
  type: "Banner" | "Artikel" | "Berita"
  title: string
  subtitle: string
  description: string
  image: string
  link: string
  buttonText: string
  status: "Published" | "Draft" | "Unpublished"
  order: number
  updatedAt: string
}

type ArticleRecord = { data: ArticleItem }

async function getPublishedArticles() {
  try {
    const prisma = getPrismaClient()
    const records = await prisma.$queryRaw<ArticleRecord[]>`
      SELECT data
      FROM "AppRecord"
      WHERE scope = 'homepage-content'
    `
    const items = records.map((record) => record.data)
    return items
  } catch {
    return []
  }
}

async function getPublishedArticle(slug: string) {
  const articles = (await getPublishedArticles()).filter((item) => item.status === "Published" && item.type !== "Banner")
  return articles.find((item) => item.id === slug)
}

function articleDescription(article: ArticleItem) {
  return article.description || article.subtitle || `Informasi ${article.type.toLowerCase()} PIINDUNG.`
}

function articleDate(article: ArticleItem) {
  return article.updatedAt
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) return { title: "Artikel tidak ditemukan" }

  const description = articleDescription(article)
  const image = article.image || fallbackImage
  return {
    title: `${article.title} | PIINDUNG`,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: [{ url: image, alt: article.title }],
    },
  }
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params
  const articles = (await getPublishedArticles()).filter((item) => item.status === "Published" && item.type !== "Banner")
  const article = articles.find((item) => item.id === slug)
  if (!article) notFound()

  const related = articles.filter((item) => item.id !== article.id && item.type === article.type).slice(0, 3)
  const fallbackRelated = articles.filter((item) => item.id !== article.id && !related.some((relatedArticle) => relatedArticle.id === item.id)).slice(0, 3 - related.length)
  const relatedArticles = [...related, ...fallbackRelated]
  const description = articleDescription(article)

  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />
        <article>
          <header className="px-4 pb-10 pt-32 sm:px-6 sm:pb-14 sm:pt-36 lg:px-8 lg:pt-40"><div className="mx-auto max-w-[950px] text-center"><nav className="flex flex-wrap items-center justify-center gap-2 text-sm text-[#7b8792] dark:text-slate-400" aria-label="Breadcrumb"><Link href="/" className="transition hover:text-[#15945b]">Beranda</Link><span aria-hidden="true">/</span><Link href="/artikel" className="transition hover:text-[#15945b]">Artikel</Link><span aria-hidden="true">/</span><span className="max-w-[240px] truncate text-[#566473] dark:text-slate-300">{article.title}</span></nav><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">{article.type} <span className="mx-1 text-[#a0ada7]">|</span> {articleDate(article)}</p><h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[60px]">{article.title}</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#566473] dark:text-slate-300 sm:text-xl">{description}</p></div></header>
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8"><div className="relative aspect-[16/8] overflow-hidden rounded-[24px] shadow-[0_22px_60px_rgba(7,20,38,0.12)]"><Image src={article.image || fallbackImage} alt={article.title} fill priority className="object-cover" sizes="(min-width: 1280px) 1200px, 100vw" /></div></div>
          <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16 lg:px-0"><div className="flex flex-col gap-5 border-b border-[#dde7e2] pb-8 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#0b1f33] dark:text-white">PIINDUNG</p><p className="mt-1 text-sm text-[#7b8792] dark:text-slate-400">{articleDate(article)}</p></div><ArticleShareActions title={article.title} /></div><div className="prose prose-slate mt-10 max-w-none text-[17px] leading-[1.85] dark:prose-invert sm:text-[18px]"><p className="whitespace-pre-line">{article.description}</p>{article.subtitle && article.subtitle !== article.description && <p className="whitespace-pre-line">{article.subtitle}</p>}</div><Link href="/artikel" className="mt-12 inline-flex items-center gap-2 text-sm font-semibold text-[#15945b] transition hover:text-[#0b1f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:hover:text-emerald-300"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke Artikel</Link></div>
        </article>
        {relatedArticles.length > 0 && <section className="border-t border-[#dde7e2] bg-white px-4 py-16 dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="related-heading"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><h2 id="related-heading" className="text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Artikel Terkait</h2><Link href="/artikel" className="hidden items-center gap-2 text-sm font-semibold text-[#15945b] sm:inline-flex">Lihat Semua <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><div className="mt-8 grid gap-5 md:grid-cols-3">{relatedArticles.map((item) => <Link key={item.id} href={`/artikel/${encodeURIComponent(item.id)}`} className="group overflow-hidden rounded-[20px] border border-[#dde7e2] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:bg-slate-900"><div className="relative aspect-[16/9] overflow-hidden"><Image src={item.image || fallbackImage} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" sizes="(min-width: 768px) 33vw, 100vw" /></div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#15945b]">{item.type} <span className="mx-1 text-[#a0ada7]">|</span> {articleDate(item)}</p><h3 className="mt-3 line-clamp-3 text-lg font-semibold leading-7 text-[#0b1f33] dark:text-white">{item.title}</h3></div></Link>)}</div></div></section>}
      </main>
      <PublicFooter />
    </div>
  )
}
