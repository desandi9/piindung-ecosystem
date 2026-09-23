import type { GorutMunfiq, GorutMunfiqStatus } from '@/features/gorut-v2/types';

export const munfiqStatusLabels: Record<GorutMunfiqStatus, string> = { active: 'Aktif', inactive: 'Tidak Aktif', unpaid: 'Belum Setor', new: 'Baru' };

export const munfiqKecamatanOptions = ['Semua Kecamatan', 'Garut Kota', 'Tarogong Kidul', 'Karangpawitan', 'Cilawu'];
export const munfiqUpzisOptions = ['Semua UPZIS', 'UPZIS Masjid Agung', 'UPZIS Sukagalih', 'UPZIS Jayaraga', 'UPZIS Margawati'];
export const munfiqPlpkOptions = ['Semua PLPK', 'PLPK-01', 'PLPK-02', 'PLPK-03', 'PLPK-04'];

export function calculateMunfiqAverageMonthly(munfiq: GorutMunfiq): number {
  const months = Math.max(1, Math.ceil((Date.now() - new Date(munfiq.joinedAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
  return Math.round(munfiq.totalCollected / months);
}
