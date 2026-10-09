'use client';

import type { MunfiqCollectionRow } from '@/features/gorut-v2/penjemputan-monitoring';
import { formatCollectedAt, formatRowAddress, monitoringStatusLabels } from '@/features/gorut-v2/penjemputan-monitoring';
import { formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

/** Versi kartu untuk layar kecil. Isinya sama persis dengan tabel, tanpa elemen <table>. */
export function PenjemputanMunfiqCards({ rows, startNumber }: { rows: MunfiqCollectionRow[]; startNumber: number }) {
  return (
    <div className="pjm-cards">
      {rows.map((row, index) => (
        <article key={row.id}>
          <header>
            <div>
              <strong className="pjm-code">{row.canCode}</strong>
              <span className="pjm-name">{row.munfiqName}</span>
            </div>
            <span className={`pjm-badge is-${row.status}`}>{monitoringStatusLabels[row.status]}</span>
          </header>

          <dl>
            <div className="is-wide">
              <dt>Alamat</dt>
              <dd>{formatRowAddress(row)}</dd>
            </div>
            <div>
              <dt>Tgl. Jemput</dt>
              <dd>{formatCollectedAt(row.collectedAt)}</dd>
            </div>
            <div>
              <dt>Periode</dt>
              <dd>{formatPeriodLabel(row.period)}</dd>
            </div>
          </dl>

          <footer>
            <span>No. {startNumber + index}</span>
            <strong>{formatRupiah(row.amount)}</strong>
          </footer>
        </article>
      ))}
    </div>
  );
}
