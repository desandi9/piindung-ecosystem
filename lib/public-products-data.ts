export type PublicProductCategory = "Tata Kelola" | "Penghimpunan" | "Penyaluran & Pelayanan" | "Informasi & Media" | "Layanan Kesehatan" | "Dokumentasi & Arsip"
export type PublicProductStatus = "Aktif" | "Segera Hadir"
export type PublicProductId = "gorut" | "etasyaruf" | "mobisnu" | "arsip" | "lazisnu-pos" | (string & {})

export interface PublicProduct {
  id: PublicProductId
  name: string
  shortName: string
  description: string
  iconUrl: string
  category: PublicProductCategory
  status: PublicProductStatus
  publicHref: string
  visible: boolean
  featured: boolean
  position: number
}

const SAFE_PRODUCT_ID = /^[a-z0-9][a-z0-9-]{0,79}$/

export function normalizePublicProductId(name: string) {
  const id = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return SAFE_PRODUCT_ID.test(id) ? id : null
}

export function isValidPublicProductRoute(href: unknown) {
  if (href === "" || href === null || href === undefined) return true
  if (typeof href !== "string") return false
  const trimmed = href.trim()
  if (trimmed === "") return true
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("..") && !trimmed.includes("\\")) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function createPublicProduct(input: Omit<PublicProduct, "id">) {
  const id = normalizePublicProductId(input.name)
  if (!id) return null
  return { ...input, id, name: input.name.trim(), shortName: input.shortName.trim(), description: input.description.trim(), iconUrl: input.iconUrl.trim(), publicHref: input.publicHref.trim() }
}

export const PUBLIC_PRODUCTS_STORAGE_KEY = "piindung-public-products"
export const PUBLIC_PRODUCTS_EVENT = "piindung-public-products-updated"

export const DEFAULT_PUBLIC_PRODUCTS: PublicProduct[] = [
  {
    id: "gorut",
    name: "GORUT",
    shortName: "",
    description: "Sistem operasional koin infak untuk pencatatan, pemeriksaan, pengelolaan, dan pelaporan yang lebih tertib.",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ICON%20GORUT%20%28KOIN%29-PuI8bKYRsYavejAiAnpcf2KYBYxvCG.png",
    category: "Tata Kelola",
    status: "Aktif",
    publicHref: "/gorut",
    visible: true,
    featured: true,
    position: 1,
  },
  {
    id: "etasyaruf",
    name: "E-Tasyaruf",
    shortName: "",
    description: "Sistem pengelolaan program dan penyaluran bantuan agar proses lebih terarah dan mudah dipantau.",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ICON%20PENTASYARUFAN-3d1ESgFGdHDSsVyGwM4bA8f00UZulq.png",
    category: "Penyaluran & Pelayanan",
    status: "Segera Hadir",
    publicHref: "",
    visible: true,
    featured: false,
    position: 2,
  },
  {
    id: "mobisnu",
    name: "Mobisnu",
    shortName: "",
    description: "Layanan mobil kesehatan dan ambulans NU untuk pelayanan keliling kepada umat, dengan respons cepat dan mudah diakses.",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon%20mobisnu.PNG-PTAlyAtc2gSG1E6t9lumYCrjcxZbQs.png",
    category: "Layanan Kesehatan",
    status: "Segera Hadir",
    publicHref: "",
    visible: true,
    featured: false,
    position: 3,
  },
  {
    id: "arsip",
    name: "Arsip Digital",
    shortName: "Arsip",
    description: "Pengelolaan arsip digital agar dokumen organisasi lebih rapi, aman, dan mudah dicari kapan saja.",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon%20arsip.PNG-ICoMCGSDzrJxP8skMbkxCesujkv4Rc.png",
    category: "Dokumentasi & Arsip",
    status: "Segera Hadir",
    publicHref: "",
    visible: true,
    featured: false,
    position: 4,
  },
  {
    id: "lazisnu-pos",
    name: "LAZISNU POS",
    shortName: "",
    description: "Sistem point of sale untuk membantu transaksi, pencatatan pembayaran, dan pelaporan layanan usaha atau unit operasional LAZISNU.",
    iconUrl: "",
    category: "Penghimpunan",
    status: "Segera Hadir",
    publicHref: "",
    visible: true,
    featured: false,
    position: 5,
  },
]
