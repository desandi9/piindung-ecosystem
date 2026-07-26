import type { Article, PublicArticle } from "@/lib/article-content"

const DAY = 86_400_000

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY).toISOString()
}

type SampleInput = {
  slug: string
  title: string
  excerpt: string
  contentType: Article["contentType"]
  authorName: string
  category: string
  readMinutes: number
  featured?: boolean
  paragraphs: string[]
  publishedDaysAgo: number
}

const SAMPLE_INPUTS: SampleInput[] = [
  {
    slug: "transformasi-digital-pelayanan-zis-lazisnu-garut",
    title: "Transformasi Digital Pelayanan ZIS di LAZISNU Garut",
    excerpt: "Bagaimana digitalisasi membantu pengurus mengelola zakat, infak, dan sedekah dengan lebih tertib, cepat, dan transparan.",
    contentType: "artikel",
    authorName: "Tim Redaksi PIINDUNG",
    category: "Transformasi Digital",
    readMinutes: 5,
    featured: true,
    publishedDaysAgo: 2,
    paragraphs: [
      "Digitalisasi pelayanan zakat, infak, dan sedekah (ZIS) bukan sekadar memindahkan pencatatan manual ke aplikasi. Ini tentang membangun alur kerja yang lebih jelas bagi pengurus di setiap tingkatan.",
      "Melalui PIINDUNG, data penghimpunan hingga penyaluran berada dalam satu ekosistem. Pengurus dapat memantau perkembangan program tanpa harus menunggu rekap manual yang memakan waktu.",
      "Hasilnya, waktu yang sebelumnya habis untuk administrasi berulang kini dapat difokuskan kembali kepada pelayanan umat secara langsung.",
    ],
  },
  {
    slug: "mengenal-ekosistem-digital-piindung",
    title: "Mengenal Ekosistem Digital PIINDUNG",
    excerpt: "PIINDUNG menyatukan data, proses, dan layanan NU Care–LAZISNU Garut dalam satu ruang kerja digital yang terhubung.",
    contentType: "artikel",
    authorName: "Sekretariat PIINDUNG",
    category: "Ekosistem Digital",
    readMinutes: 4,
    publishedDaysAgo: 6,
    paragraphs: [
      "PIINDUNG dirancang sebagai ekosistem, bukan kumpulan aplikasi terpisah. Setiap produk saling terhubung sehingga informasi mengalir tanpa terputus.",
      "Dengan pendekatan ini, pengurus tidak perlu berpindah-pindah sistem untuk menyelesaikan satu proses pelayanan.",
      "Ekosistem yang terhubung juga memudahkan monitoring, karena setiap tahapan tercatat dan dapat ditelusuri dengan mudah.",
    ],
  },
  {
    slug: "digitalisasi-penghimpunan-koin-nu-garut",
    title: "Digitalisasi Penghimpunan Koin NU di Kabupaten Garut",
    excerpt: "Program koin NU kini didukung pencatatan digital yang memudahkan pemeriksaan dan pelaporan hasil penghimpunan.",
    contentType: "berita",
    authorName: "Tim GORUT",
    category: "Penghimpunan",
    readMinutes: 3,
    publishedDaysAgo: 9,
    paragraphs: [
      "Gerakan koin NU menjadi salah satu tulang punggung penghimpunan di tingkat masyarakat. Digitalisasi membuat setiap koin tercatat lebih rapi.",
      "Petugas lapangan dapat mencatat hasil penghimpunan langsung dari lokasi, sehingga data lebih akurat dan mudah diverifikasi.",
      "Pelaporan yang tertib memberi kepercayaan lebih besar kepada munfiq bahwa amanah mereka dikelola dengan baik.",
    ],
  },
  {
    slug: "peran-plpk-dalam-pelayanan-munfiq",
    title: "Peran PLPK dalam Pelayanan Munfiq",
    excerpt: "Petugas Lapangan Pengelola Koin menjadi ujung tombak pelayanan yang kini didukung alat digital yang lebih ringkas.",
    contentType: "artikel",
    authorName: "Divisi Pelayanan",
    category: "Pelayanan Umat",
    readMinutes: 4,
    publishedDaysAgo: 13,
    paragraphs: [
      "PLPK berhadapan langsung dengan munfiq setiap hari. Peran mereka menentukan kualitas pengalaman pelayanan di lapangan.",
      "Dukungan digital membantu PLPK mengurangi beban administrasi sehingga interaksi dengan munfiq menjadi lebih hangat dan personal.",
      "Ketika alat kerja semakin ringkas, fokus pelayanan kembali kepada hal yang paling penting: menjaga kepercayaan umat.",
    ],
  },
  {
    slug: "pentingnya-transparansi-pengelolaan-zakat",
    title: "Transparansi dalam Pengelolaan Zakat, Infak, dan Sedekah",
    excerpt: "Transparansi adalah fondasi kepercayaan. Sistem digital membantu menghadirkan pelaporan yang jujur dan mudah diakses.",
    contentType: "artikel",
    authorName: "Tim Redaksi PIINDUNG",
    category: "Transparansi",
    readMinutes: 5,
    publishedDaysAgo: 18,
    paragraphs: [
      "Kepercayaan umat dibangun dari transparansi. Setiap dana yang dihimpun perlu dapat dipertanggungjawabkan dengan jelas.",
      "Sistem digital memungkinkan pelaporan yang konsisten, tanpa selisih data yang sering muncul pada pencatatan manual.",
      "Dengan informasi yang terbuka, pengurus dan masyarakat berada pada pemahaman yang sama mengenai dampak yang telah dicapai.",
    ],
  },
  {
    slug: "kolaborasi-pengurus-pelayanan-umat-lebih-baik",
    title: "Kolaborasi Pengurus untuk Pelayanan Umat yang Lebih Baik",
    excerpt: "Ketika PC, UPZIS, dan PLPK bekerja dalam satu alur, pelayanan menjadi lebih cepat, terarah, dan mudah dipantau.",
    contentType: "berita",
    authorName: "Sekretariat PIINDUNG",
    category: "Kolaborasi",
    readMinutes: 3,
    publishedDaysAgo: 24,
    paragraphs: [
      "Pelayanan yang baik lahir dari kolaborasi. Setiap unit memiliki peran yang saling melengkapi dalam ekosistem PIINDUNG.",
      "Alur kerja yang terhubung mengurangi miskomunikasi antarunit dan mempercepat pengambilan keputusan.",
      "Kolaborasi yang rapi pada akhirnya dirasakan langsung oleh umat melalui pelayanan yang lebih responsif.",
    ],
  },
]

function buildSample(input: SampleInput): Article {
  const publishedAt = daysAgo(input.publishedDaysAgo)
  const body = input.paragraphs.join("\n\n")
  return {
    id: `sample-${input.slug}`,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body,
    contentType: input.contentType,
    coverImage: "",
    authorName: input.authorName,
    status: "published",
    featured: Boolean(input.featured),
    position: input.publishedDaysAgo,
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  }
}

const SAMPLE_META = new Map(SAMPLE_INPUTS.map((input) => [input.slug, { category: input.category, readMinutes: input.readMinutes }]))

export const SAMPLE_ARTICLES: Article[] = SAMPLE_INPUTS.map(buildSample)

export function articleMeta(article: Pick<Article, "slug" | "body" | "contentType">) {
  const meta = SAMPLE_META.get(article.slug)
  const words = article.body ? article.body.trim().split(/\s+/).length : 0
  const readMinutes = meta?.readMinutes ?? Math.max(1, Math.round(words / 200))
  const category = meta?.category ?? (article.contentType === "berita" ? "Berita" : "Artikel")
  return { category, readMinutes }
}

/** Returns real published articles, or falls back to sample data when empty. */
export function withArticleFallback<T extends Pick<Article, "id">>(articles: T[], fallback: T[]): T[] {
  return articles.length > 0 ? articles : fallback
}

export type { PublicArticle }
