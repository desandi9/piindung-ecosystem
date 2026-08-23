'use client';

import { GridViewIcon, HandCoinsIcon, Home01Icon, Notebook01Icon, UserIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useCallback, useMemo, useState } from 'react';

import { F009Preview } from '@/components/gorut-v2/pengambilan/f009-preview';
import { collectionErrorMessage, type GorutCollectionVisitStatus } from '@/features/gorut-v2/collection-api-client';
import { collectionHasAction, collectionToBatch } from '@/features/gorut-v2/collection-api-view-model';
import { useMobileLogout } from '@/features/gorut-v2/mobile-auth';
import { plpkNotifications, type PlpkServiceScreen } from '@/features/gorut-v2/plpk-mobile-content';
import type { CollectionVisitOutcome, PlpkProfile } from '@/features/gorut-v2/types';
import { useCollectionApi } from '@/features/gorut-v2/use-collection-api';

import { MobileBottomNav } from './mobile-bottom-nav';
import { PlpkCollectionTab } from './plpk-collection-tab';
import { PlpkDistributionScreen } from './plpk-distribution-screen';
import { PlpkHome } from './plpk-home';
import { PlpkJournalTab } from './plpk-journal-tab';
import { PlpkMunfiqScreen } from './plpk-munfiq-screen';
import { PlpkNewsScreen } from './plpk-news-screen';
import { PlpkNotificationsScreen } from './plpk-notifications-screen';
import { PlpkPpobScreen } from './plpk-ppob-screen';
import { PlpkProfileTab } from './plpk-profile-tab';
import { PlpkReviewSheet } from './plpk-review-sheet';
import { PlpkServicesTab } from './plpk-services-tab';
import { PlpkVisitForm, type PlpkEntryDraft } from './plpk-visit-form';
import { PlpkZiswafScreen } from './plpk-ziswaf-screen';

type TabKey = 'home' | 'collection' | 'journal' | 'services' | 'profile';

const tabs: { key: TabKey; label: string; icon: IconSvgElement }[] = [
  { key: 'home', label: 'Beranda', icon: Home01Icon },
  { key: 'collection', label: 'Penjemputan', icon: HandCoinsIcon },
  { key: 'journal', label: 'Jurnal', icon: Notebook01Icon },
  { key: 'services', label: 'Layanan', icon: GridViewIcon },
  { key: 'profile', label: 'Profil', icon: UserIcon },
];

const visitStatus: Record<CollectionVisitOutcome, GorutCollectionVisitStatus> = {
  collected: 'COLLECTED',
  'not-around': 'NOT_AROUND',
  'not-ready': 'NOT_READY',
  declined: 'DECLINED',
  'damaged-lost': 'DAMAGED_LOST',
};

const activePeriod = new Date().toISOString().slice(0, 7);

export function PlpkMobileServerApp({ profile }: { profile: PlpkProfile }) {
  const api = useCollectionApi({ page: 1, pageSize: 100 });
  const [tab, setTab] = useState<TabKey>('home');
  const [subScreen, setSubScreen] = useState<PlpkServiceScreen | null>(null);
  const [newsArticleId, setNewsArticleId] = useState<string>();
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [workingBatchId, setWorkingBatchId] = useState<string | null>(null);
  const [f009BatchId, setF009BatchId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const batches = useMemo(() => api.collections.map(collectionToBatch), [api.collections]);
  const currentBatch = useMemo(() => {
    const ordered = batches.slice().sort((a, b) => b.period.localeCompare(a.period) || b.createdAt.localeCompare(a.createdAt));
    return ordered.find((batch) => batch.status === 'needs-correction')
      ?? ordered.find((batch) => batch.period === activePeriod)
      ?? null;
  }, [batches]);
  const activeBatch = workingBatchId ? batches.find((batch) => batch.id === workingBatchId) ?? currentBatch : currentBatch;
  const openEntry = activeBatch?.entries.find((entry) => entry.id === openEntryId) ?? null;
  const unreadCount = plpkNotifications.filter((item) => item.unread).length;
  const currentTab: TabKey = subScreen ? 'services' : tab;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }, []);
  const { logout, logoutPending } = useMobileLogout('PLPK', showToast);

  const navigateTab = useCallback((nextTab: TabKey) => {
    setSubScreen(null);
    setNewsArticleId(undefined);
    setTab(nextTab);
    if (nextTab === 'collection') setWorkingBatchId(null);
  }, []);

  const navigateHome = useCallback((destination: 'collection' | 'journal' | PlpkServiceScreen) => {
    if (destination === 'collection' || destination === 'journal') return navigateTab(destination);
    setNewsArticleId(undefined);
    setSubScreen(destination);
  }, [navigateTab]);

  const createCollection = useCallback(async () => {
    try {
      const canonical = await api.createCollection(activePeriod);
      setWorkingBatchId(canonical.identity.collectionCode);
      setTab('collection');
      showToast('Collection periode ini tersedia dari server.');
    } catch (caught) {
      showToast(collectionErrorMessage(caught));
    }
  }, [api, showToast]);

  const saveEntry = useCallback(async (draft: PlpkEntryDraft, mode: 'save' | 'next') => {
    if (!activeBatch || !openEntry) return 'Data collection tidak ditemukan.';
    try {
      const canonical = await api.recordEntry(activeBatch.id, openEntry.id, {
        visitStatus: visitStatus[draft.visitStatus],
        amount: draft.amount,
        note: draft.note,
        reason: activeBatch.status === 'needs-correction' ? activeBatch.kordesNotes ?? null : null,
        expectedVersion: activeBatch.canonical.version,
      });
      const refreshed = collectionToBatch(canonical);
      if (mode === 'next') {
        const nextEntry = refreshed.entries.find((entry) => entry.id !== openEntry.id && entry.visitStatus === 'pending');
        if (nextEntry) {
          setOpenEntryId(nextEntry.id);
          showToast('Hasil tersimpan di server. Lanjut ke Munfiq berikutnya.');
          return null;
        }
      }
      setOpenEntryId(null);
      showToast('Hasil kunjungan tersimpan di server.');
      return null;
    } catch (caught) {
      return collectionErrorMessage(caught);
    }
  }, [activeBatch, api, openEntry, showToast]);

  const confirmCollection = useCallback(async () => {
    if (!activeBatch || collectionHasAction(activeBatch, 'CONFIRM_AND_SUBMIT') !== true) return;
    const isResubmission = activeBatch.status === 'needs-correction';
    try {
      await api.executeAction(activeBatch.id, {
        action: 'CONFIRM_AND_SUBMIT',
        expectedVersion: activeBatch.canonical.version,
      });
      setReviewOpen(false);
      setOpenEntryId(null);
      setWorkingBatchId(null);
      setTab('journal');
      showToast(isResubmission ? 'Koreksi dikirim ulang ke Kordes.' : 'Collection dikonfirmasi dan dikirim ke Kordes.');
    } catch (caught) {
      showToast(collectionErrorMessage(caught));
    }
  }, [activeBatch, api, showToast]);

  if (api.loading && !batches.length) {
    return <div className="plpk-app" aria-busy="true"><div className="plpk-scroll"><div className="plpk-card"><div className="plpk-empty"><strong>Memuat collection…</strong><p>Mengambil data canonical dari server.</p></div></div></div></div>;
  }

  return (
    <div className="plpk-app">
      {api.error ? <div className="plpk-warning" role="alert"><span>{api.error} <button type="button" onClick={() => void api.reload()}>Coba lagi</button></span></div> : null}
      {api.notice ? <div className="plpk-callout" role="status"><span>{api.notice}</span></div> : null}

      {subScreen === 'munfiq' ? <PlpkMunfiqScreen profile={profile} batches={batches} activeBatch={currentBatch} onBack={() => setSubScreen(null)} onOpenCollection={(entryId) => { setSubScreen(null); setWorkingBatchId(currentBatch?.id ?? null); setTab('collection'); setOpenEntryId(entryId); }} /> : null}
      {subScreen === 'news' ? <PlpkNewsScreen initialArticleId={newsArticleId} onBack={() => { setNewsArticleId(undefined); setSubScreen(null); }} /> : null}
      {subScreen === 'distribution' ? <PlpkDistributionScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'ziswaf' ? <PlpkZiswafScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'ppob' ? <PlpkPpobScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'notifications' ? <PlpkNotificationsScreen onBack={() => setSubScreen(null)} /> : null}

      {!subScreen && tab === 'home' ? <PlpkHome profile={profile} batch={currentBatch} unreadCount={unreadCount} onNavigate={navigateHome} onOpenArticle={(articleId) => { setNewsArticleId(articleId); setSubScreen('news'); }} /> : null}
      {!subScreen && tab === 'collection' ? <PlpkCollectionTab batch={activeBatch} onOpenEntry={setOpenEntryId} onReview={() => setReviewOpen(true)} onCreate={() => void createCollection()} createPending={api.isPending(`create:${activePeriod}`)} activePeriod={activePeriod} /> : null}
      {!subScreen && tab === 'journal' ? <PlpkJournalTab batches={batches} onFixCorrection={(batchId) => { setWorkingBatchId(batchId); setTab('collection'); }} onOpenF009={setF009BatchId} /> : null}
      {!subScreen && tab === 'services' ? <PlpkServicesTab unreadCount={unreadCount} onOpen={setSubScreen} /> : null}
      {!subScreen && tab === 'profile' ? <PlpkProfileTab profile={profile} onNotice={showToast} onLogout={logout} logoutPending={logoutPending} /> : null}

      <MobileBottomNav items={tabs.map((item) => ({ ...item, badge: item.key === 'collection' ? currentBatch?.pendingCount : undefined, badgeLabel: item.key === 'collection' ? `${currentBatch?.pendingCount ?? 0} Munfiq belum dikunjungi` : undefined }))} activeKey={currentTab} ariaLabel="Navigasi utama" onSelect={navigateTab} />

      {openEntry && activeBatch ? <PlpkVisitForm batch={activeBatch} entry={openEntry} onClose={() => setOpenEntryId(null)} onSave={saveEntry} pending={api.isPending(`entry:${activeBatch.id}:${openEntry.id}`)} /> : null}
      {reviewOpen && activeBatch ? <PlpkReviewSheet batch={activeBatch} onClose={() => setReviewOpen(false)} onConfirm={() => void confirmCollection()} canConfirm={collectionHasAction(activeBatch, 'CONFIRM_AND_SUBMIT') === true} pending={api.isPending(`action:${activeBatch.id}:CONFIRM_AND_SUBMIT`)} blockingReasons={activeBatch.canonical.blockingReasons} /> : null}
      <F009Preview batch={batches.find((batch) => batch.id === f009BatchId) ?? null} canPrint={false} onClose={() => setF009BatchId(null)} />
      {toast ? <div className="plpk-toast" role="status">{toast}</div> : null}
    </div>
  );
}
