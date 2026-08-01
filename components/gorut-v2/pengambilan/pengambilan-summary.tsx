'use client';

import { CalendarClock, Coins, HandCoins, UsersRound } from 'lucide-react';

import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiahCompact } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

export function PengambilanSummary({ batches, period }: { batches: CollectionBatch[]; period: string }) {
  const monthBatches = batches.filter((batch) => batch.period === period);
  const activeCans = monthBatches.reduce((sum, batch) => sum + batch.activeCanCount, 0);
  const collectedCans = monthBatches.reduce((sum, batch) => sum + batch.collectedCanCount, 0);
  const netAmount = monthBatches.reduce((sum, batch) => sum + batch.netAmount, 0);

  const values = [
    { label: 'Batch Bulan Ini', value: formatNumber(monthBatches.length), detail: formatPeriodLabel(period), icon: CalendarClock },
    { label: 'Kaleng Aktif', value: formatNumber(activeCans), detail: 'satu Munfiq aktif = satu kaleng', icon: Coins },
    { label: 'Kaleng Terjemput', value: formatNumber(collectedCans), detail: 'berstatus Terjemput', icon: UsersRound },
    { label: 'Jumlah Bersih', value: formatRupiahCompact(netAmount), detail: 'setelah upah PLPK', icon: HandCoins },
  ];

  return <section className="gorut-collect-summary" aria-label="Ringkasan penghimpunan koin">{values.map(({ label, value, detail, icon: Icon }, index) => <article key={label} style={{ '--item-delay': `${index * 40}ms` } as React.CSSProperties}><div><span className="gorut-icon-box"><Icon size={14} /></span><span>{label}</span></div><strong>{value}</strong><small>{detail}</small></article>)}</section>;
}
