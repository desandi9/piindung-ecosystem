'use client';

import { Analytics02Icon, FileVerifiedIcon } from '@hugeicons/core-free-icons';
import { useMemo, useState } from 'react';

import { KordesDocumentViewer } from '@/components/gorut-v2/documents/kordes-document-viewer';
import { F009Preview } from '@/components/gorut-v2/pengambilan/f009-preview';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { buildKordesVerifications, createVillageRecaps } from '@/features/gorut-v2/kordes-mock-data';
import { getKordesDocumentReadiness } from '@/features/gorut-v2/kordes-mobile';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from '../plpk-mobile/mobile-service-icon';
import { MobileEmptyState, MobilePageHeader, MobileStatusBadge } from '../plpk-mobile/mobile-ui';

export function KordesRecapScreen({ batches, period, village, kecamatan, onBack }: { batches: CollectionBatch[]; period: string; village: string; kecamatan: string; onBack: () => void }) {
  const [documentType, setDocumentType] = useState<'f010' | 'f015' | null>(null);
  const [f009Batch, setF009Batch] = useState<CollectionBatch | null>(null);
  const rows = useMemo(() => batches.filter((batch) => batch.period === period && batch.village === village && batch.kecamatan === kecamatan), [batches, kecamatan, period, village]);
  const recap = useMemo(() => createVillageRecaps(buildKordesVerifications(batches)).find((item) => item.period === period && item.village === village && item.kecamatan === kecamatan) ?? null, [batches, kecamatan, period, village]);
  const documents = getKordesDocumentReadiness(rows);
  const totals = rows.reduce((sum, batch) => ({ active: sum.active + batch.activeCanCount, collected: sum.collected + batch.collectedCanCount, uncollected: sum.uncollected + batch.uncollectedCanCount, gross: sum.gross + batch.grossAmount, fee: sum.fee + batch.totalPlpkFee, net: sum.net + batch.netAmount }), { active: 0, collected: 0, uncollected: 0, gross: 0, fee: 0, net: 0 });
  return <><MobilePageHeader title="Rekap Ranting" subtitle={formatPeriodLabel(period)} onBack={onBack} /><div className="plpk-scroll">
    <section className="kordes-recap-totals"><div><small>Jumlah PLPK</small><strong>{formatNumber(rows.length)}</strong></div><div><small>Munfiq aktif</small><strong>{formatNumber(totals.active)}</strong></div><div><small>Terjemput</small><strong>{formatNumber(totals.collected)}</strong></div><div><small>Tidak terjemput</small><strong>{formatNumber(totals.uncollected)}</strong></div><div className="is-wide"><small>Total jumlah kotor</small><strong>{formatRupiah(totals.gross)}</strong></div><div><small>Total bisyaroh</small><strong>{formatRupiah(totals.fee)}</strong></div><div><small>Total bersih</small><strong>{formatRupiah(totals.net)}</strong></div></section>
    {rows.length ? <div className="kordes-recap-list">{rows.map((batch) => <article key={batch.id}><div><strong>{batch.plpkName}</strong><span>{batch.plpkId}</span></div><MobileStatusBadge status={batch.status} /><dl><div><dt>Munfiq aktif</dt><dd>{batch.activeCanCount}</dd></div><div><dt>Terjemput</dt><dd>{batch.collectedCanCount}</dd></div><div><dt>Tidak terjemput</dt><dd>{batch.uncollectedCanCount}</dd></div><div><dt>Jumlah kotor</dt><dd>{formatRupiah(batch.grossAmount)}</dd></div><div><dt>Bisyaroh</dt><dd>{formatRupiah(batch.totalPlpkFee)}</dd></div><div className="is-total"><dt>Jumlah bersih</dt><dd>{formatRupiah(batch.netAmount)}</dd></div></dl></article>)}</div> : <MobileEmptyState icon={Analytics02Icon} title="Rekap belum tersedia" description="Belum ada data PLPK pada periode ini." />}

    <section className="kordes-documents-section" aria-labelledby="kordes-documents-title">
      <div className="kordes-documents-heading"><div><span>Dokumen operasional</span><h2 id="kordes-documents-title">Dokumen Ranting</h2></div><span>PDF segera tersedia</span></div>
      <article className="kordes-document-card"><div className="kordes-document-title"><MobileServiceIcon icon={FileVerifiedIcon} label="F.009" size={21} /><div><strong>F.009 — Lembar Penerimaan PLPK</strong><span>{documents.f009Count} dari {rows.length} dokumen tersedia</span></div></div><div className="kordes-f009-list">{rows.map((batch) => <div key={batch.id}><span><b>{batch.plpkName}</b><MobileStatusBadge status={batch.status} /></span><button type="button" disabled={!['waiting-kordes-verification', 'verified-by-kordes', 'needs-correction'].includes(batch.status)} onClick={() => setF009Batch(batch)}>Lihat Preview</button></div>)}</div><DocumentUnavailableActions /></article>
      <article className="kordes-document-card"><div className="kordes-document-title"><MobileServiceIcon icon={Analytics02Icon} label="F.010" size={21} /><div><strong>F.010 — Rekap Tingkat Desa</strong><span>{documents.f010Status}</span></div></div><p>Merangkum seluruh PLPK pada ranting dan periode ini.</p><button type="button" className="kordes-document-preview" disabled={!documents.f010PreviewAvailable || !recap} onClick={() => setDocumentType('f010')}>Lihat Preview</button><DocumentUnavailableActions /></article>
      <article className={documents.f015PreviewAvailable ? 'kordes-document-card is-ready' : 'kordes-document-card'}><div className="kordes-document-title"><MobileServiceIcon icon={documents.f015PreviewAvailable ? FileVerifiedIcon : Analytics02Icon} label="F.015" size={21} /><div><strong>F.015 — Berita Acara</strong><span>{documents.f015Status}</span></div></div><p>Siap hanya setelah seluruh data PLPK terverifikasi Kordes.</p><button type="button" className="kordes-document-preview" disabled={!documents.f015PreviewAvailable || !recap} onClick={() => setDocumentType('f015')}>Lihat Preview</button><DocumentUnavailableActions /></article>
    </section>
  </div><KordesDocumentViewer documentType={documentType ?? 'f010'} recap={documentType ? recap : null} batches={rows} onClose={() => setDocumentType(null)} /><F009Preview batch={f009Batch} onClose={() => setF009Batch(null)} /></>;
}

function DocumentUnavailableActions() {
  return <div className="kordes-document-disabled"><span>Segera tersedia</span><button type="button" disabled>Simpan PDF</button><button type="button" disabled>Cetak</button></div>;
}
