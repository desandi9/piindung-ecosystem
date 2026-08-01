'use client';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatDateShort, formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel, PLPK_FEE_AMOUNT, PLPK_FEE_THRESHOLD } from '@/features/gorut-v2/pengambilan-options';
import { canCreateRecap, canPrepareMinutes, upzisStatusLabels } from '@/features/gorut-v2/upzis-options';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function UpzisDetailDrawer({ open, recap, onClose, onRecap, onMinutes }: { open: boolean; recap: UpzisVillageRecap | null; onClose: () => void; onRecap: () => void; onMinutes: () => void }) {
  if (!recap) return null;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent className="gorut-collect-drawer" aria-describedby="upzis-detail-description">
        <SheetHeader className="gorut-drawer-header">
          <div>
            <SheetTitle>{recap.village}</SheetTitle>
            <SheetDescription id="upzis-detail-description">{formatPeriodLabel(recap.period)} · {recap.kecamatan}</SheetDescription>
          </div>
          <span className={`gorut-upzis-status is-${recap.status}`}>{upzisStatusLabels[recap.status]}</span>
        </SheetHeader>

        <div className="gorut-drawer-body">
          <Section title="Identitas Rekap">
            <dl>
              <div><dt>Periode</dt><dd>{formatPeriodLabel(recap.period)}</dd></div>
              <div><dt>Desa</dt><dd>{recap.village}</dd></div>
              <div><dt>Kecamatan</dt><dd>{recap.kecamatan}</dd></div>
              <div><dt>Nama Kordes</dt><dd>{recap.kordesName}</dd></div>
              <div><dt>Berita Acara</dt><dd>{recap.minutesNumber ?? 'Belum terbit'}</dd></div>
              <div><dt>Direkap</dt><dd>{recap.recappedAt ? formatDateShort(recap.recappedAt) : 'Belum direkap'}</dd></div>
            </dl>
          </Section>

          <Section title="Ringkasan Desa">
            <div className="gorut-summary-grid">
              <Metric label="Total Koin" value={formatRupiah(recap.totalCollected)} />
              <Metric label="Jumlah Munfiq" value={`${formatNumber(recap.munfiqCount)} Munfiq`} />
              <Metric label="Total Upah PLPK" value={formatRupiah(recap.totalPlpkFee)} />
            </div>
          </Section>

          <Section title={`Rincian per PLPK (${formatNumber(recap.plpkCount)})`}>
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
            <p className="gorut-drawer-notes-text" style={{ marginTop: 10 }}>
              Upah PLPK {formatRupiah(PLPK_FEE_AMOUNT)} berlaku untuk setiap Munfiq dengan nominal di atas {formatRupiah(PLPK_FEE_THRESHOLD)}.
            </p>
          </Section>
        </div>

        <SheetFooter className="gorut-drawer-footer">
          {canCreateRecap(recap.status) ? <button type="button" className="gorut-button gorut-secondary-button" onClick={onRecap}>Buat Rekap</button> : null}
          {canPrepareMinutes(recap.status) ? <button type="button" className="gorut-button gorut-secondary-button" onClick={onMinutes}>Siapkan Berita Acara</button> : null}
          <button type="button" className="gorut-button gorut-primary-button" onClick={onClose}>Tutup</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="gorut-drawer-section"><h3>{title}</h3>{children}</section>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="gorut-summary-metric"><small>{label}</small><strong>{value}</strong></div>; }
