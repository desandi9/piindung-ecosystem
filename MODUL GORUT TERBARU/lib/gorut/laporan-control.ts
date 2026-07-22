'use client'

import { useEffect, useState } from 'react'

export type GorutReportGroup = {
  id: string
  code: string
  name: string
  kecamatan?: string
  ranting?: string
  totalAmount: string
  transactionCount: number
  munfiqCount: number | null
}

export type GorutReportTransaction = {
  id: string
  transactionCode: string
  transactionDate: string
  totalAmount: string
  upzis: string
  kecamatan: string
  ranting: string
  plpk: string
  munfiqCount: number
}

export type GorutRekapDanaItem = {
  id: string
  scopeLevel: string
  totalAmount: string
  transactionCount: number
  periodStart: string
  periodEnd: string
  status: string
  notes?: string | null
}

export type GorutLaporanSummary = {
  period: { month: string; label: string; start: string; end: string }
  headline: {
    totalPenghimpunan: string
    totalTransaksiSelesai: number
    totalMunfiqBerkontribusi: number
  }
  availableKecamatan: Array<{ id: string; name: string }>
  perUpzis: GorutReportGroup[]
  perRanting: GorutReportGroup[]
  perPlpk: GorutReportGroup[]
  transactions: GorutReportTransaction[]
  rekapScope: { scopeLevel: string; gorutUpzisId?: string | null; gorutRantingId?: string | null } | null
  rekapDana: GorutRekapDanaItem[]
}

const emptySummary: GorutLaporanSummary = {
  period: { month: 'mei-2026', label: 'Mei 2026', start: '', end: '' },
  headline: { totalPenghimpunan: '0', totalTransaksiSelesai: 0, totalMunfiqBerkontribusi: 0 },
  availableKecamatan: [],
  perUpzis: [],
  perRanting: [],
  perPlpk: [],
  transactions: [],
  rekapScope: null,
  rekapDana: [],
}

export const GORUT_LAPORAN_EVENT = 'gorut-laporan-updated'

let laporanCache: GorutLaporanSummary = emptySummary

function emitLaporanUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GORUT_LAPORAN_EVENT))
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null)
  return new Error(body?.error ?? fallback)
}

export async function fetchGorutLaporanSummary(month: string, kecamatan: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ month })
  if (kecamatan !== 'semua') params.set('kecamatan', kecamatan)
  const response = await fetch(`/api/gorut/reports?${params.toString()}`, { cache: 'no-store', signal })
  if (!response.ok) throw await readError(response, 'Gagal membaca laporan GORUT.')

  laporanCache = await response.json() as GorutLaporanSummary
  emitLaporanUpdated()
  return laporanCache
}

export function useGorutLaporanSummary(month: string, kecamatan: string) {
  const [summary, setSummary] = useState<GorutLaporanSummary>(laporanCache)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const sync = () => {
      if (!cancelled) setSummary(laporanCache)
    }

    window.addEventListener(GORUT_LAPORAN_EVENT, sync)
    void fetchGorutLaporanSummary(month, kecamatan, controller.signal).catch((cause) => {
      if ((cause as Error).name !== 'AbortError' && !cancelled) setError(cause instanceof Error ? cause.message : 'Gagal membaca laporan.')
    }).finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      controller.abort()
      window.removeEventListener(GORUT_LAPORAN_EVENT, sync)
    }
  }, [kecamatan, month])

  return { summary, loading, error }
}

export async function generateGorutRekapDana(_: string) { throw new Error('Generate Rekap Dana dinonaktifkan: laporan bersifat read-only pada batch ini.') }
export async function refreshGorutRekapDana(_: string) { throw new Error('Refresh Rekap Dana dinonaktifkan: laporan bersifat read-only pada batch ini.') }
