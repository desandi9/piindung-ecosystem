import type { CollectionBatch, CollectionEntry, CollectionStatus, CollectionVisitStatus } from './types';
import { calculatePlpkFee, isEligibleForPlpkFee, summarizeEntries } from './pengambilan-options';
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
  handoverDestination?: 'kordes' | 'upzis';
  createdAt: string;
  entries: EntrySeed[];
};

/** Nominal sengaja divariasikan di sekitar ambang Rp7.000 supaya kedua cabang formula upah terwakili. */
const seeds: BatchSeed[] = [
  { period: '2026-07', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Paminggir', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-07-04', entries: [[12000], [7000], [25000], [5000], [18000], [9500]] },
  { period: '2026-07', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Sukakarya', status: 'handed-to-kordes', handoverDestination: 'kordes', createdAt: '2026-07-05', entries: [[20000], [6500], [15000], [0, 'not-around'], [11000]] },
  { period: '2026-07', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Karangpawitan', village: 'Sindangpalay', status: 'waiting-handover', createdAt: '2026-07-06', entries: [[8500], [7000], [30000], [4000], [13500], [22000], [6000]] },
  { period: '2026-07', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dawungsari', status: 'collected', createdAt: '2026-07-08', entries: [[10000], [5500], [17500], [0, 'not-ready']] },
  { period: '2026-07', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Sukamentri', status: 'collecting', createdAt: '2026-07-12', entries: [[14000], [7000], [0, 'declined'], [26000]] },
  { period: '2026-07', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Haurpanggung', status: 'scheduled', createdAt: '2026-07-15', entries: [[0, 'not-ready'], [0, 'not-ready'], [0, 'not-ready']] },
  { period: '2026-06', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Ciwalen', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-06-03', entries: [[16000], [9000], [7000], [21000], [5000], [12500], [8000]] },
  { period: '2026-06', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Mekargalih', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-06-04', entries: [[11500], [6000], [19000], [7000]] },
  { period: '2026-06', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Karangpawitan', village: 'Lebakjaya', status: 'handed-to-kordes', handoverDestination: 'kordes', createdAt: '2026-06-06', entries: [[24000], [13000], [4500], [10500], [0, 'not-around'], [15500]] },
  { period: '2026-06', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Sukamaju', status: 'handed-to-kordes', handoverDestination: 'kordes', createdAt: '2026-06-09', entries: [[9000], [7000], [28000], [6500], [17000]] },
  { period: '2026-06', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Karangpawitan', village: 'Godog', status: 'collected', createdAt: '2026-06-14', entries: [[13000], [5000], [20500]] },
  { period: '2026-05', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Paminggir', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-05-05', entries: [[18500], [7000], [10000], [23000], [6000], [14500], [9500], [5500]] },
  { period: '2026-05', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Sukakarya', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-05-07', entries: [[12000], [8500], [0, 'declined'], [16500]] },
  { period: '2026-05', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dayeuhmanggung', status: 'handed-to-kordes', handoverDestination: 'kordes', createdAt: '2026-05-11', entries: [[7000], [7000], [11000], [25500], [4000]] },
  { period: '2026-04', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Garut Kota', village: 'Sukamentri', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-04-06', entries: [[15000], [6500], [19500], [8000], [7000]] },
  { period: '2026-04', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Karangpawitan', village: 'Sindangpalay', status: 'handed-to-kordes', handoverDestination: 'kordes', createdAt: '2026-04-08', entries: [[22500], [10000], [5000], [13500], [0, 'not-around'], [9000]] },
  { period: '2026-04', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Tarogong Kidul', village: 'Haurpanggung', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-04-13', entries: [[11000], [7000], [17000]] },
  { period: '2026-03', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dawungsari', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-03-09', entries: [[13000], [6000], [21500], [7000], [10500], [5000]] },
  // Desa berikut dikerjakan dua PLPK pada periode yang sama, supaya rekap UPZIS punya rincian lebih dari satu baris.
  { period: '2026-07', plpkId: 'PLPK-05', plpkName: 'Nia Solihat', kecamatan: 'Garut Kota', village: 'Paminggir', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-07-09', entries: [[9500], [7000], [16000], [5500]] },
  { period: '2026-06', plpkId: 'PLPK-06', plpkName: 'Rudi Firmansyah', kecamatan: 'Garut Kota', village: 'Ciwalen', status: 'handed-to-upzis', handoverDestination: 'upzis', createdAt: '2026-06-11', entries: [[12000], [6500], [19000]] },
  { period: '2026-07', plpkId: 'PLPK-07', plpkName: 'Lilis Nuraeni', kecamatan: 'Karangpawitan', village: 'Sindangpalay', status: 'waiting-handover', createdAt: '2026-07-10', entries: [[8000], [7000], [14500], [4500]] },
  { period: '2026-05', plpkId: 'PLPK-08', plpkName: 'Tatang Sudrajat', kecamatan: 'Cilawu', village: 'Dayeuhmanggung', status: 'handed-to-kordes', handoverDestination: 'kordes', createdAt: '2026-05-13', entries: [[10000], [6000], [23000]] },
];

/** Ambil Munfiq nyata dari mock master supaya nama, ID, dan HP konsisten antar halaman. */
function pickMunfiq(kecamatan: string, offset: number) {
  const inArea = gorutMunfiqData.filter((munfiq) => munfiq.kecamatan === kecamatan);
  const pool = inArea.length ? inArea : gorutMunfiqData;
  return pool[offset % pool.length];
}

export const gorutCollectionBatches: CollectionBatch[] = seeds.map((seed, seedIndex) => {
  const batchNumber = String(seedIndex + 1).padStart(3, '0');

  const entries: CollectionEntry[] = seed.entries.map(([amount, visitStatus = 'collected'], entryIndex) => {
    const munfiq = pickMunfiq(seed.kecamatan, seedIndex * 3 + entryIndex);
    const effectiveAmount = visitStatus === 'collected' ? amount : 0;
    return {
      id: `entry-${batchNumber}-${String(entryIndex + 1).padStart(2, '0')}`,
      munfiqId: munfiq.id,
      munfiqName: munfiq.name,
      memberId: munfiq.memberId,
      phone: munfiq.phone,
      amount: effectiveAmount,
      visitStatus,
      collectedAt: seed.createdAt,
      eligibleForPlpkFee: isEligibleForPlpkFee(effectiveAmount, visitStatus),
      plpkFee: calculatePlpkFee(effectiveAmount, visitStatus),
      notes: visitStatus === 'not-around' ? 'Rumah kosong, dijadwalkan ulang bulan depan.' : visitStatus === 'declined' ? 'Munfiq menyatakan berhenti sementara.' : undefined,
    };
  });

  return {
    id: `batch-${batchNumber}`,
    period: seed.period,
    plpkId: seed.plpkId,
    plpkName: seed.plpkName,
    village: seed.village,
    kecamatan: seed.kecamatan,
    entries,
    ...summarizeEntries(entries),
    status: seed.status,
    handoverDestination: seed.handoverDestination,
    createdAt: seed.createdAt,
  };
});

export const currentCollectionPeriod = '2026-07';
