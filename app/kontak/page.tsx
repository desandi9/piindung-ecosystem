"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
} from "lucide-react"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { Navbar } from "@/components/piindung/navbar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addInboxMessage } from "@/lib/admin-inbox"
import { useContactSocialSettings, whatsappHref, normalizeWhatsApp } from "@/lib/contact-social"

export default function KontakPage() {
  const settings = useContactSocialSettings()
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<"idle" | "success">("idle")
  const contacts = [
    { icon: MapPin, label: "Alamat Kantor", value: settings.address, href: settings.googleMapsLink },
    { icon: MessageCircle, label: "WhatsApp", value: settings.whatsapp, href: whatsappHref(settings.whatsapp) },
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    { icon: Instagram, label: "Instagram", value: settings.instagram, href: settings.instagram },
    { icon: Music2, label: "TikTok", value: settings.tiktok, href: settings.tiktok },
    { icon: Facebook, label: "Facebook", value: settings.facebook, href: settings.facebook },
  ]

  const copyContact = async (value: string, label: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = value
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }

    setCopied(label)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.email.trim() && !form.phone.trim()) {
      setFormError("Isi email atau nomor WhatsApp agar admin dapat membalas.")
      return
    }

    addInboxMessage({
      source: "Kontak Kami",
      title: `Pesan dari ${form.name.trim()}`,
      senderName: form.name.trim(),
      senderEmail: form.email.trim(),
      senderPhone: form.phone.trim(),
      message: form.message.trim(),
    })

    setForm({ name: "", email: "", phone: "", message: "" })
    setFormError(null)
    setSubmitState("success")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,rgba(46,139,87,0.08),transparent_28%),hsl(var(--background))]">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <div className="mb-6 rounded-[28px] border border-border/60 bg-card/70 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2e8b57]">Hubungi Kami</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground lg:text-3xl">
            Kontak Kami
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Hubungi NU Care-LAZISNU PCNU Kabupaten Garut
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-5">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-[28px] border border-border/70 bg-card/80 transition-all duration-300 hover:border-[#2e8b57]/30 hover:shadow-[0_22px_52px_rgba(0,0,0,0.1)]">
              <div className="p-4 lg:p-5 border-b border-border bg-gradient-to-r from-[#2e8b57]/10 to-[#2e8b57]/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-[#2e8b57]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Lokasi Kantor</h2>
                    <p className="text-xs text-muted-foreground">Sekretariat NU Care-LAZISNU Garut</p>
                  </div>
                </div>
              </div>
              <div className="p-4 lg:p-5">
                <div className="overflow-hidden rounded-2xl border border-border bg-background h-[300px] lg:h-[400px]">
                  <iframe
                    src={settings.googleMapsEmbed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Lokasi NU Care-LAZISNU Garut"
                    className="grayscale-[20%] transition-all duration-300 hover:grayscale-0"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-border/70 bg-card/80 p-4 transition-all duration-300 hover:border-[#2e8b57]/30 hover:shadow-[0_22px_52px_rgba(0,0,0,0.1)] lg:p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-[#2e8b57]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Kirim Pesan</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pesan Anda akan langsung masuk ke inbox Admin Dashboard.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Nama lengkap"
                    required
                    className="rounded-xl"
                  />
                  <Input
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Email aktif"
                    type="email"
                    className="rounded-xl"
                  />
                </div>

                <Input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Nomor WhatsApp"
                  className="rounded-xl"
                />

                <Textarea
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Tulis pesan Anda di sini"
                  required
                  className="min-h-32 rounded-xl"
                />

                {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
                {submitState === "success" ? (
                  <p className="text-xs text-[#2e8b57]">Pesan berhasil dikirim ke admin.</p>
                ) : null}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2e8b57] px-4 py-3 text-sm font-medium text-white hover:bg-[#236b43] hover:shadow-lg hover:shadow-[#2e8b57]/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Kirim ke Admin
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[24px] border border-border/70 bg-card/80 p-4 transition-all duration-300 hover:border-[#2e8b57]/30 hover:shadow-[0_18px_46px_rgba(0,0,0,0.08)] lg:p-4.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#2e8b57]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Jam Layanan</h2>
                  {settings.officeHours.split("\n").map((line) => (
                    <p key={line} className="mt-1 text-xs leading-5 text-muted-foreground">{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {contacts.map((contact) => {
              const isCopied = copied === contact.label

              return (
                <div
                  key={contact.label}
                  className="rounded-[24px] border border-border/70 bg-card/80 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2e8b57]/30 hover:shadow-[0_18px_46px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e8b57]/10">
                      <contact.icon className="h-5 w-5 text-[#2e8b57]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{contact.label}</p>
                      <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{contact.value}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => copyContact(contact.value, contact.label)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-medium text-foreground hover:border-[#2e8b57]/30 hover:bg-[#2e8b57]/5"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-[#2e8b57]" /> : <Copy className="h-3.5 w-3.5" />}
                      {isCopied ? "Tersalin" : "Salin"}
                    </button>
                    <a
                      href={contact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2e8b57] py-2 text-xs font-medium text-white hover:bg-[#236b43] hover:shadow-lg hover:shadow-[#2e8b57]/20"
                    >
                      Buka
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )
            })}

            <div className="rounded-[24px] border border-border/70 bg-card/80 p-4 transition-all duration-300 hover:border-[#2e8b57]/30 hover:shadow-[0_18px_46px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e8b57]">Aksi Cepat</p>
              <div className="mt-3 space-y-2.5">
                <a
                  href={whatsappHref(settings.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2e8b57] px-4 py-3 text-sm font-medium text-white hover:bg-[#236b43] hover:shadow-lg hover:shadow-[#2e8b57]/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Sekarang
                </a>
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-[#2e8b57]/30 hover:bg-[#2e8b57]/5"
                >
                  <Mail className="h-4 w-4 text-[#2e8b57]" />
                  Kirim Email
                </a>
                <a
                  href={`tel:+${normalizeWhatsApp(settings.whatsapp)}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-[#2e8b57]/30 hover:bg-[#2e8b57]/5"
                >
                  <Phone className="h-4 w-4 text-[#2e8b57]" />
                  Telepon
                </a>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(46,139,87,0.08),rgba(255,255,255,0.02))] p-4 transition-all duration-300 hover:border-[#2e8b57]/30 hover:shadow-[0_18px_46px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e8b57]">Respon Admin</p>
              <p className="mt-2 text-sm font-semibold text-foreground">Balasan lebih cepat lewat WhatsApp</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Untuk kebutuhan mendesak, gunakan tombol WhatsApp agar tim admin dapat merespons lebih cepat pada jam layanan.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SimpleFooter />
    </div>
  )
}
