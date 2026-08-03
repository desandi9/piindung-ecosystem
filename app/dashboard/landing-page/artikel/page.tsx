"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Star,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { Article, ArticleContentType, ArticleStatus } from "@/lib/article-content"
import type { ArticleRetirementStatus } from "@/lib/article-retirement"

type ContentTypeFilter = "semua" | ArticleContentType
type StatusFilter = "semua" | ArticleStatus
type SortOrder = "terbaru" | "terlama"

const contentTypeOptions: { label: string; value: ContentTypeFilter }[] = [
  { label: "Semua Tipe", value: "semua" },
  { label: "Artikel", value: "artikel" },
  { label: "Berita", value: "berita" },
]
const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "Semua Status", value: "semua" },
  { label: "Draft", value: "draft" },
  { label: "Terbit", value: "published" },
  { label: "Tidak Dipublikasikan", value: "unpublished" },
]
const sortOptions: { label: string; value: SortOrder }[] = [
  { label: "Terbaru", value: "terbaru" },
  { label: "Terlama", value: "terlama" },
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
  if (status === "published") return "Terbit"
  if (status === "unpublished") return "Tidak Dipublikasikan"
  return "Draft"
}

function statusClassName(status: ArticleStatus) {
  if (status === "published") return "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-300"
  if (status === "draft") return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
  return "bg-muted text-muted-foreground"
}

function contentTypeLabel(type: ArticleContentType) {
  return type === "berita" ? "Berita" : "Artikel"
}

function deleteErrorMessage(status: number, message: string) {
  if (status === 401) return "Sesi berakhir. Silakan login kembali."
  if (status === 403) return "Anda tidak memiliki akses untuk menghapus artikel."
  if (status === 404) return "Artikel sudah tidak tersedia. Daftar artikel diperbarui."
  if (status === 409) return message || "Artikel belum aman untuk dihapus."
  return status >= 500 ? "Artikel gagal dihapus. Coba lagi nanti." : message || "Artikel gagal dihapus."
}

type SummaryKey = "total" | "draft" | "published" | "unpublished"
const summaryIcons: Array<[SummaryKey, string, LucideIcon]> = [
  ["total", "Total Artikel", FileText],
  ["draft", "Draft", FileText],
  ["published", "Terbit", Star],
  ["unpublished", "Tidak Dipublikasikan", FileText],
]

export default function ArticleDirectoryPage() {
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
  const [sort, setSort] = useState<SortOrder>("terbaru")
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [retirement, setRetirement] = useState<ArticleRetirementStatus | null>(null)
  const [retirementLoading, setRetirementLoading] = useState(false)
  const [retirementError, setRetirementError] = useState("")
  const ready = !isLoading && (user?.role === "super_admin_pc" || user?.role === "admin_pc")
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

  const loadArticles = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/articles?managed=1", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal mengambil artikel terkelola.")
      setArticles(Array.isArray(data.articles) ? data.articles : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil artikel terkelola.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/dashboard/landing-page/artikel")
    else if (!isLoading && user?.role !== "super_admin_pc" && user?.role !== "admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])

  useEffect(() => {
    if (ready) void loadArticles()
  }, [ready, loadArticles])

  const summary = useMemo<Record<SummaryKey, number>>(() => ({
    total: articles.length,
    draft: articles.filter((a) => a.status === "draft").length,
    published: articles.filter((a) => a.status === "published").length,
    unpublished: articles.filter((a) => a.status === "unpublished").length,
  }), [articles])

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim()
    const result = articles.filter((article) => {
      const matchesSearch = !term || [article.title, article.excerpt, article.slug, article.authorName].some((value) => value.toLowerCase().includes(term))
      return (
        matchesSearch &&
        (contentType === "semua" || article.contentType === contentType) &&
        (status === "semua" || article.status === status)
      )
    })
    result.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime()
      const dateB = new Date(b.publishedAt || b.createdAt).getTime()
      return sort === "terbaru" ? dateB - dateA : dateA - dateB
    })
    return result
  }, [articles, contentType, query, status, sort])

  const resetFilters = () => {
    setQuery("")
    setContentType("semua")
    setStatus("semua")
    setSort("terbaru")
  }
  const openDelete = (article: Article) => {
    setDeleteTarget(article)
    setDeleteConfirm("")
    setError("")
    setMessage("")
  }
  const closeDelete = () => {
    if (!deleting) {
      setDeleteTarget(null)
      setDeleteConfirm("")
    }
  }

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
      setError("Ketik judul atau slug artikel Terbit dengan tepat sebelum menghapus.")
      return
    }

    setDeleting(true)
    setError("")
    setMessage("")
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
    } finally {
      setDeleting(false)
    }
  }

  const hasActiveFilters = query.trim() !== "" || contentType !== "semua" || status !== "semua" || sort !== "terbaru"

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Artikel & Berita" breadcrumb="Kelola Landing Page / Artikel & Berita">
      <div className="space-y-7 overflow-x-hidden">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="relative overflow-hidden rounded-[28px] border border-[#dce8e2]/90 bg-gradient-to-br from-white via-[#f8fbf9] to-[#e7f7ef]/60 p-6 shadow-[0_18px_44px_rgba(9,43,32,0.07)] dark:border-white/10 dark:from-[#0d1e2d] dark:via-[#0d1e2d] dark:to-emerald-500/10 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
            <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-teal-200/35 blur-3xl dark:bg-teal-500/10" />
          </div>
          <div className="relative">
            <Link href="/dashboard/landing-page" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#6c7a89] transition hover:text-[#07965d] dark:text-slate-400">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Kelola Landing Page
            </Link>
            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#07965d] dark:text-emerald-300">ARTIKEL & BERITA</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#08213b] dark:text-white sm:text-4xl">Artikel & Berita</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6c7a89] dark:text-slate-300">Kelola artikel, berita, status publikasi, dan konten unggulan.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="/artikel" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-accent">
                  <ExternalLink className="h-4 w-4" /> Preview Artikel
                </a>
                <Link href="/dashboard/landing-page/artikel/baru" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(7,150,93,0.24)] transition hover:bg-[#107947] disabled:opacity-60">
                  <Plus className="h-4 w-4" /> Tulis Artikel
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {retirementLoading && <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">Memuat status konten lama...</div>}
        {retirementError && (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
            <span>Status konten lama tidak tersedia: {retirementError}</span>
            <button onClick={() => void loadRetirementStatus()} disabled={retirementLoading} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-700/20 px-4 font-semibold disabled:opacity-60">Coba Lagi</button>
          </div>
        )}
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
              <Link href="/dashboard/landing-page/artikel/migrasi" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-amber-700/20 px-4 font-semibold hover:bg-amber-500/10">Tinjau Konten Lama</Link>
            </div>
          </div>
        )}
        {retirement && retirement.fullyRetired && <div className="rounded-2xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-semibold text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-300">Migrasi Konten Lama Selesai</div>}

        {searchParams.get("saved") === "created" && <SuccessMessage>Artikel berhasil dibuat dan disimpan ke direktori.</SuccessMessage>}
        {searchParams.get("saved") === "updated" && <SuccessMessage>Perubahan artikel berhasil disimpan ke direktori.</SuccessMessage>}
        {message && <SuccessMessage>{message}</SuccessMessage>}
        {error && (
          <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button onClick={loadArticles} disabled={deleting} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-destructive/20 px-3 font-semibold disabled:opacity-60">
                <RefreshCcw className="h-4 w-4" /> Coba Lagi
              </button>
            </div>
          </div>
        )}

        <motion.section variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryIcons.map(([key, label, Icon]) => (
            <motion.div key={key} variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="h-5 w-5 text-[#15945b]" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{summary[key]}</p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_180px_130px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari judul artikel..."
                disabled={deleting}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-[#15945b] disabled:opacity-60"
              />
            </div>
            <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentTypeFilter)} disabled={deleting} className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b] disabled:opacity-60">
              {contentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} disabled={deleting} className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b] disabled:opacity-60">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} disabled={deleting} className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b] disabled:opacity-60">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button onClick={resetFilters} disabled={deleting || !hasActiveFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-40">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </motion.section>

        <motion.section variants={reveal} initial="hidden" animate="visible" className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="text-lg font-bold">Daftar Artikel</h2>
              <p className="text-sm text-muted-foreground">{filtered.length} artikel ditampilkan</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sort === "terbaru" ? "Terbaru" : "Terlama"}</span>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
          ) : articles.length === 0 ? (
            <EmptyState title="Belum ada artikel" description="Mulai tulis artikel pertama Anda dengan menekan tombol Tulis Artikel." actionHref="/dashboard/landing-page/artikel/baru" actionLabel="Tulis Artikel" />
          ) : filtered.length === 0 ? (
            <EmptyState title="Tidak ada hasil" description="Ubah kata kunci atau reset filter untuk melihat artikel lain." onReset={resetFilters} />
          ) : (
            <>
              <DesktopTable articles={filtered} disabled={deleting} onEdit={(article) => router.push(`/dashboard/landing-page/artikel/${article.id}/edit`)} onDelete={openDelete} />
              <MobileCards articles={filtered} disabled={deleting} onEdit={(article) => router.push(`/dashboard/landing-page/artikel/${article.id}/edit`)} onDelete={openDelete} />
            </>
          )}
        </motion.section>

        <AnimatePresence>{deleteTarget && <DeleteDialog article={deleteTarget} confirm={deleteConfirm} deleting={deleting} reduced={Boolean(prefersReducedMotion)} onConfirmText={setDeleteConfirm} onClose={closeDelete} onDelete={deleteArticle} />}</AnimatePresence>
      </div>
    </MemberLayout>
  )
}

function Thumbnail({ article, large = false }: { article: Article; large?: boolean }) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted", large ? "aspect-video w-full" : "h-16 w-20")}>
      {article.coverImage ? <Image src={article.coverImage} alt={article.title} fill sizes={large ? "(max-width: 768px) 100vw, 720px" : "80px"} className="object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
    </div>
  )
}

function DesktopTable({ articles, disabled, onEdit, onDelete }: { articles: Article[]; disabled: boolean; onEdit: (article: Article) => void; onDelete: (article: Article) => void }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-3 text-left font-medium">Artikel</th>
            <th className="px-5 py-3 text-left font-medium">Tipe</th>
            <th className="px-5 py-3 text-left font-medium">Penulis</th>
            <th className="px-5 py-3 text-left font-medium">Status</th>
            <th className="px-5 py-3 text-left font-medium">Tanggal</th>
            <th className="px-5 py-3 text-right font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {articles.map((article) => (
            <tr key={article.id} className="align-top transition hover:bg-muted/20">
              <td className="px-5 py-4">
                <div className="flex gap-3">
                  <Thumbnail article={article} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{article.title}</p>
                      {article.featured && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300"><Star className="h-3 w-3 fill-current" />Unggulan</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">/{article.slug}</p>
                    <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{safeText(article.excerpt)}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4"><span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">{contentTypeLabel(article.contentType)}</span></td>
              <td className="px-5 py-4 text-muted-foreground">{article.authorName || "-"}</td>
              <td className="px-5 py-4"><StatusBadge status={article.status} /></td>
              <td className="px-5 py-4 text-muted-foreground">{formatDate(article.publishedAt)}</td>
              <td className="px-5 py-4 text-right"><ActionGroup article={article} disabled={disabled} onEdit={onEdit} onDelete={onDelete} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileCards({ articles, disabled, onEdit, onDelete }: { articles: Article[]; disabled: boolean; onEdit: (article: Article) => void; onDelete: (article: Article) => void }) {
  return (
    <div className="grid gap-4 p-4 xl:hidden">
      {articles.map((article) => (
        <article key={article.id} className="rounded-2xl border border-border p-4">
          <Thumbnail article={article} large />
          <div className="mt-4 flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold leading-tight">{article.title}</h3>
            {article.featured && <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300"><Star className="h-3 w-3 fill-current" />Unggulan</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-3 py-1 capitalize">{contentTypeLabel(article.contentType)}</span>
            <StatusBadge status={article.status} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Penulis: {article.authorName || "-"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tanggal: {formatDate(article.publishedAt)}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <ActionGroup article={article} disabled={disabled} onEdit={onEdit} onDelete={onDelete} mobile />
          </div>
        </article>
      ))}
    </div>
  )
}

function ActionGroup({ article, disabled, mobile, onEdit, onDelete }: { article: Article; disabled: boolean; mobile?: boolean; onEdit: (article: Article) => void; onDelete: (article: Article) => void }) {
  const cls = mobile ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold" : "inline-flex min-h-10 items-center gap-2 rounded-xl px-3 font-semibold"
  const canPreview = article.status === "published"
  return (
    <div className={cn("gap-2", mobile ? "contents" : "flex items-center justify-end")}>
      {canPreview ? (
        <a href={`/artikel/${article.slug}`} target="_blank" rel="noopener noreferrer" className={cn(cls, "border border-border hover:bg-accent")}><Eye className="h-4 w-4" /> Preview</a>
      ) : (
        <span className={cn(cls, "cursor-not-allowed border border-border opacity-40")} title="Draft tidak memiliki preview publik"><Eye className="h-4 w-4" /> Preview</span>
      )}
      <button disabled={disabled} onClick={() => onEdit(article)} className={cn(cls, "bg-[#15945b] text-white hover:bg-[#107947] disabled:opacity-60")}><Pencil className="h-4 w-4" /> Edit</button>
      <button disabled={disabled} onClick={() => onDelete(article)} className={cn(cls, "border border-destructive/20 text-destructive hover:bg-destructive/10 disabled:opacity-60")}><Trash2 className="h-4 w-4" /> Hapus</button>
    </div>
  )
}

function StatusBadge({ status }: { status: ArticleStatus }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", statusClassName(status))}>{statusLabel(status)}</span>
}

function DeleteDialog({ article, confirm, deleting, reduced, onConfirmText, onClose, onDelete }: { article: Article; confirm: string; deleting: boolean; reduced: boolean; onConfirmText: (value: string) => void; onClose: () => void; onDelete: () => void }) {
  const published = article.status === "published"
  const canDelete = !deleting && (!published || confirm === article.title || confirm === article.slug)
  return (
    <motion.div initial={reduced ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? { opacity: 1 } : { opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-xl sm:rounded-[24px]">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">Hapus permanen</p>
            <h2 className="mt-2 text-2xl font-bold">Hapus artikel?</h2>
          </div>
          <button onClick={onClose} disabled={deleting} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border disabled:opacity-60"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-3 rounded-2xl border border-border bg-background p-4 text-sm">
          <p><span className="font-semibold">Judul:</span> {article.title}</p>
          <p><span className="font-semibold">Slug:</span> /{article.slug}</p>
          <p><span className="font-semibold">Status:</span> {statusLabel(article.status)}</p>
          <p><span className="font-semibold">Tanggal publikasi:</span> {formatDate(article.publishedAt)}</p>
        </div>
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">Penghapusan bersifat permanen. Gambar cover tidak ikut dihapus pada batch ini.</p>
        {published && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-semibold">Ketik tepat judul atau slug untuk menghapus artikel Terbit.</span>
            <input value={confirm} onChange={(event) => onConfirmText(event.target.value)} disabled={deleting} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-destructive disabled:opacity-60" />
          </label>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={deleting} className="min-h-11 rounded-xl border border-border px-5 font-semibold text-muted-foreground hover:bg-accent disabled:opacity-60">Batal</button>
          <button type="button" onClick={onDelete} disabled={!canDelete} className="min-h-11 rounded-xl bg-destructive px-5 font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">Ya, Hapus</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function SuccessMessage({ children }: { children: ReactNode }) {
  return <div role="status" className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{children}</div>
}

function EmptyState({ title, description, actionHref, actionLabel, onReset }: { title: string; description: string; actionHref?: string; actionLabel?: string; onReset?: () => void }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><FileText className="h-7 w-7 text-muted-foreground" /></div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {(actionHref && actionLabel) ? (
        <Link href={actionHref} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white hover:bg-[#107947]"><Plus className="h-4 w-4" /> {actionLabel}</Link>
      ) : onReset ? (
        <button onClick={onReset} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-accent"><RotateCcw className="h-4 w-4" /> Reset Filter</button>
      ) : null}
    </div>
  )
}
