import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { GorutPackageApiClient, PackageApiError, executeWithCanonicalPackageRefetch, packageErrorBlockingReasons, packageErrorMessage, resolvePackageFrontendMode, type GorutPackageDetail, type GorutPackageSummary } from './package-api-client.ts';
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { formatCanonicalRupiah, formatSignedCanonicalRupiah, packageFinancialLabel, packageHasAction, validatePackageReturnForm } from './package-api-view-model.ts';

function summary(overrides: Partial<GorutPackageSummary> = {}): GorutPackageSummary {
  return {
    identity: { packageCode: 'GPK-202608-KEC-01', origin: 'COLLECTION_BRIDGE', isHistorical: false, workflowHistoryComplete: true, version: 3, revision: 2 },
    period: { key: '2026-08', start: '2026-08-01', label: 'Agustus 2026' },
    region: { kecamatan: { code: 'KEC-01', name: 'Garut Kota' }, upzis: { operationalLevel: 'KECAMATAN', kecamatanCode: 'KEC-01' } },
    coverage: { included: 2, excluded: 1, unresolved: 0, completenessEvaluated: true },
    transactions: { count: 2, plpkCount: 2, munfiqCount: 4 },
    collectionSource: { transactionCount: 2, sourceCount: 2, authoritativeAmountCount: 2, authoritativeFeeCount: 2, financiallyReadyCount: 2, verifiedByKordesCount: 2, completeForEveryTransaction: true },
    financial: {
      status: 'READY', blockingReasons: [], recordedAmount: '30000.00', recordedAmountSemantic: 'Jumlah Tercatat',
      grossAmount: '30000.00', totalPlpkFee: '5000.00', netAmount: '25000.00', calculatedAt: '2026-08-21T04:00:00.000Z', lockedAt: null,
      feePolicyVersion: 'GORUT-PLPK-FEE-V1-PROVISIONAL', feePolicyAuthority: 'PROVISIONAL_PENDING_SOP_CONFIRMATION',
      authority: { sourceType: 'AUTHORITATIVE_COLLECTION', completeForEveryTransaction: true },
    },
    settlement: {
      status: 'NOT_RECORDED', completionStatus: 'NOT_DETERMINED_UNTIL_VALIDATION', latest: null, activeEvidenceCodes: [], availableActions: [], blockingReasons: ['CURRENT_SETTLEMENT_EVIDENCE_MISSING'],
      validation: { status: 'NOT_VALIDATED', validationCode: null, settlementEvidenceCode: null, result: null, expectedAmount: null, actualAmount: null, difference: null, validator: null, validatedAt: null, note: null, historical: [], availableActions: [], blockingReasons: ['CURRENT_SETTLEMENT_EVIDENCE_MISSING'] },
      finalApprovalReadiness: { status: 'BLOCKED', blockingReasons: ['CURRENT_SETTLEMENT_EVIDENCE_MISSING'] },
    },
    workflow: { currentState: 'DRAFT', version: 3, availableActions: ['SUBMIT'], blockingReasons: [] },
    ...overrides,
  };
}

function detail(overrides: Partial<GorutPackageDetail> = {}): GorutPackageDetail {
  const base = summary();
  return {
    ...base,
    identity: base.identity,
    coverage: {
      ...base.coverage,
      roster: { frozenAt: null, frozenBy: null, sourceHash: null },
      rantings: [{ status: 'included', ranting: { code: 'RAN-01', name: 'Sukamentri' }, sourceRantingKey: 'RAN-01', sourceRantingName: null, exclusionReason: null, exclusionReference: null, recordedBy: null, recordedAt: null, activeAtCutoff: null, transactionCount: 1, plpkCount: 1, munfiqCount: 2, recordedAmount: '15000.00' }],
      consistency: { resolvedRantingsWithinRegion: true, everyTransactionHasIncludedRanting: true },
    },
    transactions: {
      count: 1, plpkCount: 1, munfiqCount: 2,
      plpkSummaries: [{ plpkCode: 'PLPK-01', plpkName: 'Dede', rantingCode: 'RAN-01', rantingName: 'Sukamentri', transactionCount: 1, munfiqCount: 2, recordedAmount: '15000.00' }],
      items: [{
        transactionCode: 'TRX-01', transactionDate: '2026-08-20T00:00:00.000Z', currentState: 'DRAFT', recordedAmount: '15000.00', recordedAmountSemantic: 'Jumlah Tercatat',
        ranting: { code: 'RAN-01', name: 'Sukamentri' }, plpk: { code: 'PLPK-01', name: 'Dede' }, munfiqCount: 2,
        collectionSource: {
          collectionCode: 'COL-01', origin: 'NATIVE', lifecycleStatus: 'VERIFIED_BY_KORDES', amountAuthorityStatus: 'AUTHORITATIVE', feeAuthorityStatus: 'AUTHORITATIVE', financialStatus: 'READY', financialBlockingReasons: [], grossAmount: '15000.00', totalPlpkFee: '2500.00', netAmount: '12500.00', revision: 3, sourceHash: 'hash', transactionSourceHash: 'hash', calculationPolicyVersion: 'GORUT-PLPK-FEE-V1-PROVISIONAL', financialSourceHash: 'financial-hash', reconciliationStatus: 'READY',
          verification: { confirmedByPlpkAt: '2026-08-20T01:00:00.000Z', submittedToKordesAt: '2026-08-20T01:00:01.000Z', verifiedByKordesAt: '2026-08-20T02:00:00.000Z', returnedForCorrectionAt: null },
        },
        provenance: { sourceType: 'GORUT_TRANSACTION', sourceKey: 'TRX-01', sourceVersion: '1', sourceHash: 'membership-hash', includedAt: '2026-08-20T02:00:01.000Z' },
      }],
    },
    financial: { ...base.financial, calculationPolicyVersion: 'GORUT-PLPK-FEE-V1-PROVISIONAL', sourceRevision: 2, sourceHash: 'package-financial-hash', consistency: { formulaMatches: true, transactionsWithinRegion: true, sourceRevisionMatches: true } },
    workflow: { ...base.workflow, history: [{ sequence: 1, fromState: 'DRAFT', toState: 'WAITING_UPZIS_VERIFICATION', action: 'SUBMIT', stage: 'UPZIS', actor: { name: 'Actor A', role: 'UPZIS' }, occurredAt: '2026-08-21T05:00:00.000Z', reason: null, reasonCode: null, metadata: null }], finalApproved: finalApproval() },
    settlement: { ...base.settlement, history: [] },
    finalApproval: finalApproval(),
    corrections: [{ correctionCode: 'COR-01', targetType: 'COLLECTION', target: { code: 'COL-01' }, reasonCode: 'AMOUNT_MISMATCH', reason: null, status: 'OPEN', requestedAt: '2026-08-21T06:00:00.000Z', requestedBy: 'Actor B', resolvedAt: null, resolvedBy: null, resolutionNote: null }],
    documents: [{ code: 'F.016', readiness: 'SCAFFOLD', executable: false, reason: 'OUT_OF_SCOPE' }],
    ...overrides,
  };
}

function finalApproval() {
  return {
    readiness: { status: 'BLOCKED' as const, blockingReasons: ['CURRENT_SETTLEMENT_EVIDENCE_MISSING'] }, approved: false, approvedAt: null, approvedBy: null, sourceValidationCode: null, settlementEvidenceCode: null, packageVersion: null, packageRevision: null,
    assertions: { bankSettled: false as const, fundsCleared: false as const, bankDepositCompleted: false as const, proofCryptographicallyVerified: false as const, f016Issued: false as const, finalClose: false as const, administrativeArchiveComplete: false as const },
  };
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

void test('package list and detail read canonical authenticated API shapes', async () => {
  const calls: string[] = [];
  const canonical = detail();
  const client = new GorutPackageApiClient(async (input) => {
    calls.push(String(input));
    return calls.length === 1 ? json({ items: [summary()], page: 1, pageSize: 10, total: 1 }) : json(canonical);
  }, () => 'uuid-1');
  const list = await client.list({ page: 1, pageSize: 10, period: '2026-08', state: 'DRAFT' });
  const result = await client.detail('GPK-202608-KEC-01');
  assert.equal(list.items[0]?.financial.netAmount, '25000.00');
  assert.equal(list.items[0]?.financial.feePolicyAuthority, 'PROVISIONAL_PENDING_SOP_CONFIRMATION');
  assert.deepEqual(list.items[0]?.workflow.availableActions, ['SUBMIT']);
  assert.equal(result.workflow.history[0]?.occurredAt, '2026-08-21T05:00:00.000Z');
  assert.equal(result.corrections[0]?.target.code, 'COL-01');
  assert.equal(result.financial.feePolicyVersion, 'GORUT-PLPK-FEE-V1-PROVISIONAL');
  assert.equal(calls[0], '/api/gorut/packages?page=1&pageSize=10&period=2026-08&state=DRAFT');
  assert.equal(calls[1], '/api/gorut/packages/GPK-202608-KEC-01');
});

void test('PC queue uses authoritative server state filters for waiting and final history', async () => {
  const calls: string[] = [];
  const client = new GorutPackageApiClient(async (input) => {
    calls.push(String(input));
    const final = String(input).includes('FINAL_APPROVED');
    return json({ items: [summary({ workflow: { currentState: final ? 'FINAL_APPROVED' : 'WAITING_PC_APPROVAL', version: 3, availableActions: final ? [] : ['APPROVE'], blockingReasons: [] } })], page: 1, pageSize: 100, total: 1 });
  });
  const result = await client.list({ page: 1, pageSize: 100, states: ['WAITING_PC_APPROVAL', 'FINAL_APPROVED'] });
  assert.deepEqual(calls, ['/api/gorut/packages?page=1&pageSize=100&state=WAITING_PC_APPROVAL', '/api/gorut/packages?page=1&pageSize=100&state=FINAL_APPROVED']);
  assert.equal(result.total, 2);
  assert.equal(result.items.length, 2);
});

void test('settlement and validation commands send only factual client fields and authoritative concurrency controls', async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  let uuid = 0;
  const client = new GorutPackageApiClient(async (input, init) => {
    calls.push({ url: String(input), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    return json({ ok: true });
  }, () => `pc-uuid-${++uuid}`);
  await client.settlement('GPK-1', { mode: 'PC_PICKUP', actualAmount: '27000.00', occurredAt: '2026-08-22T03:00:00.000Z', handedOverByMemberId: 'PID-UPZIS-1', evidenceReference: 'BA-01', expectedVersion: 7 }, 'pickup');
  await client.validation('GPK-1', { settlementEvidenceCode: 'GPK-1-SET-001', note: 'Bukti diperiksa', expectedVersion: 8 }, 'validation');
  assert.equal(calls[0]?.url, '/api/gorut/packages/GPK-1/settlements');
  assert.equal(calls[1]?.url, '/api/gorut/packages/GPK-1/validations');
  assert.equal(calls[0]?.body.actualAmount, '27000.00');
  assert.equal(calls[0]?.body.handedOverByMemberId, 'PID-UPZIS-1');
  assert.equal(calls[1]?.body.settlementEvidenceCode, 'GPK-1-SET-001');
  for (const { body } of calls) {
    assert.equal('expectedAmount' in body, false);
    assert.equal('difference' in body, false);
    assert.equal('result' in body, false);
    assert.equal('validatorId' in body, false);
    assert.equal('pcActorId' in body, false);
    assert.equal('toState' in body, false);
    assert.equal(typeof body.idempotencyKey, 'string');
  }
});

void test('network retry for PC evidence command reuses the same intent key', async () => {
  const keys: unknown[] = [];
  let attempt = 0;
  const client = new GorutPackageApiClient(async (_input, init) => {
    keys.push((JSON.parse(String(init?.body)) as Record<string, unknown>).idempotencyKey);
    attempt += 1;
    if (attempt === 1) throw new TypeError('timeout');
    return json({ ok: true });
  }, () => 'stable-pickup-key');
  const command = { mode: 'PC_PICKUP' as const, actualAmount: '27500.00', occurredAt: '2026-08-22T03:00:00.000Z', handedOverByMemberId: 'PID-UPZIS-1', expectedVersion: 7 };
  await assert.rejects(client.settlement('GPK-1', command, 'pickup-intent'), { code: 'NETWORK_ERROR' });
  await client.settlement('GPK-1', command, 'pickup-intent');
  assert.deepEqual(keys, ['stable-pickup-key', 'stable-pickup-key']);
});

void test('settlement participant lookup returns public member codes without internal identifiers', async () => {
  const client = new GorutPackageApiClient(async () => json({ packageCode: 'GPK-1', items: [{ memberId: 'PID-UPZIS-1', name: 'Petugas UPZIS' }] }));
  const result = await client.settlementParticipants('GPK-1');
  assert.deepEqual(result.items[0], { memberId: 'PID-UPZIS-1', name: 'Petugas UPZIS' });
  assert.equal('id' in result.items[0]!, false);
});

void test('SUBMIT, APPROVE, RETURN, and resubmit send expectedVersion plus idempotency without server-owned facts', async () => {
  const bodies: Array<Record<string, unknown>> = [];
  let uuid = 0;
  const client = new GorutPackageApiClient(async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return json({ packageCode: 'GPK-1' });
  }, () => `uuid-${++uuid}`);
  await client.transition('GPK-1', { action: 'SUBMIT', expectedVersion: 1 }, 'package:GPK-1:SUBMIT');
  await client.transition('GPK-1', { action: 'APPROVE', expectedVersion: 2 }, 'package:GPK-1:APPROVE');
  await client.transition('GPK-1', { action: 'RETURN', expectedVersion: 2, reasonCode: 'AMOUNT_MISMATCH', reason: null, correctionTargets: [{ targetType: 'COLLECTION', targetCode: 'COL-1' }] }, 'package:GPK-1:RETURN');
  await client.transition('GPK-1', { action: 'SUBMIT', expectedVersion: 3, resolvedCorrectionCodes: ['COR-1'], resolutionNote: 'Reverified' }, 'package:GPK-1:SUBMIT');
  assert.deepEqual(bodies.map((body) => body.idempotencyKey), ['uuid-1', 'uuid-2', 'uuid-3', 'uuid-4']);
  assert.deepEqual(bodies[2]?.correctionTargets, [{ targetType: 'COLLECTION', targetCode: 'COL-1' }]);
  assert.deepEqual(bodies[3]?.resolvedCorrectionCodes, ['COR-1']);
  for (const body of bodies) {
    assert.equal('packageCode' in body, false);
    assert.equal('packageState' in body, false);
    assert.equal('grossAmount' in body, false);
    assert.equal('netAmount' in body, false);
    assert.equal('actorId' in body, false);
    assert.equal('timestamp' in body, false);
  }
});

void test('network and 5xx retry reuse a key while success and definitive failure create a new intent key', async () => {
  const bodies: Array<Record<string, unknown>> = [];
  let attempt = 0;
  let uuid = 0;
  const client = new GorutPackageApiClient(async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    attempt += 1;
    if (attempt === 1) throw new TypeError('offline');
    if (attempt === 3) return json({ error: 'temporary' }, 503);
    if (attempt === 6) return json({ error: 'blocked', code: 'PACKAGE_GATE_BLOCKED' }, 422);
    return json({ packageCode: 'GPK-1' });
  }, () => `uuid-${++uuid}`);
  const command = { action: 'SUBMIT' as const, expectedVersion: 1 };
  await assert.rejects(client.transition('GPK-1', command, 'submit'), { code: 'NETWORK_ERROR' });
  await client.transition('GPK-1', command, 'submit');
  assert.equal(bodies[0]?.idempotencyKey, bodies[1]?.idempotencyKey);
  await assert.rejects(client.transition('GPK-1', command, 'submit'), { status: 503 });
  await client.transition('GPK-1', command, 'submit');
  assert.equal(bodies[2]?.idempotencyKey, bodies[3]?.idempotencyKey);
  assert.notEqual(bodies[1]?.idempotencyKey, bodies[2]?.idempotencyKey);
  await client.transition('GPK-1', command, 'submit');
  await assert.rejects(client.transition('GPK-1', command, 'submit'), { status: 422 });
  await client.transition('GPK-1', command, 'submit');
  assert.notEqual(bodies[5]?.idempotencyKey, bodies[6]?.idempotencyKey);
});

void test('canonical refetch occurs after success and on 409 without transition auto-retry', async () => {
  let mutations = 0;
  let refetches = 0;
  const canonical = detail();
  await executeWithCanonicalPackageRefetch(async () => { mutations += 1; }, async () => { refetches += 1; return canonical; });
  assert.equal(mutations, 1);
  assert.equal(refetches, 1);
  await assert.rejects(executeWithCanonicalPackageRefetch(async () => {
    mutations += 1;
    throw new PackageApiError('conflict', 409, 'PACKAGE_VERSION_CONFLICT');
  }, async () => { refetches += 1; return canonical; }), { code: 'PACKAGE_VERSION_CONFLICT' });
  assert.equal(mutations, 2);
  assert.equal(refetches, 2);
});

void test('403, 404, 409, 422, and network failures have explicit UI semantics', async () => {
  const cases = [
    [403, 'PACKAGE_ACCESS_DENIED', /tidak memiliki akses/],
    [404, 'PACKAGE_NOT_FOUND', /tidak tersedia atau tidak ditemukan/],
    [409, 'PACKAGE_VERSION_CONFLICT', /berubah di server/],
    [422, 'PACKAGE_GATE_BLOCKED', /Financial belum siap/],
  ] as const;
  for (const [status, code, message] of cases) {
    const client = new GorutPackageApiClient(async () => json({ error: status === 422 ? 'Financial belum siap.' : 'server', code }, status), () => 'uuid');
    const error = await client.detail('GPK-1').catch((caught) => caught);
    assert.ok(error instanceof PackageApiError);
    assert.match(packageErrorMessage(error), message);
  }
  const offline = new GorutPackageApiClient(async () => { throw new TypeError('offline'); }, () => 'uuid');
  assert.match(packageErrorMessage(await offline.list().catch((caught) => caught)), /Periksa jaringan/);
  assert.deepEqual(packageErrorBlockingReasons(new PackageApiError('blocked', 422, 'PACKAGE_GATE_BLOCKED', { blockingReasons: ['PACKAGE_FINANCIAL_NOT_READY'] })), ['PACKAGE_FINANCIAL_NOT_READY']);
});

void test('financial presentation keeps decimal strings server-derived and BLOCKED amounts empty', () => {
  const ready = summary();
  assert.equal(formatCanonicalRupiah('12345678901234567.00'), 'Rp12.345.678.901.234.567');
  assert.equal(packageFinancialLabel(ready, 'grossAmount'), 'Rp30.000');
  assert.equal(packageFinancialLabel(ready, 'totalPlpkFee'), 'Rp5.000');
  assert.equal(packageFinancialLabel(ready, 'netAmount'), 'Rp25.000');
  const blocked = summary({ financial: { ...ready.financial, status: 'BLOCKED', blockingReasons: ['PACKAGE_FINANCIAL_NOT_READY'], grossAmount: null, totalPlpkFee: null, netAmount: null } });
  assert.equal(packageFinancialLabel(blocked, 'grossAmount'), 'Belum siap');
  assert.equal(packageFinancialLabel(blocked, 'totalPlpkFee'), 'Belum siap');
  assert.equal(packageFinancialLabel(blocked, 'netAmount'), 'Belum siap');
});

void test('availableActions, maker-checker blocker, and RETURN input rules stay server-led', () => {
  const source = summary();
  assert.equal(packageHasAction(source, 'SUBMIT'), true);
  assert.equal(packageHasAction(source, 'APPROVE'), false);
  const maker = summary({ workflow: { currentState: 'WAITING_UPZIS_VERIFICATION', version: 4, availableActions: ['RETURN'], blockingReasons: ['MAKER_CHECKER_REQUIRED'] } });
  assert.equal(packageHasAction(maker, 'APPROVE'), false);
  assert.ok(maker.workflow.blockingReasons.includes('MAKER_CHECKER_REQUIRED'));
  assert.match(validatePackageReturnForm('AMOUNT_MISMATCH', '', 0)!, /minimal satu target/);
  assert.match(validatePackageReturnForm('OTHER', ' ', 1)!, /wajib/);
  assert.equal(validatePackageReturnForm('OTHER', 'Penjelasan factual', 1), null);
});

void test('server mode is default; demo, local state, and localStorage remain isolated', async () => {
  assert.equal(resolvePackageFrontendMode(), 'server');
  assert.equal(resolvePackageFrontendMode('server'), 'server');
  assert.equal(resolvePackageFrontendMode('demo'), 'demo');
  const [client, hook, shell, detailSource, route, demo] = await Promise.all([
    readFile(new URL('./package-api-client.ts', import.meta.url), 'utf8'),
    readFile(new URL('./use-package-api.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/upzis/upzis-package-shell.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/upzis/upzis-package-detail.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/gorut-v2/penghimpunan/verifikasi-upzis/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/upzis/upzis-shell.tsx', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(`${client}\n${hook}\n${shell}\n${detailSource}`, /localStorage|gorutUpzisRecaps|setRecaps|totalCollected\s*-/);
  assert.match(route, /resolvePackageFrontendMode\(\) === 'demo'/);
  assert.match(demo, /gorutUpzisRecaps/);
  assert.match(hook, /executeWithCanonicalPackageRefetch/);
  assert.doesNotMatch(hook, /setDetail\([^)]*currentState|setPackages\([^)]*currentState/);
  assert.match(shell, /workflow\.availableActions/);
  assert.doesNotMatch(shell, /currentState\s*===\s*['"]DRAFT['"].*button|new Date\(\).*workflow/);
  assert.match(detailSource, /detail\.workflow\.availableActions\.map/);
  assert.match(detailSource, /detail\.workflow\.history/);
  assert.match(detailSource, /detail\.corrections/);
  assert.doesNotMatch(`${shell}\n${detailSource}`, /FINAL_CLOSE|REJECT.*onTransition|F\.016.*onTransition|SUBMIT_PACKAGE/);
});

void test('package detail public model has codes and facts without database ids', () => {
  const canonical = detail();
  assert.equal('id' in canonical.identity, false);
  assert.equal('id' in canonical.transactions.items[0]!, false);
  assert.equal('id' in canonical.transactions.items[0]!.collectionSource!, false);
  assert.equal(canonical.transactions.items[0]!.transactionCode, 'TRX-01');
  assert.equal(canonical.transactions.items[0]!.collectionSource?.collectionCode, 'COL-01');
});

void test('signed server difference presentation preserves mismatch direction', () => {
  assert.equal(formatSignedCanonicalRupiah('-500.00'), '-Rp500');
  assert.equal(formatSignedCanonicalRupiah('500.00'), '+Rp500');
  assert.equal(formatSignedCanonicalRupiah('0.00'), 'Rp0');
});

void test('PC cutover routes use package workspace without mock or localStorage fallback', async () => {
  const [workspace, setoran, validasi, approval] = await Promise.all([
    readFile(new URL('../../components/gorut-v2/pc/pc-package-workspace.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/setoran/setoran-shell.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/validation/validation-shell.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../components/gorut-v2/approval/approval-shell.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(setoran, /PcPackageWorkspace mode="setoran"/);
  assert.match(validasi, /PcPackageWorkspace mode="validasi"/);
  assert.match(approval, /PcPackageWorkspace mode="approval"/);
  assert.match(workspace, /settlement\.availableActions\.includes\('RECORD_PC_PICKUP'\)/);
  assert.match(workspace, /validation\.availableActions\.includes\('VALIDATE_SETTLEMENT'\)/);
  assert.match(workspace, /workflow\.availableActions\.includes\('APPROVE'\)/);
  assert.match(workspace, /executeSettlement/);
  assert.match(workspace, /executeValidation/);
  assert.match(workspace, /executeTransition/);
  assert.doesNotMatch(workspace, /localStorage|mock-data|setDetail\([^)]*FINAL_APPROVED|setPackages\([^)]*MATCHED/);
  assert.doesNotMatch(workspace, /onReturn|action:\s*'RETURN'|>\s*(?:FINAL_CLOSE|REJECT|RETURN)\s*</);
});
