'use client';

import { RotateCcw, Search, X } from 'lucide-react';
import type { GorutMunfiq, GorutMunfiqStatus } from '@/features/gorut-v2/types';
import { munfiqStatusLabels } from '@/features/gorut-v2/munfiq-options';

export type MunfiqFilters = { query: string; kecamatan: string; village: string; plpk: string; status: GorutMunfiqStatus | 'all' };
export const initialMunfiqFilters: MunfiqFilters = { query: '', kecamatan: 'all', village: 'all', plpk: 'all', status: 'all' };

type FilterOption = { value: string; label: string };

export function MunfiqFilterBar({ filters, items, resultCount, onChange, onReset }: { filters: MunfiqFilters; items: GorutMunfiq[]; resultCount: number; onChange: (filters: MunfiqFilters) => void; onReset: () => void }) {
  const kecamatanOptions = uniqueOptions(items.map((item) => item.kecamatan));
  const villageItems = filters.kecamatan === 'all' ? items : items.filter((item) => item.kecamatan === filters.kecamatan);
  const villageOptions = uniqueOptions(villageItems.map((item) => item.village));
  const plpkItems = villageItems.filter((item) => filters.village === 'all' || item.village === filters.village);
  const plpkOptions = Array.from(new Map(plpkItems.map((item) => [item.plpkId, item.plpkName])).entries()).map(([value, label]) => ({ value, label }));
  const activeChips = [
    filters.query ? { key: 'query', label: `Pencarian: ${filters.query}` } : null,
    filters.kecamatan !== 'all' ? { key: 'kecamatan', label: filters.kecamatan } : null,
    filters.village !== 'all' ? { key: 'village', label: filters.village } : null,
    filters.plpk !== 'all' ? { key: 'plpk', label: plpkOptions.find((option) => option.value === filters.plpk)?.label ?? filters.plpk } : null,
    filters.status !== 'all' ? { key: 'status', label: munfiqStatusLabels[filters.status] } : null,
  ].filter((chip): chip is { key: keyof MunfiqFilters; label: string } => Boolean(chip));

  const removeFilter = (key: keyof MunfiqFilters) => {
    if (key === 'kecamatan') return onChange({ ...filters, kecamatan: 'all', village: 'all', plpk: 'all' });
    if (key === 'village') return onChange({ ...filters, village: 'all', plpk: 'all' });
    if (key === 'query') return onChange({ ...filters, query: '' });
    if (key === 'plpk') return onChange({ ...filters, plpk: 'all' });
    onChange({ ...filters, status: 'all' });
  };

  return (
    <section className="gorut-operation-filters gorut-munfiq-filters" aria-labelledby="gorut-munfiq-filter-title">
      <header>
        <div><h2 id="gorut-munfiq-filter-title">Filter Data</h2><p>Persempit direktori berdasarkan wilayah dan penanggung jawab.</p></div>
        <button type="button" onClick={onReset} disabled={!activeChips.length}><RotateCcw size={14} aria-hidden="true" />Reset</button>
      </header>
      <div className="gorut-munfiq-filter-card">
        <label className="gorut-munfiq-search"><Search size={16} aria-hidden="true" /><input value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} placeholder="Cari nama, nomor kaleng, atau nomor HP..." aria-label="Cari nama, nomor kaleng, nomor HP, alamat, atau PLPK" /></label>
        <div className="gorut-munfiq-selects">
          <FilterSelect label="Kecamatan / UPZIS" value={filters.kecamatan} placeholder="Semua Kecamatan / UPZIS" options={kecamatanOptions} onChange={(value) => onChange({ ...filters, kecamatan: value, village: 'all', plpk: 'all' })} />
          <FilterSelect label="Desa / Ranting" value={filters.village} placeholder="Semua Desa / Ranting" options={villageOptions} onChange={(value) => onChange({ ...filters, village: value, plpk: 'all' })} disabled={filters.kecamatan === 'all'} />
          <FilterSelect label="PLPK" value={filters.plpk} placeholder="Semua PLPK" options={plpkOptions} onChange={(value) => onChange({ ...filters, plpk: value })} disabled={filters.village === 'all'} />
          <label className="gorut-munfiq-filter-field"><span>Status</span><select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as MunfiqFilters['status'] })}><option value="all">Semua Status</option><option value="active">Aktif</option><option value="new">Baru</option><option value="unpaid">Belum Setor</option><option value="inactive">Tidak Aktif</option></select></label>
        </div>
      </div>
      <footer>
        <p aria-live="polite">Menampilkan <strong>{resultCount}</strong> dari <strong>{items.length}</strong> Munfiq</p>
        {activeChips.length ? <div className="gorut-munfiq-active-filters"><span>Filter aktif:</span><div>{activeChips.map((chip) => <button type="button" key={chip.key} onClick={() => removeFilter(chip.key)}>{chip.label}<X size={12} aria-hidden="true" /></button>)}</div></div> : <span>Belum ada filter aktif</span>}
      </footer>
    </section>
  );
}

function uniqueOptions(values: string[]): FilterOption[] { return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'id-ID')).map((value) => ({ value, label: value })); }

function FilterSelect({ label, value, placeholder, options, onChange, disabled = false }: { label: string; value: string; placeholder: string; options: FilterOption[]; onChange: (value: string) => void; disabled?: boolean }) { return <label className="gorut-munfiq-filter-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}><option value="all">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
