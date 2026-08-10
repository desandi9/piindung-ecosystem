'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import type { GorutMunfiqStatus } from '@/features/gorut-v2/types';
import { munfiqKecamatanOptions, munfiqPlpkOptions, munfiqUpzisOptions } from '@/features/gorut-v2/munfiq-options';

export type MunfiqFilters = { query: string; kecamatan: string; upzis: string; plpk: string; status: GorutMunfiqStatus | 'all' };
export const initialMunfiqFilters: MunfiqFilters = { query: '', kecamatan: 'all', upzis: 'all', plpk: 'all', status: 'all' };

export function MunfiqFilterBar({ filters, onChange }: { filters: MunfiqFilters; onChange: (filters: MunfiqFilters) => void }) {
  const set = <K extends keyof MunfiqFilters>(key: K, value: MunfiqFilters[K]) => onChange({ ...filters, [key]: value });
  return <div className="gorut-munfiq-filter-card"><label className="gorut-munfiq-search"><Search size={15} /><input value={filters.query} onChange={(event) => set('query', event.target.value)} placeholder="Cari nama, ID, nomor HP..." aria-label="Cari nama, ID, nomor HP, alamat, atau PLPK" /></label><div className="gorut-munfiq-selects"><FilterSelect label="Kecamatan" value={filters.kecamatan} options={munfiqKecamatanOptions} onChange={(value) => set('kecamatan', value)} /><FilterSelect label="UPZIS" value={filters.upzis} options={munfiqUpzisOptions} onChange={(value) => set('upzis', value)} /><FilterSelect label="PLPK" value={filters.plpk} options={munfiqPlpkOptions} onChange={(value) => set('plpk', value)} /><label><span className="sr-only">Status</span><select value={filters.status} onChange={(event) => set('status', event.target.value as MunfiqFilters['status'])}><option value="all">Semua Status</option><option value="active">Aktif</option><option value="inactive">Tidak Aktif</option><option value="unpaid">Belum Setor</option><option value="new">Baru</option></select></label></div><button type="button" className="gorut-icon-button gorut-munfiq-advanced" aria-label="Filter lanjutan belum tersedia" title="Filter lanjutan belum tersedia" disabled><SlidersHorizontal size={16} /></button></div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option, index) => <option key={option} value={index === 0 ? 'all' : option}>{option}</option>)}</select></label>; }
