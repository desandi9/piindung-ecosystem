'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BatteryMedium, Check, ChevronLeft, Copy, Download, Info, Signal, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { isAbortedRequest, runActorRequest, subscribeActorSession } from '@/services/api/actor-session';
import { MobileActorAccessUnavailable } from '../mobile-shared/mobile-actor-access-unavailable';
import { MunfiqBottomNavigation } from './munfiq-bottom-navigation';
import { munfiqFont } from './munfiq-font';
import './munfiq-stitch.css';
import './munfiq-barcode.css';

type MemberIdentity = {
  memberId: string;
  name: string;
  role: string;
  status: string;
  organization: string;
  qrUrl: string;
};

export function MunfiqBarcodeScreen({ ownerUserId, homeHref = '/gorut-v2/mobile/munfiq', fromPickup = false, fromProgram = false, fromAccount = false }: {
  ownerUserId: string;
  homeHref?: string;
  fromPickup?: boolean;
  fromProgram?: boolean;
  fromAccount?: boolean;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const authorized = !authLoading && user?.id === ownerUserId;
  const [identity, setIdentity] = useState<MemberIdentity | null>(null);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [qrReady, setQrReady] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const backHref = fromPickup ? `${homeHref}/penjemputan` : fromProgram ? `${homeHref}/program` : fromAccount ? `${homeHref}/akun` : homeHref;

  useEffect(() => {
    if (!authorized) return;
    const request = new AbortController();
    setIdentity(null);
    setError('');
    setQrReady(false);
    setQrError(false);
    setActionMessage('');
    setCopied(false);
    const unsubscribe = subscribeActorSession(() => {
      request.abort();
      setIdentity(null);
      setError('Sesi berubah. Muat ulang halaman untuk melihat identitas Anda.');
    });
    void runActorRequest(async (signal) => {
      const response = await fetch('/api/member-identity/me', { cache: 'no-store', signal });
      if (!response.ok) throw new Error('Identitas belum dapat dimuat. Silakan coba lagi.');
      return await response.json() as MemberIdentity;
    }, request.signal).then(setIdentity).catch((cause: unknown) => {
      if (!isAbortedRequest(cause)) setError(cause instanceof Error ? cause.message : 'Identitas belum dapat dimuat.');
    });
    return () => { request.abort(); unsubscribe(); };
  }, [authorized, attempt]);

  const copyId = async () => {
    if (!identity || !authorized) return;
    try {
      await navigator.clipboard.writeText(identity.memberId);
      setCopied(true);
      setActionMessage('ID anggota berhasil disalin.');
    } catch {
      setActionMessage('ID belum bisa disalin. Tekan dan tahan ID anggota untuk menyalinnya.');
    }
  };

  const saveQr = async () => {
    if (!identity || !authorized || saving) return;
    setSaving(true);
    setActionMessage('');
    try {
      const blob = await runActorRequest(async (signal) => {
        const response = await fetch(identity.qrUrl, { signal });
        if (!response.ok) throw new Error('QR belum bisa disimpan. Silakan coba lagi.');
        return await response.blob();
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Barcode-${identity.memberId}.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setActionMessage('Unduhan QR sudah dimulai.');
    } catch (cause) {
      if (!isAbortedRequest(cause)) setActionMessage(cause instanceof Error ? cause.message : 'QR belum bisa disimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (!authLoading && !authorized) return <MobileActorAccessUnavailable actorType="MUNFIQ" reason="forbidden" />;

  return <div className={`mq-shell munfiq-mobile-surface mq-barcode-shell ${munfiqFont.variable}`}>
    <a className="mq-skip-link" href="#mq-barcode-content">Lewati ke konten</a>
    <header className="mq-barcode-header">
      <div className="mq-barcode-status" aria-hidden="true"><strong>9:41</strong><span><Signal size={15} /><Wifi size={15} /><BatteryMedium size={17} /></span></div>
      <Link className="mq-icon-button" href={backHref} aria-label={fromPickup ? 'Kembali ke Penjemputan' : fromProgram ? 'Kembali ke Program' : fromAccount ? 'Kembali ke Akun' : 'Kembali ke Beranda'}><ChevronLeft size={22} aria-hidden="true" /></Link>
    </header>
    <main id="mq-barcode-content" className="mq-barcode-main" aria-labelledby="mq-barcode-title">
      <div className="mq-barcode-heading"><h1 id="mq-barcode-title">Barcode Saya</h1><p>Identitas anggota Anda dalam satu QR.</p></div>
      {error ? <div className="mq-error" role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Coba lagi</button></div>
        : !identity || authLoading ? <div className="mq-barcode-loading" role="status">Memuat identitas dan QR Anda…</div>
          : <>
            <section className="mq-barcode-card" aria-label="QR identitas anggota">
              <Image src="/LOGO%20GORUT.png" alt="GORUT" width={96} height={42} className="mq-barcode-logo" />
              <h2>{identity.name}</h2>
              <p className="mq-barcode-role">{identity.role}<span aria-hidden="true"> · </span><span>{identity.status}</span></p>
              <div className="mq-barcode-qr">
                {qrError ? <div className="mq-barcode-image-error" role="alert"><p>Gambar QR belum dapat dimuat.</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Muat ulang QR</button></div>
                  : <><Image key={attempt} src={`${identity.qrUrl}?retry=${attempt}`} alt={`QR verifikasi identitas ${identity.name}`} width={240} height={240} unoptimized onLoad={() => setQrReady(true)} onError={() => setQrError(true)} />{!qrReady ? <span role="status">Memuat QR…</span> : null}</>}
              </div>
              <div className="mq-barcode-member"><span>ID Anggota</span><strong>{identity.memberId}</strong></div>
              <p className="mq-barcode-organization">{identity.organization}</p>
            </section>
            <div className="mq-barcode-actions">
              <button type="button" onClick={() => void copyId()}>{copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}{copied ? 'ID tersalin' : 'Salin ID'}</button>
              <button type="button" onClick={() => void saveQr()} disabled={!qrReady || qrError || saving}><Download size={18} aria-hidden="true" />{saving ? 'Menyimpan…' : 'Simpan QR'}</button>
            </div>
            <p className="mq-barcode-feedback" role="status">{actionMessage}</p>
            <p className="mq-barcode-note"><Info size={18} aria-hidden="true" /><span>Tunjukkan QR ini untuk memeriksa keabsahan identitas anggota Anda.</span></p>
          </>}
    </main>
    <MunfiqBottomNavigation homeHref={homeHref} />
  </div>;
}
