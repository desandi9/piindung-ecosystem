export const SITE_BRANDING_SCOPE = "site-branding"
export const SITE_BRANDING_KEY = "main"
export const SITE_BRANDING_EVENT = "piindung-site-branding-updated"

export type BrandAsset = { path: string; width: number; height: number; mimeType: "image/png" | "image/jpeg" | "image/webp"; fileSize: number; updatedAt: string }
export type SiteBranding = {
  identity: { organizationName: string; shortName: string; tagline: string; logoAltText: string }
  logos: { navbarLight: BrandAsset; navbarDark: BrandAsset; footerLight: BrandAsset; footerDark: BrandAsset; squareMark: BrandAsset }
  icons: { favicon: BrandAsset; appleTouchIcon: BrandAsset }
  socialPreview: { defaultOgImage: BrandAsset; defaultOgAlt: string; defaultOgTitle: string; defaultOgDescription: string }
  fallbackMedia: { defaultThumbnail: BrandAsset; defaultArticleCover: BrandAsset; defaultProductIcon: BrandAsset }
  updatedAt: string
}

const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/
const MAX_ASSET_SIZE = 10 * 1024 * 1024
const fallbackAsset = (path: string, width: number, height: number, mimeType: BrandAsset["mimeType"] = "image/png"): BrandAsset => ({ path, width, height, mimeType, fileSize: 0, updatedAt: new Date(0).toISOString() })
export const DEFAULT_SITE_BRANDING: SiteBranding = {
  identity: { organizationName: "NU Care-LAZISNU Kabupaten Garut", shortName: "LAZISNU Garut", tagline: "PIINDUNG — Pusat Informasi dan Layanan", logoAltText: "PIINDUNG NU Care-LAZISNU Garut" },
  logos: {
    navbarLight: fallbackAsset("/Logo-navbar2.png", 1366, 306), navbarDark: fallbackAsset("/Logo-navbarputih.png", 1366, 306), footerLight: fallbackAsset("/Logo-navbar2.png", 1366, 306), footerDark: fallbackAsset("/Logo-navbarputih.png", 1366, 306), squareMark: fallbackAsset("/piindung-logo-blue.png", 512, 512),
  },
  icons: { favicon: fallbackAsset("/piindung-logo-blue.png", 512, 512), appleTouchIcon: fallbackAsset("/piindung-logo-blue.png", 512, 512) },
  socialPreview: { defaultOgImage: fallbackAsset("/piindung-logo-blue.png", 512, 512), defaultOgAlt: "PIINDUNG NU Care-LAZISNU Garut", defaultOgTitle: "PIINDUNG — NU Care-LAZISNU Garut", defaultOgDescription: "Platform digital NU Care-LAZISNU Garut." },
  fallbackMedia: { defaultThumbnail: fallbackAsset("/piindung-logo-blue.png", 512, 512), defaultArticleCover: fallbackAsset("/piindung-logo-blue.png", 512, 512), defaultProductIcon: fallbackAsset("/piindung-logo-blue.png", 512, 512) },
  updatedAt: new Date(0).toISOString(),
}

function text(value: unknown, field: string, max: number) { if (typeof value !== "string" || !value.trim() || value.length > max || CONTROL.test(value)) throw new Error(`${field} tidak valid.`); return value.trim() }
function asset(value: unknown, field: string): BrandAsset { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} tidak valid.`); const a = value as Record<string, unknown>; const path = text(a.path, `${field} path`, 300); if (!path.startsWith("/") || path.includes("..") || path.startsWith("//") || path.includes("\\") || /^[a-z][a-z0-9+.-]*:/i.test(path)) throw new Error(`${field} path tidak aman.`); const mimeType = a.mimeType; if (mimeType !== "image/png" && mimeType !== "image/jpeg" && mimeType !== "image/webp") throw new Error(`${field} MIME tidak didukung.`); if (typeof a.width !== "number" || !Number.isSafeInteger(a.width) || a.width < 1 || a.width > 10000 || typeof a.height !== "number" || !Number.isSafeInteger(a.height) || a.height < 1 || a.height > 10000) throw new Error(`${field} dimensi tidak valid.`); if (typeof a.fileSize !== "number" || !Number.isSafeInteger(a.fileSize) || a.fileSize < 0 || a.fileSize > MAX_ASSET_SIZE) throw new Error(`${field} ukuran tidak valid.`); return { path, width: a.width, height: a.height, mimeType, fileSize: a.fileSize, updatedAt: text(a.updatedAt, `${field} updatedAt`, 40) } }
export function validateSiteBranding(value: unknown): SiteBranding { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Payload branding tidak valid."); const v = value as Record<string, unknown>; const identity = v.identity as Record<string, unknown>; const logos = v.logos as Record<string, unknown>; const icons = v.icons as Record<string, unknown>; const social = v.socialPreview as Record<string, unknown>; const fallbacks = v.fallbackMedia as Record<string, unknown>; if (!identity || !logos || !icons || !social || !fallbacks) throw new Error("Struktur branding tidak lengkap."); return { identity: { organizationName: text(identity.organizationName, "Nama organisasi", 120), shortName: text(identity.shortName, "Nama pendek", 60), tagline: text(identity.tagline, "Tagline", 160), logoAltText: text(identity.logoAltText, "Alt logo", 160) }, logos: { navbarLight: asset(logos.navbarLight, "Navbar light"), navbarDark: asset(logos.navbarDark, "Navbar dark"), footerLight: asset(logos.footerLight, "Footer light"), footerDark: asset(logos.footerDark, "Footer dark"), squareMark: asset(logos.squareMark, "Square mark") }, icons: { favicon: asset(icons.favicon, "Favicon"), appleTouchIcon: asset(icons.appleTouchIcon, "Apple icon") }, socialPreview: { defaultOgImage: asset(social.defaultOgImage, "OG image"), defaultOgAlt: text(social.defaultOgAlt, "OG alt", 160), defaultOgTitle: text(social.defaultOgTitle, "OG title", 160), defaultOgDescription: text(social.defaultOgDescription, "OG description", 300) }, fallbackMedia: { defaultThumbnail: asset(fallbacks.defaultThumbnail, "Thumbnail fallback"), defaultArticleCover: asset(fallbacks.defaultArticleCover, "Article fallback"), defaultProductIcon: asset(fallbacks.defaultProductIcon, "Product fallback") }, updatedAt: text(v.updatedAt ?? new Date(0).toISOString(), "UpdatedAt", 40) } }
export function toPublicSiteBranding(branding: SiteBranding) { const safe = validateSiteBranding(branding); return { identity: safe.identity, logos: safe.logos, icons: safe.icons, socialPreview: safe.socialPreview, fallbackMedia: safe.fallbackMedia } }
export function countBrandingAssets(branding: SiteBranding) { return Object.keys(branding.logos).length + Object.keys(branding.icons).length + 1 + Object.keys(branding.fallbackMedia).length }
