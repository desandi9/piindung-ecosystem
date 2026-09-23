'use client';

import { Alert02Icon, BanknoteIcon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { summarizeUpzisVerification } from './upzis-view';

export function UpzisSummary({ recaps, period }: { recaps: UpzisVillageRecap[]; period: string }) {
  const summary = summarizeUpzisVerification(recaps, period);

  const values = [
    { label: 'Belum Lengkap', value: formatNumber(summary.incomplete), detail: `${formatNumber(summary.rowCount)} desa · ${formatPeriodLabel(period)}`, icon: Alert02Icon },
    { label: 'Siap Direkap', value: formatNumber(summary.readyToRecap), detail: 'menunggu aksi rekap existing', icon: Clock01Icon },
    { label: 'Sudah Direkap', value: formatNumber(summary.recapped), detail: 'termasuk tahap berita acara', icon: CheckmarkCircle02Icon },
    { label: 'Jumlah Bersih', value: formatRupiah(summary.netAmount), detail: 'total koin dikurangi bisyaroh PLPK', icon: BanknoteIcon, highlighted: true },
  ];

  return <section className="pjm-summary upzis-verification-summary" aria-label="Ringkasan verifikasi UPZIS">{values.map(({ label, value, detail, icon, highlighted }, index) => <article key={label} className={highlighted ? 'is-highlighted' : undefined} style={{ '--item-delay': `${index * 40}ms` } as React.CSSProperties}><div className="pjm-summary-heading"><span><HugeiconsIcon icon={icon as IconSvgElement} size={17} strokeWidth={1.8} aria-hidden="true" /></span><p>{label}</p></div><strong>{value}</strong><small>{detail}</small></article>)}</section>;
}
