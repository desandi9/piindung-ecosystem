"use client"

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Eye,
  ImageIcon,
  Save,
  Star,
  Trash2,
  Upload,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import { generateArticleSlug, isSafeArticleImage, normalizeArticleSlug } from "@/lib/article-content-rules"
import type { Article, ArticleContentType, ArticleStatus } from "@/lib/article-content"
import { cn } from "@/lib/utils"

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

type MarkdownTool = "heading" | "bold" | "italic" | "list" | "link" | "quote"

function toLocalDateTime(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function createForm(userName: string, article?: Article | null): ArticleFormValues {
  if (article)
    return {
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

function validateFormFields(form: ArticleFormValues, existing?: Article | null): Record<string, string> {
  const newErrors: Record<string, string> = {}
  if (!form.title.trim()) newErrors.title = "Judul wajib diisi."
  if (!form.slug.trim()) newErrors.slug = "Slug wajib diisi."
  if (!form.excerpt.trim()) newErrors.excerpt = "Ringkasan wajib diisi."
  if (!form.body.trim()) newErrors.body = "Isi artikel wajib diisi."
  if (!form.authorName.trim()) newErrors.authorName = "Nama penulis wajib diisi."
  else if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(form.authorName)) newErrors.authorName = "Nama penulis mengandung karakter tidak valid."

  const position = Number(form.position)
  if (!Number.isSafeInteger(position) || position < 1) newErrors.position = "Posisi harus berupa bilangan bulat positif."

  if (form.coverImage && !isSafeArticleImage(form.coverImage)) newErrors.coverImage = "Gambar cover harus berupa URL HTTP(S) yang aman atau path /public."

  if (form.publishedAt && Number.isNaN(new Date(form.publishedAt).getTime())) newErrors.publishedAt = "Tanggal publikasi tidak valid."
  else if (form.status === "published" && !form.publishedAt && !existing?.publishedAt) newErrors.publishedAt = "Tanggal publikasi wajib diisi untuk artikel Terbit."

  return newErrors
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
  const [form, setForm] = useState<ArticleFormValues | null>(null)
  const [baseline, setBaseline] = useState("")
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [slugError, setSlugError] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const inlineImageRef = useRef<HTMLInputElement>(null)
  const allowNavigation = useRef(false)
  const ready = !isLoading && (user?.role === "super_admin_pc" || user?.role === "admin_pc")
  const isDirty = Boolean(form && baseline && snapshot(form) !== baseline && !allowNavigation.current)

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/login?next=${mode === "create" ? "/dashboard/landing-page/artikel/baru" : `/dashboard/landing-page/artikel/${article?.id || ""}/edit`}`)
    else if (!isLoading && user?.role !== "super_admin_pc" && user?.role !== "admin_pc") router.replace("/dashboard")
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
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    if (field === "slug") setSlugError("")
    setError("")
    setMessage("")
  }

  const navigateAway = (href = "/dashboard/landing-page/artikel") => {
    if (isDirty && !window.confirm("Perubahan belum disimpan. Tinggalkan halaman ini?")) return
    allowNavigation.current = true
    router.push(href)
  }

  const bodySet = (value: string) => update("body", value)

  const insertMarkdown = (tool: MarkdownTool) => {
    const el = bodyRef.current
    if (!el || !form) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = form.body.slice(start, end)
    let replacement = ""
    let cursorOffset = 0

    switch (tool) {
      case "heading":
        replacement = `## ${selected || "Judul section"}`
        cursorOffset = replacement.length
        break
      case "bold":
        replacement = `**${selected || "teks tebal"}**`
        cursorOffset = selected ? replacement.length : 2
        break
      case "italic":
        replacement = `*${selected || "teks miring"}*`
        cursorOffset = selected ? replacement.length : 1
        break
      case "list":
        replacement = selected ? selected.split("\n").map((line) => `- ${line}`).join("\n") : "- item daftar"
        cursorOffset = replacement.length
        break
      case "link":
        replacement = `[${selected || "teks link"}](${selected ? "" : "https://"})`
        cursorOffset = selected ? replacement.length - 1 : replacement.length - 9
        break
      case "quote":
        replacement = `> ${selected || "kutipan"}`
        cursorOffset = replacement.length
        break
      default:
        return
    }

    const next = form.body.slice(0, start) + replacement + form.body.slice(end)
    bodySet(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + cursorOffset
      el.setSelectionRange(pos, pos)
    })
  }

  const handleInlineImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !form) return
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setError("Gambar artikel harus berupa JPG, JPEG, atau PNG.")
      event.target.value = ""
      return
    }
    setUploading(true)
    setError("")
    try {
      const uploaded = await uploadOptimizedImage(file, "articles")
      const caption = window.prompt("Caption gambar (opsional):", file.name.replace(/\.[^.]+$/, ""))?.trim() || "Gambar artikel"
      const insertion = `\n\n![${caption}](${uploaded.url})\n*${caption}*\n\n`
      const el = bodyRef.current
      const start = el?.selectionStart ?? form.body.length
      bodySet(form.body.slice(0, start) + insertion + form.body.slice(start))
      setMessage(buildImageOptimizationMessage(uploaded))
      requestAnimationFrame(() => bodyRef.current?.focus())
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload gambar artikel gagal diproses.")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !form) return
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setError("File cover harus berupa JPG, JPEG, atau PNG.")
      event.target.value = ""
      return
    }
    setError("")
    setMessage("")
    setUploading(true)
    try {
      const uploaded = await uploadOptimizedImage(file, "articles", form.coverImage)
      update("coverImage", uploaded.url)
      setMessage(buildImageOptimizationMessage(uploaded))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload cover gagal diproses.")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const removeCover = () => {
    if (!form?.coverImage || !window.confirm("Hapus gambar cover dari artikel ini?")) return
    update("coverImage", "")
  }

  const save = async (event: FormEvent<HTMLFormElement>, intent: SaveIntent = "normal") => {
    event.preventDefault()
    if (!form || saving || uploading) return
    if (intent === "publish" && !window.confirm("Publikasikan artikel ini sekarang? Artikel akan tampil di website publik.")) return
    setError("")
    setMessage("")
    setSlugError("")
    setErrors({})
    const nextForm = {
      ...form,
      status: intent === "draft" ? "draft" as const : intent === "publish" ? "published" as const : form.status,
    }

    let normalizedSlug = ""
    try {
      normalizedSlug = normalizeArticleSlug(nextForm.slug)
    } catch (validationError) {
      setSlugError(validationError instanceof Error ? validationError.message : "Slug tidak valid.")
      return
    }
    nextForm.slug = normalizedSlug

    if (intent === "publish" && mode === "edit" && article?.status === "published" && normalizedSlug !== article.slug && !window.confirm("Slug artikel Terbit akan berubah tanpa redirect otomatis. Lanjutkan?")) return

    if (intent === "publish" && !nextForm.publishedAt) {
      if (!window.confirm("Tanggal publikasi belum diisi. Gunakan waktu saat ini?")) {
        setError("Tanggal publikasi wajib dikonfirmasi sebelum artikel dipublikasikan.")
        return
      }
      nextForm.publishedAt = toLocalDateTime(new Date().toISOString())
    }
    if (nextForm.status === "unpublished" && !nextForm.publishedAt && article?.publishedAt) nextForm.publishedAt = toLocalDateTime(article.publishedAt)

    const validationErrors = validateFormFields(nextForm, article)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setError("Periksa kembali form. Beberapa input wajib diisi dengan benar.")
      return
    }

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
      setForm(savedForm)
      setBaseline(snapshot(savedForm))
      allowNavigation.current = true
      router.push(`/dashboard/landing-page/artikel?saved=${mode === "create" ? "created" : "updated"}`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Artikel gagal disimpan.")
    } finally {
      setSaving(false)
    }
  }

  const title = mode === "create" ? "Tulis Artikel" : "Edit Artikel"

  if (!ready) return <div className="min-h-screen bg-background" />
  if (loading)
    return (
      <MemberLayout title={title} breadcrumb={`Landing Page / Artikel / ${title}`}>
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-[28px] bg-muted" />
          <div className="h-[520px] animate-pulse rounded-[24px] bg-muted" />
        </div>
      </MemberLayout>
    )
  if (loadError || !form)
    return (
      <MemberLayout title={title} breadcrumb={`Landing Page / Artikel / ${title}`}>
        <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
          <p>{loadError || "Form artikel belum dapat dimuat."}</p>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={onRetry} className="min-h-11 rounded-xl border border-destructive/20 px-4 font-semibold">
              Coba Lagi
            </button>
            <button type="button" onClick={() => navigateAway()} className="min-h-11 rounded-xl border border-border px-4 font-semibold text-foreground">
              Kembali
            </button>
          </div>
        </div>
      </MemberLayout>
    )

  const draftState = form.status === "draft"
  const publishedState = form.status === "published"
  const canPreviewPublic = mode === "edit" && publishedState && form.slug.trim()

  const ActionButtons = ({ showSaveDraft }: { showSaveDraft: boolean }) => (
    <div className="flex flex-wrap items-center gap-2">
      {canPreviewPublic ? (
        <a
          href={`/artikel/${encodeURIComponent(form.slug)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dce8e2] px-4 text-sm font-semibold text-[#08213b] transition hover:bg-[#e7f7ef] dark:border-white/10 dark:text-white dark:hover:bg-white/10"
        >
          <Eye className="h-4 w-4" /> Preview
        </a>
      ) : (
        <span className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-xl border border-[#dce8e2] px-4 text-sm font-semibold text-muted-foreground opacity-50" title="Preview publik tersedia setelah artikel diterbitkan dan tersimpan.">
          <Eye className="h-4 w-4" /> Preview
        </span>
      )}
      {draftState && showSaveDraft && (
        <button
          type="button"
          onClick={(event) => void save(event as unknown as FormEvent<HTMLFormElement>, "draft")}
          disabled={saving || uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#cde8e2] bg-white px-5 text-sm font-semibold text-[#08213c] transition hover:bg-[#e7f7ef] disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Draft"}
        </button>
      )}
      {!publishedState && (
        <button
          type="button"
          onClick={(event) => void save(event as unknown as FormEvent<HTMLFormElement>, "publish")}
          disabled={saving || uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f3460] px-5 text-sm font-semibold text-white transition hover:bg-[#0b284b] disabled:opacity-60"
        >
          Publikasikan
        </button>
      )}
      {publishedState && (
        <button
          type="button"
          onClick={(event) => void save(event as unknown as FormEvent<HTMLFormElement>, "normal")}
          disabled={saving || uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white transition hover:bg-[#107947] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      )}
    </div>
  )

  return (
    <MemberLayout title={title} breadcrumb={`Landing Page / Artikel / ${title}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <button
            type="button"
            onClick={() => navigateAway()}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#6c7a89] transition hover:bg-[#e6f7ef] hover:text-[#07965d] dark:text-slate-400 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <ActionButtons showSaveDraft={true} />
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">
            {message}
          </div>
        )}

        <form onSubmit={(e) => void save(e)} className="space-y-6">
          {/* 1. Judul Artikel */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#08213b] dark:text-white">Judul Artikel *</label>
            <input
              value={form.title}
              maxLength={160}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Masukkan judul artikel"
              className={cn(
                "w-full rounded-xl border border-[#cce2df] bg-white px-4 py-3 text-2xl font-bold tracking-tight text-[#08213b] placeholder:text-[#a0ada7] focus:border-[#15945b] focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white",
                errors.title && "border-destructive focus:border-destructive"
              )}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}

            <div className="flex items-center gap-2 rounded-lg border border-[#cfe1db] bg-[#f8fbf9] p-2 dark:border-white/10 dark:bg-white/5">
              <span className="pl-2 text-xs text-[#85969e]">Slug: /artikel/</span>
              <input
                value={form.slug}
                maxLength={200}
                onChange={(event) => {
                  setSlugTouched(true)
                  update("slug", event.target.value)
                }}
                className="flex-1 bg-transparent text-xs font-medium text-[#08213c] placeholder:text-[#85969e] focus:outline-none dark:text-slate-300"
              />
            </div>
            {slugError && <p className="text-xs text-destructive">{slugError}</p>}
          </div>

          {/* 2. Jenis Konten */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#08213b] dark:text-white">Jenis Konten *</label>
            <select
              value={form.contentType}
              onChange={(event) => update("contentType", event.target.value as ArticleContentType)}
              className="h-11 w-full rounded-xl border border-[#cce2db] bg-background px-3 text-sm outline-none focus:border-[#15945b] dark:border-white/10 dark:bg-white/5"
            >
              <option value="artikel">Artikel</option>
              <option value="berita">Berita</option>
            </select>
          </div>

          {/* 3. Ringkasan */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#08213b] dark:text-white">Ringkasan *</label>
            <p className="text-xs text-muted-foreground">Ringkasan singkat akan ditampilkan pada daftar artikel/berita di halaman publik.</p>
            <textarea
              value={form.excerpt}
              maxLength={320}
              rows={3}
              onChange={(event) => update("excerpt", event.target.value)}
              placeholder="Tulis ringkasan singkat artikel di sini..."
              className={cn(
                "w-full rounded-xl border border-[#cce2db] bg-background px-4 py-2.5 text-sm outline-none focus:border-[#15945b] dark:border-white/10 dark:bg-white/5",
                errors.excerpt && "border-destructive focus:border-destructive"
              )}
            />
            {errors.excerpt && <p className="text-xs text-destructive">{errors.excerpt}</p>}
          </div>

          {/* 4. Isi Artikel */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#08213b] dark:text-white">Isi Artikel *</label>

            {/* Rich text toolbar */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#cce2db] bg-[#f8fbf9] p-1.5 dark:border-white/10 dark:bg-white/5">
              {([
                ["heading", "Heading"],
                ["bold", "Bold"],
                ["italic", "Italic"],
                ["list", "List"],
                ["link", "Link"],
                ["quote", "Quote"],
              ] as Array<[MarkdownTool, string]>).map(([tool, label]) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => insertMarkdown(tool)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#6c7a89] transition hover:bg-[#e6f7ef] hover:text-[#07965d] dark:text-slate-400 dark:hover:bg-white/10"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => inlineImageRef.current?.click()}
                disabled={uploading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#6c7a89] transition hover:bg-[#e6f7ef] hover:text-[#07965d] disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <ImageIcon className="h-4 w-4" /> Gambar
              </button>
              <input ref={inlineImageRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleInlineImageUpload} className="sr-only" />
            </div>

            <textarea
              ref={bodyRef}
              value={form.body}
              maxLength={500000}
              rows={20}
              onChange={(event) => update("body", event.target.value)}
              placeholder="Mulai menulis artikel di sini..."
              className={cn(
                "w-full min-h-[380px] resize-y rounded-[20px] border border-[#cce2df] bg-white px-5 py-4 text-[15px] leading-[1.85] text-[#08213c] placeholder:text-[#a0ada7] focus:border-[#15945b] focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:focus:border-emerald-500",
                errors.body && "border-destructive focus:border-destructive"
              )}
            />
            {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
          </div>

          {/* 5. Gambar Unggulan */}
          <div className="space-y-2 rounded-[22px] border border-[#cce3db] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0c2432]">
            <label className="text-sm font-bold text-[#08213b] dark:text-white">Gambar Unggulan</label>
            <div className="relative mt-2 aspect-video max-w-md overflow-hidden rounded-xl border border-[#cce2db] bg-muted">
              {form.coverImage ? (
                <Image src={form.coverImage} alt="Cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 450px" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <ImageIcon className="mr-2 h-5 w-5" /> Belum ada cover
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className={cn("inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#cce2db] px-4 py-2.5 text-sm font-semibold text-[#08213c] transition hover:bg-[#e7f7ef] dark:border-white/10 dark:text-white", uploading && "cursor-wait opacity-60")}>
                <Upload className="h-4 w-4" />
                {uploading ? "Mengunggah..." : "Upload Cover"}
                <input type="file" accept="image/jpeg,image/jpg,image/png" className="sr-only" onChange={handleUpload} disabled={uploading} />
              </label>
              {form.coverImage && (
                <button type="button" onClick={removeCover} className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/20 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" /> Hapus Gambar
                </button>
              )}
            </div>
            {errors.coverImage && <p className="text-xs text-destructive">{errors.coverImage}</p>}
          </div>

          {/* 6. Pengaturan Publikasi */}
          <div className="rounded-[22px] border border-[#cce3dc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0c2432] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#6c7a94] dark:text-slate-300">Pengaturan Publikasi</h3>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Status Publikasi</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => update("status", "draft")}
                  className={cn(
                    "rounded-xl border border-[#cce8e2] px-3 py-2.5 text-xs font-semibold transition",
                    draftState ? "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" : "bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => update("status", "published")}
                  className={cn(
                    "rounded-xl border border-[#cce8e2] px-3 py-2.5 text-xs font-semibold transition",
                    publishedState ? "bg-[#e6f7ee] text-[#15945b] border-[#15945b]/30 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  Terbit
                </button>
                <button
                  type="button"
                  onClick={() => update("status", "unpublished")}
                  className={cn(
                    "rounded-xl border border-[#cce8e2] px-3 py-2.5 text-xs font-semibold transition",
                    form.status === "unpublished" ? "bg-muted text-foreground border-muted" : "bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  Tidak Publik
                </button>
              </div>
            </div>

            {/* Tanggal Publikasi */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Tanggal Publikasi</label>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) => update("publishedAt", event.target.value)}
                className="h-10 w-full rounded-xl border border-[#cce8e2] bg-background px-3 text-sm outline-none focus:border-[#15945b] dark:border-white/10 dark:bg-white/5"
              />
              {errors.publishedAt && <p className="text-xs text-destructive">{errors.publishedAt}</p>}
            </div>

            {/* Penulis */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Nama Penulis</label>
              <input
                value={form.authorName}
                maxLength={120}
                onChange={(e) => update("authorName", e.target.value)}
                className="h-10 w-full rounded-xl border border-[#cce2db] bg-background px-3 text-sm outline-none focus:border-[#15945b] dark:border-white/10 dark:bg-white/5"
              />
              {errors.authorName && <p className="text-xs text-destructive">{errors.authorName}</p>}
            </div>

            {/* Posisi */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Posisi Urutan</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                className="h-10 w-full rounded-xl border border-[#cce2db] bg-background px-3 text-sm outline-none focus:border-[#15945b] dark:border-white/10 dark:bg-white/5"
              />
              {errors.position && <p className="text-xs text-destructive">{errors.position}</p>}
            </div>

            {/* Artikel pilihan */}
            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 h-5 w-5 text-[#15945b]" />
                <div>
                  <p className="text-sm font-semibold">Artikel Pilihan Landing</p>
                  <p className="text-xs text-muted-foreground">Hanya satu artikel dapat menjadi pilihan utama di halaman landing.</p>
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-[#cce2db] px-4 py-2.5 dark:border-white/10">
                <input
                  type="checkbox"
                  checked={form.featured}
                  disabled={!publishedState}
                  onChange={(e) => update("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-[#cce2db] accent-[#15945b] disabled:opacity-50"
                />
                <span className="text-sm font-semibold">Tampilkan di landing page</span>
              </label>
              {!publishedState && (
                <p className="text-[11px] leading-5 text-amber-600 dark:text-amber-400">Pilihan ini hanya dapat diaktifkan setelah artikel berstatus Terbit.</p>
              )}
            </div>
          </div>

          {/* Bottom actions bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => navigateAway()}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#6c7a89] transition hover:bg-[#e6f7ef] hover:text-[#07965d] dark:text-slate-400 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </button>
            <ActionButtons showSaveDraft={false} />
          </div>
        </form>
      </div>
    </MemberLayout>
  )
}
