import type { CollectionBatch, CollectionEntry, CollectionStatus, CollectionVisitOutcome, CollectionVisitStatus } from '@/features/gorut-v2/types';

/** Ambang dan besaran upah PLPK — satu-satunya sumber kebenaran untuk seluruh modul. */
export const PLPK_FEE_THRESHOLD = 7000;
export const PLPK_FEE_AMOUNT = 2500;

/** Pilihan nominal cepat di form mobile PLPK. */
export const quickAmountOptions = [5000, 10000, 20000, 50000];

export const collectionStatusLabels: Record<CollectionStatus, string> = {
  draft: 'Draft',
  scheduled: 'Dijadwalkan',
  collecting: 'Dalam Penjemputan',
  'collection-completed': 'Penjemputan Selesai',
  'waiting-kordes-verification': 'Menunggu Verifikasi Kordes',
  'verified-by-kordes': 'Terverifikasi Kordes',
  'needs-correction': 'Perlu Koreksi',
};

export const collectionVisitStatusLabels: Record<CollectionVisitStatus, string> = {
  pending: 'Belum Dikunjungi',
  collected: 'Terjemput',
  'not-around': 'Tidak ada di tempat',
  'not-ready': 'Belum tersedia',
  declined: 'Menolak/Berhenti',
  'damaged-lost': 'Kaleng rusak/hilang',
};

/** Urutan pilihan hasil kunjungan di form mobile. "pending" sengaja tidak ikut. */
export const collectionVisitOutcomes: CollectionVisitOutcome[] = ['collected', 'not-around', 'not-ready', 'declined', 'damaged-lost'];

export const collectionPeriodOptions = ['Semua Periode', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03'];
export const collectionKecamatanOptions = ['Semua Kecamatan', 'Garut Kota', 'Tarogong Kidul', 'Karangpawitan', 'Cilawu'];
export const collectionVillageOptions = ['Semua Desa', 'Paminggir', 'Sukamentri', 'Ciwalen', 'Sukakarya', 'Haurpanggung', 'Mekargalih', 'Sindangpalay', 'Lebakjaya', 'Godog', 'Dawungsari', 'Sukamaju', 'Dayeuhmanggung'];
export const collectionPlpkOptions = ['Semua PLPK', 'Dede Rahmat', 'Asep Saepudin', 'Yana Suryana', 'Ujang Koswara', 'Nia Solihat', 'Rudi Firmansyah', 'Lilis Nuraeni', 'Tatang Sudrajat'];

/** amount > 7000 → berhak upah. Nominal 7000 atau kurang tidak berhak. */
export function isEligibleForPlpkFee(amount: number, visitStatus: CollectionVisitStatus = 'collected'): boolean {
  return visitStatus === 'collected' && amount > PLPK_FEE_THRESHOLD;
}

/** Hanya status Terjemput yang boleh menyimpan nominal. Sisanya dipaksa 0. */
export function normalizeAmount(amount: number, visitStatus: CollectionVisitStatus): number {
  return visitStatus === 'collected' ? Math.max(0, Math.round(amount)) : 0;
}

/** Status selain Terjemput wajib punya catatan. */
export function requiresNotes(visitStatus: CollectionVisitStatus): boolean {
  return visitStatus !== 'pending' && visitStatus !== 'collected';
}

/** Ambil angka dari input bebas ("Rp10.000", "10 000"). null bila kosong/bukan angka. */
export function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateNetAmount(grossAmount: number, totalPlpkFee: number): number {
  return grossAmount - totalPlpkFee;
}

export function calculatePlpkFee(amount: number, visitStatus: CollectionVisitStatus = 'collected'): number {
  return isEligibleForPlpkFee(amount, visitStatus) ? PLPK_FEE_AMOUNT : 0;
}

/** Turunkan seluruh angka batch dari entri-entrinya, supaya total tidak pernah lepas sinkron. */
export function summarizeEntries(entries: CollectionEntry[]) {
  const cans = (entry: CollectionEntry) => entry.canCount ?? 1;
  const activeCanCount = entries.reduce((sum, entry) => sum + cans(entry), 0);
  const collected = entries.filter((entry) => entry.visitStatus === 'collected');
  const pending = entries.filter((entry) => entry.visitStatus === 'pending');
  /** Tidak terjemput = sudah dikunjungi tapi tidak menghasilkan koin. Belum dikunjungi tidak dihitung di sini. */
  const uncollected = entries.filter((entry) => entry.visitStatus !== 'collected' && entry.visitStatus !== 'pending');
  const eligible = entries.filter((entry) => isEligibleForPlpkFee(entry.amount, entry.visitStatus));
  const grossAmount = collected.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPlpkFee = eligible.reduce((sum, entry) => sum + calculatePlpkFee(entry.amount, entry.visitStatus), 0);
  return {
    activeCanCount,
    visitedCount: entries.length - pending.length,
    pendingCount: pending.length,
    collectedCanCount: collected.reduce((sum, entry) => sum + cans(entry), 0),
    uncollectedCanCount: uncollected.reduce((sum, entry) => sum + cans(entry), 0),
    grossAmount,
    totalCollected: grossAmount,
    eligibleMunfiqCount: eligible.length,
    totalPlpkFee,
    netAmount: calculateNetAmount(grossAmount, totalPlpkFee),
  };
}

/** Progres penjemputan dalam persen, dihitung dari Munfiq yang sudah dikunjungi. */
export function collectionProgress(batch: Pick<CollectionBatch, 'entries' | 'visitedCount'>): number {
  if (!batch.entries.length) return 0;
  return Math.round((batch.visitedCount / batch.entries.length) * 100);
}

export function documentStatusForBatch(status: CollectionStatus): 'Draft' | 'Siap' {
  return status === 'waiting-kordes-verification' || status === 'verified-by-kordes' || status === 'needs-correction' ? 'Siap' : 'Draft';
}

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const index = Number(month) - 1;
  return names[index] ? `${names[index]} ${year}` : period;
}

export function isBatchEditable(batch: CollectionBatch): boolean {
  if (batch.status === 'needs-correction') return true;
  return !batch.lockedAt && (batch.status === 'draft' || batch.status === 'scheduled' || batch.status === 'collecting' || batch.status === 'collection-completed');
}

/** Entri yang masih boleh diubah PLPK. Saat Perlu Koreksi hanya entri bertanda Kordes. */
export function isEntryEditable(batch: CollectionBatch, entryId: string): boolean {
  if (!isBatchEditable(batch)) return false;
  if (batch.status !== 'needs-correction') return true;
  return (batch.correctionEntryIds ?? []).includes(entryId);
}

/** Daftar Munfiq yang datanya belum lengkap — dipakai layar Review sebelum konfirmasi. */
export function incompleteEntries(batch: CollectionBatch): CollectionEntry[] {
  return batch.entries.filter((entry) => entry.visitStatus === 'pending' || (requiresNotes(entry.visitStatus) && !entry.notes?.trim()));
}

/**
 * Konfirmasi hanya boleh dilakukan bila seluruh Munfiq sudah punya hasil kunjungan.
 * Batch yang sudah dikunci tidak bisa dikonfirmasi ulang.
 */
export function canConfirmCollection(batch: CollectionBatch): boolean {
  if (!isBatchEditable(batch)) return false;
  if (batch.status === 'needs-correction') return incompleteEntries(batch).length === 0;
  if (batch.lockedAt) return false;
  if (!batch.entries.length) return false;
  return incompleteEntries(batch).length === 0;
}

/** Batch terkunci = read-only di seluruh aplikasi. */
export function isBatchLocked(batch: CollectionBatch): boolean {
  return Boolean(batch.lockedAt) && batch.status !== 'needs-correction';
}

/** Transisi tunggal dari review PLPK ke antrean Kordes, termasuk pengiriman ulang koreksi. */
export function submitPlpkBatch(
  batch: CollectionBatch,
  submittedAt = new Date().toISOString(),
): { batch?: CollectionBatch; error?: string } {
  if (!isBatchEditable(batch)) return { error: 'Data penjemputan sudah dikunci.' };
  if (!batch.entries.length) return { error: 'Periode penjemputan belum memiliki Munfiq.' };
  if (incompleteEntries(batch).length) {
    return { error: 'Lengkapi seluruh hasil kunjungan dan catatan sebelum konfirmasi.' };
  }
  if (batch.entries.some((entry) => entry.visitStatus === 'collected' && (!Number.isFinite(entry.amount) || entry.amount <= 0))) {
    return { error: 'Nominal Terjemput harus lebih dari Rp0.' };
  }

  const entries = batch.entries.map((entry) => {
    const amount = normalizeAmount(entry.amount, entry.visitStatus);
    return {
      ...entry,
      amount,
      eligibleForPlpkFee: isEligibleForPlpkFee(amount, entry.visitStatus),
      plpkFee: calculatePlpkFee(amount, entry.visitStatus),
    };
  });

  return {
    batch: {
      ...batch,
      entries,
      ...summarizeEntries(entries),
      status: 'waiting-kordes-verification',
      documentStatus: 'Siap',
      confirmedByPlpkAt: submittedAt,
      lockedAt: submittedAt,
      f009DocumentNumber: batch.f009DocumentNumber ?? batch.documentNumber,
      submittedToKordesAt: submittedAt,
      verifiedByKordesAt: undefined,
      verifiedByKordesName: undefined,
      returnedForCorrectionAt: undefined,
      kordesNotes: undefined,
      correctionEntryIds: undefined,
      kordesMoneyMatches: undefined,
      kordesHasDamagedMoney: undefined,
      kordesCashReceived: undefined,
    },
  };
}
