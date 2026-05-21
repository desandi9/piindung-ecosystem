import { createSingletonClient } from '@/services/api/record-client'

export const SYSTEM_SETTINGS_STORAGE_KEY = 'gorut-system-settings'
export const GORUT_SYSTEM_SETTINGS_EVENT = 'gorut-system-settings-updated'

export type SystemSettingsState = {
  orgName: string
  orgShortName: string
  orgAddress: string
  orgPhone: string
  orgEmail: string
  logoSrc: string
  trxPrefix: string
  trxFormat: string
  notifSetoran: boolean
  notifValidasi: boolean
  notifReminder: boolean
  reminderDays: string
  waGatewayUrl: string
  waApiKey: string
}

export const defaultSystemSettings: SystemSettingsState = {
  orgName: 'Gerakan Koin Infak NU Garut',
  orgShortName: 'GORUT',
  orgAddress: 'Jl. Ahmad Yani No. 1, Garut',
  orgPhone: '0262-123456',
  orgEmail: 'gorut@nugarut.or.id',
  logoSrc: '/gorut-logo.png',
  trxPrefix: 'TRX',
  trxFormat: 'prefix-date-sequence',
  notifSetoran: true,
  notifValidasi: true,
  notifReminder: true,
  reminderDays: '30',
  waGatewayUrl: 'https://wa-gateway.gorut.id',
  waApiKey: '••••••••••••••••',
}

const gorutSystemSettingsClient = createSingletonClient<SystemSettingsState>({
  scope: SYSTEM_SETTINGS_STORAGE_KEY,
  defaultValue: defaultSystemSettings,
  eventName: GORUT_SYSTEM_SETTINGS_EVENT,
})

export function loadSystemSettings() {
  return gorutSystemSettingsClient.readValueSync()
}

export function saveSystemSettings(value: SystemSettingsState) {
  return gorutSystemSettingsClient.writeValue(value)
}

export function useGorutSystemSettings() {
  return gorutSystemSettingsClient.useValue()
}
