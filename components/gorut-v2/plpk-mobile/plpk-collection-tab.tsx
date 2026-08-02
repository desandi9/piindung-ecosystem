'use client';

import { ClipboardCheck, Inbox, Lock, Search, SearchX } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import type { CollectionBatch, CollectionVisitStatus } from '@/features/gorut-v2/types';
import { formatNumber, formatPhoneNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { canConfirmCollection, collectionStatusLabels, collectionVisitStatusLabels, formatPeriodLabel, isBatchLocked, isEntryEditable } from '@/features/gorut-v2/pengambilan-options';

type FilterKey = 'all' | 'pending' | 'collected' | 'uncollected';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Belum Dikunjungi' },
  { key: 'collected', label: 'Terjemput' },
  { key: 'uncollected', label: 'Tidak Terjemput' },
];

function matchesFilter(status: CollectionVisitStatus, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return status === 'pending';
  if (filter === 'collected') return status === 'collected';
  return status !== 'pending' && status !== 'collected';
}

/** Daftar Munfiq wilayah PLPK — kartu, bukan tabel. */
export function PlpkCollectionTab({ batch, onOpenEntry, onReview }: { batch: CollectionBatch | null; onOpenEntry: (entryId: string) => void; onReview: () => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const deferredQuery = useDeferredValue(query);

  const visible = useMemo(() => {
    if (!batch) return [];
    const needle = deferredQuery.trim().toLowerCase();
    return batch.entries.filter((entry) => {
      const matchQuery = !needle
        || entry.munfiqName.toLowerCase().includes(needle)
        || entry.canCode.toLowerCase().includes(needle);
      return matchQuery && matchesFilter(entry.visitStatus, filter);
    });
  }, [batch, deferredQuery, filter]);

  if (!batch) {
    return (
      <>
        <header className="plpk-header is-plain">
          <div className="plpk-header-text"><strong>Penjemputan</strong><span>Tidak ada periode aktif</span></div>
        </header>
        <div className="plpk-scroll">
          <div className="plpk-card">
            <div className="plpk-empty">
              <Inbox size={30} aria-hidden="true" />
              <strong>Belum ada penjemputan aktif</strong>
              <p>Anda akan melihat daftar Munfiq di sini saat periode penjemputan dibuka.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const locked = isBatchLocked(batch);
  const readyToConfirm = canConfirmCollection(batch);
  const correctionMode = batch.status === 'needs-correction';

  return (
    <>
      <header className="plpk-header is-plain">
        <div className="plpk-header-text">
          <strong>Penjemputan</strong>
          <span>{formatPeriodLabel(batch.period)} · {batch.village}</span>
        </div>
        <span className={`plpk-badge is-${batch.status}`}>{collectionStatusLabels[batch.status]}</span>
      </header>

      <div className={locked ? 'plpk-scroll' : 'plpk-scroll has-footer'}>
        {locked ? (
          <div className="plpk-warning" style={{ marginBottom: 14 }}>
            <Lock size={16} aria-hidden="true" />
            <span>Data periode ini sudah dikunci setelah dikonfirmasi. Anda tidak dapat mengubah hasil kunjungan.</span>
          </div>
        ) : null}

        {correctionMode && batch.kordesNotes ? (
          <div className="plpk-callout" style={{ marginBottom: 14 }}>
            <ClipboardCheck size={16} aria-hidden="true" />
            <span>
              <strong>Catatan Kordes</strong>
              {batch.kordesNotes} Hanya Munfiq bertanda yang dapat Anda perbaiki.
            </span>
          </div>
        ) : null}

        <div className="plpk-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau kode kaleng"
            aria-label="Cari nama Munfiq atau kode kaleng"
            type="search"
          />
        </div>

        <div className="plpk-filters" role="group" aria-label="Filter status kunjungan">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'plpk-chip is-active' : 'plpk-chip'}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length ? (
          <div className="plpk-list">
            {visible.map((entry) => {
              const flagged = correctionMode && isEntryEditable(batch, entry.id);
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={flagged ? 'plpk-munfiq is-flagged' : 'plpk-munfiq'}
                  onClick={() => onOpenEntry(entry.id)}
                >
                  <div className="plpk-munfiq-top">
                    <div>
                      <span className="plpk-can-code">{entry.canCode}</span>
                      <span className="plpk-munfiq-name">{entry.munfiqName}</span>
                      <span className="plpk-munfiq-meta">
                        {entry.address}
                        <br />
                        RT {entry.rt}/RW {entry.rw} · {formatPhoneNumber(entry.phone)}
                      </span>
                    </div>
                    <span className={`plpk-badge is-${entry.visitStatus}`}>{collectionVisitStatusLabels[entry.visitStatus]}</span>
                  </div>
                  <div className="plpk-munfiq-foot">
                    <span className={entry.visitStatus === 'collected' ? 'plpk-munfiq-amount' : 'plpk-munfiq-amount is-empty'}>
                      {entry.visitStatus === 'collected' ? formatRupiah(entry.amount) : 'Tanpa nominal'}
                    </span>
                    {flagged ? <span className="plpk-badge is-needs-correction">Perlu Koreksi</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="plpk-card" style={{ marginTop: 12 }}>
            <div className="plpk-empty">
              <SearchX size={28} aria-hidden="true" />
              <strong>Tidak ada Munfiq yang cocok</strong>
              <p>Ubah kata kunci atau pilih filter lain.</p>
            </div>
          </div>
        )}
      </div>

      {!locked ? (
        <div className="plpk-footer">
          <button type="button" className="plpk-btn plpk-btn-primary" onClick={onReview}>
            <ClipboardCheck size={17} aria-hidden="true" />
            Periksa dan Konfirmasi
          </button>
          {!readyToConfirm ? (
            <p className="plpk-hint" style={{ textAlign: 'center' }}>
              {formatNumber(batch.pendingCount)} Munfiq belum dikunjungi
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
