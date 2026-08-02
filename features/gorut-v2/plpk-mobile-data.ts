'use client';

import { useEffect, useSyncExternalStore } from 'react';

import type { CollectionBatch, PlpkProfile } from './types';
import { currentCollectionPeriod } from './pengambilan-mock-data';
import {
  getCollectionServerSnapshot,
  getCollectionSnapshot,
  hydrateCollectionStore,
  subscribeCollectionStore,
} from './collection-store';

/** PLPK yang sedang memakai aplikasi mobile. Mock — tidak menyentuh auth atau role. */
export const activePlpkProfile: PlpkProfile = {
  plpkId: 'PLPK-01',
  name: 'Dede Rahmat',
  phone: '081234500001',
  village: 'Sukamentri',
  kecamatan: 'Garut Kota',
  kordesName: 'Kordes Sukamentri',
  upzis: 'UPZIS Masjid Agung',
  joinedAt: '2024-02-01',
};

/**
 * Batch efektif dengan hidrasi localStorage setelah mount.
 * Snapshot server sengaja memakai data mock dasar supaya markup awal cocok.
 */
export function useCollectionBatches(): CollectionBatch[] {
  useEffect(() => { hydrateCollectionStore(); }, []);
  return useSyncExternalStore(subscribeCollectionStore, getCollectionSnapshot, getCollectionServerSnapshot);
}

/** Seluruh batch milik PLPK ini saja — dasar aturan "PLPK hanya melihat wilayahnya". */
export function batchesForPlpk(batches: CollectionBatch[], plpkId: string): CollectionBatch[] {
  return batches.filter((batch) => batch.plpkId === plpkId);
}

/**
 * Batch periode berjalan untuk desa tempat PLPK bertugas.
 *
 * Sengaja tidak menyaring berdasarkan status: setelah dikonfirmasi, batch tetap
 * ditampilkan dalam keadaan terkunci supaya PLPK masih bisa melihat hasil
 * kerjanya. Batch Perlu Koreksi tidak diambil di sini — perbaikan dimulai dari
 * Riwayat, supaya Beranda selalu menampilkan periode aktif.
 */
export function activeBatchForPlpk(batches: CollectionBatch[], plpkId: string, village: string = activePlpkProfile.village): CollectionBatch | null {
  const mine = batchesForPlpk(batches, plpkId);
  const current = mine.find((batch) => batch.period === currentCollectionPeriod && batch.village === village && batch.status !== 'needs-correction');
  return current ?? null;
}

/** Batch yang dikembalikan Kordes dan menunggu perbaikan PLPK. */
export function correctionBatchesForPlpk(batches: CollectionBatch[], plpkId: string): CollectionBatch[] {
  return batchesForPlpk(batches, plpkId).filter((batch) => batch.status === 'needs-correction');
}

/** Riwayat periode PLPK, terbaru lebih dulu. */
export function historyForPlpk(batches: CollectionBatch[], plpkId: string): CollectionBatch[] {
  return batchesForPlpk(batches, plpkId).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
