'use client';

import { GridViewIcon, HandCoinsIcon, Home01Icon, Notebook01Icon, UserIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useCallback, useMemo, useState } from 'react';

import { F009Preview } from '@/components/gorut-v2/pengambilan/f009-preview';
import { saveCollectionBatch } from '@/features/gorut-v2/collection-store';
import { plpkNotifications, type PlpkServiceScreen } from '@/features/gorut-v2/plpk-mobile-content';
import { activeBatchForPlpk, activePlpkProfile, historyForPlpk, useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import { submitPlpkBatch, summarizeEntries } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch, CollectionEntry } from '@/features/gorut-v2/types';

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
import { PlpkVisitForm } from './plpk-visit-form';
import { PlpkZiswafScreen } from './plpk-ziswaf-screen';

type TabKey = 'home' | 'collection' | 'journal' | 'services' | 'profile';

const tabs: { key: TabKey; label: string; icon: IconSvgElement }[] = [
  { key: 'home', label: 'Beranda', icon: Home01Icon },
  { key: 'collection', label: 'Penjemputan', icon: HandCoinsIcon },
  { key: 'journal', label: 'Jurnal', icon: Notebook01Icon },
  { key: 'services', label: 'Layanan', icon: GridViewIcon },
  { key: 'profile', label: 'Profil', icon: UserIcon },
];

/** Shell prototipe PLPK. Alur simpan, kunci, dan sinkronisasi Kordes tetap memakai store yang sama. */
export function PlpkMobileApp() {
  const batches = useCollectionBatches();
  const profile = activePlpkProfile;
  const [tab, setTab] = useState<TabKey>('home');
  const [subScreen, setSubScreen] = useState<PlpkServiceScreen | null>(null);
  const [newsArticleId, setNewsArticleId] = useState<string | undefined>();
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [workingBatchId, setWorkingBatchId] = useState<string | null>(null);
  const [f009BatchId, setF009BatchId] = useState<string | null>(null);

  const periodBatch = useMemo(() => activeBatchForPlpk(batches, profile.plpkId), [batches, profile.plpkId]);
  const history = useMemo(() => historyForPlpk(batches, profile.plpkId), [batches, profile.plpkId]);
  const activeBatch = useMemo(() => {
    if (!workingBatchId) return periodBatch;
    return batches.find((batch) => batch.id === workingBatchId) ?? periodBatch;
  }, [batches, periodBatch, workingBatchId]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }, []);

  const navigateTab = useCallback((nextTab: TabKey) => {
    setSubScreen(null);
    setNewsArticleId(undefined);
    setTab(nextTab);
    if (nextTab === 'collection') setWorkingBatchId(null);
  }, []);

  const navigateHome = useCallback((destination: 'collection' | 'journal' | PlpkServiceScreen) => {
    if (destination === 'collection' || destination === 'journal') {
      navigateTab(destination);
      return;
    }
    setNewsArticleId(undefined);
    setSubScreen(destination);
  }, [navigateTab]);

  const openNewsArticle = useCallback((articleId: string) => {
    setNewsArticleId(articleId);
    setSubScreen('news');
  }, []);

  const saveEntry = useCallback((entry: CollectionEntry) => {
    if (!activeBatch) return;
    const entries = activeBatch.entries.map((item) => (item.id === entry.id ? entry : item));
    const next: CollectionBatch = {
      ...activeBatch,
      entries,
      ...summarizeEntries(entries),
      status: activeBatch.status === 'scheduled' ? 'collecting' : activeBatch.status,
    };
    saveCollectionBatch(next);
  }, [activeBatch]);

  const confirmCollection = useCallback(() => {
    if (!activeBatch) return;
    const isResubmission = activeBatch.status === 'needs-correction';
    const result = submitPlpkBatch(activeBatch);
    if (!result.batch) {
      showToast(result.error ?? 'Data belum dapat dikirim.');
      return;
    }
    saveCollectionBatch(result.batch);
    setReviewOpen(false);
    setOpenEntryId(null);
    setWorkingBatchId(null);
    setSubScreen(null);
    setTab('journal');
    showToast(isResubmission
      ? 'Koreksi terkirim. Status kembali menunggu verifikasi Kordes.'
      : 'Penjemputan dikonfirmasi. Data dikunci dan dikirim ke Kordes.');
  }, [activeBatch, showToast]);

  const openEntry = activeBatch?.entries.find((entry) => entry.id === openEntryId) ?? null;
  const pendingCount = periodBatch?.pendingCount ?? 0;
  const unreadCount = plpkNotifications.filter((item) => item.unread).length;
  const currentTab: TabKey = subScreen ? 'services' : tab;

  return (
    <div className="plpk-app">
      {subScreen === 'munfiq' ? <PlpkMunfiqScreen profile={profile} batches={batches} activeBatch={periodBatch} onBack={() => setSubScreen(null)} onOpenCollection={(entryId) => { setSubScreen(null); setWorkingBatchId(null); setTab('collection'); setOpenEntryId(entryId); }} /> : null}
      {subScreen === 'news' ? <PlpkNewsScreen initialArticleId={newsArticleId} onBack={() => { setNewsArticleId(undefined); setSubScreen(null); }} /> : null}
      {subScreen === 'distribution' ? <PlpkDistributionScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'ziswaf' ? <PlpkZiswafScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'ppob' ? <PlpkPpobScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'notifications' ? <PlpkNotificationsScreen onBack={() => setSubScreen(null)} /> : null}

      {!subScreen && tab === 'home' ? <PlpkHome profile={profile} batch={periodBatch} unreadCount={unreadCount} onNavigate={navigateHome} onOpenArticle={openNewsArticle} /> : null}
      {!subScreen && tab === 'collection' ? <PlpkCollectionTab batch={activeBatch} onOpenEntry={setOpenEntryId} onReview={() => setReviewOpen(true)} /> : null}
      {!subScreen && tab === 'journal' ? <PlpkJournalTab batches={history} onFixCorrection={(batchId) => { setWorkingBatchId(batchId); setTab('collection'); }} onOpenF009={setF009BatchId} /> : null}
      {!subScreen && tab === 'services' ? <PlpkServicesTab unreadCount={unreadCount} onOpen={setSubScreen} /> : null}
      {!subScreen && tab === 'profile' ? <PlpkProfileTab profile={profile} onNotice={showToast} /> : null}

      <MobileBottomNav
        items={tabs.map((item) => ({
          ...item,
          badge: item.key === 'collection' ? pendingCount : undefined,
          badgeLabel: item.key === 'collection' ? `${pendingCount} Munfiq belum dikunjungi` : undefined,
        }))}
        activeKey={currentTab}
        ariaLabel="Navigasi utama"
        onSelect={navigateTab}
      />

      {openEntry && activeBatch ? (
        <PlpkVisitForm
          batch={activeBatch}
          entry={openEntry}
          onClose={() => setOpenEntryId(null)}
          onSave={(entry, mode) => {
            saveEntry(entry);
            if (mode === 'next') {
              const remaining = activeBatch.entries.filter((item) => item.id !== entry.id && item.visitStatus === 'pending');
              const nextEntry = remaining[0];
              if (nextEntry) {
                setOpenEntryId(nextEntry.id);
                showToast('Hasil disimpan. Lanjut ke Munfiq berikutnya.');
                return;
              }
              setOpenEntryId(null);
              showToast('Semua Munfiq sudah punya hasil kunjungan.');
              return;
            }
            setOpenEntryId(null);
            showToast('Hasil kunjungan disimpan.');
          }}
        />
      ) : null}

      {reviewOpen && activeBatch ? <PlpkReviewSheet batch={activeBatch} onClose={() => setReviewOpen(false)} onConfirm={confirmCollection} /> : null}
      <F009Preview batch={batches.find((batch) => batch.id === f009BatchId) ?? null} canPrint={false} onClose={() => setF009BatchId(null)} />
      {toast ? <div className="plpk-toast" role="status">{toast}</div> : null}
    </div>
  );
}
