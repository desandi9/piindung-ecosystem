'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { EnhancedTable, TablePagination } from '@/components/gorut/enhanced-table'
import { StatusIndicator } from '@/components/gorut/status-components'
import {
  DashboardPage,
  DashboardPageHeader,
  StatsGrid,
  StatCard,
  ContentCard,
} from '@/components/gorut/dashboard-layouts'
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
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { getWilayahOverview } from '@/lib/gorut/wilayah'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Gauge,
  MapPin,
  Search,
  ShieldCheck,
  Activity,
  Pencil,
  Eye,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  XCircle,
  Target,
} from 'lucide-react'

type PlpkStatus = 'aktif' | 'nonaktif' | 'pending'
type MetodePembayaran = 'scan' | 'manual'
type RiwayatStatus = 'valid' | 'pending' | 'invalid'

type RantingWilayah = { id: string; nama: string }

type RiwayatSetoran = {
  id: string
  tanggal: string
  nominal: number
  metode: MetodePembayaran
  status: RiwayatStatus
}

type RantingPlpkRow = {
  id: string
  nama: string
  ranting: string
  kecamatan: string
  jumlahMunfiq: number
  totalSetoran: number
  targetBulanan: number
  progressBulananPersen: number
  status: PlpkStatus
  pendingReason?: string
  kontak: string
  pengurus: Array<{ id: string; nama: string; peran: string; kontak?: string }>
  wilayah: RantingWilayah[]
  performaBulanan: {
    target: number
    realisasi: number
    ranking: number
    lastActivityAt: string
  }
  monitoring: {
    kontribusi: Array<{ wilayah: string; persen: number }>
    penghimpunanScore: number
    realisasiPeriode: number
    pertumbuhanPersen: number
  }
  riwayatSetoran: RiwayatSetoran[]
}

const STATUS_META: Record<
  PlpkStatus,
  { label: string; status: 'pending' | 'approved' | 'rejected' }
> = {
  aktif: { label: 'Aktif', status: 'approved' },
  nonaktif: { label: 'Nonaktif', status: 'rejected' },
  pending: { label: 'Pending', status: 'pending' },
}

function statusBadge(status: PlpkStatus) {
  return STATUS_META[status]
}

function toMetodeLabel(m: MetodePembayaran) {
  return m === 'scan' ? 'Scan QRIS' : 'Manual'
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
      <text x="72" y="170" font-family="ui-sans-serif, system-ui" font-size="38" fill="#34d399" font-weight="800">BUKTI SETOR</text>
      <text x="72" y="235" font-family="ui-sans-serif, system-ui" font-size="24" fill="#e5e7eb" font-weight="600">${safe}</text>
      <text x="72" y="290" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="18" fill="#93c5fd">Preview lokal bukti setor</text>
    </svg>
  `)
  return `data:image/svg+xml;charset=utf-8,${svg}`
}

function ProgressBar({
  value,
  max = 100,
}: {
  value: number
  max?: number
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function RantingPlpkPage() {
  const { toast } = useToast()

  const initialRows: RantingPlpkRow[] = useMemo(() => {
    return getWilayahOverview().plpk.map((item, index) => {
      const progress = Math.round((item.totalSetoran / Math.max(1, item.targetSetoran)) * 100)
      const contributionBase = Math.max(1, item.wilayahNames.length)

      return {
        id: `PLPK-${item.id.padStart(3, '0')}`,
        nama: item.nama,
        ranting: item.ranting,
        kecamatan: item.kecamatan,
        jumlahMunfiq: item.jumlahMunfiq,
        totalSetoran: item.totalSetoran,
        targetBulanan: item.targetSetoran,
        progressBulananPersen: progress,
        status: item.status,
        pendingReason: item.status === 'pending' ? 'Perlu follow-up transaksi pending di wilayah ini.' : undefined,
        kontak: item.kontak,
        pengurus: [
          { id: `${item.id}-p1`, nama: item.nama, peran: 'PLPK', kontak: item.kontak },
          { id: `${item.id}-p2`, nama: `Sekretaris ${item.ranting.replace(/^Ranting\s+/i, '')}`, peran: 'Sekretaris' },
        ],
        wilayah: item.wilayahNames.map((wilayah, wilayahIndex) => ({ id: `${item.id}-w-${wilayahIndex + 1}`, nama: wilayah })),
        performaBulanan: {
          target: item.targetSetoran,
          realisasi: item.totalSetoran,
          ranking: index + 1,
          lastActivityAt: item.lastActivity,
        },
        monitoring: {
          kontribusi: item.wilayahNames.map((wilayah, wilayahIndex) => ({
            wilayah,
            persen: Math.max(10, Math.round(100 / contributionBase) + (wilayahIndex === 0 ? 10 : 0)),
          })),
          penghimpunanScore: item.performanceScore,
          realisasiPeriode: item.totalSetoran,
          pertumbuhanPersen: item.status === 'aktif' ? 7.2 : item.status === 'pending' ? 1.8 : -5.1,
        },
        riwayatSetoran: Array.from({ length: 5 }).map((_, historyIndex) => ({
          id: `${item.id}-rs-${historyIndex + 1}`,
          tanggal: new Date(Date.parse(item.lastActivity) - historyIndex * 2 * 24 * 60 * 60 * 1000).toISOString(),
          nominal: Math.round(item.totalSetoran / 10) + historyIndex * 175000,
          metode: historyIndex % 2 === 0 ? 'scan' : 'manual',
          status: historyIndex === 0 && item.pendingTransactions > 0 ? 'pending' : historyIndex === 3 && item.status === 'nonaktif' ? 'invalid' : 'valid',
        })),
      }
    })
  }, [])

  const [rows, setRows] = useState<RantingPlpkRow[]>(initialRows)

  // Filters/search
  const [search, setSearch] = useState('')
  const [kecamatan, setKecamatan] = useState<string>('all')
  const [ranting, setRanting] = useState<string>('all')
  const [status, setStatus] = useState<PlpkStatus | 'all'>('all')
  const [filterPlpk, setFilterPlpk] = useState<string>('all')

  const kecamatanOptions = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.kecamatan)))], [rows])
  const rantingOptions = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.ranting)))], [rows])
  const plpkOptions = useMemo(() => ['all', ...rows.map((r) => r.id)], [rows])

  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (s) {
        const hay = [
          r.id,
          r.nama,
          r.ranting,
          r.kecamatan,
          r.kontak,
          r.status,
          r.pengurus.map((p) => p.nama).join(' '),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(s)) return false
      }
      if (kecamatan !== 'all' && r.kecamatan !== kecamatan) return false
      if (ranting !== 'all' && r.ranting !== ranting) return false
      if (status !== 'all' && r.status !== status) return false
      if (filterPlpk !== 'all' && r.id !== filterPlpk) return false
      return true
    })
  }, [rows, search, kecamatan, ranting, status, filterPlpk])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6
  const totalItems = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const pageRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredRows.slice(startIdx, startIdx + pageSize)
  }, [filteredRows, currentPage])

  // Drawer detail
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<RantingPlpkRow | null>(null)

  const openDetail = (row: RantingPlpkRow) => {
    setSelected(row)
    setDetailOpen(true)
  }

  // Edit flow
  const [editEnabled, setEditEnabled] = useState(false)
  const [editNama, setEditNama] = useState('')
  const [editKontak, setEditKontak] = useState('')
  const [editStatus, setEditStatus] = useState<PlpkStatus>('pending')
  const [editTarget, setEditTarget] = useState<number>(0)
  const [editWilayah, setEditWilayah] = useState<string[]>([])

  const startEditFromSelected = () => {
    if (!selected) return
    setEditEnabled(true)
    setEditNama(selected.nama)
    setEditKontak(selected.kontak)
    setEditStatus(selected.status)
    setEditTarget(selected.targetBulanan)
    setEditWilayah(selected.wilayah.map((w) => w.nama))
  }

  const cancelEdit = () => {
    setEditEnabled(false)
    setEditNama('')
    setEditKontak('')
    setEditStatus('pending')
    setEditTarget(0)
    setEditWilayah([])
  }

  const saveEdit = () => {
    if (!selected) return
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== selected.id) return r
        return {
          ...r,
          nama: editNama,
          kontak: editKontak,
          status: editStatus,
          targetBulanan: editTarget,
          wilayah: editWilayah.map((w, idx) => ({ id: `${r.id}-w-edit-${idx + 1}`, nama: w })),
        }
      }),
    )
    toast({ variant: 'default', title: 'Perubahan tersimpan', description: 'State lokal diperbarui.' })
    cancelEdit()
  }

  // Bulk actions
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'aktif' | 'nonaktif' | 'export'>('aktif')
  const [confirmIds, setConfirmIds] = useState<string[]>([])

  const openConfirm = (ids: string[], action: 'aktif' | 'nonaktif' | 'export') => {
    setConfirmIds(ids)
    setConfirmAction(action)
    setConfirmOpen(true)
  }

  const applyConfirm = () => {
    if (confirmAction === 'aktif') {
      setRows((prev) => prev.map((r) => (confirmIds.includes(r.id) ? { ...r, status: 'aktif' } : r)))
      toast({ variant: 'default', title: 'Bulk aktifkan selesai', description: `Mengubah ${confirmIds.length} PLPK.` })
    } else if (confirmAction === 'nonaktif') {
      setRows((prev) => prev.map((r) => (confirmIds.includes(r.id) ? { ...r, status: 'nonaktif' } : r)))
      toast({ variant: 'default', title: 'Bulk nonaktifkan selesai', description: `Mengubah ${confirmIds.length} PLPK.` })
    } else {
      const count = confirmIds.length
      toast({ variant: 'default', title: 'Export siap', description: `Membuat export untuk ${count} data.` })
    }
    setConfirmOpen(false)
    setConfirmIds([])
  }

  // Export mock
  const exportData = (ids?: string[], format?: 'pdf' | 'excel') => {
    const count = ids?.length ?? filteredRows.length
    if (format === 'pdf') {
      exportReportToPdf({
        title: 'Laporan Ranting & PLPK GORUT',
        subtitle: `${count} data dipilih`,
        summary: [
          { label: 'Total Ranting', value: String(stats.totalRanting) },
          { label: 'PLPK Aktif', value: String(stats.plpkAktif) },
          { label: 'Wilayah Aktif', value: String(stats.wilayahAktif) },
          { label: 'Data Diexport', value: String(count) },
        ],
        tables: [{
          title: 'Daftar PLPK',
          columns: ['PLPK', 'Ranting', 'Kecamatan', 'Setoran', 'Target', 'Skor', 'Status'],
          rows: filteredRows.filter((row) => !ids || ids.includes(row.id)).map((row) => [row.nama, row.ranting, row.kecamatan, formatRupiah(row.totalSetoran), formatRupiah(row.targetBulanan), String(row.monitoring.penghimpunanScore), row.status]),
        }],
      })
      return
    }
    if (format === 'excel') {
      exportRowsToSpreadsheet({
        fileName: 'ranting-plpk.xlsx',
        rows: [
          ['PLPK', 'Ranting', 'Kecamatan', 'Setoran', 'Target', 'Skor', 'Status'],
          ...filteredRows.filter((row) => !ids || ids.includes(row.id)).map((row) => [row.nama, row.ranting, row.kecamatan, formatRupiah(row.totalSetoran), formatRupiah(row.targetBulanan), String(row.monitoring.penghimpunanScore), row.status]),
        ],
        format: 'xlsx',
      })
      return
    }
    toast({
      variant: 'default',
      title: `Export ${format === 'pdf' ? 'PDF' : 'Excel'} siap`,
      description: `${format === 'pdf' ? 'Laporan siap dicetak' : 'File Excel berhasil dibuat'} untuk ${count} PLPK.`,
    })
  }

  // Table columns/rows
  const columns = [
    { id: 'id', label: 'ID PLPK', sortable: false },
    { id: 'nama', label: 'Nama PLPK', sortable: false },
    { id: 'ranting', label: 'Ranting', sortable: false },
    { id: 'kecamatan', label: 'Kecamatan', sortable: false },
    { id: 'jumlahMunfiq', label: 'Jumlah Munfiq', sortable: false },
    { id: 'totalSetoran', label: 'Total Setoran', sortable: false },
    { id: 'targetBulanan', label: 'Target Bulanan', sortable: false },
    { id: 'progress', label: 'Progress', sortable: false },
    { id: 'status', label: 'Status', sortable: false },
    { id: 'aksi', label: 'Aksi', sortable: false },
  ] as const

  const tableRows = pageRows.map((r) => {
    const meta = statusBadge(r.status)
    return {
      id: r.id,
      nama: <span className="font-medium">{r.nama}</span>,
      ranting: <span className="text-sm text-muted-foreground">{r.ranting}</span>,
      kecamatan: r.kecamatan,
      jumlahMunfiq: r.jumlahMunfiq,
      totalSetoran: <span className="font-semibold">{formatRupiah(r.totalSetoran)}</span>,
      targetBulanan: <span className="text-sm text-muted-foreground">{formatRupiah(r.targetBulanan)}</span>,
      progress: (
        <div className="min-w-[140px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">{r.progressBulananPersen}%</span>
            <ProgressBar value={r.progressBulananPersen} max={100} />
          </div>
        </div>
      ),
      status: (
        <StatusIndicator
          status={meta.status}
          label={meta.label}
          variant="compact"
          size="sm"
        />
      ),
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
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              openDetail(r)
              setTimeout(() => startEditFromSelected(), 50)
            }}
            title="Edit"
          >
            <Pencil className="size-4 mr-2" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              openDetail(r)
              toast({ variant: 'default', title: 'Monitoring dibuka', description: 'Gunakan drawer untuk melihat performa detail.' })
            }}
            title="Monitoring"
          >
            <Activity className="size-4 mr-2" />
            Monitoring
          </Button>
        </div>
      ),
    }
  })

  const resetFilters = () => {
    setSearch('')
    setKecamatan('all')
    setRanting('all')
    setStatus('all')
    setFilterPlpk('all')
    setCurrentPage(1)
    toast({ variant: 'default', title: 'Filter direset', description: 'Kembali ke data awal.' })
  }

  const stats = useMemo(() => {
    const totalRanting = rows.length
    const totalPlpk = rows.length
    const plpkAktif = rows.filter((r) => r.status === 'aktif').length
    const wilayahAktif = rows.reduce((acc, r) => acc + (r.status === 'aktif' ? r.wilayah.length : 0), 0)
    return { totalRanting, totalPlpk, plpkAktif, wilayahAktif }
  }, [rows])

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="GORUT / Ranting & PLPK"
        description="Kelola ranting NU, petugas PLPK, wilayah penugasan, dan monitoring performa lapangan."
        action={null}
        className="mb-4"
      />

      <StatsGrid>
        <StatCard icon={ShieldCheck} label="Total Ranting" value={stats.totalRanting} description="Ranting terdaftar" trend="stable" trendDirection="stable" />
        <StatCard icon={Coins} label="Total PLPK" value={stats.totalPlpk} description="Petugas PLPK terdaftar" trend="up" trendDirection="up" />
        <StatCard icon={CheckCircle2} label="PLPK Aktif" value={stats.plpkAktif} description="Sedang operasional" trend="this month" trendDirection="up" />
        <StatCard icon={MapPin} label="Total Wilayah Aktif" value={stats.wilayahAktif} description="Wilayah dalam status aktif" trend="pending" trendDirection="up" />
      </StatsGrid>

      <ContentCard title="Pencarian & Filter" description="Pilih kriteria untuk mempersempit daftar PLPK dan ranting.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Cari ID, nama PLPK, ranting, kontak..."
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
                    setCurrentPage(1)
                  }}
                >
                  {kecamatanOptions.map((v) => (
                    <option key={v} value={v}>
                      {v === 'all' ? 'Semua kecamatan' : v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Filter Ranting</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
                  value={ranting}
                  onChange={(e) => {
                    setRanting(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  {rantingOptions.map((v) => (
                    <option key={v} value={v}>
                      {v === 'all' ? 'Semua ranting' : v}
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
                    setStatus(e.target.value as PlpkStatus | 'all')
                    setCurrentPage(1)
                  }}
                >
                  <option value="all">Semua status</option>
                  <option value="aktif">Aktif</option>
                  <option value="pending">Pending</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">Filter PLPK</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
                  value={filterPlpk}
                  onChange={(e) => {
                    setFilterPlpk(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  {plpkOptions.map((v) => (
                    <option key={v} value={v}>
                      {v === 'all' ? 'Semua PLPK' : v}
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
              search || kecamatan !== 'all' || ranting !== 'all' || status !== 'all' || filterPlpk !== 'all'
                ? 'Tidak ada hasil untuk filter yang dipilih.'
                : 'Belum ada data ranting/PLPK.'
            }
            bulkActions={[
              {
                label: 'Bulk Aktifkan',
                icon: CheckCircle2,
                variant: 'default',
                show: (count) => count > 0,
                onClick: (ids) => openConfirm(ids, 'aktif'),
              },
              {
                label: 'Bulk Nonaktifkan',
                icon: XCircle,
                variant: 'destructive',
                show: (count) => count > 0,
                onClick: (ids) => openConfirm(ids, 'nonaktif'),
              },
              {
                label: 'Bulk Export',
                icon: Download,
                variant: 'secondary',
                show: (count) => count > 0,
                onClick: (ids) => openConfirm(ids, 'export'),
              },
            ]}
            onRowClick={(rowId) => {
              const r = rows.find((x) => x.id === rowId)
              if (r) openDetail(r)
            }}
          />

          <div className="mt-4">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              pageSize={pageSize}
              totalItems={totalItems}
            />
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o)
          if (!o) {
            setSelected(null)
            setEditEnabled(false)
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
            <SheetTitle className="text-lg">Detail PLPK</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Informasi PLPK, wilayah, ranting, kontak, kontribusi, performa bulanan, dan riwayat setoran.
            </SheetDescription>
          </div>

          <EnhancedSheetBody>
            {!selected ? (
              <div className="py-10 text-center text-muted-foreground">Pilih PLPK untuk melihat detail.</div>
            ) : (
              <div className="space-y-6">
                <ModalSection title="Informasi PLPK">
                  <FormGroup>
                    <FormRow columns={2}>
                      <InfoItem label="ID PLPK" value={<span className="font-semibold">{selected.id}</span>} />
                      <InfoItem
                        label="Status"
                        value={
                          <StatusIndicator
                            status={statusBadge(selected.status).status}
                            label={statusBadge(selected.status).label}
                            variant="default"
                            size="sm"
                          />
                        }
                      />
                    </FormRow>
                    <FormRow columns={2}>
                      <InfoItem label="Nama PLPK" value={selected.nama} />
                      <InfoItem label="Ranting" value={selected.ranting} />
                    </FormRow>
                    <FormRow columns={2}>
                      <InfoItem label="Kecamatan" value={selected.kecamatan} />
                      <InfoItem label="Kontak" value={selected.kontak} />
                    </FormRow>
                    {selected.pendingReason ? (
                      <div className="mt-2 rounded-lg border border-border/50 bg-card p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Alasan pending</p>
                        <p className="text-sm font-medium mt-1">{selected.pendingReason}</p>
                      </div>
                    ) : null}
                  </FormGroup>
                </ModalSection>

                <ModalSection title="Wilayah Penugasan">
                  <div className="space-y-2">
                    {selected.wilayah.map((w) => (
                      <div key={w.id} className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-card p-3">
                        <p className="text-sm font-medium truncate">{w.nama}</p>
                        <span className="text-xs text-emerald-400">●</span>
                      </div>
                    ))}
                  </div>
                </ModalSection>

                <ModalSection title="Kontak & Pengurus">
                  <div className="space-y-3">
                    {selected.pengurus.map((p) => (
                      <div key={p.id} className="rounded-lg border border-border/50 bg-card p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.nama}</p>
                            <p className="text-xs text-muted-foreground">{p.peran}</p>
                            {p.kontak ? <p className="text-xs text-muted-foreground mt-1">{p.kontak}</p> : null}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast({ variant: 'default', title: 'Kontak dibuka', description: 'Integrasi kontak bisa diarahkan ke WhatsApp atau telepon pada tahap berikutnya.' })}
                          >
                            <Eye className="size-4 mr-2" />
                            Lihat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ModalSection>

                <ModalSection title="Statistik Kontribusi & Performa Bulanan">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/50 bg-card p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target vs Realisasi</p>
                      <p className="text-sm font-semibold mt-2">
                        {formatRupiah(selected.performaBulanan.realisasi)}{' '}
                        <span className="text-muted-foreground font-normal">/ {formatRupiah(selected.performaBulanan.target)}</span>
                      </p>
                      <div className="mt-3">
                        <ProgressBar value={Math.round((selected.performaBulanan.realisasi / Math.max(1, selected.performaBulanan.target)) * 100)} max={100} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Ranking kontribusi: <span className="font-medium text-foreground">{selected.performaBulanan.ranking}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aktivitas terakhir: {formatDateShort(selected.performaBulanan.lastActivityAt)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border/50 bg-card p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kontribusi Wilayah</p>
                      <div className="mt-3 space-y-2">
                        {selected.monitoring.kontribusi.map((k) => (
                          <div key={k.wilayah} className="flex items-center justify-between gap-4">
                            <p className="text-xs text-muted-foreground truncate">{k.wilayah}</p>
                            <p className="text-xs font-semibold">{k.persen}%</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Score penghimpunan</p>
                        <p className="text-sm font-semibold mt-1">{selected.monitoring.penghimpunanScore}/100</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Pertumbuhan: {selected.monitoring.pertumbuhanPersen > 0 ? '+' : ''}{selected.monitoring.pertumbuhanPersen}%
                        </p>
                      </div>
                    </div>
                  </div>
                </ModalSection>

                <ModalSection title="Riwayat Setoran">
                  <div className="space-y-2">
                    {selected.riwayatSetoran.slice().reverse().map((rs) => {
                      const status =
                        rs.status === 'valid'
                          ? { st: 'approved' as const, label: 'Valid' }
                          : rs.status === 'invalid'
                            ? { st: 'rejected' as const, label: 'Ditolak' }
                            : { st: 'pending' as const, label: 'Pending' }

                      return (
                        <div key={rs.id} className="rounded-lg border border-border/50 bg-card p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{formatRupiah(rs.nominal)}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDateShort(rs.tanggal)} • {toMetodeLabel(rs.metode)}
                              </p>
                            </div>
                            <StatusIndicator status={status.st} label={status.label} variant="compact" size="sm" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ModalSection>

                {/* Edit flow content */}
                {!editEnabled ? null : (
                  <ModalSection title="Edit PLPK">
                    <FormGroup>
                      <FormRow columns={2}>
                        <InfoItem
                          label="Nama PLPK"
                          value={
                            <Input value={editNama} onChange={(e) => setEditNama(e.target.value)} />
                          }
                        />
                        <InfoItem
                          label="Kontak"
                          value={
                            <Input value={editKontak} onChange={(e) => setEditKontak(e.target.value)} />
                          }
                        />
                      </FormRow>

                      <FormRow columns={2}>
                        <InfoItem
                          label="Status"
                          value={
                            <select
                              className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as PlpkStatus)}
                            >
                              <option value="aktif">Aktif</option>
                              <option value="pending">Pending</option>
                              <option value="nonaktif">Nonaktif</option>
                            </select>
                          }
                        />
                        <InfoItem
                          label="Target Bulanan"
                          value={
                            <Input
                              value={String(editTarget)}
                              onChange={(e) => setEditTarget(Number(e.target.value || 0))}
                            />
                          }
                        />
                      </FormRow>

                      <div className="rounded-lg border border-border/50 bg-card p-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wilayah</p>
                        <p className="text-xs text-muted-foreground mt-1">Untuk edit wilayah: toggle daftar dari wilayah saat ini.</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected.wilayah.map((w) => {
                            const checked = editWilayah.includes(w.nama)
                            return (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => {
                                  setEditWilayah((prev) =>
                                    checked ? prev.filter((x) => x !== w.nama) : [...prev, w.nama],
                                  )
                                }}
                                className={cn(
                                  'px-3 py-1.5 rounded-full border text-xs font-medium',
                                  checked ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400' : 'border-border/50 bg-muted/20 text-muted-foreground',
                                )}
                              >
                                {w.nama}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </FormGroup>
                  </ModalSection>
                )}
              </div>
            )}
          </EnhancedSheetBody>

          <EnhancedSheetFooter>
            <div className="flex gap-2 w-full justify-between">
              <div className="flex gap-2">
                {selected && !editEnabled ? (
                  <Button variant="outline" onClick={startEditFromSelected}>
                    <Pencil className="size-4 mr-2" />
                    Edit
                  </Button>
                ) : null}
                {selected && editEnabled ? (
                  <Button variant="ghost" onClick={cancelEdit}>
                    Batal Edit
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailOpen(false)
                    setSelected(null)
                    cancelEdit()
                  }}
                >
                  Tutup
                </Button>
                {selected && editEnabled ? (
                  <Button variant="default" onClick={saveEdit}>
                    Simpan Perubahan
                  </Button>
                ) : null}
              </div>
            </div>
          </EnhancedSheetFooter>
        </SheetContent>
      </Sheet>

      {/* Bulk confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Bulk</DialogTitle>
            <DialogDescription>
              {confirmAction === 'aktif'
                ? 'Aktifkan PLPK terpilih?'
                : confirmAction === 'nonaktif'
                  ? 'Nonaktifkan PLPK terpilih?'
                  : 'Lanjutkan export untuk data terpilih?'}
            </DialogDescription>
          </DialogHeader>

          <ResponsiveDialogContent>
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <p className="text-sm font-medium">Jumlah data: {confirmIds.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Perubahan hanya tersimpan pada state lokal.
              </p>
              <div className="mt-3 space-y-2">
                {confirmIds.slice(0, 5).map((id) => (
                  <div key={id} className="text-xs text-muted-foreground">
                    • {id}
                  </div>
                ))}
                {confirmIds.length > 5 ? (
                  <div className="text-xs text-muted-foreground">• ... dan {confirmIds.length - 5} lainnya</div>
                ) : null}
              </div>
            </div>
          </ResponsiveDialogContent>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              variant={confirmAction === 'aktif' ? 'default' : confirmAction === 'nonaktif' ? 'destructive' : 'default'}
              onClick={applyConfirm}
            >
              Ya, Lanjut
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  )
}
