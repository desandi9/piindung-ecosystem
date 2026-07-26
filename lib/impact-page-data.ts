/**
 * Konten statis halaman publik /dampak.
 *
 * Semua nilai numerik pada `summaryStats` dan `metrics` tiap studi kasus BELUM terhubung
 * ke data operasional PIINDUNG — angka ini adalah PLACEHOLDER demonstratif agar komposisi
 * halaman dapat dinilai. Ganti nilainya di sini saat data resmi tersedia; struktur
 * (id/label/value/prefix/suffix) tidak perlu diubah oleh komponen tampilan.
 */

export type ImpactMetric = {
  id: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export type CaseStudyVisualKind = "transaksi" | "munfiq" | "validasi" | "laporan"

export type CaseStudy = {
  index: number
  slug: string
  title: string
  narrative: string
  metrics: ImpactMetric[]
  benefits: [{ title: string; description: string }, { title: string; description: string }]
  conclusion: string
  visual: CaseStudyVisualKind
}

export const impactHero = {
  eyebrow: "DAMPAK PIINDUNG",
  title: "Dampak Nyata Digitalisasi Pelayanan ZIS",
  description:
    "Melihat lebih dekat bagaimana PIINDUNG membantu LAZISNU Garut mengelola data, pelayanan, penghimpunan, penyaluran, dan pelaporan secara lebih terintegrasi.",
}

/** Placeholder — belum terhubung ke data operasional. Ganti value saat data resmi tersedia. */
export const impactSummaryStats: ImpactMetric[] = [
  { id: "munfiq-terdata", label: "Munfiq Terdata", value: 3482, suffix: "+" },
  { id: "plpk-terhubung", label: "PLPK Terhubung", value: 38, suffix: "+" },
  { id: "transaksi-tercatat", label: "Transaksi Tercatat", value: 12640, suffix: "+" },
  { id: "wilayah-terpantau", label: "Wilayah Terpantau", value: 42, suffix: " kecamatan" },
]

export const impactSummaryNote =
  "Angka bersifat demonstratif untuk menggambarkan skala ekosistem PIINDUNG dan akan diperbarui secara berkala setelah tersambung penuh dengan data operasional resmi."

export const caseStudies: CaseStudy[] = [
  {
    index: 1,
    slug: "penghimpunan-transaksi",
    title: "Penghimpunan yang Lebih Terdata",
    narrative:
      "PIINDUNG membantu pencatatan transaksi penghimpunan secara lebih terstruktur agar data dari petugas lapangan hingga pengurus dapat dipantau dalam satu alur.",
    metrics: [
      { id: "transaksi-tercatat", label: "Transaksi Tercatat", value: 12640, suffix: "+" },
      { id: "nominal-penghimpunan", label: "Nominal Penghimpunan", value: 1.2, prefix: "Rp ", suffix: " M", decimals: 1 },
      { id: "plpk-aktif", label: "PLPK Aktif", value: 38, suffix: "+" },
      { id: "wilayah-terpantau", label: "Wilayah Terpantau", value: 42, suffix: " kecamatan" },
    ],
    benefits: [
      { title: "Pencatatan lebih cepat", description: "Transaksi dari lapangan tercatat langsung tanpa proses input berulang." },
      { title: "Riwayat transaksi lebih mudah ditelusuri", description: "Setiap transaksi memiliki jejak yang jelas dan mudah dicari kembali." },
    ],
    conclusion:
      "Dengan alur pencatatan yang lebih tertib, pengurus dapat memantau penghimpunan secara real-time tanpa menunggu rekap manual.",
    visual: "transaksi",
  },
  {
    index: 2,
    slug: "pendataan-munfiq",
    title: "Data Munfiq Lebih Terpusat",
    narrative:
      "Data munfiq yang sebelumnya tersebar dapat dicatat dan dikelola secara terstruktur berdasarkan wilayah, petugas, serta status pelayanan.",
    metrics: [
      { id: "munfiq-terdata", label: "Munfiq Terdata", value: 3482, suffix: "+" },
      { id: "desa-terlayani", label: "Desa Terlayani", value: 210, suffix: "+" },
      { id: "kecamatan-terhubung", label: "Kecamatan Terhubung", value: 42 },
      { id: "data-terverifikasi", label: "Data Terverifikasi", value: 92, suffix: "%" },
    ],
    benefits: [
      { title: "Mengurangi data ganda", description: "Verifikasi terpusat membantu menghindari pencatatan munfiq berulang." },
      { title: "Memudahkan pencarian dan pembaruan data", description: "Data dapat difilter dan diperbarui langsung per wilayah." },
    ],
    conclusion:
      "Data munfiq yang terpusat memudahkan pengurus melihat cakupan layanan secara menyeluruh, dari kecamatan hingga desa.",
    visual: "munfiq",
  },
  {
    index: 3,
    slug: "monitoring-validasi",
    title: "Monitoring Setoran Lebih Mudah",
    narrative:
      "Pengurus dapat mengikuti status setoran dan proses validasi secara lebih jelas, mulai dari pencatatan hingga pemeriksaan.",
    metrics: [
      { id: "setoran-menunggu", label: "Setoran Menunggu Validasi", value: 24 },
      { id: "setoran-tervalidasi", label: "Setoran Tervalidasi", value: 1180, suffix: "+" },
      { id: "wilayah-aktif", label: "Wilayah Aktif", value: 38, suffix: "+" },
      { id: "waktu-pemeriksaan", label: "Waktu Pemeriksaan", value: 1, suffix: " hari kerja" },
    ],
    benefits: [
      { title: "Status proses lebih transparan", description: "Setiap tahap validasi terlihat jelas oleh petugas dan pengurus." },
      { title: "Pemeriksaan lebih tertib dan terdokumentasi", description: "Riwayat pemeriksaan tersimpan rapi untuk kebutuhan audit internal." },
    ],
    conclusion:
      "Alur validasi yang jelas membuat pengurus lebih percaya diri dalam memastikan setiap setoran sudah diperiksa dengan benar.",
    visual: "validasi",
  },
  {
    index: 4,
    slug: "pelaporan",
    title: "Laporan Lebih Rapi dan Akuntabel",
    narrative:
      "Data yang telah tercatat dapat dirangkum menjadi laporan yang lebih konsisten untuk mendukung evaluasi dan pengambilan keputusan.",
    metrics: [
      { id: "laporan-tersusun", label: "Laporan Tersusun", value: 56, suffix: "+" },
      { id: "periode-tercatat", label: "Periode Tercatat", value: 12, suffix: " bulan" },
      { id: "data-terhimpun", label: "Data Terhimpun", value: 12640, suffix: "+" },
      { id: "wilayah-terlapor", label: "Wilayah Terlapor", value: 42, suffix: " kecamatan" },
    ],
    benefits: [
      { title: "Rekapitulasi lebih efisien", description: "Laporan tersusun otomatis dari data yang sudah tercatat di sistem." },
      { title: "Informasi lebih mudah dipahami pengurus", description: "Ringkasan visual membantu pengurus mengambil keputusan lebih cepat." },
    ],
    conclusion:
      "Laporan yang konsisten memperkuat akuntabilitas organisasi dan mempermudah pertanggungjawaban kepada umat.",
    visual: "laporan",
  },
]

export const impactHighlights = [
  { title: "Data Lebih Terpusat", description: "Informasi dari penghimpunan, munfiq, validasi, hingga laporan dikelola dalam satu ekosistem." },
  { title: "Proses Lebih Efisien", description: "Mengurangi pekerjaan berulang dan mempercepat alur kerja pengurus di lapangan maupun kantor." },
  { title: "Monitoring Lebih Mudah", description: "Perkembangan setoran, validasi, dan wilayah layanan terlihat secara ringkas dan terkini." },
  { title: "Laporan Lebih Tertata", description: "Rekap data mendukung akuntabilitas dan pertanggungjawaban organisasi kepada umat." },
]

export type ImpactTestimonial = {
  id: string
  quote: string
  name: string
  role: string
  institution: string
}

/**
 * Belum ada testimoni resmi yang tersedia untuk ditampilkan secara publik.
 * Isi array ini HANYA dengan testimoni nyata (nama, jabatan, instansi terverifikasi)
 * saat pengurus menyediakannya. Jangan mengisi dengan data contoh/dummy.
 */
export const impactTestimonials: ImpactTestimonial[] = []

export const impactCta = {
  eyebrow: "PIINDUNG UNTUK ORGANISASI",
  title: "Membangun Pelayanan yang Lebih Terhubung",
  description:
    "PIINDUNG membantu menghadirkan pengelolaan data dan pelayanan umat yang lebih tertata, transparan, dan mudah dipantau.",
  primaryLabel: "Pelajari PIINDUNG",
  primaryHref: "/produk",
  secondaryLabel: "Masuk ke Sistem",
  secondaryHref: "/login",
}
