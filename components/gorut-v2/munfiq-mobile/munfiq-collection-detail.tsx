'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, CircleAlert, MapPin, UserRound, X } from 'lucide-react';
import { collectionFact, munfiqDate, recordedOwnAmount, type MunfiqCollection } from '@/features/gorut-v2/munfiq-presentation';
import { MunfiqAmount, MunfiqLoading, MunfiqStatus } from './munfiq-history-primitives';
import { munfiqFont } from './munfiq-font';

export function MunfiqCollectionDetail({ open, onClose, item, loading, error, onRetry }: {
  open: boolean; onClose: () => void; item: MunfiqCollection | null; loading: boolean; error: string; onRetry: () => void;
}) {
  const recorded = item && !collectionFact(item, 'pending') ? collectionFact(item, 'recorded') : undefined;
  const isHistory = Boolean(recorded);
  return <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="mq-sheet-overlay mq-pickup-detail-overlay" />
      <Dialog.Content className={`mq-sheet mq-pickup-detail ${isHistory ? 'mq-pickup-history-dialog' : ''} ${munfiqFont.variable}`} onCloseAutoFocus={(event) => {
        // Openers remain in the page; Radix otherwise has no Trigger to restore focus to.
        event.preventDefault();
        document.querySelector<HTMLElement>('[data-mq-last-open="true"]')?.focus();
      }}>
        {!isHistory ? <span className="mq-sheet-handle" aria-hidden="true" /> : null}
        <div className="mq-pickup-detail-head">
          <div><span className="mq-pickup-detail-eyebrow">{isHistory ? 'Rincian Riwayat' : 'Detail Penjemputan'}</span><Dialog.Title className="mq-sheet-title">{item ? munfiqDate(item.periodStart, 'period') : 'Rincian penjemputan'}</Dialog.Title></div>
          <Dialog.Close className="mq-icon-button mq-sheet-close" aria-label="Tutup rincian"><X size={18} aria-hidden="true" /></Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">Catatan penjemputan dan nominal infak milik Anda.</Dialog.Description>
        {loading ? <MunfiqLoading /> : error ? <div className="mq-error" role="alert"><p>{error}</p><button type="button" onClick={onRetry}>Coba lagi</button></div> : item ? <>
          <div className="mq-pickup-detail-summary">
            <div><span>Status Penjemputan</span><MunfiqStatus item={item} /></div>
            {recordedOwnAmount(item) ? <div><span>Nominal Koin Tercatat</span><MunfiqAmount item={item} /></div> : null}
          </div>
          {isHistory ? <>
            <dl className="mq-pickup-history-facts"><div><dt>Tanggal Pencatatan</dt><dd>{munfiqDate(recorded!.at)}</dd></div><div><dt>Petugas Pelaksana</dt><dd>PLPK {item.historicalPlpk.name}</dd></div></dl>
            <div className="mq-pickup-accountability"><span>Catatan Akuntabilitas</span><p>Infak Anda telah dicatat oleh PLPK. Status terakhir: {item.status ?? 'Infak tercatat'}.{item.statusAt ? ` Diperbarui ${munfiqDate(item.statusAt, 'time')} WIB.` : ''}</p></div>
          </> : <><div className="mq-pickup-detail-list">
            <div className="mq-pickup-detail-fact"><CalendarDays size={20} aria-hidden="true" /><div><span>Waktu &amp; Tanggal</span><strong>Belum tersedia</strong><p>Jadwal penjemputan belum tersedia.</p></div></div>
            <div className="mq-pickup-detail-fact"><MapPin size={20} aria-hidden="true" /><div><span>Wilayah Munfiq</span><strong>{item.location.ranting}</strong><p>{item.location.kecamatan}</p></div></div>
            <div className="mq-pickup-detail-fact"><UserRound size={20} aria-hidden="true" /><div><span>Petugas PLPK pada Riwayat</span><strong>{item.historicalPlpk.name}</strong><p>{item.historicalPlpk.code}</p></div></div>
          </div>
          <p className="mq-pickup-policy"><CircleAlert size={20} aria-hidden="true" /><span><strong>Amanah Transparan:</strong> nominal penjemputan tidak diestimasi dan tidak ditampilkan sebelum penghitungan riil dicatat oleh PLPK.</span></p></>}
          <div className="mq-pickup-detail-actions"><Dialog.Close>Tutup</Dialog.Close></div>
        </> : null}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
