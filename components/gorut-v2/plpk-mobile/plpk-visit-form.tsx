'use client';

import { AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { CollectionBatch, CollectionEntry, CollectionVisitOutcome } from '@/features/gorut-v2/types';
import { formatPhoneNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import {
  calculatePlpkFee,
  collectionVisitOutcomes,
  collectionVisitStatusLabels,
  isEligibleForPlpkFee,
  isEntryEditable,
  normalizeAmount,
  parseAmount,
  quickAmountOptions,
  requiresNotes,
} from '@/features/gorut-v2/pengambilan-options';

/**
 * Form hasil kunjungan satu Munfiq.
 *
 * Aturan yang dijaga di sini:
 * - hanya status Terjemput yang boleh punya nominal;
 * - status selain Terjemput wajib catatan;
 * - nominal non-Terjemput otomatis menjadi 0.
 */
export function PlpkVisitForm({
  batch,
  entry,
  onClose,
  onSave,
}: {
  batch: CollectionBatch;
  entry: CollectionEntry;
  onClose: () => void;
  onSave: (entry: CollectionEntry, mode: 'save' | 'next') => void;
}) {
  const editable = isEntryEditable(batch, entry.id);
  /** Status pending tidak boleh jadi hasil akhir, jadi form dibuka dengan Terjemput. */
  const [status, setStatus] = useState<CollectionVisitOutcome>(entry.visitStatus === 'pending' ? 'collected' : entry.visitStatus);
  const [amount, setAmount] = useState(entry.visitStatus === 'collected' && entry.amount ? String(entry.amount) : '');
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [error, setError] = useState('');

  const parsedAmount = parseAmount(amount);
  const needsNotes = requiresNotes(status);
  const hasMorePending = useMemo(
    () => batch.entries.some((item) => item.id !== entry.id && item.visitStatus === 'pending'),
    [batch.entries, entry.id],
  );

  const selectStatus = (next: CollectionVisitOutcome) => {
    setStatus(next);
    setError('');
    /** Nominal non-Terjemput dipaksa 0, jadi isian nominal dibersihkan. */
    if (next !== 'collected') setAmount('');
  };

  const build = (): CollectionEntry | null => {
    if (status === 'collected') {
      if (parsedAmount === null) {
        setError('Nominal belum diisi. Isi nominal atau ubah hasil kunjungan.');
        return null;
      }
      if (parsedAmount <= 0) {
        setError('Nominal harus lebih dari Rp0 untuk status Terjemput.');
        return null;
      }
    }
    if (needsNotes && !notes.trim()) {
      setError(`Catatan wajib diisi untuk status ${collectionVisitStatusLabels[status]}.`);
      return null;
    }

    const finalAmount = normalizeAmount(parsedAmount ?? 0, status);
    return {
      ...entry,
      amount: finalAmount,
      visitStatus: status,
      collectedAt: new Date().toISOString().slice(0, 10),
      eligibleForPlpkFee: isEligibleForPlpkFee(finalAmount, status),
      plpkFee: calculatePlpkFee(finalAmount, status),
      notes: notes.trim() || undefined,
    };
  };

  const submit = (mode: 'save' | 'next') => {
    const next = build();
    if (next) onSave(next, mode);
  };

  return (
    <div className="plpk-sheet" role="dialog" aria-modal="true" aria-label={`Hasil kunjungan ${entry.munfiqName}`}>
      <header className="plpk-header is-plain">
        <button type="button" className="plpk-back" onClick={onClose} aria-label="Kembali ke daftar Munfiq">
          <ArrowLeft size={20} />
        </button>
        <div className="plpk-header-text">
          <strong>Hasil Kunjungan</strong>
          <span>{entry.canCode}</span>
        </div>
      </header>

      <div className={editable ? 'plpk-scroll has-footer' : 'plpk-scroll'} style={{ paddingBottom: editable ? undefined : 24 }}>
        {!editable ? (
          <div className="plpk-warning" style={{ marginBottom: 14 }}>
            <Lock size={16} aria-hidden="true" />
            <span>
              {batch.status === 'needs-correction'
                ? 'Munfiq ini tidak ditandai Kordes, jadi datanya tidak dapat diubah.'
                : 'Data sudah dikunci setelah penjemputan dikonfirmasi.'}
            </span>
          </div>
        ) : null}

        <section className="plpk-card" aria-label="Identitas Munfiq">
          <dl className="plpk-detail-list">
            <div className="is-wide">
              <dt>Nama Munfiq</dt>
              <dd>{entry.munfiqName}</dd>
            </div>
            <div>
              <dt>Kode Kaleng</dt>
              <dd>{entry.canCode}</dd>
            </div>
            <div>
              <dt>Nomor HP</dt>
              <dd>{formatPhoneNumber(entry.phone)}</dd>
            </div>
            <div className="is-wide">
              <dt>Alamat</dt>
              <dd>{entry.address}</dd>
            </div>
            <div>
              <dt>RT/RW</dt>
              <dd>RT {entry.rt} / RW {entry.rw}</dd>
            </div>
            <div>
              <dt>Status Kunjungan</dt>
              <dd>{collectionVisitStatusLabels[entry.visitStatus]}</dd>
            </div>
          </dl>
        </section>

        <h2 className="plpk-section-title">Hasil Kunjungan</h2>
        <div className="plpk-options" role="group" aria-label="Pilih hasil kunjungan">
          {collectionVisitOutcomes.map((outcome) => (
            <button
              key={outcome}
              type="button"
              className="plpk-option"
              aria-pressed={status === outcome}
              disabled={!editable}
              onClick={() => selectStatus(outcome)}
            >
              <i aria-hidden="true"><b /></i>
              {collectionVisitStatusLabels[outcome]}
            </button>
          ))}
        </div>

        <h2 className="plpk-section-title">Nominal</h2>
        <label className="plpk-field">
          <span>Nominal koin {status === 'collected' ? <em className="plpk-req" aria-hidden="true">*</em> : null}</span>
          <div className="plpk-money">
            <span className="plpk-money-prefix" aria-hidden="true">Rp</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              value={status === 'collected' ? amount : '0'}
              disabled={!editable || status !== 'collected'}
              aria-describedby="plpk-amount-hint"
              onChange={(event) => {
                const digits = event.target.value.replace(/[^\d]/g, '');
                setAmount(digits);
                setError('');
              }}
              placeholder="0"
            />
          </div>
        </label>

        <div className="plpk-quick" role="group" aria-label="Pilihan nominal cepat">
          {quickAmountOptions.map((value) => (
            <button
              key={value}
              type="button"
              disabled={!editable || status !== 'collected'}
              onClick={() => { setAmount(String(value)); setError(''); }}
            >
              {formatRupiah(value).replace('Rp', '')}
            </button>
          ))}
        </div>

        <p className="plpk-hint" id="plpk-amount-hint">
          {status === 'collected'
            ? 'Nominal hanya dapat diisi untuk status Terjemput.'
            : 'Status selain Terjemput otomatis bernilai Rp0.'}
        </p>

        <h2 className="plpk-section-title">Catatan</h2>
        <label className="plpk-field">
          <span>Catatan kunjungan {needsNotes ? <em className="plpk-req" aria-hidden="true">*</em> : null}</span>
          <textarea
            className="plpk-textarea"
            value={notes}
            disabled={!editable}
            onChange={(event) => { setNotes(event.target.value); setError(''); }}
            placeholder={needsNotes ? 'Jelaskan alasan koin tidak terjemput' : 'Opsional'}
          />
        </label>
        {needsNotes ? <p className="plpk-hint">Catatan wajib untuk status selain Terjemput.</p> : null}

        {error ? (
          <p className="plpk-error" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>

      {editable ? (
        <div className="plpk-footer">
          <button type="button" className="plpk-btn plpk-btn-primary plpk-btn-block" onClick={() => submit('save')}>
            Simpan Hasil
          </button>
          {hasMorePending ? (
            <button type="button" className="plpk-btn plpk-btn-quiet plpk-btn-block" onClick={() => submit('next')}>
              Simpan dan Lanjut Munfiq Berikutnya
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
