'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { GorutMunfiqStatus } from '@/features/gorut-v2/types';
import { munfiqKecamatanOptions, munfiqPlpkOptions, munfiqUpzisOptions } from '@/features/gorut-v2/munfiq-options';

export type MunfiqFilters = { query: string; kecamatan: string; upzis: string; plpk: string; status: GorutMunfiqStatus | 'all' };
export const initialMunfiqFilters: MunfiqFilters = { query: '', kecamatan: 'all', upzis: 'all', plpk: 'all', status: 'all' };

export function MunfiqFilterBar({ filters, onChange, onReset }: { filters: MunfiqFilters; onChange: (filters: MunfiqFilters) => void; onReset: () => void }) {
  const active = [['Kecamatan', filters.kecamatan], ['UPZIS', filters.upzis], ['PLPK', filters.plpk], ['Status', filters.status]].filter(([, value]) => value !== 'all');
  const set = <K extends keyof MunfiqFilters>(key: K, value: MunfiqFilters[K]) => onChange({ ...filters, [key]: value });
  return <section className="gorut-munfiq-filter-card" aria-label="Filter data Munfiq"><label className="gorut-munfiq-search"><Search size={15} /><input value={filters.query} onChange={(event) => set('query', event.target.value)} placeholder="Cari nama, ID, nomor HP..." aria-label="Cari nama, ID, nomor HP, alamat, atau PLPK" /></label><div className="gorut-munfiq-selects"><FilterSelect label="Kecamatan" value={filters.kecamatan} options={munfiqKecamatanOptions} onChange={(value) => set('kecamatan', value)} /><FilterSelect label="UPZIS" value={filters.upzis} options={munfiqUpzisOptions} onChange={(value) => set('upzis', value)} /><FilterSelect label="PLPK" value={filters.plpk} options={munfiqPlpkOptions} onChange={(value) => set('plpk', value)} /><label><span className="sr-only">Status</span><select value={filters.status} onChange={(event) => set('status', event.target.value as MunfiqFilters['status'])}><option value="all">Semua Status</option><option value="active">Aktif</option><option value="inactive">Tidak Aktif</option><option value="unpaid">Belum Setor</option><option value="new">Baru</option></select></label></div><button type="button" className="gorut-munfiq-reset" onClick={onReset}><X size={13} />Reset Filter</button><button type="button" className="gorut-icon-button gorut-munfiq-advanced" aria-label="Filter lanjutan" title="Filter lanjutan"><SlidersHorizontal size={16} /></button>{active.length ? <div className="gorut-munfiq-filter-chips">{active.map(([label, value]) => <span key={label}>{label}: {value}</span>)}</div> : null}</section>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option, index) => <option key={option} value={index === 0 ? 'all' : option}>{option}</option>)}</select></label>; }
