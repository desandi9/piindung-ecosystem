'use client';

import { CalendarClock, Coins, HandCoins, UsersRound } from 'lucide-react';

import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah, formatRupiahCompact } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

export function PengambilanSummary({ batches, period }: { batches: CollectionBatch[]; period: string }) {
  const monthBatches = batches.filter((batch) => batch.period === period);
  const totalCoin = monthBatches.reduce((sum, batch) => sum + batch.totalCollected, 0);
  const visited = monthBatches.reduce((sum, batch) => sum + batch.entries.filter((entry) => entry.visitStatus === 'collected').length, 0);
  const totalFee = monthBatches.reduce((sum, batch) => sum + batch.totalPlpkFee, 0);
  const eligible = monthBatches.reduce((sum, batch) => sum + batch.eligibleMunfiqCount, 0);

  const values = [
    { label: 'Penghimpunan Bulan Ini', value: formatNumber(monthBatches.length), detail: formatPeriodLabel(period), icon: CalendarClock },
    { label: 'Total Koin Terkumpul', value: formatRupiahCompact(totalCoin), detail: `${formatNumber(monthBatches.length)} batch tercatat`, icon: Coins },
    { label: 'Munfiq Sudah Dikunjungi', value: formatNumber(visited), detail: 'koin berhasil diambil', icon: UsersRound },
    { label: 'Estimasi Upah PLPK', value: formatRupiah(totalFee), detail: `${formatNumber(eligible)} Munfiq memenuhi syarat`, icon: HandCoins },
  ];

  return <section className="gorut-collect-summary" aria-label="Ringkasan penghimpunan koin">{values.map(({ label, value, detail, icon: Icon }, index) => <article key={label} style={{ '--item-delay': `${index * 40}ms` } as React.CSSProperties}><div><span className="gorut-icon-box"><Icon size={14} /></span><span>{label}</span></div><strong>{value}</strong><small>{detail}</small></article>)}</section>;
}
