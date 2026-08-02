import type { CollectionBatch, CollectionEntry, CollectionStatus, CollectionVisitStatus } from './types';
import { calculatePlpkFee, documentStatusForBatch, isEligibleForPlpkFee, summarizeEntries } from './pengambilan-options';
import { gorutMunfiqData } from './munfiq-mock-data';

/** [nominal, statusKunjungan?] — nominal 0 dipakai untuk kunjungan yang tidak menghasilkan koin. */
type EntrySeed = [number, CollectionVisitStatus?];

type BatchSeed = {
  period: string;
  plpkId: string;
  plpkName: string;
  kecamatan: string;
  village: string;
  status: CollectionStatus;
  createdAt: string;
  entries: EntrySeed[];
  /** Diisi hanya untuk batch berstatus needs-correction. */
  kordesNotes?: string;
  /** Indeks entri (0-based) yang ditandai Kordes untuk dikoreksi. */
  correctionIndexes?: number[];
};

/** Nominal sengaja divariasikan di sekitar ambang Rp7.000 supaya kedua cabang formula upah terwakili. */
const seeds: BatchSeed[] = [
  { period: '2026-07', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Paminggir', status: 'verified-by-kordes', createdAt: '2026-07-04', entries: [[12000], [7000], [25000], [5000], [18000], [9500]] },
  { period: '2026-07', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Sukakarya', status: 'verified-by-kordes', createdAt: '2026-07-05', entries: [[20000], [6500], [15000], [0, 'not-around'], [11000]] },
  { period: '2026-07', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Karangpawitan', village: 'Sindangpalay', status: 'waiting-kordes-verification', createdAt: '2026-07-06', entries: [[8500], [7000], [30000], [4000], [13500], [22000], [6000]] },
  { period: '2026-07', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dawungsari', status: 'collection-completed', createdAt: '2026-07-08', entries: [[10000], [5500], [17500], [0, 'not-ready']] },
  /** Batch kerja aktif aplikasi mobile PLPK-01: sebagian Munfiq sengaja masih pending. */
  { period: '2026-07', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Sukamentri', status: 'collecting', createdAt: '2026-07-12', entries: [[14000], [7000], [0, 'declined'], [26000], [0, 'pending'], [0, 'pending'], [0, 'pending'], [0, 'pending']] },
  { period: '2026-07', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Haurpanggung', status: 'scheduled', createdAt: '2026-07-15', entries: [[0, 'pending'], [0, 'pending'], [0, 'pending']] },
  { period: '2026-06', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Ciwalen', status: 'verified-by-kordes', createdAt: '2026-06-03', entries: [[16000], [9000], [7000], [21000], [5000], [12500], [8000]] },
  { period: '2026-06', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Mekargalih', status: 'verified-by-kordes', createdAt: '2026-06-04', entries: [[11500], [6000], [19000], [7000]] },
  { period: '2026-06', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Karangpawitan', village: 'Lebakjaya', status: 'verified-by-kordes', createdAt: '2026-06-06', entries: [[24000], [13000], [4500], [10500], [0, 'not-around'], [15500]] },
  { period: '2026-06', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Sukamaju', status: 'verified-by-kordes', createdAt: '2026-06-09', entries: [[9000], [7000], [28000], [6500], [17000]] },
  { period: '2026-06', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Karangpawitan', village: 'Godog', status: 'collection-completed', createdAt: '2026-06-14', entries: [[13000], [5000], [20500]] },
  { period: '2026-05', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Paminggir', status: 'verified-by-kordes', createdAt: '2026-05-05', entries: [[18500], [7000], [10000], [23000], [6000], [14500], [9500], [5500]] },
  { period: '2026-05', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Sukakarya', status: 'verified-by-kordes', createdAt: '2026-05-07', entries: [[12000], [8500], [0, 'declined'], [16500]] },
  { period: '2026-05', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dayeuhmanggung', status: 'verified-by-kordes', createdAt: '2026-05-11', entries: [[7000], [7000], [11000], [25500], [4000]] },
  { period: '2026-04', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Sukamentri', status: 'verified-by-kordes', createdAt: '2026-04-06', entries: [[15000], [6500], [19500], [8000], [7000]] },
  { period: '2026-04', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Karangpawitan', village: 'Sindangpalay', status: 'verified-by-kordes', createdAt: '2026-04-08', entries: [[22500], [10000], [5000], [13500], [0, 'not-around'], [9000]] },
  { period: '2026-04', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Haurpanggung', status: 'verified-by-kordes', createdAt: '2026-04-13', entries: [[11000], [7000], [17000]] },
  { period: '2026-03', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dawungsari', status: 'verified-by-kordes', createdAt: '2026-03-09', entries: [[13000], [6000], [21500], [7000], [10500], [5000]] },
  { period: '2026-07', plpkId: 'PLPK-05', plpkName: 'Nia Solihat', kecamatan: 'Garut Kota', village: 'Paminggir', status: 'verified-by-kordes', createdAt: '2026-07-09', entries: [[9500], [7000], [16000], [5500]] },
  { period: '2026-06', plpkId: 'PLPK-06', plpkName: 'Rudi Firmansyah', kecamatan: 'Garut Kota', village: 'Ciwalen', status: 'verified-by-kordes', createdAt: '2026-06-11', entries: [[12000], [6500], [19000]] },
  { period: '2026-07', plpkId: 'PLPK-07', plpkName: 'Lilis Nuraeni', kecamatan: 'Karangpawitan', village: 'Sindangpalay', status: 'waiting-kordes-verification', createdAt: '2026-07-10', entries: [[8000], [7000], [14500], [4500]] },
  { period: '2026-05', plpkId: 'PLPK-08', plpkName: 'Tatang Sudrajat', kecamatan: 'Cilawu', village: 'Dayeuhmanggung', status: 'verified-by-kordes', createdAt: '2026-05-13', entries: [[10000], [6000], [23000]] },
  /** Batch PLPK-01 yang dikembalikan Kordes — dipakai menguji alur Perlu Koreksi di mobile. */
  {
    period: '2026-06',
    plpkId: 'PLPK-01',
    plpkName: 'Dede Rahmat',
    kecamatan: 'Garut Kota',
    village: 'Regol',
    status: 'needs-correction',
    createdAt: '2026-06-18',
    entries: [[11000], [6500], [0, 'not-around'], [15000]],
    kordesNotes: 'Nominal Munfiq pertama tidak sesuai hitungan uang fisik. Mohon dicek ulang dan catatan kunjungan yang tidak ada di tempat dilengkapi.',
    correctionIndexes: [0, 2],
  },
];

/**
 * Ambil Munfiq nyata dari mock master supaya nama, ID, dan HP konsisten antar halaman.
 *
 * Satu Munfiq hanya boleh muncul sekali dalam satu batch — kalau tidak, kode kaleng
 * dan nama akan terduplikasi di daftar PLPK. Jumlah Munfiq per kecamatan lebih kecil
 * dari jumlah entri batch terbesar, jadi kekurangannya diambil dari kecamatan lain.
 */
function buildBatchMunfiq(kecamatan: string, count: number, rotation: number) {
  const inArea = gorutMunfiqData.filter((munfiq) => munfiq.kecamatan === kecamatan);
  const outside = gorutMunfiqData.filter((munfiq) => munfiq.kecamatan !== kecamatan);
  /** Rotasi supaya batch berbeda di kecamatan yang sama tidak selalu memakai urutan identik. */
  const rotated = inArea.length ? inArea.map((_, index) => inArea[(index + rotation) % inArea.length]) : [];
  const ordered = [...rotated, ...outside];
  return Array.from({ length: count }, (_, index) => ordered[index % ordered.length]);
}

export const gorutCollectionBatches: CollectionBatch[] = seeds.map((seed, seedIndex) => {
  const batchNumber = String(seedIndex + 1).padStart(3, '0');
  const batchMunfiq = buildBatchMunfiq(seed.kecamatan, seed.entries.length, seedIndex);

  const entries: CollectionEntry[] = seed.entries.map(([amount, visitStatus = 'collected'], entryIndex) => {
    const munfiq = batchMunfiq[entryIndex];
    const effectiveAmount = visitStatus === 'collected' ? amount : 0;
    const sequence = String(entryIndex + 1).padStart(2, '0');
    return {
      id: `entry-${batchNumber}-${sequence}`,
      munfiqId: munfiq.id,
      munfiqName: munfiq.name,
      memberId: munfiq.memberId,
      /** Kode kaleng melekat pada Munfiq, jadi tetap sama antar periode. */
      canCode: `KLG-${munfiq.memberId.replace('GOR-MQ-', '')}`,
      phone: munfiq.phone,
      address: munfiq.address,
      rt: String(((entryIndex % 6) + 1)).padStart(2, '0'),
      rw: String(((entryIndex % 3) + 1)).padStart(2, '0'),
      isActive: munfiq.status === 'active' || munfiq.status === 'new' || munfiq.status === 'unpaid',
      canCount: 1,
      amount: effectiveAmount,
      visitStatus,
      collectedAt: visitStatus === 'pending' ? '' : seed.createdAt,
      eligibleForPlpkFee: isEligibleForPlpkFee(effectiveAmount, visitStatus),
      plpkFee: calculatePlpkFee(effectiveAmount, visitStatus),
      notes: visitStatus === 'not-around' ? 'Rumah kosong, dijadwalkan ulang bulan depan.' : visitStatus === 'declined' ? 'Munfiq menyatakan berhenti sementara.' : undefined,
    };
  });

  const locked = seed.status === 'waiting-kordes-verification' || seed.status === 'verified-by-kordes';
  const submitted = locked || seed.status === 'needs-correction';

  return {
    id: `batch-${batchNumber}`,
    period: seed.period,
    plpkId: seed.plpkId,
    plpkName: seed.plpkName,
    village: seed.village,
    kecamatan: seed.kecamatan,
    kordesName: `Kordes ${seed.village}`,
    entries,
    ...summarizeEntries(entries),
    formCode: 'F.009',
    documentNumber: `F009/GORUT/${seed.plpkId}/VIII/2026/${batchNumber}`,
    documentStatus: documentStatusForBatch(seed.status),
    status: seed.status,
    confirmedByPlpkAt: seed.status !== 'draft' && seed.status !== 'scheduled' && seed.status !== 'collecting' ? seed.createdAt : undefined,
    lockedAt: locked ? seed.createdAt : undefined,
    f009DocumentNumber: submitted ? `F009/GORUT/${seed.plpkId}/VIII/2026/${batchNumber}` : undefined,
    submittedToKordesAt: submitted ? seed.createdAt : undefined,
    verifiedByKordesAt: seed.status === 'verified-by-kordes' ? seed.createdAt : undefined,
    verifiedByKordesName: seed.status === 'verified-by-kordes' ? `Kordes ${seed.village}` : undefined,
    kordesNotes: seed.kordesNotes,
    correctionEntryIds: seed.correctionIndexes?.map((index) => entries[index]?.id).filter((id): id is string => Boolean(id)),
    createdAt: seed.createdAt,
  };
});

export const currentCollectionPeriod = '2026-07';
