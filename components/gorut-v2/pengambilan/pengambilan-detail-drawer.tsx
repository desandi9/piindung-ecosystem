'use client';

import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatDateShort, formatNumber, formatPhoneNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { collectionStatusLabels, collectionVisitStatusLabels, formatPeriodLabel, isBatchEditable, PLPK_FEE_AMOUNT, PLPK_FEE_THRESHOLD } from '@/features/gorut-v2/pengambilan-options';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function PengambilanDetailDrawer({ open, batch, onClose, onEdit, onComplete, onPreview, onHandover }: { open: boolean; batch: CollectionBatch | null; onClose: () => void; onEdit: () => void; onComplete: () => void; onPreview: () => void; onHandover: () => void }) {
  if (!batch) return null;

  const notCollected = batch.entries.filter((entry) => entry.visitStatus !== 'collected');
  const canComplete = batch.status === 'collecting' || batch.status === 'scheduled';

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent className="gorut-collect-drawer" aria-describedby="collect-detail-description">
        <SheetHeader className="gorut-drawer-header">
          <div>
            <SheetTitle>{formatPeriodLabel(batch.period)}</SheetTitle>
            <SheetDescription id="collect-detail-description">{batch.id.replace('batch-', 'PGB-')} · {batch.plpkName}</SheetDescription>
          </div>
          <span className={`gorut-collect-status is-${batch.status}`}>{collectionStatusLabels[batch.status]}</span>
        </SheetHeader>

        <div className="gorut-drawer-body">
          <Section title="Identitas Penghimpunan">
            <dl>
              <div><dt>Kode Batch</dt><dd>{batch.id.replace('batch-', 'PGB-')}</dd></div>
              <div><dt>Periode</dt><dd>{formatPeriodLabel(batch.period)}</dd></div>
              <div><dt>Petugas PLPK</dt><dd>{batch.plpkName} ({batch.plpkId})</dd></div>
              <div><dt>Kecamatan</dt><dd>{batch.kecamatan}</dd></div>
              <div><dt>Desa</dt><dd>{batch.village}</dd></div>
              <div><dt>Dibuat</dt><dd>{formatDateShort(batch.createdAt)}</dd></div>
              <div><dt>Nama Kordes</dt><dd>{batch.kordesName}</dd></div>
              <div><dt>Status F.009</dt><dd>{batch.documentStatus}</dd></div>
              <div><dt>No. Dokumen</dt><dd>{batch.documentNumber}</dd></div>
              <div><dt>Status Penyerahan</dt><dd>{batch.handoverDestination === 'kordes' ? 'Diserahkan ke Kordes' : 'Belum diserahkan'}</dd></div>
            </dl>
          </Section>

          <Section title="Ringkasan Penghimpunan">
            <div className="gorut-summary-grid">
              <Metric label="Kaleng Aktif" value={formatNumber(batch.activeCanCount)} />
              <Metric label="Kaleng Terjemput" value={formatNumber(batch.collectedCanCount)} />
              <Metric label="Kaleng Tidak Terjemput" value={formatNumber(batch.uncollectedCanCount)} />
              <Metric label="Jumlah Kotor" value={formatRupiah(batch.grossAmount)} />
              <Metric label="Total Upah PLPK" value={formatRupiah(batch.totalPlpkFee)} />
              <Metric label="Jumlah Bersih" value={formatRupiah(batch.netAmount)} />
            </div>
            <p className="gorut-drawer-notes-text" style={{ marginTop: 10 }}>
              Upah PLPK dihitung {formatRupiah(PLPK_FEE_AMOUNT)} untuk setiap Munfiq dengan nominal di atas {formatRupiah(PLPK_FEE_THRESHOLD)}.
            </p>
          </Section>

          <Section title={`Daftar Munfiq (${formatNumber(batch.entries.length)})`}>
            {batch.entries.map((entry) => (
              <div key={entry.id} className="gorut-collect-entry-line">
                <div>
                  <strong>{entry.munfiqName}</strong>
                  <small>{entry.memberId} · {formatPhoneNumber(entry.phone)}</small>
                  <span className={`gorut-collect-visit is-${entry.visitStatus}`} style={{ marginTop: 4 }}>{collectionVisitStatusLabels[entry.visitStatus]}</span>
                </div>
                <div>
                  <strong>{entry.visitStatus === 'collected' ? formatRupiah(entry.amount) : '—'}</strong>
                  <small>{entry.eligibleForPlpkFee ? `Upah ${formatRupiah(entry.plpkFee)}` : 'Tanpa upah'}</small>
                </div>
              </div>
            ))}
          </Section>

          {notCollected.length ? (
            <Section title="Catatan Kunjungan">
              {notCollected.map((entry) => (
                <p key={entry.id} className="gorut-drawer-notes-text" style={{ marginBottom: 6 }}>
                  <strong>{entry.munfiqName}</strong> — {entry.notes || collectionVisitStatusLabels[entry.visitStatus]}
                </p>
              ))}
            </Section>
          ) : null}
        </div>

        <SheetFooter className="gorut-drawer-footer">
          {isBatchEditable(batch) ? <button type="button" className="gorut-button gorut-secondary-button" onClick={onEdit}>Edit Draft</button> : null}
          {canComplete ? <button type="button" className="gorut-button gorut-secondary-button" onClick={onComplete}>Selesaikan Penjemputan</button> : null}
          <button type="button" className="gorut-button gorut-secondary-button" onClick={onPreview}>Lihat F.009</button>
          <button type="button" className="gorut-button gorut-primary-button" onClick={onHandover}>Tandai Diserahkan ke Kordes</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="gorut-drawer-section"><h3>{title}</h3>{children}</section>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="gorut-summary-metric"><small>{label}</small><strong>{value}</strong></div>; }
