'use client'

import { createCollectionClient } from '@/services/api/record-client'

export type GorutRoleId = 'super_admin' | 'pc_admin' | 'upzis_admin' | 'ranting_admin' | 'plpk'
export type GorutRoleIconKey = 'crown' | 'building' | 'branch' | 'user'

export interface GorutRoleConfig {
  id: GorutRoleId
  nama: string
  deskripsi: string
  iconKey: GorutRoleIconKey
  color: string
  jumlahUser: number
  permissions: string[]
}

export const GORUT_ACCESS_EVENT = 'gorut-access-roles-updated'

export const DEFAULT_GORUT_ROLE_CONFIGS: GorutRoleConfig[] = [
  {
    id: 'super_admin',
    nama: 'Super Admin',
    deskripsi: 'Akses penuh ke seluruh sistem',
    iconKey: 'crown',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    jumlahUser: 2,
    permissions: ['all'],
  },
  {
    id: 'pc_admin',
    nama: 'PC Admin',
    deskripsi: 'Admin tingkat Pengurus Cabang',
    iconKey: 'building',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    jumlahUser: 5,
    permissions: ['dashboard', 'munfiq', 'transaksi', 'keuangan', 'laporan', 'wilayah'],
  },
  {
    id: 'upzis_admin',
    nama: 'UPZIS Admin',
    deskripsi: 'Admin tingkat UPZIS',
    iconKey: 'building',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    jumlahUser: 12,
    permissions: ['dashboard', 'munfiq', 'transaksi', 'laporan'],
  },
  {
    id: 'ranting_admin',
    nama: 'Ranting Admin',
    deskripsi: 'Admin tingkat Ranting',
    iconKey: 'branch',
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
    jumlahUser: 42,
    permissions: ['dashboard', 'munfiq', 'transaksi'],
  },
  {
    id: 'plpk',
    nama: 'PLPK',
    deskripsi: 'Petugas Lapangan Pengumpul Koin',
    iconKey: 'user',
    color: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
    jumlahUser: 156,
    permissions: ['dashboard', 'munfiq.view', 'setoran'],
  },
]

const gorutAccessClient = createCollectionClient<GorutRoleConfig>({
  scope: 'gorut-access-roles',
  defaultItems: DEFAULT_GORUT_ROLE_CONFIGS,
  eventName: GORUT_ACCESS_EVENT,
})

export function useGorutRoleConfigs() {
  return gorutAccessClient.useItems()
}

export async function writeGorutRoleConfigs(items: GorutRoleConfig[]) {
  return gorutAccessClient.writeItems(items)
}
