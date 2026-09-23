import type { UpzisRecapStatus, UpzisVillageRecap } from '@/features/gorut-v2/types';

export type UpzisFilters = {
  query: string;
  period: string;
  kecamatan: string;
  village: string;
  kordes: string;
  status: UpzisRecapStatus | 'all';
};

export const initialUpzisFilters: UpzisFilters = {
  query: '',
  period: 'all',
  kecamatan: 'all',
  village: 'all',
  kordes: 'all',
  status: 'all',
};

export function filterUpzisRecaps(recaps: UpzisVillageRecap[], filters: UpzisFilters): UpzisVillageRecap[] {
  const query = filters.query.trim().toLowerCase();

  return recaps.filter((recap) => {
    const matchesQuery = !query
      || recap.village.toLowerCase().includes(query)
      || recap.kecamatan.toLowerCase().includes(query)
      || recap.kordesName.toLowerCase().includes(query);

    return matchesQuery
      && (filters.period === 'all' || recap.period === filters.period)
      && (filters.kecamatan === 'all' || recap.kecamatan === filters.kecamatan)
      && (filters.village === 'all' || recap.village === filters.village)
      && (filters.kordes === 'all' || recap.kordesName === filters.kordes)
      && (filters.status === 'all' || recap.status === filters.status);
  });
}

export function summarizeUpzisVerification(recaps: UpzisVillageRecap[], period: string) {
  const visible = recaps.filter((recap) => recap.period === period);

  return {
    incomplete: visible.filter((recap) => recap.status === 'incomplete').length,
    readyToRecap: visible.filter((recap) => recap.status === 'ready-to-recap').length,
    recapped: visible.filter((recap) => ['recapped', 'waiting-minutes', 'ready-to-deposit'].includes(recap.status)).length,
    netAmount: visible.reduce((sum, recap) => sum + recap.totalCollected - recap.totalPlpkFee, 0),
    rowCount: visible.length,
  };
}
