"use client"

import Image from "next/image"
import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"
import { useContactSocialSettings, whatsappHref } from "@/lib/contact-social"
import { getResolvedLogoUrl, useStoredSystemSettings } from "@/lib/system-settings"

// Social media icon components
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export function Footer() {
  const settings = useContactSocialSettings()
  const { settings: systemSettings } = useStoredSystemSettings()
  const footerLogo = getResolvedLogoUrl(systemSettings.logoUrl, "dark")
  const socialLinks = [
    { href: settings.instagram, icon: InstagramIcon, label: "Instagram" },
    { href: settings.facebook, icon: FacebookIcon, label: "Facebook" },
    { href: "https://www.youtube.com/results?search_query=NU+Care+LAZISNU+Garut", icon: YoutubeIcon, label: "Youtube" },
    { href: settings.tiktok, icon: TikTokIcon, label: "TikTok" },
    { href: whatsappHref(settings.whatsapp), icon: WhatsAppIcon, label: "WhatsApp" },
  ].filter((social) => social.href)

  return (
    <footer className="bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#0a1628] text-white mt-8 pb-4">
      <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Image
                src={footerLogo}
                alt={systemSettings.websiteTitle}
                width={200}
                height={65}
                className="h-14 w-auto"
                style={{ width: "auto" }}
              />
              <p className="text-xs text-white/70 mt-3">
                {systemSettings.websiteTitle}
              </p>
            </div>
            <p className="text-sm text-white/80">
              Bersama NU Care-LAZISNU Garut,<br />
              kita wujudkan kebaikan untuk<br />
              umat dan kemanusiaan.
            </p>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Ikuti Kami</h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg hover:shadow-white/5"
                >
                  <social.icon className="h-4 w-4 text-white/70 transition-all duration-300 ease-out group-hover:text-white group-hover:scale-110" />
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Kontak</h3>
            <div className="space-y-3">
              <ContactItem 
                icon={<Phone className="h-4 w-4" />} 
                text={settings.whatsapp} 
              />
              <ContactItem 
                icon={<Mail className="h-4 w-4" />} 
                text={settings.email} 
              />
              <ContactItem 
                icon={<MapPin className="h-4 w-4" />} 
                text={settings.address} 
              />
            </div>
          </div>

          {/* Secretariat */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Sekretariat</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              {settings.officeHours.split("\n").map((line) => (
                <span key={line}>{line}<br /></span>
              ))}
            </p>
          </div>

          {/* Google Maps Embed */}
          <div>
            <Link 
              href={settings.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="w-full h-28 lg:h-32 rounded-xl overflow-hidden relative border border-white/10 transition-all duration-300 ease-out group-hover:border-white/20 group-hover:shadow-lg group-hover:shadow-white/5">
                <iframe
                  src={settings.googleMapsEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale-[30%] group-hover:grayscale-0 transition-all duration-300"
                  title="Lokasi NU Care-LAZISNU Garut"
                />
                {/* Overlay for clickability */}
                <div className="absolute inset-0 bg-transparent group-hover:bg-white/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-[#2e8b57] text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                    Buka di Google Maps
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <p className="text-center text-sm text-white/60">
            {systemSettings.footerText}
          </p>
        </div>
      </div>
    </footer>
  )
}

function ContactItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/80">
      <span className="text-[#2e8b57]">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
