import type { CollectionBatch, CollectionVisitStatus } from './types';
import { currentCollectionPeriod, gorutCollectionBatches } from './pengambilan-mock-data';

/**
 * Model data halaman Monitoring Penjemputan PLPK.
 *
 * Satu baris tabel = satu Munfiq dalam satu periode, bukan satu PLPK.
 * Halaman ini memantau hasil penerimaan koin per Munfiq milik PLPK terpilih.
 */

/** Referensi hanya mengenal dua status baris. */
export type MonitoringRowStatus = 'verified' | 'not-collected';

export const monitoringStatusLabels: Record<MonitoringRowStatus, string> = {
  verified: 'Terverifikasi',
  'not-collected': 'Tidak Terjemput',
};

export interface MunfiqCollectionRow {
  id: string;
  canCode: string;
  munfiqName: string;
  /** Desa/ranting tempat Munfiq berada. */
  ranting: string;
  rt: string;
  rw: string;
  /** Kosong bila koin tidak terjemput. */
  collectedAt: string;
  period: string;
  amount: number;
  status: MonitoringRowStatus;
  visitStatus: CollectionVisitStatus;
}

export interface MonitoringFilters {
  upzis: string;
  ranting: string;
  plpkId: string;
  period: string;
}

export function upzisForKecamatan(kecamatan: string): string {
  return `UPZIS ${kecamatan}`;
}

type MonitoringBatchContext = Pick<CollectionBatch, 'period' | 'plpkId' | 'plpkName' | 'kecamatan' | 'village'> & {
  sourceId: string;
};

/**
 * Dataset khusus layar monitoring desktop. Data nominal dan Munfiq memakai seed
 * penghimpunan yang sudah ada, sedangkan konteks wilayahnya dibuat eksplisit agar:
 * - UPZIS selalu mewakili kecamatan;
 * - satu Ranting selalu berada di satu UPZIS;
 * - satu PLPK hanya bertugas di satu Ranting.
 *
 * Dataset ini sengaja tidak dipakai aplikasi mobile PLPK atau alur verifikasi.
 */
const monitoringBatchContexts: MonitoringBatchContext[] = [
  { sourceId: 'batch-001', period: '2026-07', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Cikajang', village: 'Mekarjaya' },
  { sourceId: 'batch-007', period: '2026-06', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Cikajang', village: 'Mekarjaya' },
  { sourceId: 'batch-012', period: '2026-05', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', kecamatan: 'Cikajang', village: 'Mekarjaya' },
  { sourceId: 'batch-002', period: '2026-07', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Cikajang', village: 'Cibodas' },
  { sourceId: 'batch-008', period: '2026-06', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Cikajang', village: 'Cibodas' },
  { sourceId: 'batch-013', period: '2026-05', plpkId: 'PLPK-02', plpkName: 'Asep Saepudin', kecamatan: 'Cikajang', village: 'Cibodas' },
  { sourceId: 'batch-003', period: '2026-07', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Cikajang', village: 'Padasuka' },
  { sourceId: 'batch-009', period: '2026-06', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Cikajang', village: 'Padasuka' },
  { sourceId: 'batch-016', period: '2026-04', plpkId: 'PLPK-03', plpkName: 'Yana Suryana', kecamatan: 'Cikajang', village: 'Padasuka' },
  { sourceId: 'batch-004', period: '2026-07', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dawungsari' },
  { sourceId: 'batch-010', period: '2026-06', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dawungsari' },
  { sourceId: 'batch-018', period: '2026-03', plpkId: 'PLPK-04', plpkName: 'Ujang Koswara', kecamatan: 'Cilawu', village: 'Dawungsari' },
  { sourceId: 'batch-019', period: '2026-07', plpkId: 'PLPK-05', plpkName: 'Nia Solihat', kecamatan: 'Garut Kota', village: 'Paminggir' },
  { sourceId: 'batch-020', period: '2026-06', plpkId: 'PLPK-06', plpkName: 'Rudi Firmansyah', kecamatan: 'Garut Kota', village: 'Ciwalen' },
  { sourceId: 'batch-021', period: '2026-07', plpkId: 'PLPK-07', plpkName: 'Lilis Nuraeni', kecamatan: 'Karangpawitan', village: 'Sindangpalay' },
  { sourceId: 'batch-022', period: '2026-05', plpkId: 'PLPK-08', plpkName: 'Tatang Sudrajat', kecamatan: 'Cilawu', village: 'Dayeuhmanggung' },
];

export const monitoringCollectionBatches: CollectionBatch[] = monitoringBatchContexts.flatMap((context, index) => {
  const source = gorutCollectionBatches.find((batch) => batch.id === context.sourceId);
  if (!source) return [];

  return [{
    ...source,
    id: `monitoring-batch-${String(index + 1).padStart(3, '0')}`,
    period: context.period,
    plpkId: context.plpkId,
    plpkName: context.plpkName,
    kecamatan: context.kecamatan,
    village: context.village,
    kordesName: `Kordes ${context.village}`,
  }];
});

/** Koin hanya dianggap masuk bila hasil kunjungannya Terjemput. */
export function monitoringRowStatus(visitStatus: CollectionVisitStatus): MonitoringRowStatus {
  return visitStatus === 'collected' ? 'verified' : 'not-collected';
}

/**
 * Tanggal jemput mengikuti tampilan referensi: `2026-07-04 09:15:32`.
 * Data lama dan hasil simpanan aplikasi mobile hanya berisi tanggal, jadi
 * bagian waktu ditampilkan hanya bila memang ada.
 */
export function formatCollectedAt(value: string): string {
  if (!value) return '—';
  const [date, time] = value.split('T');
  return time ? `${date} ${time.slice(0, 8)}` : date;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export interface MonitoringOptions {
  upzis: string[];
  ranting: string[];
  plpk: { id: string; name: string }[];
  period: string[];
}

/**
 * Pilihan filter bertingkat: UPZIS menentukan Ranting, Ranting menentukan PLPK,
 * PLPK menentukan periode yang tersedia.
 */
export function buildMonitoringOptions(batches: CollectionBatch[], filters: MonitoringFilters): MonitoringOptions {
  const upzis = unique(batches.map((batch) => upzisForKecamatan(batch.kecamatan))).sort();

  const inUpzis = batches.filter((batch) => upzisForKecamatan(batch.kecamatan) === filters.upzis);
  const ranting = unique(inUpzis.map((batch) => batch.village)).sort();

  const inRanting = inUpzis.filter((batch) => batch.village === filters.ranting);
  const plpkIds = unique(inRanting.map((batch) => batch.plpkId)).sort();
  const plpk = plpkIds.map((id) => ({ id, name: inRanting.find((batch) => batch.plpkId === id)?.plpkName ?? id }));

  const period = unique(inRanting.filter((batch) => batch.plpkId === filters.plpkId).map((batch) => batch.period)).sort().reverse();

  return { upzis, ranting, plpk, period };
}

/**
 * Rapikan kombinasi filter setelah induknya berubah, supaya tidak ada pilihan
 * yang menunjuk ke data kosong.
 */
export function resolveMonitoringFilters(batches: CollectionBatch[], requested: MonitoringFilters): MonitoringFilters {
  const next = { ...requested };

  const allUpzis = unique(batches.map((batch) => upzisForKecamatan(batch.kecamatan))).sort();
  if (!allUpzis.includes(next.upzis)) next.upzis = allUpzis[0] ?? '';

  const inUpzis = batches.filter((batch) => upzisForKecamatan(batch.kecamatan) === next.upzis);
  const rantings = unique(inUpzis.map((batch) => batch.village)).sort();
  if (!rantings.includes(next.ranting)) next.ranting = rantings[0] ?? '';

  const inRanting = inUpzis.filter((batch) => batch.village === next.ranting);
  const plpkIds = unique(inRanting.map((batch) => batch.plpkId)).sort();
  if (!plpkIds.includes(next.plpkId)) next.plpkId = plpkIds[0] ?? '';

  const periods = unique(inRanting.filter((batch) => batch.plpkId === next.plpkId).map((batch) => batch.period)).sort().reverse();
  if (!periods.includes(next.period)) next.period = periods[0] ?? '';

  return next;
}

/** Filter awal menampilkan contoh hierarki Cikajang → Mekarjaya → PLPK-01. */
export function defaultMonitoringFilters(batches: CollectionBatch[]): MonitoringFilters {
  return resolveMonitoringFilters(batches, {
    upzis: upzisForKecamatan('Cikajang'),
    ranting: 'Mekarjaya',
    plpkId: 'PLPK-01',
    period: currentCollectionPeriod,
  });
}

/** Daftar Munfiq milik PLPK terpilih pada ranting dan periode terpilih. */
export function buildMunfiqRows(batches: CollectionBatch[], filters: MonitoringFilters): MunfiqCollectionRow[] {
  return batches
    .filter((batch) =>
      upzisForKecamatan(batch.kecamatan) === filters.upzis
      && batch.village === filters.ranting
      && batch.plpkId === filters.plpkId
      && batch.period === filters.period)
    .flatMap((batch) => batch.entries.map((entry) => ({
      id: entry.id,
      canCode: entry.canCode,
      munfiqName: entry.munfiqName,
      ranting: batch.village,
      rt: entry.rt ?? '—',
      rw: entry.rw ?? '—',
      collectedAt: entry.visitStatus === 'collected' ? entry.collectedAt : '',
      period: batch.period,
      amount: entry.visitStatus === 'collected' ? entry.amount : 0,
      status: monitoringRowStatus(entry.visitStatus),
      visitStatus: entry.visitStatus,
    })));
}

export interface MonitoringSummary {
  plpkName: string;
  plpkId: string;
  activeCount: number;
  collectedCount: number;
  verifiedAmount: number;
}

/** Ringkasan selalu dalam konteks satu PLPK terpilih. */
export function summarizeMunfiqRows(rows: MunfiqCollectionRow[], plpk: { id: string; name: string } | undefined): MonitoringSummary {
  const collected = rows.filter((row) => row.status === 'verified');
  return {
    plpkName: plpk?.name ?? '—',
    plpkId: plpk?.id ?? '—',
    activeCount: rows.length,
    collectedCount: collected.length,
    verifiedAmount: collected.reduce((sum, row) => sum + row.amount, 0),
  };
}

export type MonitoringSortKey = 'munfiq' | 'amount';
export type MonitoringSortDirection = 'asc' | 'desc';

export function sortMunfiqRows(rows: MunfiqCollectionRow[], key: MonitoringSortKey | null, direction: MonitoringSortDirection): MunfiqCollectionRow[] {
  if (!key) return rows;
  const factor = direction === 'asc' ? 1 : -1;
  return rows.slice().sort((a, b) => (key === 'munfiq'
    ? a.munfiqName.localeCompare(b.munfiqName, 'id') * factor
    : (a.amount - b.amount) * factor));
}

/** Pencarian mencakup nama Munfiq, kode kaleng, dan alamat. */
export function filterMunfiqRows(rows: MunfiqCollectionRow[], query: string): MunfiqCollectionRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    row.munfiqName.toLowerCase().includes(needle)
    || row.canCode.toLowerCase().includes(needle)
    || `${row.ranting} rt ${row.rt} rw ${row.rw}`.toLowerCase().includes(needle));
}

export function formatRowAddress(row: MunfiqCollectionRow): string {
  return `${row.ranting}, RT ${row.rt} RW ${row.rw}`;
}
