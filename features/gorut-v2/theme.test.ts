import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import { GORUT_THEME_OPTIONS, normalizeGorutTheme } from './theme.ts';

test('GoRUT exposes exactly light, dark, and system theme modes', () => {
  assert.deepEqual(GORUT_THEME_OPTIONS.map((option) => option.id), ['light', 'dark', 'system']);
});

test('unknown persisted theme values fall back to system', () => {
  assert.equal(normalizeGorutTheme('dark'), 'dark');
  assert.equal(normalizeGorutTheme('light'), 'light');
  assert.equal(normalizeGorutTheme('unexpected'), 'system');
  assert.equal(normalizeGorutTheme(undefined), 'system');
});
