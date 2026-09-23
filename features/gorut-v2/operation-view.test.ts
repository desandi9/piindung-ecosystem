import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import { countActiveFilters, formatResultSummary } from './operation-view.ts';

test('active filters ignore empty, all, and undefined values', () => {
  assert.equal(countActiveFilters(['', 'all', undefined, 'Garut Kota', 'waiting']), 2);
});

test('result summary uses Indonesian number formatting', () => {
  assert.equal(formatResultSummary(12, 1480, 'data'), 'Menampilkan 12 dari 1.480 data');
});
