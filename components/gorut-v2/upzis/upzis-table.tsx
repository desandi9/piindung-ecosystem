'use client';

import { Eye, FileText, LayoutList, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { canCreateRecap, canPrepareMinutes, upzisStatusLabels } from '@/features/gorut-v2/upzis-options';

type RowHandlers = {
  onDetail: (recap: UpzisVillageRecap) => void;
  onRecap: (recap: UpzisVillageRecap) => void;
  onMinutes: (recap: UpzisVillageRecap) => void;
};

export function UpzisTable({ recaps, onDetail, onRecap, onMinutes }: { recaps: UpzisVillageRecap[] } & RowHandlers) {
  return (
    <div className="gorut-collect-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Desa</th>
            <th>Nama Kordes</th>
            <th>Jumlah PLPK</th>
            <th>Jumlah Munfiq</th>
            <th>Total Koin</th>
            <th>Total Upah PLPK</th>
            <th>Status</th>
            <th>Berita Acara</th>
            <th aria-label="Aksi" />
          </tr>
        </thead>
        <tbody>
          {recaps.map((recap) => (
            <tr key={recap.id}>
              <td><strong>{formatPeriodLabel(recap.period)}</strong></td>
              <td><strong>{recap.village}</strong><small>{recap.kecamatan}</small></td>
              <td>{recap.kordesName}</td>
              <td>{formatNumber(recap.plpkCount)} PLPK</td>
              <td>{formatNumber(recap.munfiqCount)} Munfiq</td>
              <td><span className="gorut-collect-amount">{formatRupiah(recap.totalCollected)}</span></td>
              <td><span className="gorut-collect-fee">{formatRupiah(recap.totalPlpkFee)}</span></td>
              <td><span className={`gorut-upzis-status is-${recap.status}`}>{upzisStatusLabels[recap.status]}</span></td>
              <td>{recap.minutesNumber ? <strong>{recap.minutesNumber}</strong> : <small>Belum terbit</small>}</td>
              <td><RowActions recap={recap} onDetail={onDetail} onRecap={onRecap} onMinutes={onMinutes} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ recap, onDetail, onRecap, onMinutes }: { recap: UpzisVillageRecap } & RowHandlers) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const run = (action: () => void) => { setOpen(false); action(); };

  return (
    <div className="gorut-dropdown" ref={ref}>
      <button type="button" className="gorut-icon-button" onClick={() => setOpen((value) => !value)} aria-label={`Menu aksi ${recap.village}`} aria-expanded={open}><MoreHorizontal size={15} /></button>
      {open ? (
        <div className="gorut-dropdown-menu">
          <button type="button" onClick={() => run(() => onDetail(recap))}><Eye size={13} />Lihat Detail</button>
          {canCreateRecap(recap.status) ? <button type="button" onClick={() => run(() => onRecap(recap))}><LayoutList size={13} />Buat Rekap</button> : null}
          {canPrepareMinutes(recap.status) ? <button type="button" onClick={() => run(() => onMinutes(recap))}><FileText size={13} />Siapkan Berita Acara</button> : null}
        </div>
      ) : null}
    </div>
  );
}
