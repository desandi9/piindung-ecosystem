"use client"

import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import type { SiteBranding } from "@/lib/site-branding"
import { whatsappHref, type SiteContactContent } from "@/lib/site-contact"
import { homeSections } from "./home-navbar"

const morePages = [
  { label: "Produk", href: "/produk" },
  { label: "Dampak", href: "/dampak" },
  { label: "Artikel", href: "/artikel" },
  { label: "Kontak", href: "/kontak" },
]

const linkClass = "rounded text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9f26d]"

export function HomeFooter({ branding, contact }: { branding: SiteBranding; contact: SiteContactContent | null }) {
  const logo = branding.logos.footerDark
  const showContact = !contact || contact.footer.showContact
  const showAddress = !contact || contact.footer.showAddress

  return (
    <footer aria-labelledby="home-footer-heading" className="bg-[#061423] text-white">
      <h2 id="home-footer-heading" className="sr-only">Footer PIINDUNG</h2>
      <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,.6fr)_minmax(0,.6fr)_minmax(0,1fr)] lg:gap-10">
          <div>
            <Image src={logo.path} alt={branding.identity.logoAltText} width={logo.width} height={logo.height} className="h-auto w-[210px]" />
            <p className="mt-5 max-w-[34ch] text-[14.5px] leading-[1.7] text-white/65">
              {contact?.footer.description ?? "Ekosistem digital NU Care–LAZISNU Garut untuk mendukung layanan, pengelolaan, dan tata kelola organisasi."}
            </p>
          </div>

          <nav aria-label="Navigasi beranda di footer">
            <h3 className="text-[14px] font-bold">Beranda</h3>
            <ul className="mt-4 space-y-3 text-[14.5px]">
              {homeSections.map((section) => (
                <li key={section.id}><a href={`#${section.id}`} className={linkClass}>{section.label}</a></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Halaman lain">
            <h3 className="text-[14px] font-bold">Jelajahi</h3>
            <ul className="mt-4 space-y-3 text-[14.5px]">
              {morePages.map((page) => (
                <li key={page.href}><Link href={page.href} className={linkClass}>{page.label}</Link></li>
              ))}
            </ul>
          </nav>

          {(showContact || showAddress) && (
            <div>
              <h3 className="text-[14px] font-bold">Kontak</h3>
              <ul className="mt-4 space-y-3.5 text-[14.5px] leading-[1.6] text-white/65">
                {showAddress && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c9f26d]" aria-hidden="true" />
                    <span>{contact?.organization.address ?? "PCNU Kabupaten Garut"}</span>
                  </li>
                )}
                {showContact && contact && (
                  <>
                    <li className="flex items-center gap-3">
                      <Phone className="h-4 w-4 shrink-0 text-[#c9f26d]" aria-hidden="true" />
                      <a href={whatsappHref(contact.contact.whatsappNumber, contact.contact.whatsappMessage)} target="_blank" rel="noreferrer" className={linkClass}>{contact.contact.phoneDisplay}</a>
                    </li>
                    <li className="flex items-center gap-3">
                      <Mail className="h-4 w-4 shrink-0 text-[#c9f26d]" aria-hidden="true" />
                      <a href={`mailto:${contact.contact.email}`} className={`${linkClass} break-all`}>{contact.contact.email}</a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-7 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {contact?.footer.copyrightText ?? "PIINDUNG — NU Care–LAZISNU Garut."}</p>
          <p>{contact?.footer.secondaryText ?? "Teknologi untuk pelayanan yang lebih unggul."}</p>
        </div>
      </div>
    </footer>
  )
}
