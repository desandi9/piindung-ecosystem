"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { Facebook, Globe2, Instagram, Mail, MapPin, Music2, Phone } from "lucide-react"
import { fadeUp } from "@/lib/motion"
import { getResolvedLogoUrl, useStoredSystemSettings } from "@/lib/system-settings"
import { useContactSocialSettings, whatsappHref } from "@/lib/contact-social"

const mainNav = [
  { label: "Beranda", href: "/" },
  { label: "Produk", href: "/produk" },
  { label: "Dampak", href: "/dampak" },
  { label: "Artikel", href: "/artikel" },
  { label: "Pusat Bantuan", href: "/bantuan" },
]

export function PublicFooter() {
  const { settings } = useStoredSystemSettings()
  const contact = useContactSocialSettings()
  const reduced = useReducedMotion()

  return (
    <footer
      className="relative isolate overflow-hidden text-white"
      aria-labelledby="public-footer-heading"
      style={{
        backgroundImage: "linear-gradient(rgba(3,15,38,0.34), rgba(3,15,38,0.34)), url('/BACKGROUND.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center bottom",
      }}
    >
      <motion.div variants={reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <h2 id="public-footer-heading" className="sr-only">Footer PIINDUNG</h2>
        <div className="grid gap-10 border-b border-white/15 pb-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            <Image src={getResolvedLogoUrl(settings.logoUrl, "dark")} alt="PIINDUNG NU Care-LAZISNU Garut" width={180} height={50} className="h-10 w-auto" />
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/70">Ekosistem digital NU Care–LAZISNU Garut untuk mendukung layanan, pengelolaan, dan tata kelola organisasi yang lebih terhubung.</p>
          </div>
          <nav aria-label="Navigasi footer">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Navigasi</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {mainNav.map((item) => <li key={item.label}><Link href={item.href} className="rounded-md transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">{item.label}</Link></li>)}
            </ul>
          </nav>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Kontak</h3>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/70">
              <li className="flex items-start gap-3"><MapPin className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /><span>{contact.address}</span></li>
              <li className="flex items-center gap-3"><Phone className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /><a href={whatsappHref(contact.whatsapp)} className="transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">{contact.whatsapp}</a></li>
              <li className="flex items-center gap-3"><Mail className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /><a href={`mailto:${contact.email}`} className="transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">{contact.email}</a></li>
              <li className="flex items-center gap-3"><Globe2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /><Link href="/" className="transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">PIINDUNG</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Ikuti Kami</h3>
            <div className="mt-5 flex gap-3">
              <a href={contact.instagram} target="_blank" rel="noreferrer" aria-label="Instagram NU Care-LAZISNU Garut" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"><Instagram className="h-4 w-4" aria-hidden="true" /></a>
              <a href={contact.facebook} target="_blank" rel="noreferrer" aria-label="Facebook NU Care-LAZISNU Garut" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"><Facebook className="h-4 w-4" aria-hidden="true" /></a>
              <a href={contact.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok NU Care-LAZISNU Garut" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"><Music2 className="h-4 w-4" aria-hidden="true" /></a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-5 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PIINDUNG — NU Care–LAZISNU Garut.</p>
          <div className="flex gap-5"><span>Kebijakan Privasi</span><span>Syarat &amp; Ketentuan</span></div>
        </div>
      </motion.div>
    </footer>
  )
}
