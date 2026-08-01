'use client';

import { Plus, UsersRound } from 'lucide-react';
import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { formatNumber } from '@/features/gorut-v2/formatters';

export function MunfiqSummary({ items }: { items: GorutMunfiq[] }) {
  const activeCount = items.filter((item) => item.status === 'active').length;
  const activePercentage = items.length ? (activeCount / items.length) * 100 : 0;
  const values = [
    { label: 'Total Munfiq', value: formatNumber(items.length), detail: '+2,4% bulan ini', icon: UsersRound },
    { label: 'Munfiq Aktif', value: formatNumber(activeCount), detail: `${activePercentage.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari total`, icon: UsersRound },
    { label: 'Belum Setor', value: formatNumber(items.filter((item) => item.status === 'unpaid').length), detail: 'perlu tindak lanjut', icon: UsersRound },
    { label: 'Munfiq Baru', value: formatNumber(items.filter((item) => item.status === 'new').length), detail: '30 hari terakhir', icon: Plus },
  ];
  return <section className="gorut-munfiq-summary" aria-label="Ringkasan Munfiq">{values.map(({ label, value, detail, icon: Icon }, index) => <article key={label} style={{ '--item-delay': `${index * 40}ms` } as React.CSSProperties}><div><span className="gorut-icon-box"><Icon size={14} /></span><span>{label}</span></div><strong>{value}</strong><small>{detail}</small></article>)}</section>;
}
