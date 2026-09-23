'use client';

import { ArrowDownUp } from 'lucide-react';

import type { MonitoringSortDirection, MonitoringSortKey, MunfiqCollectionRow } from '@/features/gorut-v2/penjemputan-monitoring';
import { formatCollectedAt, formatRowAddress, monitoringStatusLabels } from '@/features/gorut-v2/penjemputan-monitoring';
import { formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

/**
 * Tabel monitoring: satu baris = satu Munfiq.
 * Kolom — No, Munfiq, Alamat, Tgl. Jemput, Periode, Koin Terjemput, Status.
 */
export function PenjemputanMunfiqTable({
  rows,
  startNumber,
  sortKey,
  sortDirection,
  onSort,
}: {
  rows: MunfiqCollectionRow[];
  startNumber: number;
  sortKey: MonitoringSortKey | null;
  sortDirection: MonitoringSortDirection;
  onSort: (key: MonitoringSortKey) => void;
}) {
  const ariaSort = (key: MonitoringSortKey) => (sortKey === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');

  return (
    <div className="pjm-table-wrap">
      <table className="pjm-table">
        <thead>
          <tr>
            <th scope="col" className="is-no">NO</th>
            <th scope="col" aria-sort={ariaSort('munfiq')}>
              <button type="button" className="pjm-sort" onClick={() => onSort('munfiq')}>
                MUNFIQ<ArrowDownUp size={12} aria-hidden="true" />
              </button>
            </th>
            <th scope="col">ALAMAT</th>
            <th scope="col">TGL. JEMPUT</th>
            <th scope="col">PERIODE</th>
            <th scope="col" className="is-amount" aria-sort={ariaSort('amount')}>
              <button type="button" className="pjm-sort" onClick={() => onSort('amount')}>
                KOIN TERJEMPUT<ArrowDownUp size={12} aria-hidden="true" />
              </button>
            </th>
            <th scope="col" className="is-status">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td className="is-no">{startNumber + index}</td>
              <td>
                <strong className="pjm-code">{row.canCode}</strong>
                <span className="pjm-name">{row.munfiqName}</span>
              </td>
              <td>{formatRowAddress(row)}</td>
              <td className="pjm-datetime">{formatCollectedAt(row.collectedAt)}</td>
              <td>{formatPeriodLabel(row.period)}</td>
              <td className="is-amount">{formatRupiah(row.amount)}</td>
              <td className="is-status">
                <span className={`pjm-badge is-${row.status}`}>{monitoringStatusLabels[row.status]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
