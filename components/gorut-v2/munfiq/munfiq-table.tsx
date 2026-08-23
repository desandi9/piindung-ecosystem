'use client';

import { Eye } from 'lucide-react';

import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { formatPhoneNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { munfiqStatusLabels } from '@/features/gorut-v2/munfiq-options';

export function MunfiqTable({ items, onDetail }: { items: GorutMunfiq[]; onDetail: (item: GorutMunfiq) => void }) {
  return (
    <div className="gorut-munfiq-table-wrap">
      <table>
        <colgroup>
          <col className="is-id" />
          <col className="is-name" />
          <col className="is-address" />
          <col className="is-phone" />
          <col className="is-plpk" />
          <col className="is-amount" />
          <col className="is-status" />
          <col className="is-detail" />
        </colgroup>
        <thead><tr><th>ID Munfiq</th><th>Nama</th><th>Alamat</th><th>No. HP</th><th>PLPK</th><th className="is-numeric">Total Penghimpunan</th><th>Status</th><th>Detail</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td><strong className="gorut-munfiq-id">{item.memberId}</strong><small>ID data Munfiq</small></td>
              <td><strong className="gorut-munfiq-name">{item.name}</strong></td>
              <td><div className="gorut-munfiq-address"><strong>{getAddressLine(item)}</strong><small>Desa {item.village} · Kec. {item.kecamatan}</small></div></td>
              <td><span className="gorut-munfiq-phone">{formatPhoneNumber(item.phone)}</span></td>
              <td><div className="gorut-munfiq-plpk"><strong>{item.plpkName}</strong><small>{item.plpkId}</small></div></td>
              <td className="is-numeric"><strong className="gorut-munfiq-total-collected">{formatRupiah(item.totalCollected)}</strong></td>
              <td><span className={`gorut-munfiq-status is-${item.status}`}>{munfiqStatusLabels[item.status]}</span></td>
              <td><button type="button" className="gorut-munfiq-detail-button" onClick={() => onDetail(item)}><Eye size={14} aria-hidden="true" />Detail</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getAddressLine(item: GorutMunfiq) {
  const regionSuffix = `, ${item.kecamatan}, Garut`;
  return item.address.endsWith(regionSuffix) ? item.address.slice(0, -regionSuffix.length) : item.address;
}
