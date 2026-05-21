'use client'

import { createCollectionClient } from '@/services/api/record-client'
import { transactionData } from '@/lib/gorut/data'
import type { Transaction } from '@/lib/gorut/types'

export const GORUT_TRANSAKSI_EVENT = 'gorut-transaksi-updated'

const gorutTransaksiClient = createCollectionClient<Transaction>({
  scope: 'gorut-transaksi',
  defaultItems: transactionData,
  eventName: GORUT_TRANSAKSI_EVENT,
  sort: (items) => [...items].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()),
})

export function useGorutTransactions() {
  return gorutTransaksiClient.useItems()
}

export function readGorutTransactions() {
  return gorutTransaksiClient.readItemsSync()
}

export async function writeGorutTransactions(items: Transaction[]) {
  return gorutTransaksiClient.writeItems(items)
}
