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
import { ArrowRight } from 'lucide-react';
import { HomeHeader, HomeHero, HomeProgress, HomeSection, HomeStat, HomeValue } from '../home/home-ui';

import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { collectionHasAction, collectionMoneyLabel } from '@/features/gorut-v2/collection-api-view-model';
import { summarizePlpkPeriod, type PlpkServiceScreen } from '@/features/gorut-v2/plpk-mobile-content';
import { collectionProgress, formatPeriodLabel, isBatchLocked } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch, PlpkProfile } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from './mobile-service-icon';
import { MobileServiceTile, MobileStatusBadge } from './mobile-ui';
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
  const serverCanRecord = batch ? collectionHasAction(batch, 'RECORD_ENTRY') : undefined;
  const locked = batch ? (serverCanRecord === undefined ? isBatchLocked(batch) : !serverCanRecord) : false;
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
    <div className="plpk-scroll gh-home">
      <HomeHeader role="Ruang PLPK" name={profile.name} assignment={profile.identity.assignmentLabel} initials={profile.identity.initials} unreadCount={unreadCount} onNotifications={() => onNavigate('notifications')} />
      <HomeHero eyebrow={batch ? formatPeriodLabel(batch.period) : 'Periode aktif'} label="Nominal infak periode ini" value={<HomeValue>{batch ? collectionMoneyLabel(batch, 'grossAmount') : formatRupiah(metrics.grossAmount)}</HomeValue>} note="Jumlah kotor yang telah terinput">
        <div className="gh-hero-footer"><span>Setiap penjemputan berarti.</span><MobileServiceIcon icon={Coins01Icon} label="Infak" size={23} /></div>
      </HomeHero>
      <div className="gh-stats" aria-label="Ringkasan kaleng">
        <HomeStat label="Kaleng aktif" value={metrics.activeCans} icon={<MobileServiceIcon icon={PackageOpenIcon} label="" size={18} />} />
        <HomeStat label="Terjemput" value={metrics.collectedCans} icon={<MobileServiceIcon icon={HandCoinsIcon} label="" size={18} />} />
        <HomeStat label="Belum terjemput" value={metrics.pendingCans} icon={<MobileServiceIcon icon={Notification02Icon} label="" size={18} />} />
      </div>
      {batch ? <section className="gh-surface" aria-label="Penjemputan periode aktif">
        <div className="gh-surface-head"><div><h2>Langkah hari ini</h2><p>{formatPeriodLabel(batch.period)}</p></div><MobileStatusBadge status={batch.status} /></div>
        <HomeProgress value={progress} label={`${formatNumber(metrics.completedMunfiq)} dari ${formatNumber(metrics.activeMunfiq)} Munfiq selesai`} detail={`${progress}%`} />
        {!locked ? <button type="button" className="gh-button" onClick={() => onNavigate('collection')}>{actionLabel}<ArrowRight size={18} /></button> : <p>Data periode sudah dikunci dan sedang diproses oleh Kordes.</p>}
      </section> : <section className="gh-surface"><div className="gh-surface-head"><h2>Periode belum tersedia</h2></div><p>Belum ada periode penjemputan untuk wilayah tugas Anda.</p></section>}
      <HomeSection title="Ruang kerja Anda" description="Kebutuhan lapangan, dalam satu tempat.">
        <div className="plpk-quick-grid">{menu.map((item) => <MobileServiceTile key={item.title} {...item} compact onClick={() => onNavigate(item.destination)} />)}</div>
      </HomeSection>
      <MobileNewsPortal onOpenAll={() => onNavigate('news')} onOpenArticle={onOpenArticle} />
    </div>
  );
}
