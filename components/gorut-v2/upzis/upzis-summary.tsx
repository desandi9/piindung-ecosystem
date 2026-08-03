'use client';

import { Banknote, CheckCircle2, Clock3, FileWarning } from 'lucide-react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { summarizeUpzisVerification } from './upzis-view';

export function UpzisSummary({ recaps, period }: { recaps: UpzisVillageRecap[]; period: string }) {
  const summary = summarizeUpzisVerification(recaps, period);

  const values = [
    { label: 'Belum Lengkap', value: formatNumber(summary.incomplete), detail: `${formatNumber(summary.rowCount)} desa · ${formatPeriodLabel(period)}`, icon: FileWarning },
    { label: 'Siap Direkap', value: formatNumber(summary.readyToRecap), detail: 'menunggu aksi rekap existing', icon: Clock3 },
    { label: 'Sudah Direkap', value: formatNumber(summary.recapped), detail: 'termasuk tahap berita acara', icon: CheckCircle2 },
    { label: 'Jumlah Bersih', value: formatRupiah(summary.netAmount), detail: 'total koin dikurangi upah PLPK', icon: Banknote, highlighted: true },
  ];

  return <section className="pjm-summary upzis-verification-summary" aria-label="Ringkasan verifikasi UPZIS">{values.map(({ label, value, detail, icon: Icon, highlighted }, index) => <article key={label} className={highlighted ? 'is-highlighted' : undefined} style={{ '--item-delay': `${index * 40}ms` } as React.CSSProperties}><div className="pjm-summary-heading"><span><Icon size={15} aria-hidden="true" /></span><p>{label}</p></div><strong>{value}</strong><small>{detail}</small></article>)}</section>;
}
