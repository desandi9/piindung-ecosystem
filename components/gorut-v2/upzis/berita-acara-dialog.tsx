'use client';

import { FileText } from 'lucide-react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export function BeritaAcaraDialog({ recap, onClose }: { recap: UpzisVillageRecap | null; onClose: () => void }) {
  if (!recap) return null;

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent showCloseButton={false} className="mqw-alert" aria-describedby="ba-note">
        <span className="mqw-alert-icon" aria-hidden="true"><FileText size={22} /></span>
        <DialogTitle className="mqw-alert-title">Berita acara belum dapat dibuat</DialogTitle>
        <DialogDescription id="ba-note" className="mqw-alert-note">
          Format dokumen berita acara masih menunggu ketentuan operasional dari PC LAZISNU. Data rekap di bawah sudah siap dipakai begitu formatnya ditetapkan.
        </DialogDescription>

        <dl className="mqw-summary-list" style={{ marginTop: 18, border: '1px solid var(--g-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div><dt>Periode</dt><dd>{formatPeriodLabel(recap.period)}</dd></div>
          <div><dt>Desa</dt><dd>{recap.village}, {recap.kecamatan}</dd></div>
          <div><dt>Nama Kordes</dt><dd>{recap.kordesName}</dd></div>
          <div><dt>Jumlah PLPK</dt><dd>{formatNumber(recap.plpkCount)} PLPK</dd></div>
          <div><dt>Jumlah Munfiq</dt><dd>{formatNumber(recap.munfiqCount)} Munfiq</dd></div>
          <div><dt>Total Koin</dt><dd>{formatRupiah(recap.totalCollected)}</dd></div>
          <div><dt>Total Upah PLPK</dt><dd>{formatRupiah(recap.totalPlpkFee)}</dd></div>
        </dl>

        <div className="mqw-alert-actions">
          <button type="button" className="mqw-btn mqw-btn-primary" onClick={onClose}>Mengerti</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
