'use client';

import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { ChevronRight, Filter, Phone, Search, X } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import { formatPhoneNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import {
  buildPlpkMunfiqDirectory,
  filterPlpkMunfiqDirectory,
  type PlpkMunfiqDirectoryItem,
  type PlpkMunfiqFilter,
} from '@/features/gorut-v2/plpk-mobile-content';
import { collectionVisitStatusLabels } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch, PlpkProfile } from '@/features/gorut-v2/types';

import { MobileEmptyState, MobilePageHeader } from './mobile-ui';

const filters: { key: PlpkMunfiqFilter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Kaleng Aktif' },
  { key: 'pending', label: 'Belum Dikunjungi' },
  { key: 'collected', label: 'Terjemput' },
  { key: 'uncollected', label: 'Tidak Terjemput' },
];

export function PlpkMunfiqScreen({ profile, batches, activeBatch, onBack, onOpenCollection }: { profile: PlpkProfile; batches: CollectionBatch[]; activeBatch: CollectionBatch | null; onBack: () => void; onOpenCollection: (entryId: string) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PlpkMunfiqFilter>('all');
  const [detail, setDetail] = useState<PlpkMunfiqDirectoryItem | null>(null);
  const deferredQuery = useDeferredValue(query);
  const directory = useMemo(() => buildPlpkMunfiqDirectory(batches, profile.plpkId, profile.village, activeBatch?.id), [activeBatch?.id, batches, profile.plpkId, profile.village]);
  const visible = useMemo(() => filterPlpkMunfiqDirectory(directory, deferredQuery, filter), [deferredQuery, directory, filter]);

  return (
    <>
      <MobilePageHeader title="Munfiq" subtitle={`Wilayah Desa ${profile.village}`} onBack={onBack} />
      <div className="plpk-scroll">
        <div className="plpk-search">
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau kode kaleng" aria-label="Cari nama atau kode kaleng" type="search" />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian"><X size={17} aria-hidden="true" /></button> : null}
        </div>
        <label className="plpk-filter-field is-inline">
          <span><Filter size={16} aria-hidden="true" />Status</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as PlpkMunfiqFilter)} aria-label="Filter status Munfiq">
            {filters.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>

        {visible.length ? (
          <div className="plpk-directory-list">
            {visible.map((item) => (
              <article key={item.id} className="plpk-directory-card">
                <div className="plpk-directory-head">
                  <div><span className="plpk-can-code">{item.canCode}</span><h2>{item.name}</h2></div>
                  <span className={item.isActive ? 'plpk-badge is-verified-by-kordes' : 'plpk-badge is-not-ready'}>{item.isActive ? 'Kaleng Aktif' : 'Nonaktif'}</span>
                </div>
                <p>{item.address}<br />RT {item.rt}/RW {item.rw} · {formatPhoneNumber(item.phone)}</p>
                <div className="plpk-directory-last">
                  <span><small>Terakhir</small>{collectionVisitStatusLabels[item.lastVisitStatus]}</span>
                  <strong>{item.lastVisitStatus === 'collected' ? formatRupiah(item.lastAmount) : 'Tanpa nominal'}</strong>
                </div>
                <div className="plpk-directory-actions">
                  <a href={`tel:${item.phone.replace(/\D/g, '')}`} aria-label={`Hubungi ${item.name}`}><Phone size={17} aria-hidden="true" />Hubungi</a>
                  <button type="button" onClick={() => setDetail(item)}>Lihat Detail<ChevronRight size={17} aria-hidden="true" /></button>
                </div>
                {item.activeEntryId ? <button type="button" className="plpk-btn plpk-btn-secondary" onClick={() => onOpenCollection(item.activeEntryId!)}>Buka Penjemputan</button> : null}
              </article>
            ))}
          </div>
        ) : <MobileEmptyState icon={UserGroupIcon} title="Munfiq tidak ditemukan" description="Ubah kata kunci atau filter untuk melihat data lain." />}
      </div>

      {detail ? (
        <div className="plpk-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
          <section className="plpk-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="munfiq-detail-title">
            <div className="plpk-sheet-handle" aria-hidden="true" />
            <button type="button" className="plpk-sheet-close" onClick={() => setDetail(null)} aria-label="Tutup detail"><X size={21} /></button>
            <span className="plpk-can-code">{detail.canCode}</span>
            <h2 id="munfiq-detail-title">{detail.name}</h2>
            <dl className="plpk-profile-rows">
              <div><dt>Alamat</dt><dd>{detail.address}</dd></div>
              <div><dt>RT/RW</dt><dd>{detail.rt}/{detail.rw}</dd></div>
              <div><dt>Nomor HP</dt><dd>{formatPhoneNumber(detail.phone)}</dd></div>
              <div><dt>Status kaleng</dt><dd>{detail.isActive ? 'Aktif' : 'Nonaktif'}</dd></div>
              <div><dt>Penjemputan terakhir</dt><dd>{collectionVisitStatusLabels[detail.lastVisitStatus]}</dd></div>
            </dl>
          </section>
        </div>
      ) : null}
    </>
  );
}
