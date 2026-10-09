'use client';

import { Info } from 'lucide-react';
import { icons } from 'lucide-react';
import type { GorutMetric } from '@/features/gorut-v2/types';
import { formatNumber } from '@/features/gorut-v2/formatters';
import { StatusBadge } from './status-badge';

type MetricCardProps = { metric: GorutMetric; index: number };

export function MetricCard({ metric, index }: MetricCardProps) {
  const Icon = icons[metric.icon as keyof typeof icons];
  const value = typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value;

  return (
    <article className="gorut-metric-card gorut-entrance-item" style={{ '--item-delay': `${index * 45}ms` } as React.CSSProperties}>
      <div className="gorut-metric-topline">
        <div className="gorut-metric-heading">
          <span className="gorut-icon-box">{Icon ? <Icon size={14} strokeWidth={1.8} /> : null}</span>
          <span>{metric.label}</span>
        </div>
        <Info size={13} aria-hidden="true" />
      </div>
      <div className="gorut-metric-bottomline">
        <strong>{value}</strong>
        <div className="gorut-metric-meta">
          <StatusBadge value={metric.trend} />
          <span>{metric.comparisonText}</span>
        </div>
      </div>
    </article>
  );
}
