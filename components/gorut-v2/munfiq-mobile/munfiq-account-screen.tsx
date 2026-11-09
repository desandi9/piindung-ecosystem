'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { Ambulance, BatteryMedium, Bell, Check, ChevronRight, CircleHelp, Copy, Globe, Info, LockKeyhole, LogOut, MapPin, QrCode, ReceiptText, ShieldCheck, Signal, Truck, UserRound, Wifi, X, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { validateAvatarReference, type AccountProfile } from '@/lib/account-profile';
import { useMobileLogout } from '@/features/gorut-v2/mobile-auth';
import type { SwitchableOperationalPersona } from '@/features/gorut-v2/mobile-role-space';
import { munfiqAccountSummary } from '@/features/gorut-v2/munfiq-account';
import { munfiqHomePresentationData } from '@/features/gorut-v2/munfiq-home-presentation-data';
import type { MunfiqCollectionsResponse } from '@/features/gorut-v2/munfiq-presentation';
import { isAbortedRequest, runActorRequest, subscribeActorSession } from '@/services/api/actor-session';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileActorAccessUnavailable } from '../mobile-shared/mobile-actor-access-unavailable';
import { MobileRoleSpaceLink } from '../mobile-shared/mobile-role-space-link';
import { MunfiqBottomNavigation } from './munfiq-bottom-navigation';
import { MunfiqPasswordForm, MunfiqProfileForm } from './munfiq-account-forms';
import { munfiqFont } from './munfiq-font';
import './munfiq-stitch.css';
import './munfiq-account.css';

type Panel = 'profile' | 'password' | 'privacy' | 'logout';
type Data = { profile: AccountProfile | null; collections: MunfiqCollectionsResponse | null; unread: number | null };
const emptyData: Data = { profile: null, collections: null, unread: null };
const panelCopy = {
  profile: ['Profil Saya', 'Kelola informasi kontak akun Anda.'],
  password: ['Keamanan Akun', 'Perbarui kata sandi akun GORUT Anda.'],
  privacy: ['Kebijakan Privasi', 'Informasi mengenai dokumen kebijakan.'],
  logout: ['Keluar dari akun?', 'Anda perlu masuk kembali untuk melihat data pribadi dan riwayat infak.'],
};
const infoHref = '/login/gorut/publik/informasi';

export function MunfiqAccountScreen({ owner, identity, homeHref = '/gorut-v2/mobile/munfiq', operationalReturn }: {
  owner: { userId: string; munfiqCode: string };
  identity: { name: string; active: boolean };
  homeHref?: string;
  operationalReturn?: SwitchableOperationalPersona;
}) {
  const { user, isLoading: authLoading, setUser } = useAuth();
  const authorized = !authLoading && user?.id === owner.userId;
  const [data, setData] = useState<Data>(emptyData);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionChanged, setSessionChanged] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [panelBusy, setPanelBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const opener = useRef<HTMLElement | null>(null);
  const lifetime = useRef(new AbortController());
  const onLogoutError = useCallback((message: string) => { setLogoutError(message); setAttempt((value) => value + 1); }, []);
  const { logout, logoutPending } = useMobileLogout('MUNFIQ', onLogoutError);

  useEffect(() => {
    if (!authorized) return;
    const request = new AbortController(); lifetime.current = request;
    setData(emptyData); setErrors([]); setLoading(true); setSessionChanged(false);
    const unsubscribe = subscribeActorSession(() => {
      request.abort(); setData(emptyData); setPanel(null); setPanelBusy(false); setNotice(''); setSessionChanged(true); setLoading(false);
    });
    async function read<T>(path: string, message: string) {
      return runActorRequest(async (signal) => {
        const response = await fetch(path, { cache: 'no-store', signal });
        if (!response.ok) throw new Error(message);
        return await response.json() as T;
      }, request.signal);
    }
    void Promise.allSettled([
      read<{ profile: AccountProfile }>('/api/account/profile', 'Profil belum dapat dimuat.'),
      read<MunfiqCollectionsResponse>('/api/gorut/munfiq/me/collections', 'Ringkasan infak belum dapat dimuat.').then((result) => {
        if (result.owner.munfiqCode !== owner.munfiqCode) throw new Error('Identitas Munfiq berubah. Muat ulang halaman.');
        return result;
      }),
      read<{ unreadCount: number }>('/api/notifications/me?page=1&limit=1', 'Jumlah notifikasi belum dapat dimuat.'),
    ]).then(([profile, collections, notifications]) => {
      if (request.signal.aborted) return;
      setData({ profile: profile.status === 'fulfilled' ? profile.value.profile : null, collections: collections.status === 'fulfilled' ? collections.value : null, unread: notifications.status === 'fulfilled' ? notifications.value.unreadCount : null });
      setErrors([profile, collections, notifications].flatMap((result) => result.status === 'rejected' && !isAbortedRequest(result.reason) ? [result.reason instanceof Error ? result.reason.message : 'Data akun belum dapat dimuat.'] : []));
      setLoading(false);
    });
    return () => { request.abort(); unsubscribe(); };
  }, [authorized, owner.userId, owner.munfiqCode, attempt]);

  const openPanel = (next: Panel) => { opener.current = document.activeElement as HTMLElement; setNotice(''); setPanelBusy(false); setPanel(next); };
  const profile = data.profile;
  const displayName = profile?.name || identity.name;
  const initials = (displayName.match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M';
  const avatar = validateAvatarReference(profile?.avatar ?? null).value;
  const fixture = data.collections && data.collections.collections.length === 0 ? munfiqHomePresentationData(process.env.NODE_ENV, owner.munfiqCode) : null;
  const summary = data.collections ? munfiqAccountSummary((fixture?.collections ?? data.collections).collections) : null;
  const contact = profile ? [profile.phone, profile.email].filter(Boolean).join(' · ') || 'Kontak belum dilengkapi' : loading ? 'Memuat profil…' : 'Kontak belum tersedia';
  const address = profile ? profile.address || 'Alamat belum dilengkapi' : loading ? 'Memuat alamat…' : 'Alamat belum tersedia';

  async function copyCode() {
    const signal = lifetime.current.signal;
    if (!authorized || signal.aborted) return;
    try {
      await navigator.clipboard.writeText(owner.munfiqCode);
      if (!signal.aborted) setNotice('ID Munfiq berhasil disalin.');
    } catch {
      if (!signal.aborted) setNotice('ID belum bisa disalin. Tekan dan tahan ID Munfiq untuk menyalinnya.');
    }
  }

  if (!authLoading && !authorized) return <MobileActorAccessUnavailable actorType="MUNFIQ" reason="forbidden" />;

  return <div className={`mq-shell munfiq-mobile-surface mqa-shell ${munfiqFont.variable}`}>
    <a className="mq-skip-link" href="#mqa-main">Lewati ke konten</a>
    <header className="mqa-header">
      <div className="mqa-status" aria-hidden="true"><strong>9:41</strong><span><Signal size={15} /><Wifi size={15} /><BatteryMedium size={17} /></span></div>
      <div className="mqa-heading"><div><h1 id="mqa-title" tabIndex={-1}>Akun</h1><p>Kelola profil dan layanan akun Anda.</p></div><Link className="mq-icon-button" href={`${infoHref}#gpi-panduan`} prefetch={false} aria-label="Pusat Bantuan"><CircleHelp size={21} /></Link></div>
    </header>
    <main id="mqa-main" className="mqa-content" aria-labelledby="mqa-title" aria-busy={loading || authLoading}>
      {logoutPending ? <p className="mqa-feedback" role="status">Sedang keluar…</p> : null}
      {logoutError ? <div className="mqa-error" role="alert"><p>{logoutError}</p><button type="button" disabled={logoutPending} onClick={() => openPanel('logout')}>Coba keluar lagi</button></div> : null}
      {sessionChanged && !logoutPending ? <div className="mqa-error" role="alert"><p>Sesi berubah. Muat ulang untuk melihat akun Anda.</p><button type="button" onClick={() => window.location.reload()}>Muat ulang halaman</button></div> : null}
      {!sessionChanged && !logoutPending ? <>
        {errors.length ? <div className="mqa-error" role="alert">{errors.map((message) => <p key={message}>{message}</p>)}<button type="button" disabled={loading} onClick={() => setAttempt((value) => value + 1)}>Coba lagi</button></div> : null}
        <section className="mqa-profile" aria-label="Profil akun">
          <div className="mqa-profile-top"><Avatar className="mqa-avatar"><AvatarImage src={avatar ?? undefined} alt="" /><AvatarFallback>{initials}</AvatarFallback></Avatar><div className="mqa-identity"><div><h2>{displayName}</h2><span className="mqa-badge">Munfiq</span></div><p>{contact}</p><p className="mqa-location"><MapPin size={14} aria-hidden="true" /><span>{address}</span></p></div></div>
          <div className="mqa-profile-actions"><button type="button" disabled={!profile || loading} onClick={() => openPanel('profile')}>Lihat &amp; Ubah Profil<ChevronRight size={15} /></button><button type="button" className="mqa-copy" aria-label="Salin ID Munfiq" onClick={() => void copyCode()}><span>ID: {owner.munfiqCode}</span><Copy size={13} /></button></div>
          <dl className="mqa-stats" data-presentation-data={fixture?.marker}><div><dt>Total Infak Tercatat</dt><dd>{summary ? summary.total : loading ? 'Memuat…' : 'Belum tersedia'}</dd></div><div><dt>Status Partisipasi</dt><dd className={identity.active ? 'is-active' : ''}>{identity.active ? <Check size={14} aria-hidden="true" /> : null}Munfiq {identity.active ? 'Aktif' : 'Tidak Aktif'}</dd></div></dl>
          {fixture ? <p className="mqa-demo">Contoh tampilan · Ringkasan infak menggunakan data ilustrasi.</p> : null}
        </section>
        <div className="mqa-feedback" role="status">{notice}</div>
        <section className="mqa-section" aria-labelledby="mqa-personal"><h2 id="mqa-personal">Layanan Pribadi</h2><div className="mqa-menu">
          <AccountRow icon={QrCode} title="Barcode Saya" description="Lihat QR identitas anggota Anda" href={`${homeHref}/barcode?from=akun`} />
          <AccountRow icon={Truck} title="Riwayat Penjemputan" description="Jadwal dan status penjemputan koin" href={`${homeHref}/penjemputan`} />
          <AccountRow icon={ReceiptText} title="PPOB & Tagihan" description="Pembayaran digital belum tersedia" unavailable />
          <AccountRow icon={Ambulance} title="Layanan Ambulans" description="Layanan ambulans belum tersedia di aplikasi" unavailable />
          <AccountRow icon={Bell} title="Notifikasi" description="Pembaruan kontribusi dan penjemputan" href={`${homeHref}/notifikasi`} count={data.unread ?? undefined} />
        </div></section>
        <section className="mqa-section" aria-labelledby="mqa-preferences"><h2 id="mqa-preferences">Akun &amp; Preferensi</h2><div className="mqa-menu mqa-preferences">
          {operationalReturn ? <MobileRoleSpaceLink className="mqa-row" href={operationalReturn.href}><span className="mqa-icon"><UserRound size={20} /></span><span className="mqa-row-copy"><strong>Kembali ke Ruang {operationalReturn.label}</strong><small>Lanjutkan pekerjaan sesuai penugasan Anda</small></span><ChevronRight size={17} /></MobileRoleSpaceLink> : null}
          <AccountRow icon={Globe} title="Mode Publik" description="Jelajahi informasi dan transparansi GORUT" href="/login/gorut/publik" />
          <AccountRow icon={LockKeyhole} title="Pengaturan Akun" description="Keamanan dan perubahan kata sandi" onClick={() => openPanel('password')} />
          <AccountRow icon={CircleHelp} title="Pusat Bantuan & FAQ" description="Panduan dan kanal kontak resmi" href={`${infoHref}#gpi-panduan`} />
          <AccountRow icon={ShieldCheck} title="Kebijakan Privasi" description="Informasi dokumen kebijakan" onClick={() => openPanel('privacy')} />
          <AccountRow icon={Info} title="Tentang GORUT" description="Gerakan Koin NU Kabupaten Garut" href={`${infoHref}#gpi-tentang`} />
        </div></section>
        <div className="mqa-footer"><button type="button" className="mqa-logout" disabled={logoutPending} onClick={() => openPanel('logout')}><LogOut size={18} />Keluar dari Akun</button><p>GORUT · NU Care–LAZISNU Kabupaten Garut</p></div>
      </> : null}
    </main>
    <MunfiqBottomNavigation activeKey="account" homeHref={homeHref} showNotificationDot={Boolean(data.unread)} />
    <Dialog.Root open={panel !== null && authorized} onOpenChange={(open) => { if (!open && !panelBusy && !logoutPending) setPanel(null); }}>
      <Dialog.Portal><Dialog.Overlay className="mqa-overlay" /><Dialog.Content className={`mqa-sheet ${munfiqFont.variable}`} onEscapeKeyDown={(event) => { if (panelBusy || logoutPending) event.preventDefault(); }} onInteractOutside={(event) => { if (panelBusy || logoutPending) event.preventDefault(); }} onCloseAutoFocus={(event) => { event.preventDefault(); (opener.current?.isConnected ? opener.current : document.getElementById('mqa-title'))?.focus(); }}>
        <div className="mqa-handle" /><Dialog.Close className="mqa-close" disabled={panelBusy || logoutPending} aria-label="Tutup"><X size={20} /></Dialog.Close>
        <Dialog.Title>{panel ? panelCopy[panel][0] : ''}</Dialog.Title><Dialog.Description>{panel ? panelCopy[panel][1] : ''}</Dialog.Description>
        {panel === 'profile' && profile ? <MunfiqProfileForm profile={profile} onBusy={setPanelBusy} onSaved={(updated) => { setData((current) => ({ ...current, profile: updated })); if (user) setUser({ ...user, name: updated.name, email: updated.email, avatar: updated.avatar ?? undefined }); setPanelBusy(false); setPanel(null); setNotice('Profil berhasil disimpan.'); }} /> : null}
        {panel === 'password' ? <MunfiqPasswordForm onBusy={setPanelBusy} loginHref={`/gorut-v2/mobile/login?next=${encodeURIComponent(`${homeHref}/akun`)}`} /> : null}
        {panel === 'privacy' ? <div className="mqa-information"><p>Dokumen kebijakan privasi belum tersedia di aplikasi. Untuk keterangan penggunaan data, hubungi kanal resmi NU Care–LAZISNU Garut.</p><Link className="mqa-primary" href={`${infoHref}#gpi-kontak`}>Lihat kontak resmi<ChevronRight size={16} /></Link></div> : null}
        {panel === 'logout' ? <div className="mqa-confirm"><Dialog.Close className="mqa-secondary" disabled={logoutPending}>Tetap di sini</Dialog.Close><button type="button" className="mqa-logout" disabled={logoutPending} onClick={logout}>{logoutPending ? 'Sedang keluar…' : 'Ya, keluar'}</button></div> : null}
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>;
}

function AccountRow({ icon: Icon, title, description, href, onClick, unavailable, count }: {
  icon: LucideIcon; title: string; description: string; href?: string; onClick?: () => void; unavailable?: boolean; count?: number;
}) {
  const content = <><span className="mqa-icon"><Icon size={20} aria-hidden="true" /></span><span className="mqa-row-copy"><strong>{title}</strong><small>{description}</small></span>{count ? <span className="mqa-count" aria-label={`${count} belum dibaca`}>{count > 99 ? '99+' : count}</span> : null}{unavailable ? <span className="mqa-unavailable">Belum tersedia</span> : <ChevronRight size={17} aria-hidden="true" />}</>;
  if (unavailable) return <div className="mqa-row is-unavailable">{content}</div>;
  return href ? <Link className="mqa-row" href={href} prefetch={false}>{content}</Link> : <button type="button" className="mqa-row" onClick={onClick}>{content}</button>;
}
