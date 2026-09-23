import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboardSource = readFileSync(new URL('./dashboard-control.ts', import.meta.url), 'utf8');
const catalogSource = readFileSync(new URL('./document-catalog.ts', import.meta.url), 'utf8');
const upzisSource = readFileSync(new URL('./upzis-mock-data.ts', import.meta.url), 'utf8');
const f009FallbackSource = readFileSync(new URL('../../components/gorut-v2/documents/gorut-html-fallback.tsx', import.meta.url), 'utf8');

test('dashboard keeps collection-completed incomplete and excludes needs-correction from completed progress', () => {
  const unfinished = dashboardSource.match(/const unfinishedStatuses = \[([^\]]+)\]/)?.[1] ?? '';
  const completed = dashboardSource.match(/const completedStatuses = \[([^\]]+)\]/)?.[1] ?? '';

  assert.match(unfinished, /'collection-completed'/);
  assert.doesNotMatch(completed, /'needs-correction'/);
});

test('needs-correction derives an incomplete UPZIS recap', () => {
  assert.match(upzisSource, /const anyUnfinished = batches\.some\(\(batch\) => \[([^\]]*'needs-correction'[^\]]*)\]\.includes\(batch\.status\)\);/);
  assert.match(upzisSource, /if \(anyUnfinished\) return 'incomplete';/);
});

test('F.009 fallback prefers its assigned number and excludes PLPK fee fields', () => {
  assert.match(f009FallbackSource, /batch\.f009DocumentNumber \?\? batch\.documentNumber/);
  assert.match(f009FallbackSource, /Total Nominal Penghimpunan<\/span><strong>\{formatRupiah\(batch\.grossAmount\)\}/);
  assert.doesNotMatch(f009FallbackSource, /Bisyaroh PLPK/);
  assert.doesNotMatch(f009FallbackSource, /Jumlah Bersih/);
});

test('F.010 preview is disabled while waiting and enabled only when ready', () => {
  assert.match(catalogSource, /const f010 = f010Readiness\(recap\);/);
  assert.match(catalogSource, /readiness: f010,/);
  assert.match(catalogSource, /canPreview: f010 === 'ready',/);
});
