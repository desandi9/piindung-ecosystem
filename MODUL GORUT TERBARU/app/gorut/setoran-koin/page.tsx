'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EnhancedTable, TablePagination } from '@/components/gorut/enhanced-table'
import {
  DashboardPage,
  DashboardPageHeader,
  StatsGrid,
  StatCard,
  ContentCard,
} from '@/components/gorut/dashboard-layouts'
import { StatusIndicator } from '@/components/gorut/status-components'
import {
  EnhancedSheetBody,
  EnhancedSheetFooter,
  EnhancedSheetContent,
  FormGroup,
  FormRow,
  InfoItem,
  ModalSection,
  ResponsiveDialogContent,
} from '@/components/gorut/modal-drawer-layouts'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { useGorutMunfiqItems } from '@/lib/gorut/munfiq-control'
import type { SetoranKoin } from '@/lib/gorut/types'
import { CheckCircle2, Download, FileSpreadsheet, FileText, Printer, Search, XCircle, X, Clock, Coins, MapPin, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

type ValidasiFilter = 'all' | 'pending' | 'valid' | 'invalid'
type Metode = 'scan' | 'manual'
type RiwayatStatus = SetoranKoin['validasi'] | 'setoran'

type SetoranRow = {
  id: string
  munfiqNama: string
  kecamatan: string
  plpk: string
  tanggal: string
  nominal: number
  metode: Metode
  validasi: SetoranKoin['validasi']
  validator?: string
  notes?: string
  buktiUrl?: string
  riwayat: Array<{
    id: string
    tanggal: string
    aksi: string
    oleh: string
    status: RiwayatStatus
  }>
  catatanValidasi: string
}

const STATUS_META: Record<'pending' | 'valid' | 'invalid', { label: string; status: 'pending' | 'approved' | 'rejected' }> = {
  pending: { label: 'Pending', status: 'pending' },
  valid: { label: 'Validasi', status: 'approved' },
  invalid: { label: 'Ditolak', status: 'rejected' },
}

function statusBadgeFor(validasi: SetoranKoin['validasi']) {
  if (validasi === 'pending') return STATUS_META.pending
  if (validasi === 'valid') return STATUS_META.valid
  return STATUS_META.invalid
}

function toMetodeLabel(metode: Metode) {
  return metode === 'scan' ? 'Scan QRIS' : 'Manual'
}

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
      <text x="72" y="140" font-family="ui-sans-serif, system-ui" font-size="40" fill="#34d399" font-weight="800">BUKTI SETORAN</text>
      <text x="72" y="208" font-family="ui-sans-serif, system-ui" font-size="24" fill="#e5e7eb" font-weight="600">${safe}</text>
      <text x="72" y="272" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="18" fill="#93c5fd">Preview lokal bukti setor</text>
      <text x="72" y="376" font-family="ui-sans-serif, system-ui" font-size="18" fill="#fbbf24">Unduhan tersedia dari panel detail</text>
    </svg>
  `)
  return `data:image/svg+xml;charset=utf-8,${svg}`
}

export default function SetoranKoinPage() {
  const { toast } = useToast()
  const munfiqItems = useGorutMunfiqItems()

  const initialRows: SetoranRow[] = useMemo(() => {
    const mkRiwayat = (id: string, tanggalAwal: string) => {
      const t1 = tanggalAwal
      const t2 = new Date(new Date(t1).getTime() + 25 * 60 * 1000).toISOString()
      return [
        {
          id: `${id}-r1`,
          tanggal: t1,
          aksi: 'Setoran tercatat',
          oleh: 'Petugas',
          status: 'setoran' as const,
        },
        {
          id: `${id}-r2`,
          tanggal: t2,
          aksi: 'Validasi dilakukan',
          oleh: 'Admin PC',
          status: 'pending' as const,
        },
      ]
    }

    return [
      {
        id: 'SET-001',
        munfiqNama: 'H. Ahmad Sulaiman',
        kecamatan: 'Garut Kota',
        plpk: 'Ahmad Fadil',
        tanggal: '2026-05-14T09:30:00',
        nominal: 1250000,
        metode: 'scan',
        validasi: 'pending',
        notes: 'Perlu verifikasi bukti transfer.',
        buktiUrl: makeMockBuktiDataUrl('SET-001 • Garut Kota'),
        riwayat: mkRiwayat('SET-001', '2026-05-14T09:30:00'),
        catatanValidasi: 'Menunggu validasi akhir dari Admin PC.',
      },
      {
        id: 'SET-002',
        munfiqNama: 'KH. Abdullah',
        kecamatan: 'Karangpawitan',
        plpk: 'Ahmad Fadil',
        tanggal: '2026-05-14T08:15:00',
        nominal: 2150000,
        metode: 'manual',
        validasi: 'valid',
        validator: 'Admin PC',
        notes: 'Nominal sesuai. Bukti valid.',
        buktiUrl: makeMockBuktiDataUrl('SET-002 • Karangpawitan'),
        riwayat: [
          { id: 'SET-002-r1', tanggal: '2026-05-14T08:15:00', aksi: 'Setoran tercatat', oleh: 'Petugas', status: 'setoran' as const },
          { id: 'SET-002-r2', tanggal: '2026-05-14T08:45:00', aksi: 'Validasi disetujui', oleh: 'Admin PC', status: 'valid' as const },
        ],
        catatanValidasi: 'Disetujui. Transaksi siap diproses ke pencatatan.',
      },
      {
        id: 'SET-003',
        munfiqNama: 'Siti Fatimah',
        kecamatan: 'Garut Kota',
        plpk: 'Dedi Kurniawan',
        tanggal: '2026-05-13T16:45:00',
        nominal: 875000,
        metode: 'scan',
        validasi: 'invalid',
        validator: 'Admin UPZIS',
        notes: 'Bukti blur dan nominal tidak sesuai.',
        buktiUrl: makeMockBuktiDataUrl('SET-003 • Garut Kota'),
        riwayat: [
          { id: 'SET-003-r1', tanggal: '2026-05-13T16:45:00', aksi: 'Setoran tercatat', oleh: 'Petugas', status: 'setoran' as const },
          { id: 'SET-003-r2', tanggal: '2026-05-13T17:05:00', aksi: 'Validasi ditolak', oleh: 'Admin UPZIS', status: 'invalid' as const },
        ],
        catatanValidasi: 'Ditolak. Mohon upload ulang bukti dengan nominal yang benar.',
      },
      {
        id: 'SET-004',
        munfiqNama: 'Apt. Dewi Sartika',
        kecamatan: 'Tarogong Kidul',
        plpk: 'Rizki Pratama',
        tanggal: '2026-05-13T10:00:00',
        nominal: 1450000,
        metode: 'manual',
        validasi: 'valid',
        validator: 'Admin PC',
        notes: 'Transfer masuk sesuai referensi.',
        buktiUrl: makeMockBuktiDataUrl('SET-004 • Tarogong Kidul'),
        riwayat: [
          { id: 'SET-004-r1', tanggal: '2026-05-13T10:00:00', aksi: 'Setoran tercatat', oleh: 'Petugas', status: 'setoran' as const },
          { id: 'SET-004-r2', tanggal: '2026-05-13T10:35:00', aksi: 'Validasi disetujui', oleh: 'Admin PC', status: 'valid' as const },
        ],
        catatanValidasi: 'Disetujui. Bukti telah sesuai dan lengkap.',
      },
      {
        id: 'SET-005',
        munfiqNama: 'Hj. Nurhasanah',
        kecamatan: 'Samarang',
        plpk: 'Ahmad Fadil',
        tanggal: '2026-05-12T11:00:00',
        nominal: 1120000,
        metode: 'scan',
        validasi: 'pending',
        notes: 'Menunggu verifikasi kode transaksi.',
        buktiUrl: makeMockBuktiDataUrl('SET-005 • Samarang'),
        riwayat: [
          { id: 'SET-005-r1', tanggal: '2026-05-12T11:00:00', aksi: 'Setoran tercatat', oleh: 'Petugas', status: 'setoran' as const },
          { id: 'SET-005-r2', tanggal: '2026-05-12T12:10:00', aksi: 'Validasi masuk antrian', oleh: 'Sistem', status: 'pending' as const },
        ],
        catatanValidasi: 'Masih dalam antrian validasi.',
      },
    ]
  }, [])

  const [rows, setRows] = useState<SetoranRow[]>(initialRows)

  const munfiqCodeByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of munfiqItems) {
      if (item.munfiqCode) {
        map.set(`${item.nama}:${item.kecamatan}`, item.munfiqCode)
      }
    }
    return map
  }, [munfiqItems])

  // ---------- Filters ----------
  const [search, setSearch] = useState('')
  const [kecamatan, setKecamatan] = useState<string>('all')
  const [plpk, setPlpk] = useState<string>('all')
  const [status, setStatus] = useState<ValidasiFilter>('all')
  const [tanggal, setTanggal] = useState<string>('all')

  const kecamatans = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.kecamatan)))], [rows])
  const plpkList = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.plpk)))], [rows])
  const tanggalList = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.tanggal.slice(0, 10))))], [rows])

  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (s) {
        const munfiqCode = munfiqCodeByName.get(`${r.munfiqNama}:${r.kecamatan}`) ?? ''
        const hay = [r.id, munfiqCode, r.munfiqNama, r.kecamatan, r.plpk, r.validasi, r.validator ?? '', r.notes ?? ''].join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      if (kecamatan !== 'all' && r.kecamatan !== kecamatan) return false
      if (plpk !== 'all' && r.plpk !== plpk) return false
      if (status !== 'all' && r.validasi !== status) return false
      if (tanggal !== 'all' && r.tanggal.slice(0, 10) !== tanggal) return false
      return true
    })
  }, [rows, search, kecamatan, plpk, status, tanggal])

  // ---------- Pagination ----------
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6
  const totalItems = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const pageRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredRows.slice(startIdx, startIdx + pageSize)
  }, [filteredRows, currentPage])

  // ---------- Drawer/Modal state ----------
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<SetoranRow | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'valid' | 'invalid'>('valid')
  const [confirmIds, setConfirmIds] = useState<string[]>([])

  const openDetail = (row: SetoranRow) => {
    setSelectedRow(row)
    setDetailOpen(true)
  }

  const openConfirm = (ids: string[], action: 'valid' | 'invalid') => {
    setConfirmIds(ids)
    setConfirmAction(action)
    setConfirmOpen(true)
  }

  const applyValidation = () => {
    const now = new Date().toISOString()
    const actionLabel = confirmAction === 'valid' ? 'Validasi berhasil' : 'Penolakan berhasil'
    const nextValidator = 'Admin PC'
    const nextCatatan =
      confirmAction === 'valid'
        ? 'Validasi disetujui melalui dashboard.'
        : 'Ditolak melalui dashboard. Mohon perbaikan bukti transfer atau berkas pendukung.'

    setRows((prev) =>
      prev.map((r) => {
        if (!confirmIds.includes(r.id)) return r
        const nextStatus = confirmAction as SetoranKoin['validasi']
        return {
          ...r,
          validasi: nextStatus,
          validator: nextValidator,
          notes: confirmAction === 'valid' ? 'Nominal & bukti valid.' : 'Bukti/nominal tidak sesuai.',
          catatanValidasi: nextCatatan,
          riwayat: [
            ...r.riwayat,
            {
              id: `${r.id}-valid-${now}`,
              tanggal: now,
              aksi: confirmAction === 'valid' ? 'Validasi disetujui' : 'Validasi ditolak',
              oleh: nextValidator,
              status: nextStatus,
            },
          ],
        }
      }),
    )

    setConfirmOpen(false)
    setConfirmIds([])
    toast({
      variant: 'default',
      title: actionLabel,
      description: 'Perubahan status diterapkan ke data lokal.',
    })
  }

  // ---------- Export mock ----------
  const exportData = (ids?: string[], format?: 'pdf' | 'excel') => {
    const count = ids?.length ?? filteredRows.length
    const exportRows = rows.filter((row) => !ids || ids.includes(row.id))

    if (format === 'pdf') {
      exportReportToPdf({
        title: 'Laporan Penghimpunan GORUT',
        subtitle: `${count} data penghimpunan ${ids?.length ? 'terpilih' : 'sesuai filter'}`,
        summary: [
          { label: 'Jumlah Penghimpunan', value: String(count) },
          { label: 'Total Nominal', value: formatRupiah(exportRows.reduce((acc, row) => acc + row.nominal, 0)) },
          { label: 'Pending', value: String(exportRows.filter((row) => row.validasi === 'pending').length) },
          { label: 'Valid', value: String(exportRows.filter((row) => row.validasi === 'valid').length) },
        ],
        tables: [{
          title: 'Daftar Penghimpunan',
          columns: ['ID', 'Kode Munfiq', 'Munfiq', 'Kecamatan', 'PLPK', 'Tanggal', 'Nominal', 'Metode', 'Status', 'Validator'],
          rows: exportRows.map((row) => [row.id, munfiqCodeByName.get(`${row.munfiqNama}:${row.kecamatan}`) ?? '-', row.munfiqNama, row.kecamatan, row.plpk, formatDateShort(row.tanggal), formatRupiah(row.nominal), toMetodeLabel(row.metode), row.validasi, row.validator ?? '-']),
        }],
        notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
      })
      return
    }

    if (format === 'excel') {
      exportRowsToSpreadsheet({
        fileName: `penghimpunan-${new Date().toISOString().slice(0, 10)}.xlsx`,
        rows: [
          ['ID Penghimpunan', 'Kode Munfiq', 'Nama Munfiq', 'Kecamatan', 'PLPK', 'Tanggal', 'Nominal', 'Metode', 'Status', 'Validator', 'Catatan Verifikasi'],
          ...exportRows.map((row) => [
            row.id,
            munfiqCodeByName.get(`${row.munfiqNama}:${row.kecamatan}`) ?? '',
            row.munfiqNama,
            row.kecamatan,
            row.plpk,
            row.tanggal,
            String(row.nominal),
            row.metode,
            row.validasi,
            row.validator ?? '',
            row.catatanValidasi,
          ]),
        ],
        format: 'xlsx',
      })
    }

    toast({
      variant: 'default',
      title: `Export ${format === 'pdf' ? 'PDF' : 'Excel'} siap`,
      description: `${format === 'pdf' ? 'Laporan siap dicetak' : 'File Excel berhasil dibuat'} untuk ${count} data penghimpunan.`,
    })
  }

  // ---------- Stats ----------
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const totalSetoranHariIni = rows.filter((r) => r.tanggal.slice(0, 10) === today).length
    const pending = rows.filter((r) => r.validasi === 'pending').length
    const totalNominal = rows.reduce((acc, r) => acc + r.nominal, 0)
    const bulanIniPrefix = new Date().toISOString().slice(0, 7)
    const bulanIni = rows.filter((r) => r.tanggal.slice(0, 7) === bulanIniPrefix).length
    return { totalSetoranHariIni, pending, totalNominal, bulanIni }
  }, [rows])

  // ---------- Table columns / rows ----------
  const columns = [
    { id: 'id', label: 'ID Setoran', sortable: false },
    { id: 'munfiqNama', label: 'Nama Munfiq', sortable: false },
    { id: 'kecamatan', label: 'Kecamatan', sortable: false },
    { id: 'plpk', label: 'PLPK', sortable: false },
    { id: 'tanggal', label: 'Tanggal Setor', sortable: false },
    { id: 'nominal', label: 'Nominal', sortable: false },
    { id: 'metode', label: 'Metode', sortable: false },
    { id: 'validasi', label: 'Status', sortable: false },
    { id: 'aksi', label: 'Aksi', sortable: false },
  ] as const

  const tableRows = pageRows.map((r) => {
    const meta = statusBadgeFor(r.validasi)
    return {
      id: r.id,
      munfiqNama: <div><span className="font-medium">{r.munfiqNama}</span><p className="text-xs text-muted-foreground">{munfiqCodeByName.get(`${r.munfiqNama}:${r.kecamatan}`) ?? '-'}</p></div>,
      kecamatan: r.kecamatan,
      plpk: r.plpk,
      tanggal: <span className="text-sm">{formatDateShort(r.tanggal)}</span>,
      nominal: <span className="font-semibold">{formatRupiah(r.nominal)}</span>,
      metode: <span className="text-sm text-muted-foreground">{toMetodeLabel(r.metode)}</span>,
      validasi: <StatusIndicator status={meta.status} label={meta.label} variant="compact" size="sm" />,
      aksi: (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              openDetail(r)
            }}
          >
            Detail
          </Button>

          <Button
            size="sm"
            variant={r.validasi === 'pending' ? 'default' : 'secondary'}
            disabled={r.validasi !== 'pending'}
            onClick={(e) => {
              e.stopPropagation()
              openConfirm([r.id], 'valid')
            }}
          >
            Validasi
          </Button>

          <Button
            size="sm"
            variant={r.validasi === 'pending' ? 'destructive' : 'secondary'}
            disabled={r.validasi !== 'pending'}
            onClick={(e) => {
              e.stopPropagation()
              openConfirm([r.id], 'invalid')
            }}
          >
            Tolak
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              exportData([r.id], 'excel')
            }}
            aria-label="Cetak"
            title="Export Excel"
          >
            <Printer className="size-4" />
          </Button>
        </div>
      ),
    }
  })

  const resetFilters = () => {
    setSearch('')
    setKecamatan('all')
    setPlpk('all')
    setStatus('all')
    setTanggal('all')
    setCurrentPage(1)
    toast({
      variant: 'default',
      title: 'Filter direset',
      description: 'Kembali ke data awal.',
    })
  }

  const handleFiltersChanged = () => {
    setCurrentPage(1)
  }

  // ---------- UI ----------
  return (
    <DashboardPage>
      <DashboardPageHeader
        title="GORUT / Penghimpunan"
        description="Kelola penghimpunan infaq, verifikasi, penolakan, serta ekspor data secara operasional."
        action={null}
        className="mb-4"
      />

      <StatsGrid>
        <StatCard icon={Coins} label="Total Penghimpunan Hari Ini" value={stats.totalSetoranHariIni} description="Jumlah penghimpunan yang masuk hari ini" trend="stable" trendDirection="stable" />
        <StatCard icon={Clock} label="Pending Validasi" value={stats.pending} description="Menunggu verifikasi dari tim" trend="review" trendDirection="down" />
        <StatCard icon={FileText} label="Total Nominal" value={formatRupiah(stats.totalNominal)} description="Akumulasi nominal penghimpunan" trend="up" trendDirection="up" />
        <StatCard icon={MapPin} label="Penghimpunan Bulan Ini" value={stats.bulanIni} description="Penghimpunan pada bulan berjalan" trend="this month" trendDirection="up" />
      </StatsGrid>

      <ContentCard title="Cari & Filter" description="Pilih kriteria untuk mempersempit daftar penghimpunan.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  handleFiltersChanged()
                }}
                placeholder="Cari ID, kode munfiq, nama munfiq, PLPK, validator..."
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Filter Kecamatan</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
                  value={kecamatan}
                  onChange={(e) => {
                    setKecamatan(e.target.value)
                    handleFiltersChanged()
                  }}
                >
                  {kecamatans.map((v) => (
                    <option key={v} value={v}>
                      {v === 'all' ? 'Semua kecamatan' : v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Filter PLPK</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
                  value={plpk}
                  onChange={(e) => {
                    setPlpk(e.target.value)
                    handleFiltersChanged()
                  }}
                >
                  {plpkList.map((v) => (
                    <option key={v} value={v}>
                      {v === 'all' ? 'Semua PLPK' : v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Filter Status</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as ValidasiFilter)
                    handleFiltersChanged()
                  }}
                >
                  <option value="all">Semua status</option>
                  <option value="pending">Pending</option>
                  <option value="valid">Validasi</option>
                  <option value="invalid">Ditolak</option>
                </select>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">Filter Tanggal</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
                  value={tanggal}
                  onChange={(e) => {
                    setTanggal(e.target.value)
                    handleFiltersChanged()
                  }}
                >
                  {tanggalList.map((d) => (
                    <option key={d} value={d}>
                      {d === 'all' ? 'Semua tanggal' : d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset
              </Button>

              <Button variant="default" size="sm" onClick={() => exportData(undefined, 'pdf')}>
                <FileText className="size-4 mr-2" />
                Export PDF
              </Button>

              <Button variant="outline" size="sm" onClick={() => exportData(undefined, 'excel')}>
                <FileSpreadsheet className="size-4 mr-2" />
                Export Excel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">Tip: gunakan checkbox untuk bulk action.</p>
          </div>
        </div>
      </ContentCard>

      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="p-0">
          <EnhancedTable
            columns={columns.map((c) => ({ id: c.id, label: c.label }))}
            rows={tableRows}
            selectable
            emptyMessage={
              search || kecamatan !== 'all' || plpk !== 'all' || status !== 'all' || tanggal !== 'all'
                ? 'Tidak ada hasil untuk filter yang dipilih.'
                : 'Belum ada data penghimpunan.'
            }
            bulkActions={[
              {
                label: 'Bulk Validasi',
                icon: CheckCircle2,
                variant: 'default',
                show: (count) => count > 0,
                onClick: (selectedIds) => openConfirm(selectedIds, 'valid'),
              },
              {
                label: 'Bulk Export Excel',
                icon: Download,
                variant: 'secondary',
                show: (count) => count > 0,
                onClick: (selectedIds) => exportData(selectedIds, 'excel'),
              },
            ]}
            onRowClick={(rowId) => {
              const r = rows.find((x) => x.id === rowId)
              if (r) openDetail(r)
            }}
          />

          <div className="mt-4">
            <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={totalItems} />
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o)
          if (!o) setSelectedRow(null)
        }}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
            <SheetTitle className="text-lg">Detail Penghimpunan</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Informasi munfiq, nominal, metode, bukti, riwayat, dan status.
            </SheetDescription>
          </div>

          <EnhancedSheetBody>
            {!selectedRow ? (
              <div className="py-10 text-center text-muted-foreground">Pilih data untuk melihat detail.</div>
            ) : (
              <div className="space-y-6">
                <ModalSection title="Identitas Munfiq">
                  <FormGroup>
                    <FormRow columns={2}>
                      <InfoItem label="ID Penghimpunan" value={<span className="font-semibold">{selectedRow.id}</span>} />
                      <InfoItem label="Tanggal Penghimpunan" value={formatDateShort(selectedRow.tanggal)} />
                    </FormRow>
                    <FormRow columns={2}>
                      <InfoItem label="Nama Munfiq" value={selectedRow.munfiqNama} />
                      <InfoItem label="Kode Munfiq" value={<span className="font-mono">{munfiqCodeByName.get(`${selectedRow.munfiqNama}:${selectedRow.kecamatan}`) ?? '-'}</span>} />
                    </FormRow>
                    <FormRow columns={2}>
                      <InfoItem label="Kecamatan" value={selectedRow.kecamatan} />
                      <InfoItem label="PLPK" value={selectedRow.plpk} />
                      <InfoItem
                        label="Status"
                        value={
                          <StatusIndicator
                            status={statusBadgeFor(selectedRow.validasi).status}
                            label={statusBadgeFor(selectedRow.validasi).label}
                            variant="default"
                            size="sm"
                          />
                        }
                      />
                    </FormRow>
                  </FormGroup>
                </ModalSection>

                <ModalSection title="Detail Nominal & Metode">
                  <FormGroup>
                    <FormRow columns={2}>
                      <InfoItem label="Nominal" value={<span className="font-semibold">{formatRupiah(selectedRow.nominal)}</span>} />
                      <InfoItem label="Metode Pembayaran" value={toMetodeLabel(selectedRow.metode)} />
                    </FormRow>
                    <FormRow columns={2}>
                      <InfoItem label="Validator" value={selectedRow.validator ?? '-'} />
                      <InfoItem label="Catatan Validasi" value={<span className="text-sm text-muted-foreground">{selectedRow.catatanValidasi}</span>} />
                    </FormRow>
                  </FormGroup>
                </ModalSection>

                <ModalSection title="Bukti Setor (Preview)">
                    <div className="rounded-lg border border-border/50 bg-card p-3">
                      <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 min-w-0">
                          {selectedRow.buktiUrl ? (
                            <Image
                              src={selectedRow.buktiUrl}
                              alt="Bukti setor preview"
                              width={640}
                              height={256}
                              className="w-full max-h-64 rounded-md border border-border/50 object-contain bg-muted"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border/50 bg-muted/40 text-sm text-muted-foreground">
                              Bukti setor tidak tersedia.
                            </div>
                          )}
                        </div>
                      <div className="w-full lg:w-44 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toast({
                              variant: 'default',
                              title: 'Download preview',
                              description: 'Bukti setor diunduh dari data lokal yang sedang tampil.',
                            })
                          }
                        >
                          <Download className="size-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportData([selectedRow.id], 'pdf')}
                        >
                           <FileText className="size-4 mr-2" />
                           Cetak PDF
                         </Button>
                      </div>
                    </div>
                  </div>
                </ModalSection>

                <ModalSection title="Riwayat Penghimpunan">
                  <div className="space-y-3">
                    {selectedRow.riwayat.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
                    ) : (
                      selectedRow.riwayat
                        .slice()
                        .reverse()
                        .map((item) => {
                          const tag =
                            item.status === 'setoran'
                              ? { status: 'info' as const, label: 'Penghimpunan' }
                              : statusBadgeFor(item.status as SetoranKoin['validasi'])

                          return (
                            <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3 bg-card">
                              <div className="mt-0.5">
                                <StatusIndicator
                                  status={tag.status}
                                  label={tag.label}
                                  variant="dot"
                                  size="md"
                                  showIcon={false}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{item.aksi}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateShort(item.tanggal)} • {item.oleh}
                                </p>
                              </div>
                            </div>
                          )
                        })
                    )}
                  </div>
                </ModalSection>

                <ModalSection title="Timeline Status (Ringkas)">
                  <div className="rounded-lg border border-border/50 p-4 bg-card">
                    <div className="flex flex-col gap-3">
                      {([
                        { key: 'pending', title: 'Pending', desc: 'Menunggu validasi' },
                        { key: 'valid', title: 'Validasi', desc: 'Disetujui' },
                        { key: 'invalid', title: 'Ditolak', desc: 'Tidak disetujui' },
                      ] as const).map((step) => {
                        const completed =
                          (step.key === 'pending' && selectedRow.validasi === 'pending') ||
                          (step.key === 'valid' && selectedRow.validasi === 'valid') ||
                          (step.key === 'invalid' && selectedRow.validasi === 'invalid')

                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex size-8 items-center justify-center rounded-full border',
                                completed
                                  ? 'border-emerald-500/70 bg-emerald-500/10'
                                  : 'border-border bg-muted/40',
                              )}
                            >
                              {completed ? (
                                step.key === 'valid' ? (
                                  <CheckCircle2 className="size-4 text-emerald-600" />
                                ) : step.key === 'invalid' ? (
                                  <XCircle className="size-4 text-red-600" />
                                ) : (
                                  <Clock className="size-4 text-amber-600" />
                                )
                              ) : (
                                <AlertTriangle className="size-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{step.title}</p>
                              <p className="text-xs text-muted-foreground">{step.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </ModalSection>
              </div>
            )}
          </EnhancedSheetBody>

          <EnhancedSheetFooter>
            <div className="flex gap-2 w-full justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailOpen(false)
                  setSelectedRow(null)
                }}
              >
                Tutup
              </Button>

              {selectedRow && selectedRow.validasi === 'pending' && (
                <>
                  <Button variant="default" onClick={() => openConfirm([selectedRow.id], 'valid')}>
                    Validasi
                  </Button>
                  <Button variant="destructive" onClick={() => openConfirm([selectedRow.id], 'invalid')}>
                    Tolak
                  </Button>
                </>
              )}
            </div>
          </EnhancedSheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Tindakan</DialogTitle>
            <DialogDescription>
              {confirmAction === 'valid'
                ? 'Setujui verifikasi penghimpunan untuk data terpilih ini.'
                : 'Tolak penghimpunan untuk data terpilih ini.'}
            </DialogDescription>
          </DialogHeader>

          <ResponsiveDialogContent>
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <p className="text-sm font-medium">Jumlah data: {confirmIds.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Perubahan akan diterapkan ke state lokal dan langsung muncul di tabel.
              </p>
              <div className="mt-3 space-y-2">
                {confirmIds.slice(0, 4).map((id) => (
                  <div key={id} className="text-xs text-muted-foreground">
                    • {id}
                  </div>
                ))}
                {confirmIds.length > 4 && (
                  <div className="text-xs text-muted-foreground">
                    • ... dan {confirmIds.length - 4} lainnya
                  </div>
                )}
              </div>
            </div>
          </ResponsiveDialogContent>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              variant={confirmAction === 'valid' ? 'default' : 'destructive'}
              onClick={applyValidation}
            >
              {confirmAction === 'valid' ? 'Ya, Validasi' : 'Ya, Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  )
}
