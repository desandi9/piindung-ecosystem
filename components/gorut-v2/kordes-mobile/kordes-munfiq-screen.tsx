'use client';

import { UserMultipleIcon } from '@hugeicons/core-free-icons';
import { Phone, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatRupiah } from '@/features/gorut-v2/formatters';
import { buildKordesMunfiqDirectory } from '@/features/gorut-v2/kordes-mobile';
import { gorutMunfiqData } from '@/features/gorut-v2/munfiq-mock-data';
import type { CollectionBatch } from '@/features/gorut-v2/types';

import { MobileEmptyState, MobilePageHeader } from '../plpk-mobile/mobile-ui';

export function KordesMunfiqScreen({ batches, village, kecamatan, onBack }: { batches: CollectionBatch[]; village: string; kecamatan: string; onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'collected' | 'uncollected'>('all');
  const directory = useMemo(() => buildKordesMunfiqDirectory(batches, gorutMunfiqData, { village, kecamatan }), [batches, village, kecamatan]);
  const items = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return directory.filter((item) => {
      const matchesQuery = !needle || `${item.name} ${item.canCode} ${item.phone}`.toLowerCase().includes(needle);
      const matchesFilter = filter === 'all' || (filter === 'collected' ? item.lastVisitStatus === 'collected' : item.lastVisitStatus !== 'collected');
      return matchesQuery && matchesFilter;
    });
  }, [directory, filter, query]);

  return (
    <>
      <MobilePageHeader title="Munfiq Ranting" subtitle={`Desa ${village}, ${kecamatan}`} onBack={onBack} />
      <div className="plpk-scroll">
        <div className="plpk-search">
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau kode kaleng" aria-label="Cari nama atau kode kaleng" />
        </div>
        <div className="plpk-filters">
          {([['all','Semua'],['collected','Terjemput'],['uncollected','Belum terjemput']] as const).map(([key,label]) => (
            <button key={key} type="button" className={filter === key ? 'plpk-chip is-active' : 'plpk-chip'} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        {items.length ? (
          <div className="kordes-munfiq-list">
            {items.map((item) => (
              <article key={item.id}>
                <div><b>{item.canCode}</b><span>{item.lastVisitStatus === 'collected' ? 'Terjemput' : 'Belum terjemput'}</span></div>
                <h2>{item.name}</h2><p>{item.address}</p><small>PLPK: {item.plpkName}</small>
                <footer><strong>{item.lastAmount ? formatRupiah(item.lastAmount) : 'Belum ada nominal'}</strong><a href={`tel:${item.phone}`} aria-label={`Hubungi ${item.name}`}><Phone size={16} aria-hidden="true" />Hubungi</a></footer>
              </article>
            ))}
          </div>
        ) : <MobileEmptyState icon={UserMultipleIcon} title="Munfiq tidak ditemukan" description="Coba ubah pencarian atau filter." />}
      </div>
    </>
  );
}
