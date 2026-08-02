import type { CollectionBatch, KordesVerification, KordesVillageRecap } from './types';
import { getCollectionSnapshot } from './collection-store';

const eligibleStatuses: CollectionBatch['status'][] = ['waiting-kordes-verification', 'verified-by-kordes', 'needs-correction'];

/** Identitas Kordes aktif untuk prototipe mobile; cakupan wajib desa + kecamatan. */
export const activeKordesProfile = {
  kordesId: 'KORDES-03',
  name: 'Cecep Suhendar',
  phone: '081234500103',
  village: 'Sindangpalay',
  kecamatan: 'Karangpawitan',
  upzis: 'UPZIS Karangpawitan',
  accountStatus: 'Aktif',
} as const;

type VerificationSeed = Pick<KordesVerification, 'status' | 'moneyMatches' | 'hasDamagedMoney' | 'cashReceived' | 'notes' | 'verifiedAt' | 'returnedForCorrectionAt' | 'verifiedByKordesName'>;

const verificationSeeds: Record<string, VerificationSeed> = {
  'batch-001': { status: 'verified-by-kordes', moneyMatches: true, hasDamagedMoney: false, cashReceived: true, notes: 'Data dan uang sesuai.', verifiedAt: '2026-07-10', verifiedByKordesName: 'Kordes Paminggir' },
  'batch-002': { status: 'verified-by-kordes', moneyMatches: true, hasDamagedMoney: false, cashReceived: true, notes: 'Data dan uang sesuai.', verifiedAt: '2026-07-11', verifiedByKordesName: 'Kordes Sukakarya' },
  'batch-003': { status: 'waiting-kordes-verification' },
  'batch-019': { status: 'verified-by-kordes', moneyMatches: true, hasDamagedMoney: false, cashReceived: true, notes: 'F.009 lengkap dan uang diterima.', verifiedAt: '2026-07-10', verifiedByKordesName: 'Kordes Paminggir' },
};

export function validateKordesDecision(input: { moneyMatches?: boolean; hasDamagedMoney?: boolean; cashReceived?: boolean; notes?: string }) {
  if (input.moneyMatches === undefined || input.hasDamagedMoney === undefined || input.cashReceived === undefined) return false;
  if (!input.cashReceived) return false;
  if ((!input.moneyMatches || input.hasDamagedMoney) && !input.notes?.trim()) return false;
  return true;
}

function fallbackSeed(index: number, batch: CollectionBatch): VerificationSeed {
  if (batch.status === 'waiting-kordes-verification') return { status: 'waiting-kordes-verification' };
  if (batch.status === 'needs-correction') return { status: 'needs-correction', moneyMatches: false, hasDamagedMoney: false, cashReceived: true, notes: 'Perlu koreksi nominal.', returnedForCorrectionAt: batch.returnedForCorrectionAt ?? batch.submittedToKordesAt ?? batch.createdAt, verifiedByKordesName: batch.verifiedByKordesName ?? batch.kordesName };
  return { status: 'verified-by-kordes', moneyMatches: true, hasDamagedMoney: index % 5 === 0, cashReceived: true, notes: index % 5 === 0 ? 'Ada uang rusak, sudah dicatat.' : 'Data sesuai.', verifiedAt: batch.verifiedByKordesAt ?? batch.submittedToKordesAt ?? batch.createdAt, verifiedByKordesName: batch.verifiedByKordesName ?? batch.kordesName };
}

/**
 * Turunkan antrean verifikasi dari batch efektif, bukan dari konstanta modul.
 * Dengan begitu penjemputan yang baru dikonfirmasi PLPK di aplikasi mobile
 * langsung muncul di halaman Verifikasi Kordes tanpa perubahan API.
 */
export function buildKordesVerifications(batches: CollectionBatch[] = getCollectionSnapshot()): KordesVerification[] {
  return batches
    .filter((batch) => eligibleStatuses.includes(batch.status))
    .map((batch, index) => {
      /** Batch hasil konfirmasi mobile belum punya seed, jadi masuk sebagai menunggu verifikasi. */
      const seed = batch.status === 'waiting-kordes-verification'
        ? { status: 'waiting-kordes-verification' as const }
        : verificationSeeds[batch.id] ?? fallbackSeed(index, batch);
      return {
        id: `kordes-${batch.id}`,
        batchId: batch.id,
        f009DocumentNumber: batch.f009DocumentNumber ?? batch.documentNumber,
        plpkId: batch.plpkId,
        plpkName: batch.plpkName,
        period: batch.period,
        kecamatan: batch.kecamatan,
        village: batch.village,
        kordesName: batch.kordesName,
        grossAmount: batch.grossAmount,
        totalPlpkFee: batch.totalPlpkFee,
        netAmount: batch.netAmount,
        status: batch.status as KordesVerification['status'],
        f015Status: 'not-ready',
        moneyMatches: batch.kordesMoneyMatches ?? seed.moneyMatches,
        hasDamagedMoney: batch.kordesHasDamagedMoney ?? seed.hasDamagedMoney,
        cashReceived: batch.kordesCashReceived ?? seed.cashReceived,
        notes: batch.kordesNotes ?? seed.notes,
        correctionEntryIds: batch.correctionEntryIds,
        verifiedAt: batch.verifiedByKordesAt ?? seed.verifiedAt,
        returnedForCorrectionAt: batch.returnedForCorrectionAt ?? seed.returnedForCorrectionAt,
        verifiedByKordesName: batch.verifiedByKordesName ?? seed.verifiedByKordesName,
      };
    });
}

export const kordesVerifications: KordesVerification[] = buildKordesVerifications();

export function createVillageRecaps(verifications: KordesVerification[]): KordesVillageRecap[] {
  const groups = new Map<string, KordesVerification[]>();
  for (const item of verifications) {
    const key = `${item.period}|${item.kecamatan}|${item.village}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return Array.from(groups.entries()).map(([key, rows], index) => {
    const [period, kecamatan, village] = key.split('|');
    const allReady = rows.every((row) => row.status === 'verified-by-kordes');
    const code = village.toUpperCase().replace(/\s+/g, '');
    return {
      id: `recap-${period}-${kecamatan}-${village}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      period,
      kecamatan,
      village,
      kordesName: rows[0]?.kordesName ?? `Kordes ${village}`,
      upzisOfficerName: `Admin UPZIS ${kecamatan}`,
      f015Number: `BA/GORUT/F015/${code}/VIII/2026/${String(index + 1).padStart(3, '0')}`,
      handoverDate: '2026-08-01',
      plpkRows: rows,
      f015Status: allReady ? (index % 3 === 0 ? 'waiting-upzis-handover' : 'f015-ready') : 'waiting-plpk-completion',
      handedToUpzisAt: undefined,
    };
  });
}

export function summarizeVillageRecap(recap: KordesVillageRecap) {
  return recap.plpkRows.reduce((total, row) => ({
    plpkCount: total.plpkCount + 1,
    activeCanCount: total.activeCanCount + getBatch(row.batchId).activeCanCount,
    collectedCanCount: total.collectedCanCount + getBatch(row.batchId).collectedCanCount,
    uncollectedCanCount: total.uncollectedCanCount + getBatch(row.batchId).uncollectedCanCount,
    grossAmount: total.grossAmount + row.grossAmount,
    totalPlpkFee: total.totalPlpkFee + row.totalPlpkFee,
    netAmount: total.netAmount + row.netAmount,
  }), { plpkCount: 0, activeCanCount: 0, collectedCanCount: 0, uncollectedCanCount: 0, grossAmount: 0, totalPlpkFee: 0, netAmount: 0 });
}

export function getBatch(batchId: string) {
  const batch = getCollectionSnapshot().find((item) => item.id === batchId);
  if (!batch) throw new Error(`Batch tidak ditemukan: ${batchId}`);
  return batch;
}

export function isF015Ready(recap: KordesVillageRecap) {
  return recap.plpkRows.every((row) => row.status === 'verified-by-kordes');
}
