"use client"

import { type FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Mail, MapPin, MessageCircle, Phone, ExternalLink } from "lucide-react"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addInboxMessage } from "@/lib/admin-inbox"
import { normalizeWhatsApp } from "@/lib/contact-social"
import type { SiteContactContent } from "@/lib/site-contact"

function whatsappHref(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
}

export default function KontakPage() {
  const [content, setContent] = useState<SiteContactContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<"idle" | "success">("idle")

  const load = async () => {
    setLoading(true); setLoadError("")
    try {
      const response = await fetch("/api/site-contact", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memuat data kontak.")
      setContent(data.contact)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Gagal memuat data kontak.")
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.email.trim() && !form.phone.trim()) { setFormError("Isi email atau nomor WhatsApp agar admin dapat membalas."); return }
    addInboxMessage({ source: "Kontak Kami", title: `Pesan dari ${form.name.trim()}`, senderName: form.name.trim(), senderEmail: form.email.trim(), senderPhone: form.phone.trim(), message: form.message.trim() })
    setForm({ name: "", email: "", phone: "", message: "" }); setFormError(null); setSubmitState("success")
  }

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(46,139,87,0.08),transparent_28%),hsl(var(--background))]"><PublicNavbar /><main className="container mx-auto px-4 py-8 lg:px-8"><Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali ke Beranda</Link><header className="mb-8 rounded-[28px] border border-border/60 bg-card/70 p-6 shadow-sm lg:p-8"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15945b]">Hubungi Kami</p><h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{content?.organization.name ?? "Kontak Kami"}</h1><p className="mt-3 max-w-3xl text-muted-foreground">{content?.organization.description ?? "Hubungi tim kami untuk mendapatkan informasi dan bantuan."}</p></header>{loading ? <div className="grid gap-5 lg:grid-cols-2"><div className="h-96 animate-pulse rounded-[28px] bg-muted" /><div className="h-96 animate-pulse rounded-[28px] bg-muted" /></div> : loadError ? <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-800 dark:text-amber-300"><p>{loadError}</p><button onClick={load} className="mt-4 h-11 rounded-xl bg-[#15945b] px-5 font-semibold text-white">Coba Lagi</button></div> : content ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]"><div className="space-y-5"><section className="overflow-hidden rounded-[28px] border border-border/70 bg-card"><div className="border-b border-border bg-[#15945b]/10 p-5"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#15945b]" /><div><h2 className="font-semibold">Lokasi Kantor</h2><p className="text-xs text-muted-foreground">{content.organization.address}, {content.organization.city} {content.organization.postalCode}</p></div></div></div><div className="p-5"><div className="h-64 overflow-hidden rounded-2xl border border-border bg-muted lg:h-80"><iframe src={content.organization.mapUrl} title="Lokasi kantor" className="h-full w-full border-0" loading="lazy" /></div><a href={content.organization.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-accent">Buka Peta <ExternalLink className="h-4 w-4" /></a></div></section><section className="rounded-[28px] border border-border/70 bg-card p-5"><div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-[#15945b]" /><div><h2 className="font-semibold">Kirim Pesan</h2><p className="text-xs text-muted-foreground">Pesan masuk ke inbox Admin Dashboard.</p></div></div><form onSubmit={submit} className="mt-5 space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" required /><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email aktif" type="email" /></div><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Nomor WhatsApp" /><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tulis pesan Anda" required className="min-h-32" />{formError && <p className="text-xs text-destructive">{formError}</p>}{submitState === "success" && <p className="text-xs text-[#15945b]">Pesan berhasil dikirim ke admin.</p>}<button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white hover:bg-[#107947]"><MessageCircle className="h-4 w-4" /> Kirim ke Admin</button></form></section></div><aside className="space-y-4 lg:sticky lg:top-24"><div className="rounded-[24px] border border-border bg-card p-5"><h2 className="font-semibold">Informasi Kontak</h2><div className="mt-4 space-y-3 text-sm text-muted-foreground"><a href={whatsappHref(content.contact.whatsappNumber, content.contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#15945b]"><MessageCircle className="h-4 w-4 text-[#15945b]" /> {content.contact.phoneDisplay}</a><a href={`mailto:${content.contact.email}`} className="flex items-center gap-3 hover:text-[#15945b]"><Mail className="h-4 w-4 text-[#15945b]" /> {content.contact.email}</a><a href={`tel:+${normalizeWhatsApp(content.contact.phoneHref)}`} className="flex items-center gap-3 hover:text-[#15945b]"><Phone className="h-4 w-4 text-[#15945b]" /> Telepon</a></div></div>{content.officeHours.visible && <div className="rounded-[24px] border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-[#15945b]" /> Jam Layanan</h2>{content.officeHours.items.map((item) => <p key={item.id} className="mt-2 text-sm text-muted-foreground">{item.dayLabel}: {item.timeLabel}</p>)}</div>}</aside></div> : null}</main><PublicFooter /></div>
}
