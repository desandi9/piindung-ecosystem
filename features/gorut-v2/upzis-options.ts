import type { UpzisPlpkBreakdown, UpzisRecapStatus } from '@/features/gorut-v2/types';
import { PLPK_FEE_AMOUNT } from './pengambilan-options';

export const upzisStatusLabels: Record<UpzisRecapStatus, string> = {
  incomplete: 'Belum Lengkap',
  'ready-to-recap': 'Siap Direkap',
  recapped: 'Sudah Direkap',
  'waiting-minutes': 'Menunggu Berita Acara',
  'ready-to-deposit': 'Siap Disetor',
};

export const upzisPeriodOptions = ['Semua Periode', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03'];
export const upzisKecamatanOptions = ['Semua Kecamatan', 'Garut Kota', 'Tarogong Kidul', 'Karangpawitan', 'Cilawu'];
export const upzisKordesOptions = ['Semua Kordes', 'Ceng Rahmat', 'Nunung Fatimah', 'Encep Wahyudi', 'Popon Sumiati'];

/** Rekap dianggap sudah selesai direkap sejak status "recapped". */
export function isRecapDone(status: UpzisRecapStatus): boolean {
  return status === 'recapped' || status === 'waiting-minutes' || status === 'ready-to-deposit';
}

/** Rekap baru boleh dibuat kalau data PLPK-nya sudah lengkap. */
export function canCreateRecap(status: UpzisRecapStatus): boolean {
  return status === 'ready-to-recap';
}

/** Berita acara relevan setelah rekap selesai dan belum siap disetor. */
export function canPrepareMinutes(status: UpzisRecapStatus): boolean {
  return status === 'recapped' || status === 'waiting-minutes';
}

/** Jumlahkan rincian PLPK menjadi angka tingkat desa. */
export function summarizeBreakdown(breakdown: UpzisPlpkBreakdown[]) {
  return {
    plpkCount: breakdown.length,
    munfiqCount: breakdown.reduce((sum, item) => sum + item.munfiqCount, 0),
    totalCollected: breakdown.reduce((sum, item) => sum + item.totalCollected, 0),
    totalPlpkFee: breakdown.reduce((sum, item) => sum + item.totalPlpkFee, 0),
  };
}

export { PLPK_FEE_AMOUNT };
