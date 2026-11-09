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
import { ArrowRight } from 'lucide-react';
import { HomeHeader, HomeHero, HomeProgress, HomeSection, HomeStat, HomeValue } from '../home/home-ui';

import { MobileNewsPortal } from '@/components/gorut-v2/mobile-shared/mobile-news-portal';
import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { isServerCollectionBatch } from '@/features/gorut-v2/collection-api-view-model';
import type { KordesMobileScreen } from '@/features/gorut-v2/kordes-mobile-navigation';
import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

import { MobileServiceIcon } from '../plpk-mobile/mobile-service-icon';
import { MobileServiceTile } from '../plpk-mobile/mobile-ui';
import type { KordesMobileProfile } from '../../../lib/gorut/mobile-actor-access-pure';

export type KordesHomeProfile = KordesMobileProfile;

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
  const financialReady = periodBatches.every((batch) => !isServerCollectionBatch(batch) || batch.canonical.financial.status === 'READY');

  return (
    <div className="plpk-scroll gh-home">
      <HomeHeader role="Ruang Kordes" name={profile.name} assignment={`${profile.identity.assignmentLabel} · ${profile.upzis}`} initials={profile.identity.initials} unreadCount={unreadCount} onNotifications={() => onNavigate('notifications')} />
      <HomeHero eyebrow={formatPeriodLabel(period)} label="Total perolehan ranting" value={<HomeValue>{financialReady ? formatRupiah(summary.grossAmount) : 'Belum siap'}</HomeValue>} note={`${formatNumber(periodBatches.reduce((n, batch) => n + batch.collectedCanCount, 0))} kaleng terjemput`}>
        <div className="gh-hero-footer"><span>{summary.activePlpk} PLPK dalam pendampingan</span><MobileServiceIcon icon={Coins01Icon} label="Perolehan" size={23} /></div>
      </HomeHero>
      <div className="gh-stats" aria-label="Ringkasan verifikasi">
        <HomeStat label="Menunggu" value={summary.waiting} icon={<MobileServiceIcon icon={Notification02Icon} label="" size={18} />} />
        <HomeStat label="Terverifikasi" value={summary.verified} icon={<MobileServiceIcon icon={CheckListIcon} label="" size={18} />} />
        <HomeStat label="Perlu koreksi" value={summary.corrections} icon={<MobileServiceIcon icon={Analytics02Icon} label="" size={18} />} />
      </div>
      <section className="gh-surface" aria-label="Progres verifikasi ranting">
        <div className="gh-surface-head"><div><h2>Dampingi setiap langkah</h2><p>{summary.submittedPlpk} dari {summary.activePlpk} PLPK sudah kirim</p></div></div>
        <HomeProgress value={summary.progress} label="Progres verifikasi ranting" detail={`${summary.progress}%`} />
        <button type="button" className="gh-button" onClick={() => onNavigate('verification')}>Buka antrean verifikasi<ArrowRight size={18} /></button>
      </section>
      <HomeSection title="Ruang kerja Anda" description="Pendampingan dan verifikasi ranting.">
        <div className="plpk-quick-grid">{menu.map((item) => <MobileServiceTile key={item.title} {...item} compact onClick={() => onNavigate(item.destination)} />)}</div>
      </HomeSection>
      <MobileNewsPortal onOpenAll={() => onNavigate('news')} onOpenArticle={onOpenArticle} />
    </div>
  );
}
