'use client';

import { Search, X } from 'lucide-react';

import type { CollectionStatus } from '@/features/gorut-v2/types';
import { collectionKecamatanOptions, collectionPeriodOptions, collectionPlpkOptions, collectionStatusLabels, collectionVillageOptions, formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

export type CollectionFilters = { query: string; period: string; kecamatan: string; village: string; plpk: string; status: CollectionStatus | 'all' };
export const initialCollectionFilters: CollectionFilters = { query: '', period: 'all', kecamatan: 'all', village: 'all', plpk: 'all', status: 'all' };

export function PengambilanFilterBar({ filters, onChange, onReset }: { filters: CollectionFilters; onChange: (filters: CollectionFilters) => void; onReset: () => void }) {
  const set = <K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => onChange({ ...filters, [key]: value });

  return (
    <section className="gorut-collect-filter" aria-label="Filter penghimpunan koin">
      <label className="gorut-collect-search">
        <Search size={15} />
        <input value={filters.query} onChange={(event) => set('query', event.target.value)} placeholder="Cari PLPK, desa, atau periode..." aria-label="Cari PLPK, desa, kecamatan, atau periode" />
      </label>

      <div className="gorut-collect-selects">
        <label>
          <span className="sr-only">Periode</span>
          <select value={filters.period} onChange={(event) => set('period', event.target.value)}>
            {collectionPeriodOptions.map((option, index) => <option key={option} value={index === 0 ? 'all' : option}>{index === 0 ? option : formatPeriodLabel(option)}</option>)}
          </select>
        </label>
        <FilterSelect label="Kecamatan" value={filters.kecamatan} options={collectionKecamatanOptions} onChange={(value) => set('kecamatan', value)} />
        <FilterSelect label="Desa" value={filters.village} options={collectionVillageOptions} onChange={(value) => set('village', value)} />
        <FilterSelect label="PLPK" value={filters.plpk} options={collectionPlpkOptions} onChange={(value) => set('plpk', value)} />
        <label>
          <span className="sr-only">Status</span>
          <select value={filters.status} onChange={(event) => set('status', event.target.value as CollectionFilters['status'])}>
            <option value="all">Semua Status</option>
            {(Object.keys(collectionStatusLabels) as CollectionStatus[]).map((status) => <option key={status} value={status}>{collectionStatusLabels[status]}</option>)}
          </select>
        </label>
      </div>

      <button type="button" className="gorut-collect-reset" onClick={onReset}><X size={13} />Reset Filter</button>
    </section>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option, index) => <option key={option} value={index === 0 ? 'all' : option}>{option}</option>)}</select></label>;
}
