'use client';

import { CircleCheckBig, Info, MinusCircle } from 'lucide-react';

import type { CollectionVisitStatus } from '@/features/gorut-v2/types';
import { formatPhoneNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { collectionVisitStatusLabels, PLPK_FEE_AMOUNT, PLPK_FEE_THRESHOLD } from '@/features/gorut-v2/pengambilan-options';

const quickAmounts = [5000, 10000, 20000, 50000];

/** Draft satu baris. amount disimpan sebagai string agar kosong ≠ Rp0. */
export type CollectionEntryDraft = {
  munfiqId: string;
  munfiqName: string;
  memberId: string;
  phone: string;
  address?: string;
  isActive?: boolean;
  canCount?: number;
  amount: string;
  visitStatus: CollectionVisitStatus;
  notes: string;
};

export function parseAmount(value: string): number | null {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return Number(digits);
}

export function formatAmountInput(value: string): string {
  const parsed = parseAmount(value);
  return parsed === null ? '' : parsed.toLocaleString('id-ID');
}

export function CollectionEntryRow({ draft, error, onChange }: { draft: CollectionEntryDraft; error?: string; onChange: (next: CollectionEntryDraft) => void }) {
  const amountId = `entry-amount-${draft.munfiqId}`;
  const statusId = `entry-status-${draft.munfiqId}`;
  const notesId = `entry-notes-${draft.munfiqId}`;
  const errorId = `${amountId}-error`;

  const parsed = parseAmount(draft.amount);
  const isCollected = draft.visitStatus === 'collected';
  const eligible = isCollected && parsed !== null && parsed > PLPK_FEE_THRESHOLD;

  const flag = !isCollected
    ? { className: 'mqw-fee-flag is-skipped', icon: <MinusCircle size={15} />, text: `${collectionVisitStatusLabels[draft.visitStatus]} — tanpa nominal dan tanpa upah` }
    : parsed === null
      ? { className: 'mqw-fee-flag is-empty', icon: <Info size={15} />, text: 'Nominal belum diisi' }
      : eligible
        ? { className: 'mqw-fee-flag is-eligible', icon: <CircleCheckBig size={15} />, text: `Menghasilkan upah PLPK ${formatRupiah(PLPK_FEE_AMOUNT)}` }
        : { className: 'mqw-fee-flag is-below', icon: <Info size={15} />, text: `Belum memenuhi batas lebih dari ${formatRupiah(PLPK_FEE_THRESHOLD)}` };

  return (
    <article className="mqw-entry">
      <div className="mqw-entry-head">
        <div>
          <span className="mqw-entry-name">{draft.munfiqName}</span>
          <span className="mqw-entry-meta">{draft.memberId} · {formatPhoneNumber(draft.phone)}{draft.address ? ` · ${draft.address}` : ''}</span>
        </div>
      </div>

      <div className="mqw-entry-grid">
        <div className="mqw-field">
          <label className="mqw-label" htmlFor={statusId}>Hasil Kunjungan</label>
          <select
            id={statusId}
            className="mqw-input"
            value={draft.visitStatus}
            onChange={(event) => {
              const visitStatus = event.target.value as CollectionVisitStatus;
              onChange({ ...draft, visitStatus, amount: visitStatus === 'collected' ? draft.amount : '' });
            }}
          >
            {(Object.keys(collectionVisitStatusLabels) as CollectionVisitStatus[]).map((status) => <option key={status} value={status}>{collectionVisitStatusLabels[status]}</option>)}
          </select>
        </div>

        <div className="mqw-field">
          <label className="mqw-label" htmlFor={amountId}>Nominal Koin</label>
          <div className="mqw-money">
            <span className="mqw-money-prefix" aria-hidden="true">Rp</span>
            <input
              id={amountId}
              className="mqw-input"
              inputMode="numeric"
              value={formatAmountInput(draft.amount)}
              disabled={!isCollected}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => onChange({ ...draft, amount: event.target.value })}
              placeholder={isCollected ? '0' : 'Tidak ada nominal'}
            />
          </div>
          {error ? <span id={errorId} className="mqw-error" role="alert">{error}</span> : null}
          {isCollected ? (
            <div className="mqw-quick">
              {quickAmounts.map((amount) => (
                <button key={amount} type="button" onClick={() => onChange({ ...draft, amount: String(amount) })}>
                  {formatRupiah(amount)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className={flag.className}>{flag.icon}{flag.text}</div>

      <div className="mqw-field" style={{ marginTop: 14 }}>
        <label className="mqw-label" htmlFor={notesId}><span>Catatan</span><span className="mqw-hint">Wajib jika tidak terjemput</span></label>
        <textarea id={notesId} className="mqw-input" rows={2} value={draft.notes} onChange={(event) => onChange({ ...draft, notes: event.target.value })} placeholder="Contoh: koin diambil di rumah tetangga." />
      </div>
    </article>
  );
}
