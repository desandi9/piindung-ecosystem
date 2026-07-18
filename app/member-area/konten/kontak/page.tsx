"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowLeft, Clock, Globe2, HelpCircle, Layers, Mail, MapPin, MessageCircle, Phone, Pencil, Plus, RefreshCcw, Save, Trash2, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { Card, CardContent } from "@/components/ui/card"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { ALLOWED_SOCIAL_PLATFORMS, type SiteContactContent, type SocialLink, type OfficeHourItem, type SocialPlatform, type FooterSettings } from "@/lib/site-contact"

export default function MemberContactPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const [content, setContent] = useState<SiteContactContent | null>(null)
  const [original, setOriginal] = useState<SiteContactContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form Modals State
  const [socialModal, setSocialModal] = useState<{ mode: "add" | "edit"; link?: SocialLink } | null>(null)
  const [hoursModal, setHoursModal] = useState<{ mode: "add" | "edit"; item?: OfficeHourItem } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "social" | "hours"; id: string; name: string } | null>(null)

  const ready = !isLoading && (user?.role === "super_admin_pc" || user?.role === "admin_pc")
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp

  const loadContent = useCallback(async () => {
    setLoading(true); setError(""); setSuccess("")
    try {
      const response = await fetch("/api/site-contact/manage", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memuat data kontak.")
      setContent(data.contact)
      setOriginal(JSON.parse(JSON.stringify(data.contact)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data kontak.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/member-area/konten/kontak")
    else if (!isLoading && user?.role !== "super_admin_pc" && user?.role !== "admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])

  useEffect(() => {
    if (ready) void loadContent()
  }, [loadContent, ready])

  const handleMigrate = async () => {
    if (migrating) return
    setMigrating(true); setError(""); setSuccess("")
    try {
      const response = await fetch("/api/site-contact/migrate", { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memigrasikan data kontak.")
      setContent(data.contact)
      setOriginal(JSON.parse(JSON.stringify(data.contact)))
      setSuccess(data.migrated ? "Data lama berhasil dimigrasikan." : "Data kontak sudah bermigrasi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memigrasikan data.")
    } finally {
      setMigrating(false)
    }
  }

  const handleSave = async () => {
    if (!content || saving) return
    setSaving(true); setError(""); setSuccess("")
    try {
      const response = await fetch("/api/site-contact/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan data kontak.")
      setContent(data.contact)
      setOriginal(JSON.parse(JSON.stringify(data.contact)))
      setSuccess("Perubahan data kontak berhasil disimpan.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data.")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (original) {
      setContent(JSON.parse(JSON.stringify(original)))
      setError(""); setSuccess("Perubahan dibatalkan.")
    }
  }

  const hasChanges = useMemo(() => {
    return JSON.stringify(content) !== JSON.stringify(original)
  }, [content, original])

  // Move Helpers
  const handleMoveSocial = (index: number, direction: "up" | "down") => {
    if (!content) return
    const next = [...content.socialLinks]
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    next.forEach((item, i) => { item.position = i + 1 })
    setContent({ ...content, socialLinks: next })
  }

  const handleMoveHours = (index: number, direction: "up" | "down") => {
    if (!content) return
    const next = [...content.officeHours.items]
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    next.forEach((item, i) => { item.position = i + 1 })
    setContent({ ...content, officeHours: { ...content.officeHours, items: next } })
  }

  const handleSaveSocial = (values: { id: string; platform: SocialPlatform; label: string; url: string; visible: boolean }) => {
    if (!content) return
    const links = [...content.socialLinks]
    if (socialModal?.mode === "add") {
      if (links.some((l) => l.id === values.id)) {
        setError("ID media sosial sudah digunakan.")
        return
      }
      links.push({ ...values, position: links.length + 1 })
    } else if (socialModal?.link) {
      const idx = links.findIndex((l) => l.id === socialModal.link!.id)
      if (idx !== -1) links[idx] = { ...links[idx], ...values }
    }
    setContent({ ...content, socialLinks: links })
    setSocialModal(null)
  }

  const handleSaveHours = (values: { id: string; dayLabel: string; timeLabel: string }) => {
    if (!content) return
    const items = [...content.officeHours.items]
    if (hoursModal?.mode === "add") {
      if (items.some((h) => h.id === values.id)) {
        setError("ID jam layanan sudah digunakan.")
        return
      }
      items.push({ ...values, position: items.length + 1 })
    } else if (hoursModal?.item) {
      const idx = items.findIndex((h) => h.id === hoursModal.item!.id)
      if (idx !== -1) items[idx] = { ...items[idx], ...values }
    }
    setContent({ ...content, officeHours: { ...content.officeHours, items } })
    setHoursModal(null)
  }

  const handleDeleteConfirm = () => {
    if (!content || !deleteTarget) return
    const { type, id } = deleteTarget
    if (type === "social") {
      const next = content.socialLinks.filter((l) => l.id !== id).map((l, i) => ({ ...l, position: i + 1 }))
      setContent({ ...content, socialLinks: next })
    } else {
      const next = content.officeHours.items.filter((h) => h.id !== id).map((h, i) => ({ ...h, position: i + 1 }))
      setContent({ ...content, officeHours: { ...content.officeHours, items: next } })
    }
    setDeleteTarget(null)
  }

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Kontak & Footer" breadcrumb="Member Area / Konten / Kontak">
      <div className="space-y-7 pb-12">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <button onClick={() => router.push("/member-area/konten")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</button>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">Kontak & Footer</p>
              <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Kelola Kontak & Footer</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">Kelola alamat kantor, nomor WhatsApp, email, media sosial, jam layanan, dan setelan tampilan footer portal PIINDUNG.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleMigrate} disabled={migrating || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-accent">
                <RefreshCcw className={cn("h-4 w-4", migrating && "animate-spin")} /> Migrasi Data
              </button>
            </div>
          </div>
        </motion.section>

        {success && <div role="status" className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{success}</div>}
        {error && <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-3xl bg-card border border-border" />)}</div>
        ) : content ? (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-6">
              {/* Organization Form */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5"><h2 className="text-lg font-bold">Profil Organisasi</h2></div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">NAMA ORGANISASI</label><input value={content.organization.name} onChange={(e) => setContent({ ...content, organization: { ...content.organization, name: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">NAMA PENDEK</label><input value={content.organization.shortName} onChange={(e) => setContent({ ...content, organization: { ...content.organization, shortName: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI SINGKAT</label><textarea value={content.organization.description} onChange={(e) => setContent({ ...content, organization: { ...content.organization, description: e.target.value } })} rows={2} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">ALAMAT LENGKAP</label><textarea value={content.organization.address} onChange={(e) => setContent({ ...content, organization: { ...content.organization, address: e.target.value } })} rows={2} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">KOTA / KABUPATEN</label><input value={content.organization.city} onChange={(e) => setContent({ ...content, organization: { ...content.organization, city: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">KODE POS</label><input value={content.organization.postalCode} onChange={(e) => setContent({ ...content, organization: { ...content.organization, postalCode: e.target.value.replace(/\D/g, "") } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">GOOGLE MAPS EMBED URL (HTTPS ONLY)</label><input value={content.organization.mapUrl} onChange={(e) => setContent({ ...content, organization: { ...content.organization, mapUrl: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                </CardContent>
              </Card>

              {/* Public Contact Form */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5"><h2 className="text-lg font-bold">Informasi Kontak Utama</h2></div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">EMAIL PORTAL</label><input type="email" value={content.contact.email} onChange={(e) => setContent({ ...content, contact: { ...content.contact, email: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">NAMA LABEL DUKUNGAN</label><input value={content.contact.supportLabel} onChange={(e) => setContent({ ...content, contact: { ...content.contact, supportLabel: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">NOMOR WHATSAPP</label><input value={content.contact.whatsappNumber} onChange={(e) => setContent({ ...content, contact: { ...content.contact, whatsappNumber: e.target.value.replace(/\D/g, "") } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">TAMPILAN TELEPON (DISPLAY)</label><input value={content.contact.phoneDisplay} onChange={(e) => setContent({ ...content, contact: { ...content.contact, phoneDisplay: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">HREF TELEPON (DIGITS ONLY)</label><input value={content.contact.phoneHref} onChange={(e) => setContent({ ...content, contact: { ...content.contact, phoneHref: e.target.value.replace(/[^\d+]/g, "") } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">PESAN DEFAULT WHATSAPP</label><input value={content.contact.whatsappMessage} onChange={(e) => setContent({ ...content, contact: { ...content.contact, whatsappMessage: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                </CardContent>
              </Card>

              {/* Office Hours */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5 flex items-center justify-between"><h2 className="text-lg font-bold">Jam Layanan</h2><button onClick={() => setHoursModal({ mode: "add" })} className="inline-flex h-9 px-3 items-center gap-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-accent"><Plus className="h-4 w-4" /> Tambah Jam</button></div>
                <CardContent className="p-5 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={content.officeHours.visible} onChange={(e) => setContent({ ...content, officeHours: { ...content.officeHours, visible: e.target.checked } })} className="h-4 w-4 rounded border-input text-[#15945b] focus:ring-[#15945b]" /><span className="text-sm font-semibold text-foreground">Tampilkan jam layanan di portal</span></label>
                  <div className="divide-y divide-border">
                    {content.officeHours.items.map((item, index) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="text-sm">
                          <span className="font-semibold text-foreground">{item.dayLabel}</span>
                          <span className="mx-2 text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{item.timeLabel}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleMoveHours(index, "up")} disabled={index === 0} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs disabled:opacity-40">↑</button>
                          <button onClick={() => handleMoveHours(index, "down")} disabled={index === content.officeHours.items.length - 1} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs disabled:opacity-40">↓</button>
                          <button onClick={() => setHoursModal({ mode: "edit", item })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteTarget({ type: "hours", id: item.id, name: `${item.dayLabel}: ${item.timeLabel}` })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                    {content.officeHours.items.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Belum ada data jam layanan.</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5 flex items-center justify-between"><h2 className="text-lg font-bold">Media Sosial</h2><button onClick={() => setSocialModal({ mode: "add" })} className="inline-flex h-9 px-3 items-center gap-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-accent"><Plus className="h-4 w-4" /> Tambah Media</button></div>
                <CardContent className="p-5 divide-y divide-border">
                  {content.socialLinks.map((link, index) => (
                    <div key={link.id} className={cn("py-3 first:pt-0 last:pb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", !link.visible && "opacity-60")}>
                      <div className="text-sm">
                        <span className="font-semibold text-foreground capitalize">{link.platform}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{link.label}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#15945b] hover:underline break-all">{link.url}</a>
                      </div>
                      <div className="flex gap-1 justify-end shrink-0">
                        <button onClick={() => handleMoveSocial(index, "up")} disabled={index === 0} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs disabled:opacity-40">↑</button>
                        <button onClick={() => handleMoveSocial(index, "down")} disabled={index === content.socialLinks.length - 1} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs disabled:opacity-40">↓</button>
                        <button onClick={() => setSocialModal({ mode: "edit", link })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget({ type: "social", id: link.id, name: link.label })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  {content.socialLinks.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Belum ada tautan media sosial.</p>}
                </CardContent>
              </Card>

              {/* Footer Customizer */}
              <Card className="border-border shadow-sm">
                <div className="border-b border-border p-5"><h2 className="text-lg font-bold">Pengaturan Tampilan Footer</h2></div>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">DESKRIPSI SINGKAT FOOTER</label><textarea value={content.footer.description} onChange={(e) => setContent({ ...content, footer: { ...content.footer, description: e.target.value } })} rows={2} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">TEKS HAK CIPTA (COPYRIGHT)</label><input value={content.footer.copyrightText} onChange={(e) => setContent({ ...content, footer: { ...content.footer, copyrightText: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">TEKS SEKUNDER FOOTER (SLOGAN)</label><input value={content.footer.secondaryText} onChange={(e) => setContent({ ...content, footer: { ...content.footer, secondaryText: e.target.value } })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></div>
                  </div>
                  <div className="grid gap-4 pt-2 sm:grid-cols-3">
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={content.footer.showAddress} onChange={(e) => setContent({ ...content, footer: { ...content.footer, showAddress: e.target.checked } })} className="h-4 w-4 rounded border-input text-[#15945b]" /><span className="text-sm font-semibold text-foreground">Tampilkan Alamat</span></label>
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={content.footer.showContact} onChange={(e) => setContent({ ...content, footer: { ...content.footer, showContact: e.target.checked } })} className="h-4 w-4 rounded border-input text-[#15945b]" /><span className="text-sm font-semibold text-foreground">Tampilkan Kontak</span></label>
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={content.footer.showSocialLinks} onChange={(e) => setContent({ ...content, footer: { ...content.footer, showSocialLinks: e.target.checked } })} className="h-4 w-4 rounded border-input text-[#15945b]" /><span className="text-sm font-semibold text-foreground">Tampilkan Medsos</span></label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="w-full lg:w-80 shrink-0">
              <Card className="border-border bg-card shadow-sm sticky top-24">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-foreground flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Pengendali Perubahan</h3>
                  <p className="text-xs text-muted-foreground leading-5">Simpan semua perubahan kontak & footer ke database, atau batalkan draf perubahan lokal.</p>
                  <div className="flex flex-col gap-2 pt-2">
                    <button onClick={handleSave} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] text-white font-semibold transition hover:bg-[#107947] disabled:opacity-50">
                      <Save className="h-4 w-4" /> Simpan Perubahan
                    </button>
                    <button onClick={handleReset} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border font-semibold hover:bg-accent disabled:opacity-50">
                      Batalkan
                    </button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {socialModal && (
          <SocialLinkDialog
            mode={socialModal.mode}
            link={socialModal.link}
            onClose={() => setSocialModal(null)}
            onSave={handleSaveSocial}
            reduced={Boolean(prefersReducedMotion)}
          />
        )}

        {hoursModal && (
          <OfficeHourDialog
            mode={hoursModal.mode}
            item={hoursModal.item}
            onClose={() => setHoursModal(null)}
            onSave={handleSaveHours}
            reduced={Boolean(prefersReducedMotion)}
          />
        )}

        {deleteTarget && (
          <ConfirmDeleteDialog
            target={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDeleteConfirm}
            reduced={Boolean(prefersReducedMotion)}
          />
        )}
      </AnimatePresence>
    </MemberLayout>
  )
}

function SocialLinkDialog({ mode, link, onClose, onSave, reduced }: { mode: "add" | "edit"; link?: SocialLink; onClose: () => void; onSave: (val: any) => void; reduced: boolean }) {
  const [platform, setPlatform] = useState<SocialPlatform>(link?.platform ?? "instagram")
  const [label, setLabel] = useState(link?.label ?? "Instagram")
  const [url, setUrl] = useState(link?.url ?? "")
  const [visible, setVisible] = useState(link?.visible ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ id: link?.id ?? platform, platform, label: label.trim(), url: url.trim(), visible })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} className="w-full rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-[24px] max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h2 className="text-xl font-bold">{mode === "add" ? "Tambah Medsos" : "Edit Medsos"}</h2>
          <button onClick={onClose} className="h-11 w-11 border border-border rounded-xl flex items-center justify-center"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">PLATFORM</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatform)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]">
              {ALLOWED_SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">LABEL TOMBOL</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">URL TAUTAN (HTTPS ONLY)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/..." required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 rounded border-input text-[#15945b]" />
            <span className="text-sm font-semibold text-foreground">Tampilkan tautan ini di footer</span>
          </label>
          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-5 font-semibold text-muted-foreground hover:bg-accent">Batal</button>
            <button type="submit" className="min-h-11 rounded-xl bg-primary text-primary-foreground px-5 font-semibold hover:bg-primary/90">Simpan</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function OfficeHourDialog({ mode, item, onClose, onSave, reduced }: { mode: "add" | "edit"; item?: OfficeHourItem; onClose: () => void; onSave: (val: any) => void; reduced: boolean }) {
  const [dayLabel, setDayLabel] = useState(item?.dayLabel ?? "")
  const [timeLabel, setTimeLabel] = useState(item?.timeLabel ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ id: item?.id ?? `hours-${Date.now()}`, dayLabel: dayLabel.trim(), timeLabel: timeLabel.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} className="w-full rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-[24px]">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h2 className="text-xl font-bold">{mode === "add" ? "Tambah Jam" : "Edit Jam Layanan"}</h2>
          <button onClick={onClose} className="h-11 w-11 border border-border rounded-xl flex items-center justify-center"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">LABEL HARI</label>
            <input value={dayLabel} onChange={(e) => setDayLabel(e.target.value)} placeholder="e.g. Senin - Jumat" required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">LABEL JAM / WAKTU</label>
            <input value={timeLabel} onChange={(e) => setTimeLabel(e.target.value)} placeholder="e.g. 08.00 - 16.00 WIB" required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-5 font-semibold text-muted-foreground hover:bg-accent">Batal</button>
            <button type="submit" className="min-h-11 rounded-xl bg-primary text-primary-foreground px-5 font-semibold hover:bg-primary/90">Simpan</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ConfirmDeleteDialog({ target, onClose, onConfirm, reduced }: { target: { type: "social" | "hours"; name: string }; onClose: () => void; onConfirm: () => void; reduced: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} className="w-full rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-md sm:rounded-[24px]">
        <h3 className="text-xl font-bold text-destructive">Konfirmasi Hapus</h3>
        <p className="mt-3 text-sm text-muted-foreground leading-6">Apakah Anda yakin ingin menghapus {target.type === "social" ? "tautan media sosial" : "item jam layanan"} ini?</p>
        <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-semibold break-words">"{target.name}"</div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="min-h-11 rounded-xl border border-border px-5 font-semibold text-muted-foreground hover:bg-accent">Batal</button>
          <button onClick={onConfirm} className="min-h-11 rounded-xl bg-destructive text-destructive-foreground px-5 font-semibold hover:bg-destructive/90">Ya, Hapus</button>
        </div>
      </motion.div>
    </div>
  )
}
