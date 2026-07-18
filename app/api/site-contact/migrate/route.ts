import { NextResponse } from "next/server"
import { DEFAULT_SITE_CONTACT, type SocialLink } from "@/lib/site-contact"
import { readLegacyContactSocialRecords, requireSiteContactManager, updateSiteContact } from "@/lib/site-contact-server"
import { getRecord } from "@/lib/record-store-server"

export async function POST() {
  try {
    const access = await requireSiteContactManager()
    if (access.response) return access.response

    const existing = await getRecord("site-contact", "main")
    if (existing) return NextResponse.json({ contact: existing.data, migrated: false, skippedCount: 0 })

    const legacy = await readLegacyContactSocialRecords()
    if (!legacy) {
      const contact = await updateSiteContact(DEFAULT_SITE_CONTACT, access.user)
      return NextResponse.json({ contact, migrated: true, skippedCount: 0 })
    }

    const old = legacy.data
    let skippedCount = 0
    const socials: SocialLink[] = [
      ["instagram", "instagram", "Instagram"],
      ["tiktok", "tiktok", "TikTok"],
      ["facebook", "facebook", "Facebook"],
    ].flatMap(([key, platform, label], index): SocialLink[] => {
      const url = old[key]
      if (typeof url !== "string" || !url.startsWith("https://")) {
        if (url) skippedCount += 1
        return []
      }
      return [{ id: platform, platform: platform as any, label: label as any, url, visible: true, position: index + 1 }]
    })

    const address = typeof old.address === "string" && old.address.trim() ? old.address.trim() : DEFAULT_SITE_CONTACT.organization.address
    const email = typeof old.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(old.email.trim()) ? old.email.trim().toLowerCase() : DEFAULT_SITE_CONTACT.contact.email
    const rawWhatsapp = typeof old.whatsapp === "string" ? old.whatsapp.replace(/\D/g, "") : ""
    const whatsappNumber = rawWhatsapp || DEFAULT_SITE_CONTACT.contact.whatsappNumber
    const officeItems = typeof old.officeHours === "string" ? old.officeHours.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
      const [dayLabel, ...timeParts] = line.split(",")
      return { id: `hours-${index + 1}`, dayLabel: dayLabel.trim(), timeLabel: timeParts.join(",").trim() || "-", position: index + 1 }
    }) : DEFAULT_SITE_CONTACT.officeHours.items

    const content = {
      organization: {
        name: DEFAULT_SITE_CONTACT.organization.name,
        shortName: DEFAULT_SITE_CONTACT.organization.shortName,
        description: DEFAULT_SITE_CONTACT.organization.description,
        address,
        city: DEFAULT_SITE_CONTACT.organization.city,
        postalCode: DEFAULT_SITE_CONTACT.organization.postalCode,
        mapUrl: typeof old.googleMapsEmbed === "string" && old.googleMapsEmbed.startsWith("https://") ? old.googleMapsEmbed.trim() : DEFAULT_SITE_CONTACT.organization.mapUrl,
      },
      contact: {
        email,
        phoneDisplay: typeof old.whatsapp === "string" && old.whatsapp.trim() ? old.whatsapp.trim() : DEFAULT_SITE_CONTACT.contact.phoneDisplay,
        phoneHref: whatsappNumber,
        whatsappNumber,
        whatsappMessage: DEFAULT_SITE_CONTACT.contact.whatsappMessage,
        supportLabel: DEFAULT_SITE_CONTACT.contact.supportLabel,
      },
      officeHours: { visible: true, items: officeItems.length ? officeItems : DEFAULT_SITE_CONTACT.officeHours.items },
      socialLinks: socials.length ? socials : DEFAULT_SITE_CONTACT.socialLinks,
      footer: DEFAULT_SITE_CONTACT.footer,
      updatedAt: new Date().toISOString(),
    }

    const contact = await updateSiteContact(content, access.user)
    return NextResponse.json({ contact, migrated: true, skippedCount })
  } catch {
    return NextResponse.json({ error: "Gagal memigrasikan data kontak lama." }, { status: 500 })
  }
}
