import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import { buildF009DocumentRequest, buildF010DocumentRequest, buildF015DocumentRequest, numberToIndonesianWords } from './document-data.ts';
import type { CollectionBatch, CollectionEntry, KordesVillageRecap } from './types';

const entries: CollectionEntry[] = [
  {
    id: 'entry-1', munfiqId: 'munfiq-1', munfiqName: 'Aisyah', memberId: 'MQ-001', canCode: 'KLG-001', phone: '081234567890', address: 'Kp. Sukamaju', rt: '01', rw: '02', isActive: true, canCount: 1,
    amount: 12_500, visitStatus: 'collected', collectedAt: '2026-07-10', eligibleForPlpkFee: true, plpkFee: 2_500,
  },
  {
    id: 'entry-2', munfiqId: 'munfiq-2', munfiqName: 'Rahmat', memberId: 'MQ-002', canCode: 'KLG-002', phone: '081234567891', address: 'Kp. Sukamaju', rt: '03', rw: '04', isActive: true, canCount: 1,
    amount: 0, visitStatus: 'not-around', collectedAt: '2026-07-10', eligibleForPlpkFee: false, plpkFee: 0,
  },
];

function batch(change: Partial<CollectionBatch> = {}): CollectionBatch {
  return {
    id: 'batch-1', period: '2026-07', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', village: 'Mekarjaya', kecamatan: 'Cikajang', kordesName: 'Cecep Suhendar', entries,
    activeCanCount: 2, visitedCount: 2, pendingCount: 0, collectedCanCount: 1, uncollectedCanCount: 1, grossAmount: 12_500, totalCollected: 12_500, eligibleMunfiqCount: 1, totalPlpkFee: 2_500, netAmount: 10_000,
    formCode: 'F.009', documentNumber: 'F.009/MKR/VII/2026/001', documentStatus: 'Siap', status: 'verified-by-kordes', confirmedByPlpkAt: '2026-07-10', lockedAt: '2026-07-10', verifiedByKordesAt: '2026-07-11', createdAt: '2026-07-01',
    ...change,
  };
}

const recap: KordesVillageRecap = {
  id: 'recap-2026-07-cikajang-mekarjaya', period: '2026-07', kecamatan: 'Cikajang', village: 'Mekarjaya', kordesName: 'Cecep Suhendar', upzisOfficerName: 'Ahmad Fauzi',
  f015Number: 'F.015/MKR/VII/2026/001', handoverDate: '2026-08-01', f015Status: 'f015-ready',
  plpkRows: [{
    id: 'verification-1', batchId: 'batch-1', f009DocumentNumber: 'F.009/MKR/VII/2026/001', plpkId: 'PLPK-01', plpkName: 'Dede Rahmat', period: '2026-07', kecamatan: 'Cikajang', village: 'Mekarjaya', kordesName: 'Cecep Suhendar', grossAmount: 12_500, totalPlpkFee: 2_500, netAmount: 10_000, status: 'verified-by-kordes', f015Status: 'f015-ready', verifiedAt: '2026-07-11',
  }],
};

test('F.009 data is derived from one PLPK batch and preserves every Munfiq row', () => {
  const request = buildF009DocumentRequest(batch());
  assert.equal(request.documentType, 'f009');
  assert.equal(request.filename, 'F.009-Mekarjaya-Dede-Rahmat-Juli-2026.pdf');
  assert.deepEqual(request.data.rows, [
    { index: '1', munfiqName: 'Aisyah', canCode: 'KLG-001', rt: '01', rw: '02', phone: '081234567890', amount: '12.500', status: 'Terjemput' },
    { index: '2', munfiqName: 'Rahmat', canCode: 'KLG-002', rt: '03', rw: '04', phone: '081234567891', amount: '0', status: 'Tidak Terjemput' },
  ]);
  assert.equal(request.data.verificationStatus, 'Terverifikasi');
  assert.equal(request.data.documentNumber, 'F.009/MKR/VII/2026/001');
});

test('F.009 prefers the assigned document number when available', () => {
  const source = batch({ f009DocumentNumber: 'F.009/RESMI/VII/2026/001' });
  const request = buildF009DocumentRequest(source);

  assert.equal(request.data.documentNumber, 'F.009/RESMI/VII/2026/001');
});

test('F.010 data derives PLPK rows and totals from the same village batches', () => {
  const request = buildF010DocumentRequest(recap, [batch()]);
  assert.equal(request.documentType, 'f010');
  assert.equal(request.data.documentNumber, 'F.010/MEKARJAYA/VII/2026');
  assert.deepEqual(request.data.rows[0], {
    index: '1', plpkName: 'Dede Rahmat', active: '2', collected: '1', percentage: '50%', average: '12.500', gross: '12.500', fee: '2.500', net: '10.000', verifiedAt: '11 Jul 2026',
  });
  assert.equal(request.data.totalNet, '10.000');
  assert.equal(request.data.totalPercentage, '50%');
});

test('F.015 remains narrative and reports the verified village totals in words', () => {
  const request = buildF015DocumentRequest(recap, [batch()]);
  assert.equal(request.documentType, 'f015');
  assert.equal(request.data.documentNumber, 'F.015/MKR/VII/2026/001');
  assert.equal(request.data.totalNet, 'Rp10.000');
  assert.equal(request.data.totalWords, 'Sepuluh Ribu Rupiah');
  assert.equal(request.data.totalPlpk, '1');
  assert.equal(request.data.verificationStatus, 'Data penerimaan terverifikasi');
});

test('Indonesian amount words handle zero, teens, thousands, and millions', () => {
  assert.equal(numberToIndonesianWords(0), 'Nol Rupiah');
  assert.equal(numberToIndonesianWords(11), 'Sebelas Rupiah');
  assert.equal(numberToIndonesianWords(1_250), 'Seribu Dua Ratus Lima Puluh Rupiah');
  assert.equal(numberToIndonesianWords(2_500_000), 'Dua Juta Lima Ratus Ribu Rupiah');
});
