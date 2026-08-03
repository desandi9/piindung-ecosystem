'use client';

import { BadgeCheck, HandCoins, UserRound, UsersRound } from 'lucide-react';

import type { MonitoringSummary } from '@/features/gorut-v2/penjemputan-monitoring';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';

/**
 * Empat card ringkasan dalam konteks satu PLPK terpilih:
 * PLPK, Munfiq Aktif, Munfiq Terjemput, Perolehan (Terverifikasi).
 */
export function PenjemputanSummary({ summary }: { summary: MonitoringSummary }) {
  return (
    <section className="pjm-summary" aria-label="Ringkasan penjemputan PLPK terpilih">
      <article>
        <div className="pjm-summary-heading"><span><UserRound size={15} aria-hidden="true" /></span><p>PLPK</p></div>
        <strong>{summary.plpkName}</strong>
        <small>{summary.plpkId}</small>
      </article>
      <article>
        <div className="pjm-summary-heading"><span><UsersRound size={15} aria-hidden="true" /></span><p>Munfiq Aktif</p></div>
        <strong>{formatNumber(summary.activeCount)} Munfiq</strong>
      </article>
      <article>
        <div className="pjm-summary-heading"><span><HandCoins size={15} aria-hidden="true" /></span><p>Munfiq Terjemput</p></div>
        <strong>{formatNumber(summary.collectedCount)} Munfiq</strong>
      </article>
      <article className="is-highlighted">
        <div className="pjm-summary-heading"><span><BadgeCheck size={15} aria-hidden="true" /></span><p>Perolehan Terverifikasi</p></div>
        <strong>{formatRupiah(summary.verifiedAmount)}</strong>
      </article>
    </section>
  );
}
