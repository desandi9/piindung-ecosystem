import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import { filterUpzisRecaps, summarizeUpzisVerification } from './upzis-view.ts';
import type { UpzisVillageRecap } from '@/features/gorut-v2/types';

const recaps: UpzisVillageRecap[] = [
  {
    id: 'upzis-001',
    period: '2026-07',
    village: 'Mekarjaya',
    kecamatan: 'Cikajang',
    kordesName: 'Cecep Suhendar',
    plpkBreakdown: [],
    plpkCount: 2,
    munfiqCount: 20,
    totalCollected: 125_000,
    totalPlpkFee: 25_000,
    status: 'incomplete',
  },
  {
    id: 'upzis-002',
    period: '2026-07',
    village: 'Padasuka',
    kecamatan: 'Cikajang',
    kordesName: 'Nunung Fatimah',
    plpkBreakdown: [],
    plpkCount: 1,
    munfiqCount: 10,
    totalCollected: 80_000,
    totalPlpkFee: 10_000,
    status: 'ready-to-recap',
  },
  {
    id: 'upzis-003',
    period: '2026-07',
    village: 'Regol',
    kecamatan: 'Garut Kota',
    kordesName: 'Encep Wahyudi',
    plpkBreakdown: [],
    plpkCount: 3,
    munfiqCount: 30,
    totalCollected: 210_000,
    totalPlpkFee: 30_000,
    status: 'recapped',
  },
  {
    id: 'upzis-004',
    period: '2026-06',
    village: 'Sukamentri',
    kecamatan: 'Garut Kota',
    kordesName: 'Encep Wahyudi',
    plpkBreakdown: [],
    plpkCount: 1,
    munfiqCount: 8,
    totalCollected: 50_000,
    totalPlpkFee: 5_000,
    status: 'ready-to-deposit',
  },
];

test('UPZIS summary counts executable statuses and subtracts PLPK fees without mutating recaps', () => {
  const snapshot = structuredClone(recaps);
  const summary = summarizeUpzisVerification(recaps, '2026-07');

  assert.deepEqual(summary, {
    incomplete: 1,
    readyToRecap: 1,
    recapped: 1,
    netAmount: 350_000,
    rowCount: 3,
  });
  assert.deepEqual(recaps, snapshot);
});

test('UPZIS filtering searches village, Kordes, and region while preserving the source order', () => {
  const byKordes = filterUpzisRecaps(recaps, {
    query: 'nunung', period: 'all', kecamatan: 'all', village: 'all', kordes: 'all', status: 'all',
  });
  assert.deepEqual(byKordes.map((recap) => recap.id), ['upzis-002']);

  const byRegionAndStatus = filterUpzisRecaps(recaps, {
    query: 'garut', period: '2026-07', kecamatan: 'all', village: 'all', kordes: 'all', status: 'recapped',
  });
  assert.deepEqual(byRegionAndStatus.map((recap) => recap.id), ['upzis-003']);
  assert.deepEqual(recaps.map((recap) => recap.id), ['upzis-001', 'upzis-002', 'upzis-003', 'upzis-004']);
});
