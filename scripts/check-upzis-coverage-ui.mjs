import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require(process.env.ESBUILD_MODULE ?? 'esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = await mkdtemp(path.join(process.env.UPZIS_QA_DIR ?? tmpdir(), 'upzis-coverage-ui-'));
const packageCode = 'GPK-COVERAGE-202611';
const endpoint = `/api/gorut/packages/${packageCode}/coverage`;
const reason = 'Ranting "RAN-01" tidak memiliki sumber periode ini berdasarkan pemeriksaan fixture.';

function fixture() {
  return {
    identity: { packageCode, origin: 'COLLECTION_BRIDGE', isHistorical: false, workflowHistoryComplete: true, version: 1, revision: 1 },
    period: { key: '2026-11', start: '2026-11-01', label: 'November 2026' },
    region: { kecamatan: { code: 'KEC-TEST', name: '[TEST] Kecamatan' }, upzis: { operationalLevel: 'KECAMATAN', kecamatanCode: 'KEC-TEST' } },
    coverage: {
      included: 1, excluded: 0, unresolved: 0, completenessEvaluated: false,
      roster: { frozenAt: null, frozenBy: null, sourceHash: null },
      rantings: [{ status: 'included', ranting: { code: 'RAN-02', name: '[TEST] Ranting sumber' }, sourceRantingKey: 'RAN-02', sourceRantingName: null, exclusionReason: null, exclusionReference: null, recordedBy: null, recordedAt: null, activeAtCutoff: null, transactionCount: 1, plpkCount: 1, munfiqCount: 3, recordedAmount: '27000.00' }],
      missingActiveRantings: [{ code: 'RAN-01', name: '[TEST] Ranting pertama' }, { code: 'RAN-03', name: '[TEST] Ranting ketiga' }],
      consistency: { resolvedRantingsWithinRegion: true, everyTransactionHasIncludedRanting: true },
    },
    transactions: {
      count: 1, munfiqCount: 3, plpkCount: 1,
      plpkSummaries: [{ plpkCode: 'PLPK-TEST', plpkName: '[TEST] PLPK', rantingCode: 'RAN-02', rantingName: '[TEST] Ranting sumber', transactionCount: 1, munfiqCount: 3, recordedAmount: '27000.00' }],
      items: [{ transactionCode: 'TRX-TEST', transactionDate: '2026-11-01T00:00:00.000Z', currentState: 'DRAFT', recordedAmount: '27000.00', recordedAmountSemantic: 'Jumlah Tercatat', ranting: { code: 'RAN-02', name: '[TEST] Ranting sumber' }, plpk: { code: 'PLPK-TEST', name: '[TEST] PLPK' }, munfiqCount: 3, collectionSource: { collectionCode: 'COL-TEST', origin: 'NATIVE', lifecycleStatus: 'VERIFIED_BY_KORDES', amountAuthorityStatus: 'AUTHORITATIVE', feeAuthorityStatus: 'AUTHORITATIVE', financialStatus: 'READY', financialBlockingReasons: [], grossAmount: '27000.00', totalPlpkFee: '7500.00', netAmount: '19500.00', revision: 10, sourceHash: 'fixture', transactionSourceHash: 'fixture', financialSourceHash: 'fixture', calculationPolicyVersion: 'GORUT-PLPK-FEE-V1-PROVISIONAL', reconciliationStatus: 'READY', verification: { confirmedByPlpkAt: '2026-10-13T12:00:00.000Z', submittedToKordesAt: '2026-10-13T12:00:00.000Z', verifiedByKordesAt: '2026-10-13T14:00:00.000Z', returnedForCorrectionAt: null } }, provenance: { sourceType: 'GORUT_TRANSACTION', sourceKey: 'TRX-TEST', sourceVersion: 'fixture', sourceHash: 'fixture', includedAt: '2026-10-13T14:00:00.000Z' } }],
    },
    collectionSource: { transactionCount: 1, sourceCount: 1, authoritativeAmountCount: 1, authoritativeFeeCount: 1, financiallyReadyCount: 1, verifiedByKordesCount: 1, completeForEveryTransaction: true },
    financial: { status: 'READY', blockingReasons: [], recordedAmount: '27000.00', recordedAmountSemantic: 'Jumlah Tercatat', grossAmount: '27000.00', totalPlpkFee: '7500.00', netAmount: '19500.00', calculatedAt: '2026-10-13T14:00:00.000Z', lockedAt: null, feePolicyVersion: 'GORUT-PLPK-FEE-V1-PROVISIONAL', feePolicyAuthority: 'PROVISIONAL_PENDING_SOP_CONFIRMATION', authority: { sourceType: 'AUTHORITATIVE_COLLECTION', completeForEveryTransaction: true }, calculationPolicyVersion: 'GORUT_AUTHORITATIVE_COLLECTION_V1', sourceRevision: 1, sourceHash: 'fixture', consistency: { formulaMatches: true, transactionsWithinRegion: true, sourceRevisionMatches: true } },
    workflow: { currentState: 'DRAFT', version: 1, operationalRole: 'UPZIS', history: [], availableActions: [], blockingReasons: ['ROSTER_COVERAGE_INCOMPLETE'] },
    corrections: [], documents: [],
  };
}

let canonical = fixture();
let mode = 'success';
let posts = [];
let reads = 0;
let heldRead = null;
let waitingForCanonical = false;
const errors = [];
const evidence = [];

const entry = path.join(output, 'entry.tsx');
await writeFile(entry, `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { GorutThemeProvider } from ${JSON.stringify(path.join(root, 'components/gorut-v2/gorut-theme-provider.tsx'))};
import { TooltipProvider } from ${JSON.stringify(path.join(root, 'components/ui/tooltip.tsx'))};
import { UpzisPackageShell } from ${JSON.stringify(path.join(root, 'components/gorut-v2/upzis/upzis-package-shell.tsx'))};
createRoot(document.getElementById('root')!).render(<PathnameContext.Provider value='/gorut-v2/penghimpunan/verifikasi-upzis'><GorutThemeProvider><TooltipProvider><UpzisPackageShell /></TooltipProvider></GorutThemeProvider></PathnameContext.Provider>);
`);
await esbuild.build({ entryPoints: [entry], outfile: path.join(output, 'fixture.js'), bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic', tsconfig: path.join(root, 'tsconfig.json'), nodePaths: [path.join(root, 'node_modules')], define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' }, logLevel: 'silent' });
const css = await postcss([tailwind({ base: root })]).process('@import "tailwindcss";\n@import "./app/gorut-v2/gorut-v2.css";', { from: path.join(root, 'coverage-fixture.css') });
await writeFile(path.join(output, 'fixture.css'), `html,body{margin:0}*{box-sizing:border-box}${css.css}`);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://fixture.invalid');
  const json = (data, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(data)); };
  if (request.method === 'POST') {
    if (url.pathname !== endpoint) return json({ error: 'Unexpected mutation in fixture' }, 403);
    let text = '';
    for await (const chunk of request) text += chunk;
    const body = JSON.parse(text);
    posts.push(body);
    if (mode === 'conflict') { canonical.identity.version = 2; canonical.workflow.version = 2; return json({ error: 'Version changed', code: 'PACKAGE_VERSION_CONFLICT' }, 409); }
    if (mode === 'rejected') return json({ error: 'Alasan ditolak server.', code: 'PACKAGE_GATE_BLOCKED' }, 422);
    if (body.expectedVersion !== canonical.identity.version) return json({ error: 'Stale version', code: 'PACKAGE_VERSION_CONFLICT' }, 409);
    if (mode !== 'unconfirmed') {
      const target = canonical.coverage.missingActiveRantings.find(row => row.code === body.rantingCode);
      assert.ok(target, 'fixture target must be missing');
      canonical.coverage.rantings.push({ status: 'excluded-with-reason', ranting: target, sourceRantingKey: target.code, sourceRantingName: null, exclusionReason: body.reason, exclusionReference: body.reference ?? null, recordedBy: '[TEST] UPZIS', recordedAt: '2026-10-13T15:00:00.000Z', activeAtCutoff: null, transactionCount: 0, plpkCount: 0, munfiqCount: 0, recordedAmount: null });
      canonical.coverage.missingActiveRantings = canonical.coverage.missingActiveRantings.filter(row => row.code !== target.code);
      canonical.coverage.excluded++;
      canonical.identity.version++;
      canonical.identity.revision++;
      canonical.workflow.version = canonical.identity.version;
      waitingForCanonical = mode === 'pending';
    }
    return json({ status: 'EXCLUDED', version: canonical.identity.version });
  }
  if (url.pathname === '/api/gorut/packages') return json({ items: [canonical], page: 1, pageSize: 10, total: 1 });
  if (url.pathname === `/api/gorut/packages/${packageCode}`) {
    reads++;
    if (waitingForCanonical) { heldRead = () => json(canonical); return; }
    return json(canonical);
  }
  if (url.pathname === '/fixture.js' || url.pathname === '/fixture.css') {
    response.writeHead(200, { 'Content-Type': url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css' });
    response.end(await readFile(path.join(output, url.pathname.slice(1))));
    return;
  }
  if (url.pathname === '/gorut-logo.svg') { response.writeHead(200, { 'Content-Type': 'image/svg+xml' }); response.end(await readFile(path.join(root, 'public/gorut-logo.svg'))); return; }
  if (url.pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end('<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, chromiumSandbox: true });
const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
await context.route('**/*', route => {
  const request = route.request();
  if (new URL(request.url()).origin !== origin) return route.abort();
  if (mode === 'ambiguous' && request.method() === 'POST' && new URL(request.url()).pathname === endpoint) {
    posts.push(JSON.parse(request.postData()));
    return route.abort('failed');
  }
  return route.continue();
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));

async function open(width = 1440, nextMode = 'success', mutate = () => {}) {
  canonical = fixture(); mode = nextMode; posts = []; reads = 0; waitingForCanonical = false; heldRead = null;
  mutate(canonical);
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(origin, { waitUntil: 'networkidle' });
  if (width > 900) await page.locator('tr').filter({ hasText: packageCode }).getByRole('button', { name: 'Detail', exact: true }).click();
  else await page.getByRole('button', { name: `Detail ${packageCode}`, exact: true }).click();
  await page.getByRole('dialog').getByText('Financial READY', { exact: true }).waitFor();
}
const target = code => page.getByTestId(`coverage-target-${code}`);
async function preview(code = 'RAN-01', text = reason, reference = '') {
  await target(code).getByRole('button', { name: 'Tetapkan Tidak Ikut Periode', exact: true }).click();
  await page.getByLabel('Alasan pengecualian').fill(text);
  await page.getByLabel('Referensi (opsional)').fill(reference);
  await page.getByRole('button', { name: 'Periksa keputusan coverage', exact: true }).click();
  await page.getByTestId('coverage-confirmation').waitFor();
}
const confirm = () => page.getByRole('button', { name: 'Ya, Tetapkan Tidak Ikut Periode', exact: true });

try {
  await open();
  await page.getByRole('heading', { name: 'Ranting belum memiliki sumber periode ini', exact: true }).waitFor({ timeout: 3000 });
  assert.equal(await target('RAN-01').count(), 1);
  assert.equal(await target('RAN-03').count(), 1);
  assert.equal(await target('RAN-02').count(), 0);
  await target('RAN-01').getByRole('button').click();
  assert.equal(await page.getByLabel('Alasan pengecualian').inputValue(), '');
  assert.equal(await page.getByLabel('Referensi (opsional)').inputValue(), '');
  await page.getByLabel('Alasan pengecualian').fill('   ');
  await page.getByRole('button', { name: 'Periksa keputusan coverage', exact: true }).click();
  await page.getByText('Alasan pengecualian wajib diisi.', { exact: true }).waitFor();
  assert.equal(posts.length, 0);
  await page.getByLabel('Alasan pengecualian').fill(reason);
  await page.getByRole('button', { name: 'Periksa keputusan coverage', exact: true }).click();
  const review = page.getByTestId('coverage-confirmation');
  assert.ok((await review.innerText()).includes(reason));
  assert.ok((await review.innerText()).includes(packageCode));
  assert.ok((await review.innerText()).includes('RAN-01'));
  assert.ok((await review.innerText()).includes('Tidak ada'));
  assert.equal(posts.length, 0);
  await page.getByRole('button', { name: 'Kembali edit', exact: true }).click();
  assert.equal(posts.length, 0);
  await page.getByRole('button', { name: 'Periksa keputusan coverage', exact: true }).click();
  await confirm().click();
  await page.getByText('Keputusan coverage RAN-01 tercatat dan telah dikonfirmasi dari server.', { exact: true }).waitFor();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].reason, reason);
  assert.equal(posts[0].reference, null);
  assert.equal(posts[0].expectedVersion, 1);
  assert.ok(/^[0-9a-f-]{36}$/i.test(posts[0].idempotencyKey));
  await preview('RAN-03', 'Fakta RAN-03 diperiksa.', 'REF-FIXTURE');
  await confirm().click();
  await page.getByText('Keputusan coverage RAN-03 tercatat dan telah dikonfirmasi dari server.', { exact: true }).waitFor();
  assert.equal(posts.length, 2);
  assert.equal(posts[1].expectedVersion, 2);
  assert.equal(posts[1].reference, 'REF-FIXTURE');
  assert.ok(posts[0].idempotencyKey !== posts[1].idempotencyKey);
  assert.equal(await page.getByRole('button', { name: 'Kirim untuk verifikasi', exact: true }).count(), 0);
  evidence.push('Explicit confirmation; exact reason/reference; sequential versions 1 then 2; no fabricated SUBMIT.');

  await open(1440, 'pending');
  await preview();
  await confirm().click();
  await page.waitForFunction(() => document.body.innerText.includes('Memeriksa hasil coverage'));
  assert.equal(posts.length, 1);
  assert.equal(await target('RAN-03').getByRole('button').isDisabled(), true);
  assert.equal(await confirm().isDisabled(), true);
  assert.ok(heldRead, 'canonical refetch must remain pending');
  waitingForCanonical = false; heldRead(); heldRead = null;
  await page.getByText('Keputusan coverage RAN-01 tercatat dan telah dikonfirmasi dari server.', { exact: true }).waitFor();
  assert.equal(posts.length, 1);
  evidence.push('Other coverage controls stay disabled until canonical refetch resolves.');

  for (const [scenario, message] of [['conflict', /berubah di server/], ['ambiguous', /Jangan kirim ulang/], ['unconfirmed', /Jangan kirim ulang/], ['rejected', /Alasan ditolak server/]]) {
    await open(1440, scenario);
    await preview();
    await confirm().click();
    await page.getByTestId('coverage-error').filter({ hasText: message }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(await page.getByText('Keputusan coverage RAN-01 tercatat dan telah dikonfirmasi dari server.', { exact: true }).count(), 0);
    if (scenario !== 'rejected') {
      assert.ok(reads >= 2, 'conflict/uncertainty must read canonical detail');
      await page.getByRole('button', { name: 'Periksa detail terbaru', exact: true }).click();
      assert.equal(posts.length, 1);
    }
  }
  evidence.push('409, network ambiguity, unconfirmed success, and server rejection never replay POST or fake success.');

  for (const mutate of [data => { data.workflow.operationalRole = 'PC'; }, data => { delete data.workflow.operationalRole; }, data => { data.coverage.roster.frozenAt = '2026-10-13T15:00:00.000Z'; }, data => { data.workflow.currentState = 'WAITING_UPZIS_VERIFICATION'; }]) {
    await open(1440, 'success', mutate);
    assert.equal(await page.getByRole('heading', { name: 'Ranting belum memiliki sumber periode ini', exact: true }).count(), 0);
    assert.equal(posts.length, 0);
  }
  evidence.push('Role, DRAFT, and unfrozen-roster gates fail closed.');

  for (const width of [360, 375, 390, 430, 1440]) {
    await open(width);
    await preview('RAN-01', `Fakta ${'panjang '.repeat(40)}`);
    const box = await confirm().boundingBox();
    assert.ok(box && box.height >= 44 && box.width >= 44, `confirmation touch target at ${width}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `no page overflow at ${width}`);
    const control = page.getByRole('button', { name: 'Kembali edit', exact: true });
    await control.focus();
    await page.keyboard.press('Tab');
    assert.ok(await confirm().evaluate(element => document.activeElement === element), `logical forward Tab order at ${width}`);
    await page.keyboard.press('Shift+Tab');
    assert.ok(await control.evaluate(element => document.activeElement === element && element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none'), `visible keyboard focus at ${width}`);
    await page.screenshot({ path: path.join(output, `coverage-${width}.png`), fullPage: true });
    await page.keyboard.press('Enter');
    assert.equal(await page.getByTestId('coverage-confirmation').count(), 0);
    assert.equal(posts.length, 0);
    evidence.push(`Viewport ${width}: confirmation fits, 44px target, visible focus, no horizontal overflow.`);
  }
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await open(390);
    await preview();
    const colors = await confirm().evaluate(element => ({ text: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
    const luminance = color => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const values = [luminance(colors.text), luminance(colors.background)].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `confirmation text contrast in ${scheme}`);
    await page.screenshot({ path: path.join(output, `coverage-${scheme}.png`), fullPage: true });
    evidence.push(`Theme ${scheme}: canonical theme tokens and confirmation text contrast >=4.5:1.`);
  }
  assert.deepEqual(errors, []);
  const proof = { pass: true, evidence, liveDatabaseMutations: 0, fixtureOnly: true, finalFixturePosts: posts.map(({ idempotencyKey, ...body }) => ({ ...body, keyHash: createHash('sha256').update(idempotencyKey).digest('hex') })) };
  await writeFile(path.join(output, 'proof.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ ...proof, artifacts: output }));
} catch (error) {
  await writeFile(path.join(output, 'failure.txt'), await page.locator('body').innerText());
  console.error(JSON.stringify({ fixtureErrors: errors, mode, observedPostAttempts: posts.length, artifacts: output }));
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
