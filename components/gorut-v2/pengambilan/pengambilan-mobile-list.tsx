'use client';

import { Eye, MoreHorizontal, PackageCheck, PenLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { collectionStatusLabels, formatPeriodLabel, isBatchEditable } from '@/features/gorut-v2/pengambilan-options';

type CardHandlers = {
  onDetail: (batch: CollectionBatch) => void;
  onEdit: (batch: CollectionBatch) => void;
  onPreview: (batch: CollectionBatch) => void;
  onHandover: (batch: CollectionBatch) => void;
};

export function PengambilanMobileList({ batches, onDetail, onEdit, onPreview, onHandover }: { batches: CollectionBatch[] } & CardHandlers) {
  return (
    <div className="gorut-collect-mobile-list">
      {batches.map((batch) => (
        <article key={batch.id}>
          <div className="gorut-collect-card-top">
            <button type="button" onClick={() => onDetail(batch)} aria-label={`Lihat detail penghimpunan ${batch.plpkName}`} style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }}>
              <strong>{formatPeriodLabel(batch.period)}</strong>
              <small>{batch.plpkName} · {batch.village}</small>
            </button>
            <CardActions batch={batch} onDetail={onDetail} onEdit={onEdit} onPreview={onPreview} onHandover={onHandover} />
          </div>

          <div className="gorut-munfiq-card-middle">
            <span className={`gorut-collect-status is-${batch.status}`}>{collectionStatusLabels[batch.status]}</span>
            <span className="gorut-collect-amount">{formatRupiah(batch.netAmount)}</span>
          </div>

          <dl>
            <div><dt>Kecamatan</dt><dd>{batch.kecamatan}</dd></div>
            <div><dt>Jumlah Munfiq</dt><dd>{formatNumber(batch.entries.length)} Munfiq</dd></div>
            <div><dt>Memenuhi Syarat</dt><dd>{formatNumber(batch.eligibleMunfiqCount)} Munfiq</dd></div>
            <div><dt>Upah PLPK</dt><dd>{formatRupiah(batch.totalPlpkFee)}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function CardActions({ batch, onDetail, onEdit, onPreview, onHandover }: { batch: CollectionBatch } & CardHandlers) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const run = (action: () => void) => { setOpen(false); action(); };

  return (
    <div className="gorut-dropdown" ref={ref}>
      <button type="button" className="gorut-icon-button" onClick={() => setOpen((value) => !value)} aria-label={`Aksi ${batch.plpkName}`} aria-expanded={open}><MoreHorizontal size={16} /></button>
      {open ? (
        <div className="gorut-dropdown-menu">
          <button type="button" onClick={() => run(() => onDetail(batch))}><Eye size={13} />Detail</button>
          {isBatchEditable(batch) ? <button type="button" onClick={() => run(() => onEdit(batch))}><PenLine size={13} />Edit Draft</button> : null}
          <button type="button" onClick={() => run(() => onPreview(batch))}><Eye size={13} />Lihat F.009</button>
          <button type="button" onClick={() => run(() => onHandover(batch))}><PackageCheck size={13} />Diserahkan ke Kordes</button>
        </div>
      ) : null}
    </div>
  );
}
