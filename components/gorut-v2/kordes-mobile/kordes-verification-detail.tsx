'use client';

import { FileVerifiedIcon, MoneyBag02Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatKordesSubmissionAge } from '@/features/gorut-v2/kordes-mobile';
import { collectionVisitStatusLabels, formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from '../plpk-mobile/mobile-service-icon';
import { MobilePageHeader, MobileStatusBadge } from '../plpk-mobile/mobile-ui';

export function KordesVerificationDetail({ batch, onBack, onOpenF009, onContinue }: { batch: CollectionBatch; onBack: () => void; onOpenF009: () => void; onContinue: () => void }) {
  const [query, setQuery] = useState('');
  const visibleEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return batch.entries.filter((entry) => !needle || `${entry.canCode} ${entry.munfiqName} ${entry.address}`.toLowerCase().includes(needle));
  }, [batch.entries, query]);
  const progress = batch.activeCanCount ? Math.min(100, Math.round((batch.collectedCanCount / batch.activeCanCount) * 100)) : 0;
  const actionLabel = batch.status === 'waiting-kordes-verification' ? 'Mulai Verifikasi' : batch.status === 'verified-by-kordes' ? 'Lihat Hasil Verifikasi' : 'Lihat Catatan Koreksi';
  const submittedAt = batch.submittedToKordesAt ?? batch.createdAt;
  const submittedDate = new Date(submittedAt);
  const submittedLabel = Number.isNaN(submittedDate.getTime()) ? 'Waktu tidak tersedia' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(submittedDate);

  return (
    <section className="plpk-sheet kordes-operational-screen kordes-verification-detail" aria-label={`Detail penjemputan ${batch.plpkName}`}>
      <MobilePageHeader title="Detail Penjemputan" subtitle={formatPeriodLabel(batch.period)} onBack={onBack} action={<MobileStatusBadge status={batch.status} />} />
      <div className="plpk-scroll has-footer">
        <section className="kordes-detail-profile">
          <span className="kordes-detail-avatar" aria-hidden="true">{batch.plpkName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
          <div><strong>{batch.plpkName}</strong><span>{batch.plpkId}</span><small>{batch.village} · {formatPeriodLabel(batch.period)}</small></div>
          <p><b>{formatKordesSubmissionAge(submittedAt)}</b><span>{submittedLabel}</span></p>
        </section>

        <section className="kordes-detail-amount">
          <span><MobileServiceIcon icon={MoneyBag02Icon} label="Jumlah Bersih" size={21} /></span>
          <div><small>Jumlah Bersih Diterima</small><strong>{formatRupiah(batch.netAmount)}</strong></div>
          <dl><div><dt>Jumlah kotor</dt><dd>{formatRupiah(batch.grossAmount)}</dd></div><div><dt>Bisyaroh</dt><dd>− {formatRupiah(batch.totalPlpkFee)}</dd></div></dl>
        </section>

        <div className="kordes-detail-stats"><div><small>Munfiq Aktif</small><strong>{formatNumber(batch.activeCanCount)}</strong></div><div><small>Terjemput</small><strong>{formatNumber(batch.collectedCanCount)}</strong></div><div><small>Tidak Terjemput</small><strong>{formatNumber(batch.uncollectedCanCount)}</strong></div></div>

        <section className="kordes-detail-progress">
          <div><strong>{formatNumber(batch.collectedCanCount)} dari {formatNumber(batch.activeCanCount)} Munfiq terjemput</strong><span>{progress}%</span></div>
          <div className="plpk-progress-track" aria-label={`Progres penjemputan ${progress} persen`}><i style={{ width: `${progress}%` }} /></div>
        </section>

        <div className="plpk-section-head"><div><h2>Daftar Munfiq</h2><p>Data kunjungan bersifat read-only untuk Kordes.</p></div><span className="kordes-entry-count"><MobileServiceIcon icon={UserGroupIcon} label="Jumlah Munfiq" size={16} />{formatNumber(batch.entries.length)}</span></div>
        {batch.entries.length > 6 ? <div className="plpk-search kordes-entry-search"><Search size={17} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari Munfiq atau kode kaleng" aria-label="Cari Munfiq atau kode kaleng" /></div> : null}
        <div className="kordes-entry-list">
          {visibleEntries.map((entry) => <details key={entry.id} className="kordes-entry-row"><summary><span><b>{entry.canCode}</b><strong>{entry.munfiqName}</strong><small>{entry.address}</small></span><span><i className={`is-${entry.visitStatus}`}>{collectionVisitStatusLabels[entry.visitStatus]}</i><b>{entry.visitStatus === 'collected' ? formatRupiah(entry.amount) : 'Rp0'}</b></span><ChevronRight size={17} aria-hidden="true" /></summary><div><span>RT {entry.rt}/RW {entry.rw}</span><span>{entry.notes ?? 'Tidak ada catatan kunjungan.'}</span></div></details>)}
        </div>
      </div>
      <footer className="kordes-detail-actions"><button type="button" className="kordes-outline-button" onClick={onOpenF009}><MobileServiceIcon icon={FileVerifiedIcon} label="Lihat F.009" size={18} />Lihat F.009</button><button type="button" className="kordes-primary-button" onClick={onContinue}>{actionLabel}<ChevronRight size={17} aria-hidden="true" /></button></footer>
    </section>
  );
}
