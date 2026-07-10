'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EnhancedTable, TablePagination } from '@/components/gorut/enhanced-table'
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
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import type { SetoranKoin } from '@/lib/gorut/types'
import { useAuth } from '@/lib/auth-context'
import { type MetodePembayaran, type ValidasiRow, type ValidasiWorkflowStage, processGorutVerification, useGorutValidasiRows } from '@/lib/gorut/validasi-control'
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  XCircle,
  Clock,
  Coins,
  MapPin,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState, MetricCard, PageSectionHeader } from '@/components/ui/ds-patterns'

type ValidasiFilter = 'all' | 'pending' | 'valid' | 'invalid'
const STATUS_META: Record<
  'pending' | 'valid' | 'invalid',
  { label: string; status: 'pending' | 'approved' | 'rejected' }
> = {
  pending: { label: 'Pending', status: 'pending' },
  valid: { label: 'Valid', status: 'approved' },
  invalid: { label: 'Ditolak', status: 'rejected' },
}

function statusBadgeFor(validasi: SetoranKoin['validasi']) {
  if (validasi === 'pending') return STATUS_META.pending
  if (validasi === 'valid') return STATUS_META.valid
  return STATUS_META.invalid
}

function toMetodeLabel(metode: MetodePembayaran) {
  return metode === 'scan' ? 'Scan QRIS' : 'Manual'
}

export default function ValidasiSetoranPage({ stageOverride }: { stageOverride?: ValidasiWorkflowStage } = {}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const validationStage: ValidasiWorkflowStage = stageOverride ?? (user?.role === 'admin_kordes' ? 'ranting' : 'upzis')
  const rows = useGorutValidasiRows(validationStage)
  const stageLabel = validationStage === 'pc' ? 'PC' : validationStage === 'upzis' ? 'UPZIS' : 'Ranting'
  const approvalRoleLabel = validationStage === 'pc' ? 'Admin PC' : validationStage === 'upzis' ? 'Admin UPZIS' : 'Admin Ranting/Kordes'
  const canManageValidation = validationStage === 'pc' ? user?.role === 'admin_pc' : validationStage === 'upzis' ? user?.role === 'admin_upzis' : user?.role === 'admin_kordes'

  const penghimpunanQueue = useMemo(() => {
    return rows.map((item) => ({
      id: item.id,
      stageLabel: validationStage === 'pc' ? 'UPZIS - PC' : validationStage === 'upzis' ? 'Ranting - UPZIS' : 'PLPK - Ranting',
      title: item.transactionCode ?? item.id,
      subtitle: item.plpk,
      wilayah: item.kecamatan,
      periode: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(item.tanggal)),
      aktif: 1,
      terjemput: 1,
      nominal: item.nominal,
    }))
  }, [rows, validationStage])

  const penghimpunanStats = useMemo(() => ({
    pending: penghimpunanQueue.length,
    plpkKordes: penghimpunanQueue.length,
    kordesUpzis: 0,
    upzisPc: 0,
  }), [penghimpunanQueue])

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
        const hay = [r.id, r.transactionCode ?? '', r.munfiqNama, r.kecamatan, r.plpk, r.validasi, r.catatanAdmin ?? '', r.notes ?? ''].join(' ').toLowerCase()
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

  // ---------- Drawer + confirmation ----------
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<ValidasiRow | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'valid' | 'return' | 'invalid'>('valid')
  const [confirmIds, setConfirmIds] = useState<string[]>([])

  const openDetail = (row: ValidasiRow) => {
    setSelectedRow(row)
    setDetailOpen(true)
  }

  const openConfirm = (ids: string[], action: 'valid' | 'return' | 'invalid') => {
    if (!canManageValidation) {
      toast({
        variant: 'destructive',
        title: 'Aksi tidak diizinkan',
        description: `Verifikasi ${stageLabel} hanya bisa diproses oleh ${approvalRoleLabel}.`,
      })
      return
    }

    setConfirmIds(ids)
    setConfirmAction(action)
    setConfirmOpen(true)
  }

  const applyValidation = () => {
    if (!canManageValidation) {
      toast({
        variant: 'destructive',
        title: 'Aksi tidak diizinkan',
        description: `Verifikasi ${stageLabel} hanya bisa diproses oleh ${approvalRoleLabel}.`,
      })
      return
    }

    const workflowAction = confirmAction === 'valid' ? validationStage === 'pc' ? 'final_close' : 'approve' : confirmAction === 'return' ? 'return' : 'reject'
    const actionLabel = confirmAction === 'valid' ? validationStage === 'pc' ? 'Final close berhasil' : `Approve ${stageLabel} berhasil` : confirmAction === 'return' ? 'Pengembalian berhasil' : 'Penolakan berhasil'
    const notes = confirmAction === 'valid'
      ? validationStage === 'pc' ? 'Final approval dan closing Admin PC.' : `Disetujui ${approvalRoleLabel}.`
      : confirmAction === 'return'
        ? validationStage === 'pc' ? 'Dikembalikan ke UPZIS untuk revisi.' : validationStage === 'upzis' ? 'Dikembalikan ke Ranting/Kordes untuk revisi.' : 'Dikembalikan ke PLPK untuk revisi.'
        : `Ditolak ${approvalRoleLabel}.`

    void Promise.all(confirmIds.map((id) => processGorutVerification({ id, action: workflowAction, stage: validationStage, notes })))
      .then(() => {
        setConfirmOpen(false)
        setConfirmIds([])
        if (selectedRow && confirmIds.includes(selectedRow.id)) {
          setSelectedRow(null)
          setDetailOpen(false)
        }
        toast({
          variant: 'default',
          title: actionLabel,
          description: 'Workflow transaksi berhasil diperbarui.',
        })
      })
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Gagal menyimpan validasi',
          description: error instanceof Error ? error.message : 'Perubahan validasi belum berhasil disimpan.',
        })
      })
  }

  // ---------- Export mock ----------
  const exportData = (ids?: string[], format?: 'pdf' | 'excel') => {
    const count = ids?.length ?? filteredRows.length
    const exportRows = rows.filter((row) => !ids || ids.includes(row.id))

    if (format === 'pdf') {
      exportReportToPdf({
        title: 'Laporan Verifikasi Penghimpunan GORUT',
        subtitle: `${count} data validasi ${ids?.length ? 'terpilih' : 'sesuai filter'}`,
        summary: [
          { label: 'Pending', value: String(exportRows.filter((row) => row.validasi === 'pending').length) },
          { label: 'Valid', value: String(exportRows.filter((row) => row.validasi === 'valid').length) },
          { label: 'Ditolak', value: String(exportRows.filter((row) => row.validasi === 'invalid').length) },
          { label: 'Nominal Total', value: formatRupiah(exportRows.reduce((acc, row) => acc + row.nominal, 0)) },
        ],
        tables: [{
          title: 'Daftar Verifikasi Penghimpunan',
          columns: ['ID', 'Kode Transaksi', 'Munfiq', 'Kecamatan', 'PLPK', 'Tanggal', 'Nominal', 'Metode', 'Status', 'Validator', 'Catatan'],
          rows: exportRows.map((row) => [row.id, row.transactionCode ?? '-', row.munfiqNama, row.kecamatan, row.plpk, formatDateShort(row.tanggal), formatRupiah(row.nominal), toMetodeLabel(row.metode), row.validasi, row.validator ?? '-', row.catatanAdmin ?? '-']),
        }],
        notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
      })
      return
    }

    if (format === 'excel') {
      exportRowsToSpreadsheet({
        fileName: `verifikasi-penghimpunan-${new Date().toISOString().slice(0, 10)}.xlsx`,
        rows: [
          ['ID Penghimpunan', 'Kode Transaksi', 'Nama Munfiq', 'Kecamatan', 'PLPK', 'Tanggal', 'Nominal', 'Metode', 'Status', 'Validator', 'Catatan Admin'],
          ...exportRows.map((row) => [
            row.id,
            row.transactionCode ?? '',
            row.munfiqNama,
            row.kecamatan,
            row.plpk,
            row.tanggal,
            String(row.nominal),
            row.metode,
            row.validasi,
            row.validator ?? '',
            row.catatanAdmin ?? '',
          ]),
        ],
        format: 'xlsx',
      })
      toast({
        variant: 'default',
        title: 'Export Excel siap',
        description: `File Excel berhasil dibuat untuk ${count} data validasi.`,
      })
    }
  }

  // ---------- Stats ----------
  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.validasi === 'pending').length
    const valid = rows.filter((r) => r.validasi === 'valid').length
    const invalid = rows.filter((r) => r.validasi === 'invalid').length
    const totalNominalPending = rows
      .filter((r) => r.validasi === 'pending')
      .reduce((acc, r) => acc + r.nominal, 0)

    return { pending, valid, invalid, totalNominalPending }
  }, [rows])

  // ---------- Table ----------
  const columns = [
    { id: 'id', label: 'ID Penghimpunan', sortable: false },
    { id: 'munfiqNama', label: 'Nama Munfiq', sortable: false },
    { id: 'kecamatan', label: 'Kecamatan', sortable: false },
    { id: 'plpk', label: 'PLPK', sortable: false },
    { id: 'tanggal', label: 'Tanggal', sortable: false },
    { id: 'nominal', label: 'Nominal', sortable: false },
    { id: 'bukti', label: 'Bukti Penghimpunan', sortable: false },
    { id: 'validasi', label: 'Status', sortable: false },
    { id: 'aksi', label: 'Aksi', sortable: false },
  ] as const

  const tableRows = pageRows.map((r) => {
    const meta = statusBadgeFor(r.validasi)
    return {
      id: r.id,
      munfiqNama: <div><span className="font-medium">{r.munfiqNama}</span><p className="text-xs text-muted-foreground">{r.transactionCode ?? r.id}</p></div>,
      kecamatan: r.kecamatan,
      plpk: r.plpk,
      tanggal: <span className="text-sm">{formatDateShort(r.tanggal)}</span>,
      nominal: <span className="font-semibold">{formatRupiah(r.nominal)}</span>,
      bukti: (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              openDetail(r)
            }}
          >
            Preview
          </Button>
        </div>
      ),
      validasi: <StatusIndicator status={meta.status} label={meta.label} variant="compact" size="sm" />,
      aksi: (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="min-h-[40px]"
            onClick={(e) => {
              e.stopPropagation()
              openDetail(r)
            }}
          >
            Lihat Detail
          </Button>

          <Button
            size="sm"
            variant={r.validasi === 'pending' ? 'default' : 'secondary'}
            disabled={r.validasi !== 'pending'}
            className="min-h-[40px]"
            onClick={(e) => {
              e.stopPropagation()
              openConfirm([r.id], 'valid')
            }}
          >
            {validationStage === 'pc' ? 'Final Close' : 'Approve'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            disabled={r.validasi !== 'pending'}
            className="min-h-[40px]"
            onClick={(e) => {
              e.stopPropagation()
              openConfirm([r.id], 'return')
            }}
          >
            Kembalikan
          </Button>

          <Button
            size="sm"
            variant={r.validasi === 'pending' ? 'destructive' : 'secondary'}
            disabled={r.validasi !== 'pending'}
            className="min-h-[40px]"
            onClick={(e) => {
              e.stopPropagation()
              openConfirm([r.id], 'invalid')
            }}
          >
            Tolak
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

  return (
    <div className="min-w-0 space-y-8" role="main" aria-label={validationStage === 'pc' ? 'Approval PC' : 'Validasi Setoran'}>
      <PageSectionHeader
        title={<h1 className="text-2xl font-bold tracking-tight">{validationStage === 'pc' ? 'Final Approval' : `Validasi ${stageLabel}`}</h1>}
        description={`Pusat verifikasi untuk transaksi yang menunggu pemeriksaan ${approvalRoleLabel}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Pending Verifikasi"
          value={stats.pending}
          description="Menunggu diperiksa"
          icon={Clock}
          iconTone="bg-amber-500/10 text-amber-600"
          accent="from-amber-500/15 via-amber-500/5 to-transparent"
        />
        <MetricCard
          title="Telah Disetujui"
          value={stats.valid}
          description="Sudah divalidasi"
          icon={CheckCircle2}
          iconTone="bg-emerald-500/10 text-emerald-600"
          accent="from-emerald-500/15 via-emerald-500/5 to-transparent"
        />
        <MetricCard
          title="Ditolak"
          value={stats.invalid}
          description="Dikembalikan atau batal"
          icon={XCircle}
          iconTone="bg-red-500/10 text-red-600"
          accent="from-red-500/15 via-red-500/5 to-transparent"
        />
        <MetricCard
          title="Nominal Pending"
          value={formatRupiah(stats.totalNominalPending)}
          description="Nilai antrean verifikasi"
          icon={Coins}
          iconTone="bg-violet-500/10 text-violet-600"
          accent="from-violet-500/15 via-violet-500/5 to-transparent"
        />
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Antrean Saat Ini</p><p className="mt-2 text-2xl font-bold text-emerald-600">{penghimpunanStats.pending}</p></div>
            <div className="rounded-xl border border-border bg-muted/20 p-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">PLPK - Ranting</p><p className="mt-2 text-2xl font-bold">{validationStage === 'ranting' ? penghimpunanStats.plpkKordes : 0}</p></div>
            <div className="rounded-xl border border-border bg-muted/20 p-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ranting - UPZIS</p><p className="mt-2 text-2xl font-bold">{validationStage === 'upzis' ? penghimpunanStats.pending : penghimpunanStats.kordesUpzis}</p></div>
            <div className="rounded-xl border border-border bg-muted/20 p-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">UPZIS - PC</p><p className="mt-2 text-2xl font-bold">{validationStage === 'pc' ? penghimpunanStats.pending : penghimpunanStats.upzisPc}</p></div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold whitespace-nowrap">Tahap</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Objek</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Wilayah</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Periode</TableHead>
                  <TableHead className="text-right font-semibold whitespace-nowrap">Aktif</TableHead>
                  <TableHead className="text-right font-semibold whitespace-nowrap">Terjemput</TableHead>
                  <TableHead className="text-right font-semibold whitespace-nowrap">Nominal</TableHead>
                  <TableHead className="text-right font-semibold whitespace-nowrap">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penghimpunanQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-6">
                      <EmptyState
                        inline
                        icon={CheckCircle2}
                        title={`Belum ada antrean verifikasi ${stageLabel}`}
                        description={`Antrean kosong. Transaksi akan muncul setelah tahap sebelumnya mengirim setoran ke ${approvalRoleLabel}.`}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  penghimpunanQueue.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 border border-emerald-500/20">{item.stageLabel}</span></TableCell>
                      <TableCell className="whitespace-nowrap"><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.subtitle}</p></div></TableCell>
                      <TableCell className="whitespace-nowrap">{item.wilayah}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.periode}</TableCell>
                      <TableCell className="text-right">{item.aktif.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right">{item.terjemput.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">{formatRupiah(item.nominal)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button size="sm" onClick={() => openConfirm([item.id], 'valid')} disabled={!canManageValidation} className="min-h-[44px]">{validationStage === 'pc' ? 'Final Close' : 'Approve'}</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Search className="size-4 text-muted-foreground" />
                Pencarian & Filter
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Pencarian</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Cari..."
                      className="min-h-[44px] pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Kecamatan</p>
                  <select
                    className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={kecamatan}
                    onChange={(e) => {
                      setKecamatan(e.target.value)
                      setCurrentPage(1)
                    }}
                  >
                    {kecamatans.map((v) => (
                      <option key={v} value={v}>
                        {v === 'all' ? 'Semua kecamatan' : v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">PLPK</p>
                  <select
                    className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={plpk}
                    onChange={(e) => {
                      setPlpk(e.target.value)
                      setCurrentPage(1)
                    }}
                  >
                    {plpkList.map((v) => (
                      <option key={v} value={v}>
                        {v === 'all' ? 'Semua PLPK' : v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <select
                    className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as ValidasiFilter)
                      setCurrentPage(1)
                    }}
                  >
                    <option value="all">Semua status</option>
                    <option value="pending">Pending</option>
                    <option value="valid">Valid</option>
                    <option value="invalid">Ditolak</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Tanggal</p>
                  <select
                    className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={tanggal}
                    onChange={(e) => {
                      setTanggal(e.target.value)
                      setCurrentPage(1)
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

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="min-h-[44px]" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => exportData(undefined, 'pdf')}>
                  <FileText className="mr-2 size-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => exportData(undefined, 'excel')}>
                  <FileSpreadsheet className="mr-2 size-4" />
                  Excel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Setoran menunggu verifikasi.</p>
              {!canManageValidation ? <p className="text-xs text-muted-foreground">Aksi validasi hanya aktif untuk {approvalRoleLabel}.</p> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-0">
          <EnhancedTable
            columns={columns.map((c) => ({ id: c.id, label: c.label }))}
            rows={tableRows}
            selectable
            emptyMessage={
              search || kecamatan !== 'all' || plpk !== 'all' || status !== 'all' || tanggal !== 'all'
                ? 'Tidak ada hasil untuk filter yang dipilih.'
                : 'Belum ada data validasi.'
            }
            emptyTitle={`Belum ada data validasi ${stageLabel}`}
            emptyDescription="Jika PLPK sudah submit setoran, transaksi akan muncul di sini sesuai tahap workflow."
            emptyAction={<Button variant="outline" size="sm" onClick={resetFilters} className="min-h-[44px]">Reset Filter</Button>}
            bulkActions={[
              {
                label: validationStage === 'pc' ? 'Bulk Final Close' : 'Bulk Approve',
                icon: CheckCircle2,
                variant: 'default',
                show: (count) => canManageValidation && count > 0,
                onClick: (ids) => openConfirm(ids, 'valid'),
              },
              {
                label: 'Bulk Tolak',
                icon: XCircle,
                variant: 'destructive',
                show: (count) => canManageValidation && count > 0,
                onClick: (ids) => openConfirm(ids, 'invalid'),
              },
              {
                label: 'Bulk Kembalikan',
                icon: AlertTriangle,
                variant: 'secondary',
                show: (count) => canManageValidation && count > 0,
                onClick: (ids) => openConfirm(ids, 'return'),
              },
            ]}
            onRowClick={(rowId) => {
              const r = rows.find((x) => x.id === rowId)
              if (r) openDetail(r)
            }}
          />

          <div className="border-t border-border p-4">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
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
          if (!o) setSelectedRow(null)
        }}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
            <SheetTitle className="text-lg">Detail Penghimpunan</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">Informasi munfiq, penghimpunan, bukti, timeline, dan catatan admin.</SheetDescription>
          </div>

          <EnhancedSheetBody>
            {!selectedRow ? (
              <div className="py-10 text-center text-muted-foreground">Pilih data untuk melihat detail.</div>
            ) : (
              <div className="space-y-6">
                <ModalSection title="Informasi Munfiq & Setoran">
                  <FormGroup>
                    <FormRow columns={2}>
                      <InfoItem label="ID Penghimpunan" value={<span className="font-semibold">{selectedRow.id}</span>} />
                      <InfoItem label="Tanggal" value={formatDateShort(selectedRow.tanggal)} />
                    </FormRow>
                    <FormRow columns={2}>
                      <InfoItem label="Nama Munfiq" value={selectedRow.munfiqNama} />
                      <InfoItem label="Kode Transaksi" value={<span className="font-mono">{selectedRow.transactionCode ?? selectedRow.id}</span>} />
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
                    <FormRow columns={2}>
                      <InfoItem label="Nominal" value={<span className="font-semibold">{formatRupiah(selectedRow.nominal)}</span>} />
                      <InfoItem label="Metode Pembayaran" value={toMetodeLabel(selectedRow.metode)} />
                    </FormRow>
                  </FormGroup>
                </ModalSection>

                <ModalSection title="Bukti Penghimpunan Preview">
                  <div className="rounded-lg border border-border/50 bg-card p-3">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1 min-w-0">
                        <Image
                          src={selectedRow.buktiUrl}
                          alt="Preview bukti setor"
                          width={640}
                          height={256}
                          className="w-full max-h-64 rounded-md border border-border/50 object-contain bg-muted"
                          unoptimized
                        />
                      </div>
                      <div className="w-full lg:w-44 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toast({
                              variant: 'default',
                              title: 'Download preview',
                              description: 'Preview bukti diunduh dari data lokal yang sedang tampil.',
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

                <ModalSection title="Timeline Status">
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="space-y-3">
                      {selectedRow.riwayatAdminTimeline.map((step) => {
                        const status =
                          step.status === 'setoran'
                            ? 'pending'
                            : step.status === 'pending'
                              ? 'pending'
                              : step.status === 'valid'
                                ? 'approved'
                                : 'rejected'

                        const label =
                          step.status === 'setoran'
                            ? 'Penghimpunan'
                            : step.status === 'pending'
                              ? 'Pending'
                              : step.status === 'valid'
                                ? 'Valid'
                                : 'Ditolak'

                        return (
                          <div key={step.id} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <StatusIndicator
                                status={status}
                                label={label}
                                variant="dot"
                                size="md"
                                showIcon={false}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{step.label}</p>
                              <p className="text-xs text-muted-foreground">{formatDateShort(step.tanggal)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </ModalSection>

                <ModalSection title="Catatan Admin">
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-sm font-medium">Catatan</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedRow.catatanAdmin ?? 'Belum ada catatan admin.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {selectedRow.validator ? `Validator: ${selectedRow.validator}` : 'Validator: -'}
                    </p>
                  </div>
                </ModalSection>
              </div>
            )}
          </EnhancedSheetBody>

          <EnhancedSheetFooter>
            <div className="flex gap-3 w-full justify-end">
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => {
                  setDetailOpen(false)
                  setSelectedRow(null)
                }}
              >
                Tutup
              </Button>

              {selectedRow && selectedRow.validasi === 'pending' && canManageValidation && (
                <>
                  <Button
                    variant="destructive"
                    className="min-h-[44px]"
                    onClick={() => openConfirm([selectedRow.id], 'invalid')}
                  >
                    Tolak
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-[44px]"
                    onClick={() => openConfirm([selectedRow.id], 'return')}
                  >
                    Kembalikan
                  </Button>
                  <Button
                    variant="default"
                    className="min-h-[44px]"
                    onClick={() => openConfirm([selectedRow.id], 'valid')}
                  >
                    {validationStage === 'pc' ? 'Final Close' : 'Approve'}
                  </Button>
                </>
              )}
              {selectedRow && selectedRow.validasi === 'pending' && !canManageValidation ? <p className="mr-auto text-sm text-muted-foreground">Hanya {approvalRoleLabel} yang dapat memproses validasi {stageLabel}.</p> : null}
            </div>
          </EnhancedSheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmAction === 'valid' ? validationStage === 'pc' ? 'Konfirmasi Final Close' : 'Konfirmasi Approve' : confirmAction === 'return' ? 'Konfirmasi Kembalikan' : 'Konfirmasi Tolak'}</DialogTitle>
            <DialogDescription>
              {confirmAction === 'valid'
                ? validationStage === 'pc' ? 'Transaksi akan menjadi Selesai dan masuk laporan FINAL_APPROVED.' : 'Transaksi akan maju ke tahap verifikasi berikutnya.'
                : confirmAction === 'return'
                  ? validationStage === 'pc' ? 'Kembalikan penghimpunan ke UPZIS untuk revisi.' : validationStage === 'upzis' ? 'Kembalikan penghimpunan ke Ranting/Kordes untuk revisi.' : 'Kembalikan penghimpunan ke PLPK untuk revisi.'
                  : 'Tolak penghimpunan untuk data terpilih.'}
            </DialogDescription>
          </DialogHeader>

          <ResponsiveDialogContent>
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <p className="text-sm font-medium">Jumlah data: {confirmIds.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Perubahan akan disimpan ke histori validasi GORUT tanpa mengubah data AppRecord.
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

          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              className={cn("min-h-[44px]", confirmAction === 'valid' ? 'bg-emerald-600 hover:bg-emerald-700' : confirmAction === 'return' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-red-600 hover:bg-red-700')}
              onClick={applyValidation}
            >
              {confirmAction === 'valid' ? validationStage === 'pc' ? 'Ya, Final Close' : 'Ya, Approve' : confirmAction === 'return' ? 'Ya, Kembalikan' : 'Ya, Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
