'use client';

import { Eye, MoreHorizontal, PackageCheck, PenLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { collectionStatusLabels, formatPeriodLabel, isBatchEditable } from '@/features/gorut-v2/pengambilan-options';

type RowHandlers = {
  onDetail: (batch: CollectionBatch) => void;
  onEdit: (batch: CollectionBatch) => void;
  onHandover: (batch: CollectionBatch) => void;
};

export function PengambilanTable({ batches, onDetail, onEdit, onHandover }: { batches: CollectionBatch[] } & RowHandlers) {
  return (
    <div className="gorut-collect-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Periode</th>
            <th>PLPK</th>
            <th>Wilayah</th>
            <th>Jumlah Munfiq</th>
            <th>Total Koin</th>
            <th>Memenuhi Syarat</th>
            <th>Upah PLPK</th>
            <th>Status</th>
            <th aria-label="Aksi" />
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.id}>
              <td><strong>{formatPeriodLabel(batch.period)}</strong><small>{batch.id.replace('batch-', 'PGB-')}</small></td>
              <td><strong>{batch.plpkName}</strong><small>{batch.plpkId}</small></td>
              <td><strong>{batch.kecamatan}</strong><small>{batch.village}</small></td>
              <td>{formatNumber(batch.entries.length)} Munfiq</td>
              <td><span className="gorut-collect-amount">{formatRupiah(batch.totalCollected)}</span></td>
              <td>{formatNumber(batch.eligibleMunfiqCount)} Munfiq</td>
              <td><span className="gorut-collect-fee">{formatRupiah(batch.totalPlpkFee)}</span></td>
              <td><span className={`gorut-collect-status is-${batch.status}`}>{collectionStatusLabels[batch.status]}</span></td>
              <td><RowActions batch={batch} onDetail={onDetail} onEdit={onEdit} onHandover={onHandover} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ batch, onDetail, onEdit, onHandover }: { batch: CollectionBatch } & RowHandlers) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const run = (action: () => void) => { setOpen(false); action(); };

  return (
    <div className="gorut-dropdown" ref={ref}>
      <button type="button" className="gorut-icon-button" onClick={() => setOpen((value) => !value)} aria-label={`Menu aksi ${batch.plpkName}`} aria-expanded={open}><MoreHorizontal size={15} /></button>
      {open ? (
        <div className="gorut-dropdown-menu">
          <button type="button" onClick={() => run(() => onDetail(batch))}><Eye size={13} />Lihat Detail</button>
          {isBatchEditable(batch) ? <button type="button" onClick={() => run(() => onEdit(batch))}><PenLine size={13} />Edit Draft</button> : null}
          <button type="button" onClick={() => run(() => onHandover(batch))}><PackageCheck size={13} />Siapkan Serah Terima</button>
        </div>
      ) : null}
    </div>
  );
}
