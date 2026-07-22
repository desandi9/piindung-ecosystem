'use client'

import { useEffect, useState } from 'react'
import type { Transaction } from '@/lib/gorut/types'

type TransactionApiRow = {
  id: string
  transactionCode: string
  transactionDate: string
  totalAmount: string
  currentState: string
  kecamatan: string
}

type TransactionApiPayload = { items?: TransactionApiRow[]; transactions?: TransactionApiRow[] }

export const GORUT_TRANSAKSI_EVENT = 'gorut-transaksi-updated'

let transactionCache: Transaction[] = []

function mapTransaction(item: TransactionApiRow): Transaction {
  return {
    id: item.id,
    kode: item.transactionCode,
    tanggal: item.transactionDate,
    munfiqNama: '',
    munfiqId: '',
    nominal: Number(item.totalAmount),
    metodePembayaran: 'tunai',
    status: item.currentState === 'FINAL_APPROVED' ? 'valid' : item.currentState === 'REJECTED' ? 'invalid' : 'pending',
    kecamatan: item.kecamatan,
  }
}

export function useGorutTransactions() {
  const [items, setItems] = useState<Transaction[]>(transactionCache)

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/gorut/transactions', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as TransactionApiPayload | null
        if (!response.ok) throw new Error((body as { error?: string } | null)?.error ?? 'Gagal membaca data transaksi.')
        transactionCache = (body?.items ?? body?.transactions ?? []).map(mapTransaction)
        setItems(transactionCache)
      })
      .catch((cause) => {
        if ((cause as Error).name !== 'AbortError') window.dispatchEvent(new CustomEvent(GORUT_TRANSAKSI_EVENT, { detail: { error: cause instanceof Error ? cause.message : 'Gagal membaca data transaksi.' } }))
      })
    return () => controller.abort()
  }, [])

  return items
}

export function readGorutTransactions() { return transactionCache }
export async function writeGorutTransactions(_: Transaction[]) { throw new Error('Data transaksi bersifat read-only pada batch ini.') }
