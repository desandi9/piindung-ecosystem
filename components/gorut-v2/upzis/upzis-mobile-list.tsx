'use client';

import { Eye, FileText, LayoutList, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { canCreateRecap, canPrepareMinutes, upzisStatusLabels } from '@/features/gorut-v2/upzis-options';

type CardHandlers = {
  onDetail: (recap: UpzisVillageRecap) => void;
  onRecap: (recap: UpzisVillageRecap) => void;
  onMinutes: (recap: UpzisVillageRecap) => void;
};

export function UpzisMobileList({ recaps, onDetail, onRecap, onMinutes }: { recaps: UpzisVillageRecap[] } & CardHandlers) {
  return (
    <div className="gorut-collect-mobile-list">
      {recaps.map((recap) => (
        <article key={recap.id}>
          <div className="gorut-collect-card-top">
            <button type="button" className="gorut-upzis-card-button" onClick={() => onDetail(recap)} aria-label={`Lihat detail rekap ${recap.village}`}>
              <strong>{recap.village}</strong>
              <small>{formatPeriodLabel(recap.period)} · {recap.kecamatan}</small>
            </button>
            <CardActions recap={recap} onDetail={onDetail} onRecap={onRecap} onMinutes={onMinutes} />
          </div>

          <div className="gorut-munfiq-card-middle">
            <span className={`gorut-upzis-status is-${recap.status}`}>{upzisStatusLabels[recap.status]}</span>
            <span className="gorut-collect-amount">{formatRupiah(recap.totalCollected)}</span>
          </div>

          <dl>
            <div><dt>Kordes</dt><dd>{recap.kordesName}</dd></div>
            <div><dt>Jumlah PLPK</dt><dd>{formatNumber(recap.plpkCount)} PLPK</dd></div>
            <div><dt>Jumlah Munfiq</dt><dd>{formatNumber(recap.munfiqCount)} Munfiq</dd></div>
            <div><dt>Total Upah PLPK</dt><dd>{formatRupiah(recap.totalPlpkFee)}</dd></div>
            <div><dt>Berita Acara</dt><dd>{recap.minutesNumber ?? 'Belum terbit'}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function CardActions({ recap, onDetail, onRecap, onMinutes }: { recap: UpzisVillageRecap } & CardHandlers) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const run = (action: () => void) => { setOpen(false); action(); };

  return (
    <div className="gorut-dropdown" ref={ref}>
      <button type="button" className="gorut-icon-button" onClick={() => setOpen((value) => !value)} aria-label={`Aksi ${recap.village}`} aria-expanded={open}><MoreHorizontal size={16} /></button>
      {open ? (
        <div className="gorut-dropdown-menu">
          <button type="button" onClick={() => run(() => onDetail(recap))}><Eye size={13} />Detail</button>
          {canCreateRecap(recap.status) ? <button type="button" onClick={() => run(() => onRecap(recap))}><LayoutList size={13} />Buat Rekap</button> : null}
          {canPrepareMinutes(recap.status) ? <button type="button" onClick={() => run(() => onMinutes(recap))}><FileText size={13} />Berita Acara</button> : null}
        </div>
      ) : null}
    </div>
  );
}
