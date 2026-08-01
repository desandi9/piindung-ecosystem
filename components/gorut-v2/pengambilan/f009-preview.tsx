'use client';

import Image from 'next/image';
import { useRef } from 'react';
import type { CollectionBatch, CollectionEntry, CollectionVisitStatus } from '@/features/gorut-v2/types';
import { formatDateShort, formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

const f009VisitStatusLabels: Record<CollectionVisitStatus, string> = {
  collected: 'Terjemput',
  'not-around': 'Tidak Terjemput',
  'not-ready': 'Belum Tersedia',
  declined: 'Menolak/Berhenti',
  'damaged-lost': 'Kaleng Rusak/Hilang',
};

function getCanCode(entry: CollectionEntry) {
  return entry.id.replace(/^entry-/, 'KLG-').toUpperCase();
}

function getRtRw(address?: string) {
  const rt = address?.match(/RT\s*\.?\s*(\d+)/i)?.[1] ?? '—';
  const rw = address?.match(/RW\s*\.?\s*(\d+)/i)?.[1] ?? '—';
  return { rt, rw };
}

export function F009Preview({ batch, onClose }: { batch: CollectionBatch | null; onClose: () => void }) {
  const documentRef = useRef<HTMLElement>(null);
  if (!batch) return null;

  const printDocument = () => {
    const markup = documentRef.current?.outerHTML;
    if (!markup) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    const printWindow = iframe.contentWindow;
    const printDocument = iframe.contentDocument;
    if (!printWindow || !printDocument) {
      iframe.remove();
      return;
    }
    printDocument.open();
    printDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>F.009 - ${batch.documentNumber}</title><style>${F009_PRINT_CSS}</style></head><body>${markup}</body></html>`);
    printDocument.close();
    const images = Array.from(printDocument.images);
    Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.onload = () => resolve(); image.onerror = () => resolve(); }))).then(() => {
      printWindow.focus();
      printWindow.print();
      window.setTimeout(() => iframe.remove(), 1000);
    });
  };

  return (
    <div className="f009-modal" role="dialog" aria-modal="true" aria-label="Preview F.009">
      <div className="f009-toolbar">
        <strong>Preview F.009</strong>
        <div>
          <button type="button" className="gorut-button gorut-secondary-button" onClick={printDocument}>Cetak</button>
          <button type="button" className="gorut-button gorut-primary-button" onClick={onClose}>Tutup</button>
        </div>
      </div>
      <article ref={documentRef} className="f009-page">
        <Image className="f009-watermark" src="/logo koin nu.png" alt="" width={420} height={420} aria-hidden="true" />
        <div className="f009-doc-number"><span>No. Dokumen</span><strong>{batch.documentNumber}</strong></div>
        <header className="f009-header">
          <Image src="/logo untuk berkas gorut.png" alt="Logo resmi GORUT" width={250} height={193} priority />
          <strong>{batch.formCode}</strong>
          <h1>LEMBAR PENERIMAAN KOIN NU</h1>
        </header>
        <dl className="f009-identity">
          <div><dt>Nama PLPK</dt><dd>{batch.plpkName}</dd></div>
          <div><dt>ID PLPK</dt><dd>{batch.plpkId}</dd></div>
          <div><dt>Periode</dt><dd>{formatPeriodLabel(batch.period)}</dd></div>
          <div><dt>Kecamatan</dt><dd>{batch.kecamatan}</dd></div>
          <div><dt>Desa/Ranting</dt><dd>{batch.village}</dd></div>
          <div><dt>Nama Kordes</dt><dd>{batch.kordesName}</dd></div>
          <div><dt>Tanggal Penjemputan</dt><dd>{formatDateShort(batch.entries[0]?.collectedAt ?? batch.createdAt)}</dd></div>
          <div><dt>Status Dokumen</dt><dd>{batch.documentStatus}</dd></div>
        </dl>
        <table className="f009-table">
          <thead>
            <tr>
              <th rowSpan={2}>No.</th>
              <th rowSpan={2}>Nama Lengkap</th>
              <th rowSpan={2}>Kode Kaleng</th>
              <th colSpan={2} className="is-center">Alamat</th>
              <th rowSpan={2}>No. HP</th>
              <th rowSpan={2} className="is-num">Nominal</th>
              <th rowSpan={2}>Keterangan</th>
            </tr>
            <tr>
              <th className="is-center">RT</th>
              <th className="is-center">RW</th>
            </tr>
          </thead>
          <tbody>
            {batch.entries.map((entry, index) => {
              const { rt, rw } = getRtRw(entry.address);
              const isCollected = entry.visitStatus === 'collected';
              return (
                <tr key={entry.id} className={isCollected ? undefined : 'is-warning'}>
                  <td>{index + 1}</td>
                  <td>{entry.munfiqName}</td>
                  <td>{getCanCode(entry)}</td>
                  <td className="is-center">{rt}</td>
                  <td className="is-center">{rw}</td>
                  <td>{entry.phone}</td>
                  <td className="is-num">{isCollected ? formatRupiah(entry.amount) : '—'}</td>
                  <td className="f009-note-cell">{f009VisitStatusLabels[entry.visitStatus]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <section className="f009-summary" aria-label="Ringkasan F.009">
          <div><span>Kaleng Aktif</span><strong>{formatNumber(batch.activeCanCount)}</strong></div>
          <div><span>Kaleng Terjemput</span><strong>{formatNumber(batch.collectedCanCount)}</strong></div>
          <div><span>Kaleng Tidak Terjemput</span><strong>{formatNumber(batch.uncollectedCanCount)}</strong></div>
          <div className="is-total"><span>Total Nominal Penghimpunan</span><strong>{formatRupiah(batch.grossAmount)}</strong></div>
        </section>
        <div className="f009-signatures">
          <div>
            <span>Diserahkan oleh PLPK</span>
            <em />
            <strong>{batch.plpkName}</strong>
          </div>
          <div>
            <span>Diterima oleh Kordes</span>
            <em />
            <strong>{batch.kordesName}</strong>
          </div>
        </div>
      </article>
    </div>
  );
}

const F009_PRINT_CSS = `
@page { size: A4 portrait; margin: 14mm; }
html, body { margin: 0; padding: 0; background: #fff; color: #202b38; font-family: Inter, Arial, sans-serif; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.f009-page { position: relative; isolation: isolate; width: 182mm; min-height: 269mm; margin: 0 auto; background: #fff; color: #202b38; overflow: hidden; }
.f009-watermark { position: absolute; z-index: 0; top: 52%; left: 50%; width: 104mm; height: 104mm; transform: translate(-50%, -50%); object-fit: contain; opacity: 0.05; pointer-events: none; }
.f009-doc-number, .f009-header, .f009-identity, .f009-table, .f009-summary, .f009-signatures { position: relative; z-index: 1; }
.f009-doc-number { position: absolute; top: 0; right: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 1mm; font-size: 7pt; color: #52606d; }
.f009-doc-number strong { font-size: 7.5pt; color: #202b38; }
.f009-header { text-align: center; border-bottom: 2.5px solid #202b38; padding: 3mm 28mm 5mm; }
.f009-header img { display: block; width: 62mm; height: auto; margin: 0 auto 2.5mm; object-fit: contain; }
.f009-header > strong { display: block; margin-top: 1mm; font-size: 13pt; letter-spacing: 0.18em; color: #08213b; }
.f009-header h1 { margin: 2mm 0 0; font-size: 17pt; letter-spacing: 0.04em; color: #08213b; line-height: 1.2; }
.f009-identity { display: grid; grid-template-columns: 1fr 1fr; gap: 0 9mm; margin: 5mm 0 6mm; }
.f009-identity div { display: grid; grid-template-columns: 34mm 1fr; gap: 2mm; padding: 1.5mm 0; border-bottom: 1px solid #e5e7eb; font-size: 8pt; }
.f009-identity dt { color: #52606d; }
.f009-identity dd { margin: 0; font-weight: 600; color: #202b38; }
.f009-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7pt; }
.f009-table th, .f009-table td { border: 1px solid #94a3b8; padding: 2mm 1.2mm; vertical-align: middle; overflow-wrap: anywhere; }
.f009-table th { background: #e8eef5; color: #08213b; text-align: left; font-size: 6.6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.015em; }
.f009-table th:first-child, .f009-table td:first-child { width: 7mm; text-align: center; }
.f009-table th:nth-child(2), .f009-table td:nth-child(2) { width: 36mm; }
.f009-table th:nth-child(3), .f009-table td:nth-child(3) { width: 24mm; }
.f009-table th:nth-child(6), .f009-table td:nth-child(6) { width: 25mm; }
.f009-table th:nth-child(7), .f009-table td:nth-child(7) { width: 25mm; }
.f009-table td.is-num, .f009-table th.is-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.f009-table .is-center { text-align: center; }
.f009-table tr.is-warning td { background: #fff8db; }
.f009-table tr.is-warning .f009-note-cell { box-shadow: inset 0 0 0 1px #8a6d1d; font-weight: 700; }
.f009-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3mm; margin-top: 6mm; }
.f009-summary > div { border: 1px solid #cbd5e1; border-radius: 2mm; background: #f8fafc; padding: 3mm; min-height: 16mm; display: flex; flex-direction: column; justify-content: space-between; gap: 2mm; }
.f009-summary span { color: #52606d; font-size: 7pt; font-weight: 600; line-height: 1.25; }
.f009-summary strong { color: #08213b; font-size: 10pt; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.2; }
.f009-summary .is-total { border-color: #07965d; background: #eaf8f1; }
.f009-summary .is-total span { color: #067a4c; }
.f009-summary .is-total strong { color: #067a4c; font-size: 11pt; }
.f009-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 22mm; margin-top: 17mm; text-align: center; font-size: 9pt; }
.f009-signatures div { display: flex; min-height: 36mm; flex-direction: column; justify-content: space-between; }
.f009-signatures span { color: #52606d; }
.f009-signatures em { display: block; height: 20mm; border-bottom: 1px solid #94a3b8; margin: 4mm 8mm 0; font-style: normal; }
.f009-signatures strong { display: block; margin-top: 3mm; font-weight: 700; color: #08213b; }
`;
