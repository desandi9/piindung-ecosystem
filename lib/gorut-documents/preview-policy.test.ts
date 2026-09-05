import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import * as previewPolicy from './preview-policy.ts';

const { previewFailureMode } = previewPolicy;

test('development fallback is used only when the endpoint explicitly permits it', () => {
  assert.equal(previewFailureMode({ fallbackAllowed: true }, true), 'fallback');
  assert.equal(previewFailureMode({ fallbackAllowed: false }, true), 'error');
});

test('missing HTML renderer always keeps the canonical error visible', () => {
  assert.equal(previewFailureMode({ fallbackAllowed: true }, false), 'error');
});

test('disabled canonical PDF uses the frontend preview without requesting the endpoint', () => {
  const policy = previewPolicy as typeof previewPolicy & {
    canonicalPreviewMode?: (enabled: string | undefined, hasFallback: boolean) => string;
  };

  assert.equal(policy.canonicalPreviewMode?.('false', true), 'fallback');
  assert.equal(policy.canonicalPreviewMode?.(undefined, true), 'fallback');
  assert.equal(policy.canonicalPreviewMode?.('true', true), 'canonical');
  assert.equal(policy.canonicalPreviewMode?.('false', false), 'unavailable');
});
