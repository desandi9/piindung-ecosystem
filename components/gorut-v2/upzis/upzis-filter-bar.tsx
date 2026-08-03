'use client';

import { CalendarDays, ListFilter, Map, MapPinned, X } from 'lucide-react';

import type { UpzisRecapStatus } from '@/features/gorut-v2/types';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { upzisKecamatanOptions, upzisPeriodOptions, upzisStatusLabels } from '@/features/gorut-v2/upzis-options';
import { upzisVillageOptions } from '@/features/gorut-v2/upzis-mock-data';
import type { UpzisFilters } from './upzis-view';

export function UpzisFilterBar({ filters, onChange, onReset }: { filters: UpzisFilters; onChange: (filters: UpzisFilters) => void; onReset: () => void }) {
  const set = <K extends keyof UpzisFilters>(key: K, value: UpzisFilters[K]) => onChange({ ...filters, [key]: value });
  const activeFilters = [filters.query ? 'query' : 'all', filters.period, filters.kecamatan, filters.village, filters.kordes, filters.status].filter((value) => value !== 'all').length;

  return (
    <section className="pjm-filters upzis-verification-filters" aria-label="Filter verifikasi UPZIS">
      <div className="pjm-filter">
        <label className="pjm-filter-label" htmlFor="upzis-verification-period"><CalendarDays size={14} aria-hidden="true" />Periode</label>
        <select id="upzis-verification-period" value={filters.period} onChange={(event) => set('period', event.target.value)}>
          {upzisPeriodOptions.map((option, index) => <option key={option} value={index === 0 ? 'all' : option}>{index === 0 ? option : formatPeriodLabel(option)}</option>)}
        </select>
      </div>

      <FilterSelect id="upzis-verification-kecamatan" icon={MapPinned} label="Kecamatan / UPZIS" value={filters.kecamatan} options={upzisKecamatanOptions} onChange={(value) => set('kecamatan', value)} prefix="UPZIS " />
      <FilterSelect id="upzis-verification-village" icon={Map} label="Desa / Ranting" value={filters.village} options={upzisVillageOptions} onChange={(value) => set('village', value)} prefix="Desa " />

      <div className="pjm-filter">
        <label className="pjm-filter-label" htmlFor="upzis-verification-status"><ListFilter size={14} aria-hidden="true" />Status</label>
        <select id="upzis-verification-status" value={filters.status} onChange={(event) => set('status', event.target.value as UpzisFilters['status'])}>
          <option value="all">Semua Status</option>
          {(Object.keys(upzisStatusLabels) as UpzisRecapStatus[]).map((status) => <option key={status} value={status}>{upzisStatusLabels[status]}</option>)}
        </select>
      </div>

      <div className="upzis-verification-filter-footer">
        <span>{activeFilters ? `${activeFilters} filter aktif` : 'Menampilkan seluruh kondisi rekap yang tersedia'}</span>
        <button type="button" className="gorut-collect-reset" onClick={onReset}><X size={13} />Reset Filter</button>
      </div>
    </section>
  );
}

function FilterSelect({ id, icon: Icon, label, value, options, onChange, prefix }: { id: string; icon: typeof Map; label: string; value: string; options: string[]; onChange: (value: string) => void; prefix: string }) {
  return <div className="pjm-filter"><label className="pjm-filter-label" htmlFor={id}><Icon size={14} aria-hidden="true" />{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option, index) => <option key={option} value={index === 0 ? 'all' : option}>{index === 0 ? option : `${prefix}${option}`}</option>)}</select></div>;
}
