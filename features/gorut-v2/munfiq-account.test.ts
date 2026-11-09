import assert from 'node:assert/strict';
import test from 'node:test';
import { munfiqAccountSummary, munfiqProfilePatch } from './munfiq-account';
import type { MunfiqCollection } from './munfiq-presentation';

const record: MunfiqCollection = { collectionCode: 'own', periodStart: '2026-10-01', amount: '1000.25', currency: 'IDR', status: 'Dicatat', statusAt: null, historicalPlpk: { code: 'P1', name: 'Petugas' }, location: { ranting: 'Desa', kecamatan: 'Kecamatan' }, timeline: [{ key: 'recorded', label: 'Dicatat', at: '2026-10-01T00:00:00Z' }] };

test('account total requires recorded evidence and excludes pending or malformed amounts', () => {
  assert.deepEqual(munfiqAccountSummary([
    record, { ...record, amount: '100.50' },
    { ...record, amount: '999999', timeline: [] },
    { ...record, timeline: [...record.timeline, { key: 'pending', label: 'Menunggu', at: '2026-10-01T00:00:00Z' }] },
    { ...record, amount: 'NaN' }, { ...record, amount: '-20' },
  ]), { recorded: 2, pending: 1, total: 'Rp1.100,75' });
});
test('account totals retain exact cents beyond the safe floating point range', () => {
  assert.equal(munfiqAccountSummary([{ ...record, amount: '9007199254740992.25' }, { ...record, amount: '0.05' }]).total, 'Rp9.007.199.254.740.992,30');
  assert.deepEqual(munfiqAccountSummary([]), { recorded: 0, pending: 0, total: 'Rp0' });
});
test('editing a profile sends only changed self-service fields, leaving empty email untouched', () => {
  const profile = { name: 'Aminah', phone: '081234567890', email: '', address: '' };
  assert.deepEqual(munfiqProfilePatch(profile, { ...profile, name: ' Aminah Baru ' }), { name: 'Aminah Baru' });
  assert.deepEqual(munfiqProfilePatch(profile, { ...profile, name: ' Aminah ' }), {});
  assert.deepEqual(munfiqProfilePatch({ ...profile, address: 'Alamat lama' }, profile), { address: '' });
  assert.deepEqual(munfiqProfilePatch(profile, { ...profile, role: 'admin_pc' } as typeof profile), {});
});
