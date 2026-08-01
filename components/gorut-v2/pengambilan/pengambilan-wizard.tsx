'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Search, X } from 'lucide-react';

import type { CollectionBatch, CollectionEntry } from '@/features/gorut-v2/types';
import { formatNumber, formatPhoneNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { gorutMunfiqData } from '@/features/gorut-v2/munfiq-mock-data';
import { calculatePlpkFee, collectionPeriodOptions, formatPeriodLabel, isEligibleForPlpkFee, PLPK_FEE_THRESHOLD, summarizeEntries } from '@/features/gorut-v2/pengambilan-options';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { CollectionEntryRow, parseAmount, type CollectionEntryDraft } from './collection-entry-row';
import { CollectionReview } from './collection-review';

const stepTitles = { 1: 'Informasi Penghimpunan', 2: 'Pilih Munfiq', 3: 'Masukkan Hasil Koin', 4: 'Periksa dan Simpan' };
const stepDescriptions = {
  1: 'Tentukan periode, petugas PLPK, dan wilayah yang dikunjungi bulan ini.',
  2: 'Pilih Munfiq yang dikunjungi pada penghimpunan ini.',
  3: 'Catat nominal koin setiap Munfiq. Upah PLPK dihitung otomatis.',
  4: 'Pastikan seluruh catatan sudah benar sebelum disimpan.',
};

/** PLPK terikat pada satu kecamatan, jadi kecamatan ikut terisi saat PLPK dipilih. */
const plpkDirectory = [
  { id: 'PLPK-01', name: 'Dede Rahmat', kecamatan: 'Garut Kota' },
  { id: 'PLPK-05', name: 'Nia Solihat', kecamatan: 'Garut Kota' },
  { id: 'PLPK-06', name: 'Rudi Firmansyah', kecamatan: 'Garut Kota' },
  { id: 'PLPK-02', name: 'Asep Saepudin', kecamatan: 'Tarogong Kidul' },
  { id: 'PLPK-03', name: 'Yana Suryana', kecamatan: 'Karangpawitan' },
  { id: 'PLPK-07', name: 'Lilis Nuraeni', kecamatan: 'Karangpawitan' },
  { id: 'PLPK-04', name: 'Ujang Koswara', kecamatan: 'Cilawu' },
  { id: 'PLPK-08', name: 'Tatang Sudrajat', kecamatan: 'Cilawu' },
];

const periodChoices = collectionPeriodOptions.slice(1);

type WizardInfo = { period: string; plpkId: string; kecamatan: string; village: string; collectedAt: string };
type InfoKey = keyof WizardInfo;

const emptyInfo: WizardInfo = { period: periodChoices[0] ?? '', plpkId: '', kecamatan: '', village: '', collectedAt: '' };

function draftFromEntry(entry: CollectionEntry): CollectionEntryDraft {
  return {
    munfiqId: entry.munfiqId,
    munfiqName: entry.munfiqName,
    memberId: entry.memberId,
    phone: entry.phone,
    amount: entry.visitStatus === 'collected' && entry.amount ? String(entry.amount) : '',
    visitStatus: entry.visitStatus,
    notes: entry.notes ?? '',
  };
}

export function PengambilanWizard({ open, batch, onClose, onSave }: { open: boolean; batch: CollectionBatch | null; onClose: () => void; onSave: (batch: CollectionBatch, mode: 'draft' | 'complete') => void }) {
  const [step, setStep] = useState(1);
  const [info, setInfo] = useState<WizardInfo>(emptyInfo);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CollectionEntryDraft>>({});
  const [query, setQuery] = useState('');
  const [infoErrors, setInfoErrors] = useState<Partial<Record<InfoKey, string>>>({});
  const [selectionError, setSelectionError] = useState('');
  const [amountErrors, setAmountErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setInfoErrors({});
    setSelectionError('');
    setAmountErrors({});
    setQuery('');
    if (batch) {
      setInfo({ period: batch.period, plpkId: batch.plpkId, kecamatan: batch.kecamatan, village: batch.village, collectedAt: batch.entries[0]?.collectedAt ?? batch.createdAt });
      setSelectedIds(batch.entries.map((entry) => entry.munfiqId));
      setDrafts(Object.fromEntries(batch.entries.map((entry) => [entry.munfiqId, draftFromEntry(entry)])));
      setStep(1);
    } else {
      setInfo(emptyInfo);
      setSelectedIds([]);
      setDrafts({});
      setStep(1);
    }
  }, [batch, open]);

  const plpk = plpkDirectory.find((item) => item.id === info.plpkId);

  const villageOptions = useMemo(() => {
    if (!info.kecamatan) return [];
    return [...new Set(gorutMunfiqData.filter((munfiq) => munfiq.kecamatan === info.kecamatan).map((munfiq) => munfiq.village))].sort();
  }, [info.kecamatan]);

  /** Munfiq yang boleh dipilih adalah yang berada di wilayah kerja PLPK. */
  const areaMunfiq = useMemo(() => {
    if (!info.kecamatan) return [];
    return gorutMunfiqData.filter((munfiq) => munfiq.kecamatan === info.kecamatan);
  }, [info.kecamatan]);

  const visibleMunfiq = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return areaMunfiq;
    return areaMunfiq.filter((munfiq) => munfiq.name.toLowerCase().includes(needle) || munfiq.memberId.toLowerCase().includes(needle) || munfiq.phone.includes(needle) || munfiq.village.toLowerCase().includes(needle));
  }, [areaMunfiq, query]);

  const selectedDrafts = useMemo(() => selectedIds.map((id) => drafts[id]).filter(Boolean), [drafts, selectedIds]);

  const runningTotals = useMemo(() => {
    const collected = selectedDrafts.filter((draft) => draft.visitStatus === 'collected');
    const total = collected.reduce((sum, draft) => sum + (parseAmount(draft.amount) ?? 0), 0);
    const eligible = collected.filter((draft) => (parseAmount(draft.amount) ?? 0) > PLPK_FEE_THRESHOLD).length;
    return { total, eligible, fee: eligible * 2500 };
  }, [selectedDrafts]);

  const setInfoValue = (key: InfoKey, value: string) => {
    setInfo((previous) => ({ ...previous, [key]: value }));
    if (infoErrors[key]) setInfoErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const toggleMunfiq = (munfiqId: string) => {
    setSelectionError('');
    setSelectedIds((previous) => {
      if (previous.includes(munfiqId)) return previous.filter((id) => id !== munfiqId);
      return [...previous, munfiqId];
    });
    setDrafts((previous) => {
      if (previous[munfiqId]) return previous;
      const munfiq = gorutMunfiqData.find((item) => item.id === munfiqId);
      if (!munfiq) return previous;
      return { ...previous, [munfiqId]: { munfiqId, munfiqName: munfiq.name, memberId: munfiq.memberId, phone: munfiq.phone, amount: '', visitStatus: 'collected', notes: '' } };
    });
  };

  const validateInfo = () => {
    const next: Partial<Record<InfoKey, string>> = {};
    if (!info.period) next.period = 'Periode belum dipilih.';
    if (!info.plpkId) next.plpkId = 'Petugas PLPK belum dipilih.';
    if (!info.kecamatan) next.kecamatan = 'Kecamatan belum dipilih.';
    if (!info.village) next.village = 'Desa belum dipilih.';
    if (!info.collectedAt) next.collectedAt = 'Tanggal pengambilan belum diisi.';
    setInfoErrors(next);
    if (Object.keys(next).length) {
      const order: InfoKey[] = ['period', 'plpkId', 'kecamatan', 'village', 'collectedAt'];
      const firstKey = order.find((key) => next[key]);
      requestAnimationFrame(() => document.getElementById(`wiz-${firstKey}`)?.focus());
      return false;
    }
    return true;
  };

  const validateSelection = () => {
    if (!selectedIds.length) {
      setSelectionError('Pilih minimal satu Munfiq untuk penghimpunan ini.');
      return false;
    }
    setSelectionError('');
    return true;
  };

  /** requireComplete=false dipakai untuk Simpan Draft: nominal boleh belum lengkap. */
  const validateAmounts = (requireComplete: boolean) => {
    const next: Record<string, string> = {};
    selectedDrafts.forEach((draft) => {
      if (draft.visitStatus !== 'collected') return;
      const parsed = parseAmount(draft.amount);
      if (parsed === null) {
        if (requireComplete) next[draft.munfiqId] = 'Nominal belum diisi. Isi nominal atau ubah hasil kunjungan.';
        return;
      }
      if (parsed < 0) next[draft.munfiqId] = 'Nominal tidak boleh negatif.';
    });
    setAmountErrors(next);
    if (Object.keys(next).length) {
      const firstId = selectedDrafts.find((draft) => next[draft.munfiqId])?.munfiqId;
      requestAnimationFrame(() => document.getElementById(`entry-amount-${firstId}`)?.focus());
      return false;
    }
    return true;
  };

  const buildBatch = (status: CollectionBatch['status']): CollectionBatch => {
    const entries: CollectionEntry[] = selectedDrafts.map((draft, index) => {
      const parsed = draft.visitStatus === 'collected' ? parseAmount(draft.amount) ?? 0 : 0;
      return {
        id: `${batch?.id ?? 'batch-new'}-entry-${String(index + 1).padStart(2, '0')}`,
        munfiqId: draft.munfiqId,
        munfiqName: draft.munfiqName,
        memberId: draft.memberId,
        phone: draft.phone,
        amount: parsed,
        visitStatus: draft.visitStatus,
        collectedAt: info.collectedAt,
        eligibleForPlpkFee: isEligibleForPlpkFee(parsed, draft.visitStatus),
        plpkFee: calculatePlpkFee(parsed, draft.visitStatus),
        notes: draft.notes.trim() || undefined,
      };
    });

    return {
      id: batch?.id ?? `batch-${Date.now()}`,
      period: info.period,
      plpkId: info.plpkId,
      plpkName: plpk?.name ?? '',
      village: info.village,
      kecamatan: info.kecamatan,
      entries,
      ...summarizeEntries(entries),
      status,
      handoverDestination: batch?.handoverDestination,
      createdAt: batch?.createdAt ?? info.collectedAt,
    };
  };

  const handleNext = (event: FormEvent) => {
    event.preventDefault();
    if (step === 1 && validateInfo()) setStep(2);
    else if (step === 2 && validateSelection()) setStep(3);
    else if (step === 3 && validateAmounts(true)) setStep(4);
  };

  const handleSaveDraft = () => {
    if (!validateInfo()) { setStep(1); return; }
    if (!validateSelection()) { setStep(2); return; }
    if (!validateAmounts(false)) { setStep(3); return; }
    onSave(buildBatch('collecting'), 'draft');
  };

  const handleComplete = () => {
    if (!validateAmounts(true)) { setStep(3); return; }
    onSave(buildBatch('collected'), 'complete');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} className="mqw-panel" aria-describedby="wiz-lede">
        <DialogHeader className="mqw-head">
          <div className="mqw-track" aria-hidden="true"><i style={{ width: `${step * 25}%` }} /></div>
          <span className="mqw-step">Langkah {step} dari 4</span>
          <DialogTitle className="mqw-title">{stepTitles[step as keyof typeof stepTitles]}</DialogTitle>
          <DialogDescription id="wiz-lede" className="mqw-lede">{stepDescriptions[step as keyof typeof stepDescriptions]}</DialogDescription>
          <DialogClose aria-label="Tutup" className="mqw-close"><X size={18} /></DialogClose>
        </DialogHeader>

        <form onSubmit={handleNext} className="mqw-form">
          <div className="mqw-body">
            {step === 1 && (
              <section className="mqw-section">
                <div className="mqw-grid">
                  <WizField id="wiz-period" label="Periode Bulan" required error={infoErrors.period}>
                    <select id="wiz-period" className="mqw-input" value={info.period} aria-invalid={Boolean(infoErrors.period)} aria-describedby={infoErrors.period ? 'wiz-period-error' : undefined} onChange={(event) => setInfoValue('period', event.target.value)}>
                      <option value="">Pilih Periode</option>
                      {periodChoices.map((period) => <option key={period} value={period}>{formatPeriodLabel(period)}</option>)}
                    </select>
                  </WizField>

                  <WizField id="wiz-plpkId" label="Petugas PLPK" required error={infoErrors.plpkId}>
                    <select
                      id="wiz-plpkId"
                      className="mqw-input"
                      value={info.plpkId}
                      aria-invalid={Boolean(infoErrors.plpkId)}
                      aria-describedby={infoErrors.plpkId ? 'wiz-plpkId-error' : undefined}
                      onChange={(event) => {
                        const chosen = plpkDirectory.find((item) => item.id === event.target.value);
                        setInfo((previous) => ({ ...previous, plpkId: event.target.value, kecamatan: chosen?.kecamatan ?? '', village: '' }));
                        setInfoErrors((previous) => ({ ...previous, plpkId: undefined, kecamatan: undefined }));
                        setSelectedIds([]);
                        setDrafts({});
                      }}
                    >
                      <option value="">Pilih Petugas PLPK</option>
                      {plpkDirectory.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.kecamatan}</option>)}
                    </select>
                  </WizField>

                  <WizField id="wiz-kecamatan" label="Kecamatan" required error={infoErrors.kecamatan} hint={plpk ? 'Mengikuti wilayah kerja PLPK' : undefined}>
                    <input id="wiz-kecamatan" className="mqw-input" value={info.kecamatan} readOnly aria-invalid={Boolean(infoErrors.kecamatan)} aria-describedby={infoErrors.kecamatan ? 'wiz-kecamatan-error' : plpk ? 'wiz-kecamatan-hint' : undefined} placeholder="Pilih PLPK terlebih dahulu" />
                  </WizField>

                  <WizField id="wiz-village" label="Desa/Kelurahan" required error={infoErrors.village}>
                    <select id="wiz-village" className="mqw-input" value={info.village} disabled={!info.kecamatan} aria-invalid={Boolean(infoErrors.village)} aria-describedby={infoErrors.village ? 'wiz-village-error' : undefined} onChange={(event) => setInfoValue('village', event.target.value)}>
                      <option value="">Pilih Desa/Kelurahan</option>
                      {villageOptions.map((village) => <option key={village} value={village}>{village}</option>)}
                    </select>
                  </WizField>

                  <WizField id="wiz-collectedAt" label="Tanggal Pengambilan" required error={infoErrors.collectedAt} wide>
                    <input id="wiz-collectedAt" className="mqw-input" type="date" value={info.collectedAt} aria-invalid={Boolean(infoErrors.collectedAt)} aria-describedby={infoErrors.collectedAt ? 'wiz-collectedAt-error' : undefined} onChange={(event) => setInfoValue('collectedAt', event.target.value)} />
                  </WizField>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="mqw-section">
                <div className="mqw-field">
                  <label className="mqw-label" htmlFor="wiz-search">Cari Munfiq</label>
                  <div className="mqw-money">
                    <span className="mqw-money-prefix" aria-hidden="true"><Search size={16} /></span>
                    <input id="wiz-search" className="mqw-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, ID, nomor HP, atau desa" />
                  </div>
                </div>

                <div className="mqw-pick-count">
                  <span>{formatNumber(selectedIds.length)} Munfiq terpilih</span>
                  {selectedIds.length ? <button type="button" className="mqw-link" onClick={() => { setSelectedIds([]); setDrafts({}); }}>Kosongkan</button> : null}
                </div>
                {selectionError ? <span className="mqw-error" role="alert" style={{ marginTop: 10 }}>{selectionError}</span> : null}

                {visibleMunfiq.length ? (
                  <div className="mqw-pick-list">
                    {visibleMunfiq.map((munfiq) => {
                      const picked = selectedIds.includes(munfiq.id);
                      return (
                        <button key={munfiq.id} type="button" className="mqw-pick" aria-pressed={picked} onClick={() => toggleMunfiq(munfiq.id)}>
                          <span className="mqw-pick-box" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                          <span className="mqw-pick-body">
                            <span className="mqw-pick-name">{munfiq.name}</span>
                            <span className="mqw-pick-meta">{munfiq.memberId} · {formatPhoneNumber(munfiq.phone)} · {munfiq.village}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mqw-empty">{info.kecamatan ? 'Tidak ada Munfiq yang cocok dengan pencarian ini.' : 'Pilih PLPK pada langkah sebelumnya untuk melihat daftar Munfiq.'}</p>
                )}
              </section>
            )}

            {step === 3 && (
              <section className="mqw-section">
                {selectedDrafts.map((draft) => (
                  <CollectionEntryRow
                    key={draft.munfiqId}
                    draft={draft}
                    error={amountErrors[draft.munfiqId]}
                    onChange={(next) => {
                      setDrafts((previous) => ({ ...previous, [next.munfiqId]: next }));
                      setAmountErrors((previous) => { if (!previous[next.munfiqId]) return previous; const copy = { ...previous }; delete copy[next.munfiqId]; return copy; });
                    }}
                  />
                ))}

                <dl className="mqw-totals">
                  <div><dt>Total Koin</dt><dd>{formatRupiah(runningTotals.total)}</dd></div>
                  <div><dt>Memenuhi Syarat</dt><dd>{formatNumber(runningTotals.eligible)} Munfiq</dd></div>
                  <div><dt>Total Upah PLPK</dt><dd className="is-fee">{formatRupiah(runningTotals.fee)}</dd></div>
                </dl>
              </section>
            )}

            {step === 4 && (
              <CollectionReview
                info={{ period: info.period, plpkName: plpk?.name ?? '', plpkId: info.plpkId, kecamatan: info.kecamatan, village: info.village, collectedAt: info.collectedAt }}
                entries={selectedDrafts}
              />
            )}
          </div>

          <footer className="mqw-foot">
            <button type="button" className="mqw-btn mqw-btn-ghost" onClick={() => (step === 1 ? onClose() : setStep((current) => current - 1))}>
              {step === 1 ? 'Batal' : 'Kembali'}
            </button>
            {step < 4 ? <button type="submit" className="mqw-btn mqw-btn-primary">Lanjut</button> : null}
            {step === 4 ? (
              <>
                <button type="button" className="mqw-btn mqw-btn-quiet" onClick={handleSaveDraft}>Simpan Draft</button>
                <button type="button" className="mqw-btn mqw-btn-primary" onClick={handleComplete}>Selesaikan Penghimpunan</button>
              </>
            ) : null}
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WizField({ id, label, required, error, hint, wide, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? 'mqw-field mqw-field-wide' : 'mqw-field'}>
      <label className="mqw-label" htmlFor={id}><span>{label}{required && <span className="mqw-req" aria-hidden="true">*</span>}</span></label>
      {children}
      {error ? <span id={`${id}-error`} className="mqw-error" role="alert">{error}</span> : hint ? <span id={`${id}-hint`} className="mqw-hint">{hint}</span> : null}
    </div>
  );
}
