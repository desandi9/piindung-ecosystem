"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, HardDrive, Image as ImageIcon, Layers, RefreshCcw, Save, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { Card, CardContent } from "@/components/ui/card"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { SiteBranding, BrandAsset } from "@/lib/site-branding"

export default function MemberMediaBrandingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const [content, setContent] = useState<SiteBranding | null>(null)
  const [original, setOriginal] = useState<SiteBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ path: string[] } | null>(null)
  const [uploading, setUploading] = useState(false)

  const ready = !isLoading && user?.role === "super_admin_pc"
  const hasChanges = useMemo(() => JSON.stringify(content) !== JSON.stringify(original), [content, original])
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem

  const load = useCallback(async () => {
    setLoading(true); setError(""); setSuccess("")
    try {
      const res = await fetch("/api/site-branding/manage", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal memuat branding.")
      setContent(data.branding)
      setOriginal(JSON.parse(JSON.stringify(data.branding)))
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat branding.") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/member-area/konten/media")
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])

  useEffect(() => { if (ready) void load() }, [load, ready])
  useEffect(() => {
    if (!hasChanges) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [hasChanges])

  const migrate = async () => {
    if (migrating) return
    setMigrating(true); setError(""); setSuccess("")
    try {
      const res = await fetch("/api/site-branding/migrate", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal migrasi.")
      setContent(data.branding)
      setOriginal(JSON.parse(JSON.stringify(data.branding)))
      setSuccess(data.migrated ? `Migrasi selesai (${data.skippedCount} terlewati).` : "Data sudah termigrasi.")
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal memigrasikan branding.") }
    finally { setMigrating(false) }
  }

  const save = async () => {
    if (!content || saving) return
    setSaving(true); setError(""); setSuccess("")
    try {
      const res = await fetch("/api/site-branding/manage", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.")
      setContent(data.branding)
      setOriginal(JSON.parse(JSON.stringify(data.branding)))
      setSuccess("Branding berhasil disimpan.")
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan branding.") }
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
      const res = await fetch("/api/site-branding/upload", { method: "POST", body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah file.")
      const asset: BrandAsset = data.asset
      const next = JSON.parse(JSON.stringify(content))
      let ptr = next
      for (let i = 0; i < uploadTarget.path.length - 1; i++) ptr = ptr[uploadTarget.path[i]]
      ptr[uploadTarget.path[uploadTarget.path.length - 1]] = asset
      setContent(next)
      setSuccess("File berhasil diunggah.")
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal mengunggah file.") }
    finally { setUploading(false); setUploadTarget(null); event.target.value = "" }
  }

  const triggerUpload = (path: string[]) => { setUploadTarget({ path }); fileInputRef.current?.click() }

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Media & Branding" breadcrumb="Member Area / Konten / Media">
      <div className="space-y-7 pb-12 overflow-x-hidden">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <button onClick={() => router.push("/member-area/konten")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</button>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">Media & Branding</p>
              <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Kelola Branding Portal</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">Kelola aset logo public navbar, footer, app icons, open graph image, dan fallback media.</p>
            </div>
            <button onClick={migrate} disabled={migrating || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-accent disabled:opacity-60"><RefreshCcw className={cn("h-4 w-4", migrating && "animate-spin")} /> Migrasi Media Lama</button>
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

              <Card className="border-border shadow-sm"><div className="border-b border-border p-5"><h2 className="text-lg font-bold">Identitas Organisasi</h2></div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">NAMA ORGANISASI</label><input value={content.identity.organizationName} onChange={(e) => setContent({ ...content, identity: { ...content.identity, organizationName: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">NAMA PENDEK</label><input value={content.identity.shortName} onChange={(e) => setContent({ ...content, identity: { ...content.identity, shortName: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">TAGLINE</label><input value={content.identity.tagline} onChange={(e) => setContent({ ...content, identity: { ...content.identity, tagline: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">ALT TEXT LOGO</label><input value={content.identity.logoAltText} onChange={(e) => setContent({ ...content, identity: { ...content.identity, logoAltText: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm"><div className="border-b border-border p-5"><h2 className="text-lg font-bold">Navbar Logos</h2></div>
                <CardContent className="p-5 grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground">NAVBAR LIGHT THEME</label>
                    <div className="h-24 w-full rounded-2xl bg-white border border-border flex items-center justify-center p-4 relative overflow-hidden"><Image src={content.logos.navbarLight.path} alt="Logo Navbar Light" fill className="object-contain p-2" unoptimized /></div>
                    <button onClick={() => triggerUpload(["logos", "navbarLight"])} disabled={uploading} className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent disabled:opacity-50"><Upload className="h-4 w-4" /> Replace Image</button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground">NAVBAR DARK THEME</label>
                    <div className="h-24 w-full rounded-2xl bg-slate-950 border border-border flex items-center justify-center p-4 relative overflow-hidden"><Image src={content.logos.navbarDark.path} alt="Logo Navbar Dark" fill className="object-contain p-2" unoptimized /></div>
                    <button onClick={() => triggerUpload(["logos", "navbarDark"])} disabled={uploading} className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent disabled:opacity-50"><Upload className="h-4 w-4" /> Replace Image</button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm"><div className="border-b border-border p-5"><h2 className="text-lg font-bold">App Icons & Favicon</h2></div>
                <CardContent className="p-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground">FAVICON</label>
                    <div className="h-24 w-full rounded-2xl bg-muted border border-border flex items-center justify-center p-4 relative overflow-hidden"><Image src={content.icons.favicon.path} alt="Favicon" fill className="object-contain p-4" unoptimized /></div>
                    <button onClick={() => triggerUpload(["icons", "favicon"])} disabled={uploading} className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent disabled:opacity-50"><Upload className="h-4 w-4" /> Replace Image</button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground">APPLE TOUCH ICON</label>
                    <div className="h-24 w-full rounded-2xl bg-muted border border-border flex items-center justify-center p-4 relative overflow-hidden"><Image src={content.icons.appleTouchIcon.path} alt="Apple Icon" fill className="object-contain p-4" unoptimized /></div>
                    <button onClick={() => triggerUpload(["icons", "appleTouchIcon"])} disabled={uploading} className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent disabled:opacity-50"><Upload className="h-4 w-4" /> Replace Image</button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground">SQUARE MARK</label>
                    <div className="h-24 w-full rounded-2xl bg-muted border border-border flex items-center justify-center p-4 relative overflow-hidden"><Image src={content.logos.squareMark.path} alt="Square Mark" fill className="object-contain p-4" unoptimized /></div>
                    <button onClick={() => triggerUpload(["logos", "squareMark"])} disabled={uploading} className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent disabled:opacity-50"><Upload className="h-4 w-4" /> Replace Image</button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm"><div className="border-b border-border p-5"><h2 className="text-lg font-bold">Social Preview (Open Graph)</h2></div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-muted-foreground">DEFAULT OG IMAGE</label>
                      <div className="h-36 w-full rounded-2xl bg-muted border border-border flex items-center justify-center p-4 relative overflow-hidden"><Image src={content.socialPreview.defaultOgImage.path} alt={content.socialPreview.defaultOgAlt} fill className="object-cover" unoptimized /></div>
                      <button onClick={() => triggerUpload(["socialPreview", "defaultOgImage"])} disabled={uploading} className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent disabled:opacity-50"><Upload className="h-4 w-4" /> Replace Image</button>
                    </div>
                    <div className="space-y-3 flex flex-col justify-end">
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DEFAULT OG TITLE</label><input value={content.socialPreview.defaultOgTitle} onChange={(e) => setContent({ ...content, socialPreview: { ...content.socialPreview, defaultOgTitle: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DEFAULT OG DESCRIPTION</label><textarea value={content.socialPreview.defaultOgDescription} onChange={(e) => setContent({ ...content, socialPreview: { ...content.socialPreview, defaultOgDescription: e.target.value } })} rows={2} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            <aside className="w-full lg:w-80 shrink-0">
              <Card className="border-border bg-card shadow-sm sticky top-24">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-foreground flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Pengendali Perubahan</h3>
                  <p className="text-xs text-muted-foreground leading-5">Simpan semua perubahan aset dan teks ke database, atau batalkan draf perubahan lokal.</p>
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
