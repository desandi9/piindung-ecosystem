'use client'

import { useEffect, useState } from 'react'
import type { MonitoringEvent, MonitoringMetric } from '@/lib/gorut/analytics'

export type MonitoringStatusDistribution = {
  state: string
  label: string
  count: number
  amount: number
}

export type MonitoringProgressItem = {
  id: string
  code: string
  name: string
  kecamatan?: string
  ranting?: string
  munfiqCount: number
  finalApprovedAmount: number
  finalApprovedCount: number
  pendingCount: number
  returnedRejectedCount: number
  targetBulanan?: number
  progress: number
}

export type MonitoringReturnedRejectedTransaction = {
  id: string
  transactionCode: string
  currentState: string
  totalAmount: number
  transactionDate: string
  kecamatan: string
  ranting: string
  plpk: string
}

export type GorutMonitoringSnapshot = {
  metrics: MonitoringMetric[]
  api: { responseTime: number; uptime: number; errorRate: number }
  database: { connectionPool: string; queryTime: number; replicationLag: number }
  gateway: { status: 'online' | 'warning' | 'offline'; messagesSent24h: number; failedMessages: number; lastSyncMinutes: number }
  recentEvents: MonitoringEvent[]
  statusDistribution: MonitoringStatusDistribution[]
  pendingByStage: Array<{ state: string; label: string; count: number }>
  plpkPerformance: MonitoringProgressItem[]
  upzisProgress: MonitoringProgressItem[]
  rantingProgress: MonitoringProgressItem[]
  finalApprovedTotals: {
    totalAmount: number
    transactionCount: number
    currentMonthAmount: number
    currentMonthTransactionCount: number
  }
  returnedRejectedTransactions: MonitoringReturnedRejectedTransaction[]
  scope: { role: string }
}

const emptySnapshot: GorutMonitoringSnapshot = {
  metrics: [],
  api: { responseTime: 0, uptime: 0, errorRate: 0 },
  database: { connectionPool: '0/50', queryTime: 0, replicationLag: 0 },
  gateway: { status: 'warning', messagesSent24h: 0, failedMessages: 0, lastSyncMinutes: 0 },
  recentEvents: [],
  statusDistribution: [],
  pendingByStage: [],
  plpkPerformance: [],
  upzisProgress: [],
  rantingProgress: [],
  finalApprovedTotals: { totalAmount: 0, transactionCount: 0, currentMonthAmount: 0, currentMonthTransactionCount: 0 },
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

export async function fetchGorutMonitoringSnapshot() {
  const response = await fetch('/api/gorut/monitoring', { cache: 'no-store' })
  if (!response.ok) throw await readError(response, 'Gagal membaca monitoring GORUT.')

  monitoringCache = await response.json() as GorutMonitoringSnapshot
  emitMonitoringUpdated()
  return monitoringCache
}

export function useGorutMonitoringSnapshot() {
  const [snapshot, setSnapshot] = useState<GorutMonitoringSnapshot>(monitoringCache)

  useEffect(() => {
    let cancelled = false

    const sync = () => {
      if (!cancelled) setSnapshot(monitoringCache)
    }

    window.addEventListener(GORUT_MONITORING_EVENT, sync)
    void fetchGorutMonitoringSnapshot().catch(() => {
      if (!cancelled) setSnapshot(monitoringCache)
    })

    return () => {
      cancelled = true
      window.removeEventListener(GORUT_MONITORING_EVENT, sync)
    }
  }, [])

  return snapshot
}
