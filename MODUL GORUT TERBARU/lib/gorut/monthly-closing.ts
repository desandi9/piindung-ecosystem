'use client'

import { createCollectionClient } from '@/services/api/record-client'

export type GorutClosingVerdict = 'siap-publikasi' | 'butuh-tindak-lanjut'

export interface GorutClosingRecord {
  id: string
  month: string
  area: string
  closedAt: string
  verdict: GorutClosingVerdict
  note: string
}

export const GORUT_MONTHLY_CLOSING_EVENT = 'gorut-monthly-closing-updated'

const gorutMonthlyClosingClient = createCollectionClient<GorutClosingRecord>({
  scope: 'gorut-monthly-closing',
  defaultItems: [],
  eventName: GORUT_MONTHLY_CLOSING_EVENT,
  sort: (items) => [...items].sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()),
})

export function useGorutMonthlyClosingRecords() {
  return gorutMonthlyClosingClient.useItems()
}

export async function writeGorutMonthlyClosingRecords(items: GorutClosingRecord[]) {
  return gorutMonthlyClosingClient.writeItems(items)
}
