import assert from "node:assert/strict"
import { test } from "node:test"
import { DEFAULT_SITE_BRANDING, toPublicSiteBranding, validateSiteBranding } from "./site-branding"

test("branding validates safe internal assets and deterministic projection", () => {
  const branding = validateSiteBranding(DEFAULT_SITE_BRANDING)
  const projected = toPublicSiteBranding(branding)
  assert.equal(projected.identity.shortName, "LAZISNU Garut")
  assert.equal("updatedAt" in projected, false)
})

test("branding rejects unsafe and malformed assets", () => {
  assert.throws(() => validateSiteBranding({ ...DEFAULT_SITE_BRANDING, logos: { ...DEFAULT_SITE_BRANDING.logos, navbarLight: { ...DEFAULT_SITE_BRANDING.logos.navbarLight, path: "javascript:alert(1)" } } }))
  assert.throws(() => validateSiteBranding({ ...DEFAULT_SITE_BRANDING, icons: { ...DEFAULT_SITE_BRANDING.icons, favicon: { ...DEFAULT_SITE_BRANDING.icons.favicon, path: "/../../secret" } } }))
  assert.throws(() => validateSiteBranding({ ...DEFAULT_SITE_BRANDING, icons: { ...DEFAULT_SITE_BRANDING.icons, favicon: { ...DEFAULT_SITE_BRANDING.icons.favicon, path: "https://example.com/logo.png" } } }))
  assert.throws(() => validateSiteBranding({ ...DEFAULT_SITE_BRANDING, logos: { ...DEFAULT_SITE_BRANDING.logos, navbarLight: { ...DEFAULT_SITE_BRANDING.logos.navbarLight, path: "data:image/png;base64,123" } } }))
  assert.throws(() => validateSiteBranding({ ...DEFAULT_SITE_BRANDING, fallbackMedia: { ...DEFAULT_SITE_BRANDING.fallbackMedia, defaultThumbnail: { ...DEFAULT_SITE_BRANDING.fallbackMedia.defaultThumbnail, mimeType: "image/svg+xml" } } }))
})
