import { collectionStatusLabels, formatPeriodLabel } from './pengambilan-options';
import type { CollectionBatch, CollectionStatus } from './types';

export type OpsMonitoringFilters = {
  period: string;
  kecamatan: string;
  village: string;
  status: string;
};

export type OpsAttentionItem = {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
  href: string;
  hrefLabel: string;
};

export type OpsRegionRow = {
  id: string;
  period: string;
  periodLabel: string;
  kecamatan: string;
  village: string;
  plpkCount: number;
  batchCount: number;
  grossAmount: number;
  totalPlpkFee: number;
  netAmount: number;
  processLabel: string;
  processTone: string;
};

export type OpsActivityItem = {
  id: string;
  label: string;
  detail: string;
  at: string;
  href: string;
  hrefLabel: string;
};

export const initialOpsFilters: OpsMonitoringFilters = {
  period: 'all',
  kecamatan: 'all',
  village: 'all',
  status: 'all',
};

const unfinished: CollectionStatus[] = ['draft', 'scheduled', 'collecting', 'collection-completed'];

export function filterOpsBatches(batches: CollectionBatch[], filters: OpsMonitoringFilters) {
  return batches.filter((batch) => {
    if (filters.period !== 'all' && batch.period !== filters.period) return false;
    if (filters.kecamatan !== 'all' && batch.kecamatan !== filters.kecamatan) return false;
    if (filters.village !== 'all' && batch.village !== filters.village) return false;
    if (filters.status !== 'all' && batch.status !== filters.status) return false;
    return true;
  });
}

export function summarizeOpsBatches(batches: CollectionBatch[]) {
  const grossAmount = batches.reduce((sum, batch) => sum + batch.grossAmount, 0);
  const totalPlpkFee = batches.reduce((sum, batch) => sum + batch.totalPlpkFee, 0);
  const plpkIds = new Set(batches.map((batch) => batch.plpkId));
  return {
    grossAmount,
    totalPlpkFee,
    netAmount: grossAmount - totalPlpkFee,
    batchCount: batches.length,
    plpkCount: plpkIds.size,
    incomplete: batches.filter((batch) => unfinished.includes(batch.status)).length,
    waitingKordes: batches.filter((batch) => batch.status === 'waiting-kordes-verification').length,
    needsCorrection: batches.filter((batch) => batch.status === 'needs-correction').length,
    verifiedByKordes: batches.filter((batch) => batch.status === 'verified-by-kordes').length,
  };
}

/**
 * Progress dihitung dari batch terfilter.
 * Denominator = total batch pada filter yang sama (bukan target fiktif).
 */
export function buildOpsProgress(batches: CollectionBatch[]) {
  const total = batches.length;
  if (!total) {
    return [
      { id: 'verified', label: 'Batch terverifikasi Kordes', done: 0, total: 0, ratio: null as number | null },
      { id: 'submitted', label: 'PLPK sudah mengirim ke Kordes', done: 0, total: 0, ratio: null as number | null },
      { id: 'complete', label: 'Batch penjemputan selesai', done: 0, total: 0, ratio: null as number | null },
    ];
  }

  const verified = batches.filter((batch) => batch.status === 'verified-by-kordes').length;
  const submitted = batches.filter((batch) =>
    batch.status === 'waiting-kordes-verification'
    || batch.status === 'verified-by-kordes'
    || batch.status === 'needs-correction',
  ).length;
  const complete = batches.filter((batch) =>
    batch.status === 'collection-completed'
    || batch.status === 'waiting-kordes-verification'
    || batch.status === 'verified-by-kordes'
    || batch.status === 'needs-correction',
  ).length;

  return [
    { id: 'verified', label: 'Batch terverifikasi Kordes', done: verified, total, ratio: verified / total },
    { id: 'submitted', label: 'PLPK sudah mengirim ke Kordes', done: submitted, total, ratio: submitted / total },
    { id: 'complete', label: 'Batch penjemputan selesai', done: complete, total, ratio: complete / total },
  ];
}

function regionProcess(batches: CollectionBatch[]) {
  if (!batches.length) return { label: 'Tanpa data', tone: 'empty' };
  if (batches.some((batch) => batch.status === 'needs-correction')) return { label: 'Perlu Koreksi', tone: 'needs-correction' };
  if (batches.some((batch) => unfinished.includes(batch.status))) return { label: 'Belum Lengkap', tone: 'incomplete' };
  if (batches.some((batch) => batch.status === 'waiting-kordes-verification')) return { label: 'Menunggu Kordes', tone: 'waiting' };
  if (batches.every((batch) => batch.status === 'verified-by-kordes')) return { label: 'Terverifikasi Kordes', tone: 'verified' };
  return { label: 'Campuran status', tone: 'mixed' };
}

export function buildOpsRegions(batches: CollectionBatch[]): OpsRegionRow[] {
  const groups = new Map<string, CollectionBatch[]>();
  for (const batch of batches) {
    const key = `${batch.period}|${batch.kecamatan}|${batch.village}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(batch);
    else groups.set(key, [batch]);
  }

  return [...groups.entries()].map(([key, items]) => {
    const [period, kecamatan, village] = key.split('|');
    const process = regionProcess(items);
    const plpkIds = new Set(items.map((batch) => batch.plpkId));
    const grossAmount = items.reduce((sum, batch) => sum + batch.grossAmount, 0);
    const totalPlpkFee = items.reduce((sum, batch) => sum + batch.totalPlpkFee, 0);
    return {
      id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      period,
      periodLabel: formatPeriodLabel(period),
      kecamatan,
      village,
      plpkCount: plpkIds.size,
      batchCount: items.length,
      grossAmount,
      totalPlpkFee,
      netAmount: grossAmount - totalPlpkFee,
      processLabel: process.label,
      processTone: process.tone,
    };
  }).sort((a, b) => {
    if (a.period !== b.period) return b.period.localeCompare(a.period);
    if (a.kecamatan !== b.kecamatan) return a.kecamatan.localeCompare(b.kecamatan, 'id-ID');
    return a.village.localeCompare(b.village, 'id-ID');
  });
}

export function buildOpsAttention(batches: CollectionBatch[]): OpsAttentionItem[] {
  const items: OpsAttentionItem[] = [];

  for (const batch of batches.filter((item) => item.status === 'needs-correction')) {
    items.push({
      id: `corr-${batch.id}`,
      title: `Perlu koreksi · ${batch.plpkName}`,
      detail: `${batch.village}, ${batch.kecamatan} · ${formatPeriodLabel(batch.period)}${batch.kordesNotes ? ` · ${batch.kordesNotes}` : ''}`,
      severity: 'critical',
      href: '/gorut-v2/penghimpunan/verifikasi-kordes',
      hrefLabel: 'Verifikasi Kordes',
    });
  }

  for (const batch of batches.filter((item) => item.status === 'waiting-kordes-verification')) {
    items.push({
      id: `wait-${batch.id}`,
      title: `Menunggu Kordes · ${batch.plpkName}`,
      detail: `${batch.village}, ${batch.kecamatan} · ${formatPeriodLabel(batch.period)} · dikirim ${batch.submittedToKordesAt ?? batch.createdAt}`,
      severity: 'warning',
      href: '/gorut-v2/penghimpunan/verifikasi-kordes',
      hrefLabel: 'Verifikasi Kordes',
    });
  }

  for (const batch of batches.filter((item) => item.status === 'collecting' || item.status === 'scheduled' || item.status === 'collection-completed')) {
    items.push({
      id: `inc-${batch.id}`,
      title: `Belum lengkap · ${batch.plpkName}`,
      detail: `${collectionStatusLabels[batch.status]} · ${batch.village} · ${batch.visitedCount}/${batch.entries.length} Munfiq dikunjungi`,
      severity: 'info',
      href: '/gorut-v2/penghimpunan/penjemputan-plpk',
      hrefLabel: 'Penjemputan PLPK',
    });
  }

  const regions = buildOpsRegions(batches);
  for (const region of regions.filter((row) => row.processTone === 'incomplete' || row.processTone === 'waiting')) {
    if (items.some((item) => item.detail.includes(region.village) && item.detail.includes(formatPeriodLabel(region.period)))) continue;
    items.push({
      id: `region-${region.id}`,
      title: `Desa belum siap direkap · ${region.village}`,
      detail: `${region.kecamatan} · ${region.periodLabel} · ${region.processLabel} · ${region.batchCount} batch`,
      severity: region.processTone === 'waiting' ? 'warning' : 'info',
      href: '/gorut-v2/penghimpunan/verifikasi-upzis',
      hrefLabel: 'Verifikasi UPZIS',
    });
  }

  const readyDocs = batches.filter((batch) => batch.status === 'verified-by-kordes').length;
  const total = batches.length;
  if (total && readyDocs < total) {
    items.push({
      id: 'docs-pending',
      title: 'Dokumen administrasi belum lengkap',
      detail: `${readyDocs} dari ${total} batch sudah terverifikasi Kordes. Preview F.009–F.015 mengikuti kesiapan data.`,
      severity: 'info',
      href: '/gorut-v2/dokumen-administrasi',
      hrefLabel: 'Dokumen Administrasi',
    });
  }

  const rank = { critical: 0, warning: 1, info: 2 } as const;
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 12);
}

function activityStamp(batch: CollectionBatch) {
  if (batch.verifiedByKordesAt) {
    return { at: batch.verifiedByKordesAt, label: 'Terverifikasi Kordes', href: '/gorut-v2/penghimpunan/verifikasi-kordes', hrefLabel: 'Verifikasi Kordes' };
  }
  if (batch.returnedForCorrectionAt) {
    return { at: batch.returnedForCorrectionAt, label: 'Dikembalikan untuk koreksi', href: '/gorut-v2/penghimpunan/verifikasi-kordes', hrefLabel: 'Verifikasi Kordes' };
  }
  if (batch.submittedToKordesAt) {
    return { at: batch.submittedToKordesAt, label: 'Dikirim ke Kordes', href: '/gorut-v2/penghimpunan/verifikasi-kordes', hrefLabel: 'Verifikasi Kordes' };
  }
  if (batch.confirmedByPlpkAt) {
    return { at: batch.confirmedByPlpkAt, label: 'Dikonfirmasi PLPK', href: '/gorut-v2/penghimpunan/penjemputan-plpk', hrefLabel: 'Penjemputan PLPK' };
  }
  if (batch.lockedAt) {
    return { at: batch.lockedAt, label: 'Batch dikunci', href: '/gorut-v2/penghimpunan/penjemputan-plpk', hrefLabel: 'Penjemputan PLPK' };
  }
  return { at: batch.createdAt, label: collectionStatusLabels[batch.status], href: '/gorut-v2/penghimpunan/penjemputan-plpk', hrefLabel: 'Penjemputan PLPK' };
}

/** Batch terbaru berdasarkan timestamp existing — bukan log fiktif. */
export function buildOpsRecentBatches(batches: CollectionBatch[], limit = 8): OpsActivityItem[] {
  return [...batches]
    .map((batch) => {
      const stamp = activityStamp(batch);
      return {
        id: batch.id,
        label: stamp.label,
        detail: `${batch.plpkName} · ${batch.village}, ${batch.kecamatan} · ${formatPeriodLabel(batch.period)}`,
        at: stamp.at,
        href: stamp.href,
        hrefLabel: stamp.hrefLabel,
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

export function opsFilterOptions(batches: CollectionBatch[]) {
  const periods = [...new Set(batches.map((batch) => batch.period))].sort((a, b) => b.localeCompare(a));
  const kecamatan = [...new Set(batches.map((batch) => batch.kecamatan))].sort((a, b) => a.localeCompare(b, 'id-ID'));
  const villages = [...new Set(batches.map((batch) => batch.village))].sort((a, b) => a.localeCompare(b, 'id-ID'));
  const statuses = [...new Set(batches.map((batch) => batch.status))];
  return { periods, kecamatan, villages, statuses };
}

export { collectionStatusLabels, formatPeriodLabel };
