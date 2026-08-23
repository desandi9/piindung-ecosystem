'use client';

import { CheckListIcon, GridViewIcon, Home01Icon, Notebook01Icon, UserIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useCallback, useMemo, useState } from 'react';

import { F009Preview } from '@/components/gorut-v2/pengambilan/f009-preview';
import { collectionErrorMessage } from '@/features/gorut-v2/collection-api-client';
import { collectionHasAction, collectionToBatch, isServerCollectionBatch } from '@/features/gorut-v2/collection-api-view-model';
import { summarizeKordesPeriod, type KordesDecisionAction, type KordesDecisionInput } from '@/features/gorut-v2/kordes-mobile';
import type { KordesMobileScreen, KordesSubScreen, KordesTab } from '@/features/gorut-v2/kordes-mobile-navigation';
import { useMobileLogout } from '@/features/gorut-v2/mobile-auth';
import { plpkNotifications } from '@/features/gorut-v2/plpk-mobile-content';
import { useCollectionApi } from '@/features/gorut-v2/use-collection-api';

import { MobileBottomNav } from '../plpk-mobile/mobile-bottom-nav';
import { PlpkDistributionScreen } from '../plpk-mobile/plpk-distribution-screen';
import { PlpkNewsScreen } from '../plpk-mobile/plpk-news-screen';
import { PlpkNotificationsScreen } from '../plpk-mobile/plpk-notifications-screen';
import { PlpkPpobScreen } from '../plpk-mobile/plpk-ppob-screen';
import { PlpkZiswafScreen } from '../plpk-mobile/plpk-ziswaf-screen';
import { KordesHome, type KordesHomeProfile } from './kordes-home';
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

export function KordesMobileServerApp({ profile }: { profile: KordesHomeProfile }) {
  const api = useCollectionApi({ page: 1, pageSize: 100, status: 'WAITING_KORDES_VERIFICATION' });
  const [tab, setTab] = useState<KordesTab>('home');
  const [subScreen, setSubScreen] = useState<KordesSubScreen | null>(null);
  const [recapPeriod, setRecapPeriod] = useState('');
  const [verificationBatchId, setVerificationBatchId] = useState<string | null>(null);
  const [verificationView, setVerificationView] = useState<'detail' | 'form' | 'result'>('detail');
  const [f009BatchId, setF009BatchId] = useState<string | null>(null);
  const [newsArticleId, setNewsArticleId] = useState<string>();
  const [toast, setToast] = useState('');

  const batches = useMemo(() => api.collections.map(collectionToBatch), [api.collections]);
  const period = useMemo(() => batches.map((batch) => batch.period).sort().at(-1) ?? new Date().toISOString().slice(0, 7), [batches]);
  const periodBatches = useMemo(() => batches.filter((batch) => batch.period === period), [batches, period]);
  const summary = useMemo(() => summarizeKordesPeriod(batches, { village: profile.village, kecamatan: profile.kecamatan, period }), [batches, period, profile.kecamatan, profile.village]);
  const verificationBatch = batches.find((batch) => batch.id === verificationBatchId) ?? null;
  const f009Batch = batches.find((batch) => batch.id === f009BatchId) ?? null;
  const unreadCount = plpkNotifications.filter((item) => item.unread).length;
  const waitingCount = periodBatches.filter((batch) => collectionHasAction(batch, 'VERIFY_BY_KORDES') === true).length;
  const currentTab: KordesTab = subScreen ? 'services' : tab;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }, []);
  const { logout, logoutPending } = useMobileLogout('KORDES', showToast);
  const navigateTab = useCallback((next: KordesTab) => {
    setTab(next);
    setSubScreen(null);
    setNewsArticleId(undefined);
    setVerificationBatchId(null);
    setVerificationView('detail');
  }, []);
  const navigate = useCallback((screen: KordesMobileScreen) => {
    if (tabs.some((item) => item.key === screen)) return navigateTab(screen as KordesTab);
    if (screen === 'recap') setRecapPeriod(period);
    setNewsArticleId(undefined);
    setSubScreen(screen as KordesSubScreen);
  }, [navigateTab, period]);
  const openVerification = useCallback(async (batchId: string) => {
    try {
      await api.refreshCollection(batchId);
      setSubScreen(null);
      setTab('verification');
      setVerificationBatchId(batchId);
      setVerificationView('detail');
    } catch (caught) {
      showToast(collectionErrorMessage(caught));
    }
  }, [api, showToast]);
  const closeVerification = useCallback(() => {
    setVerificationBatchId(null);
    setVerificationView('detail');
  }, []);

  const saveDecision = useCallback(async (input: KordesDecisionInput, action: KordesDecisionAction) => {
    if (!verificationBatch || !isServerCollectionBatch(verificationBatch)) return 'Data verifikasi tidak ditemukan.';
    const serverAction = action === 'verify' ? 'VERIFY_BY_KORDES' : 'RETURN_FOR_CORRECTION';
    if (collectionHasAction(verificationBatch, serverAction) !== true) return 'Tindakan ini tidak tersedia menurut server.';
    try {
      if (action === 'verify') {
        await api.executeAction(verificationBatch.id, {
          action: 'VERIFY_BY_KORDES',
          expectedVersion: verificationBatch.canonical.version,
          moneyMatches: input.moneyMatches!,
          hasDamagedMoney: input.hasDamagedMoney!,
          cashReceived: input.cashReceived!,
          note: input.notes?.trim() || null,
        });
      } else {
        await api.executeAction(verificationBatch.id, {
          action: 'RETURN_FOR_CORRECTION',
          expectedVersion: verificationBatch.canonical.version,
          moneyMatches: input.moneyMatches!,
          hasDamagedMoney: input.hasDamagedMoney!,
          cashReceived: input.cashReceived!,
          reason: input.notes!.trim(),
          correctionMunfiqCodes: input.correctionEntryIds ?? [],
        });
      }
      setVerificationView('result');
      return null;
    } catch (caught) {
      return collectionErrorMessage(caught);
    }
  }, [api, verificationBatch]);

  if (api.loading && !batches.length) {
    return <div className="plpk-app kordes-mobile-app" aria-busy="true"><div className="plpk-scroll"><div className="plpk-card"><div className="plpk-empty"><strong>Memuat antrean…</strong><p>Mengambil collection canonical dari server.</p></div></div></div></div>;
  }

  return <div className="plpk-app kordes-mobile-app">
    {api.error ? <div className="plpk-warning" role="alert"><span>{api.error} <button type="button" onClick={() => void api.reload()}>Coba lagi</button></span></div> : null}
    {api.notice ? <div className="plpk-callout" role="status"><span>{api.notice}</span></div> : null}

    {subScreen === 'plpk' ? <KordesPlpkDetail batches={batches} onBack={() => setSubScreen(null)} onOpen={(batch) => void openVerification(batch.id)} /> : null}
    {subScreen === 'munfiq' ? <KordesMunfiqScreen batches={batches} village={profile.village} kecamatan={profile.kecamatan} onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'recap' ? <KordesRecapScreen batches={batches} period={recapPeriod || period} village={profile.village} kecamatan={profile.kecamatan} onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'news' ? <PlpkNewsScreen initialArticleId={newsArticleId} onBack={() => { setNewsArticleId(undefined); setSubScreen(null); }} /> : null}
    {subScreen === 'distribution' ? <PlpkDistributionScreen onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'ziswaf' ? <PlpkZiswafScreen onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'ppob' ? <PlpkPpobScreen onBack={() => setSubScreen(null)} /> : null}
    {subScreen === 'notifications' ? <PlpkNotificationsScreen onBack={() => setSubScreen(null)} /> : null}

    {!subScreen && tab === 'home' ? <KordesHome profile={profile} period={period} periodBatches={periodBatches} summary={summary} unreadCount={unreadCount} onNavigate={navigate} onOpenArticle={(articleId) => { setNewsArticleId(articleId); setSubScreen('news'); }} /> : null}
    {!subScreen && tab === 'verification' ? <KordesVerificationTab batches={periodBatches} period={period} onOpen={(batch) => void openVerification(batch.id)} onOpenF009={(batch) => setF009BatchId(batch.id)} onOpenJournal={() => navigateTab('journal')} /> : null}
    {!subScreen && tab === 'journal' ? <KordesJournalTab batches={batches} village={profile.village} kecamatan={profile.kecamatan} onOpenRecap={(nextPeriod) => { setRecapPeriod(nextPeriod); setSubScreen('recap'); }} /> : null}
    {!subScreen && tab === 'services' ? <KordesServicesTab unreadCount={unreadCount} onOpen={setSubScreen} /> : null}
    {!subScreen && tab === 'profile' ? <KordesProfileTab profile={profile} plpkCount={new Set(batches.map((batch) => batch.plpkId)).size} onNotice={showToast} onLogout={logout} logoutPending={logoutPending} /> : null}

    <MobileBottomNav items={tabs.map((item) => ({ ...item, badge: item.key === 'verification' ? waitingCount : undefined, badgeLabel: item.key === 'verification' ? `${waitingCount} antrean menunggu` : undefined }))} activeKey={currentTab} ariaLabel="Navigasi utama Kordes" onSelect={navigateTab} />

    {verificationBatch && verificationView === 'detail' ? <KordesVerificationDetail batch={verificationBatch} onBack={closeVerification} onOpenF009={() => setF009BatchId(verificationBatch.id)} onContinue={() => setVerificationView(collectionHasAction(verificationBatch, 'VERIFY_BY_KORDES') === true || collectionHasAction(verificationBatch, 'RETURN_FOR_CORRECTION') === true ? 'form' : 'result')} canDecide={collectionHasAction(verificationBatch, 'VERIFY_BY_KORDES') === true || collectionHasAction(verificationBatch, 'RETURN_FOR_CORRECTION') === true} /> : null}
    {verificationBatch && verificationView === 'form' ? <KordesVerificationForm batch={verificationBatch} onBack={() => setVerificationView('detail')} onOpenF009={() => setF009BatchId(verificationBatch.id)} onSubmit={saveDecision} allowedActions={[...(collectionHasAction(verificationBatch, 'VERIFY_BY_KORDES') === true ? ['verify' as const] : []), ...(collectionHasAction(verificationBatch, 'RETURN_FOR_CORRECTION') === true ? ['correction' as const] : [])]} pending={api.isPending(`action:${verificationBatch.id}:VERIFY_BY_KORDES`) || api.isPending(`action:${verificationBatch.id}:RETURN_FOR_CORRECTION`)} /> : null}
    {verificationBatch && verificationView === 'result' ? <KordesVerificationResult batch={verificationBatch} onBack={closeVerification} onViewDetail={() => setVerificationView('detail')} /> : null}
    <F009Preview batch={f009Batch} onClose={() => setF009BatchId(null)} />
    {toast ? <div className="plpk-toast" role="status">{toast}</div> : null}
  </div>;
}
