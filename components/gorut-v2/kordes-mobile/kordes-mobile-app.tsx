'use client';

import { CheckListIcon, GridViewIcon, Home01Icon, Notebook01Icon, UserIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useCallback, useMemo, useState } from 'react';

import { F009Preview } from '@/components/gorut-v2/pengambilan/f009-preview';
import { saveCollectionBatch } from '@/features/gorut-v2/collection-store';
import { activeKordesProfile } from '@/features/gorut-v2/kordes-mock-data';
import { applyKordesDecision, buildKordesQueue, summarizeKordesPeriod, type KordesDecisionAction, type KordesDecisionInput } from '@/features/gorut-v2/kordes-mobile';
import type { KordesMobileScreen, KordesSubScreen, KordesTab } from '@/features/gorut-v2/kordes-mobile-navigation';
import { currentCollectionPeriod } from '@/features/gorut-v2/pengambilan-mock-data';
import { plpkNotifications } from '@/features/gorut-v2/plpk-mobile-content';
import { useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';

import { MobileBottomNav } from '../plpk-mobile/mobile-bottom-nav';
import { PlpkDistributionScreen } from '../plpk-mobile/plpk-distribution-screen';
import { PlpkNewsScreen } from '../plpk-mobile/plpk-news-screen';
import { PlpkNotificationsScreen } from '../plpk-mobile/plpk-notifications-screen';
import { PlpkPpobScreen } from '../plpk-mobile/plpk-ppob-screen';
import { PlpkZiswafScreen } from '../plpk-mobile/plpk-ziswaf-screen';
import { KordesHome } from './kordes-home';
import { KordesJournalTab } from './kordes-journal-tab';
import { KordesMunfiqScreen } from './kordes-munfiq-screen';
import { KordesPlpkDetail } from './kordes-plpk-detail';
import { KordesProfileTab } from './kordes-profile-tab';
import { KordesRecapScreen } from './kordes-recap-screen';
import { KordesServicesTab } from './kordes-services-tab';
import { KordesVerificationDetail } from './kordes-verification-detail';
import { KordesVerificationForm, KordesVerificationResult } from './kordes-verification-form';
import { KordesVerificationTab } from './kordes-verification-tab';

const tabs: { key: KordesTab; label: string; icon: IconSvgElement }[] = [
  { key: 'home', label: 'Beranda', icon: Home01Icon },
  { key: 'verification', label: 'Verifikasi', icon: CheckListIcon },
  { key: 'journal', label: 'Jurnal', icon: Notebook01Icon },
  { key: 'services', label: 'Layanan', icon: GridViewIcon },
  { key: 'profile', label: 'Profil', icon: UserIcon },
];

export function KordesMobileApp() {
  const batches = useCollectionBatches();
  const profile = activeKordesProfile;
  const [tab, setTab] = useState<KordesTab>('home');
  const [subScreen, setSubScreen] = useState<KordesSubScreen | null>(null);
  const [recapPeriod, setRecapPeriod] = useState(currentCollectionPeriod);
  const [verificationBatchId, setVerificationBatchId] = useState<string | null>(null);
  const [verificationView, setVerificationView] = useState<'detail' | 'form' | 'result'>('detail');
  const [f009BatchId, setF009BatchId] = useState<string | null>(null);
  const [newsArticleId, setNewsArticleId] = useState<string | undefined>();
  const [toast, setToast] = useState('');

  const scoped = useMemo(() => batches.filter((batch) => batch.village === profile.village && batch.kecamatan === profile.kecamatan), [batches, profile.kecamatan, profile.village]);
  const periodBatches = useMemo(() => scoped.filter((batch) => batch.period === currentCollectionPeriod), [scoped]);
  const queue = useMemo(() => buildKordesQueue(batches, { village: profile.village, kecamatan: profile.kecamatan, period: currentCollectionPeriod }), [batches, profile.kecamatan, profile.village]);
  const summary = useMemo(() => summarizeKordesPeriod(batches, { village: profile.village, kecamatan: profile.kecamatan, period: currentCollectionPeriod }), [batches, profile.kecamatan, profile.village]);
  const verificationBatch = batches.find((batch) => batch.id === verificationBatchId) ?? null;
  const f009Batch = batches.find((batch) => batch.id === f009BatchId) ?? null;
  const unreadCount = plpkNotifications.filter((item) => item.unread).length;
  const waitingCount = queue.filter((item) => item.status === 'waiting-kordes-verification').length;

  const showToast = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800); }, []);
  const navigateTab = useCallback((next: KordesTab) => { setTab(next); setSubScreen(null); setNewsArticleId(undefined); setVerificationBatchId(null); setVerificationView('detail'); }, []);
  const navigate = useCallback((screen: KordesMobileScreen) => {
    if (tabs.some((item) => item.key === screen)) { navigateTab(screen as KordesTab); return; }
    if (screen === 'recap') setRecapPeriod(currentCollectionPeriod);
    setNewsArticleId(undefined);
    setSubScreen(screen as KordesSubScreen);
  }, [navigateTab]);
  const openArticle = useCallback((articleId: string) => { setNewsArticleId(articleId); setSubScreen('news'); }, []);
  const openRecap = useCallback((period: string) => { setRecapPeriod(period); setSubScreen('recap'); }, []);
  const openVerification = useCallback((batchId: string) => { setSubScreen(null); setTab('verification'); setVerificationBatchId(batchId); setVerificationView('detail'); }, []);
  const closeVerification = useCallback(() => { setVerificationBatchId(null); setVerificationView('detail'); }, []);

  const saveDecision = useCallback((input: KordesDecisionInput, action: KordesDecisionAction) => {
    if (!verificationBatch) return 'Data verifikasi tidak ditemukan.';
    const decidedAt = new Date().toISOString();
    const result = applyKordesDecision(verificationBatch, input, action, profile.name, decidedAt);
    if (result.error || !result.batch) return result.error ?? 'Data gagal disimpan.';
    saveCollectionBatch(result.batch);
    setVerificationView('result');
    return null;
  }, [profile.name, verificationBatch]);

  const currentTab: KordesTab = subScreen ? 'services' : tab;
  return <div className="plpk-app kordes-mobile-app">
    {subScreen === 'plpk' ? <KordesPlpkDetail batches={scoped} onBack={() => setSubScreen(null)} onOpen={(batch) => openVerification(batch.id)} /> : null}
    {subScreen === 'munfiq' ? <KordesMunfiqScreen batches={scoped} village={profile.village} kecamatan={profile.kecamatan} onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'recap' ? <KordesRecapScreen batches={batches} period={recapPeriod} village={profile.village} kecamatan={profile.kecamatan} onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'news' ? <PlpkNewsScreen initialArticleId={newsArticleId} onBack={() => { setNewsArticleId(undefined); setSubScreen(null); }} /> : null}
    {subScreen === 'distribution' ? <PlpkDistributionScreen onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'ziswaf' ? <PlpkZiswafScreen onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'ppob' ? <PlpkPpobScreen onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'notifications' ? <PlpkNotificationsScreen onBack={() => setSubScreen(null)} /> : null}

    {!subScreen && tab === 'home' ? <KordesHome profile={profile} period={currentCollectionPeriod} periodBatches={periodBatches} summary={summary} unreadCount={unreadCount} onNavigate={navigate} onOpenArticle={openArticle} /> : null}
    {!subScreen && tab === 'verification' ? <KordesVerificationTab batches={periodBatches.filter((batch) => ['waiting-kordes-verification','verified-by-kordes','needs-correction'].includes(batch.status))} period={currentCollectionPeriod} onOpen={(batch) => openVerification(batch.id)} onOpenF009={(batch) => setF009BatchId(batch.id)} onOpenJournal={() => navigateTab('journal')} /> : null}
    {!subScreen && tab === 'journal' ? <KordesJournalTab batches={scoped} village={profile.village} kecamatan={profile.kecamatan} onOpenRecap={openRecap} /> : null}
    {!subScreen && tab === 'services' ? <KordesServicesTab unreadCount={unreadCount} onOpen={setSubScreen} /> : null}
    {!subScreen && tab === 'profile' ? <KordesProfileTab profile={profile} phone={profile.phone} plpkCount={new Set(scoped.map((batch) => batch.plpkId)).size} onNotice={showToast} /> : null}

    <MobileBottomNav
      items={tabs.map((item) => ({
        ...item,
        badge: item.key === 'verification' ? waitingCount : undefined,
        badgeLabel: item.key === 'verification' ? `${waitingCount} antrean menunggu` : undefined,
      }))}
      activeKey={currentTab}
      ariaLabel="Navigasi utama Kordes"
      onSelect={navigateTab}
    />

    {verificationBatch && verificationView === 'detail' ? <KordesVerificationDetail batch={verificationBatch} onBack={closeVerification} onOpenF009={() => setF009BatchId(verificationBatch.id)} onContinue={() => setVerificationView(verificationBatch.status === 'waiting-kordes-verification' ? 'form' : 'result')} /> : null}
    {verificationBatch && verificationView === 'form' ? <KordesVerificationForm batch={verificationBatch} onBack={() => setVerificationView('detail')} onOpenF009={() => setF009BatchId(verificationBatch.id)} onSubmit={saveDecision} /> : null}
    {verificationBatch && verificationView === 'result' ? <KordesVerificationResult batch={verificationBatch} onBack={closeVerification} onViewDetail={() => setVerificationView('detail')} /> : null}
    <F009Preview batch={f009Batch} onClose={() => setF009BatchId(null)} />
    {toast ? <div className="plpk-toast" role="status">{toast}</div> : null}
  </div>;
}
