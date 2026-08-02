'use client';

import { CheckCircle2, Clock3, Coins, HandCoins, Inbox, MapPin, TrendingUp, Users } from 'lucide-react';

import type { CollectionBatch, PlpkProfile } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah, getInitials } from '@/features/gorut-v2/formatters';
import { collectionProgress, collectionStatusLabels, formatPeriodLabel, isBatchLocked } from '@/features/gorut-v2/pengambilan-options';

/** Beranda: identitas PLPK, ringkasan periode aktif, dan pintu masuk penjemputan. */
export function PlpkHome({ profile, batch, onStart }: { profile: PlpkProfile; batch: CollectionBatch | null; onStart: () => void }) {
  const progress = batch ? collectionProgress(batch) : 0;
  const started = Boolean(batch && batch.visitedCount > 0);
  const locked = batch ? isBatchLocked(batch) : false;

  return (
    <>
      <header className="plpk-header">
        <span className="plpk-header-mark" aria-hidden="true"><HandCoins size={20} /></span>
        <div className="plpk-header-text">
          <strong>Aplikasi PLPK</strong>
          <span>Gerakan Koin NU · Kabupaten Garut</span>
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
          <dl className="plpk-identity-grid">
            <div>
              <dt>Desa/Ranting</dt>
              <dd>{profile.village}</dd>
            </div>
            <div>
              <dt>Kecamatan</dt>
              <dd>{profile.kecamatan}</dd>
            </div>
            <div>
              <dt>Periode Aktif</dt>
              <dd>{batch ? formatPeriodLabel(batch.period) : '—'}</dd>
            </div>
            <div>
              <dt>Kordes</dt>
              <dd>{profile.kordesName}</dd>
            </div>
          </dl>
        </section>

        {batch ? (
          <>
            <h2 className="plpk-section-title">Ringkasan Periode Ini</h2>

            <div className="plpk-card">
              <div className="plpk-progress-head">
                <strong>Progres Penjemputan</strong>
                <span>{progress}%</span>
              </div>
              <div className="plpk-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progres penjemputan">
                <i style={{ width: `${progress}%` }} />
              </div>
              <p className="plpk-progress-legend">
                <span>{formatNumber(batch.visitedCount)} dari {formatNumber(batch.entries.length)} Munfiq sudah dikunjungi</span>
              </p>
            </div>

            <div className="plpk-stat-grid" style={{ marginTop: 12 }}>
              <div className="plpk-stat">
                <span><Users size={14} aria-hidden="true" />Munfiq Aktif</span>
                <strong>{formatNumber(batch.entries.length)}</strong>
                <small>kaleng aktif di wilayah Anda</small>
              </div>
              <div className="plpk-stat">
                <span><CheckCircle2 size={14} aria-hidden="true" />Sudah Dikunjungi</span>
                <strong>{formatNumber(batch.visitedCount)}</strong>
                <small>punya hasil kunjungan</small>
              </div>
              <div className="plpk-stat">
                <span><Clock3 size={14} aria-hidden="true" />Belum Dikunjungi</span>
                <strong>{formatNumber(batch.pendingCount)}</strong>
                <small>menunggu didatangi</small>
              </div>
              <div className="plpk-stat">
                <span><Coins size={14} aria-hidden="true" />Terjemput</span>
                <strong>{formatNumber(batch.collectedCanCount)}</strong>
                <small>menghasilkan koin</small>
              </div>
              <div className="plpk-stat is-wide is-accent">
                <span><TrendingUp size={14} aria-hidden="true" />Total Perolehan Sementara</span>
                <strong>{formatRupiah(batch.grossAmount)}</strong>
                <small>jumlah kotor sebelum bisyaroh</small>
              </div>
            </div>

            <div className="plpk-card" style={{ marginTop: 12 }}>
              <div className="plpk-progress-head">
                <strong>Status Periode</strong>
                <span className={`plpk-badge is-${batch.status}`}>{collectionStatusLabels[batch.status]}</span>
              </div>
              <p className="plpk-hint">
                {batch.status === 'needs-correction'
                  ? 'Kordes meminta koreksi. Perbaiki data yang ditandai lalu kirim ulang.'
                  : locked
                    ? 'Data periode ini sudah dikunci dan sedang diproses Kordes.'
                    : 'Catat hasil kunjungan setiap Munfiq, lalu konfirmasi bila seluruh Munfiq sudah selesai.'}
              </p>
            </div>
          </>
        ) : (
          <div className="plpk-card" style={{ marginTop: 16 }}>
            <div className="plpk-empty">
              <Inbox size={30} aria-hidden="true" />
              <strong>Belum ada penjemputan aktif</strong>
              <p>Tidak ada periode penjemputan yang sedang berjalan untuk wilayah Anda saat ini.</p>
            </div>
          </div>
        )}
      </div>

      {batch && !locked ? (
        <div className="plpk-footer">
          <button type="button" className="plpk-btn plpk-btn-primary" onClick={onStart}>
            <MapPin size={17} aria-hidden="true" />
            {batch.status === 'needs-correction' ? 'Perbaiki Data' : started ? 'Lanjutkan Penjemputan' : 'Mulai Penjemputan'}
          </button>
        </div>
      ) : null}
    </>
  );
}
