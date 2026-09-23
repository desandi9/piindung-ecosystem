import { f009Readiness } from './f009-eligibility';
import { createVillageRecaps, buildKordesVerifications, isF015Ready } from './kordes-mock-data';
import { collectionStatusLabels, formatPeriodLabel } from './pengambilan-options';
import type { CollectionBatch, CollectionStatus, KordesVillageRecap } from './types';

export type DocumentKind = 'f009' | 'f010' | 'f015' | 'f016';
export type DocumentReadiness = 'ready' | 'waiting' | 'unavailable';

export type DocumentCatalogRow = {
  id: string;
  kind: DocumentKind;
  kindLabel: string;
  documentNumber: string;
  period: string;
  periodLabel: string;
  kecamatan: string;
  village: string;
  owner: string;
  dataStatus: string;
  readiness: DocumentReadiness;
  readinessLabel: string;
  updatedAt: string;
  batchId?: string;
  recapId?: string;
  canPreview: boolean;
};

export type DocumentCatalogFilters = {
  period: string;
  kind: string;
  kecamatan: string;
  village: string;
  readiness: string;
  query: string;
};

export const documentKindLabels: Record<DocumentKind, string> = {
  f009: 'F.009',
  f010: 'F.010',
  f015: 'F.015',
  f016: 'F.016',
};

export const documentReadinessLabels: Record<DocumentReadiness, string> = {
  ready: 'Siap Dilihat',
  waiting: 'Menunggu Data',
  unavailable: 'Belum Tersedia',
};

export const initialDocumentFilters: DocumentCatalogFilters = {
  period: 'all',
  kind: 'all',
  kecamatan: 'all',
  village: 'all',
  readiness: 'all',
  query: '',
};

function latestTimestamp(batch: CollectionBatch) {
  return (
    batch.verifiedByKordesAt
    ?? batch.returnedForCorrectionAt
    ?? batch.submittedToKordesAt
    ?? batch.confirmedByPlpkAt
    ?? batch.lockedAt
    ?? batch.createdAt
  );
}

function f010Readiness(recap: KordesVillageRecap): DocumentReadiness {
  if (!recap.plpkRows.length) return 'unavailable';
  if (recap.plpkRows.every((row) => row.status === 'verified-by-kordes')) return 'ready';
  if (recap.plpkRows.some((row) => row.status === 'waiting-kordes-verification' || row.status === 'needs-correction' || row.status === 'verified-by-kordes')) {
    return 'waiting';
  }
  return 'unavailable';
}

function f015Readiness(recap: KordesVillageRecap): DocumentReadiness {
  if (isF015Ready(recap)) return 'ready';
  if (recap.plpkRows.length) return 'waiting';
  return 'unavailable';
}

function f010Number(recap: KordesVillageRecap) {
  const [year, month] = recap.period.split('-');
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const code = recap.village.normalize('NFKD').replace(/[^\p{L}\p{N}.-]+/gu, '-').replace(/^-+|-+$/g, '').toUpperCase();
  return `F.010/${code}/${roman[Number(month) - 1] ?? month}/${year}`;
}

function buildF009Rows(batches: CollectionBatch[]): DocumentCatalogRow[] {
  return batches
    .filter((batch) => batch.status !== 'draft')
    .map((batch) => {
      const readiness = f009Readiness(batch);
      return {
        id: `f009-${batch.id}`,
        kind: 'f009' as const,
        kindLabel: documentKindLabels.f009,
        documentNumber: batch.f009DocumentNumber ?? batch.documentNumber,
        period: batch.period,
        periodLabel: formatPeriodLabel(batch.period),
        kecamatan: batch.kecamatan,
        village: batch.village,
        owner: batch.plpkName,
        dataStatus: collectionStatusLabels[batch.status],
        readiness,
        readinessLabel: documentReadinessLabels[readiness],
        updatedAt: latestTimestamp(batch),
        batchId: batch.id,
        canPreview: readiness === 'ready',
      };
    });
}

/** F.010 / F.015 dari rekap desa yang diturunkan batch existing. */
function buildRecapRows(batches: CollectionBatch[]): DocumentCatalogRow[] {
  const verifications = buildKordesVerifications(batches);
  const recaps = createVillageRecaps(verifications);
  const rows: DocumentCatalogRow[] = [];

  for (const recap of recaps) {
    const f010 = f010Readiness(recap);
    const f015 = f015Readiness(recap);
    const updatedAt = recap.plpkRows
      .map((row) => row.verifiedAt ?? row.returnedForCorrectionAt ?? '')
      .filter(Boolean)
      .sort()
      .at(-1) ?? recap.handoverDate;

    rows.push({
      id: `f010-${recap.id}`,
      kind: 'f010',
      kindLabel: documentKindLabels.f010,
      documentNumber: f010Number(recap),
      period: recap.period,
      periodLabel: formatPeriodLabel(recap.period),
      kecamatan: recap.kecamatan,
      village: recap.village,
      owner: recap.kordesName,
      dataStatus: f010 === 'ready' ? 'Rekap desa lengkap' : f010 === 'waiting' ? 'Menunggu kelengkapan verifikasi' : 'Belum ada data rekap',
      readiness: f010,
      readinessLabel: documentReadinessLabels[f010],
      updatedAt,
      recapId: recap.id,
      canPreview: f010 === 'ready',
    });

    rows.push({
      id: `f015-${recap.id}`,
      kind: 'f015',
      kindLabel: documentKindLabels.f015,
      documentNumber: isF015Ready(recap) ? recap.f015Number : '—',
      period: recap.period,
      periodLabel: formatPeriodLabel(recap.period),
      kecamatan: recap.kecamatan,
      village: recap.village,
      owner: recap.kordesName,
      dataStatus: isF015Ready(recap) ? 'Seluruh PLPK terverifikasi Kordes' : 'Menunggu seluruh PLPK terverifikasi',
      readiness: f015,
      readinessLabel: documentReadinessLabels[f015],
      updatedAt,
      recapId: recap.id,
      canPreview: f015 === 'ready',
    });
  }

  return rows;
}

/**
 * F.016 belum punya builder executable di frontend.
 * Satu baris scaffold tanpa nomor palsu — hanya agar jenis dokumen tetap terlihat.
 */
function buildF016Scaffold(): DocumentCatalogRow {
  return {
    id: 'f016-scaffold',
    kind: 'f016',
    kindLabel: documentKindLabels.f016,
    documentNumber: '—',
    period: '',
    periodLabel: '—',
    kecamatan: '—',
    village: '—',
    owner: 'UPZIS → PC',
    dataStatus: 'Sumber data F.016 belum aktif',
    readiness: 'unavailable',
    readinessLabel: documentReadinessLabels.unavailable,
    updatedAt: '',
    canPreview: false,
  };
}

export function buildDocumentCatalog(batches: CollectionBatch[]): DocumentCatalogRow[] {
  const rows = [...buildF009Rows(batches), ...buildRecapRows(batches), buildF016Scaffold()];
  return rows.sort((a, b) => {
    if (a.period !== b.period) return (b.period || '').localeCompare(a.period || '');
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.village.localeCompare(b.village, 'id-ID');
  });
}

export function filterDocumentCatalog(rows: DocumentCatalogRow[], filters: DocumentCatalogFilters) {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.period !== 'all' && row.period !== filters.period) return false;
    if (filters.kind !== 'all' && row.kind !== filters.kind) return false;
    if (filters.kecamatan !== 'all' && row.kecamatan !== filters.kecamatan) return false;
    if (filters.village !== 'all' && row.village !== filters.village) return false;
    if (filters.readiness !== 'all' && row.readiness !== filters.readiness) return false;
    if (!q) return true;
    const haystack = `${row.documentNumber} ${row.owner} ${row.village} ${row.kecamatan} ${row.kindLabel} ${row.periodLabel}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function summarizeDocumentCatalog(rows: DocumentCatalogRow[]) {
  return {
    total: rows.length,
    ready: rows.filter((row) => row.readiness === 'ready').length,
    waiting: rows.filter((row) => row.readiness === 'waiting').length,
    unavailable: rows.filter((row) => row.readiness === 'unavailable').length,
  };
}

export function documentFilterOptions(rows: DocumentCatalogRow[]) {
  const periods = [...new Set(rows.map((row) => row.period).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const kecamatan = [...new Set(rows.map((row) => row.kecamatan).filter((value) => value && value !== '—'))].sort((a, b) => a.localeCompare(b, 'id-ID'));
  const villages = [...new Set(rows.map((row) => row.village).filter((value) => value && value !== '—'))].sort((a, b) => a.localeCompare(b, 'id-ID'));
  return { periods, kecamatan, villages };
}

export function findRecapForDocument(batches: CollectionBatch[], recapId: string): KordesVillageRecap | null {
  const recaps = createVillageRecaps(buildKordesVerifications(batches));
  return recaps.find((recap) => recap.id === recapId) ?? null;
}

export function batchDataStatusLabel(status: CollectionStatus) {
  return collectionStatusLabels[status];
}
