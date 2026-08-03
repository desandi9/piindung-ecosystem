'use client';

import { Alert02Icon, CheckmarkCircle02Icon, FileVerifiedIcon, MoneyBag02Icon } from '@hugeicons/core-free-icons';
import { Check, ChevronRight, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { type KordesDecisionAction, type KordesDecisionInput, validateKordesAction } from '@/features/gorut-v2/kordes-mobile';
import { collectionVisitStatusLabels, formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from '../plpk-mobile/mobile-service-icon';
import { MobilePageHeader, MobileStatusBadge } from '../plpk-mobile/mobile-ui';

export function KordesVerificationForm({ batch, onBack, onOpenF009, onSubmit }: { batch: CollectionBatch; onBack: () => void; onOpenF009: () => void; onSubmit: (input: KordesDecisionInput, action: KordesDecisionAction) => string | null }) {
  const [input, setInput] = useState<KordesDecisionInput>({ moneyMatches: batch.kordesMoneyMatches, hasDamagedMoney: batch.kordesHasDamagedMoney, cashReceived: batch.kordesCashReceived, notes: batch.kordesNotes ?? '', correctionEntryIds: batch.correctionEntryIds ?? [] });
  const [receivedAmount, setReceivedAmount] = useState('');
  const [damagedAmount, setDamagedAmount] = useState('');
  const [correctionQuery, setCorrectionQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState<KordesDecisionAction | null>(null);
  const [error, setError] = useState('');
  const selected = useMemo(() => new Set(input.correctionEntryIds ?? []), [input.correctionEntryIds]);
  const received = Number(receivedAmount || 0);
  const difference = batch.netAmount - received;
  const verifyEnabled = validateKordesAction(input, 'verify') === null;
  const correctionEnabled = validateKordesAction(input, 'correction') === null;
  const filteredEntries = useMemo(() => {
    const needle = correctionQuery.trim().toLowerCase();
    return batch.entries.filter((entry) => !needle || `${entry.canCode} ${entry.munfiqName}`.toLowerCase().includes(needle));
  }, [batch.entries, correctionQuery]);

  const updateInput = (next: Partial<KordesDecisionInput>) => { setInput((current) => ({ ...current, ...next })); setError(''); };
  const toggleEntry = (entryId: string) => updateInput({ correctionEntryIds: selected.has(entryId) ? (input.correctionEntryIds ?? []).filter((id) => id !== entryId) : [...(input.correctionEntryIds ?? []), entryId] });
  const requestSubmit = (action: KordesDecisionAction) => {
    const validation = validateKordesAction(input, action);
    if (validation) { setError(validation); return; }
    setConfirmAction(action);
  };
  const submit = () => {
    if (!confirmAction) return;
    const submitError = onSubmit(input, confirmAction);
    if (submitError) { setError(submitError); setConfirmAction(null); }
  };

  return (
    <section className="plpk-sheet kordes-operational-screen kordes-verification-form" aria-label="Form verifikasi Kordes">
      <MobilePageHeader title="Verifikasi Data" subtitle={`${batch.plpkName} · ${formatPeriodLabel(batch.period)}`} onBack={onBack} action={<MobileStatusBadge status={batch.status} />} />
      <div className="plpk-scroll has-footer">
        <div className="kordes-warning"><MobileServiceIcon icon={Alert02Icon} label="Peringatan" size={21} /><p><strong>Periksa sebelum menyelesaikan.</strong> Verifikasi hanya dapat diselesaikan satu kali. Pastikan data penjemputan dan uang yang diterima sudah sesuai.</p></div>

        <section className="kordes-receipt-card" aria-labelledby="receipt-title">
          <div className="kordes-form-section-title"><span><MobileServiceIcon icon={MoneyBag02Icon} label="Ringkasan penerimaan" size={19} /></span><div><h2 id="receipt-title">Ringkasan Penerimaan</h2><p>Nominal yang seharusnya diterima Kordes</p></div></div>
          <strong className="kordes-expected-amount">{formatRupiah(batch.netAmount)}</strong>
          <dl><div><dt>Jumlah kotor</dt><dd>{formatRupiah(batch.grossAmount)}</dd></div><div><dt>Bisyaroh PLPK</dt><dd>− {formatRupiah(batch.totalPlpkFee)}</dd></div><div><dt>Kaleng terjemput</dt><dd>{formatNumber(batch.collectedCanCount)}</dd></div><div><dt>Nomor F.009</dt><dd>{batch.f009DocumentNumber ?? batch.documentNumber}</dd></div></dl>
          <button type="button" className="kordes-outline-button is-full" onClick={onOpenF009}><MobileServiceIcon icon={FileVerifiedIcon} label="Lihat F.009" size={18} />Lihat F.009</button>
        </section>

        <section className="kordes-checklist" aria-labelledby="checklist-title">
          <div className="kordes-form-section-heading"><span>CHECKLIST</span><h2 id="checklist-title">Checklist Verifikasi</h2></div>
          <BooleanQuestion index={1} label="Jumlah uang sesuai?" value={input.moneyMatches} onChange={(value) => updateInput({ moneyMatches: value })} />
          {input.moneyMatches === false ? <div className="kordes-condition-card is-warning"><div><MobileServiceIcon icon={Alert02Icon} label="Selisih nominal" size={19} /><span><strong>Terjadi selisih nominal</strong><small>Masukkan nominal uang yang diterima.</small></span></div><dl><div><dt>Seharusnya</dt><dd>{formatRupiah(batch.netAmount)}</dd></div><div><dt>Diterima</dt><dd><label className="kordes-money-input"><span>Rp</span><input inputMode="numeric" value={receivedAmount} onChange={(event) => setReceivedAmount(event.target.value.replace(/[^\d]/g, ''))} placeholder="0" aria-label="Nominal uang diterima" /></label></dd></div><div className="is-difference"><dt>Selisih</dt><dd>{formatRupiah(Math.abs(difference))}</dd></div></dl></div> : null}

          <BooleanQuestion index={2} label="Ada uang rusak?" value={input.hasDamagedMoney} onChange={(value) => updateInput({ hasDamagedMoney: value })} />
          {input.hasDamagedMoney === true ? <label className="kordes-condition-card kordes-damaged-money"><span>Nominal uang rusak</span><div className="kordes-money-input"><span>Rp</span><input inputMode="numeric" value={damagedAmount} onChange={(event) => setDamagedAmount(event.target.value.replace(/[^\d]/g, ''))} placeholder="0" aria-label="Nominal uang rusak" /></div><small>Jelaskan kondisi uang pada catatan verifikasi.</small></label> : null}

          <BooleanQuestion index={3} label="Uang sudah diterima?" value={input.cashReceived} onChange={(value) => updateInput({ cashReceived: value })} />
          {input.cashReceived === false ? <div className="kordes-cash-alert" role="alert"><MobileServiceIcon icon={Alert02Icon} label="Uang belum diterima" size={19} /><span><strong>Verifikasi belum dapat diselesaikan</strong><small>Uang belum diterima oleh Kordes.</small></span></div> : null}

          <label className="kordes-notes"><span>4. Catatan verifikasi {(input.moneyMatches === false || input.hasDamagedMoney || selected.size) ? <b>*</b> : null}</span><textarea value={input.notes ?? ''} onChange={(event) => updateInput({ notes: event.target.value })} placeholder="Tuliskan selisih, kondisi uang rusak, atau arahan koreksi" rows={4} /></label>
        </section>

        <section className={input.moneyMatches === false || selected.size ? 'kordes-correction-picker is-emphasized' : 'kordes-correction-picker'} aria-labelledby="correction-title">
          <div className="kordes-correction-head"><div><strong id="correction-title">Pilih Data Koreksi</strong><p>Tandai hanya Munfiq yang harus diperbaiki PLPK.</p></div><span>{selected.size} dipilih</span></div>
          <div className="plpk-search"><Search size={17} aria-hidden="true" /><input type="search" value={correctionQuery} onChange={(event) => setCorrectionQuery(event.target.value)} placeholder="Cari nama atau kode kaleng" aria-label="Cari data Munfiq untuk koreksi" /></div>
          <div className="kordes-correction-list">{filteredEntries.map((entry) => <label key={entry.id} className={selected.has(entry.id) ? 'is-selected' : undefined}><input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleEntry(entry.id)} /><span><b>{entry.munfiqName}</b><small>{entry.canCode} · {collectionVisitStatusLabels[entry.visitStatus]}</small><em>{entry.notes ?? 'Tanpa catatan'}</em></span><strong>{entry.visitStatus === 'collected' ? formatRupiah(entry.amount) : 'Rp0'}</strong></label>)}</div>
        </section>

        {error ? <p className="kordes-form-error" role="alert">{error}</p> : null}
      </div>

      <footer className="kordes-form-footer"><button type="button" className="kordes-correction-button" disabled={!correctionEnabled} onClick={() => requestSubmit('correction')}>Kembalikan untuk Koreksi</button><button type="button" className="kordes-primary-button" disabled={!verifyEnabled} onClick={() => requestSubmit('verify')}>Verifikasi Data</button></footer>

      {confirmAction ? <div className="kordes-confirm-backdrop" role="presentation"><section className="kordes-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><button type="button" className="kordes-confirm-close" onClick={() => setConfirmAction(null)} aria-label="Tutup konfirmasi"><X size={18} aria-hidden="true" /></button><span className={confirmAction === 'verify' ? 'is-verify' : 'is-correction'}><MobileServiceIcon icon={confirmAction === 'verify' ? CheckmarkCircle02Icon : Alert02Icon} label="Konfirmasi keputusan" size={25} /></span><h2 id="confirm-title">{confirmAction === 'verify' ? 'Verifikasi data ini?' : 'Kembalikan ke PLPK?'}</h2><p>{confirmAction === 'verify' ? 'Data akan dikunci dan tidak dapat diverifikasi ulang.' : `${selected.size} data Munfiq akan dibuka kembali untuk diperbaiki PLPK.`}</p><div><button type="button" className="kordes-outline-button" onClick={() => setConfirmAction(null)}>Batal</button><button type="button" className={confirmAction === 'verify' ? 'kordes-primary-button' : 'kordes-correction-button'} onClick={submit}>{confirmAction === 'verify' ? 'Ya, Verifikasi' : 'Ya, Kembalikan'}</button></div></section></div> : null}
    </section>
  );
}

export function KordesVerificationResult({ batch, onBack, onViewDetail }: { batch: CollectionBatch; onBack: () => void; onViewDetail: () => void }) {
  const verified = batch.status === 'verified-by-kordes';
  const decidedAt = verified ? batch.verifiedByKordesAt : batch.returnedForCorrectionAt;
  const decidedDate = decidedAt ? new Date(decidedAt) : null;
  const decidedLabel = decidedDate && !Number.isNaN(decidedDate.getTime()) ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(decidedDate) : 'Waktu keputusan tidak tersedia';
  return <section className="plpk-sheet kordes-operational-screen kordes-result-screen" aria-label={verified ? 'Hasil verifikasi' : 'Hasil koreksi'}><MobilePageHeader title={verified ? 'Hasil Verifikasi' : 'Catatan Koreksi'} subtitle={formatPeriodLabel(batch.period)} onBack={onBack} /><div className="plpk-scroll"><section className={verified ? 'kordes-result-card is-success' : 'kordes-result-card is-correction'}><span><MobileServiceIcon icon={verified ? CheckmarkCircle02Icon : Alert02Icon} label={verified ? 'Berhasil diverifikasi' : 'Dikembalikan ke PLPK'} size={34} /></span><p>{verified ? 'VERIFIKASI SELESAI' : 'PERLU KOREKSI'}</p><h1>{verified ? 'Data Berhasil Diverifikasi' : 'Dikembalikan ke PLPK'}</h1><small>{verified ? 'Data sudah dikunci dan masuk ke rekap ranting.' : `${formatNumber(batch.correctionEntryIds?.length ?? 0)} entry perlu diperbaiki oleh PLPK.`}</small><dl><div><dt>Nama PLPK</dt><dd>{batch.plpkName}</dd></div><div><dt>Periode</dt><dd>{formatPeriodLabel(batch.period)}</dd></div><div><dt>Jumlah bersih</dt><dd>{formatRupiah(batch.netAmount)}</dd></div><div><dt>{verified ? 'Diverifikasi' : 'Dikembalikan'}</dt><dd>{decidedLabel}</dd></div>{!verified ? <div className="is-note"><dt>Catatan Kordes</dt><dd>{batch.kordesNotes}</dd></div> : null}</dl><div><button type="button" className="plpk-btn plpk-btn-primary" onClick={onBack}>Kembali ke Antrean</button><button type="button" className="plpk-btn plpk-btn-quiet" onClick={onViewDetail}>{verified ? 'Lihat Hasil' : 'Lihat Detail Koreksi'}<ChevronRight size={17} aria-hidden="true" /></button></div></section></div></section>;
}

function BooleanQuestion({ index, label, value, onChange }: { index: number; label: string; value?: boolean; onChange: (value: boolean) => void }) {
  return <fieldset className="kordes-question"><legend>{index}. {label}</legend><div><button type="button" className={value === true ? 'is-selected' : undefined} aria-pressed={value === true} onClick={() => onChange(true)}><Check size={17} aria-hidden="true" />Ya</button><button type="button" className={value === false ? 'is-selected is-no' : undefined} aria-pressed={value === false} onClick={() => onChange(false)}><X size={17} aria-hidden="true" />Tidak</button></div></fieldset>;
}
