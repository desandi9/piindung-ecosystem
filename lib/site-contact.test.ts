import assert from "node:assert/strict"
import { test } from "node:test"
import { DEFAULT_SITE_CONTACT, validateSiteContact, toPublicSiteContact } from "./site-contact"

test("validateSiteContact correctly normalizes payload and rejects malformed fields", () => {
  const defaults = DEFAULT_SITE_CONTACT
  assert.doesNotThrow(() => validateSiteContact(defaults))

  // Safe formatting
  const formatted = validateSiteContact({
    ...defaults,
    contact: { ...defaults.contact, email: " TEST@EXAMPLE.com ", whatsappNumber: " +62-856-0033-5066 " }
  })
  assert.equal(formatted.contact.email, "test@example.com")
  assert.equal(formatted.contact.whatsappNumber, "6285600335066")

  // Control characters
  assert.throws(() => validateSiteContact({ ...defaults, organization: { ...defaults.organization, name: "bad\u0000text" } }), /karakter tidak valid/)

  // Invalid email
  assert.throws(() => validateSiteContact({ ...defaults, contact: { ...defaults.contact, email: "invalid-email" } }), /Format email tidak valid/)

  // Invalid map/social URL
  assert.throws(() => validateSiteContact({ ...defaults, organization: { ...defaults.organization, mapUrl: "http://insecure.com" } }), /HTTPS/)
  assert.throws(() => validateSiteContact({ ...defaults, socialLinks: [{ ...defaults.socialLinks[0], url: "javascript:alert(1)" }] }), /HTTPS/)

  // Unknown social platform
  assert.throws(() => validateSiteContact({ ...defaults, socialLinks: [{ ...defaults.socialLinks[0], platform: "unknown-platform" }] }), /Platform unknown-platform tidak didukung/)

  // Invalid phone link
  assert.throws(() => validateSiteContact({ ...defaults, contact: { ...defaults.contact, phoneHref: "not-a-number" } }), /nomor telepon/)
})

test("toPublicSiteContact filters hidden items", () => {
  const payload = {
    ...DEFAULT_SITE_CONTACT,
    officeHours: { visible: false, items: [{ id: "h1", dayLabel: "Day", timeLabel: "Time", position: 1 }] },
    socialLinks: [
      { id: "s1", platform: "instagram" as const, label: "IG", url: "https://ig.com", visible: true, position: 1 },
      { id: "s2", platform: "facebook" as const, label: "FB", url: "https://fb.com", visible: false, position: 2 },
    ]
  }

  const publicData = toPublicSiteContact(validateSiteContact(payload))
  assert.equal(publicData.officeHours.visible, false)
  assert.equal(publicData.officeHours.items.length, 0)
  assert.equal(publicData.socialLinks.length, 1)
  assert.equal(publicData.socialLinks[0].id, "s1")
})
