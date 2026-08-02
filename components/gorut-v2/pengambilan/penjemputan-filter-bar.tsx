'use client';

import { CalendarDays, Map, MapPinned, UserRound } from 'lucide-react';

import type { MonitoringFilters, MonitoringOptions } from '@/features/gorut-v2/penjemputan-monitoring';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

/**
 * Filter halaman monitoring: UPZIS (kecamatan), Ranting (desa), PLPK, Periode.
 */
export function PenjemputanFilterBar({
  filters,
  options,
  onChange,
}: {
  filters: MonitoringFilters;
  options: MonitoringOptions;
  onChange: (next: MonitoringFilters) => void;
}) {
  const set = <K extends keyof MonitoringFilters>(key: K, value: MonitoringFilters[K]) => onChange({ ...filters, [key]: value });

  return (
    <section className="pjm-filters" aria-label="Filter monitoring penjemputan">
      <div className="pjm-filter">
        <label className="pjm-filter-label" htmlFor="pjm-upzis"><MapPinned size={14} aria-hidden="true" />UPZIS</label>
        <select id="pjm-upzis" value={filters.upzis} onChange={(event) => set('upzis', event.target.value)}>
          {options.upzis.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>

      <div className="pjm-filter">
        <label className="pjm-filter-label" htmlFor="pjm-ranting"><Map size={14} aria-hidden="true" />Ranting</label>
        <select id="pjm-ranting" value={filters.ranting} onChange={(event) => set('ranting', event.target.value)}>
          {options.ranting.map((value) => <option key={value} value={value}>Desa {value}</option>)}
        </select>
      </div>

      <div className="pjm-filter">
        <label className="pjm-filter-label" htmlFor="pjm-plpk"><UserRound size={14} aria-hidden="true" />PLPK</label>
        <select id="pjm-plpk" value={filters.plpkId} onChange={(event) => set('plpkId', event.target.value)}>
          {options.plpk.map((item) => <option key={item.id} value={item.id}>{item.id} | {item.name}</option>)}
        </select>
      </div>

      <div className="pjm-filter">
        <label className="pjm-filter-label" htmlFor="pjm-period"><CalendarDays size={14} aria-hidden="true" />Periode</label>
        <select id="pjm-period" value={filters.period} onChange={(event) => set('period', event.target.value)}>
          {options.period.map((value) => <option key={value} value={value}>{formatPeriodLabel(value)}</option>)}
        </select>
      </div>
    </section>
  );
}
