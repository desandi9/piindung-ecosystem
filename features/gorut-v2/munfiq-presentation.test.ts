import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node strip-types requires an explicit extension.
import { recordedOwnAmount, collectionFact, type MunfiqCollection } from './munfiq-presentation.ts';

const entry: MunfiqCollection = {
  collectionCode: 'OWN-COLLECTION', periodStart: '2026-09-01', amount: '12345.67', currency: 'IDR',
  status: 'Infak sudah tercatat', statusAt: '2026-09-22T09:00:00Z',
  historicalPlpk: { code: 'PLPK', name: 'Petugas pengujian' }, location: { ranting: 'Ranting pengujian', kecamatan: 'Kecamatan pengujian' },
  timeline: [{ key: 'recorded', label: 'Infak sudah tercatat', at: '2026-09-22T09:00:00Z' }],
};

test('pending never renders an amount, including a nonzero stale amount', () => {
  assert.equal(recordedOwnAmount({ ...entry, timeline: [{ key: 'pending', label: 'Belum dijemput', at: '2026-09-01T00:00:00Z' }] }), null);
  assert.equal(recordedOwnAmount({ ...entry, timeline: [...entry.timeline, { key: 'pending', label: 'Belum dijemput', at: '2026-09-01T00:00:00Z' }] }), null);
});
test('a label or later milestone is not proof of PLPK recording', () => {
  assert.equal(recordedOwnAmount({ ...entry, timeline: [] }), null);
  assert.equal(recordedOwnAmount({ ...entry, timeline: [{ key: 'complete', label: 'Selesai', at: '2026-09-24T09:00:00Z' }] }), null);
  assert.equal(recordedOwnAmount({ ...entry, timeline: [{ ...entry.timeline[0], at: 'invalid' }] }), null);
});
test('zero, negative and invalid values never produce a Rupiah amount', () => {
  for (const amount of ['0', '0.00', '000.00', '-50', 'NaN', '1e6', '12.345']) assert.equal(recordedOwnAmount({ ...entry, amount }), null);
});
test('recorded personal amount preserves precision without using batch finance', () => {
  const withInternals = { ...entry, grossAmount: '999999', netAmount: '5000', totalPlpkFee: '2500' };
  assert.equal(recordedOwnAmount(withInternals), 'Rp12.345,67');
  assert.equal(recordedOwnAmount({ ...entry, amount: '9007199254740993.01' }), 'Rp9.007.199.254.740.993,01');
  assert.equal(collectionFact(entry, 'verified'), undefined);
  assert.equal(collectionFact(entry, 'complete'), undefined);
});
