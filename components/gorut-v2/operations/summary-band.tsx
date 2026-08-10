import type { ReactNode } from 'react';

export type SummaryMetric = {
  id: string;
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
  icon?: ReactNode;
};

export function SummaryBand({ metrics, label = 'Ringkasan operasional' }: { metrics: SummaryMetric[]; label?: string }) {
  return (
    <section className="gorut-operation-summary gorut-motion-enter" aria-label={label}>
      {metrics.map((metric) => (
        <article key={metric.id} className={`is-${metric.tone ?? 'default'}`}>
          {metric.icon ? <span className="gorut-operation-summary-icon">{metric.icon}</span> : null}
          <div><span>{metric.label}</span><strong>{metric.value}</strong>{metric.detail ? <small>{metric.detail}</small> : null}</div>
        </article>
      ))}
    </section>
  );
}
