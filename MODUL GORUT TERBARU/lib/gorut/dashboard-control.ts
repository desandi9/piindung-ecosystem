'use client'

import { useEffect, useState } from 'react'
import type { Activity, ApprovalTransaction, KecamatanData, Notification, StatistikGorut } from '@/lib/gorut/types'

type GorutDashboardApiPayload = {
  stats: Omit<StatistikGorut, 'kotakPending' | 'totalTerkumpul' | 'terkumpulBulanIni' | 'pertumbuhan'> & {
    kotakPending: number | null
    totalTerkumpul: string
    terkumpulBulanIni: string
    pertumbuhan: number | null
  }
  kecamatanData: Array<Omit<KecamatanData, 'jumlahKotak' | 'jumlahKotakAktif' | 'totalTerkumpul'> & {
    jumlahKotak: number | null
    jumlahKotakAktif: number | null
    totalTerkumpul: string | null
  }>
  recentActivities: Activity[]
  priorityApprovals: ApprovalTransaction[]
  priorityNotifications: Notification[]
  roleSummary: {
    role: string
    plpkCount: number
    pendingRanting?: number
    pendingUpzis?: number
    pendingPc?: number
    auditActionsToday: number | null
  }
  auditSummary: Record<string, number>
}

export type GorutDashboardPayload = {
  stats: StatistikGorut
  kecamatanData: KecamatanData[]
  recentActivities: Activity[]
  priorityApprovals: ApprovalTransaction[]
  priorityNotifications: Notification[]
  roleSummary: {
    role: string
    plpkCount: number
    pendingRanting?: number
    pendingUpzis?: number
    pendingPc?: number
    auditActionsToday: number
  }
  auditSummary: Record<string, number>
}

const emptyDashboard: GorutDashboardPayload = {
  stats: {
    totalKotak: 0,
    kotakAktif: 0,
    kotakNonaktif: 0,
    kotakPending: 0,
    totalTerkumpul: 0,
    terkumpulBulanIni: 0,
    totalKecamatan: 0,
    totalDesa: 0,
    pertumbuhan: 0,
  },
  kecamatanData: [],
  recentActivities: [],
  priorityApprovals: [],
  priorityNotifications: [],
  roleSummary: { role: 'plpk', plpkCount: 0, auditActionsToday: 0 },
  auditSummary: {},
}

export const GORUT_DASHBOARD_EVENT = 'gorut-dashboard-updated'

let dashboardCache: GorutDashboardPayload = emptyDashboard

function emitDashboardUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GORUT_DASHBOARD_EVENT))
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null)
  return new Error(body?.error ?? fallback)
}

export async function fetchGorutDashboard(signal?: AbortSignal) {
  const response = await fetch('/api/gorut/dashboard', { cache: 'no-store', signal })
  if (!response.ok) throw await readError(response, 'Gagal membaca dashboard GORUT.')

  const payload = await response.json() as GorutDashboardApiPayload
  dashboardCache = {
    ...payload,
    stats: {
      ...payload.stats,
      kotakPending: payload.stats.kotakPending ?? 0,
      totalTerkumpul: Number(payload.stats.totalTerkumpul),
      terkumpulBulanIni: Number(payload.stats.terkumpulBulanIni),
      pertumbuhan: payload.stats.pertumbuhan ?? 0,
    },
    kecamatanData: payload.kecamatanData.map((item) => ({
      ...item,
      jumlahKotak: item.jumlahKotak ?? 0,
      jumlahKotakAktif: item.jumlahKotakAktif ?? 0,
      totalTerkumpul: Number(item.totalTerkumpul ?? 0),
    })),
    roleSummary: { ...payload.roleSummary, auditActionsToday: payload.roleSummary.auditActionsToday ?? 0 },
  }
  emitDashboardUpdated()
  return dashboardCache
}

export function useGorutDashboard() {
  const [dashboard, setDashboard] = useState<GorutDashboardPayload>(dashboardCache)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const sync = () => {
      if (!cancelled) setDashboard(dashboardCache)
    }

    window.addEventListener(GORUT_DASHBOARD_EVENT, sync)
    void fetchGorutDashboard(controller.signal).catch((cause) => {
      if ((cause as Error).name !== 'AbortError' && !cancelled) setError(cause instanceof Error ? cause.message : 'Gagal membaca dashboard.')
    }).finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      controller.abort()
      window.removeEventListener(GORUT_DASHBOARD_EVENT, sync)
    }
  }, [])

  return { dashboard, loading, error }
}
