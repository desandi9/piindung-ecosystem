'use client'

import { createCollectionClient } from '@/services/api/record-client'
import type { SetoranKoin } from '@/lib/gorut/types'

export type MetodePembayaran = 'scan' | 'manual'
export type RiwayatStatus = 'pending' | 'valid' | 'invalid' | 'setoran'

export type ValidasiRow = {
  id: string
  munfiqNama: string
  kecamatan: string
  plpk: string
  tanggal: string
  nominal: number
  buktiUrl: string
  validasi: SetoranKoin['validasi']
  validator?: string
  catatanAdmin?: string
  notes?: string
  metode: MetodePembayaran
  riwayat: Array<{
    id: string
    tanggal: string
    aksi: string
    oleh: string
    status: RiwayatStatus
  }>
  riwayatAdminTimeline: Array<{
    id: string
    tanggal: string
    label: string
    status: RiwayatStatus
  }>
}

export const GORUT_VALIDASI_SETORAN_EVENT = 'gorut-validasi-setoran-updated'

function makeMockBuktiDataUrl(label: string) {
  const safe = label.replace(/[^\w\s-]/g, '').slice(0, 40)
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="540">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0f172a"/>
          <stop offset="1" stop-color="#064e3b"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="48" y="48" width="804" height="444" rx="24" fill="#0b1220" stroke="#22c55e" stroke-width="4" opacity="0.95"/>
      <text x="72" y="140" font-family="ui-sans-serif, system-ui" font-size="40" fill="#34d399" font-weight="800">BUKTI SETOR</text>
      <text x="72" y="208" font-family="ui-sans-serif, system-ui" font-size="24" fill="#e5e7eb" font-weight="600">${safe}</text>
      <text x="72" y="272" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="18" fill="#93c5fd">Preview lokal bukti validasi</text>
      <text x="72" y="376" font-family="ui-sans-serif, system-ui" font-size="18" fill="#f1f5f9">Download dan cetak tersedia dari panel detail</text>
    </svg>
  `)
  return `data:image/svg+xml;charset=utf-8,${svg}`
}

function createDefaultRows(): ValidasiRow[] {
  const baseTime = '2026-05-14T09:30:00'
  const t = (mins: number) => new Date(new Date(baseTime).getTime() + mins * 60 * 1000).toISOString()

  const mkTimeline = (id: string, validasi: SetoranKoin['validasi']) => {
    const steps: ValidasiRow['riwayatAdminTimeline'] = [
      { id: `${id}-tl1`, tanggal: t(-120), label: 'Setoran masuk', status: 'setoran' },
      { id: `${id}-tl2`, tanggal: t(-30), label: 'Verifikasi admin', status: 'pending' },
    ]
    if (validasi === 'valid') steps.push({ id: `${id}-tl3`, tanggal: t(-10), label: 'Validasi disetujui', status: 'valid' })
    else if (validasi === 'invalid') steps.push({ id: `${id}-tl3`, tanggal: t(-10), label: 'Validasi ditolak', status: 'invalid' })
    else steps.push({ id: `${id}-tl3`, tanggal: t(-10), label: 'Menunggu keputusan', status: 'pending' })
    return steps
  }

  const mkRiwayat = (id: string, validasi: SetoranKoin['validasi']): ValidasiRow['riwayat'] => {
    const rows: ValidasiRow['riwayat'] = [
      { id: `${id}-r1`, tanggal: t(-120), aksi: 'Setoran tercatat', oleh: 'Petugas', status: 'setoran' },
      { id: `${id}-r2`, tanggal: t(-25), aksi: 'Masuk antrian validasi', oleh: 'Sistem', status: 'pending' },
    ]
    if (validasi === 'valid') rows.push({ id: `${id}-r3`, tanggal: t(-10), aksi: 'Validasi disetujui', oleh: 'Admin PC', status: 'valid' })
    else if (validasi === 'invalid') rows.push({ id: `${id}-r3`, tanggal: t(-10), aksi: 'Validasi ditolak', oleh: 'Admin PC', status: 'invalid' })
    else rows.push({ id: `${id}-r3`, tanggal: t(-10), aksi: 'Menunggu persetujuan', oleh: 'Admin PC', status: 'pending' })
    return rows
  }

  const nowDay = new Date().toISOString().slice(0, 10)

  return [
    { id: 'SETV-001', munfiqNama: 'H. Ahmad Sulaiman', kecamatan: 'Garut Kota', plpk: 'Ahmad Fadil', tanggal: `${nowDay}T08:45:00`, nominal: 1250000, buktiUrl: makeMockBuktiDataUrl('SETV-001 • Garut Kota'), validasi: 'pending', metode: 'scan', notes: 'QR terbaca, menunggu final validasi.', riwayat: mkRiwayat('SETV-001', 'pending'), riwayatAdminTimeline: mkTimeline('SETV-001', 'pending') },
    { id: 'SETV-002', munfiqNama: 'KH. Abdullah', kecamatan: 'Karangpawitan', plpk: 'Ahmad Fadil', tanggal: `${nowDay}T08:15:00`, nominal: 2150000, buktiUrl: makeMockBuktiDataUrl('SETV-002 • Karangpawitan'), validasi: 'valid', validator: 'Admin PC', catatanAdmin: 'Nominal dan bukti sesuai. Disetujui.', metode: 'manual', notes: 'Dokumen transfer manual sudah lengkap.', riwayat: mkRiwayat('SETV-002', 'valid'), riwayatAdminTimeline: mkTimeline('SETV-002', 'valid') },
    { id: 'SETV-003', munfiqNama: 'Siti Fatimah', kecamatan: 'Garut Kota', plpk: 'Dedi Kurniawan', tanggal: `${nowDay}T07:55:00`, nominal: 875000, buktiUrl: makeMockBuktiDataUrl('SETV-003 • Garut Kota'), validasi: 'invalid', validator: 'Admin UPZIS', catatanAdmin: 'Bukti tidak jelas, nominal tidak sesuai.', metode: 'scan', notes: 'Bukti blur dan nominal tidak cocok.', riwayat: mkRiwayat('SETV-003', 'invalid'), riwayatAdminTimeline: mkTimeline('SETV-003', 'invalid') },
    { id: 'SETV-004', munfiqNama: 'Apt. Dewi Sartika', kecamatan: 'Tarogong Kidul', plpk: 'Rizki Pratama', tanggal: `${nowDay}T07:25:00`, nominal: 1450000, buktiUrl: makeMockBuktiDataUrl('SETV-004 • Tarogong Kidul'), validasi: 'pending', metode: 'manual', notes: 'Menunggu verifikasi dokumen pembayaran.', riwayat: mkRiwayat('SETV-004', 'pending'), riwayatAdminTimeline: mkTimeline('SETV-004', 'pending') },
    { id: 'SETV-005', munfiqNama: 'Hj. Nurhasanah', kecamatan: 'Samarang', plpk: 'Ahmad Fadil', tanggal: `${nowDay}T06:15:00`, nominal: 1120000, buktiUrl: makeMockBuktiDataUrl('SETV-005 • Samarang'), validasi: 'pending', metode: 'scan', notes: 'QR valid, menunggu validasi admin.', riwayat: mkRiwayat('SETV-005', 'pending'), riwayatAdminTimeline: mkTimeline('SETV-005', 'pending') },
    { id: 'SETV-006', munfiqNama: 'Ujang Supriadi', kecamatan: 'Bayongbong', plpk: 'Rizki Pratama', tanggal: `${nowDay}T05:40:00`, nominal: 750000, buktiUrl: makeMockBuktiDataUrl('SETV-006 • Bayongbong'), validasi: 'valid', validator: 'Admin PC', catatanAdmin: 'Setoran valid dan sesuai bukti.', metode: 'scan', notes: 'Bukti Qris terbaca jelas.', riwayat: mkRiwayat('SETV-006', 'valid'), riwayatAdminTimeline: mkTimeline('SETV-006', 'valid') },
  ]
}

const validasiClient = createCollectionClient<ValidasiRow>({
  scope: 'gorut-validasi-setoran',
  defaultItems: createDefaultRows(),
  eventName: GORUT_VALIDASI_SETORAN_EVENT,
  sort: (items) => [...items].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()),
})

export function useGorutValidasiRows() {
  return validasiClient.useItems()
}

export async function writeGorutValidasiRows(items: ValidasiRow[]) {
  return validasiClient.writeItems(items)
}
