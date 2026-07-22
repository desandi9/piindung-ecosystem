import assert from 'node:assert/strict'
import test from 'node:test'
import { isPlpkOperationalRole, normalizePlpkDashboardRows, type PlpkDashboardPayload } from './plpk-dashboard-control.ts'

void test('plpk dashboard recognizes only the PLPK operational role', () => {
  assert.equal(isPlpkOperationalRole('plpk'), true)
  assert.equal(isPlpkOperationalRole('admin_upzis'), false)
  assert.equal(isPlpkOperationalRole(undefined), false)
  assert.equal(isPlpkOperationalRole(null), false)
})

void test('plpk dashboard normalizes transaction amounts without mutating input rows', () => {
  const payload: PlpkDashboardPayload = {
    profile: { name: 'A', phone: '1', plpk: null },
    summary: { totalMunfiq: 1, setoranBulanIni: '1000', transaksiPending: 0, transaksiSelesai: 1 },
    munfiq: [{ id: '1', munfiqCode: 'M-1', name: 'Munfiq', status: 'Aktif' }],
    transactions: [{ id: 'T-1', transactionCode: 'TR-1', transactionDate: '2026-07-23', currentState: 'DRAFT', totalAmount: '25000' }],
  }

  const normalized = normalizePlpkDashboardRows(payload)
  assert.notEqual(normalized, payload)
  assert.notEqual(normalized.munfiq[0], payload.munfiq[0])
  assert.equal(normalized.transactions[0].totalAmount, '25000')
})
