'use client'

import { useEffect, useState } from 'react'

export type GorutReportGroup = {
  id: string
  code: string
  name: string
  kecamatan?: string
  ranting?: string
  totalAmount: number
  transactionCount: number
  munfiqCount: number
}

export type GorutReportTransaction = {
  id: string
  transactionCode: string
  transactionDate: string
  totalAmount: number
  upzis: string
  kecamatan: string
  ranting: string
  plpk: string
  munfiqCount: number
}

export type GorutRekapDanaItem = {
  id: string
  scopeLevel: string
  totalAmount: number
  transactionCount: number
  periodStart: string
  periodEnd: string
  status: string
  notes?: string | null
}

export type GorutLaporanSummary = {
  period: { month: string; label: string; start: string; end: string }
  headline: {
    totalPenghimpunan: number
    totalTransaksiSelesai: number
    totalMunfiqBerkontribusi: number
  }
  availableKecamatan: string[]
  perUpzis: GorutReportGroup[]
  perRanting: GorutReportGroup[]
  perPlpk: GorutReportGroup[]
  transactions: GorutReportTransaction[]
  rekapScope: { scopeLevel: string; gorutUpzisId?: string | null; gorutRantingId?: string | null } | null
  rekapDana: GorutRekapDanaItem[]
}

const emptySummary: GorutLaporanSummary = {
  period: { month: 'mei-2026', label: 'Mei 2026', start: '', end: '' },
  headline: { totalPenghimpunan: 0, totalTransaksiSelesai: 0, totalMunfiqBerkontribusi: 0 },
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

export async function fetchGorutLaporanSummary(month: string, kecamatan: string) {
  const params = new URLSearchParams({ month, kecamatan })
  const response = await fetch(`/api/gorut/reports?${params.toString()}`, { cache: 'no-store' })
  if (!response.ok) throw await readError(response, 'Gagal membaca laporan GORUT.')

  laporanCache = await response.json() as GorutLaporanSummary
  emitLaporanUpdated()
  return laporanCache
}

export function useGorutLaporanSummary(month: string, kecamatan: string) {
  const [summary, setSummary] = useState<GorutLaporanSummary>(laporanCache)

  useEffect(() => {
    let cancelled = false

    const sync = () => {
      if (!cancelled) setSummary(laporanCache)
    }

    window.addEventListener(GORUT_LAPORAN_EVENT, sync)
    void fetchGorutLaporanSummary(month, kecamatan).catch(() => {
      if (!cancelled) setSummary(laporanCache)
    })

    return () => {
      cancelled = true
      window.removeEventListener(GORUT_LAPORAN_EVENT, sync)
    }
  }, [kecamatan, month])

  return summary
}

export async function generateGorutRekapDana(month: string) {
  const response = await fetch('/api/gorut/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generate', month }),
  })
  if (!response.ok) throw await readError(response, 'Gagal generate Rekap Dana GORUT.')
}

export async function refreshGorutRekapDana(rekapDanaId: string) {
  const response = await fetch('/api/gorut/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'refresh', rekapDanaId }),
  })
  if (!response.ok) throw await readError(response, 'Gagal refresh Rekap Dana GORUT.')
}
