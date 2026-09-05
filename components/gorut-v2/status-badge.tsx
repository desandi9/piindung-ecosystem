'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';

export function StatusBadge({ value, children }: { value: number; children?: ReactNode }) {
  const positive = value >= 0;
  return (
    <span className={`gorut-status-badge ${positive ? 'is-positive' : 'is-negative'}`}>
      {positive ? <ArrowUp size={10} strokeWidth={2.5} /> : <ArrowDown size={10} strokeWidth={2.5} />}
      {children ?? `${positive ? '+' : ''}${value.toLocaleString('id-ID')}%`}
    </span>
  );
}
