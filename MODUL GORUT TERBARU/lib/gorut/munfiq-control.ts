'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import type { MunfiqData } from '@/lib/gorut/types'
import { isPlpkOperationalRole, type PlpkDashboardPayload } from '@/lib/gorut/plpk-dashboard-control'

export const GORUT_MUNFIQ_EVENT = 'gorut-munfiq-updated'

let munfiqCache: MunfiqData[] = []

function mapMunfiq(payload: PlpkDashboardPayload): MunfiqData[] {
  return payload.munfiq.map((item) => ({
    id: item.id,
    munfiqCode: item.munfiqCode,
    nama: item.name,
    nik: '',
    alamat: item.address ?? '',
    kecamatan: payload.profile.plpk?.upzis.kecamatanName ?? '',
    desa: item.desa ?? payload.profile.plpk?.ranting.desaKelurahanName ?? '',
    noHp: item.phone ?? '',
    totalSetoran: 0,
    jumlahSetoran: 0,
    status: item.status === 'aktif' ? 'aktif' : 'nonaktif',
    plpk: payload.profile.plpk?.name ?? '',
    plpkCode: payload.profile.plpk?.code,
  }))
}

export function useGorutMunfiqItems() {
  const [items, setItems] = useState<MunfiqData[]>(munfiqCache)
  const { user } = useAuth()

  useEffect(() => {
    const controller = new AbortController()
    const isPlpk = isPlpkOperationalRole(user?.role)
    const endpoint = isPlpk ? '/api/gorut/plpk-dashboard' : '/api/gorut/munfiq'

    void fetch(endpoint, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null)
        if (!response.ok) throw new Error(body?.error ?? 'Gagal membaca data Munfiq.')
        if (isPlpk) {
          munfiqCache = mapMunfiq(body as PlpkDashboardPayload)
        } else {
          munfiqCache = (body as { items: Array<{ id: string; munfiqCode: string; name: string; address?: string | null; ranting?: string | null; phone?: string | null; status?: string | null; plpk?: string | null }> })?.items?.map((item) => ({
            id: item.id,
            munfiqCode: item.munfiqCode,
            nama: item.name,
            nik: '',
            alamat: item.address ?? '',
            kecamatan: '',
            desa: item.ranting ?? '',
            noHp: item.phone ?? '',
            totalSetoran: 0,
            jumlahSetoran: 0,
            status: item.status === 'aktif' ? 'aktif' : 'nonaktif',
            plpk: item.plpk ?? '',
          })) ?? []
        }
        setItems(munfiqCache)
      })
      .catch((cause) => {
        if ((cause as Error).name !== 'AbortError') window.dispatchEvent(new CustomEvent(GORUT_MUNFIQ_EVENT, { detail: { error: cause instanceof Error ? cause.message : 'Gagal membaca data Munfiq.' } }))
      })
    return () => controller.abort()
  }, [user?.role])

  return items
}

export function readGorutMunfiqItems() { return munfiqCache }
export async function writeGorutMunfiqItems(_: MunfiqData[]) { throw new Error('Data Munfiq bersifat read-only pada batch ini.') }
