"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowLeft, Eye, FileText, ImageIcon, RefreshCcw, RotateCcw, Search, Star, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { Article, ArticleContentType, ArticleStatus } from "@/lib/article-content"

type ContentTypeFilter = "semua" | ArticleContentType
type StatusFilter = "semua" | ArticleStatus
type FeaturedFilter = "semua" | "featured" | "regular"

const contentTypeOptions: { label: string; value: ContentTypeFilter }[] = [
  { label: "Semua", value: "semua" },
  { label: "Artikel", value: "artikel" },
  { label: "Berita", value: "berita" },
]
const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "Semua", value: "semua" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Unpublished", value: "unpublished" },
]
const featuredOptions: { label: string; value: FeaturedFilter }[] = [
  { label: "Semua Featured", value: "semua" },
  { label: "Featured", value: "featured" },
  { label: "Regular", value: "regular" },
]

function safeText(value: string, length = 110) {
  const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return text.length > length ? `${text.slice(0, length).trim()}...` : text
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value))
}

function statusLabel(status: ArticleStatus) {
  if (status === "published") return "Published"
  if (status === "unpublished") return "Unpublished"
  return "Draft"
}

function statusClassName(status: ArticleStatus) {
  if (status === "published") return "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-300"
  if (status === "draft") return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
  return "bg-muted text-muted-foreground"
}

function Thumbnail({ article, large = false }: { article: Article; large?: boolean }) {
  return <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted", large ? "aspect-video w-full" : "h-16 w-20")}>
    {article.coverImage ? <Image src={article.coverImage} alt={article.title} fill sizes={large ? "(max-width: 768px) 100vw, 720px" : "80px"} className="object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
  </div>
}

export default function MemberArticleDirectoryPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [contentType, setContentType] = useState<ContentTypeFilter>("semua")
  const [status, setStatus] = useState<StatusFilter>("semua")
  const [featured, setFeatured] = useState<FeaturedFilter>("semua")
  const [preview, setPreview] = useState<Article | null>(null)
  const ready = !isLoading && user?.role === "super_admin_pc"
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem

  const loadArticles = async () => {
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/articles?managed=1", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal mengambil artikel terkelola.")
      setArticles(Array.isArray(data.articles) ? data.articles : [])
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal mengambil artikel terkelola.") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/member-area/konten/artikel")
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])

  useEffect(() => { if (ready) void loadArticles() }, [ready])

  const summary = useMemo(() => ({
    total: articles.length,
    draft: articles.filter((article) => article.status === "draft").length,
    published: articles.filter((article) => article.status === "published").length,
    unpublished: articles.filter((article) => article.status === "unpublished").length,
  }), [articles])

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim()
    return articles.filter((article) => {
      const matchesSearch = !term || [article.title, article.excerpt, article.slug, article.authorName].some((value) => value.toLowerCase().includes(term))
      return matchesSearch && (contentType === "semua" || article.contentType === contentType) && (status === "semua" || article.status === status) && (featured === "semua" || article.featured === (featured === "featured"))
    })
  }, [articles, contentType, featured, query, status])

  const resetFilters = () => { setQuery(""); setContentType("semua"); setStatus("semua"); setFeatured("semua") }

  if (!ready) return <div className="min-h-screen bg-background" />

  return <MemberLayout title="Artikel Publik" breadcrumb="Member Area / Konten Publik / Artikel">
    <div className="space-y-7 overflow-x-hidden">
      <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
        <button onClick={() => router.push("/member-area/konten")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</button>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">ARTIKEL & BERITA</p>
            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Kelola Artikel Publik</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">Lihat artikel, status publikasi, kategori, dan konten unggulan PIINDUNG melalui satu pusat pengelolaan.</p>
          </div>
          <button disabled className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold text-muted-foreground opacity-60">Tahap Berikutnya</button>
        </div>
      </motion.section>

      {error && <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button onClick={loadArticles} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-destructive/20 px-3 font-semibold"><RefreshCcw className="h-4 w-4" /> Coba Lagi</button></div></div>}

      <motion.section variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Total Artikel", summary.total, FileText], ["Draft", summary.draft, FileText], ["Dipublikasikan", summary.published, Star], ["Tidak Dipublikasikan", summary.unpublished, FileText]].map(([label, value, Icon]) => <motion.div key={label as string} variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{label as string}</p><Icon className="h-5 w-5 text-[#15945b]" /></div><p className="mt-2 text-3xl font-bold text-foreground">{value as number}</p></motion.div>)}
      </motion.section>

      <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_170px_170px_auto]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul, excerpt, slug, author..." className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-[#15945b]" /></div>
          <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentTypeFilter)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">{contentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <select value={featured} onChange={(event) => setFeatured(event.target.value as FeaturedFilter)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">{featuredOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <button onClick={resetFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold"><RotateCcw className="h-4 w-4" /> Reset</button>
        </div>
      </motion.section>

      <motion.section variants={reveal} initial="hidden" animate="visible" className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5"><h2 className="text-lg font-bold">Direktori Artikel</h2><p className="text-sm text-muted-foreground">{filtered.length} artikel ditampilkan</p></div>
        {loading ? <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div> : articles.length === 0 ? <EmptyState title="Belum ada artikel terkelola" description="Data artikel dari scope articles belum tersedia." /> : filtered.length === 0 ? <EmptyState title="Tidak ada hasil" description="Ubah kata kunci atau reset filter untuk melihat artikel lain." /> : <><div className="hidden overflow-x-auto xl:block"><table className="w-full text-sm"><thead className="border-b border-border bg-muted/40 text-muted-foreground"><tr><th className="px-5 py-3 text-left font-medium">Artikel</th><th className="px-5 py-3 text-left font-medium">Jenis</th><th className="px-5 py-3 text-left font-medium">Status</th><th className="px-5 py-3 text-left font-medium">Featured</th><th className="px-5 py-3 text-left font-medium">Tanggal Publikasi</th><th className="px-5 py-3 text-left font-medium">Diperbarui</th><th className="px-5 py-3 text-right font-medium">Preview</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((article) => <tr key={article.id} className="align-top"><td className="px-5 py-4"><div className="flex gap-3"><Thumbnail article={article} /><div className="min-w-0"><p className="font-semibold text-foreground">{article.title}</p><p className="text-xs text-muted-foreground">/{article.slug}</p><p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{safeText(article.excerpt)}</p></div></div></td><td className="px-5 py-4 capitalize">{article.contentType}</td><td className="px-5 py-4"><Badge status={article.status} /></td><td className="px-5 py-4">{article.featured ? "Ya" : "Tidak"}</td><td className="px-5 py-4 text-muted-foreground">{formatDate(article.publishedAt)}</td><td className="px-5 py-4 text-muted-foreground">{formatDate(article.updatedAt)}</td><td className="px-5 py-4 text-right"><button onClick={() => setPreview(article)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 font-semibold"><Eye className="h-4 w-4" /> Lihat</button></td></tr>)}</tbody></table></div><div className="grid gap-4 p-4 xl:hidden">{filtered.map((article) => <article key={article.id} className="rounded-2xl border border-border p-4"><Thumbnail article={article} large /><h3 className="mt-4 text-lg font-bold">{article.title}</h3><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-3 py-1 capitalize">{article.contentType}</span><Badge status={article.status} />{article.featured && <span className="rounded-full bg-[#e6f7ee] px-3 py-1 font-semibold text-[#15945b] dark:bg-emerald-500/10">Featured</span>}</div><p className="mt-3 text-sm text-muted-foreground">Tanggal Publikasi: {formatDate(article.publishedAt)}</p><button onClick={() => setPreview(article)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border font-semibold"><Eye className="h-4 w-4" /> Preview</button></article>)}</div></>}
      </motion.section>

      <AnimatePresence>{preview && <motion.div initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><motion.div initial={prefersReducedMotion ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={prefersReducedMotion ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-3xl sm:rounded-[24px]"><div className="flex justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">Preview Read-only</p><h2 className="mt-2 text-2xl font-bold">{preview.title}</h2><p className="mt-1 text-sm text-muted-foreground">/{preview.slug}</p></div><button onClick={() => setPreview(null)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border"><X className="h-5 w-5" /></button></div><div className="mt-6"><Thumbnail article={preview} large /></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><PreviewField label="Excerpt" value={safeText(preview.excerpt, 400)} wide /><PreviewField label="Body" value={safeText(preview.body, 1800)} wide /><PreviewField label="Author" value={preview.authorName || "-"} /><PreviewField label="Jenis" value={preview.contentType} /><PreviewField label="Status" value={statusLabel(preview.status)} /><PreviewField label="Featured" value={preview.featured ? "Ya" : "Tidak"} /><PreviewField label="Published At" value={formatDate(preview.publishedAt)} /><PreviewField label="Created At" value={formatDate(preview.createdAt)} /><PreviewField label="Updated At" value={formatDate(preview.updatedAt)} /></div></motion.div></motion.div>}</AnimatePresence>
    </div>
  </MemberLayout>
}

function Badge({ status }: { status: ArticleStatus }) {
  return <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClassName(status))}>{statusLabel(status)}</span>
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="p-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><FileText className="h-7 w-7 text-muted-foreground" /></div><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>
}

function PreviewField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return <div className={cn("rounded-2xl border border-border bg-background p-4", wide && "sm:col-span-2")}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{value || "-"}</p></div>
}
