'use client';

import { Alert02Icon, UserAdd01Icon, UserCheck01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { formatNumber } from '@/features/gorut-v2/formatters';
import { SummaryBand, type SummaryMetric } from '../operations/summary-band';

export function MunfiqSummary({ items }: { items: GorutMunfiq[] }) {
  const activeCount = items.filter((item) => item.status === 'active').length;
  const activePercentage = items.length ? (activeCount / items.length) * 100 : 0;
  const metrics: SummaryMetric[] = [
    { id: 'total', label: 'Total Munfiq', value: formatNumber(items.length), detail: 'Seluruh data terdaftar', icon: <HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={1.8} /> },
    { id: 'active', label: 'Munfiq aktif', value: formatNumber(activeCount), detail: `${activePercentage.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari total`, tone: 'positive', icon: <HugeiconsIcon icon={UserCheck01Icon} size={18} strokeWidth={1.8} /> },
    { id: 'unpaid', label: 'Perlu tindak lanjut', value: formatNumber(items.filter((item) => item.status === 'unpaid').length), detail: 'Belum melakukan setoran', tone: 'warning', icon: <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={1.8} /> },
    { id: 'new', label: 'Munfiq baru', value: formatNumber(items.filter((item) => item.status === 'new').length), detail: '30 hari terakhir', icon: <HugeiconsIcon icon={UserAdd01Icon} size={18} strokeWidth={1.8} /> },
  ];
  return <SummaryBand metrics={metrics} label="Ringkasan Munfiq" />;
}
