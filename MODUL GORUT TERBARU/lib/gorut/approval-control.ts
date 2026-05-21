'use client'

import { createCollectionClient } from '@/services/api/record-client'
import { approvalTransactionData } from '@/lib/gorut/data'
import type { ApprovalTransaction } from '@/lib/gorut/types'

export const GORUT_APPROVAL_EVENT = 'gorut-approval-workflow-updated'

const gorutApprovalClient = createCollectionClient<ApprovalTransaction>({
  scope: 'gorut-approval-workflow',
  defaultItems: approvalTransactionData,
  eventName: GORUT_APPROVAL_EVENT,
  sort: (items) => [...items].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()),
})

export function useGorutApprovalTransactions() {
  return gorutApprovalClient.useItems()
}

export function readGorutApprovalTransactions() {
  return gorutApprovalClient.readItemsSync()
}

export async function writeGorutApprovalTransactions(items: ApprovalTransaction[]) {
  return gorutApprovalClient.writeItems(items)
}
