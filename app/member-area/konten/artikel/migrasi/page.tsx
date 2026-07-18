"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, FileText, Info, PlayCircle, RefreshCcw, RotateCcw, Search, ShieldAlert, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { LegacyArticleMigrationPreview, LegacyArticlePreviewItem } from "@/lib/article-legacy-preview"

type Filter = "semua" | "ready" | "invalid" | "conflict" | "migrated"

function statusColor(status: string) {
  if (status === "published") return "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-300"
  if (status === "draft") return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
  return "bg-muted text-muted-foreground"
}

export default function ArticleMigrationPreviewPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<LegacyArticleMigrationPreview | null>(null)
  const [filter, setFilter] = useState<Filter>("semua")
  const [query, setQuery] = useState("")
  const [detail, setDetail] = useState<LegacyArticlePreviewItem | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [results, setResults] = useState<Array<{ legacyRecordKey: string; title?: string; status: string; articleSlug?: string; reason?: string }>>([])
  const ready = !isLoading && user?.role === "super_admin_pc"

  const load = async () => {
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/articles/migration-preview", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memuat pratinjau migrasi.")
      setPreview(data.migration)
      setSelected([])
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat pratinjau migrasi.") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/member-area/konten/artikel/migrasi")
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])

  useEffect(() => { if (ready) void load() }, [ready])

  const filtered = useMemo(() => {
    if (!preview) return []
    const normalized = query.toLowerCase().trim()
    return preview.candidates.filter((item) => {
      const isConflict = item.issues.some(i => i.includes("duplikat") || i.includes("digunakan"))
      const isMigrated = item.issues.some(i => i.includes("Kemungkinan sudah dimigrasi"))
      const isInvalid = !isConflict && !isMigrated && (item.article === null || item.issues.length > 0)
      const isReady = item.article !== null && item.issues.length === 0

      if (filter === "ready" && !isReady) return false
      if (filter === "invalid" && !isInvalid) return false
      if (filter === "conflict" && !isConflict) return false
      if (filter === "migrated" && !isMigrated) return false

      if (normalized) {
        const title = item.article?.title || ""
        const ref = item.legacyReference || ""
        if (!title.toLowerCase().includes(normalized) && !ref.toLowerCase().includes(normalized)) return false
      }
      return true
    })
  }, [filter, preview, query])

  const summary = useMemo(() => {
    if (!preview) return null
    return {
      total: preview.candidates.length,
      ready: preview.candidates.filter((item) => item.article !== null && item.issues.length === 0).length,
      conflict: preview.candidates.filter((item) => item.issues.some(i => i.includes("duplikat") || i.includes("digunakan"))).length,
      migrated: preview.candidates.filter((item) => item.issues.some(i => i.includes("Kemungkinan sudah dimigrasi"))).length,
      invalid: preview.candidates.filter((item) => {
        const hasConflictOrMigrated = item.issues.some(i => i.includes("duplikat") || i.includes("digunakan") || i.includes("Kemungkinan sudah dimigrasi"))
        return !hasConflictOrMigrated && (item.article === null || item.issues.length > 0)
      }).length,
    }
  }, [preview])

  const readyKeys = preview?.candidates.filter((item) => item.article !== null && item.issues.length === 0).map((item) => item.legacyReference) ?? []
  const toggleSelected = (key: string) => setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  const migrateSelected = async () => {
    if (selected.length === 0 || migrating) return
    setMigrating(true); setError("")
    try {
      const response = await fetch("/api/articles/migrate-legacy", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ legacyRecordKeys: selected, confirm: true }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal menjalankan migrasi.")
      setResults(Array.isArray(data.results) ? data.results : [])
      setConfirmOpen(false)
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menjalankan migrasi.") }
    finally { setMigrating(false) }
  }

  if (!ready) return <div className="min-h-screen bg-background" />

  return <MemberLayout title="Migrasi Artikel" breadcrumb="Member Area / Konten Publik / Artikel / Migrasi">
    <div className="space-y-7 overflow-x-hidden">
      <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
        <button onClick={() => router.push("/member-area/konten/artikel")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</button>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">MIGRASI DATA</p>
            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Pratinjau Migrasi Konten Lama</h1>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">Tinjau usulan migrasi dari tabel <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">homepage-content</code> ke tabel <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">articles</code> yang baru. Fase ini hanya membaca (read-only) dan tidak mengubah data apa pun.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row"><button onClick={() => setSelected(readyKeys)} disabled={readyKeys.length === 0 || migrating} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-50">Pilih Semua yang Siap</button><button onClick={() => setConfirmOpen(true)} disabled={selected.length === 0 || migrating} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white disabled:opacity-50"><PlayCircle className="h-4 w-4" /> Migrasikan Konten Terpilih ({selected.length})</button></div>
        </div>
      </motion.section>

      {error && <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button onClick={load} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-destructive/20 px-3 font-semibold"><RefreshCcw className="h-4 w-4" /> Coba Lagi</button></div></div>}

      <motion.section variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Konten Lama", summary?.total ?? 0, FileText, "text-[#0b1f33]"], 
          ["Siap Dimigrasikan", summary?.ready ?? 0, CheckCircle2, "text-[#15945b]"], 
          ["Memerlukan Perbaikan", summary?.invalid ?? 0, AlertCircle, "text-amber-600"], 
          ["Konflik Slug", summary?.conflict ?? 0, ShieldAlert, "text-destructive"],
          ["Kemungkinan Sudah Dimigrasi", summary?.migrated ?? 0, Info, "text-sky-600"]
        ].map(([label, value, Icon, colorClass]) => <motion.div key={label as string} variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{label as string}</p><Icon className={cn("h-5 w-5", colorClass)} /></div><p className="mt-2 text-3xl font-bold text-foreground">{value as number}</p></motion.div>)}
      </motion.section>

      <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-800 dark:text-sky-300">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-2">
            <p className="font-semibold">Rekomendasi Strategi Migrasi</p>
            <p>Untuk menghindari penggandaan data, migrasi mendatang sebaiknya menyimpan <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-[11px] dark:bg-white/10">legacySourceId</code> secara internal di artikel baru tanpa memaparkannya ke API publik, atau menggunakan tabel pemetaan (mapping table) terpisah.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_auto]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari berdasarkan judul atau ID sumber..." className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-[#15945b]" /></div>
          <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="semua">Semua Status</option>
            <option value="ready">Siap Dimigrasikan</option>
            <option value="invalid">Memerlukan Perbaikan</option>
            <option value="conflict">Konflik Slug</option>
            <option value="migrated">Kemungkinan Sudah Dimigrasi</option>
          </select>
          <button onClick={() => { setQuery(""); setFilter("semua") }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold"><RotateCcw className="h-4 w-4" /> Reset</button>
        </div>
      </motion.section>

      <motion.section variants={reveal} initial="hidden" animate="visible" className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5"><h2 className="text-lg font-bold">Pratinjau Migrasi</h2><p className="text-sm text-muted-foreground">{filtered.length} kandidat ditampilkan</p></div>
        {results.length > 0 && <div className="border-b border-border p-5"><h3 className="font-semibold">Hasil Migrasi</h3><div className="mt-3 space-y-2">{results.map((result) => <div key={result.legacyRecordKey} className="rounded-xl border border-border p-3 text-sm"><span className="font-mono text-xs">{result.legacyRecordKey}</span> — <span className="font-semibold">{result.status}</span>{result.articleSlug && <span> → /{result.articleSlug}</span>}{result.reason && <span className="text-muted-foreground">: {result.reason}</span>}</div>)}</div></div>}
        {loading ? <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div> : !preview ? <EmptyState title="Pratinjau Tidak Tersedia" description="Gagal memuat pratinjau migrasi." /> : filtered.length === 0 ? <EmptyState title="Tidak ada hasil" description="Ubah kata kunci atau reset filter untuk melihat kandidat lain." /> : <><DesktopTable items={filtered} selected={selected} onToggle={toggleSelected} onView={setDetail} /><MobileCards items={filtered} selected={selected} onToggle={toggleSelected} onView={setDetail} /></>}
      </motion.section>

      <AnimatePresence>{detail && <DetailDialog item={detail} reduced={Boolean(prefersReducedMotion)} onClose={() => setDetail(null)} />}{confirmOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><div className="w-full rounded-t-[24px] bg-card p-6 sm:max-w-lg sm:rounded-[24px]"><h2 className="text-2xl font-bold">Konfirmasi Migrasi</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Migrasikan {selected.length} konten terpilih? Record legacy tetap tersimpan dan tidak akan diubah atau dihapus.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end"><button onClick={() => setConfirmOpen(false)} disabled={migrating} className="min-h-11 rounded-xl border border-border px-5 font-semibold">Batal</button><button onClick={migrateSelected} disabled={migrating} className="min-h-11 rounded-xl bg-[#15945b] px-5 font-semibold text-white disabled:opacity-50">{migrating ? "Memigrasikan..." : "Ya, Migrasikan"}</button></div></div></motion.div>}</AnimatePresence>
    </div>
  </MemberLayout>
}

function StatusBadge({ issues }: { issues: string[] }) {
  if (issues.length === 0) return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7ee] px-2.5 py-1 text-[11px] font-semibold text-[#15945b] dark:bg-emerald-500/10"><CheckCircle2 className="h-3.5 w-3.5" /> Siap</span>
  if (issues.some(i => i.includes("duplikat") || i.includes("digunakan"))) return <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive"><ShieldAlert className="h-3.5 w-3.5" /> Konflik</span>
  if (issues.some(i => i.includes("Kemungkinan sudah dimigrasi"))) return <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400"><Info className="h-3.5 w-3.5" /> Telah Dimigrasi</span>
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400"><AlertCircle className="h-3.5 w-3.5" /> Invalid</span>
}

function DesktopTable({ items, selected, onToggle, onView }: { items: LegacyArticlePreviewItem[]; selected: string[]; onToggle: (key: string) => void; onView: (item: LegacyArticlePreviewItem) => void }) {
  return <div className="hidden overflow-x-auto xl:block"><table className="w-full text-sm"><thead className="border-b border-border bg-muted/40 text-muted-foreground"><tr><th className="px-5 py-3 text-left font-medium">Pilih</th><th className="px-5 py-3 text-left font-medium">Konten Lama</th><th className="px-5 py-3 text-left font-medium">Jenis</th><th className="px-5 py-3 text-left font-medium">Status Lama</th><th className="px-5 py-3 text-left font-medium">Slug Usulan</th><th className="px-5 py-3 text-left font-medium">Status Migrasi</th><th className="px-5 py-3 text-left font-medium">Masalah</th><th className="px-5 py-3 text-right font-medium">Detail</th></tr></thead><tbody className="divide-y divide-border">{items.map((item) => <tr key={item.legacyReference} className="align-top"><td className="px-5 py-4"><input type="checkbox" checked={selected.includes(item.legacyReference)} disabled={item.article === null || item.issues.length > 0} onChange={() => onToggle(item.legacyReference)} className="h-4 w-4 accent-[#15945b]" aria-label={`Pilih ${item.article?.title || item.legacyReference}`} /></td><td className="px-5 py-4"><div className="min-w-0 max-w-[280px]"><p className="truncate font-semibold text-foreground" title={item.article?.title || "-"}>{item.article?.title || <span className="italic text-muted-foreground">Tanpa Judul</span>}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">ID: {item.legacyReference}</p></div></td><td className="px-5 py-4 capitalize">{item.article?.contentType || "-"}</td><td className="px-5 py-4"><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize", statusColor(item.article?.status || ""))}>{item.article?.status || "Unknown"}</span></td><td className="px-5 py-4"><span className="font-mono text-xs">{item.slug ? `/${item.slug}` : "-"}</span></td><td className="px-5 py-4"><StatusBadge issues={item.issues} /></td><td className="px-5 py-4"><div className="max-w-[240px]">{item.issues.length === 0 ? <span className="text-muted-foreground">-</span> : <ul className="list-inside list-disc space-y-1 text-xs text-destructive">{item.issues.slice(0, 2).map((issue, i) => <li key={i} className="line-clamp-2">{issue}</li>)}{item.issues.length > 2 && <li className="text-muted-foreground">+{item.issues.length - 2} masalah lain</li>}</ul>}</div></td><td className="px-5 py-4 text-right"><button onClick={() => onView(item)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border px-3 font-semibold hover:bg-accent"><Eye className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
}

function MobileCards({ items, selected, onToggle, onView }: { items: LegacyArticlePreviewItem[]; selected: string[]; onToggle: (key: string) => void; onView: (item: LegacyArticlePreviewItem) => void }) {
  return <div className="grid gap-4 p-4 xl:hidden">{items.map((item) => <article key={item.legacyReference} className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={selected.includes(item.legacyReference)} disabled={item.article === null || item.issues.length > 0} onChange={() => onToggle(item.legacyReference)} className="h-4 w-4 accent-[#15945b]" /> Pilih</label><StatusBadge issues={item.issues} /><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{item.article?.contentType || "Unknown"}</span></div><h3 className="mt-4 text-lg font-bold">{item.article?.title || <span className="italic text-muted-foreground">Tanpa Judul</span>}</h3><p className="mt-1 font-mono text-[10px] text-muted-foreground">ID: {item.legacyReference}</p><div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm"><div className="space-y-1"><p className="text-xs text-muted-foreground">Status Lama</p><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", statusColor(item.article?.status || ""))}>{item.article?.status || "-"}</span></div><div className="space-y-1"><p className="text-xs text-muted-foreground">Slug Usulan</p><p className="truncate font-mono text-xs">{item.slug ? `/${item.slug}` : "-"}</p></div></div>{item.issues.length > 0 && <div className="mt-4 rounded-xl bg-destructive/10 p-3"><ul className="list-inside list-disc space-y-1 text-xs text-destructive">{item.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></div>}<button onClick={() => onView(item)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border font-semibold hover:bg-accent"><Eye className="h-4 w-4" /> Lihat Detail Mapping</button></article>)}</div>
}

function DetailDialog({ item, reduced, onClose }: { item: LegacyArticlePreviewItem; reduced: boolean; onClose: () => void }) {
  return <motion.div initial={reduced ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? { opacity: 1 } : { opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><motion.div initial={reduced ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-3xl sm:rounded-[24px]"><div className="flex justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">Detail Mapping</p><h2 className="mt-2 text-2xl font-bold">{item.article?.title || "Data Tidak Lengkap"}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">Source ID: {item.legacyReference}</p></div><button onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border"><X className="h-5 w-5" /></button></div><div className="mt-6 flex flex-wrap gap-3"><StatusBadge issues={item.issues} /><span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Legacy Status: {item.article?.status || "Unknown"}</span></div>{item.issues.length > 0 && <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4"><h3 className="text-sm font-semibold text-destructive">Isu Migrasi Ditemukan</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-destructive">{item.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></div>}<div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Usulan Slug</p><p className="mt-2 font-mono text-sm leading-6 text-foreground">{item.slug || "-"}</p></div><div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Usulan Excerpt & Body</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{item.article?.excerpt || "-"}</p></div><div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Usulan Jenis</p><p className="mt-2 text-sm capitalize leading-6 text-foreground">{item.article?.contentType || "-"}</p></div><div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Usulan Author</p><p className="mt-2 text-sm leading-6 text-foreground">{item.article?.authorName || <span className="italic text-muted-foreground">Sistem (Fallback)</span>}</p></div><div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Usulan Gambar Cover</p><div className="mt-2 break-all font-mono text-xs leading-6 text-muted-foreground">{item.article?.coverImage || "-"}</div></div></div></motion.div></motion.div>
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="p-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><FileText className="h-7 w-7 text-muted-foreground" /></div><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>
}
