export const GALLERY_CONTENT_SCOPE = "gallery-content"
export const GALLERY_CONTENT_KEY = "main"

export type GalleryAsset = { path: string; width: number; height: number; mimeType: "image/png" | "image/jpeg" | "image/webp"; fileSize: number; updatedAt: string }
export type GalleryHero = { eyebrow: string; title: string; highlightedText: string; description: string; image?: GalleryAsset }
export type GalleryCategory = { id: string; name: string; description: string; visible: boolean; position: number }
export type GalleryItem = { id: string; title: string; description: string; categoryId: string; image: GalleryAsset; thumbnail?: GalleryAsset; date?: string; location?: string; photographer?: string; altText?: string; featured: boolean; visible: boolean; position: number }
export type GalleryCallToAction = { eyebrow: string; title: string; description: string; primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string; visible: boolean; backgroundImage?: GalleryAsset }
export type GalleryContent = { hero: GalleryHero; categories: GalleryCategory[]; items: GalleryItem[]; callToAction: GalleryCallToAction; updatedAt: string }
export type PublicGalleryContent = GalleryContent

const epoch = new Date(0).toISOString()
export const DEFAULT_GALLERY_CONTENT: GalleryContent = {
  hero: { eyebrow: "GALERI KEGIATAN", title: "Dokumentasi", highlightedText: "Dampak Nyata", description: "Dokumentasi publik kegiatan NU Care–LAZISNU Garut yang telah ditinjau dan disetujui untuk dipublikasikan." },
  categories: [],
  items: [],
  callToAction: { eyebrow: "NU CARE–LAZISNU GARUT", title: "Bersama Menguatkan Pelayanan Umat", description: "Kenali program dan layanan publik kami.", primaryLabel: "Lihat Program", primaryHref: "/program", secondaryLabel: "Hubungi Kami", secondaryHref: "/kontak", visible: true },
  updatedAt: epoch,
}

const control = /[\u0000-\u001f\u007f]/
function object(value: unknown, name: string): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} tidak valid.`); return value as Record<string, unknown> }
function text(value: unknown, name: string, max: number, optional = false): string | undefined { if (optional && (value === undefined || value === "")) return undefined; if (typeof value !== "string" || !value.trim() || value.length > max || control.test(value) || /<[^>]*>/.test(value)) throw new Error(`${name} tidak valid.`); return value.trim() }
function id(value: unknown, name: string): string { const result = text(value, name, 80); if (!result || !/^[a-z0-9][a-z0-9_-]*$/.test(result)) throw new Error(`${name} tidak valid.`); return result }
function position(value: unknown): number { if (typeof value !== "number" || !Number.isFinite(value) || !Number.isSafeInteger(value) || value < 0 || value > 10000) throw new Error("Posisi tidak valid."); return value }
function bool(value: unknown, name: string): boolean { if (typeof value !== "boolean") throw new Error(`${name} tidak valid.`); return value }
function link(value: unknown, name: string, optional = false): string { if (optional && (value === undefined || value === "")) return ""; const result = text(value, name, 300); if (!result) throw new Error(`${name} tidak valid.`); if (result.startsWith("/") && !result.startsWith("//") && !result.includes("..") && !result.includes("\\")) return result; try { const url = new URL(result); if (url.protocol === "https:") return url.toString() } catch {} throw new Error(`${name} tidak aman.`) }
function asset(value: unknown, name: string): GalleryAsset { const raw = object(value, name); const path = text(raw.path, `${name} path`, 300); if (!path?.startsWith("/") || path.startsWith("//") || path.includes("..") || path.includes("\\") || path.startsWith("/data:") || path.startsWith("/javascript:")) throw new Error(`${name} path tidak aman.`); if (raw.mimeType !== "image/png" && raw.mimeType !== "image/jpeg" && raw.mimeType !== "image/webp") throw new Error(`${name} MIME tidak didukung.`); if (typeof raw.width !== "number" || !Number.isSafeInteger(raw.width) || raw.width < 1 || raw.width > 12000 || typeof raw.height !== "number" || !Number.isSafeInteger(raw.height) || raw.height < 1 || raw.height > 12000 || typeof raw.fileSize !== "number" || !Number.isSafeInteger(raw.fileSize) || raw.fileSize < 0 || raw.fileSize > 10 * 1024 * 1024) throw new Error(`${name} metadata tidak valid.`); return { path, width: raw.width, height: raw.height, mimeType: raw.mimeType, fileSize: raw.fileSize, updatedAt: text(raw.updatedAt, `${name} updatedAt`, 40) ?? epoch } }
function optionalAsset(value: unknown, name: string): GalleryAsset | undefined { return value === undefined ? undefined : asset(value, name) }
function date(value: unknown): string | undefined { const result = text(value, "Tanggal", 10, true); if (!result) return undefined; if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`))) throw new Error("Tanggal tidak valid."); return result }
const sorted = <T extends { position: number; id: string }>(items: T[]) => [...items].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))

export function validateGalleryContent(value: unknown): GalleryContent {
  const raw = object(value, "Konten galeri")
  const heroRaw = object(raw.hero, "Hero")
  const ctaRaw = object(raw.callToAction, "CTA")
  if (!Array.isArray(raw.categories) || raw.categories.length > 50 || !Array.isArray(raw.items) || raw.items.length > 500) throw new Error("Struktur galeri tidak valid.")
  const categories = raw.categories.map((entry, index) => { const item = object(entry, `Kategori ${index + 1}`); return { id: id(item.id, "ID kategori"), name: text(item.name, "Nama kategori", 80) ?? "", description: text(item.description, "Deskripsi kategori", 300) ?? "", visible: bool(item.visible, "Visibilitas kategori"), position: position(item.position) } })
  if (new Set(categories.map(item => item.id)).size !== categories.length) throw new Error("ID kategori harus unik.")
  const categoryIds = new Set(categories.map(item => item.id))
  const items = raw.items.map((entry, index) => { const item = object(entry, `Item ${index + 1}`); const categoryId = id(item.categoryId, "Kategori item"); if (!categoryIds.has(categoryId)) throw new Error("Kategori item tidak ditemukan."); const visible = bool(item.visible, "Visibilitas item"); const featured = bool(item.featured, "Status unggulan"); if (featured && !visible) throw new Error("Item unggulan harus terlihat."); return { id: id(item.id, "ID item"), title: text(item.title, "Judul item", 140) ?? "", description: text(item.description, "Deskripsi item", 600) ?? "", categoryId, image: asset(item.image, "Gambar item"), thumbnail: optionalAsset(item.thumbnail, "Thumbnail item"), date: date(item.date), location: text(item.location, "Lokasi", 140, true), photographer: text(item.photographer, "Fotografer", 100, true), altText: text(item.altText, "Teks alternatif", 180, true), featured, visible, position: position(item.position) } })
  if (new Set(items.map(item => item.id)).size !== items.length) throw new Error("ID item harus unik.")
  const signatures = items.map(item => `${item.image.path}\0${item.title.toLocaleLowerCase("id-ID")}`)
  if (new Set(signatures).size !== signatures.length) throw new Error("Gambar dan judul item tidak boleh duplikat.")
  return { hero: { eyebrow: text(heroRaw.eyebrow, "Eyebrow hero", 80) ?? "", title: text(heroRaw.title, "Judul hero", 140) ?? "", highlightedText: text(heroRaw.highlightedText, "Sorotan hero", 100) ?? "", description: text(heroRaw.description, "Deskripsi hero", 500) ?? "", image: optionalAsset(heroRaw.image, "Gambar hero") }, categories: sorted(categories), items: sorted(items), callToAction: { eyebrow: text(ctaRaw.eyebrow, "Eyebrow CTA", 80) ?? "", title: text(ctaRaw.title, "Judul CTA", 140) ?? "", description: text(ctaRaw.description, "Deskripsi CTA", 500) ?? "", primaryLabel: text(ctaRaw.primaryLabel, "Label CTA utama", 60) ?? "", primaryHref: link(ctaRaw.primaryHref, "Tautan CTA utama"), secondaryLabel: text(ctaRaw.secondaryLabel, "Label CTA sekunder", 60) ?? "", secondaryHref: link(ctaRaw.secondaryHref, "Tautan CTA sekunder", true), visible: bool(ctaRaw.visible, "Visibilitas CTA"), backgroundImage: optionalAsset(ctaRaw.backgroundImage, "Latar CTA") }, updatedAt: text(raw.updatedAt, "Waktu pembaruan", 40) ?? epoch }
}

export function toPublicGalleryContent(value: GalleryContent): PublicGalleryContent { const content = validateGalleryContent(value); const categories = content.categories.filter(category => category.visible); const allowed = new Set(categories.map(category => category.id)); return { ...content, categories, items: content.items.filter(item => item.visible && allowed.has(item.categoryId)) } }
