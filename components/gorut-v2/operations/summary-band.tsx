'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useMemo, type ReactNode } from 'react';

import { gorutMotionTokens, gorutSummaryVariants } from '@/features/gorut-v2/motion';

export type SummaryMetric = {
  id: string;
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
  icon?: ReactNode;
};

export function SummaryBand({ metrics, label = 'Ringkasan operasional' }: { metrics: SummaryMetric[]; label?: string }) {
  const reduced = useReducedMotion();
  const variants = useMemo(() => gorutSummaryVariants(Boolean(reduced)), [reduced]);
  return (
    <motion.section className="gorut-operation-summary" data-gorut-motion="motion" aria-label={label} initial="hidden" animate="visible" variants={variants.container}>
      {metrics.map((metric) => (
        <motion.article key={metric.id} className={`is-${metric.tone ?? 'default'}`} variants={variants.item} whileHover={reduced ? undefined : { transform: 'translateY(-2px)', transition: { duration: gorutMotionTokens.fast, ease: gorutMotionTokens.easeOut } }}>
          {metric.icon ? <span className="gorut-operation-summary-icon">{metric.icon}</span> : null}
          <div><span>{metric.label}</span><strong>{metric.value}</strong>{metric.detail ? <small>{metric.detail}</small> : null}</div>
        </motion.article>
      ))}
    </motion.section>
  );
}
