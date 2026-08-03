'use client';

import Image from 'next/image';

import { buildF010DocumentRequest, buildF015DocumentRequest } from '@/features/gorut-v2/document-data';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch, CollectionVisitStatus, KordesVillageRecap } from '@/features/gorut-v2/types';

const visitLabels: Record<CollectionVisitStatus, string> = {
  pending: 'Belum Dikunjungi',
  collected: 'Terjemput',
  'not-around': 'Tidak Terjemput',
  'not-ready': 'Belum Tersedia',
  declined: 'Menolak/Berhenti',
  'damaged-lost': 'Kaleng Rusak/Hilang',
};

export function F009HtmlFallback({ batch }: { batch: CollectionBatch }) {
  return (
    <article className="gorut-html-document is-f009">
      <Image className="gorut-html-watermark" src="/logo koin nu.png" alt="" width={420} height={420} aria-hidden="true" />
      <div className="gorut-html-number"><span>No. Dokumen</span><strong>{batch.f009DocumentNumber ?? batch.documentNumber}</strong></div>
      <header><Image src="/logo untuk berkas gorut.png" alt="Logo GORUT" width={250} height={193} /><b>F.009</b><h1>LEMBAR PENERIMAAN KOIN NU</h1></header>
      <dl className="gorut-html-identity">
        <div><dt>Nama PLPK</dt><dd>{batch.plpkName}</dd></div><div><dt>ID PLPK</dt><dd>{batch.plpkId}</dd></div>
        <div><dt>Periode</dt><dd>{formatPeriodLabel(batch.period)}</dd></div><div><dt>Kecamatan</dt><dd>{batch.kecamatan}</dd></div>
        <div><dt>Desa/Ranting</dt><dd>{batch.village}</dd></div><div><dt>Nama Kordes</dt><dd>{batch.kordesName}</dd></div>
      </dl>
      <div className="gorut-html-table-wrap"><table><thead><tr><th>No.</th><th>Nama Lengkap</th><th>Kode Kaleng</th><th>RT/RW</th><th>No. HP</th><th>Nominal</th><th>Keterangan</th></tr></thead><tbody>
        {batch.entries.map((entry, index) => <tr key={entry.id}><td>{index + 1}</td><td>{entry.munfiqName}</td><td>{entry.canCode}</td><td>{entry.rt ?? '—'}/{entry.rw ?? '—'}</td><td>{entry.phone}</td><td>{entry.visitStatus === 'collected' ? formatRupiah(entry.amount) : '—'}</td><td>{visitLabels[entry.visitStatus]}</td></tr>)}
      </tbody></table></div>
      <section className="gorut-html-summary"><div><span>Kaleng Aktif</span><strong>{formatNumber(batch.activeCanCount)}</strong></div><div><span>Kaleng Terjemput</span><strong>{formatNumber(batch.collectedCanCount)}</strong></div><div><span>Tidak Terjemput</span><strong>{formatNumber(batch.uncollectedCanCount)}</strong></div><div><span>Total Nominal Penghimpunan</span><strong>{formatRupiah(batch.grossAmount)}</strong></div></section>
      <div className="gorut-html-signatures"><div><span>Diserahkan oleh PLPK</span><strong>{batch.plpkName}</strong></div><div><span>Diterima oleh Kordes</span><strong>{batch.kordesName}</strong></div></div>
    </article>
  );
}

export function F010HtmlFallback({ recap, batches }: { recap: KordesVillageRecap; batches: CollectionBatch[] }) {
  const data = buildF010DocumentRequest(recap, batches).data;
  return (
    <article className="gorut-html-document is-f010">
      <Image className="gorut-html-watermark" src="/logo koin nu.png" alt="" width={420} height={420} aria-hidden="true" />
      <div className="gorut-html-number"><span>No. Dokumen</span><strong>{data.documentNumber}</strong></div>
      <header><Image src="/logo untuk berkas gorut.png" alt="Logo GORUT" width={250} height={193} /><b>F.010</b><h1>REKAP PENERIMAAN KOIN NU TINGKAT DESA</h1></header>
      <dl className="gorut-html-identity"><div><dt>Desa/Ranting</dt><dd>{data.village}</dd></div><div><dt>Kecamatan</dt><dd>{data.kecamatan}</dd></div><div><dt>Periode</dt><dd>{data.periodLabel}</dd></div><div><dt>Kordes</dt><dd>{data.kordesName}</dd></div></dl>
      <div className="gorut-html-table-wrap"><table><thead><tr><th>No.</th><th>Nama PLPK</th><th>Aktif</th><th>Terjemput</th><th>Persentase</th><th>Rata-rata</th><th>Kotor</th><th>Bisyaroh</th><th>Bersih</th><th>Terverifikasi</th></tr></thead><tbody>
        {data.rows.map((row) => <tr key={`${row.index}-${row.plpkName}`}><td>{row.index}</td><td>{row.plpkName}</td><td>{row.active}</td><td>{row.collected}</td><td>{row.percentage}</td><td>{row.average}</td><td>{row.gross}</td><td>{row.fee}</td><td>{row.net}</td><td>{row.verifiedAt}</td></tr>)}
        <tr className="gorut-html-total-row"><td colSpan={2}>TOTAL</td><td>{data.totalActive}</td><td>{data.totalCollected}</td><td>{data.totalPercentage}</td><td>{data.totalAverage}</td><td>{data.totalGross}</td><td>{data.totalFee}</td><td>{data.totalNet}</td><td>—</td></tr>
      </tbody></table></div>
      <div className="gorut-html-signatures is-three"><div><span>Divisi Fundraising</span><strong>{data.fundraisingOfficerName}</strong></div><div><span>Ketua UPZIS Kecamatan {data.kecamatan}</span><strong>{data.upzisOfficerName}</strong></div><div><span>Koordinator Desa {data.village}</span><strong>{data.kordesName}</strong></div></div>
    </article>
  );
}

export function F015HtmlFallback({ recap, batches }: { recap: KordesVillageRecap; batches: CollectionBatch[] }) {
  const data = buildF015DocumentRequest(recap, batches).data;
  return (
    <article className="gorut-html-document is-f015">
      <Image className="gorut-html-watermark" src="/logo koin nu.png" alt="" width={420} height={420} aria-hidden="true" />
      <div className="gorut-html-number"><span>No. Dokumen</span><strong>{data.documentNumber}</strong></div>
      <header><Image src="/logo untuk berkas gorut.png" alt="Logo GORUT" width={250} height={193} /><b>F.015</b><h1>BERITA ACARA SERAH TERIMA<br />DONASI GERAKAN KOIN NU<br />TINGKAT RANTING</h1></header>
      <div className="gorut-html-narrative">
        <p>Pada hari ini, tanggal: <strong>{data.handoverDate}</strong></p>
        <p><strong>Telah diserahterimakan hasil penghimpunan Koin NU, Program Gerakan Koin NU Lazisnu Kabupaten Garut.</strong></p>
        <p>Oleh: <strong>{data.handedBy}</strong></p><p>Kepada: <strong>{data.handedTo}</strong></p>
        <p>Total nominal: <strong>{data.totalNet}</strong></p><p>Terbilang: <strong>{data.totalWords}</strong></p>
        <p>Dari hasil penghimpunan donasi Koin NU di Desa/Ranting <strong>{data.village}</strong>.</p>
        <p>Total Kaleng Aktif: {data.totalActive} · Total PLPK Menjemput: {data.totalPlpk} · Kaleng Terjemput: {data.totalCollected} · Tidak Terjemput: {data.totalUncollected}</p>
        <em>{data.verificationStatus}</em>
      </div>
      <div className="gorut-html-signatures is-three"><div><span>Diterima oleh Divisi Fundraising</span><strong>{data.fundraisingOfficerName}</strong></div><div><span>Diterima oleh Ketua UPZIS MWCNU Kec. {data.kecamatan}</span><strong>{data.upzisOfficerName}</strong></div><div><span>Diserahkan oleh Koordinator Desa {data.village}</span><strong>{data.kordesName}</strong></div></div>
    </article>
  );
}
