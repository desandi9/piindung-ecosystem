'use client'

import { useEffect, useState } from 'react'
import type { Activity, ApprovalTransaction, KecamatanData, Notification, StatistikGorut } from '@/lib/gorut/types'

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

export async function fetchGorutDashboard() {
  const response = await fetch('/api/gorut/dashboard', { cache: 'no-store' })
  if (!response.ok) throw await readError(response, 'Gagal membaca dashboard GORUT.')

  dashboardCache = await response.json() as GorutDashboardPayload
  emitDashboardUpdated()
  return dashboardCache
}

export function useGorutDashboard() {
  const [dashboard, setDashboard] = useState<GorutDashboardPayload>(dashboardCache)

  useEffect(() => {
    let cancelled = false

    const sync = () => {
      if (!cancelled) setDashboard(dashboardCache)
    }

    window.addEventListener(GORUT_DASHBOARD_EVENT, sync)
    void fetchGorutDashboard().catch(() => {
      if (!cancelled) setDashboard(dashboardCache)
    })

    return () => {
      cancelled = true
      window.removeEventListener(GORUT_DASHBOARD_EVENT, sync)
    }
  }, [])

  return dashboard
}
