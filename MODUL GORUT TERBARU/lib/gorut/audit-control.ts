'use client'

import { createCollectionClient } from '@/services/api/record-client'
import { auditLogs } from '@/lib/gorut/data'
import type { AuditLog } from '@/lib/gorut/types'

export const GORUT_AUDIT_EVENT = 'gorut-audit-log-updated'

const gorutAuditClient = createCollectionClient<AuditLog>({
  scope: 'gorut-audit-log',
  defaultItems: auditLogs,
  eventName: GORUT_AUDIT_EVENT,
  sort: (items) => [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
})

export function useGorutAuditLogs() {
  return gorutAuditClient.useItems()
}

export async function refreshGorutAuditLogs() {
  return gorutAuditClient.readItems()
}

export async function updateGorutAuditLog(id: string, updates: Partial<AuditLog>) {
  return gorutAuditClient.updateItem(id, updates)
}
