import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import { buildDashboardControl } from './dashboard-control.ts';
import type { CollectionBatch, GorutMunfiq } from './types';

function batch(id: string, period: string, status: CollectionBatch['status']): CollectionBatch {
  return {
    id,
    period,
    plpkId: `PLPK-${id}`,
    plpkName: `PLPK ${id}`,
    village: 'Sukamentri',
    kecamatan: 'Garut Kota',
    kordesName: 'Kordes Sukamentri',
    entries: [],
    activeCanCount: 0,
    visitedCount: 0,
    pendingCount: 0,
    collectedCanCount: 0,
    uncollectedCanCount: 0,
    grossAmount: 20_000,
    totalCollected: 20_000,
    eligibleMunfiqCount: 1,
    totalPlpkFee: 2_500,
    netAmount: 17_500,
    formCode: 'F.009',
    documentNumber: `F009-${id}`,
    documentStatus: status === 'draft' ? 'Draft' : 'Siap',
    status,
    kordesNotes: status === 'needs-correction' ? 'Nominal perlu diperiksa.' : undefined,
    submittedToKordesAt: status === 'waiting-kordes-verification' ? '2026-07-11T08:00:00.000Z' : undefined,
    returnedForCorrectionAt: status === 'needs-correction' ? '2026-07-12T08:00:00.000Z' : undefined,
    createdAt: `${period}-01`,
  };
}

const batches = [
  batch('old', '2026-06', 'verified-by-kordes'),
  batch('correction', '2026-07', 'needs-correction'),
  batch('waiting', '2026-07', 'waiting-kordes-verification'),
  batch('running', '2026-07', 'collecting'),
];

const munfiq = [{
  id: 'munfiq-01', memberId: 'GOR-MQ-01', name: 'Siti', phone: '0812', address: 'Sukamentri',
  kecamatan: 'Garut Kota', village: 'Sukamentri', upzis: 'UPZIS Garut Kota', plpkId: 'PLPK-running',
  plpkName: 'PLPK running', status: 'active', joinedAt: '2026-01-01', totalCollected: 20_000, transactionCount: 2,
}] satisfies GorutMunfiq[];

test('dashboard defaults to the latest available period', () => {
  const control = buildDashboardControl(batches, munfiq, []);
  assert.equal(control.activePeriod, '2026-07');
});

test('critical correction work is ordered before waiting and informational work', () => {
  const control = buildDashboardControl(batches, munfiq, []);
  const ranks = { critical: 0, warning: 1, info: 2 } as const;
  const observed = control.attention.map((item) => ranks[item.priority]);
  assert.deepEqual(observed, [...observed].sort((a, b) => a - b));
});

test('status counts describe the reported status total', () => {
  const control = buildDashboardControl(batches, munfiq, []);
  assert.equal(control.statuses.reduce((sum, item) => sum + item.count, 0), control.statusTotal);
});
