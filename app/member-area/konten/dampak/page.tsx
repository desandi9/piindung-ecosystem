"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, HardDrive, Image as ImageIcon, Layers, RefreshCcw, Save, Upload, Plus, Trash, Eye, Check } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { Card, CardContent } from "@/components/ui/card"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { ImpactContent, ImpactAsset, ImpactIconKey, Statistic, Achievement, ImpactStory, TimelineItem } from "@/lib/impact-content"

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
    if (!isLoading && !user) router.replace("/login?next=/member-area/konten/dampak")
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

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Pengaturan Dampak" breadcrumb="Member Area / Konten / Dampak">
      <div className="space-y-7 pb-12 overflow-x-hidden">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <button onClick={() => router.push("/member-area/konten")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</button>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">Dampak & Konten</p>
              <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Kelola Tampilan Dampak</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">Kelola narasi hero, statistik pencapaian, cerita penerima manfaat, dan alur pencapaian.</p>
            </div>
          </div>
        </motion.section>

        {success && <div className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{success}</div>}
        {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-3xl bg-card border border-border" />)}</div>
        ) : content ? (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-6">
              <input type="file" accept="image/png,image/jpeg" className="hidden" ref={fileInputRef} onChange={handleUpload} />

              {/* HERO SECTION */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5"><h2 className="text-lg font-bold">Bagian Hero</h2></div>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">EYEBROW</label><input value={content.hero.eyebrow} onChange={(e) => setContent({ ...content, hero: { ...content.hero, eyebrow: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">JUDUL UTAMA</label><input value={content.hero.title} onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">SOROTAN JUDUL</label><input value={content.hero.highlightedText} onChange={(e) => setContent({ ...content, hero: { ...content.hero, highlightedText: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI HERO</label><textarea value={content.hero.description} onChange={(e) => setContent({ ...content, hero: { ...content.hero, description: e.target.value } })} rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" /></div>
                </CardContent>
              </Card>

              {/* STATISTICS SECTION */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5 flex items-center justify-between"><h2 className="text-lg font-bold">Statistik Pencapaian</h2><button onClick={addStatistic} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15945b] text-white px-3 text-xs font-semibold hover:bg-[#107947]"><Plus className="h-3.5 w-3.5" /> Tambah</button></div>
                <CardContent className="p-5 space-y-6">
                  {content.statistics.map((stat, index) => (
                    <div key={stat.id} className="border border-border p-4 rounded-xl space-y-4 bg-muted/40">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">STATISTIK #{index + 1}</span><button onClick={() => removeStatistic(stat.id)} className="text-destructive hover:text-destructive/80 text-xs font-semibold flex items-center gap-1"><Trash className="h-3.5 w-3.5" /> Hapus</button></div>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">PREFIX</label><input value={stat.prefix} onChange={(e) => { const next = [...content.statistics]; next[index].prefix = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">NILAI</label><input value={stat.value} onChange={(e) => { const next = [...content.statistics]; next[index].value = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">SUFFIX</label><input value={stat.suffix} onChange={(e) => { const next = [...content.statistics]; next[index].suffix = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">IKON</label>
                          <select value={stat.iconKey} onChange={(e) => { const next = [...content.statistics]; next[index].iconKey = e.target.value as ImpactIconKey; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-[#15945b]">
                            <option value="users">users</option><option value="hand-heart">hand-heart</option><option value="building">building</option><option value="map-pin">map-pin</option><option value="package">package</option><option value="chart">chart</option><option value="calendar">calendar</option><option value="shield">shield</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">LABEL</label><input value={stat.label} onChange={(e) => { const next = [...content.statistics]; next[index].label = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI</label><input value={stat.description} onChange={(e) => { const next = [...content.statistics]; next[index].description = e.target.value; setContent({ ...content, statistics: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={stat.visible} onChange={(e) => { const next = [...content.statistics]; next[index].visible = e.target.checked; setContent({ ...content, statistics: next }) }} /> Tampilkan Publik</label>
                        <div className="flex items-center gap-2">
                          <button disabled={index === 0} onClick={() => { const next = [...content.statistics]; const tmp = next[index - 1]; next[index - 1] = next[index]; next[index] = tmp; next[index - 1].position = index - 1; next[index].position = index; setContent({ ...content, statistics: next }) }} className="h-7 w-7 border rounded hover:bg-accent disabled:opacity-50 text-xs">▲</button>
                          <button disabled={index === content.statistics.length - 1} onClick={() => { const next = [...content.statistics]; const tmp = next[index + 1]; next[index + 1] = next[index]; next[index] = tmp; next[index + 1].position = index + 1; next[index].position = index; setContent({ ...content, statistics: next }) }} className="h-7 w-7 border rounded hover:bg-accent disabled:opacity-50 text-xs">▼</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* ACHIEVEMENTS SECTION */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5 flex items-center justify-between"><h2 className="text-lg font-bold">Milestone & Penghargaan</h2><button onClick={addAchievement} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15945b] text-white px-3 text-xs font-semibold hover:bg-[#107947]"><Plus className="h-3.5 w-3.5" /> Tambah</button></div>
                <CardContent className="p-5 space-y-6">
                  {content.achievements.map((ach, index) => (
                    <div key={ach.id} className="border border-border p-4 rounded-xl space-y-4 bg-muted/40">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">PENCAPAIAN #{index + 1}</span><button onClick={() => removeAchievement(ach.id)} className="text-destructive hover:text-destructive/80 text-xs font-semibold flex items-center gap-1"><Trash className="h-3.5 w-3.5" /> Hapus</button></div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">JUDUL</label><input value={ach.title} onChange={(e) => { const next = [...content.achievements]; next[index].title = e.target.value; setContent({ ...content, achievements: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">TAHUN</label><input value={ach.year ?? ""} onChange={(e) => { const next = [...content.achievements]; next[index].year = e.target.value; setContent({ ...content, achievements: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">TAUTAN</label><input value={ach.link ?? ""} onChange={(e) => { const next = [...content.achievements]; next[index].link = e.target.value; setContent({ ...content, achievements: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                      </div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI</label><textarea value={ach.description} onChange={(e) => { const next = [...content.achievements]; next[index].description = e.target.value; setContent({ ...content, achievements: next }) }} rows={2} className="w-full rounded-lg border border-input bg-background p-2.5 text-xs outline-none focus:border-[#15945b]" /></div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">GAMBAR LAMPIRAN</label>
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-24 rounded border bg-background relative overflow-hidden flex items-center justify-center">{ach.image ? <Image src={ach.image.path} alt="Pencapaian" fill className="object-cover" unoptimized /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}</div>
                          <button onClick={() => triggerUpload(["achievements", String(index), "image"])} disabled={uploading} className="h-9 rounded-lg border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50"><Upload className="h-3.5 w-3.5 inline mr-1" /> Ganti Gambar</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={ach.visible} onChange={(e) => { const next = [...content.achievements]; next[index].visible = e.target.checked; setContent({ ...content, achievements: next }) }} /> Tampilkan Publik</label>
                        <div className="flex items-center gap-2">
                          <button disabled={index === 0} onClick={() => { const next = [...content.achievements]; const tmp = next[index - 1]; next[index - 1] = next[index]; next[index] = tmp; next[index - 1].position = index - 1; next[index].position = index; setContent({ ...content, achievements: next }) }} className="h-7 w-7 border rounded hover:bg-accent disabled:opacity-50 text-xs">▲</button>
                          <button disabled={index === content.achievements.length - 1} onClick={() => { const next = [...content.achievements]; const tmp = next[index + 1]; next[index + 1] = next[index]; next[index] = tmp; next[index + 1].position = index + 1; next[index].position = index; setContent({ ...content, achievements: next }) }} className="h-7 w-7 border rounded hover:bg-accent disabled:opacity-50 text-xs">▼</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* IMPACT STORIES SECTION */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5 flex items-center justify-between"><h2 className="text-lg font-bold">Cerita Penerima Manfaat</h2><button onClick={addStory} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15945b] text-white px-3 text-xs font-semibold hover:bg-[#107947]"><Plus className="h-3.5 w-3.5" /> Tambah</button></div>
                <CardContent className="p-5 space-y-6">
                  {content.stories.map((story, index) => (
                    <div key={story.id} className="border border-border p-4 rounded-xl space-y-4 bg-muted/40">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">CERITA #{index + 1}</span><button onClick={() => removeStory(story.id)} className="text-destructive hover:text-destructive/80 text-xs font-semibold flex items-center gap-1"><Trash className="h-3.5 w-3.5" /> Hapus</button></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">JUDUL CERITA</label><input value={story.title} onChange={(e) => { const next = [...content.stories]; next[index].title = e.target.value; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">RINGKASAN</label><input value={story.excerpt} onChange={(e) => { const next = [...content.stories]; next[index].excerpt = e.target.value; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">LOKASI</label><input value={story.location ?? ""} onChange={(e) => { const next = [...content.stories]; next[index].location = e.target.value; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">STATUS</label>
                          <select value={story.status} onChange={(e) => { const next = [...content.stories]; next[index].status = e.target.value as "draft" | "published"; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-[#15945b]">
                            <option value="draft">Draft</option><option value="published">Terbit</option>
                          </select>
                        </div>
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">TANGGAL PUBLIKASI</label><input value={story.publishedAt ?? ""} onChange={(e) => { const next = [...content.stories]; next[index].publishedAt = e.target.value; setContent({ ...content, stories: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                      </div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">ISI CERITA LENGKAP</label><textarea value={story.body} onChange={(e) => { const next = [...content.stories]; next[index].body = e.target.value; setContent({ ...content, stories: next }) }} rows={4} className="w-full rounded-lg border border-input bg-background p-2.5 text-xs outline-none focus:border-[#15945b]" /></div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">FOTO CERITA</label>
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-24 rounded border bg-background relative overflow-hidden flex items-center justify-center">{story.image ? <Image src={story.image.path} alt="Cerita" fill className="object-cover" unoptimized /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}</div>
                          <button onClick={() => triggerUpload(["stories", String(index), "image"])} disabled={uploading} className="h-9 rounded-lg border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50"><Upload className="h-3.5 w-3.5 inline mr-1" /> Ganti Foto</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={story.featured} onChange={(e) => { const next = content.stories.map((x, idx) => ({ ...x, featured: idx === index ? e.target.checked : false })); setContent({ ...content, stories: next }) }} /> Cerita Unggulan</label>
                        <div className="flex items-center gap-2">
                          <button disabled={index === 0} onClick={() => { const next = [...content.stories]; const tmp = next[index - 1]; next[index - 1] = next[index]; next[index] = tmp; next[index - 1].position = index - 1; next[index].position = index; setContent({ ...content, stories: next }) }} className="h-7 w-7 border rounded hover:bg-accent disabled:opacity-50 text-xs">▲</button>
                          <button disabled={index === content.stories.length - 1} onClick={() => { const next = [...content.stories]; const tmp = next[index + 1]; next[index + 1] = next[index]; next[index] = tmp; next[index + 1].position = index + 1; next[index].position = index; setContent({ ...content, stories: next }) }} className="h-7 w-7 border rounded hover:bg-accent disabled:opacity-50 text-xs">▼</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* TIMELINE SECTION */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5 flex items-center justify-between"><h2 className="text-lg font-bold">Timeline & Alur</h2><button onClick={addTimeline} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15945b] text-white px-3 text-xs font-semibold hover:bg-[#107947]"><Plus className="h-3.5 w-3.5" /> Tambah</button></div>
                <CardContent className="p-5 space-y-6">
                  {content.timeline.map((time, index) => (
                    <div key={time.id} className="border border-border p-4 rounded-xl space-y-4 bg-muted/40">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">TIMELINE #{index + 1}</span><button onClick={() => removeTimeline(time.id)} className="text-destructive hover:text-destructive/80 text-xs font-semibold flex items-center gap-1"><Trash className="h-3.5 w-3.5" /> Hapus</button></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">LABEL TAHUN / TAHAP</label><input value={time.yearLabel} onChange={(e) => { const next = [...content.timeline]; next[index].yearLabel = e.target.value; setContent({ ...content, timeline: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">JUDUL</label><input value={time.title} onChange={(e) => { const next = [...content.timeline]; next[index].title = e.target.value; setContent({ ...content, timeline: next }) }} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#15945b]" /></div>
                      </div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI</label><textarea value={time.description} onChange={(e) => { const next = [...content.timeline]; next[index].description = e.target.value; setContent({ ...content, timeline: next }) }} rows={2} className="w-full rounded-lg border border-input bg-background p-2.5 text-xs outline-none focus:border-[#15945b]" /></div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={time.visible} onChange={(e) => { const next = [...content.timeline]; next[index].visible = e.target.checked; setContent({ ...content, timeline: next }) }} /> Tampilkan Publik</label>
                        <div className="flex items-center gap-2">
                          <button disabled={index === 0} onClick={() => { const next = [...content.timeline]; const tmp = next[index - 1]; next[index - 1] = next[index]; next[index] = tmp; next[index - 1].position = index - 1; next[index].position = index; setContent({ ...content, timeline: next }) }} className="h-7 w-7 border rounded hover:bg-accent disabled:opacity-50 text-xs">▲</button>
                          <button disabled={index === content.timeline.length - 1} onClick={() => { const next = [...content.timeline]; const tmp = next[index + 1]; next[index + 1] = next[index]; next[index] = tmp; next[index + 1].position = index + 1; next[index].position = index; setContent({ ...content, timeline: next }) }} className="h-7 w-7 border rounded hover:bg-accent disabled:opacity-50 text-xs">▼</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* CTA SECTION */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5"><h2 className="text-lg font-bold">Call to Action (CTA)</h2></div>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">EYEBROW CTA</label><input value={content.callToAction.eyebrow} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, eyebrow: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">JUDUL CTA</label><input value={content.callToAction.title} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, title: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI CTA</label><textarea value={content.callToAction.description} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, description: e.target.value } })} rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">LABEL TOMBOL UTAMA</label><input value={content.callToAction.primaryLabel} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, primaryLabel: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">TAUTAN TOMBOL UTAMA</label><input value={content.callToAction.primaryHref} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, primaryHref: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">LABEL TOMBOL KEDUA</label><input value={content.callToAction.secondaryLabel} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, secondaryLabel: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">TAUTAN TOMBOL KEDUA</label><input value={content.callToAction.secondaryHref} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, secondaryHref: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={content.callToAction.visible} onChange={(e) => setContent({ ...content, callToAction: { ...content.callToAction, visible: e.target.checked } })} /> Tampilkan Publik</label>
                  </div>
                </CardContent>
              </Card>

            </div>

            <aside className="w-full lg:w-80 shrink-0">
              <Card className="border-border bg-card shadow-sm sticky top-24">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-foreground flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Pengendali Perubahan</h3>
                  <p className="text-xs text-muted-foreground leading-5">Simpan semua draf perubahan ke database, atau batalkan perubahan lokal.</p>
                  <div className="flex flex-col gap-2 pt-2">
                    <button onClick={save} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] text-white font-semibold transition hover:bg-[#107947] disabled:opacity-50">
                      <Save className="h-4 w-4" /> Simpan Perubahan
                    </button>
                    <button onClick={reset} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border font-semibold hover:bg-accent disabled:opacity-50">
                      Batalkan
                    </button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        ) : null}
      </div>
    </MemberLayout>
  )
}
