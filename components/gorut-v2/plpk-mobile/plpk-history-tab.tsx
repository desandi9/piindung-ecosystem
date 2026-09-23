'use client';

import { ClipboardList, Inbox, PenLine } from 'lucide-react';

import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatDateShort, formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { collectionStatusLabels, formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

/**
 * Riwayat periode PLPK.
 * Batch berstatus Perlu Koreksi menampilkan catatan Kordes dan pintu masuk perbaikan.
 */
export function PlpkHistoryTab({ batches, onFixCorrection }: { batches: CollectionBatch[]; onFixCorrection: (batchId: string) => void }) {
  return (
    <>
      <header className="plpk-header is-plain">
        <span className="plpk-header-mark" aria-hidden="true"><ClipboardList size={19} /></span>
        <div className="plpk-header-text">
          <strong>Riwayat</strong>
          <span>{formatNumber(batches.length)} periode penjemputan</span>
        </div>
      </header>

      <div className="plpk-scroll">
        {batches.length === 0 ? (
          <div className="plpk-card">
            <div className="plpk-empty">
              <Inbox size={30} aria-hidden="true" />
              <strong>Belum ada riwayat</strong>
              <p>Riwayat penjemputan akan muncul setelah Anda menyelesaikan satu periode.</p>
            </div>
          </div>
        ) : (
          batches.map((batch) => (
            <article key={batch.id} className="plpk-history-card">
              <div className="plpk-history-top">
                <div>
                  <strong>{formatPeriodLabel(batch.period)}</strong>
                  <small>{batch.village} · {batch.kecamatan}</small>
                </div>
                <span className={`plpk-badge is-${batch.status}`}>{collectionStatusLabels[batch.status]}</span>
              </div>

              <dl className="plpk-history-grid">
                <div>
                  <dt>Munfiq Aktif</dt>
                  <dd>{formatNumber(batch.entries.length)}</dd>
                </div>
                <div>
                  <dt>Terjemput</dt>
                  <dd>{formatNumber(batch.collectedCanCount)}</dd>
                </div>
                <div>
                  <dt>Jumlah Kotor</dt>
                  <dd>{formatRupiah(batch.grossAmount)}</dd>
                </div>
                <div>
                  <dt>Bisyaroh</dt>
                  <dd>{formatRupiah(batch.totalPlpkFee)}</dd>
                </div>
                <div>
                  <dt>Dikonfirmasi</dt>
                  <dd>{batch.confirmedByPlpkAt ? formatDateShort(batch.confirmedByPlpkAt) : 'Belum'}</dd>
                </div>
                <div>
                  <dt>Diverifikasi</dt>
                  <dd>{batch.verifiedByKordesAt ? formatDateShort(batch.verifiedByKordesAt) : '—'}</dd>
                </div>
              </dl>

              {batch.status === 'needs-correction' ? (
                <>
                  <div className="plpk-callout" style={{ marginTop: 13 }}>
                    <PenLine size={16} aria-hidden="true" />
                    <span>
                      <strong>Catatan Kordes</strong>
                      {batch.kordesNotes ?? 'Kordes meminta perbaikan pada data penjemputan ini.'}
                    </span>
                  </div>
                  <button type="button" className="plpk-btn plpk-btn-primary" style={{ marginTop: 12 }} onClick={() => onFixCorrection(batch.id)}>
                    Perbaiki Data yang Ditandai
                  </button>
                </>
              ) : null}
            </article>
          ))
        )}
      </div>
    </>
  );
}
