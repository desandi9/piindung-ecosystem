import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import * as options from './pengambilan-options.ts';
import type { CollectionBatch, CollectionEntry } from './types';

const entry = (id: string, visitStatus: CollectionEntry['visitStatus'], amount: number, notes?: string): CollectionEntry => ({
  id,
  munfiqId: `munfiq-${id}`,
  munfiqName: `Munfiq ${id}`,
  memberId: `GOR-MQ-${id}`,
  canCode: `KLG-${id}`,
  phone: '08123456789',
  amount,
  visitStatus,
  collectedAt: '2026-07-10',
  eligibleForPlpkFee: visitStatus === 'collected' && amount > 7000,
  plpkFee: visitStatus === 'collected' && amount > 7000 ? 2500 : 0,
  notes,
});

const source = (status: CollectionBatch['status'] = 'collecting'): CollectionBatch => ({
  id: 'batch-frontend',
  period: '2026-07',
  plpkId: 'PLPK-01',
  plpkName: 'Dede Rahmat',
  village: 'Sukamentri',
  kecamatan: 'Garut Kota',
  kordesName: 'Kordes Sukamentri',
  entries: [entry('01', 'collected', 12000), entry('02', 'not-around', 0, 'Tidak di rumah')],
  activeCanCount: 2,
  visitedCount: 2,
  pendingCount: 0,
  collectedCanCount: 1,
  uncollectedCanCount: 1,
  grossAmount: 12000,
  totalCollected: 12000,
  eligibleMunfiqCount: 1,
  totalPlpkFee: 2500,
  netAmount: 9500,
  formCode: 'F.009',
  documentNumber: 'F.009/SKM/VII/2026/001',
  documentStatus: status === 'needs-correction' ? 'Siap' : 'Draft',
  status,
  correctionEntryIds: status === 'needs-correction' ? ['01'] : undefined,
  kordesNotes: status === 'needs-correction' ? 'Periksa nominal pertama.' : undefined,
  lockedAt: status === 'needs-correction' ? '2026-07-11' : undefined,
  createdAt: '2026-07-01',
});

test('net amount always subtracts the eligible PLPK fee from gross amount', () => {
  assert.equal(options.calculateNetAmount(100_000, 2_500), 97_500);
});

test('PLPK submission locks a complete period and clears correction state on resubmission', () => {
  const submit = (options as typeof options & {
    submitPlpkBatch?: (batch: CollectionBatch, submittedAt: string) => { batch?: CollectionBatch; error?: string };
  }).submitPlpkBatch;
  assert.equal(typeof submit, 'function');

  const first = submit?.(source(), '2026-07-12T08:00:00.000Z');
  assert.equal(first?.error, undefined);
  assert.equal(first?.batch?.status, 'waiting-kordes-verification');
  assert.equal(first?.batch?.lockedAt, '2026-07-12T08:00:00.000Z');
  assert.equal(first?.batch?.entries[1].amount, 0);

  const corrected = submit?.(source('needs-correction'), '2026-07-13T08:00:00.000Z');
  assert.equal(corrected?.batch?.status, 'waiting-kordes-verification');
  assert.equal(corrected?.batch?.correctionEntryIds, undefined);
  assert.equal(corrected?.batch?.kordesNotes, undefined);
});

test('PLPK submission rejects incomplete visits and keeps confirmed data read-only', () => {
  const submit = (options as typeof options & {
    submitPlpkBatch?: (batch: CollectionBatch, submittedAt: string) => { batch?: CollectionBatch; error?: string };
  }).submitPlpkBatch;
  assert.equal(typeof submit, 'function');

  const incomplete = source();
  incomplete.entries[1] = entry('02', 'not-around', 0);
  assert.equal(submit?.(incomplete, '2026-07-12T08:00:00.000Z').error, 'Lengkapi seluruh hasil kunjungan dan catatan sebelum konfirmasi.');

  const emptyCollected = source();
  emptyCollected.entries[0] = entry('01', 'collected', 0);
  assert.equal(submit?.(emptyCollected, '2026-07-12T08:00:00.000Z').error, 'Nominal Terjemput harus lebih dari Rp0.');

  const emptyPeriod = source();
  emptyPeriod.entries = [];
  assert.equal(submit?.(emptyPeriod, '2026-07-12T08:00:00.000Z').error, 'Periode penjemputan belum memiliki Munfiq.');

  const confirmed = source('waiting-kordes-verification');
  confirmed.lockedAt = '2026-07-12T08:00:00.000Z';
  assert.equal(submit?.(confirmed, '2026-07-13T08:00:00.000Z').error, 'Data penjemputan sudah dikunci.');
});
