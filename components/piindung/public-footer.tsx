"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Facebook, Globe2, Instagram, Linkedin, Mail, MapPin, Music2, Phone, Twitter, Youtube } from "lucide-react"
import { whatsappHref, type SiteContactContent } from "@/lib/site-contact"
import { DEFAULT_SITE_BRANDING, type SiteBranding } from "@/lib/site-branding"

const mainNav = [
  { label: "Beranda", href: "/" },
  { label: "Produk", href: "/produk" },
  { label: "Dampak", href: "/dampak" },
  { label: "Artikel", href: "/artikel" },
  { label: "Pusat Bantuan", href: "/bantuan" },
]

function getSocialIcon(platform: string) {
  if (platform === "instagram") return Instagram
  if (platform === "facebook") return Facebook
  if (platform === "tiktok") return Music2
  if (platform === "youtube") return Youtube
  if (platform === "x") return Twitter
  if (platform === "linkedin") return Linkedin
  return Globe2
}

export function PublicFooter() {
  const [contact, setContact] = useState<SiteContactContent | null>(null)
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_SITE_BRANDING)

  useEffect(() => {
    void Promise.all([
      fetch("/api/site-contact", { cache: "no-store" }).then((res) => res.json()).catch(() => ({})),
      fetch("/api/site-branding", { cache: "no-store" }).then((res) => res.json()).catch(() => ({})),
    ]).then(([dataContact, dataBranding]) => {
      if (dataContact.contact) setContact(dataContact.contact)
      if (dataBranding.branding) setBranding(dataBranding.branding)
    })
  }, [])

  return (
    <footer className="border-t border-[#d9e5df] bg-white text-[#0b2239] dark:border-[#213a49] dark:bg-[#0d1e2d] dark:text-white" aria-labelledby="public-footer-heading">
      <div className="mx-auto max-w-[1180px] px-6 py-8 sm:px-10 sm:py-9">
        <h2 id="public-footer-heading" className="sr-only">Footer PIINDUNG</h2>
        <div className="grid gap-8 border-b border-[#d9e5df] pb-7 dark:border-[#213a49] md:grid-cols-3 md:gap-8">
          <div>
            <Image src={branding.logos.footerDark.path} alt={branding.identity.logoAltText} width={branding.logos.footerDark.width} height={branding.logos.footerDark.height} className="h-8 w-auto brightness-0 dark:brightness-100" />
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#64748b] dark:text-[#a5b4c5]">{contact?.footer.description ?? "Ekosistem digital NU Care–LAZISNU Garut untuk mendukung layanan, pengelolaan, dan tata kelola organisasi."}</p>
          </div>
          <nav aria-label="Navigasi footer">
            <h3 className="text-sm font-semibold text-[#0b2239] dark:text-white">Navigasi</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#64748b] dark:text-[#a5b4c5]">
              {mainNav.map((item) => <li key={item.label}><Link href={item.href} className="transition hover:text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]">{item.label}</Link></li>)}
            </ul>
          </nav>
          {(!contact || contact.footer.showContact || contact.footer.showAddress) && (
            <div>
              <h3 className="text-sm font-semibold text-[#0b2239] dark:text-white">Kontak</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#64748b] dark:text-[#a5b4c5]">
                {(!contact || contact.footer.showAddress) && <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#07965d]" aria-hidden="true" /><span>{contact?.organization.address ?? "PCNU Kabupaten Garut"}</span></li>}
                {(!contact || contact.footer.showContact) && (
                  <>
                    <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 shrink-0 text-[#07965d]" aria-hidden="true" /><a href={contact ? whatsappHref(contact.contact.whatsappNumber, contact.contact.whatsappMessage) : "#"} className="transition hover:text-[#07965d]">{contact?.contact.phoneDisplay ?? "085600335066"}</a></li>
                    <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0 text-[#07965d]" aria-hidden="true" /><a href={contact ? `mailto:${contact.contact.email}` : "#"} className="transition hover:text-[#07965d]">{contact?.contact.email ?? "info@lazisnu.garut"}</a></li>
                  </>
                )}
                {(!contact || contact.footer.showSocialLinks) && contact?.socialLinks && contact.socialLinks.length > 0 ? (
                  <li className="flex gap-2 pt-1">
                    {contact.socialLinks.map((link) => {
                      const Icon = getSocialIcon(link.platform)
                      return <a key={link.id} href={link.url} target="_blank" rel="noreferrer" aria-label={link.label} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9e5df] text-[#0b2239] transition hover:border-[#07965d] hover:text-[#07965d] dark:border-[#213a49] dark:text-white"><Icon className="h-3.5 w-3.5" /></a>
                    })}
                  </li>
                ) : null}
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 pt-4 text-xs text-[#64748b] dark:text-[#a5b4c5] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {contact?.footer.copyrightText ?? "PIINDUNG. NU Care–LAZISNU Kabupaten Garut."}</p>
          <p>{contact?.footer.secondaryText ?? "Teknologi untuk pelayanan yang lebih unggul."}</p>
        </div>
      </div>
    </footer>
  )
}
