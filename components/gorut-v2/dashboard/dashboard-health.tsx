'use client';

import { CircleDollarSign, ClipboardClock, Layers3, UserRoundCheck } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { DashboardControl } from '@/features/gorut-v2/dashboard-control';
import { formatNumber, formatRupiah, formatRupiahCompact } from '@/features/gorut-v2/formatters';

import { DashboardCountUp } from './dashboard-count-up';

type DashboardHealthProps = {
  kpi: DashboardControl['kpi'];
  statuses: DashboardControl['statuses'];
  statusTotal: number;
};

export function DashboardHealth({ kpi, statuses, statusTotal }: DashboardHealthProps) {
  const netRatio = kpi.grossAmount ? Math.round((kpi.netAmount / kpi.grossAmount) * 100) : 0;
  const activeRatio = kpi.munfiqTotal ? Math.round((kpi.munfiqActive / kpi.munfiqTotal) * 100) : 0;

  return (
    <section className="gorut-command-health" aria-labelledby="gorut-health-title">
      <div className="gorut-purity-kpis" aria-label="Ringkasan periode aktif">
        <article className="is-primary">
          <div>
            <span>Jumlah bersih</span>
            <strong data-numeric><DashboardCountUp value={kpi.netAmount} format={formatRupiah} /></strong>
            <small><b>+{netRatio}%</b> dari jumlah kotor</small>
          </div>
          <span className="gorut-purity-kpi-icon">
            <CircleDollarSign size={21} aria-hidden="true" />
          </span>
        </article>
        <article className="is-people">
          <div>
            <span>Munfiq aktif</span>
            <strong data-numeric><DashboardCountUp value={kpi.munfiqActive} format={formatNumber} /></strong>
            <small><b>+{activeRatio}%</b> dari {formatNumber(kpi.munfiqTotal)} Munfiq</small>
          </div>
          <span className="gorut-purity-kpi-icon">
            <UserRoundCheck size={21} aria-hidden="true" />
          </span>
        </article>
        <article className="is-running">
          <div>
            <span>Batch berjalan</span>
            <strong data-numeric><DashboardCountUp value={kpi.batchRunning} format={formatNumber} /></strong>
            <small>dari {formatNumber(kpi.batchTotal)} batch aktif</small>
          </div>
          <span className="gorut-purity-kpi-icon">
            <Layers3 size={21} aria-hidden="true" />
          </span>
        </article>
        <article className={kpi.waitingKordes ? 'is-warning' : 'is-clear'}>
          <div>
            <span>Menunggu Kordes</span>
            <strong data-numeric><DashboardCountUp value={kpi.waitingKordes} format={formatNumber} /></strong>
            <small>batch membutuhkan verifikasi</small>
          </div>
          <span className="gorut-purity-kpi-icon">
            <ClipboardClock size={21} aria-hidden="true" />
          </span>
        </article>
      </div>

      <div className="gorut-purity-health-grid">
        <div className="gorut-command-health-primary">
          <div className="gorut-purity-health-copy">
            <header>
              <div>
                <h2 id="gorut-health-title">Kendali penghimpunan</h2>
                <p>Kesehatan periode aktif, posisi jumlah bersih, dan capaian batch dalam satu ringkasan.</p>
              </div>
            </header>
            <div className="gorut-command-health-amount">
              <span>Jumlah bersih</span>
              <strong data-numeric><DashboardCountUp value={kpi.netAmount} format={formatRupiah} /></strong>
              <small>{netRatio}% dari jumlah kotor {formatRupiahCompact(kpi.grossAmount)}</small>
            </div>
            <div className="gorut-command-health-track" role="progressbar" aria-label="Persentase jumlah bersih terhadap jumlah kotor" aria-valuemin={0} aria-valuemax={100} aria-valuenow={netRatio}>
              <span style={{ width: `${netRatio}%` }} />
            </div>
            <dl className="gorut-command-health-facts">
              <div><dt>Jumlah kotor</dt><dd>{formatRupiah(kpi.grossAmount)}</dd></div>
              <div><dt>Potongan bisyaroh</dt><dd>{formatRupiah(kpi.grossAmount - kpi.netAmount)}</dd></div>
            </dl>
          </div>
          <div className="gorut-purity-health-visual" aria-hidden="true">
            <span><CircleDollarSign size={30} /></span>
            <strong><DashboardCountUp value={netRatio} format={(value) => `${formatNumber(value)}%`} /></strong>
            <small>Bersih dari jumlah kotor</small>
          </div>
        </div>

        <div className="gorut-command-statuses">
          <div className="gorut-command-status-total">
            <div><span>Status batch</span><small>Distribusi periode aktif</small></div>
            <strong data-numeric><DashboardCountUp value={statusTotal} format={formatNumber} /></strong>
          </div>
          <ul>
            {statuses.map((status, index) => (
              <li key={status.id} className={`is-${status.id}`} style={{ '--gorut-status-index': index } as CSSProperties}>
                <div><span>{status.label}</span><strong>{formatNumber(status.count)}</strong></div>
                <div className="gorut-command-status-track" role="progressbar" aria-label={`${status.label} ${status.percentage}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={status.percentage}><span style={{ width: `${status.percentage}%` }} /></div>
                <small>{status.percentage}%</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
