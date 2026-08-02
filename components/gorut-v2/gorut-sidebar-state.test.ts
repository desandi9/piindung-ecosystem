import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import { resolveSidebarCollapsed } from './gorut-sidebar-state.ts';

test('saved sidebar preference wins over the viewport default', () => {
  assert.equal(resolveSidebarCollapsed('true', false), true);
  assert.equal(resolveSidebarCollapsed('false', true), false);
});

test('first visit defaults to collapsed only on tablet-sized desktop shell', () => {
  assert.equal(resolveSidebarCollapsed(null, true), true);
  assert.equal(resolveSidebarCollapsed(null, false), false);
  assert.equal(resolveSidebarCollapsed('invalid', true), true);
});
