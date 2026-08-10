import { Banknote, HandCoins, UsersRound, WalletCards } from 'lucide-react';

import type { DashboardControl } from '@/features/gorut-v2/dashboard-control';
import { formatNumber, formatRupiah, formatRupiahCompact } from '@/features/gorut-v2/formatters';

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
      <div className="gorut-command-health-primary">
        <header>
          <span><Banknote size={18} aria-hidden="true" /></span>
          <div><h2 id="gorut-health-title">Kesehatan penghimpunan</h2><p>Posisi keuangan periode aktif berdasarkan batch yang tersedia.</p></div>
        </header>
        <div className="gorut-command-health-amount">
          <span>Jumlah bersih</span>
          <strong>{formatRupiah(kpi.netAmount)}</strong>
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

      <div className="gorut-command-health-metrics" aria-label="Metrik operasional periode aktif">
        <article>
          <span className="gorut-command-metric-icon"><UsersRound size={17} aria-hidden="true" /></span>
          <div><span>Munfiq aktif</span><strong>{formatNumber(kpi.munfiqActive)}</strong><small>{activeRatio}% dari {formatNumber(kpi.munfiqTotal)} Munfiq</small></div>
        </article>
        <article>
          <span className="gorut-command-metric-icon"><HandCoins size={17} aria-hidden="true" /></span>
          <div><span>Batch berjalan</span><strong>{formatNumber(kpi.batchRunning)}</strong><small>dari {formatNumber(kpi.batchTotal)} batch periode aktif</small></div>
        </article>
        <article className={kpi.waitingKordes ? 'is-warning' : undefined}>
          <span className="gorut-command-metric-icon"><WalletCards size={17} aria-hidden="true" /></span>
          <div><span>Menunggu Kordes</span><strong>{formatNumber(kpi.waitingKordes)}</strong><small>batch membutuhkan verifikasi</small></div>
        </article>
      </div>

      <div className="gorut-command-statuses">
        <div className="gorut-command-status-total"><span>Status seluruh batch</span><strong>{formatNumber(statusTotal)}</strong></div>
        <ul>
          {statuses.map((status) => (
            <li key={status.id} className={`is-${status.id}`}>
              <div><span>{status.label}</span><strong>{formatNumber(status.count)}</strong></div>
              <div className="gorut-command-status-track"><span style={{ width: `${status.percentage}%` }} /></div>
              <small>{status.percentage}%</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
