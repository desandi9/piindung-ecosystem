'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, Check, ChevronRight, PenLine, ScanLine, ShieldCheck, X } from 'lucide-react';

import type { GorutMunfiq, GorutMunfiqStatus } from '@/features/gorut-v2/types';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { MunfiqDraft } from './munfiq-shell';
import { DuplicateWarningDialog } from './duplicate-warning-dialog';
import { DocumentScanStep, type MunfiqScanResult } from './document-scan-step';
import { MunfiqScanReview } from './ai-extraction-review';

const stepTitles = {
  1: 'Bagaimana Anda ingin mengisi data?',
  2: 'Pindai dokumen Munfiq',
  3: 'Lengkapi data Munfiq',
  4: 'Periksa data Munfiq',
};

const stepDescriptions = {
  1: 'Pilih cara yang paling mudah. Semua data masih dapat diperiksa sebelum disimpan.',
  2: 'Unggah atau foto dokumen. Sistem akan membantu membaca informasi yang tersedia.',
  3: 'Periksa dan lengkapi informasi yang belum terbaca dari dokumen.',
  4: 'Pastikan seluruh informasi sudah benar sebelum disimpan.',
};

const regions = {
  'Garut Kota': { villages: ['Regol', 'Kota Kulon', 'Sukamentri'], upzis: ['UPZIS Masjid Agung', 'UPZIS Sukagalih'], plpk: ['Ahmad Fauzi', 'Siti Aisyah'] },
  Cikajang: { villages: ['Cikajang', 'Padasuka', 'Girijaya'], upzis: ['UPZIS Cikajang', 'UPZIS Jayaraga'], plpk: ['Dedi Mulyadi', 'Rahmawati'] },
  'Tarogong Kidul': { villages: ['Haurpanggung', 'Jayawaras', 'Sukagalih'], upzis: ['UPZIS Sukagalih', 'UPZIS Jayaraga'], plpk: ['Ujang Solihin', 'Siti Aisyah'] },
  Karangpawitan: { villages: ['Karangpawitan', 'Godog', 'Sindanggalih'], upzis: ['UPZIS Margawati', 'UPZIS Jayaraga'], plpk: ['Asep Ridwan', 'Dedi Mulyadi'] },
};

const statusOptions: GorutMunfiqStatus[] = ['active', 'new', 'unpaid', 'inactive'];

type FormValues = MunfiqDraft;
type FormKey = keyof FormValues;

const emptyForm: FormValues = {
  name: '', phone: '', email: '', kecamatan: '', village: '', upzis: '', plpkName: '', address: '', status: 'new', notes: '',
};

function normalizePhone(value: string) {
  return value.replace(/[^0-9]/g, '').replace(/^62/, '0').slice(0, 15);
}

function formatPhone(value: string) {
  return normalizePhone(value).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function labelStatus(status: GorutMunfiqStatus) {
  return { active: 'Aktif', new: 'Baru', unpaid: 'Belum Setor', inactive: 'Tidak Aktif' }[status];
}

export function MunfiqFormDialog({ open, munfiq, items, onClose, onSave, onViewDuplicate }: { open: boolean; munfiq: GorutMunfiq | null; items: GorutMunfiq[]; onClose: () => void; onSave: (draft: MunfiqDraft) => void; onViewDuplicate?: (item: GorutMunfiq) => void }) {
  const firstErrorRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'scan' | 'manual' | null>(null);

  const [scanResult, setScanResult] = useState<MunfiqScanResult | null>(null);
  const [scanReview, setScanReview] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormKey, boolean>>>({});
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const isEdit = Boolean(munfiq);
  const stepDescription = step === 3 && mode === 'manual' ? 'Masukkan informasi Munfiq secara bertahap. Data masih dapat diubah sebelum disimpan.' : stepDescriptions[step as keyof typeof stepDescriptions];

  useEffect(() => {
    if (!open) return;
    setSuccess(false);
    setScanResult(null);
    setScanReview(false);
    setErrors({});
    setTouched({});
    if (munfiq) {
      setForm({ name: munfiq.name, phone: munfiq.phone, email: munfiq.email || '', kecamatan: munfiq.kecamatan, village: munfiq.village, upzis: munfiq.upzis, plpkName: munfiq.plpkName, address: munfiq.address, status: munfiq.status, notes: munfiq.notes || '' });
      setStep(3);
      setMode('manual');
    } else {
      setForm(emptyForm);
      setStep(1);
      setMode(null);
    }
  }, [munfiq, open]);

  const region = form.kecamatan ? regions[form.kecamatan as keyof typeof regions] : undefined;
  const incomplete = ['name', 'phone', 'address', 'kecamatan', 'village', 'upzis', 'plpkName'].filter((key) => !form[key as FormKey]?.toString().trim()).length;

  const setValue = (key: FormKey, value: string | GorutMunfiqStatus) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const assignErrorRef = (active: boolean) => (node: HTMLElement | null) => {
    if (active && node && !firstErrorRef.current) firstErrorRef.current = node;
  };

  const validate = () => {
    const next: Partial<Record<FormKey, string>> = {};
    if (!form.name.trim()) next.name = 'Nama lengkap belum diisi.';
    if (!form.phone.trim()) next.phone = 'Nomor HP belum diisi.';
    else if (!/^08\d{7,13}$/.test(normalizePhone(form.phone))) next.phone = 'Masukkan nomor HP aktif, contoh 081234567890.';
    if ((form.email || '').trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || '')) next.email = 'Periksa kembali email yang dimasukkan.';
    if (!form.address.trim()) next.address = 'Alamat lengkap belum diisi.';
    if (!form.kecamatan) next.kecamatan = 'Kecamatan belum dipilih.';
    if (!form.village) next.village = 'Desa/Kelurahan belum dipilih.';
    if (!form.upzis) next.upzis = 'UPZIS belum dipilih.';
    if (!form.plpkName) next.plpkName = 'Petugas PLPK belum dipilih.';
    firstErrorRef.current = null;
    setErrors(next);
    setTouched(Object.fromEntries(Object.keys(next).map((key) => [key, true])));
    if (Object.keys(next).length) {
      requestAnimationFrame(() => {
        firstErrorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        firstErrorRef.current?.focus();
      });
      return false;
    }
    return true;
  };

  const applyScan = () => {
    if (!scanResult) return;
    const values = Object.fromEntries(scanResult.fields.filter((field) => field.key !== 'nik' && field.value).map((field) => [field.key, field.value]));
    setForm((previous) => ({ ...previous, ...values, email: previous.email || '', notes: previous.notes || '' }));
    setScanReview(false);
    setStep(3);
  };

  const duplicateCandidates = useMemo(() => items.filter((item) => item.id !== munfiq?.id && (normalizePhone(item.phone) === normalizePhone(form.phone) || (item.name.toLowerCase() === form.name.trim().toLowerCase() && item.address.toLowerCase() === form.address.trim().toLowerCase()))), [form.address, form.name, form.phone, items, munfiq?.id]);

  const attemptSave = () => {
    if (!validate()) return;
    if (duplicateCandidates.length) {
      setDuplicateOpen(true);
      return;
    }
    setSuccess(true);
  };

  const completeSave = () => {
    onSave({ ...form, phone: normalizePhone(form.phone), email: (form.email || '').trim() || undefined, notes: (form.notes || '').trim() || undefined });
  };

  const handleNext = (event: FormEvent) => {
    event.preventDefault();
    if (step === 3 && validate()) setStep(4);
  };

  const handleScanComplete = (result: MunfiqScanResult) => {
    setScanResult(result);
    setScanReview(true);
    setStep(3);
  };

  const fromDocument = (key: string) => Boolean(scanResult?.fields.some((field) => field.key === key && field.value));

  if (success) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent showCloseButton={false} className="mqw-panel" aria-describedby="mqw-success-note">
          <div className="mqw-success">
            <span className="mqw-success-icon" aria-hidden="true"><Check size={30} strokeWidth={2.5} /></span>
            <DialogTitle className="mqw-success-title">Munfiq berhasil ditambahkan</DialogTitle>
            <DialogDescription id="mqw-success-note" className="mqw-success-note">
              {form.name} akan terdaftar dengan ID Munfiq baru di wilayah {form.kecamatan}.
            </DialogDescription>
            <div className="mqw-success-actions">
              <button type="button" onClick={completeSave} className="mqw-btn mqw-btn-quiet">Lihat Detail</button>
              <button type="button" onClick={() => { setSuccess(false); setStep(1); setMode(null); setForm(emptyForm); }} className="mqw-btn mqw-btn-ghost">Tambah Munfiq Lagi</button>
              <button type="button" onClick={completeSave} className="mqw-btn mqw-btn-primary">Selesai</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const showScanReview = scanReview && scanResult && (step === 2 || step === 3);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} className="mqw-panel" aria-describedby="mqw-lede">
        <DialogHeader className="mqw-head">
          <div className="mqw-track" aria-hidden="true"><i style={{ width: `${step * 25}%` }} /></div>
          <span className="mqw-step">Langkah {step} dari 4</span>
          <DialogTitle className="mqw-title">{stepTitles[step as keyof typeof stepTitles]}</DialogTitle>
          <DialogDescription id="mqw-lede" className="mqw-lede">{stepDescription}</DialogDescription>
          <DialogClose aria-label="Tutup" className="mqw-close"><X size={18} /></DialogClose>
        </DialogHeader>

        <form onSubmit={handleNext} className="mqw-form">
          <div className="mqw-body">
            {step === 1 && (
              <div className="mqw-choices">
                <button type="button" onClick={() => { setMode('scan'); setStep(2); }} className="mqw-choice">
                  <span className="mqw-choice-icon" aria-hidden="true"><ScanLine size={22} /></span>
                  <span className="mqw-choice-body">
                    <span className="mqw-choice-title">Pindai Dokumen<span className="mqw-tag">Direkomendasikan</span></span>
                    <span className="mqw-choice-note">Foto atau unggah dokumen agar data terisi otomatis.</span>
                  </span>
                  <ChevronRight size={18} className="mqw-choice-arrow" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => { setMode('manual'); setStep(3); }} className="mqw-choice">
                  <span className="mqw-choice-icon" aria-hidden="true"><PenLine size={20} /></span>
                  <span className="mqw-choice-body">
                    <span className="mqw-choice-title">Isi Data Secara Manual</span>
                    <span className="mqw-choice-note">Masukkan data Munfiq satu per satu.</span>
                  </span>
                  <ChevronRight size={18} className="mqw-choice-arrow" aria-hidden="true" />
                </button>
                <p className="mqw-footnote"><ShieldCheck size={16} aria-hidden="true" />Data hasil pemindaian tidak disimpan sebelum Anda menekan tombol Simpan.</p>
              </div>
            )}

            {step === 2 && !scanReview && <DocumentScanStep onScanComplete={handleScanComplete} />}

            {showScanReview && scanResult && (
              <MunfiqScanReview
                fields={scanResult.fields}
                onAccept={applyScan}
                onRescan={() => { setScanResult(null); setScanReview(false); if (step === 3) setStep(2); }}
              />
            )}

            {step === 3 && !scanReview && (
              <>
                {isEdit && (
                  <button type="button" onClick={() => { setMode('scan'); setStep(2); setScanReview(false); }} className="mqw-link">
                    Pindai dokumen untuk memperbarui data
                  </button>
                )}
                {incomplete > 0 && (
                  <button type="button" onClick={() => firstErrorRef.current?.focus()} className="mqw-notice">
                    <AlertTriangle size={16} aria-hidden="true" />
                    {incomplete} informasi masih perlu dilengkapi
                  </button>
                )}

                <section className="mqw-section" aria-labelledby="mqw-sec-pribadi">
                  <h2 id="mqw-sec-pribadi" className="mqw-section-title">Informasi Pribadi</h2>
                  <p className="mqw-section-note">Data dasar Munfiq yang dapat dihubungi.</p>
                  <div className="mqw-grid">
                    <Field id="mqw-name" label="Nama Lengkap" required error={errors.name} fromDocument={fromDocument('name')}>
                      {(props) => <input {...props} className="mqw-input" value={form.name} ref={assignErrorRef(Boolean(errors.name))} onChange={(e) => setValue('name', e.target.value)} placeholder="Contoh: Ahmad Hidayat" />}
                    </Field>
                    <Field id="mqw-phone" label="Nomor HP" required error={errors.phone} fromDocument={fromDocument('phone')}>
                      {(props) => <input {...props} className="mqw-input" value={formatPhone(form.phone)} ref={assignErrorRef(Boolean(errors.phone))} onChange={(e) => setValue('phone', normalizePhone(e.target.value))} inputMode="tel" placeholder="0812 3456 7890" />}
                    </Field>
                    <Field id="mqw-email" label="Email" error={touched.email ? errors.email : undefined} hint="Opsional">
                      {(props) => <input {...props} className="mqw-input" type="email" value={form.email || ''} onChange={(e) => setValue('email', e.target.value)} onBlur={() => { setTouched((p) => ({ ...p, email: true })); if ((form.email || '').trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || '')) setErrors((p) => ({ ...p, email: 'Periksa kembali email yang dimasukkan.' })); }} placeholder="nama@email.com" />}
                    </Field>
                    <Field id="mqw-address" label="Alamat Lengkap" required error={errors.address} wide fromDocument={fromDocument('address')}>
                      {(props) => <textarea {...props} className="mqw-input" rows={3} value={form.address} ref={assignErrorRef(Boolean(errors.address))} onChange={(e) => setValue('address', e.target.value)} placeholder="Nama jalan, kampung, RT/RW, dan patokan terdekat" />}
                    </Field>
                  </div>
                </section>

                <section className="mqw-section" aria-labelledby="mqw-sec-wilayah">
                  <h2 id="mqw-sec-wilayah" className="mqw-section-title">Wilayah dan Penanggung Jawab</h2>
                  <p className="mqw-section-note">Tentukan lokasi dan wilayah pelayanan Munfiq.</p>
                  <div className="mqw-grid">
                    <Field id="mqw-kecamatan" label="Kecamatan" required error={errors.kecamatan} fromDocument={fromDocument('kecamatan')}>
                      {(props) => (
                        <select {...props} className="mqw-input" value={form.kecamatan} ref={assignErrorRef(Boolean(errors.kecamatan))} onChange={(e) => { setValue('kecamatan', e.target.value); setValue('village', ''); setValue('upzis', ''); setValue('plpkName', ''); }}>
                          <option value="">Pilih Kecamatan</option>
                          {Object.keys(regions).map((item) => <option key={item}>{item}</option>)}
                        </select>
                      )}
                    </Field>
                    <Field id="mqw-village" label="Desa/Kelurahan" required error={errors.village} fromDocument={fromDocument('village')}>
                      {(props) => (
                        <select {...props} className="mqw-input" value={form.village} ref={assignErrorRef(Boolean(errors.village))} onChange={(e) => setValue('village', e.target.value)} disabled={!region}>
                          <option value="">Pilih Desa/Kelurahan</option>
                          {region?.villages.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      )}
                    </Field>
                    <Field id="mqw-upzis" label="UPZIS" required error={errors.upzis}>
                      {(props) => (
                        <select {...props} className="mqw-input" value={form.upzis} ref={assignErrorRef(Boolean(errors.upzis))} onChange={(e) => setValue('upzis', e.target.value)} disabled={!region}>
                          <option value="">Pilih UPZIS</option>
                          {region?.upzis.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      )}
                    </Field>
                    <Field id="mqw-plpk" label="Petugas PLPK" required error={errors.plpkName}>
                      {(props) => (
                        <select {...props} className="mqw-input" value={form.plpkName} ref={assignErrorRef(Boolean(errors.plpkName))} onChange={(e) => setValue('plpkName', e.target.value)} disabled={!region}>
                          <option value="">Pilih Petugas PLPK</option>
                          {region?.plpk.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      )}
                    </Field>
                  </div>
                </section>

                <section className="mqw-section" aria-labelledby="mqw-sec-status">
                  <h2 id="mqw-sec-status" className="mqw-section-title">Status dan Catatan</h2>
                  <p className="mqw-section-note">Atur status keanggotaan dan informasi tambahan.</p>
                  <div className="mqw-pills" role="radiogroup" aria-label="Status Munfiq">
                    {statusOptions.map((status) => (
                      <button key={status} type="button" role="radio" aria-checked={form.status === status} onClick={() => setValue('status', status)} className="mqw-pill">
                        {form.status === status && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                        {labelStatus(status)}
                      </button>
                    ))}
                  </div>
                  <div className="mqw-grid">
                    <Field id="mqw-notes" label="Catatan" wide hint="Opsional">
                      {(props) => <textarea {...props} className="mqw-input" rows={3} value={form.notes || ''} onChange={(e) => setValue('notes', e.target.value)} placeholder="Contoh: jadwal pengambilan koin atau patokan alamat." />}
                    </Field>
                  </div>
                </section>
              </>
            )}

            {step === 4 && (
              <>
                {scanResult && <p className="mqw-footnote"><ShieldCheck size={16} aria-hidden="true" />Sebagian data diisi dari hasil pemindaian dokumen.</p>}
                <SummaryCard title="Informasi Pribadi" onEdit={() => setStep(3)} values={[['Nama Lengkap', form.name], ['Nomor HP', formatPhone(form.phone)], ['Email', form.email || '—'], ['Alamat', form.address]]} />
                <SummaryCard title="Wilayah dan Penanggung Jawab" onEdit={() => setStep(3)} values={[['Kecamatan', form.kecamatan], ['Desa/Kelurahan', form.village], ['UPZIS', form.upzis], ['Petugas PLPK', form.plpkName]]} />
                <SummaryCard title="Status dan Catatan" onEdit={() => setStep(3)} values={[['Status', labelStatus(form.status)], ['Catatan', form.notes || '—']]} />
              </>
            )}
          </div>

          <footer className="mqw-foot">
            <button type="button" onClick={() => (step === 1 || (isEdit && step === 3) ? onClose() : setStep((current) => current - 1))} className="mqw-btn mqw-btn-ghost">
              {step === 1 || (isEdit && step === 3) ? 'Batal' : 'Kembali'}
            </button>
            {step === 3 && !scanReview && <button type="submit" className="mqw-btn mqw-btn-primary">Lanjut</button>}
            {step === 4 && <button type="button" onClick={attemptSave} className="mqw-btn mqw-btn-primary">Simpan</button>}
          </footer>
        </form>
      </DialogContent>

      <DuplicateWarningDialog
        open={duplicateOpen}
        candidates={duplicateCandidates}
        onCancel={() => setDuplicateOpen(false)}
        onViewData={(item) => onViewDuplicate?.(item)}
        onConfirm={() => { setDuplicateOpen(false); setSuccess(true); }}
      />
    </Dialog>
  );
}

type FieldRenderProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
};

function Field({ id, label, required, error, hint, wide, fromDocument, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; wide?: boolean; fromDocument?: boolean; children: (props: FieldRenderProps) => ReactNode }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={wide ? 'mqw-field mqw-field-wide' : 'mqw-field'}>
      <label className="mqw-label" htmlFor={id}>
        <span>{label}{required && <span className="mqw-req" aria-hidden="true">*</span>}</span>
        {fromDocument && <span className="mqw-from-doc">Dari dokumen</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? <span id={errorId} className="mqw-error" role="alert">{error}</span> : hint ? <span id={hintId} className="mqw-hint">{hint}</span> : null}
    </div>
  );
}

function SummaryCard({ title, values, onEdit }: { title: string; values: [string, string][]; onEdit: () => void }) {
  return (
    <section className="mqw-summary">
      <div className="mqw-summary-head">
        <h3>{title}</h3>
        <button type="button" onClick={onEdit} className="mqw-link">Ubah</button>
      </div>
      <dl className="mqw-summary-list">
        {values.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
