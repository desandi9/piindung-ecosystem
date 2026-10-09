import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import { f009Readiness, isF009Confirmed } from './f009-eligibility.ts';
import type { CollectionBatch, CollectionStatus } from './types';

function batch(change: Partial<CollectionBatch> & { status: CollectionStatus }): CollectionBatch {
  return {
    id: 'batch-test',
    period: '2026-07',
    plpkId: 'PLPK-01',
    plpkName: 'Dede Rahmat',
    village: 'Sukamentri',
    kecamatan: 'Garut Kota',
    kordesName: 'Kordes Sukamentri',
    entries: [],
    activeCanCount: 0,
    visitedCount: 0,
    pendingCount: 0,
    collectedCanCount: 0,
    uncollectedCanCount: 0,
    grossAmount: 0,
    totalCollected: 0,
    eligibleMunfiqCount: 0,
    totalPlpkFee: 0,
    netAmount: 0,
    formCode: 'F.009',
    documentNumber: 'F009/GORUT/PLPK-01/VIII/2026/001',
    documentStatus: 'Draft',
    createdAt: '2026-07-01',
    ...change,
  };
}

test('collecting tidak menghasilkan F.009 siap preview, meskipun punya confirmedByPlpkAt', () => {
  const item = batch({ status: 'collecting', confirmedByPlpkAt: '2026-07-10' });
  assert.equal(isF009Confirmed(item), false);
  assert.equal(f009Readiness(item), 'waiting');
});

test('collection-completed tidak menghasilkan F.009 siap preview, meskipun punya confirmedByPlpkAt', () => {
  const item = batch({ status: 'collection-completed', confirmedByPlpkAt: '2026-07-10' });
  assert.equal(isF009Confirmed(item), false);
  assert.equal(f009Readiness(item), 'waiting');
});

test('waiting-kordes-verification dengan bukti kirim menghasilkan F.009 siap preview', () => {
  const item = batch({ status: 'waiting-kordes-verification', submittedToKordesAt: '2026-07-10' });
  assert.equal(isF009Confirmed(item), true);
  assert.equal(f009Readiness(item), 'ready');
});

test('needs-correction tetap dapat melihat F.009', () => {
  const item = batch({ status: 'needs-correction', confirmedByPlpkAt: '2026-06-18', submittedToKordesAt: '2026-06-19', returnedForCorrectionAt: '2026-06-20' });
  assert.equal(isF009Confirmed(item), true);
  assert.equal(f009Readiness(item), 'ready');
});

test('verified-by-kordes menghasilkan F.009 siap preview', () => {
  const item = batch({ status: 'verified-by-kordes', confirmedByPlpkAt: '2026-07-04', submittedToKordesAt: '2026-07-04', verifiedByKordesAt: '2026-07-10' });
  assert.equal(isF009Confirmed(item), true);
  assert.equal(f009Readiness(item), 'ready');
});

test('status pascakonfirmasi tanpa timestamp tidak dianggap konfirmasi', () => {
  const item = batch({ status: 'verified-by-kordes' });
  assert.equal(isF009Confirmed(item), false);
  assert.equal(f009Readiness(item), 'unavailable');
});
