'use client';

import { Analytics02Icon, Coins01Icon, Notebook01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { ChevronRight, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { buildKordesJournal, type KordesJournalStatus } from '@/features/gorut-v2/kordes-mobile';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from '../plpk-mobile/mobile-service-icon';
import { MobilePageHeader } from '../plpk-mobile/mobile-ui';

const statusLabels: Record<KordesJournalStatus, string> = {
  'belum-lengkap': 'Belum Lengkap', 'menunggu-verifikasi': 'Menunggu Verifikasi', 'siap-direkap': 'Siap Direkap', 'f015-siap': 'F.015 Siap', 'diserahkan-upzis': 'Diserahkan ke UPZIS',
};

export function KordesJournalTab({ batches, village, kecamatan, onOpenRecap }: { batches: CollectionBatch[]; village: string; kecamatan: string; onOpenRecap: (period: string) => void }) {
  const items = useMemo(() => buildKordesJournal(batches, { village, kecamatan }), [batches, village, kecamatan]);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(items[0]?.period ?? '');
  const visible = filter === 'all' ? items : items.filter((item) => item.period === filter);
  return <><MobilePageHeader title="Jurnal Kordes" subtitle={`Rekap Desa ${village}`} /><div className="plpk-scroll">
    <label className="plpk-filter-field"><span><Filter size={16} aria-hidden="true" />Filter periode</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua periode</option>{items.map((item) => <option key={item.period} value={item.period}>{formatPeriodLabel(item.period)}</option>)}</select></label>
    <div className="plpk-journal-list kordes-journal-list">{visible.map((item) => <article key={item.period} className="plpk-journal-card">
      <div className="plpk-journal-head"><div><span>Rekap ranting</span><h2>{formatPeriodLabel(item.period)}</h2></div><span className={`kordes-recap-badge is-${item.recapStatus}`}>{statusLabels[item.recapStatus]}</span></div>
      <div className="plpk-journal-amount"><span><MobileServiceIcon icon={Coins01Icon} label="Jumlah bersih" size={19} /></span><div><small>Jumlah bersih ranting</small><strong>{formatRupiah(item.netAmount)}</strong></div></div>
      <div className="plpk-journal-stats"><div><MobileServiceIcon icon={UserGroupIcon} label="Jumlah PLPK" size={18} /><small>PLPK</small><strong>{formatNumber(item.plpkCount)}</strong></div><div><MobileServiceIcon icon={Notebook01Icon} label="Terverifikasi" size={18} /><small>Terverifikasi</small><strong>{formatNumber(item.verified)}</strong></div><div><MobileServiceIcon icon={Analytics02Icon} label="Perlu koreksi" size={18} /><small>Perlu koreksi</small><strong>{formatNumber(item.corrections)}</strong></div></div>
      {expanded === item.period ? <dl className="plpk-journal-details"><div><dt>Total Munfiq</dt><dd>{formatNumber(item.munfiqCount)}</dd></div><div><dt>Jumlah kotor</dt><dd>{formatRupiah(item.grossAmount)}</dd></div><div><dt>Total bisyaroh</dt><dd>{formatRupiah(item.totalPlpkFee)}</dd></div><div className="is-total"><dt>Jumlah bersih</dt><dd>{formatRupiah(item.netAmount)}</dd></div><div><dt>Status verifikasi</dt><dd>{statusLabels[item.recapStatus]}</dd></div><div><dt>Status F.010</dt><dd>{item.f010Status}</dd></div><div><dt>Status F.015</dt><dd>{item.f015Ready ? 'Siap' : 'Belum Siap'}</dd></div></dl> : null}
      <button type="button" className="plpk-card-action" onClick={() => setExpanded(expanded === item.period ? '' : item.period)}>Lihat Ringkasan<ChevronRight size={18} aria-hidden="true" /></button>
      <button type="button" className="plpk-btn plpk-btn-secondary" onClick={() => onOpenRecap(item.period)}>Buka Rekap Ranting</button>
    </article>)}</div>
  </div></>;
}
