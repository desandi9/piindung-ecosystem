'use client';

import {
  CharityIcon,
  Coins01Icon,
  HandCoinsIcon,
  Mosque01Icon,
  News01Icon,
  Notebook01Icon,
  Notification02Icon,
  PackageOpenIcon,
  SmartPhone01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { Bell } from 'lucide-react';

import { formatNumber, formatRupiah, getInitials } from '@/features/gorut-v2/formatters';
import { summarizePlpkPeriod, type PlpkServiceScreen } from '@/features/gorut-v2/plpk-mobile-content';
import { collectionProgress, formatPeriodLabel, isBatchLocked } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch, PlpkProfile } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from './mobile-service-icon';
import { MobileSectionHeader, MobileServiceTile, MobileStatusBadge } from './mobile-ui';
import { MobileNewsPortal } from '../mobile-shared/mobile-news-portal';

type HomeDestination = 'collection' | 'journal' | PlpkServiceScreen;

export function PlpkHome({
  profile,
  batch,
  unreadCount,
  onNavigate,
  onOpenArticle,
}: {
  profile: PlpkProfile;
  batch: CollectionBatch | null;
  unreadCount: number;
  onNavigate: (destination: HomeDestination) => void;
  onOpenArticle: (articleId: string) => void;
}) {
  const metrics = summarizePlpkPeriod(batch);
  const progress = batch ? collectionProgress(batch) : 0;
  const locked = batch ? isBatchLocked(batch) : false;
  const actionLabel = batch?.status === 'needs-correction'
    ? 'Perbaiki Data'
    : batch && batch.visitedCount > 0
      ? 'Lanjutkan Penjemputan'
      : 'Mulai Penjemputan';

  const menu = [
    { title: 'Penjemputan', icon: HandCoinsIcon, destination: 'collection' as const },
    { title: 'Jurnal', icon: Notebook01Icon, destination: 'journal' as const },
    { title: 'Munfiq', icon: UserGroupIcon, destination: 'munfiq' as const },
    { title: 'Berita', icon: News01Icon, destination: 'news' as const },
    { title: 'Pentasyarufan', icon: CharityIcon, destination: 'distribution' as const },
    { title: 'e-ZISWAF', icon: Mosque01Icon, destination: 'ziswaf' as const, badge: 'Informasi' },
    { title: 'PPOB', icon: SmartPhone01Icon, destination: 'ppob' as const, badge: 'Segera Hadir' },
    { title: 'Notifikasi', icon: Notification02Icon, destination: 'notifications' as const, badge: unreadCount ? String(unreadCount) : undefined },
  ];

  return (
    <div className="plpk-scroll plpk-home-screen">
      <header className="plpk-home-header">
        <div className="plpk-home-avatar" aria-hidden="true">{getInitials(profile.name)}</div>
        <div className="plpk-home-greeting">
          <span>Assalamu’alaikum</span>
          <strong>{profile.name}</strong>
          <small>PLPK Desa {profile.village}</small>
        </div>
        <button type="button" className="plpk-icon-button plpk-notification-button" onClick={() => onNavigate('notifications')} aria-label={`Buka notifikasi, ${unreadCount} belum dibaca`}>
          <Bell size={21} aria-hidden="true" />
          {unreadCount > 0 ? <i aria-hidden="true" /> : null}
        </button>
      </header>

      {batch ? (
        <section className="plpk-period-hero" aria-labelledby="active-period-title">
          <div className="plpk-period-top">
            <div>
              <span>Periode aktif</span>
              <h1 id="active-period-title">{formatPeriodLabel(batch.period)}</h1>
            </div>
            <MobileStatusBadge status={batch.status} />
          </div>
          <div className="plpk-progress-head">
            <span>{formatNumber(metrics.completedMunfiq)} dari {formatNumber(metrics.activeMunfiq)} Munfiq selesai</span>
            <strong>{progress}%</strong>
          </div>
          <div className="plpk-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progres penjemputan">
            <i style={{ width: `${progress}%` }} />
          </div>
          {!locked ? (
            <button type="button" className="plpk-btn plpk-btn-hero" onClick={() => onNavigate('collection')}>
              <MobileServiceIcon icon={PackageOpenIcon} label={actionLabel} size={20} />
              {actionLabel}
            </button>
          ) : (
            <p className="plpk-period-note">Data periode sudah dikunci dan sedang diproses oleh Kordes.</p>
          )}
        </section>
      ) : (
        <section className="plpk-period-hero is-empty">
          <span>Periode aktif</span>
          <h1>Belum tersedia</h1>
          <p>Belum ada periode penjemputan untuk wilayah tugas Anda.</p>
        </section>
      )}

      <section className="plpk-home-section" aria-labelledby="summary-title">
        <MobileSectionHeader title="Informasi Utama" description="Ringkasan dari data periode aktif" />
        <article className="plpk-amount-card">
          <span className="plpk-amount-icon"><MobileServiceIcon icon={Coins01Icon} label="Nominal infak" size={21} /></span>
          <div>
            <small>Nominal Infak Periode Ini</small>
            <strong id="summary-title">{formatRupiah(metrics.grossAmount)}</strong>
            <span>Jumlah kotor yang telah terinput</span>
          </div>
        </article>
        <div className="plpk-home-stat-grid">
          <article><span><MobileServiceIcon icon={PackageOpenIcon} label="Kaleng aktif" size={19} /></span><small>Kaleng Aktif</small><strong>{formatNumber(metrics.activeCans)}</strong></article>
          <article><span><MobileServiceIcon icon={HandCoinsIcon} label="Kaleng terjemput" size={19} /></span><small>Terjemput</small><strong>{formatNumber(metrics.collectedCans)}</strong></article>
          <article><span><MobileServiceIcon icon={Notification02Icon} label="Belum terjemput" size={19} /></span><small>Belum Terjemput</small><strong>{formatNumber(metrics.pendingCans)}</strong></article>
        </div>
      </section>

      <section className="plpk-home-section" aria-labelledby="menu-title">
        <MobileSectionHeader title="Menu Utama" description="Akses cepat kebutuhan PLPK" />
        <div id="menu-title" className="plpk-quick-grid">
          {menu.map((item) => (
            <MobileServiceTile key={item.title} {...item} compact onClick={() => onNavigate(item.destination)} />
          ))}
        </div>
      </section>

      <MobileNewsPortal onOpenAll={() => onNavigate('news')} onOpenArticle={onOpenArticle} />
    </div>
  );
}
