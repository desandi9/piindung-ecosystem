'use client';

import { Eye } from 'lucide-react';

import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { formatPhoneNumber, formatRupiah, getInitials } from '@/features/gorut-v2/formatters';
import { munfiqStatusLabels } from '@/features/gorut-v2/munfiq-options';

export function MunfiqMobileList({ items, onDetail }: { items: GorutMunfiq[]; onDetail: (item: GorutMunfiq) => void }) {
  return (
    <div className="gorut-munfiq-mobile-list">
      {items.map((item) => (
        <article key={item.id}>
          <div className="gorut-munfiq-card-top">
            <div className="gorut-munfiq-person"><span className="gorut-avatar">{getInitials(item.name)}</span><span><strong>{item.name}</strong><small>{item.memberId}</small></span></div>
            <span className={`gorut-munfiq-status is-${item.status}`}>{munfiqStatusLabels[item.status]}</span>
          </div>
          <div className="gorut-munfiq-card-middle"><span>Total penghimpunan</span><strong className="gorut-munfiq-amount">{formatRupiah(item.totalCollected)}</strong></div>
          <dl>
            <div><dt>No. HP</dt><dd>{formatPhoneNumber(item.phone)}</dd></div>
            <div><dt>PLPK</dt><dd>{item.plpkName}</dd></div>
            <div className="is-wide"><dt>Alamat</dt><dd>{item.address}</dd></div>
          </dl>
          <button type="button" className="gorut-munfiq-detail-button" onClick={() => onDetail(item)}><Eye size={14} aria-hidden="true" />Lihat Detail</button>
        </article>
      ))}
    </div>
  );
}
