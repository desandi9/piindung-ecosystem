'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useMobileLogout } from '@/features/gorut-v2/mobile-auth';
import type { MobileActorType } from '../../../lib/gorut/mobile-actor-access-pure';

const actorLabels: Record<MobileActorType, string> = { MUNFIQ: 'Munfiq', PLPK: 'PLPK', KORDES: 'Kordes' };

export function MobileActorAccessUnavailable({
  actorType,
  reason,
}: {
  actorType: MobileActorType;
  reason: 'forbidden' | 'unavailable' | 'contract-gap';
}) {
  const [notice, setNotice] = useState('');
  const { logout, logoutPending } = useMobileLogout(actorType, setNotice);
  const actorLabel = actorLabels[actorType];
  const title = reason === 'unavailable' ? `Akses ${actorLabel} belum dapat diperiksa` : `Akses ${actorLabel} tidak tersedia`;
  const description = reason === 'contract-gap'
    ? 'Akun PIINDUNG belum memiliki relasi Munfiq canonical. Akses ditutup agar identitas tidak diterka dari nama atau nomor HP.'
    : reason === 'unavailable'
      ? 'Coba lagi setelah koneksi layanan pulih.'
      : `Akun ini tidak memiliki assignment operasional ${actorLabel} aktif yang valid.`;

  return (
    <main className="plpk-app">
      <div className="plpk-scroll">
        <section className="plpk-card plpk-empty" role="alert">
          <strong>{title}</strong>
          <p>{description}</p>
          <Link className="plpk-btn" href="/dashboard">Kembali ke dashboard</Link>
          <button type="button" className="plpk-logout-button" onClick={logout} disabled={logoutPending}>
            {logoutPending ? 'Sedang keluar…' : 'Keluar'}
          </button>
          {notice ? <p role="status">{notice}</p> : null}
        </section>
      </div>
    </main>
  );
}
