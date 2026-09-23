"use client"

import { type ChangeEvent, useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronDown, Copy, ExternalLink, ImageIcon, Save, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { cn } from "@/lib/utils"
import type { BrandAsset, SiteBranding } from "@/lib/site-branding"
import type { SiteContactContent } from "@/lib/site-contact"

type Section = "identity" | "contact" | "footer" | "seo" | "media"
type LoadState = { branding: SiteBranding | null; contact: SiteContactContent | null }

type UploadTarget =
  | ["logos", keyof SiteBranding["logos"]]
  | ["icons", keyof SiteBranding["icons"]]
  | ["socialPreview", "defaultOgImage"]
  | ["fallbackMedia", keyof SiteBranding["fallbackMedia"]]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[+\d][\d\s()+.-]{6,}$/
const urlPattern = /^(https:\/\/|\/)[^\s]+$/

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function assetFilled(asset: BrandAsset) {
  return Boolean(asset?.path)
}

export default function WebsiteSettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<LoadState>({ branding: null, contact: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState("")
  const [open, setOpen] = useState<Section>("identity")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/login?next=/dashboard/landing-page/pengaturan")
      else if (user.role !== "super_admin_pc") router.replace("/dashboard")
      else setReady(true)
    }
  }, [isLoading, router, user])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [brandingRes, contactRes] = await Promise.all([
        fetch("/api/site-branding/manage", { cache: "no-store" }),
        fetch("/api/site-contact/manage", { cache: "no-store" }),
      ])
      const [brandingJson, contactJson] = await Promise.all([
        brandingRes.json().catch(() => ({})),
        contactRes.json().catch(() => ({})),
      ])
      if (!brandingRes.ok) throw new Error(brandingJson.error || "Gagal memuat branding website.")
      if (!contactRes.ok) throw new Error(contactJson.error || "Gagal memuat kontak website.")
      setData({ branding: brandingJson.branding, contact: contactJson.contact })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal memuat pengaturan website.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ready) void load()
  }, [load, ready])

  const branding = data.branding
  const contact = data.contact
  const contactValid = contact ? validateContact(contact) : ""
  const assetCount = branding ? allAssets(branding).filter((asset) => assetFilled(asset.asset)).length : 0

  const setBranding = (next: SiteBranding) => setData((current) => ({ ...current, branding: next }))
  const setContact = (next: SiteContactContent) => setData((current) => ({ ...current, contact: next }))

  const saveBranding = async (message: string) => {
    if (!branding || saving) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch("/api/site-branding/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "Gagal menyimpan branding.")
      setBranding(payload.branding)
      setSuccess(message)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyimpan branding.")
    } finally {
      setSaving(false)
    }
  }

  const saveContact = async (message: string) => {
    if (!contact || saving) return
    const validation = validateContact(contact)
    if (validation) {
      setError(validation)
      return
    }
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch("/api/site-contact/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "Gagal menyimpan kontak website.")
      setContact(payload.contact)
      setSuccess(message)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyimpan kontak website.")
    } finally {
      setSaving(false)
    }
  }

  const updateBranding = (updater: (draft: SiteBranding) => void) => {
    if (!branding) return
    const next = clone(branding)
    updater(next)
    setBranding(next)
  }

  const updateContact = (updater: (draft: SiteContactContent) => void) => {
    if (!contact) return
    const next = clone(contact)
    updater(next)
    setContact(next)
  }

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !branding) return
    const key = target.join(".")
    setUploading(key)
    setError("")
    setSuccess("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/site-branding/upload", { method: "POST", body: formData })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "Upload gambar gagal.")
      updateBranding((draft) => {
        if (target[0] === "logos") draft.logos[target[1]] = payload.asset
        if (target[0] === "icons") draft.icons[target[1]] = payload.asset
        if (target[0] === "socialPreview") draft.socialPreview.defaultOgImage = payload.asset
        if (target[0] === "fallbackMedia") draft.fallbackMedia[target[1]] = payload.asset
      })
      setSuccess("Upload berhasil. Simpan section untuk menerapkan perubahan.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload gambar gagal.")
    } finally {
      setUploading("")
    }
  }

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Pengaturan Website" breadcrumb="Kelola Landing Page / Pengaturan Website">
      <div className="space-y-4 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Link href="/dashboard/landing-page" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#6c7a89] transition hover:text-[#15945b] dark:text-slate-400"><ArrowLeft className="h-4 w-4" /> Kembali ke Kelola Landing Page</Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dce8e2] bg-white px-4 text-sm font-semibold text-[#08213b] transition hover:bg-[#e7f7ef] dark:border-white/10 dark:bg-white/5 dark:text-white"><ExternalLink className="h-4 w-4" /> Preview Website</a>
        </div>

        {success && <div role="status" className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{success}</div>}
        {error && <div role="alert" className="flex flex-col gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => void load()} className="font-semibold underline">Muat ulang</button></div>}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />)}</div>
        ) : branding && contact ? (
          <div className="space-y-3">
            <Accordion title="Identitas & Branding" status={`${assetCount} aset`} open={open === "identity"} onToggle={() => setOpen("identity")}>
              <div className="grid gap-5 lg:grid-cols-2">
                <TextField label="Nama Website" value={branding.identity.organizationName} onChange={(value) => updateBranding((draft) => { draft.identity.organizationName = value })} />
                <TextField label="Nama Pendek" value={branding.identity.shortName} onChange={(value) => updateBranding((draft) => { draft.identity.shortName = value })} />
                <TextField label="Tagline" value={branding.identity.tagline} onChange={(value) => updateBranding((draft) => { draft.identity.tagline = value })} wide />
                <TextField label="Alt Text Logo" value={branding.identity.logoAltText} onChange={(value) => updateBranding((draft) => { draft.identity.logoAltText = value })} wide />
                <AssetPicker label="Logo Utama" asset={branding.logos.navbarLight} target={["logos", "navbarLight"]} uploading={uploading} onUpload={uploadAsset} />
                <AssetPicker label="Logo Alternatif" asset={branding.logos.navbarDark} target={["logos", "navbarDark"]} uploading={uploading} onUpload={uploadAsset} />
                <AssetPicker label="Favicon" asset={branding.icons.favicon} target={["icons", "favicon"]} uploading={uploading} onUpload={uploadAsset} />
                <AssetPicker label="Apple Touch Icon" asset={branding.icons.appleTouchIcon} target={["icons", "appleTouchIcon"]} uploading={uploading} onUpload={uploadAsset} />
              </div>
              <SaveRow saving={saving} onSave={() => void saveBranding("Identitas dan branding berhasil disimpan.")} />
            </Accordion>

            <Accordion title="Kontak & Media Sosial" status={contactValid ? "Belum lengkap" : "Valid"} open={open === "contact"} onToggle={() => setOpen("contact")}>
              <div className="grid gap-5 lg:grid-cols-2">
                <TextField label="Email" value={contact.contact.email} onChange={(value) => updateContact((draft) => { draft.contact.email = value })} />
                <TextField label="WhatsApp" value={contact.contact.whatsappNumber} onChange={(value) => updateContact((draft) => { draft.contact.whatsappNumber = value })} />
                <TextField label="Telepon Tampilan" value={contact.contact.phoneDisplay} onChange={(value) => updateContact((draft) => { draft.contact.phoneDisplay = value })} />
                <TextField label="Nomor Telepon Link" value={contact.contact.phoneHref} onChange={(value) => updateContact((draft) => { draft.contact.phoneHref = value })} />
                <TextArea label="Alamat" value={contact.organization.address} onChange={(value) => updateContact((draft) => { draft.organization.address = value })} wide />
                <TextField label="Kota/Kabupaten" value={contact.organization.city} onChange={(value) => updateContact((draft) => { draft.organization.city = value })} />
                <TextField label="Kode Pos" value={contact.organization.postalCode} onChange={(value) => updateContact((draft) => { draft.organization.postalCode = value })} />
                <TextField label="Map URL" value={contact.organization.mapUrl} onChange={(value) => updateContact((draft) => { draft.organization.mapUrl = value })} wide />
              </div>
              <div className="mt-5 space-y-3">
                {contact.socialLinks.map((link, index) => <div key={link.id} className="grid gap-3 rounded-2xl border border-border p-4 lg:grid-cols-[140px_1fr_120px]"><TextField label="Label" value={link.label} onChange={(value) => updateContact((draft) => { draft.socialLinks[index].label = value })} /><TextField label="URL" value={link.url} onChange={(value) => updateContact((draft) => { draft.socialLinks[index].url = value })} /><label className="flex items-end gap-2 pb-3 text-sm font-semibold"><input type="checkbox" checked={link.visible} onChange={(event) => updateContact((draft) => { draft.socialLinks[index].visible = event.target.checked })} className="h-4 w-4 accent-[#15945b]" /> Tampil</label></div>)}
              </div>
              <SaveRow saving={saving} onSave={() => void saveContact("Kontak dan media sosial berhasil disimpan.")} />
            </Accordion>

            <Accordion title="Footer" status={contact.footer.showContact || contact.footer.showAddress || contact.footer.showSocialLinks ? "Aktif" : "Nonaktif"} open={open === "footer"} onToggle={() => setOpen("footer")}>
              <div className="grid gap-5 lg:grid-cols-2">
                <TextArea label="Deskripsi Footer" value={contact.footer.description} onChange={(value) => updateContact((draft) => { draft.footer.description = value })} wide />
                <TextField label="Copyright" value={contact.footer.copyrightText} onChange={(value) => updateContact((draft) => { draft.footer.copyrightText = value })} />
                <TextField label="Teks Sekunder" value={contact.footer.secondaryText} onChange={(value) => updateContact((draft) => { draft.footer.secondaryText = value })} />
                <Toggle label="Tampilkan alamat" checked={contact.footer.showAddress} onChange={(value) => updateContact((draft) => { draft.footer.showAddress = value })} />
                <Toggle label="Tampilkan kontak" checked={contact.footer.showContact} onChange={(value) => updateContact((draft) => { draft.footer.showContact = value })} />
                <Toggle label="Tampilkan media sosial" checked={contact.footer.showSocialLinks} onChange={(value) => updateContact((draft) => { draft.footer.showSocialLinks = value })} />
              </div>
              <SaveRow saving={saving} onSave={() => void saveContact("Footer berhasil disimpan.")} />
            </Accordion>

            <Accordion title="SEO & Metadata" status={assetFilled(branding.socialPreview.defaultOgImage) ? "OG aktif" : "Belum lengkap"} open={open === "seo"} onToggle={() => setOpen("seo")}>
              <div className="grid gap-5 lg:grid-cols-2">
                <TextField label="Site Title" value={branding.socialPreview.defaultOgTitle} onChange={(value) => updateBranding((draft) => { draft.socialPreview.defaultOgTitle = value })} wide />
                <TextArea label="Meta Description" value={branding.socialPreview.defaultOgDescription} onChange={(value) => updateBranding((draft) => { draft.socialPreview.defaultOgDescription = value })} wide />
                <TextField label="OG Alt Text" value={branding.socialPreview.defaultOgAlt} onChange={(value) => updateBranding((draft) => { draft.socialPreview.defaultOgAlt = value })} wide />
                <AssetPicker label="OG Image" asset={branding.socialPreview.defaultOgImage} target={["socialPreview", "defaultOgImage"]} uploading={uploading} onUpload={uploadAsset} wide />
              </div>
              <SaveRow saving={saving} onSave={() => void saveBranding("SEO dan metadata berhasil disimpan.")} />
            </Accordion>

            <Accordion title="Media Library" status={`${allAssets(branding).length} aset`} open={open === "media"} onToggle={() => setOpen("media")}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {allAssets(branding).map((item) => <MediaAsset key={item.label} label={item.label} asset={item.asset} />)}
              </div>
              <div className="mt-5 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                Upload dan penggantian gambar tersedia di section Identitas & Branding dan SEO & Metadata. Hapus aset tidak ditampilkan karena tidak ada endpoint delete media mandiri.
              </div>
            </Accordion>
          </div>
        ) : null}
      </div>
    </MemberLayout>
  )
}

function validateContact(contact: SiteContactContent) {
  if (!emailPattern.test(contact.contact.email)) return "Format email tidak valid."
  if (!phonePattern.test(contact.contact.phoneDisplay)) return "Nomor telepon tidak valid."
  if (!/^\d{7,}$/.test(contact.contact.whatsappNumber.replace(/\D/g, ""))) return "Nomor WhatsApp tidak valid."
  if (!urlPattern.test(contact.organization.mapUrl)) return "Map URL harus HTTPS atau path internal."
  const invalidSocial = contact.socialLinks.find((link) => link.url && !urlPattern.test(link.url))
  if (invalidSocial) return `URL ${invalidSocial.label} tidak valid.`
  return ""
}

function allAssets(branding: SiteBranding) {
  return [
    { label: "Logo Utama", asset: branding.logos.navbarLight },
    { label: "Logo Alternatif", asset: branding.logos.navbarDark },
    { label: "Logo Footer Light", asset: branding.logos.footerLight },
    { label: "Logo Footer Dark", asset: branding.logos.footerDark },
    { label: "Square Mark", asset: branding.logos.squareMark },
    { label: "Favicon", asset: branding.icons.favicon },
    { label: "Apple Touch Icon", asset: branding.icons.appleTouchIcon },
    { label: "OG Image", asset: branding.socialPreview.defaultOgImage },
    { label: "Default Thumbnail", asset: branding.fallbackMedia.defaultThumbnail },
    { label: "Default Cover Artikel", asset: branding.fallbackMedia.defaultArticleCover },
    { label: "Default Ikon Produk", asset: branding.fallbackMedia.defaultProductIcon },
  ]
}

function Accordion({ title, status, open, onToggle, children }: { title: string; status: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6" aria-expanded={open}><span className="min-w-0 flex-1 text-lg font-bold">{title}</span><span className="flex shrink-0 items-center gap-2"><span className="max-w-[120px] truncate rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground sm:max-w-none">{status}</span><ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} /></span></button>{open && <div className="border-t border-border p-4 sm:p-6">{children}</div>}</section>
}

function TextField({ label, value, onChange, wide }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return <label className={cn("space-y-1.5", wide && "lg:col-span-2")}><span className="block text-xs font-semibold text-muted-foreground">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></label>
}

function TextArea({ label, value, onChange, wide }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return <label className={cn("space-y-1.5", wide && "lg:col-span-2")}><span className="block text-xs font-semibold text-muted-foreground">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-6 outline-none focus:border-[#15945b]" /></label>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#15945b]" /> {label}</label>
}

function SaveRow({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return <div className="mt-6 flex justify-end border-t border-border pt-5"><button type="button" onClick={onSave} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}</button></div>
}

function AssetPicker({ label, asset, target, uploading, onUpload, wide }: { label: string; asset: BrandAsset; target: UploadTarget; uploading: string; onUpload: (event: ChangeEvent<HTMLInputElement>, target: UploadTarget) => void; wide?: boolean }) {
  const key = target.join(".")
  return <div className={cn("space-y-2", wide && "lg:col-span-2")}><p className="text-xs font-semibold text-muted-foreground">{label}</p><AssetPreview asset={asset} /><label className={cn("inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-accent", uploading === key && "cursor-wait opacity-60")}><Upload className="h-4 w-4" /> {uploading === key ? "Mengunggah..." : "Upload/Ganti Gambar"}<input type="file" accept="image/png,image/jpeg,image/jpg" className="sr-only" disabled={Boolean(uploading)} onChange={(event) => onUpload(event, target)} /></label></div>
}

function AssetPreview({ asset }: { asset: BrandAsset }) {
  return <div className="relative flex aspect-video max-w-md items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">{assetFilled(asset) ? <Image src={asset.path} alt="Preview aset" fill sizes="(max-width: 768px) 100vw, 420px" className="object-contain p-3" unoptimized /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}</div>
}

function MediaAsset({ label, asset }: { label: string; asset: BrandAsset }) {
  const copy = () => void navigator.clipboard?.writeText(asset.path)
  return <div className="rounded-2xl border border-border p-4"><AssetPreview asset={asset} /><div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{label}</p><p className="mt-1 truncate text-xs text-muted-foreground">{asset.path}</p></div><button type="button" onClick={copy} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-accent" aria-label="Salin URL"><Copy className="h-4 w-4" /></button></div></div>
}
