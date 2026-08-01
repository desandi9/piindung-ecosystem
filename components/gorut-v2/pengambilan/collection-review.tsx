'use client';

import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { collectionVisitStatusLabels, formatPeriodLabel, PLPK_FEE_AMOUNT, PLPK_FEE_THRESHOLD } from '@/features/gorut-v2/pengambilan-options';

import { parseAmount, type CollectionEntryDraft } from './collection-entry-row';

export type CollectionReviewInfo = {
  period: string;
  plpkName: string;
  plpkId: string;
  kecamatan: string;
  village: string;
  collectedAt: string;
};

export function CollectionReview({ info, entries }: { info: CollectionReviewInfo; entries: CollectionEntryDraft[] }) {
  const collected = entries.filter((entry) => entry.visitStatus === 'collected');
  const totalCoin = collected.reduce((sum, entry) => sum + (parseAmount(entry.amount) ?? 0), 0);
  const eligible = collected.filter((entry) => (parseAmount(entry.amount) ?? 0) > PLPK_FEE_THRESHOLD);
  const notEligible = entries.length - eligible.length;
  const totalFee = eligible.length * PLPK_FEE_AMOUNT;

  return (
    <>
      <section className="mqw-summary">
        <div className="mqw-summary-head"><h3>Informasi Penghimpunan</h3></div>
        <dl className="mqw-summary-list">
          <div><dt>Periode</dt><dd>{formatPeriodLabel(info.period)}</dd></div>
          <div><dt>Petugas PLPK</dt><dd>{info.plpkName} ({info.plpkId})</dd></div>
          <div><dt>Kecamatan</dt><dd>{info.kecamatan}</dd></div>
          <div><dt>Desa</dt><dd>{info.village}</dd></div>
          <div><dt>Tanggal Pengambilan</dt><dd>{info.collectedAt || '—'}</dd></div>
          <div><dt>Jumlah Munfiq</dt><dd>{formatNumber(entries.length)} Munfiq</dd></div>
        </dl>
      </section>

      <section className="mqw-summary">
        <div className="mqw-summary-head"><h3>Hasil Penghimpunan</h3></div>
        <dl className="mqw-summary-list">
          <div><dt>Total Koin</dt><dd>{formatRupiah(totalCoin)}</dd></div>
          <div><dt>Memenuhi Syarat Upah</dt><dd>{formatNumber(eligible.length)} Munfiq</dd></div>
          <div><dt>Tidak Memenuhi Syarat</dt><dd>{formatNumber(notEligible)} Munfiq</dd></div>
          <div><dt>Total Upah PLPK</dt><dd>{formatRupiah(totalFee)}</dd></div>
        </dl>
      </section>

      <section className="mqw-summary">
        <div className="mqw-summary-head"><h3>Rincian per Munfiq</h3></div>
        <div style={{ padding: 4 }}>
          {entries.map((entry) => {
            const parsed = parseAmount(entry.amount);
            const isCollected = entry.visitStatus === 'collected';
            const entryEligible = isCollected && parsed !== null && parsed > PLPK_FEE_THRESHOLD;
            return (
              <div key={entry.munfiqId} className="gorut-collect-entry-line">
                <div>
                  <strong>{entry.munfiqName}</strong>
                  <small>{entry.memberId}</small>
                  {!isCollected ? <span className={`gorut-collect-visit is-${entry.visitStatus}`} style={{ marginTop: 4 }}>{collectionVisitStatusLabels[entry.visitStatus]}</span> : null}
                </div>
                <div>
                  <strong>{isCollected && parsed !== null ? formatRupiah(parsed) : '—'}</strong>
                  <small>{entryEligible ? `Upah ${formatRupiah(PLPK_FEE_AMOUNT)}` : 'Tanpa upah'}</small>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mqw-footnote" style={{ marginTop: 16 }}>
        Upah PLPK {formatRupiah(PLPK_FEE_AMOUNT)} berlaku untuk setiap Munfiq dengan nominal di atas {formatRupiah(PLPK_FEE_THRESHOLD)}.
      </p>
    </>
  );
}
