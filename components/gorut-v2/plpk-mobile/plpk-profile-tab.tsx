'use client';

import { Info, UserRound } from 'lucide-react';

import type { CollectionBatch, PlpkProfile } from '@/features/gorut-v2/types';
import { formatDateShort, formatNumber, formatPhoneNumber, formatRupiah, getInitials } from '@/features/gorut-v2/formatters';

/** Profil PLPK. Mock — tidak terhubung ke auth atau role. */
export function PlpkProfileTab({ profile, batches }: { profile: PlpkProfile; batches: CollectionBatch[] }) {
  const verified = batches.filter((batch) => batch.status === 'verified-by-kordes');
  const lifetimeGross = verified.reduce((sum, batch) => sum + batch.grossAmount, 0);
  const lifetimeFee = verified.reduce((sum, batch) => sum + batch.totalPlpkFee, 0);

  return (
    <>
      <header className="plpk-header is-plain">
        <span className="plpk-header-mark" aria-hidden="true"><UserRound size={19} /></span>
        <div className="plpk-header-text">
          <strong>Profil</strong>
          <span>Petugas Lapangan Penghimpun Koin</span>
        </div>
      </header>

      <div className="plpk-scroll">
        <section className="plpk-identity" aria-label="Identitas petugas">
          <div className="plpk-identity-top">
            <span className="plpk-identity-avatar" aria-hidden="true">{getInitials(profile.name)}</span>
            <div>
              <strong>{profile.name}</strong>
              <span>{profile.plpkId}</span>
            </div>
          </div>
        </section>

        <h2 className="plpk-section-title">Data Petugas</h2>
        <section className="plpk-card">
          <dl className="plpk-profile-rows">
            <div><dt>Nama</dt><dd>{profile.name}</dd></div>
            <div><dt>ID PLPK</dt><dd>{profile.plpkId}</dd></div>
            <div><dt>Nomor HP</dt><dd>{formatPhoneNumber(profile.phone)}</dd></div>
            <div><dt>Desa/Ranting</dt><dd>{profile.village}</dd></div>
            <div><dt>Kecamatan</dt><dd>{profile.kecamatan}</dd></div>
            <div><dt>Kordes</dt><dd>{profile.kordesName}</dd></div>
            <div><dt>UPZIS</dt><dd>{profile.upzis}</dd></div>
            <div><dt>Bertugas Sejak</dt><dd>{formatDateShort(profile.joinedAt)}</dd></div>
          </dl>
        </section>

        <h2 className="plpk-section-title">Rekap Tugas</h2>
        <section className="plpk-card">
          <dl className="plpk-profile-rows">
            <div><dt>Periode Terverifikasi</dt><dd>{formatNumber(verified.length)}</dd></div>
            <div><dt>Total Penghimpunan</dt><dd>{formatRupiah(lifetimeGross)}</dd></div>
            <div><dt>Total Bisyaroh</dt><dd>{formatRupiah(lifetimeFee)}</dd></div>
          </dl>
        </section>

        <div className="plpk-card" style={{ marginTop: 12 }}>
          <p className="plpk-hint" style={{ display: 'flex', gap: 8, margin: 0 }}>
            <Info size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
            Prototipe aplikasi PLPK. Data yang tampil adalah data contoh dan belum terhubung ke sistem sebenarnya.
          </p>
        </div>
      </div>
    </>
  );
}
