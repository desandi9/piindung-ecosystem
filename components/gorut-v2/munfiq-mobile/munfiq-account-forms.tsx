'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { validatePasswordInput, type AccountProfile } from '@/lib/account-profile';
import { munfiqProfilePatch, type MunfiqProfileDraft } from '@/features/gorut-v2/munfiq-account';
import { isAbortedRequest, runActorRequest } from '@/services/api/actor-session';

export function MunfiqProfileForm({ profile, onSaved, onBusy }: {
  profile: AccountProfile; onSaved: (profile: AccountProfile) => void; onBusy: (busy: boolean) => void;
}) {
  const [draft, setDraft] = useState<MunfiqProfileDraft>({ name: profile.name, phone: profile.phone, email: profile.email, address: profile.address });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const request = useRef(new AbortController());
  const pending = useRef(false);
  useEffect(() => { request.current = new AbortController(); return () => request.current.abort(); }, []);
  const patch = munfiqProfilePatch(profile, draft);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !Object.keys(patch).length) return;
    pending.current = true; setSaving(true); onBusy(true); setError('');
    try {
      const updated = await runActorRequest(async (signal) => {
        const response = await fetch('/api/account/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch), signal });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.profile) throw new Error(result?.error ?? 'Profil gagal disimpan. Silakan coba lagi.');
        if (result.profile.memberId !== profile.memberId) throw new Error('Identitas akun berubah. Muat ulang halaman.');
        return result.profile as AccountProfile;
      }, request.current.signal);
      onSaved(updated);
    } catch (cause) {
      if (!isAbortedRequest(cause)) setError(cause instanceof Error ? cause.message : 'Profil gagal disimpan. Silakan coba lagi.');
    } finally {
      pending.current = false;
      if (!request.current.signal.aborted) { setSaving(false); onBusy(false); }
    }
  }

  return <form className="mqa-form" onSubmit={(event) => void save(event)}>
    <p className="mqa-form-note">Perubahan ini berlaku pada profil akun Anda. Data wilayah dan identitas Munfiq dikelola oleh petugas.</p>
    <fieldset disabled={saving}>
      <label htmlFor="mqa-name">Nama lengkap<input id="mqa-name" autoComplete="name" required minLength={2} maxLength={120} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
      <label htmlFor="mqa-phone">Nomor HP<input id="mqa-phone" type="tel" autoComplete="tel" required maxLength={20} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label>
      <div><label htmlFor="mqa-email">Email {!profile.email ? <span>(opsional)</span> : null}<input id="mqa-email" type="email" autoComplete="email" required={Boolean(profile.email)} aria-describedby={profile.email ? 'mqa-email-hint' : undefined} maxLength={254} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>{profile.email ? <p id="mqa-email-hint" className="mqa-field-hint">Email yang sudah terdaftar dapat diganti, tetapi belum dapat dihapus.</p> : null}</div>
      <label htmlFor="mqa-address">Alamat <span>(opsional)</span><textarea id="mqa-address" autoComplete="street-address" minLength={5} maxLength={240} rows={3} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} /></label>
    </fieldset>
    {error ? <p role="alert" className="mqa-error">{error}</p> : null}
    <button type="submit" className="mqa-primary" disabled={saving || !Object.keys(patch).length}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</button>
  </form>;
}

export function MunfiqPasswordForm({ onBusy, loginHref }: { onBusy: (busy: boolean) => void; loginHref: string }) {
  const { setUser } = useAuth();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(new AbortController());
  const pending = useRef(false);
  useEffect(() => { request.current = new AbortController(); return () => request.current.abort(); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (!validatePasswordInput(values.currentPassword, values.newPassword, values.confirmPassword).valid) {
      setError('Gunakan minimal 8 karakter, berbeda dari kata sandi saat ini, dan pastikan konfirmasinya sama.');
      return;
    }
    pending.current = true; setSaving(true); onBusy(true); setError('');
    try {
      await runActorRequest(async (signal) => {
        const response = await fetch('/api/account/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values), signal });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error ?? 'Kata sandi gagal diubah. Silakan coba lagi.');
        if (!result?.success || !result.requiresLogin) throw new Error('Respons belum dapat dikonfirmasi. Silakan masuk kembali.');
      }, request.current.signal);
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setUser(null);
      window.location.assign(loginHref);
    } catch (cause) {
      if (!isAbortedRequest(cause)) setError(cause instanceof Error ? cause.message : 'Kata sandi gagal diubah. Silakan coba lagi.');
    } finally {
      pending.current = false;
      if (!request.current.signal.aborted) { setSaving(false); onBusy(false); }
    }
  }

  return <form className="mqa-form" onSubmit={(event) => void save(event)}>
    <p className="mqa-form-note">Gunakan minimal 8 karakter. Setelah berhasil, Anda perlu masuk kembali dengan kata sandi baru.</p>
    <fieldset disabled={saving}>{([
      ['currentPassword', 'Kata sandi saat ini', 'current-password'],
      ['newPassword', 'Kata sandi baru', 'new-password'],
      ['confirmPassword', 'Konfirmasi kata sandi baru', 'new-password'],
    ] as const).map(([field, label, complete]) => <label key={field} htmlFor={`mqa-${field}`}>{label}<input id={`mqa-${field}`} type={visible ? 'text' : 'password'} autoComplete={complete} required minLength={field === 'currentPassword' ? undefined : 8} value={values[field]} onChange={(event) => setValues({ ...values, [field]: event.target.value })} /></label>)}</fieldset>
    <button type="button" className="mqa-reveal" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}{visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}</button>
    {error ? <p role="alert" className="mqa-error">{error}</p> : null}
    <button type="submit" className="mqa-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Ubah kata sandi'}</button>
  </form>;
}
