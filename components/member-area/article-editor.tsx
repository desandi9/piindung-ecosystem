"use client"

import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, ImageIcon, Save, Star, Trash2, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { fadeUp } from "@/lib/motion"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import { generateArticleSlug, isSafeArticleImage, normalizeArticleSlug } from "@/lib/article-content-rules"
import type { Article, ArticleContentType, ArticleStatus } from "@/lib/article-content"

export type ArticleEditorMode = "create" | "edit"

type ArticleFormValues = {
  title: string
  slug: string
  excerpt: string
  body: string
  contentType: ArticleContentType
  coverImage: string
  authorName: string
  status: ArticleStatus
  featured: boolean
  position: string
  publishedAt: string
}

type ArticleEditorProps = {
  mode: ArticleEditorMode
  article?: Article | null
  loading?: boolean
  loadError?: string
  onRetry?: () => void
}

type SaveIntent = "normal" | "draft" | "publish"

function toLocalDateTime(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function createForm(userName: string, article?: Article | null): ArticleFormValues {
  if (article) return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    body: article.body,
    contentType: article.contentType,
    coverImage: article.coverImage,
    authorName: article.authorName,
    status: article.status,
    featured: article.featured,
    position: String(article.position),
    publishedAt: toLocalDateTime(article.publishedAt),
  }

  return {
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    contentType: "artikel",
    coverImage: "",
    authorName: userName,
    status: "draft",
    featured: false,
    position: "1",
    publishedAt: "",
  }
}

function snapshot(form: ArticleFormValues) {
  return JSON.stringify(form)
}

function validateForm(form: ArticleFormValues, existing?: Article | null) {
  if (!form.title.trim()) return "Judul wajib diisi."
  if (!form.slug.trim()) return "Slug wajib diisi."
  if (!form.excerpt.trim()) return "Ringkasan wajib diisi."
  if (!form.body.trim()) return "Isi artikel wajib diisi."
  if (!form.authorName.trim()) return "Nama penulis wajib diisi."
  if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(form.authorName)) return "Nama penulis mengandung karakter tidak valid."
  const position = Number(form.position)
  if (!Number.isSafeInteger(position) || position < 1) return "Posisi harus berupa bilangan bulat positif."
  if (form.coverImage && !isSafeArticleImage(form.coverImage)) return "Gambar cover harus berupa URL HTTP(S) yang aman atau path /public."
  if (form.publishedAt && Number.isNaN(new Date(form.publishedAt).getTime())) return "Tanggal publikasi tidak valid."
  if (form.status === "published" && !form.publishedAt && !existing?.publishedAt) return "Tanggal publikasi wajib diisi untuk artikel Published."
  return ""
}

function articleErrorMessage(status: number, message: string) {
  if (status === 401) return "Sesi berakhir. Silakan login kembali."
  if (status === 403) return "Anda tidak memiliki akses untuk mengubah artikel."
  if (status === 404) return "Artikel tidak ditemukan. Muat ulang halaman untuk mencoba lagi."
  return message || "Artikel gagal disimpan."
}

export function ArticleEditor({ mode, article, loading = false, loadError = "", onRetry }: ArticleEditorProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const reduced = useReducedMotion()
  const reveal = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const [form, setForm] = useState<ArticleFormValues | null>(null)
  const [baseline, setBaseline] = useState("")
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [error, setError] = useState("")
  const [slugError, setSlugError] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const allowNavigation = useRef(false)
  const ready = !isLoading && user?.role === "super_admin_pc"
  const isDirty = Boolean(form && baseline && snapshot(form) !== baseline && !allowNavigation.current)

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/login?next=${mode === "create" ? "/member-area/konten/artikel/baru" : `/member-area/konten/artikel/${article?.id || ""}/edit`}`)
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [article?.id, isLoading, mode, router, user])

  useEffect(() => {
    if (!ready || loading || loadError || form) return
    const initial = createForm(user?.name || "", article)
    setForm(initial)
    setBaseline(snapshot(initial))
  }, [article, form, loadError, loading, ready, user?.name])

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ""
    }
    const guardInternalLinks = (event: MouseEvent) => {
      if (!isDirty || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const link = target?.closest("a")
      if (!link || link.target === "_blank" || !link.href.startsWith(window.location.origin)) return
      const nextUrl = new URL(link.href)
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return
      if (!window.confirm("Perubahan belum disimpan. Tinggalkan halaman ini?")) {
        event.preventDefault()
        return
      }
      allowNavigation.current = true
      event.preventDefault()
      router.push(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
    }
    window.addEventListener("beforeunload", beforeUnload)
    document.addEventListener("click", guardInternalLinks)
    return () => {
      window.removeEventListener("beforeunload", beforeUnload)
      document.removeEventListener("click", guardInternalLinks)
    }
  }, [isDirty, router])

  const update = <K extends keyof ArticleFormValues>(field: K, value: ArticleFormValues[K]) => {
    setForm((current) => {
      if (!current) return current
      const next = { ...current, [field]: value }
      if (field === "title" && !slugTouched) next.slug = generateArticleSlug(String(value))
      return next
    })
    if (field === "slug") setSlugError("")
    setError(""); setMessage("")
  }

  const navigateAway = (href = "/member-area/konten/artikel") => {
    if (isDirty && !window.confirm("Perubahan belum disimpan. Tinggalkan halaman ini?")) return
    allowNavigation.current = true
    router.push(href)
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !form) return
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setError("File cover harus berupa JPG, JPEG, atau PNG.")
      event.target.value = ""
      return
    }
    setError(""); setMessage(""); setUploading(true)
    try {
      const uploaded = await uploadOptimizedImage(file, "articles", form.coverImage)
      update("coverImage", uploaded.url)
      setMessage(buildImageOptimizationMessage(uploaded))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload cover gagal diproses.")
    } finally {
      setUploading(false); event.target.value = ""
    }
  }

  const removeCover = () => {
    if (!form?.coverImage || !window.confirm("Hapus gambar cover dari artikel ini?")) return
    update("coverImage", "")
  }

  const save = async (event: FormEvent<HTMLFormElement>, intent: SaveIntent = "normal") => {
    event.preventDefault()
    if (!form || saving || uploading) return
    setError(""); setMessage(""); setSlugError("")
    let nextForm = { ...form }
    if (intent === "draft") nextForm.status = "draft"
    if (intent === "publish") nextForm.status = "published"

    let normalizedSlug = ""
    try { normalizedSlug = normalizeArticleSlug(nextForm.slug) }
    catch (validationError) { setSlugError(validationError instanceof Error ? validationError.message : "Slug tidak valid."); return }
    nextForm.slug = normalizedSlug

    if (mode === "edit" && article?.status === "published" && normalizedSlug !== article.slug && !window.confirm("Slug artikel Published akan berubah tanpa redirect otomatis. Lanjutkan?")) return

    if (nextForm.status === "published" && !nextForm.publishedAt) {
      if (!window.confirm("Tanggal publikasi belum diisi. Gunakan waktu saat ini?")) {
        setError("Tanggal publikasi wajib dikonfirmasi sebelum artikel dipublikasikan.")
        return
      }
      nextForm.publishedAt = toLocalDateTime(new Date().toISOString())
    }
    if (nextForm.status === "unpublished" && !nextForm.publishedAt && article?.publishedAt) nextForm.publishedAt = toLocalDateTime(article.publishedAt)

    const validationError = validateForm(nextForm, article)
    if (validationError) { setError(validationError); return }

    const payload = {
      title: nextForm.title,
      slug: normalizedSlug,
      excerpt: nextForm.excerpt,
      body: nextForm.body,
      contentType: nextForm.contentType,
      coverImage: nextForm.coverImage,
      authorName: nextForm.authorName,
      status: nextForm.status,
      featured: nextForm.featured,
      position: Number(nextForm.position),
      publishedAt: nextForm.publishedAt ? new Date(nextForm.publishedAt).toISOString() : null,
    }
    setSaving(true)
    try {
      const response = await fetch(mode === "create" ? "/api/articles" : `/api/articles/${article?.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const apiMessage = articleErrorMessage(response.status, data.error)
        if (response.status === 409) setSlugError(apiMessage)
        else setError(apiMessage)
        return
      }
      const saved = data.article as Article
      const savedForm = createForm(user?.name || "", saved)
      setForm(savedForm); setBaseline(snapshot(savedForm)); allowNavigation.current = true
      router.push(`/member-area/konten/artikel?saved=${mode === "create" ? "created" : "updated"}`)
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Artikel gagal disimpan.") }
    finally { setSaving(false) }
  }

  const title = mode === "create" ? "Tambah Artikel" : "Edit Artikel"
  const submitLabel = mode === "create" ? "Simpan Artikel" : "Simpan Perubahan"

  if (!ready) return <div className="min-h-screen bg-background" />
  if (loading) return <MemberLayout title={title} breadcrumb={`Member Area / Konten Publik / Artikel / ${title}`}><div className="space-y-4"><div className="h-32 animate-pulse rounded-[28px] bg-muted" /><div className="h-[520px] animate-pulse rounded-[24px] bg-muted" /></div></MemberLayout>
  if (loadError || !form) return <MemberLayout title={title} breadcrumb={`Member Area / Konten Publik / Artikel / ${title}`}><div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive"><p>{loadError || "Form artikel belum dapat dimuat."}</p><div className="mt-4 flex gap-3"><button type="button" onClick={onRetry} className="min-h-11 rounded-xl border border-destructive/20 px-4 font-semibold">Coba Lagi</button><button type="button" onClick={() => navigateAway()} className="min-h-11 rounded-xl border border-border px-4 font-semibold text-foreground">Kembali</button></div></div></MemberLayout>

  return <MemberLayout title={title} breadcrumb={`Member Area / Konten Publik / Artikel / ${title}`}>
    <div className="space-y-7 overflow-x-hidden">
      <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
        <button type="button" onClick={() => navigateAway()} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali ke Direktori</button>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">ARTIKEL & BERITA</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{mode === "create" ? "Buat artikel publik terkelola tanpa mengubah data artikel legacy." : "Perbarui artikel terkelola melalui endpoint artikel khusus."}</p>
      </motion.section>

      <motion.form variants={reveal} initial="hidden" animate="visible" onSubmit={save} className="rounded-[24px] border border-border bg-card p-5 shadow-sm sm:p-7">
        {error && <div role="alert" className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        {message && <div role="status" className="mb-5 rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{message}</div>}
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <Field label="Judul" required><input value={form.title} maxLength={160} onChange={(event) => update("title", event.target.value)} className="input" /></Field>
            <Field label="Slug" required hint="Huruf kecil dan tanda hubung akan dinormalisasi saat disimpan."><input value={form.slug} maxLength={200} onChange={(event) => { setSlugTouched(true); update("slug", event.target.value) }} className={`input ${slugError ? "border-destructive" : ""}`} />{slugError && <p className="text-sm text-destructive">{slugError}</p>}</Field>
            <Field label="Ringkasan" required><textarea value={form.excerpt} maxLength={320} rows={4} onChange={(event) => update("excerpt", event.target.value)} className="textarea" /></Field>
            <Field label="Isi artikel" required hint="Gunakan teks biasa. Baris baru akan dipertahankan."><textarea value={form.body} maxLength={500000} rows={16} onChange={(event) => update("body", event.target.value)} className="textarea" /></Field>
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Jenis" required><select value={form.contentType} onChange={(event) => update("contentType", event.target.value as ArticleContentType)} className="input"><option value="artikel">Artikel</option><option value="berita">Berita</option></select></Field><Field label="Nama penulis" required><input value={form.authorName} maxLength={120} onChange={(event) => update("authorName", event.target.value)} className="input" /></Field></div>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Gambar cover</p><p className="mt-1 text-xs leading-5 text-muted-foreground">JPG, JPEG, atau PNG, maksimal 10MB.</p></div><ImageIcon className="h-5 w-5 text-muted-foreground" /></div><div className="relative mt-4 aspect-video overflow-hidden rounded-xl border border-border bg-muted">{form.coverImage ? <Image src={form.coverImage} alt="Preview cover artikel" fill sizes="300px" unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada cover</div>}</div><div className="mt-3 grid gap-2"><label className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-accent ${uploading ? "cursor-wait opacity-60" : ""}`}><Upload className="h-4 w-4" />{uploading ? "Mengunggah..." : "Upload Cover"}<input type="file" accept="image/jpeg,image/jpg,image/png" className="sr-only" onChange={handleUpload} disabled={uploading} /></label>{form.coverImage && <button type="button" onClick={removeCover} disabled={uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive/20 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Hapus Gambar</button>}</div>{uploading && <p className="mt-3 text-xs text-muted-foreground" role="status">Upload sedang diproses. URL cover lama tetap dipertahankan jika upload gagal.</p>}</section>
            <section className="rounded-2xl border border-border bg-background p-4"><div className="flex items-start gap-3"><Star className="mt-0.5 h-5 w-5 text-[#15945b]" /><div><p className="text-sm font-semibold">Konten unggulan</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Hanya satu artikel yang dapat menjadi Featured. Saat disimpan, Featured sebelumnya dapat dinonaktifkan server.</p></div></div><label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3"><input type="checkbox" checked={form.featured} onChange={(event) => update("featured", event.target.checked)} className="h-4 w-4 accent-[#15945b]" /><span className="text-sm font-semibold">Jadikan Featured</span></label></section>
            <section className="rounded-2xl border border-border bg-background p-4"><p className="text-sm font-semibold">Publikasi</p><div className="mt-4 space-y-4"><Field label="Status"><select value={form.status} onChange={(event) => update("status", event.target.value as ArticleStatus)} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></Field><Field label="Posisi" hint="Bilangan bulat positif."><input type="number" min="1" step="1" value={form.position} onChange={(event) => update("position", event.target.value)} className="input" /></Field><Field label="Tanggal publikasi" hint="Wajib untuk Published. Unpublished mempertahankan tanggal yang sudah ada."><input type="datetime-local" value={form.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} className="input" /></Field></div></section>
          </div>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap sm:justify-end"><button type="button" onClick={() => navigateAway()} disabled={saving || uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-muted-foreground hover:bg-accent">Batal</button><button type="button" onClick={(event) => void save(event as unknown as FormEvent<HTMLFormElement>, "draft")} disabled={saving || uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-accent">Simpan sebagai Draft</button><button type="submit" disabled={saving || uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white hover:bg-[#107947] disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Menyimpan..." : submitLabel}</button>{form.status !== "published" && <button type="button" onClick={(event) => void save(event as unknown as FormEvent<HTMLFormElement>, "publish")} disabled={saving || uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f3460] px-5 text-sm font-semibold text-white hover:bg-[#0b284b] disabled:opacity-60">Publikasikan</button>}</div>
      </motion.form>
    </div>
  </MemberLayout>
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold text-foreground">{label}{required && <span className="text-destructive"> *</span>}</span>{children}{hint && <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>}</label>
}
