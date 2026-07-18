export type PublicProductCategory = "Tata Kelola" | "Penghimpunan" | "Penyaluran & Pelayanan" | "Informasi & Media"
export type PublicProductStatus = "Aktif" | "Segera Hadir"
export type PublicProductId = "gorut" | "etasyaruf" | "mobisnu" | "arsip" | "lazisnu-pos"

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
    description: "Layanan berbasis mobile untuk mendukung informasi, komunikasi, dan akses layanan organisasi.",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon%20mobisnu.PNG-PTAlyAtc2gSG1E6t9lumYCrjcxZbQs.png",
    category: "Informasi & Media",
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
    description: "Pusat penyimpanan dokumen organisasi agar arsip lebih tertata, mudah dicari, dan aman.",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon%20arsip.PNG-ICoMCGSDzrJxP8skMbkxCesujkv4Rc.png",
    category: "Tata Kelola",
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
