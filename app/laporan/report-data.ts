export type ReportSlug = "program" | "kegiatan" | "tahunan" | "dokumentasi"

export type ReportIconKey = "program" | "kegiatan" | "tahunan" | "dokumentasi"

export interface ReportMetric {
  label: string
  value: string
  description: string
}

export interface ReportSectionItem {
  title: string
  description: string
}

export interface ReportPageContent {
  slug: ReportSlug
  icon: ReportIconKey
  title: string
  shortDescription: string
  heroDescription: string
  updatedAt: string
  metrics: ReportMetric[]
  sections: Array<{
    title: string
    description: string
    items: ReportSectionItem[]
  }>
}

export const reportPages: ReportPageContent[] = [
  {
    slug: "program",
    icon: "program",
    title: "Laporan Program",
    shortDescription: "Laporan pelaksanaan program-program NU Care-LAZISNU Garut",
    heroDescription: "Ringkasan capaian, realisasi, dan dampak program unggulan NU Care-LAZISNU Garut untuk memudahkan publik melihat progres kerja lembaga secara ringkas.",
    updatedAt: "20 Mei 2026",
    metrics: [
      { label: "Program Aktif", value: "12", description: "Program sosial, pendidikan, kesehatan, dan pemberdayaan yang sedang berjalan." },
      { label: "Penerima Manfaat", value: "1.248", description: "Total penerima manfaat yang tercatat pada periode berjalan." },
      { label: "Realisasi Dana", value: "Rp 487 Jt", description: "Akumulasi penyaluran program sampai laporan terakhir diperbarui." },
    ],
    sections: [
      {
        title: "Program Prioritas",
        description: "Program yang menjadi fokus pelaksanaan dan pelaporan periode ini.",
        items: [
          { title: "NU Care Peduli", description: "Distribusi bantuan sosial untuk warga terdampak bencana dan keluarga rentan." },
          { title: "Beasiswa Santri", description: "Dukungan pendidikan untuk santri dan pelajar dari keluarga prasejahtera." },
          { title: "Layanan Kesehatan Umat", description: "Kolaborasi layanan kesehatan dasar dan pemeriksaan rutin di beberapa wilayah." },
        ],
      },
      {
        title: "Dampak Utama",
        description: "Sorotan hasil yang paling terasa pada penerima manfaat.",
        items: [
          { title: "Akses bantuan lebih cepat", description: "Proses distribusi program dipangkas melalui koordinasi lintas relawan dan kanal digital." },
          { title: "Pelaporan lebih rapi", description: "Setiap program kini memiliki jejak dokumentasi dan status realisasi yang lebih mudah ditinjau." },
        ],
      },
    ],
  },
  {
    slug: "kegiatan",
    icon: "kegiatan",
    title: "Laporan Kegiatan",
    shortDescription: "Laporan kegiatan dan aktivitas lembaga",
    heroDescription: "Dokumentasi aktivitas harian dan agenda lapangan NU Care-LAZISNU Garut yang menampilkan pelaksanaan kegiatan, partisipasi relawan, dan tindak lanjut operasional.",
    updatedAt: "20 Mei 2026",
    metrics: [
      { label: "Agenda Tercatat", value: "28", description: "Kegiatan lembaga yang sudah masuk jurnal aktivitas periode ini." },
      { label: "Relawan Terlibat", value: "94", description: "Partisipan aktif dari unsur pengurus, relawan, dan mitra lapangan." },
      { label: "Wilayah Tersentuh", value: "17", description: "Kecamatan/desa yang tercatat menerima kunjungan atau program langsung." },
    ],
    sections: [
      {
        title: "Agenda Terbaru",
        description: "Beberapa kegiatan yang paling banyak berdampak pada publik.",
        items: [
          { title: "Penyaluran bantuan banjir", description: "Distribusi paket darurat dan logistik ke wilayah terdampak." },
          { title: "Pendampingan UPZIS", description: "Penguatan administrasi dan pencatatan untuk unit pengelola zakat di kecamatan." },
          { title: "Kunjungan koordinasi ranting", description: "Sinkronisasi kebutuhan lapangan, relawan, dan data penerima manfaat." },
        ],
      },
      {
        title: "Catatan Tindak Lanjut",
        description: "Agenda yang memerlukan monitoring pasca kegiatan.",
        items: [
          { title: "Evaluasi dokumentasi", description: "Beberapa kegiatan memerlukan pelengkapan foto, caption, dan rekap narasi hasil." },
          { title: "Rekonsiliasi kehadiran", description: "Daftar partisipan kegiatan akan disinkronkan ke laporan bulanan internal." },
        ],
      },
    ],
  },
  {
    slug: "tahunan",
    icon: "tahunan",
    title: "Laporan Tahunan",
    shortDescription: "Laporan tahunan dan pencapaian NU Care-LAZISNU Garut",
    heroDescription: "Ikhtisar performa tahunan lembaga yang menyoroti pertumbuhan program, tata kelola, penghimpunan, dan penyaluran sepanjang tahun berjalan.",
    updatedAt: "20 Mei 2026",
    metrics: [
      { label: "Pertumbuhan Program", value: "+18%", description: "Peningkatan jumlah inisiatif aktif dibanding tahun sebelumnya." },
      { label: "Penghimpunan", value: "Rp 2,1 M", description: "Akumulasi penghimpunan zakat, infaq, sedekah, dan dana sosial tahunan." },
      { label: "Penyaluran", value: "91%", description: "Persentase realisasi penyaluran terhadap dana terhimpun yang teralokasi." },
    ],
    sections: [
      {
        title: "Sorotan Tahunan",
        description: "Poin utama yang menggambarkan capaian lembaga sepanjang tahun.",
        items: [
          { title: "Ekspansi layanan publik", description: "Penambahan kanal digital dan peningkatan keterjangkauan informasi donasi." },
          { title: "Konsolidasi unit lapangan", description: "UPZIS dan ranting mulai memakai pola pelaporan yang lebih seragam." },
          { title: "Penguatan dokumentasi", description: "Kegiatan dan output program lebih mudah dilacak dengan arsip yang lebih tertata." },
        ],
      },
      {
        title: "Fokus Tahun Berikutnya",
        description: "Arah kerja yang disiapkan untuk fase selanjutnya.",
        items: [
          { title: "Standarisasi pelaporan", description: "Menyederhanakan format input data agar setiap unit mudah menyampaikan laporan." },
          { title: "Peningkatan komunikasi publik", description: "Mendorong update berkala pada homepage, popup, notifikasi, dan galeri kegiatan." },
        ],
      },
    ],
  },
  {
    slug: "dokumentasi",
    icon: "dokumentasi",
    title: "Dokumentasi",
    shortDescription: "Galeri foto dan video dokumentasi kegiatan",
    heroDescription: "Ruang dokumentasi visual untuk menampilkan foto, media kampanye, dan arsip publikasi yang merekam aktivitas NU Care-LAZISNU Garut di lapangan.",
    updatedAt: "20 Mei 2026",
    metrics: [
      { label: "Foto Tersimpan", value: "146", description: "Total dokumentasi visual yang telah dipublikasikan atau diarsipkan." },
      { label: "Album Aktif", value: "11", description: "Kelompok dokumentasi yang sedang dipakai pada publikasi homepage dan laporan." },
      { label: "Media Siap Publikasi", value: "23", description: "Aset visual yang tinggal menunggu kurasi atau caption akhir." },
    ],
    sections: [
      {
        title: "Jenis Dokumentasi",
        description: "Kategori arsip visual yang paling sering digunakan.",
        items: [
          { title: "Kegiatan Lapangan", description: "Foto penyaluran, pendampingan, dan aksi sosial di berbagai wilayah." },
          { title: "Publikasi Program", description: "Aset desain, poster, dan media promosi untuk kampanye lembaga." },
          { title: "Dokumentasi Seremonial", description: "Momen koordinasi, rapat, launching program, dan agenda kelembagaan lainnya." },
        ],
      },
      {
        title: "Catatan Kurasi",
        description: "Poin yang perlu dijaga agar dokumentasi tetap rapi dan layak tayang.",
        items: [
          { title: "Format seragam", description: "Gunakan ukuran dan orientasi visual yang konsisten untuk publikasi sosial media dan homepage." },
          { title: "Sumber media jelas", description: "Cantumkan tautan sumber atau akun sosial media asal bila dokumentasi berasal dari publikasi pihak lain." },
        ],
      },
    ],
  },
]

export function getReportPage(slug: string) {
  return reportPages.find((page) => page.slug === slug)
}
