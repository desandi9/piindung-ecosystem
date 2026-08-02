import assert from 'node:assert/strict';
import test from 'node:test';

// Node's built-in runner needs the extension when executing TypeScript directly.
// @ts-expect-error The application tsconfig intentionally disallows TS extensions.
import * as kordesMobile from './kordes-mobile.ts';
import type { CollectionBatch, CollectionEntry, CollectionStatus, GorutMunfiq } from './types';

const { applyKordesDecision, buildKordesJournal, buildKordesMunfiqDirectory, buildKordesQueue, formatKordesSubmissionAge, isKordesF015Ready, summarizeKordesPeriod, validateKordesAction } = kordesMobile;

function entry(id: string, status: CollectionEntry['visitStatus'], amount: number): CollectionEntry {
  return {
    id,
    munfiqId: `munfiq-${id}`,
    munfiqName: `Munfiq ${id}`,
    memberId: `GOR-MQ-${id}`,
    canCode: `KLG-${id}`,
    phone: `08123456${id}`,
    address: 'Kp. Sindangpalay',
    rt: '01',
    rw: '02',
    isActive: true,
    canCount: 1,
    amount,
    visitStatus: status,
    collectedAt: status === 'pending' ? '' : '2026-07-10',
    eligibleForPlpkFee: amount > 7000,
    plpkFee: amount > 7000 ? 2500 : 0,
  };
}

function batch({
  id,
  plpkId,
  period = '2026-07',
  village = 'Sindangpalay',
  status = 'waiting-kordes-verification',
}: {
  id: string;
  plpkId: string;
  period?: string;
  village?: string;
  status?: CollectionStatus;
}): CollectionBatch {
  const entries = [entry(`${id}-01`, 'collected', 12000), entry(`${id}-02`, 'not-around', 0)];
  return {
    id,
    period,
    plpkId,
    plpkName: `PLPK ${plpkId}`,
    village,
    kecamatan: 'Karangpawitan',
    kordesName: 'Cecep Suhendar',
    entries,
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
    documentNumber: `F009-${id}`,
    documentStatus: 'Siap',
    status,
    confirmedByPlpkAt: '2026-07-10',
    lockedAt: '2026-07-10',
    f009DocumentNumber: `F009-${id}`,
    submittedToKordesAt: '2026-07-10T08:30:00.000Z',
    createdAt: '2026-07-01',
  };
}

test('queue contains only submitted PLPK from the active Kordes village and period', () => {
  const waiting = batch({ id: 'waiting', plpkId: 'PLPK-03' });
  const verified = batch({ id: 'verified', plpkId: 'PLPK-07', status: 'verified-by-kordes' });
  const collecting = batch({ id: 'collecting', plpkId: 'PLPK-08', status: 'collecting' });
  const outside = batch({ id: 'outside', plpkId: 'PLPK-09', village: 'Godog' });
  const old = batch({ id: 'old', plpkId: 'PLPK-10', period: '2026-06' });

  const queue = buildKordesQueue([waiting, verified, collecting, outside, old], {
    village: 'Sindangpalay', kecamatan: 'Karangpawitan', period: '2026-07',
  });

  assert.deepEqual(queue.map((item) => item.batchId), ['waiting', 'verified']);
  assert.equal(queue[0].submittedAt, '2026-07-10T08:30:00.000Z');
});

test('submission age stays compact for queue cards and handles invalid dates', () => {
  const now = new Date('2026-07-10T10:00:00.000Z');
  assert.equal(formatKordesSubmissionAge?.('2026-07-10T09:55:00.000Z', now), '5 menit lalu');
  assert.equal(formatKordesSubmissionAge?.('2026-07-10T07:00:00.000Z', now), '3 jam lalu');
  assert.equal(formatKordesSubmissionAge?.('2026-07-08T10:00:00.000Z', now), '2 hari lalu');
  assert.equal(formatKordesSubmissionAge?.('bukan-tanggal', now), 'Waktu tidak tersedia');
});

test('Munfiq directory trusts the master village scope instead of mixed batch entries', () => {
  const source = batch({ id: 'waiting', plpkId: 'PLPK-03' });
  source.entries[0] = { ...source.entries[0], munfiqId: 'outside', munfiqName: 'Luar Desa' };
  const master = [
    { id: 'inside', memberId: 'GOR-MQ-001', name: 'Warga Sindangpalay', phone: '0811', address: 'Sindangpalay', kecamatan: 'Karangpawitan', village: 'Sindangpalay', upzis: 'UPZIS Karangpawitan', plpkId: 'PLPK-03', plpkName: 'PLPK Yana', status: 'active', joinedAt: '2025-01-01', lastDepositAmount: 9000, totalCollected: 9000, transactionCount: 1 },
    { id: 'outside', memberId: 'GOR-MQ-002', name: 'Warga Godog', phone: '0822', address: 'Godog', kecamatan: 'Karangpawitan', village: 'Godog', upzis: 'UPZIS Karangpawitan', plpkId: 'PLPK-03', plpkName: 'PLPK Yana', status: 'active', joinedAt: '2025-01-01', totalCollected: 0, transactionCount: 0 },
  ] satisfies GorutMunfiq[];

  const directory = buildKordesMunfiqDirectory([source], master, { village: 'Sindangpalay', kecamatan: 'Karangpawitan' });

  assert.deepEqual(directory.map((item) => item.name), ['Warga Sindangpalay']);
  assert.equal(directory[0].lastAmount, 9000);
});

test('verification requires every answer, matching money, received cash, and notes for damaged money', () => {
  assert.equal(validateKordesAction({}, 'verify'), 'Semua pertanyaan verifikasi wajib dijawab.');
  assert.equal(validateKordesAction({ moneyMatches: false, hasDamagedMoney: false, cashReceived: true, notes: '' }, 'verify'), 'Jumlah uang harus sesuai untuk menyelesaikan verifikasi.');
  assert.equal(validateKordesAction({ moneyMatches: true, hasDamagedMoney: false, cashReceived: false, notes: '' }, 'verify'), 'Uang harus sudah diterima sebelum verifikasi diselesaikan.');
  assert.equal(validateKordesAction({ moneyMatches: true, hasDamagedMoney: true, cashReceived: true, notes: '' }, 'verify'), 'Catatan wajib diisi untuk uang rusak.');
  assert.equal(validateKordesAction({ moneyMatches: true, hasDamagedMoney: true, cashReceived: true, notes: 'Satu lembar rusak.' }, 'verify'), null);
});

test('correction requires notes and marked Munfiq entries', () => {
  assert.equal(validateKordesAction({ notes: '', correctionEntryIds: [] }, 'correction'), 'Semua pertanyaan verifikasi wajib dijawab.');
  assert.equal(validateKordesAction({ moneyMatches: false, hasDamagedMoney: false, cashReceived: true, notes: '', correctionEntryIds: [] }, 'correction'), 'Catatan koreksi wajib diisi.');
  assert.equal(validateKordesAction({ moneyMatches: false, hasDamagedMoney: false, cashReceived: true, notes: 'Nominal berbeda.', correctionEntryIds: [] }, 'correction'), 'Pilih minimal satu Munfiq yang perlu dikoreksi.');
  assert.equal(validateKordesAction({ moneyMatches: false, hasDamagedMoney: false, cashReceived: true, notes: 'Nominal berbeda.', correctionEntryIds: ['waiting-01'] }, 'correction'), null);
});

test('successful verification updates and locks the shared collection batch once', () => {
  const source = batch({ id: 'waiting', plpkId: 'PLPK-03' });
  const result = applyKordesDecision(source, {
    moneyMatches: true,
    hasDamagedMoney: false,
    cashReceived: true,
    notes: 'Data dan uang sesuai.',
  }, 'verify', 'Cecep Suhendar', '2026-07-11T09:00:00.000Z');

  assert.equal(result.error, undefined);
  assert.equal(result.batch?.status, 'verified-by-kordes');
  assert.equal(result.batch?.verifiedByKordesAt, '2026-07-11T09:00:00.000Z');
  assert.equal(result.batch?.kordesMoneyMatches, true);

  const repeated = applyKordesDecision(result.batch!, {
    moneyMatches: true, hasDamagedMoney: false, cashReceived: true,
  }, 'verify', 'Cecep Suhendar', '2026-07-12T09:00:00.000Z');
  assert.equal(repeated.error, 'Data ini sudah terverifikasi dan tidak dapat diverifikasi ulang.');

  const stillBeingFixed = applyKordesDecision({ ...source, status: 'needs-correction' }, {
    moneyMatches: true, hasDamagedMoney: false, cashReceived: true,
  }, 'verify', 'Cecep Suhendar');
  assert.equal(stillBeingFixed.error, 'Data belum dikirim PLPK atau masih dalam proses koreksi.');

  for (const status of ['draft', 'scheduled', 'collecting', 'collection-completed'] as const) {
    const unsubmitted = applyKordesDecision({ ...source, status }, {
      moneyMatches: true, hasDamagedMoney: false, cashReceived: true,
    }, 'verify', 'Cecep Suhendar');
    assert.equal(unsubmitted.error, 'Data belum dikirim PLPK atau masih dalam proses koreksi.');
  }
});

test('returning data stores correction status and only marked entries', () => {
  const source = batch({ id: 'waiting', plpkId: 'PLPK-03' });
  const result = applyKordesDecision(source, {
    moneyMatches: false,
    hasDamagedMoney: false,
    cashReceived: true,
    notes: 'Nominal Munfiq pertama berbeda.',
    correctionEntryIds: ['waiting-01'],
  }, 'correction', 'Cecep Suhendar', '2026-07-11T09:00:00.000Z');

  assert.equal(result.error, undefined);
  assert.equal(result.batch?.status, 'needs-correction');
  assert.deepEqual(result.batch?.correctionEntryIds, ['waiting-01']);
  assert.equal(result.batch?.kordesNotes, 'Nominal Munfiq pertama berbeda.');
  assert.equal(result.batch?.verifiedByKordesAt, undefined);
  assert.equal(result.batch?.returnedForCorrectionAt, '2026-07-11T09:00:00.000Z');
});

test('period summary, journal, and F.015 readiness are derived from scoped batches', () => {
  const waiting = batch({ id: 'waiting', plpkId: 'PLPK-03' });
  const verified = batch({ id: 'verified', plpkId: 'PLPK-07', status: 'verified-by-kordes' });
  const correction = batch({ id: 'correction', plpkId: 'PLPK-08', period: '2026-06', status: 'needs-correction' });
  const batches = [waiting, verified, correction];

  const summary = summarizeKordesPeriod(batches, { village: 'Sindangpalay', kecamatan: 'Karangpawitan', period: '2026-07' });
  assert.deepEqual(summary, {
    activePlpk: 2,
    submittedPlpk: 2,
    waiting: 1,
    verified: 1,
    corrections: 0,
    grossAmount: 24000,
    progress: 50,
  });
  assert.equal(isKordesF015Ready([waiting, verified]), false);
  assert.equal(isKordesF015Ready([verified, { ...waiting, status: 'verified-by-kordes' }]), true);

  const journal = buildKordesJournal(batches, { village: 'Sindangpalay', kecamatan: 'Karangpawitan' });
  assert.deepEqual(journal.map((item) => item.period), ['2026-07', '2026-06']);
  assert.equal(journal[0].grossAmount, 24000);
  assert.equal(journal[0].totalPlpkFee, 5000);
  assert.equal(journal[0].netAmount, 19000);
  assert.equal(journal[0].recapStatus, 'menunggu-verifikasi');
  assert.equal(journal[1].corrections, 1);
});

test('document readiness distinguishes incomplete, verification, and fully verified periods', () => {
  const helper = (kordesMobile as typeof kordesMobile & {
    getKordesDocumentReadiness?: (batches: CollectionBatch[]) => {
      f009Count: number;
      f010Status: string;
      f010PreviewAvailable: boolean;
      f015Status: string;
      f015PreviewAvailable: boolean;
    };
  }).getKordesDocumentReadiness;
  assert.equal(typeof helper, 'function');

  const collecting = batch({ id: 'collecting', plpkId: 'PLPK-01', status: 'collecting' });
  const waiting = batch({ id: 'waiting', plpkId: 'PLPK-02' });
  const verified = batch({ id: 'verified', plpkId: 'PLPK-03', status: 'verified-by-kordes' });

  assert.deepEqual(helper?.([collecting, waiting]), {
    f009Count: 1,
    f010Status: 'Belum Lengkap',
    f010PreviewAvailable: false,
    f015Status: 'Belum Siap',
    f015PreviewAvailable: false,
  });
  assert.deepEqual(helper?.([waiting, verified]), {
    f009Count: 2,
    f010Status: 'Menunggu Verifikasi',
    f010PreviewAvailable: true,
    f015Status: 'Belum Siap',
    f015PreviewAvailable: false,
  });
  assert.deepEqual(helper?.([verified, { ...waiting, status: 'verified-by-kordes' }]), {
    f009Count: 2,
    f010Status: 'Siap Dibuat',
    f010PreviewAvailable: true,
    f015Status: 'Siap',
    f015PreviewAvailable: true,
  });
});

test('journal exposes total Munfiq and frontend document statuses', () => {
  const waiting = batch({ id: 'waiting', plpkId: 'PLPK-03' });
  const verified = batch({ id: 'verified', plpkId: 'PLPK-07', status: 'verified-by-kordes' });

  const [item] = buildKordesJournal([waiting, verified], { village: 'Sindangpalay', kecamatan: 'Karangpawitan' });

  assert.equal((item as typeof item & { munfiqCount?: number }).munfiqCount, 4);
  assert.equal((item as typeof item & { f010Status?: string }).f010Status, 'Menunggu Verifikasi');
  assert.equal(item.f015Ready, false);
});
