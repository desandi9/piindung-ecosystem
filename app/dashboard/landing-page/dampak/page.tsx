"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"
import { Activity, ArrowLeft, BookOpen, ChevronDown, ChevronRight, Clock, ExternalLink, Image as ImageIcon, Layers, Plus, Save, Trash, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { Card, CardContent } from "@/components/ui/card"
import { fadeUp } from "@/lib/motion"
import type { Achievement, ImpactAsset, ImpactCaseStudyItem, ImpactContent, ImpactIconKey, ImpactStory, ImpactTestimonialItem, Statistic, TimelineItem } from "@/lib/impact-content"

export default function MemberImpactPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const [content, setContent] = useState<ImpactContent | null>(null)
  const [original, setOriginal] = useState<ImpactContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ path: string[] } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")

  const ready = !isLoading && user?.role === "super_admin_pc"
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp

  const load = useCallback(async () => {
    setLoading(true); setError(""); setSuccess("")
    try {
      const res = await fetch("/api/impact-content/manage", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal memuat konten dampak.")
      setContent(data.content)
      setOriginal(JSON.parse(JSON.stringify(data.content)))
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat konten dampak.") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/dashboard/landing-page/dampak")
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])

  useEffect(() => { if (ready) void load() }, [load, ready])

  const hasChanges = useMemo(() => JSON.stringify(content) !== JSON.stringify(original), [content, original])

  useEffect(() => {
    if (!hasChanges) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [hasChanges])

  const save = async () => {
    if (!content || saving) return
    setSaving(true); setError(""); setSuccess("")
    try {
      const res = await fetch("/api/impact-content/manage", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.")
      setContent(data.content)
      setOriginal(JSON.parse(JSON.stringify(data.content)))
      setSuccess("Konten dampak berhasil disimpan.")
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan konten dampak.") }
    finally { setSaving(false) }
  }

  const reset = () => { if (original) { setContent(JSON.parse(JSON.stringify(original))); setError(""); setSuccess("Perubahan dibatalkan.") } }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !uploadTarget || !content) return
    setUploading(true); setError(""); setSuccess("")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/impact-content/upload", { method: "POST", body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah file.")
      const asset: ImpactAsset = data.asset
      const next = JSON.parse(JSON.stringify(content))
      let ptr = next
      for (let i = 0; i < uploadTarget.path.length - 1; i++) ptr = ptr[uploadTarget.path[i]]
      ptr[uploadTarget.path[uploadTarget.path.length - 1]] = asset
      setContent(next)
      setSuccess("Aset berhasil diunggah.")
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal mengunggah file.") }
    finally { setUploading(false); setUploadTarget(null); event.target.value = "" }
  }

  const triggerUpload = (path: string[]) => { setUploadTarget({ path }); fileInputRef.current?.click() }

  const addStatistic = () => {
    if (!content) return
    const id = `stat-${Date.now()}`
    const next: Statistic = { id, label: "Statistik Baru", value: "100", prefix: "", suffix: "", description: "Keterangan", iconKey: "users", visible: true, position: content.statistics.length }
    setContent({ ...content, statistics: [...content.statistics, next] })
  }

  const removeStatistic = (id: string) => {
    if (!content) return
    setContent({ ...content, statistics: content.statistics.filter(x => x.id !== id).map((x, idx) => ({ ...x, position: idx })) })
  }

  const addAchievement = () => {
    if (!content) return
    const id = `ach-${Date.now()}`
    const next: Achievement = { id, title: "Pencapaian Baru", description: "Keterangan pencapaian", year: new Date().getFullYear().toString(), visible: true, position: content.achievements.length }
    setContent({ ...content, achievements: [...content.achievements, next] })
  }

  const removeAchievement = (id: string) => {
    if (!content) return
    setContent({ ...content, achievements: content.achievements.filter(x => x.id !== id).map((x, idx) => ({ ...x, position: idx })) })
  }

  const addStory = () => {
    if (!content) return
    const id = `story-${Date.now()}`
    const next: ImpactStory = { id, title: "Cerita Penerima Manfaat", excerpt: "Kutipan cerita", body: "Teks cerita lengkap.", status: "draft", featured: false, position: content.stories.length, publishedAt: new Date().toISOString() }
    setContent({ ...content, stories: [...content.stories, next] })
  }

  const removeStory = (id: string) => {
    if (!content) return
    setContent({ ...content, stories: content.stories.filter(x => x.id !== id).map((x, idx) => ({ ...x, position: idx })) })
  }

  const addTimeline = () => {
    if (!content) return
    const id = `time-${Date.now()}`
    const next: TimelineItem = { id, yearLabel: "Tahun", title: "Milestone Baru", description: "Deskripsi perkembangan", visible: true, position: content.timeline.length }
    setContent({ ...content, timeline: [...content.timeline, next] })
  }

  const removeTimeline = (id: string) => {
    if (!content) return
    setContent({ ...content, timeline: content.timeline.filter(x => x.id !== id).map((x, idx) => ({ ...x, position: idx })) })
  }

  const addImpactStat = () => {
    if (!content) return
    const item: Statistic = { id: `impact-stat-${Date.now()}`, label: "Statistik Baru", value: "0", prefix: "", suffix: "", description: "Keterangan", iconKey: "users", visible: true, position: content.impactStats.items.length }
    setContent({ ...content, impactStats: { ...content.impactStats, items: [...content.impactStats.items, item] } })
  }

  const removeImpactStat = (id: string) => {
    if (!content) return
    setContent({ ...content, impactStats: { ...content.impactStats, items: content.impactStats.items.filter(item => item.id !== id).map((item, index) => ({ ...item, position: index })) } })
  }

  const addCaseStudy = () => {
    if (!content) return
    const item: ImpactCaseStudyItem = { id: `case-${Date.now()}`, step: `Tahap ${content.caseStudies.items.length + 1}`, title: "Studi kasus baru", description: "Deskripsi studi kasus", visible: true, position: content.caseStudies.items.length }
    setContent({ ...content, caseStudies: { ...content.caseStudies, items: [...content.caseStudies.items, item] } })
  }

  const removeCaseStudy = (id: string) => {
    if (!content) return
    setContent({ ...content, caseStudies: { ...content.caseStudies, items: content.caseStudies.items.filter(item => item.id !== id).map((item, index) => ({ ...item, position: index })) } })
  }

  const addSummaryItem = (caseIndex: number) => {
    if (!content) return
    const study = content.caseStudies.items[caseIndex]
    const summaryItems = study.summaryItems ?? []
    if (summaryItems.length >= 4) return
    const item = { id: `summary-${Date.now()}`, iconKey: "users", label: "Ringkasan", value: "0", visible: true, position: summaryItems.length }
    const studies = [...content.caseStudies.items]
    studies[caseIndex] = { ...study, summaryItems: [...summaryItems, item] }
    setContent({ ...content, caseStudies: { ...content.caseStudies, items: studies } })
  }

  const removeSummaryItem = (caseIndex: number, id: string) => {
    if (!content) return
    const studies = [...content.caseStudies.items]
    const study = studies[caseIndex]
    studies[caseIndex] = { ...study, summaryItems: (study.summaryItems ?? []).filter(item => item.id !== id).map((item, index) => ({ ...item, position: index })) }
    setContent({ ...content, caseStudies: { ...content.caseStudies, items: studies } })
  }

  const addTestimonial = () => {
    if (!content) return
    const item: ImpactTestimonialItem = { id: `testimonial-${Date.now()}`, name: "Nama", role: "Jabatan atau organisasi", quote: "Kutipan testimoni", rating: 5, visible: true, position: content.testimonials.items.length }
    setContent({ ...content, testimonials: { ...content.testimonials, items: [...content.testimonials.items, item] } })
  }

  const removeTestimonial = (id: string) => {
    if (!content) return
    setContent({ ...content, testimonials: { ...content.testimonials, items: content.testimonials.items.filter(item => item.id !== id).map((item, index) => ({ ...item, position: index })) } })
  }

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Kelola Dampak" breadcrumb="Kelola Landing Page / Dampak">
      <div className="space-y-7 overflow-x-hidden pb-12">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button onClick={() => router.push("/dashboard/landing-page")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali ke Kelola Landing Page</button>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">Dampak & Konten</p>
              <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Kelola Tampilan Dampak</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">Kelola narasi hero, statistik pencapaian, cerita penerima manfaat, dan alur pencapaian.</p>
            </div>
            <a href="/dampak" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-accent"><ExternalLink className="h-4 w-4" /> Preview Dampak</a>
          </div>
        </motion.section>

        {success && <div className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{success}</div>}
        {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-3xl border border-border bg-card" />)}</div>
        ) : content ? (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-4">
              <input type="file" accept="image/png,image/jpeg" className="hidden" ref={fileInputRef} onChange={handleUpload} />

              <Card className="overflow-hidden border-border shadow-sm">
                <button type="button" onClick={() => setActiveSection(activeSection === "hero" ? "" : "hero")} className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-accent/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b]"><Activity className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">Hero Dampak</span><span className="mt-1 block text-xs text-muted-foreground">Narasi utama dan ajakan tindakan pada halaman dampak.</span></span>
                  <span className="shrink-0 text-xs text-muted-foreground">12 field</span>
                  {activeSection === "hero" ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                </button>
                {activeSection === "hero" && <CardContent className="space-y-5 border-t border-border p-5">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold">Konten Hero</h3>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">EYEBROW</label><input value={content.hero.eyebrow} onChange={(e) => setContent({ ...content, hero: { ...content.hero, eyebrow: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">JUDUL UTAMA</label><input value={content.hero.title} onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div><div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">SOROTAN JUDUL</label><input value={content.hero.highlightedText} onChange={(e) => setContent({ ...content, hero: { ...content.hero, highlightedText: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI HERO</label><textarea value={content.hero.description} onChange={(e) => setContent({ ...content, hero: { ...content.hero, description: e.target.value } })} rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="space-y-4 border-t border-border pt-5">
                    <h3 className="text-sm font-bold">Call to Action (CTA)</h3>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">EYEBROW CTA</label><input value={content.callToAction.eyebrow} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, eyebrow: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">JUDUL CTA</label><input value={content.callToAction.title} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, title: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI CTA</label><textarea value={content.callToAction.description} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, description: e.target.value } })} rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">LABEL TOMBOL UTAMA</label><input value={content.callToAction.primaryLabel} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, primaryLabel: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div><div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">TAUTAN TOMBOL UTAMA</label><input value={content.callToAction.primaryHref} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, primaryHref: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div></div>
                    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">LABEL TOMBOL KEDUA</label><input value={content.callToAction.secondaryLabel} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, secondaryLabel: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div><div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">TAUTAN TOMBOL KEDUA</label><input value={content.callToAction.secondaryHref} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, secondaryHref: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div></div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={content.callToAction.visible} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, visible: e.target.checked } })} /> Tampilkan Publik</label>
                  </div>
                </CardContent>}
              </Card>

              <Card className="overflow-hidden border-border shadow-sm">
                <button type="button" onClick={() => setActiveSection(activeSection === "statistics" ? "" : "statistics")} className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-accent/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b]"><Layers className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">Statistik Pencapaian</span><span className="mt-1 block text-xs text-muted-foreground">Kelola angka, pencapaian, dan lampiran pendukung.</span></span>
                  <span className="shrink-0 text-xs text-muted-foreground">{content.statistics.length + content.achievements.length} item</span>
                  {activeSection === "statistics" ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                </button>
                {activeSection === "statistics" && <CardContent className="space-y-6 border-t border-border p-5">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">Statistik</h3><button onClick={addStatistic} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15945b] px-3 text-xs font-semibold text-white hover:bg-[#107947]"><Plus className="h-3.5 w-3.5" /> Tambah</button></div>
                    {content.statistics.map((stat, index) => <div key={stat.id} className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">STATISTIK #{index + 1}</span><button onClick={() => removeStatistic(stat.id)} className="flex items-center gap-1 text-xs font-semibold text-destructive hover:text-destructive/80"><Trash className="h-3.5 w-3.5" /> Hapus</button></div>
                      <div className="grid gap-3 sm:grid-cols-4"><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">PREFIX</label><input value={stat.prefix} onChange={(e) => { const next = [...content.statistics]; next[index].prefix = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">NILAI</label><input value={stat.value} onChange={(e) => { const next = [...content.statistics]; next[index].value = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">SUFFIX</label><input value={stat.suffix} onChange={(e) => { const next = [...content.statistics]; next[index].suffix = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">IKON</label><select value={stat.iconKey} onChange={(e) => { const next = [...content.statistics]; next[index].iconKey = e.target.value as ImpactIconKey; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-[#15945b]"><option value="users">users</option><option value="hand-heart">hand-heart</option><option value="building">building</option><option value="map-pin">map-pin</option><option value="package">package</option><option value="chart">chart</option><option value="calendar">calendar</option><option value="shield">shield</option></select></div></div>
                      <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">LABEL</label><input value={stat.label} onChange={(e) => { const next = [...content.statistics]; next[index].label = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI</label><input value={stat.description} onChange={(e) => { const next = [...content.statistics]; next[index].description = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div></div>
                      <div className="flex items-center gap-4"><label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={stat.visible} onChange={(e) => { const next = [...content.statistics]; next[index].visible = e.target.checked; setContent({ ...content, statistics: next }) }} /> Tampilkan Publik</label><div className="flex items-center gap-2"><button disabled={index === 0} onClick={() => { const next = [...content.statistics]; const tmp = next[index - 1]; next[index - 1] = next[index]; next[index] = tmp; next[index - 1].position = index - 1; next[index].position = index; setContent({ ...content, statistics: next }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▲</button><button disabled={index === content.statistics.length - 1} onClick={() => { const next = [...content.statistics]; const tmp = next[index + 1]; next[index + 1] = next[index]; next[index] = tmp; next[index + 1].position = index + 1; next[index].position = index; setContent({ ...content, statistics: next }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▼</button></div></div>
                    </div>)}
                  </div>
                  <div className="space-y-5 border-t border-border pt-5">
                    <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">Milestone & Penghargaan</h3><button onClick={addAchievement} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15945b] text-white px-3 text-xs font-semibold hover:bg-[#107947]"><Plus className="h-3.5 w-3.5" /> Tambah</button></div>
                    {content.achievements.map((ach, index) => <div key={ach.id} className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">PENCAPAIAN #{index + 1}</span><button onClick={() => removeAchievement(ach.id)} className="flex items-center gap-1 text-xs font-semibold text-destructive hover:text-destructive/80"><Trash className="h-3.5 w-3.5" /> Hapus</button></div>
                      <div className="grid gap-3 sm:grid-cols-3"><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">JUDUL</label><input value={ach.title} onChange={(e) => { const next = [...content.achievements]; next[index].title = e.target.value; setContent({ ...content, achievements: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">TAHUN</label><input value={ach.year ?? ""} onChange={(e) => { const next = [...content.achievements]; next[index].year = e.target.value; setContent({ ...content, achievements: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">TAUTAN</label><input value={ach.link ?? ""} onChange={(e) => { const next = [...content.achievements]; next[index].link = e.target.value; setContent({ ...content, achievements: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div></div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI</label><textarea value={ach.description} onChange={(e) => { const next = [...content.achievements]; next[index].description = e.target.value; setContent({ ...content, achievements: next }) }} rows={2} className="w-full rounded-lg border border-input bg-background p-2.5 text-xs outline-none focus:border-[#15945b]" /></div>
                      <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">GAMBAR LAMPIRAN</label><div className="flex items-center gap-3"><div className="relative flex h-16 w-24 items-center justify-center overflow-hidden rounded border bg-background">{ach.image ? <Image src={ach.image.path} alt="Pencapaian" fill className="object-cover" unoptimized /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}</div><button onClick={() => triggerUpload(["achievements", String(index), "image"])} disabled={uploading} className="inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50"><Upload className="mr-1 h-3.5 w-3.5" /> Ganti Gambar</button></div></div>
                      <div className="flex items-center gap-4"><label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={ach.visible} onChange={(e) => { const next = [...content.achievements]; next[index].visible = e.target.checked; setContent({ ...content, achievements: next }) }} /> Tampilkan Publik</label><div className="flex items-center gap-2"><button disabled={index === 0} onClick={() => { const next = [...content.achievements]; const tmp = next[index - 1]; next[index - 1] = next[index]; next[index] = tmp; next[index - 1].position = index - 1; next[index].position = index; setContent({ ...content, achievements: next }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▲</button><button disabled={index === content.achievements.length - 1} onClick={() => { const next = [...content.achievements]; const tmp = next[index + 1]; next[index + 1] = next[index]; next[index] = tmp; next[index + 1].position = index + 1; next[index].position = index; setContent({ ...content, achievements: next }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▼</button></div></div>
                    </div>)}
                  </div>
                </CardContent>}
              </Card>

              <Card className="overflow-hidden border-border shadow-sm">
                <button type="button" onClick={() => setActiveSection(activeSection === "timeline" ? "" : "timeline")} className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-accent/40"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b]"><Clock className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold">Timeline & Alur</span><span className="mt-1 block text-xs text-muted-foreground">Susun tahapan perkembangan dan alur pelayanan.</span></span><span className="shrink-0 text-xs text-muted-foreground">{content.timeline.length} item</span>{activeSection === "timeline" ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}</button>
                {activeSection === "timeline" && <CardContent className="space-y-5 border-t border-border p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">Tahapan Timeline</h3><button onClick={addTimeline} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15945b] px-3 text-xs font-semibold text-white hover:bg-[#107947]"><Plus className="h-3.5 w-3.5" /> Tambah</button></div>{content.timeline.map((time, index) => <div key={time.id} className="space-y-4 rounded-xl border border-border bg-muted/40 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">TIMELINE #{index + 1}</span><button onClick={() => removeTimeline(time.id)} className="flex items-center gap-1 text-xs font-semibold text-destructive hover:text-destructive/80"><Trash className="h-3.5 w-3.5" /> Hapus</button></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">LABEL TAHUN / TAHAP</label><input value={time.yearLabel} onChange={(e) => { const next = [...content.timeline]; next[index].yearLabel = e.target.value; setContent({ ...content, timeline: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">JUDUL</label><input value={time.title} onChange={(e) => { const next = [...content.timeline]; next[index].title = e.target.value; setContent({ ...content, timeline: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div></div><div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI</label><textarea value={time.description} onChange={(e) => { const next = [...content.timeline]; next[index].description = e.target.value; setContent({ ...content, timeline: next }) }} rows={2} className="w-full rounded-lg border border-input bg-background p-2.5 text-xs outline-none focus:border-[#15945b]" /></div><div className="flex items-center gap-4"><label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={time.visible} onChange={(e) => { const next = [...content.timeline]; next[index].visible = e.target.checked; setContent({ ...content, timeline: next }) }} /> Tampilkan Publik</label><div className="flex items-center gap-2"><button disabled={index === 0} onClick={() => { const next = [...content.timeline]; const tmp = next[index - 1]; next[index - 1] = next[index]; next[index] = tmp; next[index - 1].position = index - 1; next[index].position = index; setContent({ ...content, timeline: next }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▲</button><button disabled={index === content.timeline.length - 1} onClick={() => { const next = [...content.timeline]; const tmp = next[index + 1]; next[index + 1] = next[index]; next[index] = tmp; next[index + 1].position = index + 1; next[index].position = index; setContent({ ...content, timeline: next }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▼</button></div></div></div>)}</CardContent>}
              </Card>

              {content.stories.length > 0 && <Card className="overflow-hidden border-border shadow-sm">
                <button type="button" onClick={() => setActiveSection(activeSection === "stories" ? "" : "stories")} className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-accent/40"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b]"><BookOpen className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold">Cerita/Testimoni Dampak</span><span className="mt-1 block text-xs text-muted-foreground">Kelola cerita penerima manfaat dan testimoni terpilih.</span></span><span className="shrink-0 text-xs text-muted-foreground">{content.stories.length} item</span>{activeSection === "stories" ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}</button>
                {activeSection === "stories" && <CardContent className="space-y-5 border-t border-border p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">Cerita Penerima Manfaat</h3><button onClick={addStory} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15945b] px-3 text-xs font-semibold text-white hover:bg-[#107947]"><Plus className="h-3.5 w-3.5" /> Tambah</button></div>{content.stories.map((story, index) => <div key={story.id} className="space-y-4 rounded-xl border border-border bg-muted/40 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">CERITA #{index + 1}</span><button onClick={() => removeStory(story.id)} className="flex items-center gap-1 text-xs font-semibold text-destructive hover:text-destructive/80"><Trash className="h-3.5 w-3.5" /> Hapus</button></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">JUDUL CERITA</label><input value={story.title} onChange={(e) => { const next = [...content.stories]; next[index].title = e.target.value; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">RINGKASAN</label><input value={story.excerpt} onChange={(e) => { const next = [...content.stories]; next[index].excerpt = e.target.value; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">LOKASI</label><input value={story.location ?? ""} onChange={(e) => { const next = [...content.stories]; next[index].location = e.target.value; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">STATUS</label><select value={story.status} onChange={(e) => { const next = [...content.stories]; next[index].status = e.target.value as "draft" | "published"; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-[#15945b]"><option value="draft">Draft</option><option value="published">Terbit</option></select></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">TANGGAL PUBLIKASI</label><input value={story.publishedAt ?? ""} onChange={(e) => { const next = [...content.stories]; next[index].publishedAt = e.target.value; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div></div><div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">ISI CERITA LENGKAP</label><textarea value={story.body} onChange={(e) => { const next = [...content.stories]; next[index].body = e.target.value; setContent({ ...content, stories: next }) }} rows={4} className="w-full rounded-lg border border-input bg-background p-2.5 text-xs outline-none focus:border-[#15945b]" /></div><div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">FOTO CERITA</label><div className="flex items-center gap-3"><div className="relative flex h-16 w-24 items-center justify-center overflow-hidden rounded border bg-background">{story.image ? <Image src={story.image.path} alt="Cerita" fill className="object-cover" unoptimized /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}</div><button onClick={() => triggerUpload(["stories", String(index), "image"])} disabled={uploading} className="inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50"><Upload className="mr-1 h-3.5 w-3.5" /> Ganti Foto</button></div></div><div className="flex items-center gap-4"><label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={story.featured} onChange={(e) => { const next = content.stories.map((x, idx) => ({ ...x, featured: idx === index ? e.target.checked : false })); setContent({ ...content, stories: next }) }} /> Cerita Unggulan</label><div className="flex items-center gap-2"><button disabled={index === 0} onClick={() => { const next = [...content.stories]; const tmp = next[index - 1]; next[index - 1] = next[index]; next[index] = tmp; next[index - 1].position = index - 1; next[index].position = index; setContent({ ...content, stories: next }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▲</button><button disabled={index === content.stories.length - 1} onClick={() => { const next = [...content.stories]; const tmp = next[index + 1]; next[index + 1] = next[index]; next[index] = tmp; next[index + 1].position = index + 1; next[index].position = index; setContent({ ...content, stories: next }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▼</button></div></div></div>)}</CardContent>}
              </Card>}

              <Card className="overflow-hidden border-border shadow-sm">
                <button type="button" onClick={() => setActiveSection(activeSection === "ecosystem" ? "" : "ecosystem")} className="flex w-full items-center gap-4 p-5 text-left hover:bg-accent/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b]"><Activity className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">Statistik Ekosistem</span><span className="mt-1 block text-xs text-muted-foreground">Atur judul section dan angka ekosistem publik.</span></span>
                  <span className="text-xs text-muted-foreground">{content.impactStats.items.length} item</span>{activeSection === "ecosystem" ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
                {activeSection === "ecosystem" && <CardContent className="space-y-5 border-t p-5">
                  <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">EYEBROW</label><input value={content.impactStats.eyebrow} onChange={e => setContent({ ...content, impactStats: { ...content.impactStats, eyebrow: e.target.value } })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm" /></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">JUDUL</label><input value={content.impactStats.title} onChange={e => setContent({ ...content, impactStats: { ...content.impactStats, title: e.target.value } })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm" /></div></div>
                  <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI</label><textarea rows={3} value={content.impactStats.description} onChange={e => setContent({ ...content, impactStats: { ...content.impactStats, description: e.target.value } })} className="w-full rounded-lg border bg-background p-3 text-sm" /></div>
                  <div className="flex justify-end"><button onClick={addImpactStat} className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#15945b] px-3 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Tambah Statistik</button></div>
                  {content.impactStats.items.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada statistik ekosistem.</div>}
                  {content.impactStats.items.map((item, index) => <div key={item.id} className="space-y-4 rounded-xl border bg-muted/40 p-4"><div className="flex justify-between"><b className="text-xs">STATISTIK #{index + 1}</b><button onClick={() => removeImpactStat(item.id)} className="text-xs text-destructive">Hapus</button></div><div className="grid gap-3 sm:grid-cols-4"><input aria-label="Prefix" placeholder="Prefix" value={item.prefix} onChange={e => { const items = [...content.impactStats.items]; items[index] = { ...item, prefix: e.target.value }; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }} className="h-9 rounded-lg border bg-background px-3 text-xs" /><input aria-label="Nilai" placeholder="Nilai" value={item.value} onChange={e => { const items = [...content.impactStats.items]; items[index] = { ...item, value: e.target.value }; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }} className="h-9 rounded-lg border bg-background px-3 text-xs" /><input aria-label="Suffix" placeholder="Suffix" value={item.suffix} onChange={e => { const items = [...content.impactStats.items]; items[index] = { ...item, suffix: e.target.value }; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }} className="h-9 rounded-lg border bg-background px-3 text-xs" /><select aria-label="Ikon" value={item.iconKey} onChange={e => { const items = [...content.impactStats.items]; items[index] = { ...item, iconKey: e.target.value as ImpactIconKey }; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }} className="h-9 rounded-lg border bg-background px-2 text-xs">{["users", "hand-heart", "building", "map-pin", "package", "chart", "calendar", "shield"].map(icon => <option key={icon}>{icon}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Label" placeholder="Label" value={item.label} onChange={e => { const items = [...content.impactStats.items]; items[index] = { ...item, label: e.target.value }; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }} className="h-9 rounded-lg border bg-background px-3 text-xs" /><input aria-label="Deskripsi" placeholder="Deskripsi" value={item.description} onChange={e => { const items = [...content.impactStats.items]; items[index] = { ...item, description: e.target.value }; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }} className="h-9 rounded-lg border bg-background px-3 text-xs" /></div><div className="flex gap-3"><label className="text-xs"><input type="checkbox" checked={item.visible} onChange={e => { const items = [...content.impactStats.items]; items[index] = { ...item, visible: e.target.checked }; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }} /> Tampilkan</label><button disabled={index === 0} onClick={() => { const items = [...content.impactStats.items]; [items[index - 1], items[index]] = [{ ...items[index], position: index - 1 }, { ...items[index - 1], position: index }]; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }}>▲</button><button disabled={index === content.impactStats.items.length - 1} onClick={() => { const items = [...content.impactStats.items]; [items[index], items[index + 1]] = [{ ...items[index + 1], position: index }, { ...items[index], position: index + 1 }]; setContent({ ...content, impactStats: { ...content.impactStats, items } }) }}>▼</button></div></div>)}
                </CardContent>}
              </Card>

              <Card className="overflow-hidden border-border shadow-sm">
                <button type="button" onClick={() => setActiveSection(activeSection === "cases" ? "" : "cases")} className="flex w-full items-center gap-4 p-5 text-left hover:bg-accent/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b]"><Layers className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">Studi Kasus</span><span className="text-xs text-muted-foreground">Bagaimana PIINDUNG bekerja pada setiap tahap pelayanan.</span></span>
                  <span className="text-xs">{content.caseStudies.items.length} item</span>{activeSection === "cases" ? <ChevronDown /> : <ChevronRight />}
                </button>
                {activeSection === "cases" && <CardContent className="space-y-5 border-t p-5">
                  <div className="grid gap-3 sm:grid-cols-2"><input aria-label="Eyebrow studi kasus" value={content.caseStudies.eyebrow} onChange={e => setContent({ ...content, caseStudies: { ...content.caseStudies, eyebrow: e.target.value } })} className="h-10 rounded-lg border bg-background px-3" /><input aria-label="Judul studi kasus" value={content.caseStudies.title} onChange={e => setContent({ ...content, caseStudies: { ...content.caseStudies, title: e.target.value } })} className="h-10 rounded-lg border bg-background px-3" /></div>
                  <textarea aria-label="Deskripsi studi kasus" rows={3} value={content.caseStudies.description} onChange={e => setContent({ ...content, caseStudies: { ...content.caseStudies, description: e.target.value } })} className="w-full rounded-lg border bg-background p-3" />
                  <div className="flex justify-end"><button onClick={addCaseStudy} className="rounded-lg bg-[#15945b] px-3 py-2 text-xs font-semibold text-white">Tambah Studi Kasus</button></div>
                  {content.caseStudies.items.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada studi kasus.</div>}
                  {content.caseStudies.items.map((item, index) => <div key={item.id} className="space-y-3 rounded-xl border bg-muted/40 p-4">
                    <div className="flex justify-between"><b className="text-xs">STUDI KASUS #{index + 1}</b><button onClick={() => removeCaseStudy(item.id)} className="text-xs text-destructive">Hapus</button></div>
                    <div className="grid gap-3 sm:grid-cols-2"><input aria-label="Step studi kasus" value={item.step} onChange={e => { const items = [...content.caseStudies.items]; items[index] = { ...item, step: e.target.value }; setContent({ ...content, caseStudies: { ...content.caseStudies, items } }) }} className="h-9 rounded-lg border bg-background px-3" /><input aria-label="Title studi kasus" value={item.title} onChange={e => { const items = [...content.caseStudies.items]; items[index] = { ...item, title: e.target.value }; setContent({ ...content, caseStudies: { ...content.caseStudies, items } }) }} className="h-9 rounded-lg border bg-background px-3" /></div>
                    <textarea aria-label="Deskripsi item studi kasus" value={item.description} onChange={e => { const items = [...content.caseStudies.items]; items[index] = { ...item, description: e.target.value }; setContent({ ...content, caseStudies: { ...content.caseStudies, items } }) }} className="w-full rounded-lg border bg-background p-3" />

                    {/* summaryItems nested editor */}
                    <div className="mt-4 border-t pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ringkasan / Metrics Mockup (Maks 4)</h4>
                        <button
                          type="button"
                          disabled={(item.summaryItems ?? []).length >= 4}
                          onClick={() => addSummaryItem(index)}
                          className="inline-flex h-7 items-center gap-1 rounded bg-[#15945b] px-2 text-[10px] font-semibold text-white hover:bg-[#107947] disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" /> Tambah Ringkasan
                        </button>
                      </div>
                      {(item.summaryItems ?? []).map((sum, sumIdx) => (
                        <div key={sum.id} className="grid gap-3 sm:grid-cols-5 items-center border border-dashed rounded-lg p-3 bg-muted/20">
                          <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                            <select
                              aria-label="Ikon Ringkasan"
                              value={sum.iconKey}
                              onChange={(e) => {
                                const nextStudies = [...content.caseStudies.items]
                                const nextSummary = [...(item.summaryItems ?? [])]
                                nextSummary[sumIdx] = { ...sum, iconKey: e.target.value }
                                nextStudies[index] = { ...item, summaryItems: nextSummary }
                                setContent({ ...content, caseStudies: { ...content.caseStudies, items: nextStudies } })
                              }}
                              className="h-8 rounded border bg-background px-1 text-xs"
                            >
                              {["users", "hand-heart", "building", "map-pin", "package", "chart", "calendar", "shield"].map(icon => (
                                <option key={icon}>{icon}</option>
                              ))}
                            </select>
                            <input
                              aria-label="Label Ringkasan"
                              placeholder="Label (eg. Munfiq)"
                              value={sum.label}
                              onChange={(e) => {
                                const nextStudies = [...content.caseStudies.items]
                                const nextSummary = [...(item.summaryItems ?? [])]
                                nextSummary[sumIdx] = { ...sum, label: e.target.value }
                                nextStudies[index] = { ...item, summaryItems: nextSummary }
                                setContent({ ...content, caseStudies: { ...content.caseStudies, items: nextStudies } })
                              }}
                              className="h-8 rounded border bg-background px-2 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                            <input
                              aria-label="Nilai Ringkasan"
                              placeholder="Nilai (eg. 3.482+)"
                              value={sum.value}
                              onChange={(e) => {
                                const nextStudies = [...content.caseStudies.items]
                                const nextSummary = [...(item.summaryItems ?? [])]
                                nextSummary[sumIdx] = { ...sum, value: e.target.value }
                                nextStudies[index] = { ...item, summaryItems: nextSummary }
                                setContent({ ...content, caseStudies: { ...content.caseStudies, items: nextStudies } })
                              }}
                              className="h-8 rounded border bg-background px-2 text-xs"
                            />
                            <input
                              aria-label="Status Ringkasan"
                              placeholder="Status (opsional)"
                              value={sum.status ?? ""}
                              onChange={(e) => {
                                const nextStudies = [...content.caseStudies.items]
                                const nextSummary = [...(item.summaryItems ?? [])]
                                nextSummary[sumIdx] = { ...sum, status: e.target.value }
                                nextStudies[index] = { ...item, summaryItems: nextSummary }
                                setContent({ ...content, caseStudies: { ...content.caseStudies, items: nextStudies } })
                              }}
                              className="h-8 rounded border bg-background px-2 text-xs"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <label className="text-[10px] flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={sum.visible}
                                onChange={(e) => {
                                  const nextStudies = [...content.caseStudies.items]
                                  const nextSummary = [...(item.summaryItems ?? [])]
                                  nextSummary[sumIdx] = { ...sum, visible: e.target.checked }
                                  nextStudies[index] = { ...item, summaryItems: nextSummary }
                                  setContent({ ...content, caseStudies: { ...content.caseStudies, items: nextStudies } })
                                }}
                              /> Tampil
                            </label>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={sumIdx === 0}
                                onClick={() => {
                                  const nextStudies = [...content.caseStudies.items]
                                  const nextSummary = [...(item.summaryItems ?? [])]
                                  ;[nextSummary[sumIdx - 1], nextSummary[sumIdx]] = [
                                    { ...nextSummary[sumIdx], position: sumIdx - 1 },
                                    { ...nextSummary[sumIdx - 1], position: sumIdx }
                                  ]
                                  nextStudies[index] = { ...item, summaryItems: nextSummary }
                                  setContent({ ...content, caseStudies: { ...content.caseStudies, items: nextStudies } })
                                }}
                                className="text-[10px] border px-1 rounded hover:bg-accent disabled:opacity-30"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={sumIdx === (item.summaryItems ?? []).length - 1}
                                onClick={() => {
                                  const nextStudies = [...content.caseStudies.items]
                                  const nextSummary = [...(item.summaryItems ?? [])]
                                  ;[nextSummary[sumIdx], nextSummary[sumIdx + 1]] = [
                                    { ...nextSummary[sumIdx + 1], position: sumIdx },
                                    { ...nextSummary[sumIdx], position: sumIdx + 1 }
                                  ]
                                  nextStudies[index] = { ...item, summaryItems: nextSummary }
                                  setContent({ ...content, caseStudies: { ...content.caseStudies, items: nextStudies } })
                                }}
                                className="text-[10px] border px-1 rounded hover:bg-accent disabled:opacity-30"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSummaryItem(index, sum.id)}
                                className="text-xs text-destructive hover:text-destructive/80"
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 border-t pt-3">
                      {item.image && <Image src={item.image.path} alt="Studi kasus" width={80} height={56} className="rounded object-cover" unoptimized />}
                      <button onClick={() => triggerUpload(["caseStudies", "items", String(index), "image"])} className="rounded border px-3 py-2 text-xs">Ganti Gambar</button>
                      <label className="text-xs"><input type="checkbox" checked={item.visible} onChange={e => { const items = [...content.caseStudies.items]; items[index] = { ...item, visible: e.target.checked }; setContent({ ...content, caseStudies: { ...content.caseStudies, items } }) }} /> Tampilkan</label>
                      <button disabled={index === 0} onClick={() => { const items = [...content.caseStudies.items]; [items[index - 1], items[index]] = [{ ...items[index], position: index - 1 }, { ...items[index - 1], position: index }]; setContent({ ...content, caseStudies: { ...content.caseStudies, items } }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▲</button>
                      <button disabled={index === content.caseStudies.items.length - 1} onClick={() => { const items = [...content.caseStudies.items]; [items[index], items[index + 1]] = [{ ...items[index + 1], position: index }, { ...items[index], position: index + 1 }]; setContent({ ...content, caseStudies: { ...content.caseStudies, items } }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▼</button>
                    </div>
                  </div>)}
                </CardContent>}
              </Card>

              <Card className="overflow-hidden border-border shadow-sm">
                <button type="button" onClick={() => setActiveSection(activeSection === "testimonials" ? "" : "testimonials")} className="flex w-full items-center gap-4 p-5 text-left hover:bg-accent/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15945b]/10 text-[#15945b]"><BookOpen className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">Testimoni</span><span className="text-xs text-muted-foreground">Suara pengurus dan mitra layanan.</span></span>
                  <span className="text-xs">{content.testimonials.items.length} item</span>{activeSection === "testimonials" ? <ChevronDown /> : <ChevronRight />}
                </button>
                {activeSection === "testimonials" && <CardContent className="space-y-5 border-t p-5">
                  <div className="grid gap-3 sm:grid-cols-2"><input aria-label="Eyebrow testimoni" value={content.testimonials.eyebrow} onChange={e => setContent({ ...content, testimonials: { ...content.testimonials, eyebrow: e.target.value } })} className="h-10 rounded-lg border bg-background px-3" /><input aria-label="Judul testimoni" value={content.testimonials.title} onChange={e => setContent({ ...content, testimonials: { ...content.testimonials, title: e.target.value } })} className="h-10 rounded-lg border bg-background px-3" /></div>
                  <textarea aria-label="Deskripsi testimoni" rows={3} value={content.testimonials.description} onChange={e => setContent({ ...content, testimonials: { ...content.testimonials, description: e.target.value } })} className="w-full rounded-lg border bg-background p-3" />
                  <div className="flex justify-end"><button onClick={addTestimonial} className="rounded-lg bg-[#15945b] px-3 py-2 text-xs font-semibold text-white">Tambah Testimoni</button></div>
                  {content.testimonials.items.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada testimoni.</div>}
                  {content.testimonials.items.map((item, index) => <div key={item.id} className="space-y-3 rounded-xl border bg-muted/40 p-4">
                    <div className="flex justify-between"><b className="text-xs">TESTIMONI #{index + 1}</b><button onClick={() => removeTestimonial(item.id)} className="text-xs text-destructive">Hapus</button></div>
                    <div className="grid gap-3 sm:grid-cols-2"><input aria-label="Nama testimoni" value={item.name} onChange={e => { const items = [...content.testimonials.items]; items[index] = { ...item, name: e.target.value }; setContent({ ...content, testimonials: { ...content.testimonials, items } }) }} className="h-9 rounded-lg border bg-background px-3" /><input aria-label="Role testimoni" value={item.role} onChange={e => { const items = [...content.testimonials.items]; items[index] = { ...item, role: e.target.value }; setContent({ ...content, testimonials: { ...content.testimonials, items } }) }} className="h-9 rounded-lg border bg-background px-3" /></div>
                    <textarea aria-label="Quote testimoni" value={item.quote} onChange={e => { const items = [...content.testimonials.items]; items[index] = { ...item, quote: e.target.value }; setContent({ ...content, testimonials: { ...content.testimonials, items } }) }} className="w-full rounded-lg border bg-background p-3" />
                    <div className="flex flex-wrap items-center gap-3">
                      {item.avatar && <Image src={item.avatar.path} alt={item.name} width={48} height={48} className="rounded-full object-cover" unoptimized />}
                      <button onClick={() => triggerUpload(["testimonials", "items", String(index), "avatar"])} className="rounded border px-3 py-2 text-xs">Ganti Avatar</button>
                      <label className="text-xs">Rating <select value={item.rating} onChange={e => { const items = [...content.testimonials.items]; items[index] = { ...item, rating: Number(e.target.value) }; setContent({ ...content, testimonials: { ...content.testimonials, items } }) }} className="ml-1 rounded border bg-background p-1">{[1,2,3,4,5].map(rating => <option key={rating}>{rating}</option>)}</select></label>
                      <label className="text-xs"><input type="checkbox" checked={item.visible} onChange={e => { const items = [...content.testimonials.items]; items[index] = { ...item, visible: e.target.checked }; setContent({ ...content, testimonials: { ...content.testimonials, items } }) }} /> Tampilkan</label>
                      <button disabled={index === 0} onClick={() => { const items = [...content.testimonials.items]; [items[index - 1], items[index]] = [{ ...items[index], position: index - 1 }, { ...items[index - 1], position: index }]; setContent({ ...content, testimonials: { ...content.testimonials, items } }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▲</button>
                      <button disabled={index === content.testimonials.items.length - 1} onClick={() => { const items = [...content.testimonials.items]; [items[index], items[index + 1]] = [{ ...items[index + 1], position: index }, { ...items[index], position: index + 1 }]; setContent({ ...content, testimonials: { ...content.testimonials, items } }) }} className="h-7 w-7 rounded border text-xs hover:bg-accent disabled:opacity-50">▼</button>
                    </div>
                  </div>)}
                </CardContent>}
              </Card>

            </div>

            <aside className="w-full shrink-0 lg:w-80">
              <Card className="sticky top-24 border-border bg-card shadow-sm"><CardContent className="space-y-4 p-5"><h3 className="flex items-center gap-2 font-bold text-foreground"><Layers className="h-5 w-5 text-primary" /> Pengendali Perubahan</h3><p className="text-xs leading-5 text-muted-foreground">Simpan semua draf perubahan ke database, atau batalkan perubahan lokal.</p><div className="flex flex-col gap-2 pt-2"><button onClick={save} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] font-semibold text-white transition hover:bg-[#107947] disabled:opacity-50"><Save className="h-4 w-4" /> Simpan Perubahan</button><button onClick={reset} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border font-semibold hover:bg-accent disabled:opacity-50">Batalkan</button></div></CardContent></Card>
            </aside>
          </div>
        ) : null}
      </div>
    </MemberLayout>
  )
}
