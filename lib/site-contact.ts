export const SITE_CONTACT_SCOPE = "site-contact"
export const SITE_CONTACT_KEY = "main"
export const SITE_CONTACT_EVENT = "piindung-site-contact-updated"

export const ALLOWED_SOCIAL_PLATFORMS = ["instagram", "facebook", "youtube", "tiktok", "x", "linkedin", "website"] as const
export type SocialPlatform = typeof ALLOWED_SOCIAL_PLATFORMS[number]

export interface Organization {
  name: string
  shortName: string
  description: string
  address: string
  city: string
  postalCode: string
  mapUrl: string
}

export interface Contact {
  email: string
  phoneDisplay: string
  phoneHref: string
  whatsappNumber: string
  whatsappMessage: string
  supportLabel: string
}

export interface OfficeHourItem {
  id: string
  dayLabel: string
  timeLabel: string
  position: number
}

export interface SocialLink {
  id: string
  platform: SocialPlatform
  label: string
  url: string
  visible: boolean
  position: number
}

export interface FooterSettings {
  description: string
  copyrightText: string
  secondaryText: string
  showSocialLinks: boolean
  showContact: boolean
  showAddress: boolean
}

export interface SiteContactContent {
  organization: Organization
  contact: Contact
  officeHours: {
    visible: boolean
    items: OfficeHourItem[]
  }
  socialLinks: SocialLink[]
  footer: FooterSettings
  updatedAt: string
}

const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f]/
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export class SiteContactValidationError extends Error {}

function text(value: unknown, field: string, max: number, required = true): string {
  if (typeof value !== "string") throw new SiteContactValidationError(`${field} wajib berupa string.`)
  const trimmed = value.trim()
  if (required && !trimmed) throw new SiteContactValidationError(`${field} tidak boleh kosong.`)
  if (trimmed.length > max || CONTROL_CHARS.test(trimmed)) throw new SiteContactValidationError(`${field} melebihi batas karakter atau mengandung karakter tidak valid.`)
  return trimmed
}

function email(value: unknown): string {
  const emailVal = text(value, "Email", 120).toLowerCase()
  if (!EMAIL_PATTERN.test(emailVal)) throw new SiteContactValidationError("Format email tidak valid.")
  return emailVal
}

function digitsOnly(value: unknown, field: string): string {
  const str = text(value, field, 40)
  const normalized = str.replace(/\D/g, "")
  if (!normalized) throw new SiteContactValidationError(`${field} harus berisi angka.`)
  return normalized
}

function phoneLink(value: unknown): string {
  const raw = text(value, "Tautan telepon Href", 40)
  const clean = raw.replace(/[^\d+]/g, "")
  if (!clean.startsWith("+") && !/^\d+$/.test(clean)) {
    throw new SiteContactValidationError("Tautan telepon Href harus berformat nomor telepon tel: link.")
  }
  return clean
}

function secureUrl(value: unknown, field: string, max = 300): string {
  const raw = text(value, field, max)
  if (!raw.startsWith("https://") && !raw.startsWith("/")) {
    throw new SiteContactValidationError(`${field} harus berupa URL HTTPS aman atau path internal.`)
  }
  return raw
}

function safeId(value: unknown, field: string): string {
  const str = text(value, field, 50)
  if (!/^[a-z0-9-]+$/.test(str)) {
    throw new SiteContactValidationError(`${field} hanya boleh berisi huruf kecil, angka, dan dash.`)
  }
  return str
}

function finiteNum(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new SiteContactValidationError(`${field} harus berupa angka positif.`)
  }
  return value
}

export const DEFAULT_SITE_CONTACT: SiteContactContent = {
  organization: {
    name: "NU Care-LAZISNU Kabupaten Garut",
    shortName: "LAZISNU Garut",
    description: "Ekosistem digital NU Care–LAZISNU Garut untuk mendukung layanan, pengelolaan, dan tata kelola organisasi yang lebih terhubung.",
    address: "Gedung PCNU Kab. Garut Lt 2, Jl. Suherman No. 117, Desa Jati, Kec. Tarogong Kidul",
    city: "Kabupaten Garut",
    postalCode: "44151",
    mapUrl: "https://www.google.com/maps?q=PCNU%20Kabupaten%20Garut,-7.1897862,107.9020127&z=18&output=embed",
  },
  contact: {
    email: "info@lazisnu.garut",
    phoneDisplay: "0856-0033-5066",
    phoneHref: "6285600335066",
    whatsappNumber: "6285600335066",
    whatsappMessage: "Assalamualaikum, saya ingin menghubungi NU Care-LAZISNU Garut",
    supportLabel: "WhatsApp Pengurus",
  },
  officeHours: {
    visible: true,
    items: [
      { id: "hours-1", dayLabel: "Senin - Jumat", timeLabel: "08.00 - 16.00 WIB", position: 1 },
      { id: "hours-2", dayLabel: "Sabtu", timeLabel: "08.00 - 12.00 WIB", position: 2 },
    ],
  },
  socialLinks: [
    { id: "instagram", platform: "instagram", label: "Instagram", url: "https://www.instagram.com/lazisnu_garut", visible: true, position: 1 },
    { id: "tiktok", platform: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@nucare.lazisnu.garut", visible: true, position: 2 },
    { id: "facebook", platform: "facebook", label: "Facebook", url: "https://www.facebook.com/share/19DfHJXcBV/?mibextid=wwXIfr", visible: true, position: 3 },
  ],
  footer: {
    description: "NU Care-LAZISNU adalah lembaga amil zakat, infaq, dan sedekah di bawah naungan Nahdlatul Ulama yang senantiasa melayani umat.",
    copyrightText: "PIINDUNG — NU Care–LAZISNU Garut.",
    secondaryText: "Lembaga Amil Zakat Terpercaya",
    showSocialLinks: true,
    showContact: true,
    showAddress: true,
  },
  updatedAt: new Date(0).toISOString(),
}

export function validateSiteContact(value: unknown): SiteContactContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SiteContactValidationError("Payload kontak tidak valid.")
  }
  const input = value as Record<string, unknown>

  // Organization
  const orgInput = input.organization as Record<string, unknown> | undefined
  if (!orgInput || typeof orgInput !== "object" || Array.isArray(orgInput)) throw new SiteContactValidationError("Struktur organisasi tidak valid.")
  const organization: Organization = {
    name: text(orgInput.name, "Nama organisasi", 100),
    shortName: text(orgInput.shortName, "Nama pendek", 40),
    description: text(orgInput.description, "Deskripsi organisasi", 300),
    address: text(orgInput.address, "Alamat", 200),
    city: text(orgInput.city, "Kota/Kabupaten", 50),
    postalCode: digitsOnly(orgInput.postalCode, "Kode Pos"),
    mapUrl: secureUrl(orgInput.mapUrl, "Tautan Google Maps Embed"),
  }

  // Contact
  const contactInput = input.contact as Record<string, unknown> | undefined
  if (!contactInput || typeof contactInput !== "object" || Array.isArray(contactInput)) throw new SiteContactValidationError("Struktur kontak tidak valid.")
  const contact: Contact = {
    email: email(contactInput.email),
    phoneDisplay: text(contactInput.phoneDisplay, "Tampilan telepon", 40),
    phoneHref: phoneLink(contactInput.phoneHref),
    whatsappNumber: digitsOnly(contactInput.whatsappNumber, "Nomor WhatsApp"),
    whatsappMessage: text(contactInput.whatsappMessage, "Pesan default WhatsApp", 200),
    supportLabel: text(contactInput.supportLabel, "Label dukungan", 40),
  }

  // Office Hours
  const hoursInput = input.officeHours as Record<string, unknown> | undefined
  if (!hoursInput || typeof hoursInput !== "object" || Array.isArray(hoursInput)) throw new SiteContactValidationError("Struktur jam layanan tidak valid.")
  if (typeof hoursInput.visible !== "boolean") throw new SiteContactValidationError("Visibility jam layanan harus boolean.")
  if (!Array.isArray(hoursInput.items)) throw new SiteContactValidationError("Daftar jam layanan tidak valid.")
  const officeHoursItems: OfficeHourItem[] = hoursInput.items.map((itemValue) => {
    if (!itemValue || typeof itemValue !== "object" || Array.isArray(itemValue)) throw new SiteContactValidationError("Item jam layanan tidak valid.")
    const item = itemValue as Record<string, unknown>
    return {
      id: safeId(item.id, "ID jam layanan"),
      dayLabel: text(item.dayLabel, "Label hari", 40),
      timeLabel: text(item.timeLabel, "Label jam", 40),
      position: finiteNum(item.position, "Posisi jam layanan"),
    }
  })
  const uniqueHoursIds = new Set(officeHoursItems.map((h) => h.id))
  if (uniqueHoursIds.size !== officeHoursItems.length) throw new SiteContactValidationError("ID jam layanan tidak boleh duplikat.")
  const officeHours = {
    visible: hoursInput.visible,
    items: [...officeHoursItems].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)),
  }

  // Social Links
  if (!Array.isArray(input.socialLinks)) throw new SiteContactValidationError("Daftar media sosial tidak valid.")
  const socialLinks: SocialLink[] = input.socialLinks.map((itemValue) => {
    if (!itemValue || typeof itemValue !== "object" || Array.isArray(itemValue)) throw new SiteContactValidationError("Item media sosial tidak valid.")
    const item = itemValue as Record<string, unknown>
    const platform = text(item.platform, "Platform media sosial", 30) as SocialPlatform
    if (!ALLOWED_SOCIAL_PLATFORMS.includes(platform)) throw new SiteContactValidationError(`Platform ${platform} tidak didukung.`)
    return {
      id: safeId(item.id, "ID media sosial"),
      platform,
      label: text(item.label, "Label media sosial", 40),
      url: secureUrl(item.url, "URL media sosial"),
      visible: typeof item.visible === "boolean" ? item.visible : true,
      position: finiteNum(item.position, "Posisi media sosial"),
    }
  })
  const uniqueSocialIds = new Set(socialLinks.map((s) => s.id))
  if (uniqueSocialIds.size !== socialLinks.length) throw new SiteContactValidationError("ID media sosial tidak boleh duplikat.")

  // Footer
  const footerInput = input.footer as Record<string, unknown> | undefined
  if (!footerInput || typeof footerInput !== "object" || Array.isArray(footerInput)) throw new SiteContactValidationError("Struktur footer tidak valid.")
  const footer: FooterSettings = {
    description: text(footerInput.description, "Deskripsi footer", 300),
    copyrightText: text(footerInput.copyrightText, "Teks hak cipta", 100),
    secondaryText: text(footerInput.secondaryText, "Teks sekunder footer", 80),
    showSocialLinks: typeof footerInput.showSocialLinks === "boolean" ? footerInput.showSocialLinks : true,
    showContact: typeof footerInput.showContact === "boolean" ? footerInput.showContact : true,
    showAddress: typeof footerInput.showAddress === "boolean" ? footerInput.showAddress : true,
  }

  return {
    organization,
    contact,
    officeHours,
    socialLinks: [...socialLinks].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)),
    footer,
    updatedAt: text(input.updatedAt ?? new Date().toISOString(), "Tanggal pembaruan", 40),
  }
}

export function whatsappHref(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
}

export function toPublicSiteContact(content: SiteContactContent): Omit<SiteContactContent, "socialLinks" | "officeHours"> & { socialLinks: SocialLink[]; officeHours: { visible: boolean; items: OfficeHourItem[] } } {
  return {
    organization: content.organization,
    contact: content.contact,
    officeHours: {
      visible: content.officeHours.visible,
      items: content.officeHours.visible ? content.officeHours.items : [],
    },
    socialLinks: content.socialLinks.filter((link) => link.visible),
    footer: content.footer,
    updatedAt: content.updatedAt,
  }
}

