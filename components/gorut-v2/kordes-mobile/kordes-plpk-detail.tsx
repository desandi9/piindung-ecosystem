'use client';

import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatRupiah } from '@/features/gorut-v2/formatters';
import type { CollectionBatch } from '@/features/gorut-v2/types';

import { MobileEmptyState, MobilePageHeader, MobileStatusBadge } from '../plpk-mobile/mobile-ui';

export function KordesPlpkDetail({ batches, onBack, onOpen }: { batches: CollectionBatch[]; onBack: () => void; onOpen: (batch: CollectionBatch) => void }) {
  const [query, setQuery] = useState('');
  const latest = useMemo(() => {
    const map = new Map<string, CollectionBatch>();
    for (const batch of [...batches].sort((a, b) => b.period.localeCompare(a.period))) {
      if (!map.has(batch.plpkId)) map.set(batch.plpkId, batch);
    }
    const needle = query.trim().toLowerCase();
    return [...map.values()].filter((batch) => `${batch.plpkName} ${batch.plpkId}`.toLowerCase().includes(needle));
  }, [batches, query]);

  return (
    <>
      <MobilePageHeader title="PLPK Binaan" subtitle={`${latest.length} petugas dalam satu ranting`} onBack={onBack} />
      <div className="plpk-scroll">
        <div className="plpk-search">
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau ID PLPK" aria-label="Cari nama atau ID PLPK" />
        </div>
        {latest.length ? (
          <div className="kordes-plpk-list">
            {latest.map((batch) => (
              <button key={batch.plpkId} type="button" onClick={() => onOpen(batch)}>
                <span className="kordes-plpk-avatar" aria-hidden="true">{batch.plpkName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span><strong>{batch.plpkName}</strong><small>{batch.plpkId} · {batch.activeCanCount} Munfiq</small><b>{formatRupiah(batch.grossAmount)}</b></span>
                <MobileStatusBadge status={batch.status} />
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : <MobileEmptyState icon={UserGroupIcon} title="PLPK tidak ditemukan" description="Tidak ada PLPK yang cocok dengan pencarian." />}
      </div>
    </>
  );
}
