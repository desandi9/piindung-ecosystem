import type { CollectionBatch, CollectionStatus, CollectionVisitStatus } from './types';
// The explicit extension keeps this pure-data module executable by Node's TS test runner.
// @ts-expect-error The application tsconfig intentionally disallows TS extensions.
import { gorutMunfiqData } from './munfiq-mock-data.ts';

const munfiqScopeById = new Map(gorutMunfiqData.map((munfiq) => [munfiq.id, munfiq]));

export interface PlpkHomeMetrics {
  grossAmount: number;
  activeCans: number;
  collectedCans: number;
  pendingCans: number;
  completedMunfiq: number;
  activeMunfiq: number;
}

export function summarizePlpkPeriod(batch: CollectionBatch | null): PlpkHomeMetrics {
  if (!batch) return { grossAmount: 0, activeCans: 0, collectedCans: 0, pendingCans: 0, completedMunfiq: 0, activeMunfiq: 0 };
  return {
    grossAmount: batch.grossAmount,
    activeCans: batch.activeCanCount,
    collectedCans: batch.collectedCanCount,
    pendingCans: batch.pendingCount,
    completedMunfiq: batch.visitedCount,
    activeMunfiq: batch.entries.length,
  };
}

export interface PlpkJournalItem {
  batchId: string;
  period: string;
  status: CollectionStatus;
  activeMunfiq: number;
  collected: number;
  uncollected: number;
  grossAmount: number;
  plpkFee: number;
  netAmount: number;
}

export function buildPlpkJournal(batches: CollectionBatch[]): PlpkJournalItem[] {
  return batches
    .slice()
    .sort((a, b) => b.period.localeCompare(a.period) || b.createdAt.localeCompare(a.createdAt))
    .map((batch) => ({
      batchId: batch.id,
      period: batch.period,
      status: batch.status,
      activeMunfiq: batch.entries.length,
      collected: batch.collectedCanCount,
      uncollected: batch.uncollectedCanCount,
      grossAmount: batch.grossAmount,
      plpkFee: batch.totalPlpkFee,
      netAmount: batch.netAmount,
    }));
}

export interface PlpkMunfiqDirectoryItem {
  id: string;
  canCode: string;
  name: string;
  address: string;
  rt: string;
  rw: string;
  phone: string;
  village: string;
  isActive: boolean;
  lastVisitStatus: CollectionVisitStatus;
  lastAmount: number;
  lastCollectedAt: string;
  activeEntryId?: string;
}

export type PlpkMunfiqFilter = 'all' | 'active' | 'pending' | 'collected' | 'uncollected';

export function buildPlpkMunfiqDirectory(
  batches: CollectionBatch[],
  plpkId: string,
  village: string,
  activeBatchId?: string,
): PlpkMunfiqDirectoryItem[] {
  const scoped = batches
    .filter((batch) => batch.plpkId === plpkId && batch.village === village)
    .slice()
    .sort((a, b) => b.period.localeCompare(a.period) || b.createdAt.localeCompare(a.createdAt));
  const active = activeBatchId ? scoped.find((batch) => batch.id === activeBatchId) : scoped[0];
  const seen = new Set<string>();
  const items: PlpkMunfiqDirectoryItem[] = [];

  for (const batch of scoped) {
    for (const entry of batch.entries) {
      const masterMunfiq = munfiqScopeById.get(entry.munfiqId);
      if (!masterMunfiq || masterMunfiq.plpkId !== plpkId || masterMunfiq.village !== village) continue;
      if (seen.has(entry.munfiqId)) continue;
      seen.add(entry.munfiqId);
      items.push({
        id: entry.munfiqId,
        canCode: entry.canCode,
        name: entry.munfiqName,
        address: entry.address ?? village,
        rt: entry.rt ?? '—',
        rw: entry.rw ?? '—',
        phone: entry.phone,
        village: masterMunfiq.village,
        isActive: entry.isActive !== false,
        lastVisitStatus: entry.visitStatus,
        lastAmount: entry.amount,
        lastCollectedAt: entry.collectedAt,
        activeEntryId: active?.entries.find((item) => item.munfiqId === entry.munfiqId)?.id,
      });
    }
  }

  return items.sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

export function filterPlpkMunfiqDirectory(
  items: PlpkMunfiqDirectoryItem[],
  query: string,
  filter: PlpkMunfiqFilter,
): PlpkMunfiqDirectoryItem[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesQuery = !needle || `${item.name} ${item.canCode} ${item.address} ${item.phone}`.toLowerCase().includes(needle);
    if (!matchesQuery || filter === 'all') return matchesQuery;
    if (filter === 'active') return item.isActive;
    if (filter === 'pending') return item.lastVisitStatus === 'pending';
    if (filter === 'collected') return item.lastVisitStatus === 'collected';
    return item.lastVisitStatus !== 'pending' && item.lastVisitStatus !== 'collected';
  });
}

export type PlpkServiceScreen = 'munfiq' | 'news' | 'distribution' | 'ziswaf' | 'ppob' | 'notifications';

export interface PlpkNewsArticle {
  id: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  content: string[];
  featured?: boolean;
}

export const plpkNewsArticles: PlpkNewsArticle[] = [
  {
    id: 'news-001',
    category: 'Kabar NU Care',
    date: '2026-07-28',
    title: 'Gerakan Koin NU Menguatkan Kepedulian dari Tingkat Ranting',
    excerpt: 'Kolaborasi Munfiq dan petugas lapangan terus memperluas manfaat program sosial di Kabupaten Garut.',
    content: [
      'Gerakan Koin NU tumbuh dari kebiasaan sederhana yang dilakukan secara konsisten oleh para Munfiq di setiap ranting.',
      'Hasil penghimpunan dikelola melalui proses pencatatan dan verifikasi berjenjang agar manfaatnya dapat dipertanggungjawabkan dan disalurkan tepat sasaran.',
    ],
    featured: true,
  },
  {
    id: 'news-002',
    category: 'Kegiatan',
    date: '2026-07-22',
    title: 'Pembinaan PLPK untuk Pelayanan Munfiq yang Lebih Baik',
    excerpt: 'PLPK mendapatkan penguatan mengenai komunikasi lapangan dan ketertiban pencatatan hasil kunjungan.',
    content: ['Pembinaan rutin menjadi ruang berbagi pengalaman bagi PLPK dalam melayani Munfiq.', 'Materi menekankan keramahan, ketepatan pencatatan, dan perlindungan data Munfiq.'],
  },
  {
    id: 'news-003',
    category: 'Pentasyarufan',
    date: '2026-07-16',
    title: 'Bantuan Pendidikan Disalurkan kepada Pelajar Dhuafa',
    excerpt: 'Program pendidikan membantu kebutuhan sekolah anak-anak dari keluarga penerima manfaat.',
    content: ['NU Care-LAZISNU Garut menyalurkan bantuan pendidikan melalui koordinasi pengurus wilayah.', 'Penyaluran dilakukan berdasarkan pendataan penerima manfaat dan laporan kegiatan.'],
  },
  {
    id: 'news-004',
    category: 'Informasi',
    date: '2026-07-09',
    title: 'Jadwal Layanan dan Koordinasi Penghimpunan Bulan Juli',
    excerpt: 'Informasi singkat untuk mendukung kelancaran penjemputan koin pada periode berjalan.',
    content: ['PLPK dapat berkoordinasi dengan Kordes bila menemukan kendala pada jadwal penjemputan.', 'Pastikan setiap hasil kunjungan tercatat sebelum periode dikonfirmasi selesai.'],
  },
];

export interface PlpkDistributionProgram {
  id: string;
  category: string;
  title: string;
  location: string;
  date: string;
  beneficiaries: number;
  amount: number;
  description: string;
}

export const plpkDistributionPrograms: PlpkDistributionProgram[] = [
  { id: 'distribution-001', category: 'Pendidikan', title: 'Beasiswa Pelajar Dhuafa', location: 'Kecamatan Cikajang', date: '2026-07-18', beneficiaries: 24, amount: 18000000, description: 'Dukungan biaya sekolah dan perlengkapan belajar bagi pelajar dari keluarga dhuafa.' },
  { id: 'distribution-002', category: 'Kesehatan', title: 'Layanan Kesehatan Warga', location: 'Garut Kota', date: '2026-07-11', beneficiaries: 85, amount: 12500000, description: 'Pemeriksaan kesehatan dasar dan dukungan obat untuk warga yang membutuhkan.' },
  { id: 'distribution-003', category: 'Ekonomi', title: 'Penguatan Usaha Mikro', location: 'Kecamatan Cilawu', date: '2026-06-27', beneficiaries: 12, amount: 24000000, description: 'Bantuan modal produktif dan pendampingan sederhana untuk usaha keluarga.' },
];

export const plpkNotifications = [
  { id: 'notification-001', title: 'Periode Juli masih berjalan', message: 'Selesaikan hasil kunjungan Munfiq yang tersisa sebelum melakukan konfirmasi.', time: '10 menit lalu', unread: true },
  { id: 'notification-002', title: 'Informasi dari Kordes', message: 'Koordinasi rutin ranting dilaksanakan Jumat pukul 19.30 WIB.', time: '2 jam lalu', unread: true },
  { id: 'notification-003', title: 'Berita terbaru tersedia', message: 'Pembinaan PLPK untuk pelayanan Munfiq yang lebih baik.', time: 'Kemarin', unread: true },
];
