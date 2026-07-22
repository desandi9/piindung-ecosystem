import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getActivityMonitoringEventType,
  getNotificationMonitoringEventType,
  SETORAN_KOIN_EXPORT_FORMATS,
} from './analytics'

test('setoran koin export policy only permits Excel', () => {
  assert.deepEqual(SETORAN_KOIN_EXPORT_FORMATS, ['excel'])
})

test('activity monitoring event categories are explicit', () => {
  assert.equal(getActivityMonitoringEventType('login'), 'success')
  assert.equal(getActivityMonitoringEventType('validasi'), 'success')
  assert.equal(getActivityMonitoringEventType('settings'), 'info')
  assert.equal(getActivityMonitoringEventType('setoran'), 'warning')
})

test('notification monitoring event categories are explicit', () => {
  assert.equal(getNotificationMonitoringEventType('critical'), 'error')
  assert.equal(getNotificationMonitoringEventType('warning'), 'warning')
  assert.equal(getNotificationMonitoringEventType('normal'), 'info')
})
