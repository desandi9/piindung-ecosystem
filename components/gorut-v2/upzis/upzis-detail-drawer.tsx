'use client';

import { X } from 'lucide-react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatDateShort, formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel, PLPK_FEE_AMOUNT, PLPK_FEE_THRESHOLD } from '@/features/gorut-v2/pengambilan-options';
import { canCreateRecap, canPrepareMinutes, upzisStatusLabels } from '@/features/gorut-v2/upzis-options';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export function UpzisDetailDrawer({ open, recap, onClose, onRecap, onMinutes }: { open: boolean; recap: UpzisVillageRecap | null; onClose: () => void; onRecap: () => void; onMinutes: () => void }) {
  if (!recap) return null;
  const netAmount = recap.totalCollected - recap.totalPlpkFee;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent showCloseButton={false} overlayClassName="upzis-verification-modal-backdrop" className="upzis-verification-modal" aria-describedby="upzis-detail-description">
        <header className="upzis-verification-modal-header">
          <div className="upzis-verification-modal-heading">
            <DialogTitle>{recap.village}</DialogTitle>
            <DialogDescription id="upzis-detail-description">{formatPeriodLabel(recap.period)} · {recap.kecamatan}</DialogDescription>
          </div>
          <div className="upzis-verification-modal-header-actions">
            <span className={`gorut-upzis-status is-${recap.status}`}>{upzisStatusLabels[recap.status]}</span>
            <DialogClose asChild>
              <button type="button" className="upzis-verification-modal-close" aria-label="Tutup detail rekap" title="Tutup detail rekap"><X size={19} /></button>
            </DialogClose>
          </div>
        </header>

        <div className="upzis-verification-modal-body">
          <Section title="Identitas Rekap">
            <dl className="upzis-verification-identity-grid">
              <div><dt>Periode</dt><dd>{formatPeriodLabel(recap.period)}</dd></div>
              <div><dt>Desa</dt><dd>{recap.village}</dd></div>
              <div><dt>Kecamatan</dt><dd>{recap.kecamatan}</dd></div>
              <div><dt>Nama Kordes</dt><dd>{recap.kordesName}</dd></div>
              <div><dt>Berita Acara</dt><dd>{recap.minutesNumber ?? 'Belum terbit'}</dd></div>
              <div><dt>Direkap</dt><dd>{recap.recappedAt ? formatDateShort(recap.recappedAt) : 'Belum direkap'}</dd></div>
            </dl>
          </Section>

          <Section title="Ringkasan Desa">
            <div className="gorut-summary-grid upzis-verification-modal-summary">
              <Metric label="Total Koin" value={formatRupiah(recap.totalCollected)} />
              <Metric label="Jumlah Munfiq" value={`${formatNumber(recap.munfiqCount)} Munfiq`} />
              <Metric label="Total Upah PLPK" value={formatRupiah(recap.totalPlpkFee)} />
              <Metric label="Jumlah Bersih" value={formatRupiah(netAmount)} highlighted />
            </div>
          </Section>

          <Section title={`Rincian per PLPK (${formatNumber(recap.plpkCount)})`}>
            <div className="upzis-verification-breakdown-grid">
              {recap.plpkBreakdown.map((item) => (
                <div key={item.plpkId} className="gorut-upzis-breakdown">
                  <div className="gorut-upzis-breakdown-head">
                    <strong>{item.plpkName}</strong>
                    <span>{item.plpkId}</span>
                  </div>
                  <dl>
                    <div><dt>Jumlah Munfiq</dt><dd>{formatNumber(item.munfiqCount)} Munfiq</dd></div>
                    <div><dt>Total Koin</dt><dd>{formatRupiah(item.totalCollected)}</dd></div>
                    <div><dt>Munfiq Memenuhi Syarat</dt><dd>{formatNumber(item.eligibleMunfiqCount)} Munfiq</dd></div>
                    <div><dt>Upah PLPK</dt><dd>{formatRupiah(item.totalPlpkFee)}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Informasi Formula / Upah">
            <p className="gorut-drawer-notes-text upzis-verification-formula-note">
              Upah PLPK {formatRupiah(PLPK_FEE_AMOUNT)} berlaku untuk setiap Munfiq dengan nominal di atas {formatRupiah(PLPK_FEE_THRESHOLD)}.
            </p>
          </Section>
        </div>

        <footer className="upzis-verification-modal-footer">
          <DialogClose asChild><button type="button" className="gorut-button gorut-secondary-button">Tutup</button></DialogClose>
          <div className="upzis-verification-modal-primary-actions">
            {canCreateRecap(recap.status) ? <button type="button" className="gorut-button gorut-primary-button" onClick={onRecap}>Buat Rekap</button> : null}
            {canPrepareMinutes(recap.status) ? <button type="button" className="gorut-button gorut-primary-button" onClick={onMinutes}>Siapkan Berita Acara</button> : null}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="gorut-drawer-section upzis-verification-modal-section"><h3>{title}</h3>{children}</section>; }
function Metric({ label, value, highlighted = false }: { label: string; value: string; highlighted?: boolean }) { return <div className={`gorut-summary-metric ${highlighted ? 'is-highlighted' : ''}`}><small>{label}</small><strong>{value}</strong></div>; }
