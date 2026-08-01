import type { CollectionBatch, CollectionEntry, CollectionStatus, CollectionVisitStatus } from '@/features/gorut-v2/types';

/** Ambang dan besaran upah PLPK — satu-satunya sumber kebenaran untuk seluruh modul. */
export const PLPK_FEE_THRESHOLD = 7000;
export const PLPK_FEE_AMOUNT = 2500;

export const collectionStatusLabels: Record<CollectionStatus, string> = {
  scheduled: 'Dijadwalkan',
  collecting: 'Sedang Diambil',
  collected: 'Selesai Diambil',
  'waiting-handover': 'Menunggu Serah Terima',
  'handed-to-kordes': 'Diserahkan ke Kordes',
  'handed-to-upzis': 'Diserahkan ke UPZIS',
};

export const collectionVisitStatusLabels: Record<CollectionVisitStatus, string> = {
  collected: 'Berhasil diambil',
  'not-around': 'Tidak ada di tempat',
  'not-ready': 'Belum tersedia',
  declined: 'Menolak / berhenti',
};

export const collectionPeriodOptions = ['Semua Periode', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03'];
export const collectionKecamatanOptions = ['Semua Kecamatan', 'Garut Kota', 'Tarogong Kidul', 'Karangpawitan', 'Cilawu'];
export const collectionVillageOptions = ['Semua Desa', 'Paminggir', 'Sukamentri', 'Ciwalen', 'Sukakarya', 'Haurpanggung', 'Mekargalih', 'Sindangpalay', 'Lebakjaya', 'Godog', 'Dawungsari', 'Sukamaju', 'Dayeuhmanggung'];
export const collectionPlpkOptions = ['Semua PLPK', 'Dede Rahmat', 'Asep Saepudin', 'Yana Suryana', 'Ujang Koswara', 'Nia Solihat', 'Rudi Firmansyah', 'Lilis Nuraeni', 'Tatang Sudrajat'];

/** amount > 7000 → berhak upah. Nominal 7000 atau kurang tidak berhak. */
export function isEligibleForPlpkFee(amount: number, visitStatus: CollectionVisitStatus = 'collected'): boolean {
  return visitStatus === 'collected' && amount > PLPK_FEE_THRESHOLD;
}

export function calculatePlpkFee(amount: number, visitStatus: CollectionVisitStatus = 'collected'): number {
  return isEligibleForPlpkFee(amount, visitStatus) ? PLPK_FEE_AMOUNT : 0;
}

/** Turunkan seluruh angka batch dari entri-entrinya, supaya total tidak pernah lepas sinkron. */
export function summarizeEntries(entries: CollectionEntry[]) {
  const collected = entries.filter((entry) => entry.visitStatus === 'collected');
  const eligible = entries.filter((entry) => entry.eligibleForPlpkFee);
  return {
    totalCollected: collected.reduce((sum, entry) => sum + entry.amount, 0),
    eligibleMunfiqCount: eligible.length,
    totalPlpkFee: eligible.length * PLPK_FEE_AMOUNT,
  };
}

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const index = Number(month) - 1;
  return names[index] ? `${names[index]} ${year}` : period;
}

/** Batch masih bisa disunting selama belum diserahterimakan. */
export function isBatchEditable(batch: CollectionBatch): boolean {
  return batch.status === 'scheduled' || batch.status === 'collecting';
}

export function isBatchHandedOver(batch: CollectionBatch): boolean {
  return batch.status === 'handed-to-kordes' || batch.status === 'handed-to-upzis';
}
