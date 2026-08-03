'use client';

import { Alert02Icon, CheckmarkCircle02Icon, ClipboardCheckIcon, MoneyBag02Icon, Search01Icon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatDateShort, formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatKordesSubmissionAge } from '@/features/gorut-v2/kordes-mobile';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch, CollectionStatus } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from '../plpk-mobile/mobile-service-icon';
import { MobileEmptyState, MobilePageHeader, MobileStatusBadge } from '../plpk-mobile/mobile-ui';

type FilterKey = 'all' | 'waiting-kordes-verification' | 'verified-by-kordes' | 'needs-correction';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'waiting-kordes-verification', label: 'Menunggu' },
  { key: 'verified-by-kordes', label: 'Terverifikasi' },
  { key: 'needs-correction', label: 'Koreksi' },
];

export function KordesVerificationTab({
  batches,
  period,
  onOpen,
  onOpenF009,
  onOpenJournal,
}: {
  batches: CollectionBatch[];
  period: string;
  onOpen: (batch: CollectionBatch) => void;
  onOpenF009: (batch: CollectionBatch) => void;
  onOpenJournal: () => void;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const counts = useMemo(() => ({
    waiting: batches.filter((batch) => batch.status === 'waiting-kordes-verification').length,
    verified: batches.filter((batch) => batch.status === 'verified-by-kordes').length,
    correction: batches.filter((batch) => batch.status === 'needs-correction').length,
    gross: batches.reduce((total, batch) => total + batch.grossAmount, 0),
  }), [batches]);
  const filterCounts: Record<FilterKey, number> = {
    all: batches.length,
    'waiting-kordes-verification': counts.waiting,
    'verified-by-kordes': counts.verified,
    'needs-correction': counts.correction,
  };
  const visible = useMemo(() => batches
    .filter((batch) => {
      const matchesFilter = filter === 'all' || batch.status === filter;
      const needle = query.trim().toLowerCase();
      return matchesFilter && (!needle || `${batch.plpkName} ${batch.plpkId}`.toLowerCase().includes(needle));
    })
    .sort((a, b) => Number(b.status === 'waiting-kordes-verification') - Number(a.status === 'waiting-kordes-verification')),
  [batches, filter, query]);

  return (
    <>
      <MobilePageHeader
        title="Verifikasi Penjemputan"
        subtitle="Periksa hasil penjemputan dan penerimaan uang dari PLPK"
        action={<div className="kordes-header-actions"><button type="button" className={searchOpen ? 'plpk-icon-button is-active' : 'plpk-icon-button'} onClick={() => setSearchOpen((open) => !open)} aria-label="Buka pencarian"><Search size={18} aria-hidden="true" /></button><button type="button" className="plpk-icon-button" onClick={() => document.getElementById('kordes-status-filter')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })} aria-label="Buka filter status"><SlidersHorizontal size={18} aria-hidden="true" /></button></div>}
      />
      <div className="plpk-scroll kordes-verification-screen">
        <div className="kordes-verification-meta"><strong>{formatPeriodLabel(period)}</strong><span>{counts.waiting} menunggu</span></div>

        <section className="kordes-verification-summary" aria-label="Ringkasan verifikasi">
          <article className="kordes-total-card"><span><MobileServiceIcon icon={MoneyBag02Icon} label="Total Perolehan" size={20} /></span><div><small>Total Perolehan</small><strong>{formatRupiah(counts.gross)}</strong><p>Dari {formatNumber(batches.length)} laporan PLPK periode ini</p></div></article>
          <div className="kordes-summary-mini-grid">
            <SummaryMini icon={ClipboardCheckIcon} label="Menunggu" value={counts.waiting} tone="waiting" />
            <SummaryMini icon={CheckmarkCircle02Icon} label="Terverifikasi" value={counts.verified} tone="verified" />
            <SummaryMini icon={Alert02Icon} label="Perlu Koreksi" value={counts.correction} tone="correction" />
          </div>
        </section>

        {searchOpen ? <div className="plpk-search kordes-queue-search"><Search size={18} aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau ID PLPK" aria-label="Cari nama atau ID PLPK" type="search" />{query ? <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian"><X size={17} aria-hidden="true" /></button> : null}</div> : null}

        <div id="kordes-status-filter" className="plpk-filters kordes-segmented-filter" role="group" aria-label="Filter status">
          {filters.map((item) => <button key={item.key} type="button" className={filter === item.key ? 'plpk-chip is-active' : 'plpk-chip'} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}<small>{filterCounts[item.key]}</small></button>)}
        </div>

        {visible.length ? <div className="kordes-queue-list">{visible.map((batch) => <VerificationCard key={batch.id} batch={batch} onOpen={onOpen} onOpenF009={onOpenF009} />)}</div> : (
          <MobileEmptyState
            icon={Search01Icon}
            title={batches.length ? 'Data Tidak Ditemukan' : 'Tidak Ada Antrean'}
            description={batches.length ? 'Coba ubah kata kunci atau filter status.' : 'Semua data PLPK pada periode ini sudah diperiksa.'}
            action={!batches.length ? <button type="button" className="plpk-btn plpk-btn-quiet" onClick={onOpenJournal}>Lihat Jurnal</button> : undefined}
          />
        )}
      </div>
    </>
  );
}

function SummaryMini({ icon, label, value, tone }: { icon: IconSvgElement; label: string; value: number; tone: string }) {
  return <article className={`kordes-summary-mini is-${tone}`}><span><MobileServiceIcon icon={icon} label={label} size={18} /></span><div><small>{label}</small><strong>{formatNumber(value)}</strong></div></article>;
}

function VerificationCard({ batch, onOpen, onOpenF009 }: { batch: CollectionBatch; onOpen: (batch: CollectionBatch) => void; onOpenF009: (batch: CollectionBatch) => void }) {
  const actionLabel: Record<CollectionStatus, string> = {
    draft: 'Lihat Data', scheduled: 'Lihat Data', collecting: 'Lihat Data', 'collection-completed': 'Lihat Data',
    'waiting-kordes-verification': 'Verifikasi Sekarang', 'verified-by-kordes': 'Lihat Hasil', 'needs-correction': 'Lihat Koreksi',
  };
  const submittedAt = batch.submittedToKordesAt ?? batch.createdAt;
  const initials = batch.plpkName.split(' ').map((part) => part[0]).slice(0, 2).join('');
  return (
    <article className={batch.status === 'waiting-kordes-verification' ? 'kordes-queue-card is-priority' : 'kordes-queue-card'}>
      <div className="kordes-queue-head"><span className="kordes-queue-avatar" aria-hidden="true">{initials}</span><div><strong>{batch.plpkName}</strong><span>{batch.plpkId}</span></div><MobileStatusBadge status={batch.status} /></div>
      <p className="kordes-submitted"><span>{formatKordesSubmissionAge(submittedAt)}</span><small>{formatDateShort(submittedAt)}</small></p>
      <div className="kordes-queue-period"><span>Periode</span><strong>{formatPeriodLabel(batch.period)}</strong></div>
      <div className="kordes-queue-counts"><div><small>Munfiq aktif</small><strong>{formatNumber(batch.activeCanCount)}</strong></div><div><small>Terjemput</small><strong>{formatNumber(batch.collectedCanCount)}</strong></div><div><small>Tidak terjemput</small><strong>{formatNumber(batch.uncollectedCanCount)}</strong></div><div><small>Nominal kotor</small><strong>{formatRupiah(batch.grossAmount)}</strong></div></div>
      <div className="kordes-queue-net"><span>Jumlah bersih diterima Kordes</span><strong>{formatRupiah(batch.netAmount)}</strong></div>
      <div className="kordes-card-actions"><button type="button" className="kordes-outline-button" onClick={() => onOpenF009(batch)}>Lihat F.009</button><button type="button" className="kordes-primary-button" onClick={() => onOpen(batch)}><MobileServiceIcon icon={ClipboardCheckIcon} label={actionLabel[batch.status]} size={18} />{actionLabel[batch.status]}<ChevronRight size={16} aria-hidden="true" /></button></div>
    </article>
  );
}
