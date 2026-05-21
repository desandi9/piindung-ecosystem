'use client'

import { createCollectionClient } from '@/services/api/record-client'
import { munfiqDataList } from '@/lib/gorut/data'
import type { MunfiqData } from '@/lib/gorut/types'

export const GORUT_MUNFIQ_EVENT = 'gorut-munfiq-updated'

const gorutMunfiqClient = createCollectionClient<MunfiqData>({
  scope: 'gorut-munfiq',
  defaultItems: munfiqDataList,
  eventName: GORUT_MUNFIQ_EVENT,
  sort: (items) => [...items].sort((a, b) => {
    const aReg = a.tglRegistrasi ? new Date(a.tglRegistrasi).getTime() : 0
    const bReg = b.tglRegistrasi ? new Date(b.tglRegistrasi).getTime() : 0
    return bReg - aReg
  }),
})

export function useGorutMunfiqItems() {
  return gorutMunfiqClient.useItems()
}

export function readGorutMunfiqItems() {
  return gorutMunfiqClient.readItemsSync()
}

export async function writeGorutMunfiqItems(items: MunfiqData[]) {
  return gorutMunfiqClient.writeItems(items)
}
