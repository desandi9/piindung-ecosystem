import assert from 'node:assert/strict';
import test from 'node:test';

// Node's built-in test runner needs the extension when executing TypeScript directly.
// @ts-expect-error The application tsconfig intentionally disallows TS extensions.
import { buildPlpkJournal, buildPlpkMunfiqDirectory, filterPlpkMunfiqDirectory, summarizePlpkPeriod } from './plpk-mobile-content.ts';

const entry = (id: string, name: string, visitStatus: 'pending' | 'collected' | 'not-around', amount: number) => ({
  id,
  munfiqId: `munfiq-${id}`,
  munfiqName: name,
  memberId: `GOR-MQ-${id}`,
  canCode: `KLG-${id}`,
  phone: `0812345${id}`,
  address: `Kp. Mekar ${id}`,
  rt: '01',
  rw: '02',
  isActive: true,
  canCount: 1,
  amount,
  visitStatus,
  collectedAt: visitStatus === 'pending' ? '' : '2026-07-10',
  eligibleForPlpkFee: amount > 7000,
  plpkFee: amount > 7000 ? 2500 : 0,
});

const batch = ({
  id,
  period,
  village = 'Mekarjaya',
  plpkId = 'PLPK-01',
  status = 'collecting',
  entries,
}: {
  id: string;
  period: string;
  village?: string;
  plpkId?: string;
  status?: 'collecting' | 'waiting-kordes-verification' | 'verified-by-kordes';
  entries: ReturnType<typeof entry>[];
}) => {
  const collected = entries.filter((item) => item.visitStatus === 'collected');
  const pending = entries.filter((item) => item.visitStatus === 'pending');
  const grossAmount = collected.reduce((sum, item) => sum + item.amount, 0);
  const totalPlpkFee = collected.reduce((sum, item) => sum + item.plpkFee, 0);
  return {
    id,
    period,
    plpkId,
    plpkName: 'Dede Rahmat',
    village,
    kecamatan: 'Cikajang',
    kordesName: `Kordes ${village}`,
    entries,
    activeCanCount: entries.length,
    visitedCount: entries.length - pending.length,
    pendingCount: pending.length,
    collectedCanCount: collected.length,
    uncollectedCanCount: entries.length - pending.length - collected.length,
    grossAmount,
    totalCollected: grossAmount,
    eligibleMunfiqCount: collected.filter((item) => item.eligibleForPlpkFee).length,
    totalPlpkFee,
    netAmount: grossAmount - totalPlpkFee,
    formCode: 'F.009' as const,
    documentNumber: `F009/${id}`,
    documentStatus: 'Draft' as const,
    status,
    createdAt: `${period}-10`,
  };
};

test('period summary exposes leader metrics from the active batch', () => {
  const active = batch({
    id: 'active',
    period: '2026-07',
    entries: [entry('001', 'Ahmad', 'collected', 12000), entry('002', 'Siti', 'not-around', 0), entry('003', 'Dadan', 'pending', 0)],
  });

  assert.deepEqual(summarizePlpkPeriod(active), {
    grossAmount: 12000,
    activeCans: 3,
    collectedCans: 1,
    pendingCans: 1,
    completedMunfiq: 2,
    activeMunfiq: 3,
  });
});

test('journal is newest-first and preserves the financial breakdown', () => {
  const june = batch({ id: 'june', period: '2026-06', status: 'verified-by-kordes', entries: [entry('001', 'Ahmad', 'collected', 12000)] });
  const july = batch({ id: 'july', period: '2026-07', status: 'waiting-kordes-verification', entries: [entry('002', 'Siti', 'collected', 7000), entry('003', 'Dadan', 'not-around', 0)] });

  const journal = buildPlpkJournal([june, july]);

  assert.equal(journal[0].period, '2026-07');
  assert.deepEqual(journal[0], {
    batchId: 'july',
    period: '2026-07',
    status: 'waiting-kordes-verification',
    activeMunfiq: 2,
    collected: 1,
    uncollected: 1,
    grossAmount: 7000,
    plpkFee: 0,
    netAmount: 7000,
  });
});

test('Munfiq directory stays inside the PLPK village and keeps the latest visit', () => {
  const older = batch({ id: 'older', period: '2026-06', village: 'Sukamentri', entries: [entry('005', 'Rina Marlina', 'collected', 9000)] });
  const latest = batch({ id: 'latest', period: '2026-07', village: 'Sukamentri', entries: [entry('005', 'Rina Marlina', 'not-around', 0), entry('025', 'Eneng Setiawati', 'pending', 0), entry('001', 'Luar Desa dalam Batch', 'pending', 0)] });
  const outsideVillage = batch({ id: 'outside', period: '2026-07', village: 'Cibodas', entries: [entry('003', 'Luar Wilayah', 'collected', 20000)] });
  const otherPlpk = batch({ id: 'other', period: '2026-07', plpkId: 'PLPK-02', entries: [entry('004', 'PLPK Lain', 'collected', 20000)] });

  const directory = buildPlpkMunfiqDirectory([older, latest, outsideVillage, otherPlpk], 'PLPK-01', 'Sukamentri');

  assert.equal(directory.length, 2);
  assert.equal(directory.find((item) => item.id === 'munfiq-005')?.lastVisitStatus, 'not-around');
  assert.equal(directory.find((item) => item.id === 'munfiq-005')?.lastAmount, 0);
  assert.equal(directory.every((item) => item.village === 'Sukamentri'), true);
  assert.equal(directory.some((item) => item.id === 'munfiq-001'), false);
  assert.deepEqual(filterPlpkMunfiqDirectory(directory, 'klg-025', 'pending').map((item) => item.name), ['Eneng Setiawati']);
});
