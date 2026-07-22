'use client'

import { useEffect, useState } from 'react'
import type { MonitoringEvent, MonitoringMetric } from '@/lib/gorut/analytics'

export type MonitoringStatusDistribution = {
  state: string
  label: string
  count: number
  amount: string
}

export type MonitoringProgressItem = {
  id: string
  code: string
  name: string
  kecamatan?: string
  ranting?: string
  munfiqCount: number
  finalApprovedAmount: string | null
  finalApprovedCount: number | null
  pendingCount: number | null
  returnedRejectedCount: number | null
  targetBulanan?: string | null
  progress: number | null
}

export type MonitoringReturnedRejectedTransaction = {
  id: string
  transactionCode: string
  currentState: string
  totalAmount: string
  transactionDate: string
  kecamatan: string
  ranting: string
  plpk: string
}

export type GorutMonitoringSnapshot = {
  metrics: MonitoringMetric[] | null
  api: { responseTime: number; uptime: number; errorRate: number } | null
  database: { connectionPool: string; queryTime: number; replicationLag: number } | null
  gateway: { status: 'online' | 'warning' | 'offline'; messagesSent24h: number; failedMessages: number; lastSyncMinutes: number } | null
  recentEvents: MonitoringEvent[] | null
  statusDistribution: MonitoringStatusDistribution[]
  pendingByStage: Array<{ state: string; label: string; count: number }>
  plpkPerformance: MonitoringProgressItem[] | null
  upzisProgress: MonitoringProgressItem[] | null
  rantingProgress: MonitoringProgressItem[] | null
  finalApprovedTotals: {
    totalAmount: string
    transactionCount: number
    currentMonthAmount: string
    currentMonthTransactionCount: number
  }
  returnedRejectedTransactions: MonitoringReturnedRejectedTransaction[]
  scope: { role: string }
}

const emptySnapshot: GorutMonitoringSnapshot = {
  metrics: null,
  api: null,
  database: null,
  gateway: null,
  recentEvents: null,
  statusDistribution: [],
  pendingByStage: [],
  plpkPerformance: null,
  upzisProgress: null,
  rantingProgress: null,
  finalApprovedTotals: { totalAmount: '0', transactionCount: 0, currentMonthAmount: '0', currentMonthTransactionCount: 0 },
  returnedRejectedTransactions: [],
  scope: { role: 'plpk' },
}

export const GORUT_MONITORING_EVENT = 'gorut-monitoring-updated'

let monitoringCache: GorutMonitoringSnapshot = emptySnapshot

function emitMonitoringUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GORUT_MONITORING_EVENT))
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null)
  return new Error(body?.error ?? fallback)
}

export async function fetchGorutMonitoringSnapshot(signal?: AbortSignal) {
  const response = await fetch('/api/gorut/monitoring', { cache: 'no-store', signal })
  if (!response.ok) throw await readError(response, 'Gagal membaca monitoring GORUT.')

  monitoringCache = await response.json() as GorutMonitoringSnapshot
  emitMonitoringUpdated()
  return monitoringCache
}

export function useGorutMonitoringSnapshot() {
  const [snapshot, setSnapshot] = useState<GorutMonitoringSnapshot>(monitoringCache)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const sync = () => {
      if (!cancelled) setSnapshot(monitoringCache)
    }

    window.addEventListener(GORUT_MONITORING_EVENT, sync)
    void fetchGorutMonitoringSnapshot(controller.signal).catch((cause) => {
      if ((cause as Error).name !== 'AbortError' && !cancelled) setError(cause instanceof Error ? cause.message : 'Gagal membaca monitoring.')
    }).finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      controller.abort()
      window.removeEventListener(GORUT_MONITORING_EVENT, sync)
    }
  }, [])

  return { snapshot, loading, error }
}
