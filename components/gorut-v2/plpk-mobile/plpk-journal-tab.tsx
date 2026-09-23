'use client';

import { Coins01Icon, FileVerifiedIcon, HandCoinsIcon, Notebook01Icon, PackageOpenIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { ChevronRight, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { collectionBlockingReasonLabel, collectionHasAction, collectionMoneyLabel, isServerCollectionBatch } from '@/features/gorut-v2/collection-api-view-model';
import { buildPlpkJournal } from '@/features/gorut-v2/plpk-mobile-content';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch } from '@/features/gorut-v2/types';

import { MobilePageHeader, MobileStatusBadge } from './mobile-ui';
import { MobileServiceIcon } from './mobile-service-icon';

export function PlpkJournalTab({ batches, onFixCorrection, onOpenF009 }: { batches: CollectionBatch[]; onFixCorrection: (batchId: string) => void; onOpenF009: (batchId: string) => void }) {
  const journal = useMemo(() => buildPlpkJournal(batches), [batches]);
  const periods = useMemo(() => Array.from(new Set(journal.map((item) => item.period))), [journal]);
  const [period, setPeriod] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(journal[0]?.batchId ?? null);
  const visible = period === 'all' ? journal : journal.filter((item) => item.period === period);

  return (
    <>
      <MobilePageHeader title="Jurnal PLPK" subtitle="Riwayat penjemputan dan verifikasi" />
      <div className="plpk-scroll">
        <label className="plpk-filter-field">
          <span><Filter size={16} aria-hidden="true" />Filter periode</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Filter periode jurnal">
            <option value="all">Semua periode</option>
            {periods.map((item) => <option key={item} value={item}>{formatPeriodLabel(item)}</option>)}
          </select>
        </label>

        <div className="plpk-journal-list">
          {visible.map((item) => {
            const expanded = item.batchId === expandedId;
            const source = batches.find((batch) => batch.id === item.batchId);
            return (
              <article key={item.batchId} className="plpk-journal-card">
                <div className="plpk-journal-head">
                  <div><span>Periode penjemputan</span><h2>{formatPeriodLabel(item.period)}</h2></div>
                  <MobileStatusBadge status={item.status} />
                </div>
                <div className="plpk-journal-amount">
                  <span><MobileServiceIcon icon={Coins01Icon} label="Jumlah kotor" size={19} /></span>
                  <div><small>Jumlah kotor</small><strong>{source ? collectionMoneyLabel(source, 'grossAmount') : formatRupiah(item.grossAmount)}</strong></div>
                </div>
                <div className="plpk-journal-stats">
                  <div><MobileServiceIcon icon={UserGroupIcon} label="Munfiq aktif" size={18} /><small>Aktif</small><strong>{formatNumber(item.activeMunfiq)}</strong></div>
                  <div><MobileServiceIcon icon={HandCoinsIcon} label="Terjemput" size={18} /><small>Terjemput</small><strong>{formatNumber(item.collected)}</strong></div>
                  <div><MobileServiceIcon icon={PackageOpenIcon} label="Tidak terjemput" size={18} /><small>Tidak terjemput</small><strong>{formatNumber(item.uncollected)}</strong></div>
                </div>
                {expanded ? (
                  <dl className="plpk-journal-details">
                    <div><dt>Jumlah kotor</dt><dd>{source ? collectionMoneyLabel(source, 'grossAmount') : formatRupiah(item.grossAmount)}</dd></div>
                    <div><dt>Bisyaroh PLPK</dt><dd>{source ? collectionMoneyLabel(source, 'totalPlpkFee') : formatRupiah(item.plpkFee)}</dd></div>
                    <div className="is-total"><dt>Jumlah bersih</dt><dd>{source ? collectionMoneyLabel(source, 'netAmount') : formatRupiah(item.netAmount)}</dd></div>
                    {source && isServerCollectionBatch(source) ? <div><dt>Revisi server</dt><dd>{source.canonical.identity.revision} · versi {source.canonical.version}</dd></div> : null}
                  </dl>
                ) : null}
                {source?.status === 'needs-correction' ? <div className="plpk-callout"><span><strong>Koreksi Kordes</strong>{source.kordesNotes ?? 'Perbaiki hanya Munfiq yang ditandai server.'}</span></div> : null}
                {source && isServerCollectionBatch(source) && source.canonical.blockingReasons.length ? <p className="plpk-hint">{source.canonical.blockingReasons.map(collectionBlockingReasonLabel).join(' ')}</p> : null}
                <button type="button" className="plpk-card-action" onClick={() => setExpandedId(expanded ? null : item.batchId)}>
                  <MobileServiceIcon icon={Notebook01Icon} label="Ringkasan jurnal" size={18} />
                  {expanded ? 'Tutup Ringkasan' : 'Lihat Ringkasan'}
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
                {['waiting-kordes-verification', 'verified-by-kordes', 'needs-correction'].includes(item.status) ? (
                  <button type="button" className="plpk-card-action" onClick={() => onOpenF009(item.batchId)}>
                    <MobileServiceIcon icon={FileVerifiedIcon} label="Dokumen F.009" size={18} />
                    Preview &amp; Simpan F.009
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                ) : null}
                {item.status === 'needs-correction' && (source ? collectionHasAction(source, 'RECORD_ENTRY') !== false : true) ? (
                  <button type="button" className="plpk-btn plpk-btn-secondary" onClick={() => onFixCorrection(item.batchId)}>Perbaiki Data</button>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
