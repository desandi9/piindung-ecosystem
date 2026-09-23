import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { CollectionApiError, GorutCollectionApiClient, canonicalRupiahInput, collectionErrorMessage, executeWithCanonicalRefetch, resolveCollectionFrontendMode, type GorutCollection } from './collection-api-client.ts';
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { collectionHasAction, collectionMoneyLabel, collectionPolicyLabel, collectionToBatch, entryHasRecordAction, isServerCollectionBatch } from './collection-api-view-model.ts';

function canonical(overrides: Partial<GorutCollection> = {}): GorutCollection {
  return {
    identity: {
      collectionCode: 'COL-2026-08-PLPK-01',
      origin: 'NATIVE',
      status: 'COLLECTING',
      version: 4,
      revision: 4,
      sourceHash: 'source-hash',
      createdAt: '2026-08-01T01:00:00.000Z',
      updatedAt: '2026-08-21T02:00:00.000Z',
      createdBy: { memberCode: 'PLPK-01', name: 'Dede' },
    },
    period: { key: '2026-08', start: '2026-08-01', label: 'Agustus 2026' },
    region: {
      kecamatan: { code: 'KEC-01', name: 'Garut Kota' },
      ranting: { code: 'RAN-01', name: 'Sukamentri' },
    },
    plpk: { code: 'PLPK-01', name: 'Dede Rahmat' },
    entries: [
      {
        munfiq: { code: 'M-001', name: 'Munfiq Satu' },
        visitStatus: 'COLLECTED',
        amount: '12500.00',
        collectedAt: '2026-08-20T03:00:00.000Z',
        note: null,
        fee: { eligible: true, amount: '2500.00', policyVersion: 'GORUT-PLPK-FEE-V1-PROVISIONAL' },
        provenance: { sourceType: 'SERVER_COLLECTION_COMMAND', sourceKey: 'entry-1', sourceHash: 'entry-hash' },
        availableActions: ['RECORD_ENTRY'],
      },
      {
        munfiq: { code: 'M-002', name: 'Munfiq Dua' },
        visitStatus: 'PENDING',
        amount: '0.00',
        collectedAt: null,
        note: null,
        fee: { eligible: null, amount: null, policyVersion: null },
        provenance: { sourceType: 'SERVER_COLLECTION_COMMAND', sourceKey: 'entry-2', sourceHash: 'entry-hash-2' },
        availableActions: [],
      },
    ],
    financial: {
      amountAuthorityStatus: 'AUTHORITATIVE',
      feeAuthorityStatus: 'AUTHORITATIVE',
      status: 'READY',
      blockingReasons: [],
      grossAmount: '12500.00',
      totalPlpkFee: '2500.00',
      netAmount: '10000.00',
      calculatedAt: '2026-08-20T03:00:01.000Z',
      calculationPolicyVersion: 'GORUT-PLPK-FEE-V1-PROVISIONAL',
      policyAuthority: 'PROVISIONAL_PENDING_SOP_CONFIRMATION',
      sourceHash: 'financial-hash',
    },
    confirmation: {
      confirmedByPlpkAt: '2026-08-20T04:00:00.000Z',
      confirmedBy: { memberCode: 'PLPK-01', name: 'Dede Rahmat' },
      submittedToKordesAt: '2026-08-20T04:00:01.000Z',
      submittedBy: { memberCode: 'PLPK-01', name: 'Dede Rahmat' },
    },
    kordesVerification: {
      verifiedByKordesAt: null,
      returnedForCorrectionAt: '2026-08-20T05:00:00.000Z',
      decisionBy: { memberCode: 'KORDES-01', name: 'Kordes Sukamentri' },
      moneyMatches: false,
      hasDamagedMoney: false,
      cashReceived: true,
      note: 'Nominal M-001 perlu diperiksa.',
    },
    corrections: [{
      target: { type: 'MUNFIQ', code: 'M-001', name: 'Munfiq Satu' },
      reason: 'Nominal M-001 perlu diperiksa.',
      requestedAt: '2026-08-20T05:00:00.000Z',
      requestRevision: 4,
      requestedBy: { memberCode: 'KORDES-01', name: 'Kordes Sukamentri' },
      resolvedAt: null,
      resolutionRevision: null,
      resolvedBy: null,
    }],
    bridgeReadiness: {
      ready: false,
      blockingReasons: ['COLLECTION_NOT_VERIFIED_BY_KORDES'],
      sourceHashClean: true,
      transaction: null,
      package: null,
    },
    version: 4,
    availableActions: ['RECORD_ENTRY'],
    blockingReasons: ['COLLECTION_ENTRY_PENDING'],
    history: [{ revision: 4, action: 'REQUEST_CORRECTION', reason: 'Nominal M-001 perlu diperiksa.', actor: { memberCode: 'KORDES-01', name: 'Kordes Sukamentri' }, timestamp: '2026-08-20T05:00:00.000Z' }],
    ...overrides,
  };
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

void test('PLPK and Kordes list/detail reads use the authenticated Collection API', async () => {
  const calls: string[] = [];
  const collection = canonical();
  const client = new GorutCollectionApiClient(async (input) => {
    calls.push(String(input));
    return calls.length === 1
      ? json({ data: [collection], pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 } })
      : json(collection);
  }, () => 'uuid-1');

  const list = await client.list({ page: 1, pageSize: 100, period: '2026-08', status: 'WAITING_KORDES_VERIFICATION' });
  const detail = await client.detail(collection.identity.collectionCode);
  assert.equal(list.data[0]?.financial.netAmount, '10000.00');
  assert.equal(collectionPolicyLabel(collectionToBatch(detail)), 'PROVISIONAL_PENDING_SOP_CONFIRMATION · GORUT-PLPK-FEE-V1-PROVISIONAL');
  assert.equal(detail.confirmation.submittedToKordesAt, '2026-08-20T04:00:01.000Z');
  assert.equal(calls[0], '/api/gorut/collections?page=1&pageSize=100&period=2026-08&status=WAITING_KORDES_VERIFICATION');
  assert.equal(calls[1], '/api/gorut/collections/COL-2026-08-PLPK-01');
});

void test('create, entry, confirm, verify, and return commands send only server contract fields', async () => {
  const requests: Array<{ url: string; method?: string; body: Record<string, unknown> }> = [];
  let uuid = 0;
  const client = new GorutCollectionApiClient(async (input, init) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ url: String(input), method: init?.method, body });
    return json({ collection: { collectionCode: 'COL-1' } });
  }, () => `uuid-${++uuid}`);

  await client.create('2026-08', 'create:2026-08');
  await client.recordEntry('COL-1', 'M-001', { visitStatus: 'COLLECTED', amount: '12500.00', note: null, reason: null, expectedVersion: 1 }, 'entry:COL-1:M-001');
  await client.action('COL-1', { action: 'CONFIRM_AND_SUBMIT', expectedVersion: 2 }, 'action:COL-1:CONFIRM_AND_SUBMIT');
  await client.action('COL-1', { action: 'VERIFY_BY_KORDES', expectedVersion: 3, moneyMatches: true, hasDamagedMoney: false, cashReceived: true, note: null }, 'action:COL-1:VERIFY_BY_KORDES');
  await client.action('COL-1', { action: 'RETURN_FOR_CORRECTION', expectedVersion: 3, moneyMatches: false, hasDamagedMoney: false, cashReceived: true, reason: 'Nominal tidak sesuai.', correctionMunfiqCodes: ['M-001'] }, 'action:COL-1:RETURN_FOR_CORRECTION');

  assert.deepEqual(requests[0]?.body, { period: '2026-08', expectedVersion: 0, idempotencyKey: 'uuid-1' });
  assert.deepEqual(requests[1]?.body, { visitStatus: 'COLLECTED', amount: '12500.00', note: null, reason: null, expectedVersion: 1, idempotencyKey: 'uuid-2' });
  assert.equal(requests[2]?.body.action, 'CONFIRM_AND_SUBMIT');
  assert.equal(requests[3]?.body.action, 'VERIFY_BY_KORDES');
  assert.deepEqual(requests[4]?.body.correctionMunfiqCodes, ['M-001']);
  for (const request of requests) {
    assert.equal('plpkId' in request.body, false);
    assert.equal('rantingId' in request.body, false);
    assert.equal('confirmedByPlpkAt' in request.body, false);
    assert.equal('fee' in request.body, false);
  }
});

void test('network retry reuses one key, while a changed or completed intent gets a new key', async () => {
  const bodies: Record<string, unknown>[] = [];
  let attempt = 0;
  let uuid = 0;
  const client = new GorutCollectionApiClient(async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    attempt += 1;
    if (attempt === 1 || attempt === 4) throw new TypeError('offline');
    return json({ collection: { collectionCode: 'COL-1' } });
  }, () => `uuid-${++uuid}`);
  const command = { visitStatus: 'COLLECTED' as const, amount: '10000.00', note: null, reason: null, expectedVersion: 1 };

  await assert.rejects(client.recordEntry('COL-1', 'M-001', command, 'entry:1'), { code: 'NETWORK_ERROR' });
  await client.recordEntry('COL-1', 'M-001', command, 'entry:1');
  assert.equal(bodies[0]?.idempotencyKey, bodies[1]?.idempotencyKey);

  await client.recordEntry('COL-1', 'M-001', command, 'entry:1');
  assert.notEqual(bodies[1]?.idempotencyKey, bodies[2]?.idempotencyKey);

  await assert.rejects(client.recordEntry('COL-1', 'M-001', command, 'entry:changed'), { code: 'NETWORK_ERROR' });
  await client.recordEntry('COL-1', 'M-001', { ...command, amount: '11000.00' }, 'entry:changed');
  assert.notEqual(bodies[3]?.idempotencyKey, bodies[4]?.idempotencyKey);
});

void test('canonical refresh happens after success and on 409 without auto-retrying the transition', async () => {
  let mutations = 0;
  let refetches = 0;
  const refreshed = canonical({ version: 5, identity: { ...canonical().identity, version: 5 } });
  const success = await executeWithCanonicalRefetch(
    async () => { mutations += 1; },
    async () => { refetches += 1; return refreshed; },
  );
  assert.equal(success.version, 5);
  assert.equal(mutations, 1);
  assert.equal(refetches, 1);

  await assert.rejects(executeWithCanonicalRefetch(
    async () => { mutations += 1; throw new CollectionApiError('version conflict', 409, 'COLLECTION_VERSION_CONFLICT'); },
    async () => { refetches += 1; return refreshed; },
  ), { code: 'COLLECTION_VERSION_CONFLICT' });
  assert.equal(mutations, 2);
  assert.equal(refetches, 2);

  await assert.rejects(executeWithCanonicalRefetch(
    async () => { throw new CollectionApiError('blocked', 422, 'COLLECTION_ENTRY_PENDING'); },
    async () => { refetches += 1; return refreshed; },
  ), { code: 'COLLECTION_ENTRY_PENDING' });
  assert.equal(refetches, 2);
});

void test('403, 404, 409, 422, and network failures retain clear UI semantics', async () => {
  const cases = [
    [403, 'COLLECTION_ACCESS_DENIED', 'Anda tidak memiliki akses'],
    [404, 'COLLECTION_NOT_FOUND', 'tidak tersedia atau tidak ditemukan'],
    [409, 'COLLECTION_VERSION_CONFLICT', 'Data berubah di server'],
    [422, 'COLLECTION_ENTRY_PENDING', 'Lengkapi data Munfiq'],
  ] as const;
  for (const [status, code, expected] of cases) {
    const client = new GorutCollectionApiClient(async () => json({ error: status === 422 ? 'Lengkapi data Munfiq.' : 'server message', code }, status), () => 'uuid');
    const error = await client.detail('COL-1').catch((caught) => caught);
    assert.ok(error instanceof CollectionApiError);
    assert.match(collectionErrorMessage(error), new RegExp(expected));
  }
  const offline = new GorutCollectionApiClient(async () => { throw new TypeError('offline'); }, () => 'uuid');
  const networkError = await offline.list().catch((caught) => caught);
  assert.match(collectionErrorMessage(networkError), /Periksa jaringan/);
});

void test('rupiah input becomes a canonical decimal string without float, comma, or exponent', () => {
  assert.equal(canonicalRupiahInput('Rp 12.500'), '12500.00');
  assert.equal(canonicalRupiahInput('0007'), '7.00');
  assert.equal(canonicalRupiahInput('7,500'), null);
  assert.equal(canonicalRupiahInput('1e3'), null);
  assert.equal(canonicalRupiahInput('-100'), null);
});

void test('canonical view model preserves server financials, timestamps, actions, and correction target', () => {
  const source = canonical();
  const batch = collectionToBatch(source);
  assert.ok(isServerCollectionBatch(batch));
  assert.equal(collectionMoneyLabel(batch, 'grossAmount'), 'Rp12.500');
  assert.equal(collectionMoneyLabel(batch, 'totalPlpkFee'), 'Rp2.500');
  assert.equal(collectionMoneyLabel(batch, 'netAmount'), 'Rp10.000');
  assert.equal(batch.confirmedByPlpkAt, source.confirmation.confirmedByPlpkAt);
  assert.equal(batch.returnedForCorrectionAt, source.kordesVerification.returnedForCorrectionAt);
  assert.deepEqual(batch.correctionEntryIds, ['M-001']);
  assert.equal(entryHasRecordAction(batch, 'M-001'), true);
  assert.equal(entryHasRecordAction(batch, 'M-002'), false);
  assert.equal(collectionHasAction(batch, 'CONFIRM_AND_SUBMIT'), false);

  const blocked = collectionToBatch(canonical({ financial: { ...source.financial, status: 'BLOCKED', grossAmount: null, totalPlpkFee: null, netAmount: null } }));
  assert.equal(collectionMoneyLabel(blocked, 'grossAmount'), 'Belum siap');
  assert.equal(collectionMoneyLabel(blocked, 'totalPlpkFee'), 'Belum siap');
  assert.equal(collectionMoneyLabel(blocked, 'netAmount'), 'Belum siap');
});

void test('server mode is default and localStorage remains isolated in explicit demo code', async () => {
  assert.equal(resolveCollectionFrontendMode(''), 'server');
  assert.equal(resolveCollectionFrontendMode('server'), 'server');
  assert.equal(resolveCollectionFrontendMode('demo'), 'demo');

  const [plpkServer, kordesServer, clientSource, plpkWrapper, kordesWrapper, kordesDesktopRoute] = await Promise.all([
    readFile(new URL('../../components/gorut-v2/plpk-mobile/plpk-mobile-server-app.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/kordes-mobile/kordes-mobile-server-app.tsx', import.meta.url), 'utf8'),
    readFile(new URL('./collection-api-client.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/plpk-mobile/plpk-mobile-app.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/kordes-mobile/kordes-mobile-app.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/gorut-v2/penghimpunan/verifikasi-kordes/page.tsx', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(`${plpkServer}\n${kordesServer}\n${clientSource}`, /localStorage|saveCollectionBatch|applyKordesDecision|submitPlpkBatch/);
  assert.match(plpkWrapper, /resolveCollectionFrontendMode\(\) === 'demo'/);
  assert.match(kordesWrapper, /resolveCollectionFrontendMode\(\) === 'demo'/);
  assert.match(kordesDesktopRoute, /resolveCollectionFrontendMode\(\) === 'server'[\s\S]*redirect\('\/gorut-v2\/mobile\/kordes'\)/);
  assert.doesNotMatch(plpkServer, /calculatePlpkFee|isEligibleForPlpkFee|new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
  assert.doesNotMatch(kordesServer, /new Date\(\)\.toISOString\(\).*verified|applyKordesDecision/);
  assert.doesNotMatch(`${plpkServer}\n${kordesServer}`, /setCollections|BRIDGE_TRANSACTION|packageCode|SUBMIT_PACKAGE|FINAL_CLOSE/);
  assert.match(plpkServer, /collectionHasAction\(activeBatch, 'CONFIRM_AND_SUBMIT'\)/);
  assert.match(kordesServer, /collectionHasAction\(verificationBatch, serverAction\)/);
  assert.match(plpkServer, /expectedVersion: activeBatch\.canonical\.version/);
  assert.match(kordesServer, /expectedVersion: verificationBatch\.canonical\.version/);

  const hookSource = await readFile(new URL('./use-collection-api.ts', import.meta.url), 'utf8');
  assert.match(hookSource, /inFlight\.current\.get\(intentId\)/);
  assert.match(hookSource, /executeWithCanonicalRefetch/);
});
