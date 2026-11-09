import assert from 'node:assert/strict';
import test from 'node:test';
import { munfiqHomePresentationData } from './munfiq-home-presentation-data';
import { recordedOwnAmount } from './munfiq-presentation';

test('presentation data is restricted to the local Munfiq fixture', () => {
  assert.equal(munfiqHomePresentationData('production', 'UAT-M001'), null);
  assert.equal(munfiqHomePresentationData('development', 'MUNFIQ-REAL'), null);
  assert.equal(munfiqHomePresentationData('development', 'UAT-M001')?.marker, 'PRESENTATION_DATA/DEMO_FIXTURE');
});

test('presentation totals only include seven PLPK-recorded contributions', () => {
  const data = munfiqHomePresentationData('development', 'UAT-M001');
  assert.ok(data);
  const amounts = data.collections.collections.map(recordedOwnAmount).filter((amount): amount is string => amount !== null);
  assert.equal(amounts.length, 7);
  assert.equal(data.collections.summary.totalAmount, '185500.00');
  assert.equal(recordedOwnAmount(data.collections.collections[0]), null);
});
