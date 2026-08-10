'use client';

import { CircleAlert, Plus, UserCheck, UsersRound } from 'lucide-react';
import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { formatNumber } from '@/features/gorut-v2/formatters';
import { SummaryBand, type SummaryMetric } from '../operations/summary-band';

export function MunfiqSummary({ items }: { items: GorutMunfiq[] }) {
  const activeCount = items.filter((item) => item.status === 'active').length;
  const activePercentage = items.length ? (activeCount / items.length) * 100 : 0;
  const metrics: SummaryMetric[] = [
    { id: 'total', label: 'Total Munfiq', value: formatNumber(items.length), detail: 'Seluruh data terdaftar', icon: <UsersRound size={17} /> },
    { id: 'active', label: 'Munfiq aktif', value: formatNumber(activeCount), detail: `${activePercentage.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari total`, tone: 'positive', icon: <UserCheck size={17} /> },
    { id: 'unpaid', label: 'Perlu tindak lanjut', value: formatNumber(items.filter((item) => item.status === 'unpaid').length), detail: 'Belum melakukan setoran', tone: 'warning', icon: <CircleAlert size={17} /> },
    { id: 'new', label: 'Munfiq baru', value: formatNumber(items.filter((item) => item.status === 'new').length), detail: '30 hari terakhir', icon: <Plus size={17} /> },
  ];
  return <SummaryBand metrics={metrics} label="Ringkasan Munfiq" />;
}
