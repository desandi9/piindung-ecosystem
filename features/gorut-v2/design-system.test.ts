import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const tokens = readFileSync(new URL('../../app/gorut-v2/styles/tokens.css', import.meta.url), 'utf8');
const motion = readFileSync(new URL('../../app/gorut-v2/styles/motion.css', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../../app/gorut-v2/styles/shell.css', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../../app/gorut-v2/styles/dashboard.css', import.meta.url), 'utf8');

test('GoRUT defines first-class light and dark semantic tokens', () => {
  assert.match(tokens, /\.gorut-viewport\s*\{/);
  assert.match(tokens, /\.dark\s+\.gorut-viewport\s*\{/);
  assert.match(tokens, /--gorut-canvas:\s*#F3F6F4/i);
  assert.match(tokens, /--gorut-canvas:\s*#09130F/i);
  assert.match(tokens, /--gorut-emphasis:/);
  assert.match(tokens, /--gorut-on-emphasis:/);
  assert.match(tokens, /font-variant-numeric:\s*tabular-nums/);
});

test('GoRUT motion respects both reduction mechanisms', () => {
  assert.match(motion, /prefers-reduced-motion:\s*reduce/);
  assert.match(motion, /html\[data-animations="off"\]/);
});

test('GoRUT mobile workspace cannot inherit a desktop min-content width', () => {
  assert.match(shell, /@media \(max-width:\s*900px\)[\s\S]*?\.gorut-viewport \.gorut-workspace\s*\{[\s\S]*?width:\s*100%/);
  assert.match(shell, /@media \(max-width:\s*900px\)[\s\S]*?\.gorut-viewport \.gorut-main\s*\{[\s\S]*?width:\s*100%/);
  const dashboardRoot = dashboard.match(/\.gorut-command-dashboard\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(dashboardRoot, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});
