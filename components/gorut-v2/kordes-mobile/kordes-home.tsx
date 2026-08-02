'use client';

import {
  Analytics02Icon,
  CharityIcon,
  CheckListIcon,
  Coins01Icon,
  News01Icon,
  Notification02Icon,
  Notebook01Icon,
  UserGroupIcon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { Bell } from 'lucide-react';

import { MobileNewsPortal } from '@/components/gorut-v2/mobile-shared/mobile-news-portal';
import { formatNumber, formatRupiah, getInitials } from '@/features/gorut-v2/formatters';
import type { KordesMobileScreen } from '@/features/gorut-v2/kordes-mobile-navigation';
import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

import { MobileServiceIcon } from '../plpk-mobile/mobile-service-icon';
import { MobileSectionHeader, MobileServiceTile } from '../plpk-mobile/mobile-ui';

export interface KordesHomeProfile {
  kordesId: string;
  name: string;
  village: string;
  kecamatan: string;
  upzis: string;
}

export function KordesHome({
  profile,
  period,
  periodBatches,
  summary,
  unreadCount,
  onNavigate,
  onOpenArticle,
}: {
  profile: KordesHomeProfile;
  period: string;
  periodBatches: CollectionBatch[];
  summary: { activePlpk: number; submittedPlpk: number; waiting: number; verified: number; corrections: number; grossAmount: number; progress: number };
  unreadCount: number;
  onNavigate: (screen: KordesMobileScreen) => void;
  onOpenArticle: (articleId: string) => void;
}) {
  const menu = [
    { title: 'Verifikasi', icon: CheckListIcon, destination: 'verification' as const, badge: summary.waiting ? String(summary.waiting) : undefined },
    { title: 'Jurnal', icon: Notebook01Icon, destination: 'journal' as const },
    { title: 'PLPK', icon: UserGroupIcon, destination: 'plpk' as const },
    { title: 'Munfiq', icon: UserMultipleIcon, destination: 'munfiq' as const },
    { title: 'Rekap Ranting', icon: Analytics02Icon, destination: 'recap' as const },
    { title: 'Berita', icon: News01Icon, destination: 'news' as const },
    { title: 'Pentasyarufan', icon: CharityIcon, destination: 'distribution' as const },
    { title: 'Notifikasi', icon: Notification02Icon, destination: 'notifications' as const, badge: unreadCount ? String(unreadCount) : undefined },
  ];

  return (
    <div className="plpk-scroll plpk-home-screen kordes-home-screen">
      <header className="plpk-home-header kordes-home-header">
        <div className="plpk-home-avatar" aria-hidden="true">{getInitials(profile.name)}</div>
        <div className="plpk-home-greeting">
          <span>Assalamu’alaikum</span>
          <strong>{profile.name}</strong>
          <small>Kordes Desa {profile.village} · {profile.upzis}</small>
        </div>
        <button type="button" className="plpk-icon-button plpk-notification-button" onClick={() => onNavigate('notifications')} aria-label={`Buka notifikasi, ${unreadCount} belum dibaca`}>
          <Bell size={21} aria-hidden="true" />{unreadCount ? <i aria-hidden="true" /> : null}
        </button>
      </header>

      <section className="plpk-period-hero kordes-period-hero" aria-labelledby="kordes-period-title">
        <div className="plpk-period-top"><div><span>Periode aktif</span><h1 id="kordes-period-title">{formatPeriodLabel(period)}</h1></div><span className="kordes-period-pill">{summary.activePlpk} PLPK</span></div>
        <div className="kordes-period-stats">
          <div><strong>{summary.submittedPlpk}</strong><span>Sudah kirim</span></div>
          <div><strong>{summary.waiting}</strong><span>Menunggu</span></div>
          <div><strong>{summary.verified}</strong><span>Terverifikasi</span></div>
          <div><strong>{summary.corrections}</strong><span>Perlu koreksi</span></div>
        </div>
        <div className="plpk-progress-head"><span>Progres verifikasi ranting</span><strong>{summary.progress}%</strong></div>
        <div className="plpk-progress-track" role="progressbar" aria-label="Progres verifikasi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progress}><i style={{ width: `${summary.progress}%` }} /></div>
        <button type="button" className="plpk-btn plpk-btn-hero" onClick={() => onNavigate('verification')}><MobileServiceIcon icon={CheckListIcon} label="Buka antrean" size={20} />Buka Antrean Verifikasi</button>
      </section>

      <section className="plpk-home-section">
        <MobileSectionHeader title="Informasi Utama" description="Ringkasan seluruh PLPK dalam ranting" />
        <article className="plpk-amount-card"><span className="plpk-amount-icon"><MobileServiceIcon icon={Coins01Icon} label="Total perolehan" size={21} /></span><div><small>Total Perolehan</small><strong>{formatRupiah(summary.grossAmount)}</strong><span>{formatNumber(periodBatches.reduce((n, batch) => n + batch.collectedCanCount, 0))} kaleng terjemput</span></div></article>
        <div className="plpk-home-stat-grid">
          <article><span><MobileServiceIcon icon={Notification02Icon} label="Menunggu verifikasi" size={19} /></span><small>Menunggu</small><strong>{summary.waiting}</strong></article>
          <article><span><MobileServiceIcon icon={CheckListIcon} label="Terverifikasi" size={19} /></span><small>Terverifikasi</small><strong>{summary.verified}</strong></article>
          <article><span><MobileServiceIcon icon={Analytics02Icon} label="Perlu koreksi" size={19} /></span><small>Perlu Koreksi</small><strong>{summary.corrections}</strong></article>
        </div>
      </section>

      <section className="plpk-home-section">
        <MobileSectionHeader title="Menu Utama" description="Akses operasional Kordes" />
        <div className="plpk-quick-grid">{menu.map((item) => <MobileServiceTile key={item.title} {...item} compact onClick={() => onNavigate(item.destination)} />)}</div>
      </section>

      <MobileNewsPortal onOpenAll={() => onNavigate('news')} onOpenArticle={onOpenArticle} />
    </div>
  );
}
