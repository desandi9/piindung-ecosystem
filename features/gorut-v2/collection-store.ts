import type { CollectionBatch } from './types';
import { gorutCollectionBatches } from './pengambilan-mock-data';

/**
 * Penyimpanan sementara di sisi klien untuk prototipe GORUT V2.
 *
 * Aplikasi mobile PLPK dan dashboard web memakai data mock yang sama, jadi hasil
 * penjemputan yang dikonfirmasi di mobile harus langsung terlihat di halaman
 * Monitoring dan Verifikasi Kordes. Tidak ada API, Prisma, atau perubahan auth
 * di sini — hanya override batch yang disimpan di localStorage.
 */

const STORAGE_KEY = 'gorut-v2:collection-overrides';

let overrides: Record<string, CollectionBatch> = {};
let hydrated = false;
let storageListening = false;
let snapshot: CollectionBatch[] = gorutCollectionBatches;
const listeners = new Set<() => void>();
const knownBatchIds = new Set(gorutCollectionBatches.map((batch) => batch.id));

function parseOverrides(raw: string): Record<string, CollectionBatch> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return Object.fromEntries(Object.entries(parsed).filter(([key, value]) => {
    if (!knownBatchIds.has(key) || !value || typeof value !== 'object') return false;
    const batch = value as Partial<CollectionBatch>;
    return batch.id === key && typeof batch.period === 'string' && typeof batch.status === 'string' && Array.isArray(batch.entries);
  })) as Record<string, CollectionBatch>;
}

function listenForStorageChanges() {
  if (storageListening || typeof window === 'undefined') return;
  storageListening = true;
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      overrides = event.newValue ? parseOverrides(event.newValue) : {};
      emit();
    } catch {
      overrides = {};
      emit();
    }
  });
}

function rebuildSnapshot() {
  snapshot = Object.keys(overrides).length
    ? gorutCollectionBatches.map((batch) => overrides[batch.id] ?? batch)
    : gorutCollectionBatches;
}

function emit() {
  rebuildSnapshot();
  listeners.forEach((listener) => listener());
}

/** Baca localStorage sekali di klien. Dipanggil dari effect supaya SSR tetap konsisten. */
export function hydrateCollectionStore() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  listenForStorageChanges();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    overrides = parseOverrides(raw);
    emit();
  } catch {
    // Data rusak atau storage diblokir — cukup jalan dengan data mock awal.
  }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Storage penuh atau ditolak; state di memori tetap dipakai.
  }
}

/** Simpan satu batch dan beri tahu seluruh layar yang sedang menonton. */
export function saveCollectionBatch(batch: CollectionBatch) {
  overrides = { ...overrides, [batch.id]: batch };
  persist();
  emit();
}

export function subscribeCollectionStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Batch efektif: data mock dasar yang sudah ditimpa hasil kerja PLPK. */
export function getCollectionSnapshot(): CollectionBatch[] {
  return snapshot;
}

/** Snapshot untuk render server — selalu data mock dasar, tanpa localStorage. */
export function getCollectionServerSnapshot(): CollectionBatch[] {
  return gorutCollectionBatches;
}

export function findCollectionBatch(batchId: string): CollectionBatch | undefined {
  return snapshot.find((batch) => batch.id === batchId);
}
