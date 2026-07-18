"use client"

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import Image from "next/image"
import { ArrowLeft, ImageIcon, RotateCcw, Save, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { fadeUp } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import { getHomepageHeroContent, updateHomepageContentAsync, useHomepageContent, type HomepageContentItem } from "@/lib/homepage-content"

const requiredFields = ["title", "subtitle", "description", "buttonText", "link", "image"] as const

type HeroForm = Pick<HomepageContentItem, "title" | "subtitle" | "description" | "buttonText" | "link" | "image">

function toHeroForm(item: HomepageContentItem): HeroForm {
  return {
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    buttonText: item.buttonText,
    link: item.link,
    image: item.image,
  }
}

function validateHeroForm(form: HeroForm) {
  for (const field of requiredFields) {
    if (!form[field].trim()) return "Semua field konten hero wajib diisi."
  }

  try {
    const url = new URL(form.link.trim(), window.location.origin)
    if (!["http:", "https:"].includes(url.protocol) && !form.link.trim().startsWith("/")) return "Link CTA harus berupa URL atau path internal yang valid."
  } catch {
    return "Link CTA tidak valid. Gunakan URL lengkap atau path internal seperti /produk."
  }

  return ""
}

export default function HomepageEditorPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const contentItems = useHomepageContent()
  const currentHero = useMemo(() => getHomepageHeroContent(contentItems), [contentItems])
  const [ready, setReady] = useState(false)
  const [form, setForm] = useState<HeroForm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const reduced = useReducedMotion()
  const reveal = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/login?next=/member-area/konten/beranda")
      else if (user.role !== "super_admin_pc") router.replace("/dashboard")
      else setReady(true)
    }
  }, [isLoading, router, user])

  useEffect(() => {
    if (currentHero && !form) setForm(toHeroForm(currentHero))
  }, [currentHero, form])

  const resetToCurrent = () => {
    if (!currentHero) return
    setForm(toHeroForm(currentHero))
    setError("")
    setMessage("Form dikembalikan ke konten tersimpan saat ini.")
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !form) return
    setError("")
    setMessage("")
    setIsUploading(true)
    try {
      const uploaded = await uploadOptimizedImage(file, "banner", form.image)
      setForm((current) => current ? { ...current, image: uploaded.url } : current)
      setMessage(buildImageOptimizationMessage(uploaded))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload gambar gagal diproses.")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || !currentHero) return
    setError("")
    setMessage("")
    const validationError = validateHeroForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateHomepageContentAsync(currentHero.id, form)
      if (!updated) {
        setError("Konten hero tidak ditemukan. Muat ulang halaman untuk mencoba lagi.")
        return
      }
      setForm(toHeroForm(updated))
      setMessage("Konten beranda berhasil disimpan.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Konten beranda gagal disimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!ready || !user) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Beranda" breadcrumb="Member Area / Konten Publik / Beranda">
      <div className="space-y-7 overflow-x-hidden">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="flex flex-col gap-4 rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button type="button" onClick={() => router.push("/member-area/konten")} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali ke Konten Publik</button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">BERANDA</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Edit Konten Hero</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Perbarui field hero yang saat ini tersedia di sumber data homepage publik.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">Sumber: homepage-content</div>
        </motion.section>

        {!currentHero || !form ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">Konten hero belum tersedia.</div> : <motion.form variants={reveal} initial="hidden" animate="visible" onSubmit={handleSubmit} className="rounded-[24px] border border-border bg-card p-5 shadow-sm sm:p-7">
          {error && <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</div>}
          {message && <div className="mb-5 rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400" role="status">{message}</div>}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <label className="block space-y-2"><span className="text-sm font-semibold text-foreground">Eyebrow / subtitle</span><input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></label>
              <label className="block space-y-2"><span className="text-sm font-semibold text-foreground">Hero heading</span><textarea value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} rows={3} className="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-[#15945b]" /></label>
              <label className="block space-y-2"><span className="text-sm font-semibold text-foreground">Deskripsi</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} className="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-[#15945b]" /></label>
              <div className="grid gap-5 sm:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-semibold text-foreground">Label CTA</span><input value={form.buttonText} onChange={(event) => setForm({ ...form, buttonText: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></label><label className="block space-y-2"><span className="text-sm font-semibold text-foreground">Route CTA</span><input value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} placeholder="/produk atau https://..." className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></label></div>
            </div>
            <div className="space-y-3"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted">{form.image ? <Image src={form.image} alt={form.title || "Hero"} fill sizes="320px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><ImageIcon className="mr-2 h-5 w-5" /> Belum ada gambar</div>}</div><label className={cn("inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-accent", isUploading && "cursor-wait opacity-60")}><Upload className="h-4 w-4" />{isUploading ? "Mengunggah..." : "Upload Gambar Hero"}<input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploading} /></label><label className="block space-y-2"><span className="text-sm font-semibold text-foreground">URL gambar</span><input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></label><p className="text-xs leading-5 text-muted-foreground">Upload memakai alur optimasi gambar yang sama dengan CMS banner.</p></div>
          </div>
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={resetToCurrent} disabled={isSaving || isUploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-muted-foreground hover:bg-accent"><RotateCcw className="h-4 w-4" /> Reset ke Saat Ini</button><button type="submit" disabled={isSaving || isUploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white hover:bg-[#107947] disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</button></div>
        </motion.form>}
      </div>
    </MemberLayout>
  )
}
