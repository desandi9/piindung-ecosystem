'use client';

import { Eye, FileText, LayoutList } from 'lucide-react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { canCreateRecap, canPrepareMinutes, upzisStatusLabels } from '@/features/gorut-v2/upzis-options';

type RowHandlers = {
  onDetail: (recap: UpzisVillageRecap, trigger?: HTMLElement) => void;
  onRecap: (recap: UpzisVillageRecap) => void;
  onMinutes: (recap: UpzisVillageRecap) => void;
};

export function UpzisTable({ recaps, onDetail, onRecap, onMinutes }: { recaps: UpzisVillageRecap[] } & RowHandlers) {
  return (
    <div className="pjm-table-wrap upzis-verification-table-wrap">
      <table className="pjm-table upzis-verification-table">
        <thead>
          <tr>
            <th>Periode</th>
            <th>Desa</th>
            <th>Nama Kordes</th>
            <th>Jumlah PLPK</th>
            <th>Jumlah Munfiq</th>
            <th className="is-amount">Total Koin</th>
            <th className="is-amount">Total Upah PLPK</th>
            <th className="is-status">Status</th>
            <th>Berita Acara</th>
            <th className="is-action">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {recaps.map((recap) => (
            <tr key={recap.id} className={recap.status === 'incomplete' ? 'is-incomplete' : undefined}>
              <td><strong>{formatPeriodLabel(recap.period)}</strong></td>
              <td><strong>{recap.village}</strong><small>{recap.kecamatan}</small></td>
              <td>{recap.kordesName}</td>
              <td>{formatNumber(recap.plpkCount)} PLPK</td>
              <td>{formatNumber(recap.munfiqCount)} Munfiq</td>
              <td className="is-amount">{formatRupiah(recap.totalCollected)}</td>
              <td className="is-amount">{formatRupiah(recap.totalPlpkFee)}</td>
              <td className="is-status"><span className={`pjm-badge upzis-verification-badge is-${recap.status}`}>{upzisStatusLabels[recap.status]}</span></td>
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
  return (
    <div className="upzis-verification-actions">
      <button type="button" className="upzis-verification-action" onClick={(event) => onDetail(recap, event.currentTarget)}><Eye size={13} />Detail</button>
      {canCreateRecap(recap.status) ? <button type="button" className="upzis-verification-action is-primary" onClick={() => onRecap(recap)}><LayoutList size={13} />Buat Rekap</button> : null}
      {canPrepareMinutes(recap.status) ? <button type="button" className="upzis-verification-action is-primary" onClick={() => onMinutes(recap)}><FileText size={13} />Siapkan BA</button> : null}
    </div>
  );
}
