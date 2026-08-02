'use client';

import { ClipboardList, History, Home, User } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { CollectionBatch, CollectionEntry } from '@/features/gorut-v2/types';
import { saveCollectionBatch } from '@/features/gorut-v2/collection-store';
import { summarizeEntries } from '@/features/gorut-v2/pengambilan-options';
import { activeBatchForPlpk, activePlpkProfile, historyForPlpk, useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';


import { PlpkHome } from './plpk-home';
import { PlpkCollectionTab } from './plpk-collection-tab';
import { PlpkHistoryTab } from './plpk-history-tab';
import { PlpkProfileTab } from './plpk-profile-tab';
import { PlpkVisitForm } from './plpk-visit-form';
import { PlpkReviewSheet } from './plpk-review-sheet';

type TabKey = 'home' | 'collection' | 'history' | 'profile';

const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Beranda', icon: Home },
  { key: 'collection', label: 'Penjemputan', icon: ClipboardList },
  { key: 'history', label: 'Riwayat', icon: History },
  { key: 'profile', label: 'Profil', icon: User },
];

/**
 * Aplikasi mobile PLPK (prototipe frontend).
 *
 * Satu-satunya tempat PLPK mencatat hasil kunjungan dan mengonfirmasi
 * penjemputan. F.009 sengaja tidak pernah ditampilkan di sini — dokumen itu
 * dibuat sistem dan hanya dibuka Kordes/admin.
 */
export function PlpkMobileApp() {
  const batches = useCollectionBatches();
  const profile = activePlpkProfile;

  const [tab, setTab] = useState<TabKey>('home');
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState('');
  /** Batch yang sedang dibuka di tab Penjemputan. Diisi saat PLPK memperbaiki batch dari Riwayat. */
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

  /** Tulis ulang satu entri lalu hitung ulang seluruh total dari entri-entrinya. */
  const saveEntry = useCallback((entry: CollectionEntry) => {
    if (!activeBatch) return;
    const entries = activeBatch.entries.map((item) => (item.id === entry.id ? entry : item));
    const next: CollectionBatch = {
      ...activeBatch,
      entries,
      ...summarizeEntries(entries),
      /** Batch yang sudah mulai diisi berpindah dari Dijadwalkan ke Dalam Penjemputan. */
      status: activeBatch.status === 'scheduled' ? 'collecting' : activeBatch.status,
    };
    saveCollectionBatch(next);
  }, [activeBatch]);

  /** Konfirmasi: kunci data, kirim ke Kordes, dan biarkan sistem membuat F.009. */
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
      /** F.009 dibuat otomatis oleh sistem; PLPK tidak melihat atau mencetaknya. */
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
    setTab('history');
    showToast(isResubmission
      ? 'Koreksi terkirim. Status kembali menunggu verifikasi Kordes.'
      : 'Penjemputan dikonfirmasi. Data dikunci dan dikirim ke Kordes.');
  }, [activeBatch, showToast]);

  const openEntry = activeBatch?.entries.find((entry) => entry.id === openEntryId) ?? null;
  const pendingCount = activeBatch?.pendingCount ?? 0;

  return (
    <div className="plpk-app">
      {tab === 'home' && (
        <PlpkHome
          profile={profile}
          batch={periodBatch}
          onStart={() => { setWorkingBatchId(null); setTab('collection'); }}
        />
      )}

      {tab === 'collection' && (
        <PlpkCollectionTab
          batch={activeBatch}
          onOpenEntry={setOpenEntryId}
          onReview={() => setReviewOpen(true)}
        />
      )}

      {tab === 'history' && (
        <PlpkHistoryTab
          batches={history}
          onFixCorrection={(batchId) => { setWorkingBatchId(batchId); setTab('collection'); }}
        />
      )}

      {tab === 'profile' && <PlpkProfileTab profile={profile} batches={history} />}

      <nav className="plpk-nav" aria-label="Navigasi utama">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'is-active' : undefined}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setTab(key)}
          >
            <Icon size={21} aria-hidden="true" />
            {label}
            {key === 'collection' && pendingCount > 0 ? (
              <span className="plpk-nav-badge" aria-label={`${pendingCount} Munfiq belum dikunjungi`}>{pendingCount}</span>
            ) : null}
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

      {reviewOpen && activeBatch ? (
        <PlpkReviewSheet
          batch={activeBatch}
          onClose={() => setReviewOpen(false)}
          onConfirm={confirmCollection}
        />
      ) : null}

      {toast ? <div className="plpk-toast" role="status">{toast}</div> : null}
    </div>
  );
}
