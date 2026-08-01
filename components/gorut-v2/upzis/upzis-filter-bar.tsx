'use client';

import { Search, X } from 'lucide-react';

import type { UpzisRecapStatus } from '@/features/gorut-v2/types';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { upzisKecamatanOptions, upzisKordesOptions, upzisPeriodOptions, upzisStatusLabels } from '@/features/gorut-v2/upzis-options';
import { upzisVillageOptions } from '@/features/gorut-v2/upzis-mock-data';

export type UpzisFilters = { query: string; period: string; kecamatan: string; village: string; kordes: string; status: UpzisRecapStatus | 'all' };
export const initialUpzisFilters: UpzisFilters = { query: '', period: 'all', kecamatan: 'all', village: 'all', kordes: 'all', status: 'all' };

export function UpzisFilterBar({ filters, onChange, onReset }: { filters: UpzisFilters; onChange: (filters: UpzisFilters) => void; onReset: () => void }) {
  const set = <K extends keyof UpzisFilters>(key: K, value: UpzisFilters[K]) => onChange({ ...filters, [key]: value });

  return (
    <section className="gorut-collect-filter" aria-label="Filter rekap UPZIS">
      <label className="gorut-collect-search">
        <Search size={15} />
        <input value={filters.query} onChange={(event) => set('query', event.target.value)} placeholder="Cari desa, Kordes, atau PLPK..." aria-label="Cari desa, kecamatan, Kordes, atau PLPK" />
      </label>

      <div className="gorut-collect-selects">
        <label>
          <span className="sr-only">Periode</span>
          <select value={filters.period} onChange={(event) => set('period', event.target.value)}>
            {upzisPeriodOptions.map((option, index) => <option key={option} value={index === 0 ? 'all' : option}>{index === 0 ? option : formatPeriodLabel(option)}</option>)}
          </select>
        </label>
        <FilterSelect label="Kecamatan" value={filters.kecamatan} options={upzisKecamatanOptions} onChange={(value) => set('kecamatan', value)} />
        <FilterSelect label="Desa" value={filters.village} options={upzisVillageOptions} onChange={(value) => set('village', value)} />
        <FilterSelect label="Kordes" value={filters.kordes} options={upzisKordesOptions} onChange={(value) => set('kordes', value)} />
        <label>
          <span className="sr-only">Status</span>
          <select value={filters.status} onChange={(event) => set('status', event.target.value as UpzisFilters['status'])}>
            <option value="all">Semua Status</option>
            {(Object.keys(upzisStatusLabels) as UpzisRecapStatus[]).map((status) => <option key={status} value={status}>{upzisStatusLabels[status]}</option>)}
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
