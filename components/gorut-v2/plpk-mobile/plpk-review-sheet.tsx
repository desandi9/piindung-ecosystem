'use client';

import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { canConfirmCollection, collectionVisitStatusLabels, formatPeriodLabel, incompleteEntries } from '@/features/gorut-v2/pengambilan-options';

/**
 * Layar Review sebelum konfirmasi.
 *
 * F.009 tidak ditampilkan di sini: dokumen dibuat otomatis oleh sistem setelah
 * konfirmasi dan hanya dibuka Kordes/admin.
 */
export function PlpkReviewSheet({ batch, onClose, onConfirm }: { batch: CollectionBatch; onClose: () => void; onConfirm: () => void }) {
  const incomplete = incompleteEntries(batch);
  const ready = canConfirmCollection(batch);
  const isResubmission = batch.status === 'needs-correction';

  return (
    <div className="plpk-sheet" role="dialog" aria-modal="true" aria-label="Periksa hasil penjemputan">
      <header className="plpk-header is-plain">
        <button type="button" className="plpk-back" onClick={onClose} aria-label="Kembali ke daftar Munfiq">
          <ArrowLeft size={20} />
        </button>
        <div className="plpk-header-text">
          <strong>Periksa Hasil</strong>
          <span>{formatPeriodLabel(batch.period)} · {batch.village}</span>
        </div>
      </header>

      <div className="plpk-scroll has-footer">
        <section className="plpk-card" aria-label="Ringkasan kunjungan">
          <div className="plpk-review-row">
            <span>Munfiq aktif</span>
            <strong>{formatNumber(batch.entries.length)}</strong>
          </div>
          <div className="plpk-review-row">
            <span>Terjemput</span>
            <strong>{formatNumber(batch.collectedCanCount)}</strong>
          </div>
          <div className="plpk-review-row">
            <span>Tidak terjemput</span>
            <strong>{formatNumber(batch.uncollectedCanCount)}</strong>
          </div>
          <div className="plpk-review-row">
            <span>Belum dikunjungi</span>
            <strong>{formatNumber(batch.pendingCount)}</strong>
          </div>
        </section>

        <section className="plpk-card" aria-label="Ringkasan nominal">
          <div className="plpk-review-row">
            <span>Jumlah kotor</span>
            <strong>{formatRupiah(batch.grossAmount)}</strong>
          </div>
          <div className="plpk-review-row">
            <span>Bisyaroh PLPK</span>
            <strong>{formatRupiah(batch.totalPlpkFee)}</strong>
          </div>
          <div className="plpk-review-row is-total">
            <span>Jumlah bersih</span>
            <strong>{formatRupiah(batch.netAmount)}</strong>
          </div>
        </section>

        {incomplete.length ? (
          <>
            <h2 className="plpk-section-title">Data Belum Lengkap ({formatNumber(incomplete.length)})</h2>
            <ul className="plpk-todo">
              {incomplete.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.munfiqName}</span>
                  <small>
                    {entry.visitStatus === 'pending' ? collectionVisitStatusLabels.pending : 'Catatan belum diisi'}
                  </small>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <div style={{ marginTop: 16 }}>
          {ready ? (
            <div className="plpk-warning">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>Setelah dikonfirmasi, data akan dikunci dan otomatis dikirim kepada Kordes untuk diverifikasi.</span>
            </div>
          ) : (
            <div className="plpk-callout">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                <strong>Belum dapat dikonfirmasi</strong>
                Seluruh Munfiq harus memiliki hasil kunjungan yang lengkap sebelum penjemputan dikonfirmasi.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="plpk-footer">
        <button type="button" className="plpk-btn plpk-btn-primary" onClick={onConfirm} disabled={!ready}>
          <CheckCircle2 size={17} aria-hidden="true" />
          {isResubmission ? 'Kirim Ulang ke Kordes' : 'Konfirmasi Penjemputan Selesai'}
        </button>
      </div>
    </div>
  );
}
