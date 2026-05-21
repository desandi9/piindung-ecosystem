'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { useGorutMunfiqItems } from '@/lib/gorut/munfiq-control'
import {
  useGorutKordesUpzisRows,
  useGorutPenghimpunanVerificationState,
  useGorutPlpkKordesRows,
  useGorutUpzisPcRows,
  writeGorutPenghimpunanVerificationState,
} from '@/lib/gorut/penghimpunan-control'
import type { SetoranKoin } from '@/lib/gorut/types'
import { useAuth } from '@/lib/auth-context'
import { useAssignedGorutKecamatan } from '@/lib/gorut/operational-scope'
import { readGorutApprovalTransactions, writeGorutApprovalTransactions } from '@/lib/gorut/approval-control'
import { readGorutTransactions, writeGorutTransactions } from '@/lib/gorut/transaksi-control'
import { canRoleProcessValidation, getGorutRoleLabel } from '@/lib/gorut/workflow'
import { type MetodePembayaran, type RiwayatStatus, type ValidasiRow, useGorutValidasiRows, writeGorutValidasiRows } from '@/lib/gorut/validasi-control'
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
import { Checkbox } from '@/components/ui/checkbox'

type ValidasiFilter = 'all' | 'pending' | 'valid' | 'invalid'
type PenghimpunanStage = 'plpk_kordes' | 'kordes_upzis' | 'upzis_pc'
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

function toTransactionMethod(metode: MetodePembayaran): 'tunai' | 'transfer' | 'qris' {
  return metode === 'scan' ? 'qris' : 'tunai'
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
      <text x="72" y="140" font-family="ui-sans-serif, system-ui" font-size="40" fill="#34d399" font-weight="800">BUKTI SETOR</text>
      <text x="72" y="208" font-family="ui-sans-serif, system-ui" font-size="24" fill="#e5e7eb" font-weight="600">${safe}</text>
      <text x="72" y="272" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="18" fill="#93c5fd">Preview lokal bukti validasi</text>
      <text x="72" y="376" font-family="ui-sans-serif, system-ui" font-size="18" fill="#f1f5f9">Download dan cetak tersedia dari panel detail</text>
    </svg>
  `)
  return `data:image/svg+xml;charset=utf-8,${svg}`
}

export default function ValidasiSetoranPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { assignedKecamatan, isScopedOperationalRole } = useAssignedGorutKecamatan()
  const rows = useGorutValidasiRows()
  const munfiqItems = useGorutMunfiqItems()
  const plpkKordesRows = useGorutPlpkKordesRows()
  const kordesUpzisRows = useGorutKordesUpzisRows()
  const upzisPcRows = useGorutUpzisPcRows()
  const verificationState = useGorutPenghimpunanVerificationState()
  const canManageValidation = canRoleProcessValidation(user?.role)
  const munfiqCodeByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of munfiqItems) {
      if (item.munfiqCode) {
        map.set(`${item.nama}:${item.kecamatan}`, item.munfiqCode)
      }
    }
    return map
  }, [munfiqItems])

  const penghimpunanQueue = useMemo(() => {
    const plpkKordes = plpkKordesRows
      .filter((item) => !verificationState.plpkKordesVerifiedIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        stage: 'plpk_kordes' as const,
        stageLabel: 'PLPK - Kordes',
        title: item.plpkCode,
        subtitle: item.plpkName,
        wilayah: `${item.ranting} • ${item.upzis}`,
        periode: item.periode,
        aktif: item.aktif,
        terjemput: item.terjemput,
        nominal: item.koinTerjemput,
      }))

    const kordesUpzis = kordesUpzisRows
      .filter((item) => !verificationState.kordesUpzisVerifiedIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        stage: 'kordes_upzis' as const,
        stageLabel: 'Kordes - UPZIS',
        title: item.ranting,
        subtitle: item.rantingCode,
        wilayah: item.upzis,
        periode: item.periode,
        aktif: item.aktif,
        terjemput: item.terjemput,
        nominal: item.perolehan,
      }))

    const upzisPc = upzisPcRows
      .filter((item) => !verificationState.upzisPcVerifiedIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        stage: 'upzis_pc' as const,
        stageLabel: 'UPZIS - PC',
        title: item.upzis,
        subtitle: item.upzisCode,
        wilayah: item.ketuaUpzis,
        periode: item.periode,
        aktif: item.aktif,
        terjemput: item.terjemput,
        nominal: item.koinTerjemput,
      }))

    return [...plpkKordes, ...kordesUpzis, ...upzisPc]
  }, [kordesUpzisRows, plpkKordesRows, upzisPcRows, verificationState])

  const penghimpunanStats = useMemo(() => ({
    pending: penghimpunanQueue.length,
    plpkKordes: penghimpunanQueue.filter((item) => item.stage === 'plpk_kordes').length,
    kordesUpzis: penghimpunanQueue.filter((item) => item.stage === 'kordes_upzis').length,
    upzisPc: penghimpunanQueue.filter((item) => item.stage === 'upzis_pc').length,
  }), [penghimpunanQueue])

  const handleVerifyPenghimpunan = (stage: PenghimpunanStage, id: string) => {
    if (!canManageValidation) {
      toast({
        variant: 'destructive',
        title: 'Aksi tidak diizinkan',
        description: 'Verifikasi penghimpunan hanya bisa diproses oleh Admin UPZIS, Admin PC, atau Super Admin PC.',
      })
      return
    }

    const nextState = {
      ...verificationState,
      plpkKordesVerifiedIds:
        stage === 'plpk_kordes' && !verificationState.plpkKordesVerifiedIds.includes(id)
          ? [...verificationState.plpkKordesVerifiedIds, id]
          : verificationState.plpkKordesVerifiedIds,
      kordesUpzisVerifiedIds:
        stage === 'kordes_upzis' && !verificationState.kordesUpzisVerifiedIds.includes(id)
          ? [...verificationState.kordesUpzisVerifiedIds, id]
          : verificationState.kordesUpzisVerifiedIds,
      upzisPcVerifiedIds:
        stage === 'upzis_pc' && !verificationState.upzisPcVerifiedIds.includes(id)
          ? [...verificationState.upzisPcVerifiedIds, id]
          : verificationState.upzisPcVerifiedIds,
    }

    void writeGorutPenghimpunanVerificationState(nextState)
    toast({
      variant: 'default',
      title: 'Verifikasi penghimpunan tersimpan',
      description: 'Status antrean penghimpunan berhasil diperbarui.',
    })
  }

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
        const hay = [r.id, munfiqCode, r.munfiqNama, r.kecamatan, r.plpk, r.validasi, r.catatanAdmin ?? '', r.notes ?? ''].join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      if (kecamatan !== 'all' && r.kecamatan !== kecamatan) return false
      if (isScopedOperationalRole && assignedKecamatan && r.kecamatan !== assignedKecamatan) return false
      if (plpk !== 'all' && r.plpk !== plpk) return false
      if (status !== 'all' && r.validasi !== status) return false
      if (tanggal !== 'all' && r.tanggal.slice(0, 10) !== tanggal) return false
      return true
    })
  }, [assignedKecamatan, isScopedOperationalRole, rows, search, kecamatan, plpk, status, tanggal])

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
  const [confirmAction, setConfirmAction] = useState<'valid' | 'invalid'>('valid')
  const [confirmIds, setConfirmIds] = useState<string[]>([])

  const openDetail = (row: ValidasiRow) => {
    setSelectedRow(row)
    setDetailOpen(true)
  }

  const openConfirm = (ids: string[], action: 'valid' | 'invalid') => {
    if (!canManageValidation) {
      toast({
        variant: 'destructive',
        title: 'Aksi tidak diizinkan',
        description: 'Verifikasi penghimpunan hanya bisa diproses oleh Admin UPZIS, Admin PC, atau Super Admin PC.',
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
        description: 'Verifikasi penghimpunan hanya bisa diproses oleh Admin UPZIS, Admin PC, atau Super Admin PC.',
      })
      return
    }

    const now = new Date().toISOString()
    const nextValidator = user?.name || 'Petugas GORUT'
    const actionLabel = confirmAction === 'valid' ? 'Validasi berhasil' : 'Penolakan berhasil'
    const nextCatatan =
      confirmAction === 'valid'
        ? 'Disetujui admin. Penghimpunan siap diproses.'
        : 'Ditolak admin. Mohon perbaikan bukti transfer atau berkas pendukung.'

    const nextRows = rows.map((r) => {
        if (!confirmIds.includes(r.id)) return r
        const nextStatus = confirmAction as SetoranKoin['validasi']
        return {
          ...r,
          validasi: nextStatus,
          validator: nextValidator,
          catatanAdmin: nextCatatan,
          riwayat: [
            ...r.riwayat,
            {
              id: `${r.id}-admin-${now}`,
              tanggal: now,
              aksi: confirmAction === 'valid' ? 'Validasi disetujui' : 'Validasi ditolak',
              oleh: nextValidator,
              status: nextStatus === 'valid' ? 'valid' : nextStatus === 'invalid' ? 'invalid' : 'pending',
            },
          ],
          riwayatAdminTimeline: [
            ...r.riwayatAdminTimeline,
            {
              id: `${r.id}-tl-admin-${now}`,
              tanggal: now,
              label: confirmAction === 'valid' ? 'Validasi disetujui' : 'Validasi ditolak',
              status: confirmAction === 'valid' ? 'valid' : 'invalid',
            },
          ],
        }
      })

    void writeGorutValidasiRows(nextRows)
      .then(() => {
        const currentTransactions = readGorutTransactions()
        const syncedTransactions = [...currentTransactions]
        const currentApprovalRows = readGorutApprovalTransactions()
        const syncedApprovalRows = [...currentApprovalRows]

        for (const updatedRow of nextRows.filter((row) => confirmIds.includes(row.id))) {
          const matchIndex = syncedTransactions.findIndex((trx) =>
            trx.munfiqNama === updatedRow.munfiqNama &&
            trx.nominal === updatedRow.nominal &&
            trx.kecamatan === updatedRow.kecamatan
          )

          if (matchIndex >= 0) {
            syncedTransactions[matchIndex] = {
              ...syncedTransactions[matchIndex],
              status: updatedRow.validasi,
              validator: updatedRow.validator,
              metodePembayaran: toTransactionMethod(updatedRow.metode),
            }
          } else {
            syncedTransactions.unshift({
              id: `trx-from-${updatedRow.id}`,
              kode: `TRX-${updatedRow.tanggal.slice(0, 10).replace(/-/g, '')}-${updatedRow.id.slice(-3)}`,
              tanggal: updatedRow.tanggal,
              munfiqNama: updatedRow.munfiqNama,
              munfiqId: updatedRow.id,
              nominal: updatedRow.nominal,
              metodePembayaran: toTransactionMethod(updatedRow.metode),
              validator: updatedRow.validator,
              status: updatedRow.validasi,
              kecamatan: updatedRow.kecamatan,
            })
          }

          const matchedTransaction = matchIndex >= 0
            ? syncedTransactions[matchIndex]
            : syncedTransactions[0]
          const approvalMatchIndex = syncedApprovalRows.findIndex((trx) =>
            trx.kode === matchedTransaction?.kode ||
            (trx.munfiqNama === updatedRow.munfiqNama && trx.nominal === updatedRow.nominal && trx.kecamatan === updatedRow.kecamatan)
          )

          if (approvalMatchIndex >= 0) {
            const approvalRow = syncedApprovalRows[approvalMatchIndex]
            const alreadyFinal = approvalRow.overallStatus === 'approved' || approvalRow.overallStatus === 'rejected'

            if (!alreadyFinal) {
              syncedApprovalRows[approvalMatchIndex] = {
                ...approvalRow,
                currentStep: 'pc',
                overallStatus: updatedRow.validasi === 'valid' ? 'approved' : 'rejected',
                approvalHistory: [
                  ...approvalRow.approvalHistory,
                  {
                    step: approvalRow.currentStep,
                    status: updatedRow.validasi === 'valid' ? 'approved' : 'rejected',
                    validator: updatedRow.validator || nextValidator,
                    validatorRole: getGorutRoleLabel(user?.role),
                    timestamp: now,
                    notes: updatedRow.validasi === 'valid'
                      ? 'Disinkronkan dari verifikasi penghimpunan.'
                      : 'Ditolak melalui verifikasi penghimpunan.',
                  },
                ],
              }
            }
          }
        }

        void writeGorutTransactions(syncedTransactions)
        void writeGorutApprovalTransactions(syncedApprovalRows)
        setConfirmOpen(false)
        setConfirmIds([])
        if (selectedRow && confirmIds.includes(selectedRow.id)) {
          const nextSelectedRow = nextRows.find((row) => row.id === selectedRow.id) ?? null
          setSelectedRow(nextSelectedRow)
        }
        toast({
          variant: 'default',
          title: actionLabel,
          description: 'Keputusan validasi berhasil disimpan.',
        })
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Gagal menyimpan validasi',
          description: 'Perubahan validasi belum berhasil disimpan.',
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
          columns: ['ID', 'Kode Munfiq', 'Munfiq', 'Kecamatan', 'PLPK', 'Tanggal', 'Nominal', 'Metode', 'Status', 'Validator', 'Catatan'],
          rows: exportRows.map((row) => [row.id, munfiqCodeByName.get(`${row.munfiqNama}:${row.kecamatan}`) ?? '-', row.munfiqNama, row.kecamatan, row.plpk, formatDateShort(row.tanggal), formatRupiah(row.nominal), toMetodeLabel(row.metode), row.validasi, row.validator ?? '-', row.catatanAdmin ?? '-']),
        }],
        notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
      })
      return
    }

    if (format === 'excel') {
      exportRowsToSpreadsheet({
        fileName: `verifikasi-penghimpunan-${new Date().toISOString().slice(0, 10)}.xlsx`,
        rows: [
          ['ID Penghimpunan', 'Kode Munfiq', 'Nama Munfiq', 'Kecamatan', 'PLPK', 'Tanggal', 'Nominal', 'Metode', 'Status', 'Validator', 'Catatan Admin'],
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
            row.catatanAdmin ?? '',
          ]),
        ],
        format: 'xlsx',
      })
    }

    toast({
      variant: 'default',
      title: `Export ${format === 'pdf' ? 'PDF' : 'Excel'} siap`,
      description: `${format === 'pdf' ? 'Laporan siap dicetak' : 'File Excel berhasil dibuat'} untuk ${count} data validasi.`,
    })
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
      munfiqNama: <div><span className="font-medium">{r.munfiqNama}</span><p className="text-xs text-muted-foreground">{munfiqCodeByName.get(`${r.munfiqNama}:${r.kecamatan}`) ?? '-'}</p></div>,
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
    <DashboardPage>
      <DashboardPageHeader
        title="GORUT / Verifikasi Penghimpunan"
        description="Penghimpunan masuk → diverifikasi admin → disetujui / ditolak."
        action={null}
        className="mb-4"
      />

      <StatsGrid>
        <StatCard
          icon={Clock}
          label="Pending Verifikasi"
          value={stats.pending}
          description="Menunggu verifikasi admin"
          trend="review"
          trendDirection="down"
        />
        <StatCard
          icon={CheckCircle2}
          label="Sudah Diverifikasi"
          value={stats.valid}
          description="Penghimpunan disetujui admin"
          trend="up"
          trendDirection="up"
        />
        <StatCard
          icon={XCircle}
          label="Ditolak"
          value={stats.invalid}
          description="Penghimpunan ditolak admin"
          trend="-"
          trendDirection="stable"
        />
        <StatCard
          icon={Coins}
          label="Total Nominal Pending"
          value={formatRupiah(stats.totalNominalPending)}
          description="Akumulasi nominal menunggu"
          trend="pending"
          trendDirection="up"
        />
      </StatsGrid>

      <ContentCard title="Verifikasi Penghimpunan" description="Pusat verifikasi bertingkat untuk alur PLPK, Kordes, UPZIS, dan PC.">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-card p-4"><p className="text-xs text-muted-foreground">Pending Semua Tahap</p><p className="mt-2 text-2xl font-bold text-emerald-600">{penghimpunanStats.pending}</p></div>
            <div className="rounded-xl border border-border/50 bg-card p-4"><p className="text-xs text-muted-foreground">PLPK - Kordes</p><p className="mt-2 text-2xl font-bold">{penghimpunanStats.plpkKordes}</p></div>
            <div className="rounded-xl border border-border/50 bg-card p-4"><p className="text-xs text-muted-foreground">Kordes - UPZIS</p><p className="mt-2 text-2xl font-bold">{penghimpunanStats.kordesUpzis}</p></div>
            <div className="rounded-xl border border-border/50 bg-card p-4"><p className="text-xs text-muted-foreground">UPZIS - PC</p><p className="mt-2 text-2xl font-bold">{penghimpunanStats.upzisPc}</p></div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tahap</TableHead>
                  <TableHead>Objek</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Aktif</TableHead>
                  <TableHead className="text-right">Terjemput</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penghimpunanQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Tidak ada antrean verifikasi penghimpunan.</TableCell>
                  </TableRow>
                ) : (
                  penghimpunanQueue.map((item) => (
                    <TableRow key={`${item.stage}-${item.id}`}>
                      <TableCell><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">{item.stageLabel}</span></TableCell>
                      <TableCell><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.subtitle}</p></div></TableCell>
                      <TableCell>{item.wilayah}</TableCell>
                      <TableCell>{item.periode}</TableCell>
                      <TableCell className="text-right">{item.aktif.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right">{item.terjemput.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right font-medium">{formatRupiah(item.nominal)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleVerifyPenghimpunan(item.stage, item.id)} disabled={!canManageValidation}>Verifikasi</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </ContentCard>

      <ContentCard title="Filter & Pencarian" description="Pilih kriteria untuk mempersempit daftar penghimpunan masuk.">
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
                placeholder="Cari ID, kode munfiq, nama munfiq, PLPK, catatan admin..."
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Filter Kecamatan</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
                  value={isScopedOperationalRole && assignedKecamatan ? assignedKecamatan : kecamatan}
                  onChange={(e) => {
                    if (isScopedOperationalRole) return
                    setKecamatan(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  {(isScopedOperationalRole && assignedKecamatan ? [assignedKecamatan] : kecamatans).map((v) => (
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

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Filter Status</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
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

              <div className="space-y-2 lg:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">Filter Tanggal</p>
                <select
                  className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm"
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

            <p className="text-xs text-muted-foreground">Gunakan checkbox untuk bulk approve/reject.</p>
            {!canManageValidation ? <p className="text-xs text-muted-foreground">Aksi validasi hanya aktif untuk Admin UPZIS, Admin PC, atau Super Admin PC.</p> : null}
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
                : 'Belum ada data validasi.'
            }
            bulkActions={[
              {
                label: 'Bulk Validasi',
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

              {selectedRow && selectedRow.validasi === 'pending' && canManageValidation && (
                <>
                  <Button
                    variant="default"
                    onClick={() => openConfirm([selectedRow.id], 'valid')}
                  >
                    Validasi
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openConfirm([selectedRow.id], 'invalid')}
                  >
                    Tolak
                  </Button>
                </>
              )}
              {selectedRow && selectedRow.validasi === 'pending' && !canManageValidation ? <p className="mr-auto text-sm text-muted-foreground">Hanya Admin UPZIS, Admin PC, atau Super Admin PC yang dapat memproses validasi.</p> : null}
            </div>
          </EnhancedSheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Aksi Validasi</DialogTitle>
            <DialogDescription>
              {confirmAction === 'valid'
                ? 'Setujui verifikasi penghimpunan untuk data terpilih.'
                : 'Tolak penghimpunan untuk data terpilih.'}
            </DialogDescription>
          </DialogHeader>

          <ResponsiveDialogContent>
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <p className="text-sm font-medium">Jumlah data: {confirmIds.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Perubahan akan disimpan ke histori validasi GORUT.
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
