"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowLeft, Eye, FileText, ImageIcon, Pencil, Plus, RefreshCcw, RotateCcw, Search, Star, Trash2, X, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { Article, ArticleContentType, ArticleStatus } from "@/lib/article-content"
import type { ArticleRetirementStatus } from "@/lib/article-retirement"

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

function deleteErrorMessage(status: number, message: string) {
  if (status === 401) return "Sesi berakhir. Silakan login kembali."
  if (status === 403) return "Anda tidak memiliki akses untuk menghapus artikel."
  if (status === 404) return "Artikel sudah tidak tersedia. Daftar artikel diperbarui."
  if (status === 409) return message || "Artikel belum aman untuk dihapus."
  return status >= 500 ? "Artikel gagal dihapus. Coba lagi nanti." : message || "Artikel gagal dihapus."
}

function Thumbnail({ article, large = false }: { article: Article; large?: boolean }) {
  return <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted", large ? "aspect-video w-full" : "h-16 w-20")}>
    {article.coverImage ? <Image src={article.coverImage} alt={article.title} fill sizes={large ? "(max-width: 768px) 100vw, 720px" : "80px"} className="object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
  </div>
}

export default function MemberArticleDirectoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [query, setQuery] = useState("")
  const [contentType, setContentType] = useState<ContentTypeFilter>("semua")
  const [status, setStatus] = useState<StatusFilter>("semua")
  const [featured, setFeatured] = useState<FeaturedFilter>("semua")
  const [preview, setPreview] = useState<Article | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [retirement, setRetirement] = useState<ArticleRetirementStatus | null>(null)
  const [retirementLoading, setRetirementLoading] = useState(false)
  const [retirementError, setRetirementError] = useState("")
  const ready = !isLoading && user?.role === "super_admin_pc"
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem

  const loadRetirementStatus = useCallback(async () => {
    setRetirementLoading(true)
    setRetirementError("")
    try {
      const response = await fetch("/api/articles/retirement-status", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.error) throw new Error(typeof data.error === "string" ? data.error : "Gagal memuat status retirement konten lama.")
      setRetirement(data as ArticleRetirementStatus)
    } catch (cause) {
      setRetirementError(cause instanceof Error ? cause.message : "Gagal memuat status retirement konten lama.")
    } finally {
      setRetirementLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ready) void loadRetirementStatus()
  }, [loadRetirementStatus, ready])

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
  const openDelete = (article: Article) => { setDeleteTarget(article); setDeleteConfirm(""); setError(""); setMessage("") }
  const closeDelete = () => { if (!deleting) { setDeleteTarget(null); setDeleteConfirm("") } }

  const deleteArticle = async () => {
    if (!deleteTarget || deleting) return
    const current = articles.find((article) => article.id === deleteTarget.id)
    if (!current || current.id !== deleteTarget.id) {
      setDeleteTarget(null)
      setMessage("Artikel sudah tidak tersedia. Daftar artikel diperbarui.")
      await loadArticles()
      return
    }
    if (current.status === "published" && deleteConfirm !== current.title && deleteConfirm !== current.slug) {
      setError("Ketik judul atau slug artikel Published dengan tepat sebelum menghapus.")
      return
    }

    setDeleting(true); setError(""); setMessage("")
    try {
      const response = await fetch(`/api/articles/${current.id}`, { method: "DELETE", credentials: "include" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const mapped = deleteErrorMessage(response.status, data.error)
        if (response.status === 404) {
          setDeleteTarget(null)
          setMessage(mapped)
          await loadArticles()
          return
        }
        setError(mapped)
        return
      }
      setDeleteTarget(null)
      setDeleteConfirm("")
      setMessage(`Artikel "${current.title}" berhasil dihapus.`)
      await loadArticles()
    } catch {
      setError("Artikel gagal dihapus. Coba lagi nanti.")
    } finally { setDeleting(false) }
  }

  if (!ready) return <div className="min-h-screen bg-background" />

  return <MemberLayout title="Artikel Publik" breadcrumb="Member Area / Konten Publik / Artikel">
    <div className="space-y-7 overflow-x-hidden">
      <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
        <button onClick={() => router.push("/member-area/konten")} disabled={deleting} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"><ArrowLeft className="h-4 w-4" /> Kembali</button>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">ARTIKEL & BERITA</p>
            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Kelola Artikel Publik</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">Lihat artikel, status publikasi, kategori, dan konten unggulan PIINDUNG melalui satu pusat pengelolaan.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={() => router.push("/member-area/konten/artikel/baru")} disabled={deleting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white transition hover:bg-[#107947] disabled:opacity-60"><Plus className="h-4 w-4" /> Tambah Artikel</button>
          </div>
        </div>
      </motion.section>

      {retirementLoading && <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">Memuat status retirement konten lama...</div>}
      {retirementError && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between"><span>Status konten lama tidak tersedia: {retirementError}</span><button onClick={() => void loadRetirementStatus()} disabled={retirementLoading} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-700/20 px-4 font-semibold disabled:opacity-60">Coba Lagi</button></div>}
      {retirement && !retirement.fullyRetired && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Konten lama masih memerlukan penyelesaian</p>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-4">
                  <span>Aktif: <strong>{retirement.activeLegacyCount}</strong></span>
                  <span>Belum migrasi: <strong>{retirement.unmigratedCount}</strong></span>
                  <span>Belum diarsipkan: <strong>{retirement.migratedNotArchivedCount}</strong></span>
                  <span>Invalid/konflik: <strong>{retirement.invalidCount}</strong></span>
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/member-area/konten/artikel/migrasi")} disabled={deleting} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-amber-700/20 px-4 font-semibold hover:bg-amber-500/10 disabled:opacity-60">Tinjau Konten Lama</button>
          </div>
        </div>
      )}
      {retirement && retirement.fullyRetired && <div className="rounded-2xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-semibold text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-300">Migrasi Konten Lama Selesai</div>}

      {searchParams.get("saved") === "created" && <SuccessMessage>Artikel berhasil dibuat dan disimpan ke direktori.</SuccessMessage>}
      {searchParams.get("saved") === "updated" && <SuccessMessage>Perubahan artikel berhasil disimpan ke direktori.</SuccessMessage>}
      {message && <SuccessMessage>{message}</SuccessMessage>}
      {error && <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button onClick={loadArticles} disabled={deleting} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-destructive/20 px-3 font-semibold disabled:opacity-60"><RefreshCcw className="h-4 w-4" /> Coba Lagi</button></div></div>}

      <motion.section variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Total Artikel", summary.total, FileText], ["Draft", summary.draft, FileText], ["Dipublikasikan", summary.published, Star], ["Tidak Dipublikasikan", summary.unpublished, FileText]].map(([label, value, Icon]) => <motion.div key={label as string} variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{label as string}</p><Icon className="h-5 w-5 text-[#15945b]" /></div><p className="mt-2 text-3xl font-bold text-foreground">{value as number}</p></motion.div>)}
      </motion.section>

      <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_170px_170px_auto]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul, excerpt, slug, author..." disabled={deleting} className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-[#15945b] disabled:opacity-60" /></div>
          <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentTypeFilter)} disabled={deleting} className="h-11 rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-60">{contentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} disabled={deleting} className="h-11 rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-60">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <select value={featured} onChange={(event) => setFeatured(event.target.value as FeaturedFilter)} disabled={deleting} className="h-11 rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-60">{featuredOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <button onClick={resetFilters} disabled={deleting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-60"><RotateCcw className="h-4 w-4" /> Reset</button>
        </div>
      </motion.section>

      <motion.section variants={reveal} initial="hidden" animate="visible" className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5"><h2 className="text-lg font-bold">Direktori Artikel</h2><p className="text-sm text-muted-foreground">{filtered.length} artikel ditampilkan</p></div>
        {loading ? <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div> : articles.length === 0 ? <EmptyState title="Belum ada artikel terkelola" description="Data artikel dari scope articles belum tersedia." /> : filtered.length === 0 ? <EmptyState title="Tidak ada hasil" description="Ubah kata kunci atau reset filter untuk melihat artikel lain." /> : <><DesktopTable articles={filtered} disabled={deleting} onPreview={setPreview} onEdit={(article) => router.push(`/member-area/konten/artikel/${article.id}/edit`)} onDelete={openDelete} /><MobileCards articles={filtered} disabled={deleting} onPreview={setPreview} onEdit={(article) => router.push(`/member-area/konten/artikel/${article.id}/edit`)} onDelete={openDelete} /></>}
      </motion.section>

      <AnimatePresence>{preview && <PreviewDialog article={preview} reduced={Boolean(prefersReducedMotion)} onClose={() => setPreview(null)} />}</AnimatePresence>
      <AnimatePresence>{deleteTarget && <DeleteDialog article={deleteTarget} confirm={deleteConfirm} deleting={deleting} reduced={Boolean(prefersReducedMotion)} onConfirmText={setDeleteConfirm} onClose={closeDelete} onDelete={deleteArticle} />}</AnimatePresence>
    </div>
  </MemberLayout>
}

function DesktopTable({ articles, disabled, onPreview, onEdit, onDelete }: { articles: Article[]; disabled: boolean; onPreview: (article: Article) => void; onEdit: (article: Article) => void; onDelete: (article: Article) => void }) {
  return <div className="hidden overflow-x-auto xl:block"><table className="w-full text-sm"><thead className="border-b border-border bg-muted/40 text-muted-foreground"><tr><th className="px-5 py-3 text-left font-medium">Artikel</th><th className="px-5 py-3 text-left font-medium">Jenis</th><th className="px-5 py-3 text-left font-medium">Status</th><th className="px-5 py-3 text-left font-medium">Featured</th><th className="px-5 py-3 text-left font-medium">Tanggal Publikasi</th><th className="px-5 py-3 text-left font-medium">Diperbarui</th><th className="px-5 py-3 text-right font-medium">Aksi</th></tr></thead><tbody className="divide-y divide-border">{articles.map((article) => <tr key={article.id} className="align-top"><td className="px-5 py-4"><div className="flex gap-3"><Thumbnail article={article} /><div className="min-w-0"><p className="font-semibold text-foreground">{article.title}</p><p className="text-xs text-muted-foreground">/{article.slug}</p><p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{safeText(article.excerpt)}</p></div></div></td><td className="px-5 py-4 capitalize">{article.contentType}</td><td className="px-5 py-4"><Badge status={article.status} /></td><td className="px-5 py-4">{article.featured ? "Ya" : "Tidak"}</td><td className="px-5 py-4 text-muted-foreground">{formatDate(article.publishedAt)}</td><td className="px-5 py-4 text-muted-foreground">{formatDate(article.updatedAt)}</td><td className="px-5 py-4 text-right"><ActionGroup article={article} disabled={disabled} onPreview={onPreview} onEdit={onEdit} onDelete={onDelete} /></td></tr>)}</tbody></table></div>
}

function MobileCards({ articles, disabled, onPreview, onEdit, onDelete }: { articles: Article[]; disabled: boolean; onPreview: (article: Article) => void; onEdit: (article: Article) => void; onDelete: (article: Article) => void }) {
  return <div className="grid gap-4 p-4 xl:hidden">{articles.map((article) => <article key={article.id} className="rounded-2xl border border-border p-4"><Thumbnail article={article} large /><h3 className="mt-4 text-lg font-bold">{article.title}</h3><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-3 py-1 capitalize">{article.contentType}</span><Badge status={article.status} />{article.featured && <span className="rounded-full bg-[#e6f7ee] px-3 py-1 font-semibold text-[#15945b] dark:bg-emerald-500/10">Featured</span>}</div><p className="mt-3 text-sm text-muted-foreground">Tanggal Publikasi: {formatDate(article.publishedAt)}</p><div className="mt-4 grid gap-2 sm:grid-cols-3"><ActionGroup article={article} disabled={disabled} onPreview={onPreview} onEdit={onEdit} onDelete={onDelete} mobile /></div></article>)}</div>
}

function ActionGroup({ article, disabled, mobile, onPreview, onEdit, onDelete }: { article: Article; disabled: boolean; mobile?: boolean; onPreview: (article: Article) => void; onEdit: (article: Article) => void; onDelete: (article: Article) => void }) {
  const className = mobile ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold" : "inline-flex min-h-10 items-center gap-2 rounded-xl px-3 font-semibold"
  return <div className={cn("gap-2", mobile ? "contents" : "flex items-center justify-end")}><button disabled={disabled} onClick={() => onPreview(article)} className={cn(className, "border border-border hover:bg-accent disabled:opacity-60")}><Eye className="h-4 w-4" /> Preview</button><button disabled={disabled} onClick={() => onEdit(article)} className={cn(className, "bg-[#15945b] text-white hover:bg-[#107947] disabled:opacity-60")}><Pencil className="h-4 w-4" /> Edit</button><button disabled={disabled} onClick={() => onDelete(article)} className={cn(className, "border border-destructive/20 text-destructive hover:bg-destructive/10 disabled:opacity-60")}><Trash2 className="h-4 w-4" /> Hapus</button></div>
}

function DeleteDialog({ article, confirm, deleting, reduced, onConfirmText, onClose, onDelete }: { article: Article; confirm: string; deleting: boolean; reduced: boolean; onConfirmText: (value: string) => void; onClose: () => void; onDelete: () => void }) {
  const published = article.status === "published"
  const canDelete = !deleting && (!published || confirm === article.title || confirm === article.slug)
  return <motion.div initial={reduced ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? { opacity: 1 } : { opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><motion.div initial={reduced ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-xl sm:rounded-[24px]"><div className="flex justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">Hapus permanen</p><h2 className="mt-2 text-2xl font-bold">Hapus artikel?</h2></div><button onClick={onClose} disabled={deleting} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border disabled:opacity-60"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-3 rounded-2xl border border-border bg-background p-4 text-sm"><p><span className="font-semibold">Judul:</span> {article.title}</p><p><span className="font-semibold">Slug:</span> /{article.slug}</p><p><span className="font-semibold">Status:</span> {statusLabel(article.status)}</p><p><span className="font-semibold">Tanggal publikasi:</span> {formatDate(article.publishedAt)}</p></div><p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">Penghapusan bersifat permanen. Gambar cover tidak ikut dihapus pada batch ini.</p>{published && <label className="mt-4 block space-y-2"><span className="text-sm font-semibold">Ketik tepat judul atau slug untuk menghapus artikel Published.</span><input value={confirm} onChange={(event) => onConfirmText(event.target.value)} disabled={deleting} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-destructive disabled:opacity-60" /></label>}<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end"><button onClick={onClose} disabled={deleting} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-accent disabled:opacity-60">Batal</button><button onClick={onDelete} disabled={!canDelete} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"><Trash2 className="h-4 w-4" />{deleting ? "Menghapus..." : "Hapus Permanen"}</button></div></motion.div></motion.div>
}

function PreviewDialog({ article, reduced, onClose }: { article: Article; reduced: boolean; onClose: () => void }) {
  return <motion.div initial={reduced ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? { opacity: 1 } : { opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><motion.div initial={reduced ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-3xl sm:rounded-[24px]"><div className="flex justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">Preview Read-only</p><h2 className="mt-2 text-2xl font-bold">{article.title}</h2><p className="mt-1 text-sm text-muted-foreground">/{article.slug}</p></div><button onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border"><X className="h-5 w-5" /></button></div><div className="mt-6"><Thumbnail article={article} large /></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><PreviewField label="Excerpt" value={safeText(article.excerpt, 400)} wide /><PreviewField label="Body" value={safeText(article.body, 1800)} wide /><PreviewField label="Author" value={article.authorName || "-"} /><PreviewField label="Jenis" value={article.contentType} /><PreviewField label="Status" value={statusLabel(article.status)} /><PreviewField label="Featured" value={article.featured ? "Ya" : "Tidak"} /><PreviewField label="Published At" value={formatDate(article.publishedAt)} /><PreviewField label="Created At" value={formatDate(article.createdAt)} /><PreviewField label="Updated At" value={formatDate(article.updatedAt)} /></div></motion.div></motion.div>
}

function SuccessMessage({ children }: { children: ReactNode }) {
  return <div role="status" className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{children}</div>
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
