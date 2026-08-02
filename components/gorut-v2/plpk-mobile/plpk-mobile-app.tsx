'use client';

import { GridViewIcon, HandCoinsIcon, Home01Icon, Notebook01Icon, UserIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useCallback, useMemo, useState } from 'react';

import { saveCollectionBatch } from '@/features/gorut-v2/collection-store';
import { plpkNotifications, type PlpkServiceScreen } from '@/features/gorut-v2/plpk-mobile-content';
import { activeBatchForPlpk, activePlpkProfile, historyForPlpk, useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import { summarizeEntries } from '@/features/gorut-v2/pengambilan-options';
import type { CollectionBatch, CollectionEntry } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from './mobile-service-icon';
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
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [workingBatchId, setWorkingBatchId] = useState<string | null>(null);

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
    setTab(nextTab);
    if (nextTab === 'collection') setWorkingBatchId(null);
  }, []);

  const navigateHome = useCallback((destination: 'collection' | 'journal' | PlpkServiceScreen) => {
    if (destination === 'collection' || destination === 'journal') {
      navigateTab(destination);
      return;
    }
    setSubScreen(destination);
  }, [navigateTab]);

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
    const today = new Date().toISOString().slice(0, 10);
    const isResubmission = activeBatch.status === 'needs-correction';
    const documentNumber = activeBatch.f009DocumentNumber ?? activeBatch.documentNumber;
    const next: CollectionBatch = {
      ...activeBatch,
      status: 'waiting-kordes-verification',
      documentStatus: 'Siap',
      confirmedByPlpkAt: today,
      lockedAt: today,
      f009DocumentNumber: documentNumber,
      submittedToKordesAt: today,
      verifiedByKordesAt: undefined,
      verifiedByKordesName: undefined,
      kordesNotes: undefined,
      correctionEntryIds: undefined,
    };
    saveCollectionBatch(next);
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
      {subScreen === 'news' ? <PlpkNewsScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'distribution' ? <PlpkDistributionScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'ziswaf' ? <PlpkZiswafScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'ppob' ? <PlpkPpobScreen onBack={() => setSubScreen(null)} /> : null}
      {subScreen === 'notifications' ? <PlpkNotificationsScreen onBack={() => setSubScreen(null)} /> : null}

      {!subScreen && tab === 'home' ? <PlpkHome profile={profile} batch={periodBatch} unreadCount={unreadCount} onNavigate={navigateHome} /> : null}
      {!subScreen && tab === 'collection' ? <PlpkCollectionTab batch={activeBatch} onOpenEntry={setOpenEntryId} onReview={() => setReviewOpen(true)} /> : null}
      {!subScreen && tab === 'journal' ? <PlpkJournalTab batches={history} onFixCorrection={(batchId) => { setWorkingBatchId(batchId); setTab('collection'); }} /> : null}
      {!subScreen && tab === 'services' ? <PlpkServicesTab unreadCount={unreadCount} onOpen={setSubScreen} /> : null}
      {!subScreen && tab === 'profile' ? <PlpkProfileTab profile={profile} onNotice={showToast} /> : null}

      <nav className="plpk-nav" aria-label="Navigasi utama">
        {tabs.map(({ key, label, icon }) => (
          <button key={key} type="button" className={currentTab === key ? 'is-active' : undefined} aria-current={currentTab === key ? 'page' : undefined} aria-label={label} onClick={() => navigateTab(key)}>
            <MobileServiceIcon icon={icon} label={label} size={22} />
            <span>{label}</span>
            {key === 'collection' && pendingCount > 0 ? <span className="plpk-nav-badge" aria-label={`${pendingCount} Munfiq belum dikunjungi`}>{pendingCount}</span> : null}
          </button>
        ))}
      </nav>

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
      {toast ? <div className="plpk-toast" role="status">{toast}</div> : null}
    </div>
  );
}
