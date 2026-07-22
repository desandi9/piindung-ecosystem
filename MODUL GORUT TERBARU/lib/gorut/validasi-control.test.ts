import assert from 'node:assert/strict'
import test from 'node:test'
import { getGorutVerificationPolicyError, isValidasiWorkflowAction, isValidasiWorkflowStage, type ValidasiRow } from './validasi-control'

const pendingRanting: Pick<ValidasiRow, 'validasi' | 'workflowStage'> = { validasi: 'pending', workflowStage: 'ranting' }
const pendingPc: Pick<ValidasiRow, 'validasi' | 'workflowStage'> = { validasi: 'pending', workflowStage: 'pc' }

void test('supported workflow stages are ranting, upzis, and pc', () => {
  assert.equal(isValidasiWorkflowStage('ranting'), true)
  assert.equal(isValidasiWorkflowStage('upzis'), true)
  assert.equal(isValidasiWorkflowStage('pc'), true)
})

void test('approve is accepted for the correct pending stage', () => {
  assert.equal(getGorutVerificationPolicyError(pendingRanting, { action: 'approve', stage: 'ranting' }), undefined)
})

void test('return is accepted for the correct stage', () => {
  assert.equal(getGorutVerificationPolicyError(pendingRanting, { action: 'return', stage: 'ranting' }), undefined)
})

void test('reject is accepted when currently supported', () => {
  assert.equal(getGorutVerificationPolicyError(pendingRanting, { action: 'reject', stage: 'ranting' }), undefined)
})

void test('final_close is accepted only for the valid final stage', () => {
  assert.equal(getGorutVerificationPolicyError(pendingPc, { action: 'final_close', stage: 'pc' }), undefined)
  assert.equal(getGorutVerificationPolicyError(pendingRanting, { action: 'final_close', stage: 'ranting' }), 'Final close hanya tersedia pada tahap PC.')
})

void test('invalid workflow stage is rejected', () => {
  assert.equal(getGorutVerificationPolicyError(pendingRanting, { action: 'approve', stage: 'invalid' }), 'Tahap validasi tidak valid.')
})

void test('invalid action is rejected', () => {
  assert.equal(isValidasiWorkflowAction('invalid'), false)
  assert.equal(getGorutVerificationPolicyError(pendingRanting, { action: 'invalid', stage: 'ranting' }), 'Aksi validasi tidak valid.')
})

void test('non-pending row cannot be processed', () => {
  assert.equal(getGorutVerificationPolicyError({ validasi: 'valid', workflowStage: 'ranting' }, { action: 'approve', stage: 'ranting' }), 'Data validasi sudah diproses.')
})

void test('workflow-stage mismatch is rejected', () => {
  assert.equal(getGorutVerificationPolicyError(pendingRanting, { action: 'approve', stage: 'upzis' }), 'Data bukan bagian dari tahap validasi ini.')
})

void test('unknown row ID returns a safe failure', () => {
  assert.equal(getGorutVerificationPolicyError(undefined, { action: 'approve', stage: 'ranting' }), 'Data validasi tidak ditemukan.')
})

void test('policy validation causes no unrelated data mutation', () => {
  const row = { ...pendingRanting }
  const untouched = { validasi: 'pending' as const, workflowStage: 'pc' as const }
  getGorutVerificationPolicyError(row, { action: 'approve', stage: 'ranting' })
  assert.deepEqual(row, pendingRanting)
  assert.deepEqual(untouched, pendingPc)
})
