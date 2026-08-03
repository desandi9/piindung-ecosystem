import type { CollectionBatch, GorutMunfiq, UpzisVillageRecap } from './types';

export type DashboardTrendPoint = {
  period: string;
  grossAmount: number;
  totalPlpkFee: number;
  netAmount: number;
};

export type DashboardStatusSlice = {
  id: 'incomplete' | 'waiting' | 'correction' | 'verified';
  label: string;
  count: number;
  percentage: number;
};

export type DashboardRegionProgress = {
  id: string;
  village: string;
  kecamatan: string;
  plpkCount: number;
  totalBatch: number;
  completedBatch: number;
  progress: number;
  netAmount: number;
};

export type DashboardFlowStep = {
  id: 'plpk' | 'kordes' | 'upzis' | 'pc';
  label: string;
  count: number;
  countLabel: string;
  status: string;
  tone: 'running' | 'waiting' | 'correction' | 'verified' | 'inactive';
  done: number;
  total: number;
  progress: number | null;
  href: string;
  bottleneck: boolean;
};

export type DashboardAttention = {
  id: string;
  priority: 'critical' | 'warning' | 'info';
  label: string;
  title: string;
  detail: string;
  href: string;
  hrefLabel: string;
};

export type DashboardControl = {
  activePeriod: string;
  kpi: {
    munfiqActive: number;
    munfiqTotal: number;
    batchRunning: number;
    batchTotal: number;
    waitingKordes: number;
    netAmount: number;
    grossAmount: number;
  };
  trend: DashboardTrendPoint[];
  statuses: DashboardStatusSlice[];
  statusTotal: number;
  regions: DashboardRegionProgress[];
  flow: DashboardFlowStep[];
  attention: DashboardAttention[];
};

const unfinishedStatuses = ['draft', 'scheduled', 'collecting'] as const;
const completedStatuses = ['collection-completed', 'waiting-kordes-verification', 'needs-correction', 'verified-by-kordes'] as const;

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function timestamp(batch: CollectionBatch) {
  return batch.returnedForCorrectionAt
    ?? batch.verifiedByKordesAt
    ?? batch.submittedToKordesAt
    ?? batch.confirmedByPlpkAt
    ?? batch.createdAt;
}

function buildTrend(batches: CollectionBatch[]): DashboardTrendPoint[] {
  const groups = new Map<string, CollectionBatch[]>();
  for (const batch of batches) groups.set(batch.period, [...(groups.get(batch.period) ?? []), batch]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([period, items]) => {
      const grossAmount = items.reduce((sum, batch) => sum + batch.grossAmount, 0);
      const totalPlpkFee = items.reduce((sum, batch) => sum + batch.totalPlpkFee, 0);
      return { period, grossAmount, totalPlpkFee, netAmount: grossAmount - totalPlpkFee };
    });
}

function buildStatuses(batches: CollectionBatch[]): DashboardStatusSlice[] {
  const counts = {
    incomplete: batches.filter((batch) => unfinishedStatuses.includes(batch.status as typeof unfinishedStatuses[number]) || batch.status === 'collection-completed').length,
    waiting: batches.filter((batch) => batch.status === 'waiting-kordes-verification').length,
    correction: batches.filter((batch) => batch.status === 'needs-correction').length,
    verified: batches.filter((batch) => batch.status === 'verified-by-kordes').length,
  };
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return [
    { id: 'incomplete', label: 'Belum Lengkap', count: counts.incomplete, percentage: percentage(counts.incomplete, total) },
    { id: 'waiting', label: 'Menunggu Kordes', count: counts.waiting, percentage: percentage(counts.waiting, total) },
    { id: 'correction', label: 'Perlu Koreksi', count: counts.correction, percentage: percentage(counts.correction, total) },
    { id: 'verified', label: 'Terverifikasi Kordes', count: counts.verified, percentage: percentage(counts.verified, total) },
  ];
}

function buildRegions(batches: CollectionBatch[], activePeriod: string): DashboardRegionProgress[] {
  const groups = new Map<string, CollectionBatch[]>();
  for (const batch of batches.filter((item) => item.period === activePeriod)) {
    const key = `${batch.kecamatan}|${batch.village}`;
    groups.set(key, [...(groups.get(key) ?? []), batch]);
  }
  return [...groups.entries()]
    .map(([id, items]) => {
      const completedBatch = items.filter((batch) => completedStatuses.includes(batch.status as typeof completedStatuses[number])).length;
      const grossAmount = items.reduce((sum, batch) => sum + batch.grossAmount, 0);
      const totalPlpkFee = items.reduce((sum, batch) => sum + batch.totalPlpkFee, 0);
      return {
        id,
        village: items[0].village,
        kecamatan: items[0].kecamatan,
        plpkCount: new Set(items.map((batch) => batch.plpkId)).size,
        totalBatch: items.length,
        completedBatch,
        progress: percentage(completedBatch, items.length),
        netAmount: grossAmount - totalPlpkFee,
      };
    })
    .sort((a, b) => a.progress - b.progress || b.netAmount - a.netAmount)
    .slice(0, 6);
}

function buildFlow(batches: CollectionBatch[], recaps: UpzisVillageRecap[], activePeriod: string): DashboardFlowStep[] {
  const active = batches.filter((batch) => batch.period === activePeriod);
  const submitted = active.filter((batch) => ['waiting-kordes-verification', 'needs-correction', 'verified-by-kordes'].includes(batch.status));
  const verified = active.filter((batch) => batch.status === 'verified-by-kordes');
  const waiting = active.filter((batch) => batch.status === 'waiting-kordes-verification');
  const correction = active.filter((batch) => batch.status === 'needs-correction');
  const running = active.filter((batch) => unfinishedStatuses.includes(batch.status as typeof unfinishedStatuses[number]) || batch.status === 'collection-completed');
  const periodRecaps = recaps.filter((recap) => recap.period === activePeriod);
  const recapDone = periodRecaps.filter((recap) => ['recapped', 'waiting-minutes', 'ready-to-deposit'].includes(recap.status));
  const recapWaiting = periodRecaps.filter((recap) => recap.status === 'incomplete' || recap.status === 'ready-to-recap');
  const bottleneck = correction.length || waiting.length ? 'kordes' : running.length ? 'plpk' : recapWaiting.length ? 'upzis' : '';

  return [
    {
      id: 'plpk', label: 'PLPK', count: running.length, countLabel: 'batch berjalan',
      status: running.length ? 'Penghimpunan berjalan' : 'Selesai dikirim', tone: running.length ? 'running' : 'verified',
      done: submitted.length, total: active.length, progress: active.length ? percentage(submitted.length, active.length) : null,
      href: '/gorut-v2/penghimpunan/penjemputan-plpk', bottleneck: bottleneck === 'plpk',
    },
    {
      id: 'kordes', label: 'Kordes', count: waiting.length + correction.length, countLabel: 'butuh tindakan',
      status: correction.length ? 'Ada koreksi' : waiting.length ? 'Menunggu verifikasi' : 'Terverifikasi',
      tone: correction.length ? 'correction' : waiting.length ? 'waiting' : 'verified',
      done: verified.length, total: submitted.length, progress: submitted.length ? percentage(verified.length, submitted.length) : null,
      href: '/gorut-v2/penghimpunan/verifikasi-kordes', bottleneck: bottleneck === 'kordes',
    },
    {
      id: 'upzis', label: 'UPZIS', count: recapWaiting.length, countLabel: 'desa menunggu',
      status: recapWaiting.length ? 'Rekap belum selesai' : recapDone.length ? 'Rekap selesai' : 'Belum ada data',
      tone: recapWaiting.length ? 'waiting' : recapDone.length ? 'verified' : 'inactive',
      done: recapDone.length, total: periodRecaps.length, progress: periodRecaps.length ? percentage(recapDone.length, periodRecaps.length) : null,
      href: '/gorut-v2/penghimpunan/verifikasi-upzis', bottleneck: bottleneck === 'upzis',
    },
    {
      id: 'pc', label: 'PC', count: 0, countLabel: 'sumber belum aktif', status: 'Belum aktif', tone: 'inactive',
      done: 0, total: 0, progress: null, href: '/gorut-v2/penghimpunan/verifikasi-pc', bottleneck: false,
    },
  ];
}

function buildAttention(batches: CollectionBatch[], regions: DashboardRegionProgress[]): DashboardAttention[] {
  const correction = batches.filter((batch) => batch.status === 'needs-correction').sort((a, b) => timestamp(b).localeCompare(timestamp(a))).map((batch) => ({
    id: `correction-${batch.id}`, priority: 'critical' as const, label: 'Koreksi', title: `${batch.plpkName} perlu koreksi`,
    detail: `${batch.village}, ${batch.kecamatan} · ${batch.kordesNotes ?? 'Periksa hasil verifikasi Kordes.'}`,
    href: '/gorut-v2/penghimpunan/verifikasi-kordes', hrefLabel: 'Buka Verifikasi',
  }));
  const waiting = batches.filter((batch) => batch.status === 'waiting-kordes-verification').sort((a, b) => timestamp(b).localeCompare(timestamp(a))).map((batch) => ({
    id: `waiting-${batch.id}`, priority: 'warning' as const, label: 'Menunggu', title: `${batch.plpkName} menunggu Kordes`,
    detail: `${batch.village}, ${batch.kecamatan} · dikirim ${batch.submittedToKordesAt ?? batch.createdAt}`,
    href: '/gorut-v2/penghimpunan/verifikasi-kordes', hrefLabel: 'Buka Antrean',
  }));
  const incomplete = batches.filter((batch) => unfinishedStatuses.includes(batch.status as typeof unfinishedStatuses[number]) || batch.status === 'collection-completed').sort((a, b) => timestamp(b).localeCompare(timestamp(a))).map((batch) => ({
    id: `incomplete-${batch.id}`, priority: 'info' as const, label: 'Belum Lengkap', title: `${batch.plpkName} belum selesai`,
    detail: `${batch.village}, ${batch.kecamatan} · ${batch.visitedCount}/${batch.entries.length} Munfiq dikunjungi`,
    href: '/gorut-v2/penghimpunan/penjemputan-plpk', hrefLabel: 'Buka Penjemputan',
  }));
  const villages = regions.filter((region) => region.progress < 100).map((region) => ({
    id: `region-${region.id}`, priority: 'info' as const, label: 'Desa', title: `${region.village} belum siap direkap`,
    detail: `${region.kecamatan} · ${region.completedBatch}/${region.totalBatch} batch selesai`,
    href: '/gorut-v2/penghimpunan/verifikasi-upzis', hrefLabel: 'Buka UPZIS',
  }));
  return [...correction, ...waiting, ...incomplete, ...villages].slice(0, 6);
}

export function buildDashboardControl(
  batches: CollectionBatch[],
  munfiq: GorutMunfiq[],
  recaps: UpzisVillageRecap[],
  requestedPeriod?: string,
): DashboardControl {
  const activePeriod = requestedPeriod ?? [...new Set(batches.map((batch) => batch.period))].sort().at(-1) ?? '';
  const periodBatches = batches.filter((batch) => batch.period === activePeriod);
  const grossAmount = periodBatches.reduce((sum, batch) => sum + batch.grossAmount, 0);
  const totalPlpkFee = periodBatches.reduce((sum, batch) => sum + batch.totalPlpkFee, 0);
  const statuses = buildStatuses(batches);
  const regions = buildRegions(batches, activePeriod);
  return {
    activePeriod,
    kpi: {
      munfiqActive: munfiq.filter((item) => item.status !== 'inactive').length,
      munfiqTotal: munfiq.length,
      batchRunning: periodBatches.filter((batch) => unfinishedStatuses.includes(batch.status as typeof unfinishedStatuses[number]) || batch.status === 'collection-completed').length,
      batchTotal: periodBatches.length,
      waitingKordes: periodBatches.filter((batch) => batch.status === 'waiting-kordes-verification').length,
      netAmount: grossAmount - totalPlpkFee,
      grossAmount,
    },
    trend: buildTrend(batches),
    statuses,
    statusTotal: statuses.reduce((sum, item) => sum + item.count, 0),
    regions,
    flow: buildFlow(batches, recaps, activePeriod),
    attention: buildAttention(batches, regions),
  };
}
