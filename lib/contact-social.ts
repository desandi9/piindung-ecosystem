"use client"

import { createSingletonClient } from "@/services/api/record-client"

export interface ContactSocialSettings {
  whatsapp: string
  email: string
  address: string
  googleMapsLink: string
  googleMapsEmbed: string
  instagram: string
  tiktok: string
  facebook: string
  officeHours: string
}

const LEGACY_GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/vFWLqisbRFp9mR9XA"
const LEGACY_GOOGLE_MAPS_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3958.0!2d107.9089!3d-7.2267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68b1a0a0a0a0a0%3A0x0!2sNU%20Care-LAZISNU%20Garut!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
const CURRENT_GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/fN5CNC44W9b7ddRw6"
const CURRENT_GOOGLE_MAPS_EMBED = "https://www.google.com/maps?q=PCNU%20Kabupaten%20Garut,-7.1897862,107.9020127&z=18&output=embed"

export const CONTACT_SOCIAL_STORAGE_KEY = "piindung-contact-social"
export const CONTACT_SOCIAL_EVENT = "piindung-contact-social-updated"

export const DEFAULT_CONTACT_SOCIAL: ContactSocialSettings = {
  whatsapp: "085600335066",
  email: "info@lazisnu.garut",
  address: "Gedung PCNU Kab. Garut Lt 2, Jl. Suherman No. 117, Desa Jati, Kec. Tarogong Kidul, Kab. Garut",
  googleMapsLink: CURRENT_GOOGLE_MAPS_LINK,
  googleMapsEmbed: CURRENT_GOOGLE_MAPS_EMBED,
  instagram: "https://www.instagram.com/lazisnu_garut",
  tiktok: "https://www.tiktok.com/@nucare.lazisnu.garut",
  facebook: "https://www.facebook.com/share/19DfHJXcBV/?mibextid=wwXIfr",
  officeHours: "Senin - Jumat, 08.00 - 16.00 WIB\nSabtu, 08.00 - 12.00 WIB",
}

function migrateLegacyContactSocialSettings(settings: ContactSocialSettings) {
  let changed = false
  const nextSettings = { ...settings }

  if (nextSettings.googleMapsLink === LEGACY_GOOGLE_MAPS_LINK) {
    nextSettings.googleMapsLink = CURRENT_GOOGLE_MAPS_LINK
    changed = true
  }

  if (nextSettings.googleMapsEmbed === LEGACY_GOOGLE_MAPS_EMBED) {
    nextSettings.googleMapsEmbed = CURRENT_GOOGLE_MAPS_EMBED
    changed = true
  }

  return changed ? nextSettings : settings
}

const contactSocialClient = createSingletonClient<ContactSocialSettings>({
  scope: "contact-social",
  defaultValue: DEFAULT_CONTACT_SOCIAL,
  eventName: CONTACT_SOCIAL_EVENT,
})

export function normalizeWhatsApp(number: string) {
  const digits = number.replace(/\D/g, "")
  if (digits.startsWith("0")) return `62${digits.slice(1)}`
  return digits
}

export function whatsappHref(number: string, message = "Assalamualaikum, saya ingin menghubungi NU Care-LAZISNU Garut") {
  return `https://wa.me/${normalizeWhatsApp(number)}?text=${encodeURIComponent(message)}`
}

function dispatchContactSocialEvent(settings: ContactSocialSettings) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<ContactSocialSettings>(CONTACT_SOCIAL_EVENT, { detail: settings }))
}

export function readContactSocialSettings() {
  return migrateLegacyContactSocialSettings(contactSocialClient.readValueSync())
}

export function writeContactSocialSettings(settings: ContactSocialSettings) {
  void contactSocialClient.writeValue(migrateLegacyContactSocialSettings(settings))
}

export function useContactSocialSettings() {
  return migrateLegacyContactSocialSettings(contactSocialClient.useValue())
}
