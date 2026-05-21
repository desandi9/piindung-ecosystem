'use client'

import { createCollectionClient, createSingletonClient } from '@/services/api/record-client'
import { backupDataList } from '@/lib/gorut/data'
import type { BackupData } from '@/lib/gorut/types'

export interface GorutBackupSettings {
  autoBackup: boolean
  backupSchedule: 'daily' | 'weekly' | 'monthly'
}

export const DEFAULT_GORUT_BACKUP_SETTINGS: GorutBackupSettings = {
  autoBackup: true,
  backupSchedule: 'daily',
}

export const GORUT_BACKUP_SETTINGS_EVENT = 'gorut-backup-settings-updated'
export const GORUT_BACKUP_HISTORY_EVENT = 'gorut-backup-history-updated'

const gorutBackupSettingsClient = createSingletonClient<GorutBackupSettings>({
  scope: 'gorut-backup-settings',
  defaultValue: DEFAULT_GORUT_BACKUP_SETTINGS,
  eventName: GORUT_BACKUP_SETTINGS_EVENT,
})

const gorutBackupHistoryClient = createCollectionClient<BackupData>({
  scope: 'gorut-backup-history',
  defaultItems: backupDataList,
  eventName: GORUT_BACKUP_HISTORY_EVENT,
  sort: (items) => [...items].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()),
})

export function useGorutBackupSettings() {
  return gorutBackupSettingsClient.useValue()
}

export async function writeGorutBackupSettings(settings: GorutBackupSettings) {
  return gorutBackupSettingsClient.writeValue(settings)
}

export function useGorutBackupHistory() {
  return gorutBackupHistoryClient.useItems()
}

export async function createGorutBackupHistoryItem(item: BackupData) {
  return gorutBackupHistoryClient.createItem(item)
}
