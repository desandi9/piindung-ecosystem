'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ActionCard, EmptyState, MetricCard, PageSectionHeader } from '@/components/ui/ds-patterns'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { MunfiqData } from '@/lib/gorut/types'
import { formatDateShort, formatRupiah, kecamatanData } from '@/lib/gorut/data'
import { exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { createMunfiqWithGeneratedCode, ensureMunfiqCodeFields, preserveMunfiqIdentity } from '@/lib/gorut/munfiq-code'
import { useAssignedGorutKecamatan } from '@/lib/gorut/operational-scope'
import { readGorutMunfiqItems, useGorutMunfiqItems, writeGorutMunfiqItems } from '@/lib/gorut/munfiq-control'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Coins,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  History,
  ChevronLeft,
  MapPin,
  Phone,
  Plus,
  Pencil,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react'

type MunfiqStatus = 'semua' | 'aktif' | 'nonaktif'
type QuickFilter = 'semua' | 'aktif' | 'nonaktif' | 'belum-setor' | 'kontributor-besar' | 'dormant'
type SortKey = 'nama' | 'kontribusi' | 'terakhir' | 'registrasi'
type ImportRowPreview = MunfiqData & { sourceRow: number; duplicateTarget?: string }

const PAGE_SIZE = 8

function generateMunfiqId(existingItems: MunfiqData[]) {
  const nextNumber = existingItems
    .map((item) => Number.parseInt(item.id.replace(/\D/g, ''), 10))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0) + 1

  return `MNF-${String(nextNumber).padStart(4, '0')}`
}

const emptyMunfiqForm: Omit<MunfiqData, 'id'> = {
  munfiqCode: '',
  nama: '',
  nik: '',
  alamat: '',
  kecamatan: kecamatanData[0]?.nama ?? 'Garut Kota',
  desa: '',
  noHp: '',
  tglLahir: '',
  jenisKelamin: 'pria',
  totalSetoran: 0,
  jumlahSetoran: 0,
  lastSetoran: '',
  status: 'aktif',
  plpk: '',
  plpkCode: '',
  sequence: 0,
  tglRegistrasi: new Date().toISOString().slice(0, 10),
}

function getDaysSince(dateString?: string) {
  if (!dateString) return null

  const value = new Date(dateString)
  if (Number.isNaN(value.getTime())) return null

  return Math.floor((Date.now() - value.getTime()) / (1000 * 60 * 60 * 24))
}

function getEngagementTone(item: MunfiqData) {
  const inactiveDays = getDaysSince(item.lastSetoran)

  if (item.totalSetoran === 0) {
    return {
      label: 'Belum Aktif',
      className: 'border-slate-500/20 bg-slate-500/10 text-slate-600',
    }
  }

  if (inactiveDays !== null && inactiveDays > 30) {
    return {
      label: 'Dormant',
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    }
  }

  if (item.totalSetoran >= 25000000) {
    return {
      label: 'Prioritas Tinggi',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    }
  }

  return {
    label: 'Aktif',
    className: 'border-blue-500/20 bg-blue-500/10 text-blue-600',
  }
}

function getGenderShortLabel(value?: MunfiqData['jenisKelamin']) {
  return value === 'wanita' ? 'P' : 'L'
}

function sanitizeCsvCell(cell: string) {
  return cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
}

function normalizeImportHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getImportCell(row: Record<string, string>, candidates: string[]) {
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeImportHeader(candidate)
    for (const [key, value] of Object.entries(row)) {
      if (normalizeImportHeader(key) === normalizedCandidate && value.trim()) {
        return value.trim()
      }
    }
  }

  return ''
}

function parseImportNumber(value: string) {
  const normalized = value.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeImportText(value?: string) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function isSameImportedMunfiq(existingItem: MunfiqData, importedDraft: Pick<MunfiqData, 'id' | 'munfiqCode' | 'nik' | 'nama' | 'noHp' | 'kecamatan' | 'plpk'>) {
  const sameId = importedDraft.id && existingItem.id === importedDraft.id
  const sameCode = Boolean(importedDraft.munfiqCode) && existingItem.munfiqCode === importedDraft.munfiqCode
  const sameNik = importedDraft.nik !== '-' && Boolean(importedDraft.nik) && existingItem.nik === importedDraft.nik
  const sameProfile =
    normalizeImportText(existingItem.nama) === normalizeImportText(importedDraft.nama) &&
    normalizeImportText(existingItem.noHp) === normalizeImportText(importedDraft.noHp) &&
    normalizeImportText(existingItem.kecamatan) === normalizeImportText(importedDraft.kecamatan) &&
    normalizeImportText(existingItem.plpk) === normalizeImportText(importedDraft.plpk)

  return sameId || sameCode || sameNik || sameProfile
}

function parseDelimitedRows(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) {
    return { header: [], rows: [] as Record<string, string>[] }
  }

  const header = lines[0].split(',').map(sanitizeCsvCell)
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',').map(sanitizeCsvCell)
    return Object.fromEntries(header.map((key, index) => [key, cells[index] ?? '']))
  })

  return { header, rows }
}

function parseSpreadsheetRows(data: ArrayBuffer) {
  const workbook = XLSX.read(data, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined
  if (!firstSheet) {
    return { header: [], rows: [] as Record<string, string>[] }
  }

  const sheetRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  if (sheetRows.length < 2) {
    return { header: [], rows: [] as Record<string, string>[] }
  }

  const header = (sheetRows[0] ?? []).map((cell) => String(cell ?? '').trim())
  const rows = sheetRows.slice(1)
    .filter((row) => row.some((cell) => String(cell ?? '').trim().length > 0))
    .map((row) => Object.fromEntries(header.map((key, index) => [key, String(row[index] ?? '').trim()])))

  return { header, rows }
}

export default function MunfiqPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { assignedKecamatan, isScopedOperationalRole } = useAssignedGorutKecamatan()
  const munfiqItems = useGorutMunfiqItems()
  const [search, setSearch] = useState('')
  const [kecamatanFilter, setKecamatanFilter] = useState('semua')
  const [plpkFilter, setPlpkFilter] = useState('semua')
  const [statusFilter, setStatusFilter] = useState<MunfiqStatus>('semua')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('semua')
  const [sortKey, setSortKey] = useState<SortKey>('kontribusi')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [selectedMunfiq, setSelectedMunfiq] = useState<MunfiqData | null>(null)
  const [editingMunfiq, setEditingMunfiq] = useState<MunfiqData | null>(null)
  const [newMunfiq, setNewMunfiq] = useState(emptyMunfiqForm)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [importPreviewRows, setImportPreviewRows] = useState<ImportRowPreview[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [heroOpen, setHeroOpen] = useState(false)
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false)

  const filteredData = useMemo(() => {
    let filtered = [...munfiqItems]

    if (quickFilter === 'aktif') {
      filtered = filtered.filter((m) => m.status === 'aktif')
    } else if (quickFilter === 'nonaktif') {
      filtered = filtered.filter((m) => m.status === 'nonaktif')
    } else if (quickFilter === 'belum-setor') {
      filtered = filtered.filter((m) => m.totalSetoran === 0)
    } else if (quickFilter === 'kontributor-besar') {
      const avgSetoran = munfiqItems.reduce((sum, m) => sum + m.totalSetoran, 0) / Math.max(1, munfiqItems.length)
      filtered = filtered.filter((m) => m.totalSetoran >= avgSetoran * 2)
    } else if (quickFilter === 'dormant') {
      filtered = filtered.filter((m) => {
        const days = getDaysSince(m.lastSetoran)
        return days !== null && days > 30
      })
    }

      filtered = filtered.filter((munfiq) => {
        const haystack = [
          munfiq.munfiqCode ?? '',
          munfiq.nama,
          munfiq.nik,
        munfiq.noHp,
        munfiq.alamat,
        munfiq.kecamatan,
        munfiq.desa,
        munfiq.plpk,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(search.toLowerCase())
    })

    if (kecamatanFilter !== 'semua') {
      filtered = filtered.filter((m) => m.kecamatan === kecamatanFilter)
    }

    if (plpkFilter !== 'semua') {
      filtered = filtered.filter((m) => m.plpk === plpkFilter)
    }

    if (isScopedOperationalRole && assignedKecamatan) {
      filtered = filtered.filter((m) => m.kecamatan === assignedKecamatan)
    }

    if (statusFilter !== 'semua') {
      filtered = filtered.filter((m) => m.status === statusFilter)
    }

    filtered.sort((a, b) => {
      if (sortKey === 'nama') return a.nama.localeCompare(b.nama)
      if (sortKey === 'kontribusi') return b.totalSetoran - a.totalSetoran

      if (sortKey === 'terakhir') {
        const aTime = a.lastSetoran ? new Date(a.lastSetoran).getTime() : 0
        const bTime = b.lastSetoran ? new Date(b.lastSetoran).getTime() : 0
        return bTime - aTime
      }

      const aReg = a.tglRegistrasi ? new Date(a.tglRegistrasi).getTime() : 0
      const bReg = b.tglRegistrasi ? new Date(b.tglRegistrasi).getTime() : 0
      return bReg - aReg
    })

    return filtered
  }, [assignedKecamatan, isScopedOperationalRole, kecamatanFilter, munfiqItems, plpkFilter, quickFilter, search, sortKey, statusFilter])

  const plpkOptions = useMemo(() => ['semua', ...Array.from(new Set(munfiqItems.map((item) => item.plpk).filter(Boolean))).sort((a, b) => a.localeCompare(b))], [munfiqItems])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [currentPage, filteredData, pageSize])

  const stats = useMemo(() => {
    const scopedItems = isScopedOperationalRole && assignedKecamatan ? munfiqItems.filter((m) => m.kecamatan === assignedKecamatan) : munfiqItems
    const totalMunfiq = scopedItems.length
    const aktivMunfiq = scopedItems.filter((m) => m.status === 'aktif').length
    const nonaktifMunfiq = scopedItems.filter((m) => m.status === 'nonaktif').length
    const belumSetor = scopedItems.filter((m) => m.totalSetoran === 0).length
    const totalSetoran = scopedItems.reduce((sum, m) => sum + m.totalSetoran, 0)
    const avgSetoran = totalSetoran / Math.max(1, totalMunfiq)
    const topMunfiq = [...scopedItems].sort((a, b) => b.totalSetoran - a.totalSetoran)[0]

    return { totalMunfiq, aktivMunfiq, nonaktifMunfiq, belumSetor, totalSetoran, avgSetoran, topMunfiq }
  }, [assignedKecamatan, isScopedOperationalRole, munfiqItems])

  const registeredThisCycle = useMemo(
    () => {
      const scopedItems = isScopedOperationalRole && assignedKecamatan ? munfiqItems.filter((m) => m.kecamatan === assignedKecamatan) : munfiqItems
      return scopedItems.filter((m) => m.tglRegistrasi?.startsWith('2024-') || m.tglRegistrasi?.startsWith('2023-12')).length
    },
    [assignedKecamatan, isScopedOperationalRole, munfiqItems]
  )

  const hasActiveFilters = search.length > 0 || kecamatanFilter !== 'semua' || plpkFilter !== 'semua' || statusFilter !== 'semua' || quickFilter !== 'semua' || sortKey !== 'kontribusi'
  const importPreviewSummary = useMemo(() => {
    const duplicates = importPreviewRows.filter((item) => item.duplicateTarget).length
    const fresh = importPreviewRows.length - duplicates

    return { duplicates, fresh }
  }, [importPreviewRows])

  const handleViewDetail = (munfiq: MunfiqData) => {
    setSelectedMunfiq(munfiq)
    setSheetOpen(true)
  }

  const handleEditMunfiq = (munfiq: MunfiqData) => {
    setEditingMunfiq({ ...munfiq })
    setEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingMunfiq) return

    const existingItem = munfiqItems.find((item) => item.id === editingMunfiq.id)
    const nextItems = ensureMunfiqCodeFields(
      munfiqItems.map((item) => (item.id === editingMunfiq.id ? preserveMunfiqIdentity(editingMunfiq, existingItem) : item))
    ).items

    void writeGorutMunfiqItems(nextItems)
      .then(() => {
        const savedItem = nextItems.find((item) => item.id === editingMunfiq.id) ?? editingMunfiq

        if (selectedMunfiq?.id === editingMunfiq.id) {
          setSelectedMunfiq(savedItem)
        }

        toast({
          variant: 'default',
          title: 'Perubahan tersimpan',
          description: `${savedItem.nama} berhasil diperbarui.`,
        })

        setEditOpen(false)
        setEditingMunfiq(null)
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Gagal menyimpan perubahan',
          description: 'Data munfiq belum berhasil diperbarui.',
        })
      })
  }

  const handleCreateMunfiq = () => {
    if (!newMunfiq.nama || !newMunfiq.nik || !newMunfiq.noHp || !newMunfiq.alamat || !newMunfiq.plpk || !newMunfiq.desa) {
      toast({
        variant: 'destructive',
        title: 'Data belum lengkap',
        description: 'Lengkapi nama, NIK, HP, alamat, ranting, dan PLPK terlebih dahulu.',
      })
      return
    }

    const newId = generateMunfiqId(munfiqItems)
    const created = createMunfiqWithGeneratedCode(munfiqItems, {
      id: newId,
      ...newMunfiq,
    })

    void writeGorutMunfiqItems(ensureMunfiqCodeFields([created, ...munfiqItems]).items)
      .then(() => {
        setCreateOpen(false)
        setNewMunfiq(emptyMunfiqForm)
        setCurrentPage(1)

        toast({
          variant: 'default',
          title: 'Munfiq baru ditambahkan',
          description: `${created.nama} berhasil disimpan dengan kode ${created.munfiqCode}.`,
        })
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Gagal menambahkan munfiq',
          description: 'Data munfiq baru belum berhasil disimpan.',
        })
      })
  }

  const handleResetFilters = () => {
    setSearch('')
    setKecamatanFilter('semua')
    setPlpkFilter('semua')
    setStatusFilter('semua')
    setQuickFilter('semua')
    setSortKey('kontribusi')
    setCurrentPage(1)
  }

  const visiblePages = useMemo(() => {
    const pages: number[] = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    for (let page = start; page <= end; page += 1) pages.push(page)
    return pages
  }, [currentPage, totalPages])

  const handleExport = () => {
    exportRowsToSpreadsheet({
      fileName: `munfiq-${new Date().toISOString().slice(0, 10)}.xlsx`,
      rows: [
        ['ID Internal', 'Kode Munfiq', 'Nama', 'NIK', 'No HP', 'Alamat', 'Ranting', 'Kecamatan', 'PLPK', 'Kode PLPK', 'Sequence', 'Status', 'Total Setoran', 'Jumlah Setoran', 'Last Setoran', 'Tgl Registrasi'],
        ...filteredData.map((item) => [
          item.id,
          item.munfiqCode ?? '',
          item.nama,
          item.nik,
          item.noHp,
          item.alamat,
          item.desa,
          item.kecamatan,
          item.plpk,
          item.plpkCode ?? '',
          String(item.sequence ?? ''),
          item.status,
          String(item.totalSetoran),
          String(item.jumlahSetoran),
          item.lastSetoran ?? '',
          item.tglRegistrasi ?? '',
        ]),
      ],
      format: 'xlsx',
    })

    toast({
      variant: 'default',
      title: 'Export siap',
      description: `${filteredData.length} data munfiq diexport ke Excel.`,
    })
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    const isSpreadsheet = extension === 'xlsx' || extension === 'xls'

    const parsedSource = isSpreadsheet
      ? parseSpreadsheetRows(await file.arrayBuffer())
      : parseDelimitedRows(await file.text())

    if (parsedSource.rows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'File import tidak valid',
        description: 'Minimal harus ada header dan satu baris data.',
      })
      event.target.value = ''
      return
    }

    const existingItems = readGorutMunfiqItems()
    const normalizedExisting = ensureMunfiqCodeFields(existingItems).items
    const preparedRows: MunfiqData[] = []
    const parsedRows = parsedSource.rows.map((row, index) => {
      const scopedKecamatan = isScopedOperationalRole && assignedKecamatan ? assignedKecamatan : undefined
      const importedId = getImportCell(row, ['ID', 'id']) || `IMP-${Date.now()}-${index + 1}`
      const importedNik = getImportCell(row, ['NIK', 'nik']) || '-'

      const importedDraft: MunfiqData = {
        id: importedId,
        munfiqCode: getImportCell(row, ['Munfiq Code', 'munfiq_code', 'Kode Munfiq', 'kodeMunfiq']),
        nama: getImportCell(row, ['Nama', 'nama']) || `Munfiq Import ${index + 1}`,
        nik: importedNik,
        noHp: getImportCell(row, ['No HP', 'NoHp', 'noHp', 'HP']) || '-',
        alamat: getImportCell(row, ['Alamat', 'alamat']) || '-',
        desa: getImportCell(row, ['Ranting', 'ranting', 'Desa', 'desa', 'PAC / Ranting', 'Pac / Ranting']) || '-',
        kecamatan: scopedKecamatan || getImportCell(row, ['Kecamatan', 'kecamatan']) || (kecamatanData[0]?.nama ?? 'Garut Kota'),
        plpk: getImportCell(row, ['PLPK', 'plpk', 'Nama PLPK', 'namaPlpk', 'Petugas PLPK']) || '-',
        plpkCode: getImportCell(row, ['PLPK Code', 'plpk_code', 'Kode PLPK', 'kodePlpk']),
        sequence: parseImportNumber(getImportCell(row, ['Sequence', 'sequence', 'Urutan', 'Nomor Urut'])),
        status: getImportCell(row, ['Status', 'status']).toLowerCase() === 'nonaktif' ? 'nonaktif' : 'aktif',
        totalSetoran: parseImportNumber(getImportCell(row, ['Total Setoran', 'totalSetoran', 'TotalSetoran'])),
        jumlahSetoran: parseImportNumber(getImportCell(row, ['Jumlah Setoran', 'jumlahSetoran', 'JumlahSetoran'])),
        lastSetoran: getImportCell(row, ['Last Setoran', 'lastSetoran', 'Tanggal Setoran Terakhir']) || '',
        tglRegistrasi: getImportCell(row, ['Tgl Registrasi', 'tglRegistrasi', 'Tanggal Registrasi']) || new Date().toISOString().slice(0, 10),
        tglLahir: getImportCell(row, ['Tgl Lahir', 'tglLahir', 'Tanggal Lahir']) || '',
        jenisKelamin: getImportCell(row, ['Jenis Kelamin', 'jenisKelamin']).toLowerCase() === 'wanita' ? 'wanita' : 'pria',
      }

      const duplicateItem = normalizedExisting.find((item) => isSameImportedMunfiq(item, importedDraft))

      if (duplicateItem) {
        importedDraft.id = duplicateItem.id
      }

      const preparedItem = duplicateItem
        ? preserveMunfiqIdentity(importedDraft, duplicateItem)
        : createMunfiqWithGeneratedCode([...normalizedExisting, ...preparedRows], importedDraft)

      preparedRows.push(preparedItem)

      return {
        ...preparedItem,
        sourceRow: index + 2,
        duplicateTarget: duplicateItem ? duplicateItem.nama : undefined,
      } satisfies ImportRowPreview
    })

    setImportFileName(file.name)
    setImportPreviewRows(parsedRows)
    setImportDialogOpen(true)
    event.target.value = ''
  }

  const handleApplyImport = () => {
    if (isImporting || importPreviewRows.length === 0) return

    const existingItems = readGorutMunfiqItems()
    const normalizedImportItems: MunfiqData[] = importPreviewRows.map(({ sourceRow: _sourceRow, duplicateTarget: _duplicateTarget, ...item }) => item)
    const dedupedExisting = existingItems.filter(
      (item) => !normalizedImportItems.some((imported) => isSameImportedMunfiq(item, imported))
    )

    setIsImporting(true)

    void writeGorutMunfiqItems(ensureMunfiqCodeFields([...normalizedImportItems, ...dedupedExisting]).items)
      .then(() => {
        setCurrentPage(1)
        setImportDialogOpen(false)
        setImportPreviewRows([])
        setImportFileName('')

        toast({
          variant: 'default',
          title: 'Import selesai',
          description: `${importPreviewRows.length} data diproses. ${importPreviewSummary.fresh} data baru, ${importPreviewSummary.duplicates} data menggantikan data lama.`,
        })
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Import gagal',
          description: 'Data munfiq dari file import belum berhasil disimpan.',
        })
      })
      .finally(() => {
        setIsImporting(false)
      })
  }

  const updateNewMunfiq = <K extends keyof typeof newMunfiq>(key: K, value: (typeof newMunfiq)[K]) => {
    setNewMunfiq((prev) => ({ ...prev, [key]: value }))
  }

  const currentDetailTone = selectedMunfiq ? getEngagementTone(selectedMunfiq) : null

  return (
    <div className="min-w-0 space-y-8" role="main" aria-label="Halaman data munfiq">
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />

      <PageSectionHeader
        title={<h1 className="text-2xl font-bold tracking-tight">Data Munfiq</h1>}
        description="Kelola data donatur, kontribusi, dan penugasan wilayah."
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px] gap-2" aria-label="Import data munfiq dari Excel atau CSV" onClick={handleImportClick}>
              <Upload className="size-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="min-h-[44px] gap-2" aria-label="Export data munfiq" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button size="sm" className="min-h-[44px] gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Tambah Munfiq
            </Button>
          </div>
        )}
      />

      <Card className="overflow-hidden border border-border shadow-sm">
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => setHeroOpen((value) => !value)}
            aria-expanded={heroOpen}
            aria-label={heroOpen ? 'Tutup ringkasan' : 'Buka ringkasan'}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Ringkasan Operasional</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Insight cepat tentang basis munfiq dan kontribusi.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{heroOpen ? 'Tutup' : 'Buka'}</span>
              {heroOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </div>
          </button>

          {heroOpen ? (
            <div className="border-t border-border/40 px-5 py-5">
              <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Kelola donatur dari satu layar.</h2>
                    <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                      Cari, lihat status, edit data, dan identifikasi munfiq yang perlu follow-up.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Top Kontributor</p>
                      <p className="mt-2 text-sm font-semibold">{stats.topMunfiq?.nama ?? '-'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{stats.topMunfiq ? formatRupiah(stats.topMunfiq.totalSetoran) : '-'}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Belum Setor</p>
                      <p className="mt-2 text-sm font-semibold">{stats.belumSetor} munfiq</p>
                      <p className="mt-1 text-xs text-muted-foreground">Perlu program reaktivasi</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Registrasi Terpantau</p>
                      <p className="mt-2 text-sm font-semibold">{registeredThisCycle} data</p>
                      <p className="mt-1 text-xs text-muted-foreground">Pertumbuhan basis munfiq</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <ActionCard icon={Coins} iconTone="success" title="Riwayat Transaksi" description="Lacak kontribusi dan aktivitas setoran." href="/gorut/transaksi" />
                  <ActionCard icon={ShieldCheck} iconTone="info" title="Ringkasan Basis Munfiq" description="Distribusi penugasan dan kesehatan data." href="/gorut/rekap-bulanan" />
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter cepat munfiq">
        {[
          { id: 'semua', label: 'Semua' },
          { id: 'aktif', label: 'Aktif' },
          { id: 'nonaktif', label: 'Nonaktif' },
          { id: 'belum-setor', label: 'Belum Setor' },
          { id: 'kontributor-besar', label: 'Kontributor Besar' },
          { id: 'dormant', label: 'Dormant' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setQuickFilter(tab.id as QuickFilter)
              setCurrentPage(1)
            }}
            aria-pressed={quickFilter === tab.id}
            className={cn(
              'inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200',
              quickFilter === tab.id
                ? 'bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Munfiq" value={stats.totalMunfiq.toLocaleString('id-ID')} icon={Users} accent="from-emerald-500/15 via-emerald-500/5 to-transparent" iconTone="bg-emerald-500/10 text-emerald-600" />
        <MetricCard title="Munfiq Aktif" value={stats.aktivMunfiq.toLocaleString('id-ID')} icon={UserCheck} accent="from-blue-500/15 via-blue-500/5 to-transparent" iconTone="bg-blue-500/10 text-blue-600" />
        <MetricCard title="Total Setoran" value={formatRupiah(stats.totalSetoran)} icon={Coins} accent="from-amber-500/15 via-amber-500/5 to-transparent" iconTone="bg-amber-500/10 text-amber-600" />
        <MetricCard title="Rata-rata Setoran" value={formatRupiah(stats.avgSetoran)} icon={TrendingUp} accent="from-violet-500/15 via-violet-500/5 to-transparent" iconTone="bg-violet-500/10 text-violet-600" />
        <MetricCard title="Nonaktif" value={stats.nonaktifMunfiq.toLocaleString('id-ID')} icon={History} accent="from-red-500/15 via-red-500/5 to-transparent" iconTone="bg-red-500/10 text-red-600" />
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1fr_1.4fr_auto]">
              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Kecamatan</p>
                <Select value={isScopedOperationalRole && assignedKecamatan ? assignedKecamatan : kecamatanFilter} onValueChange={(value) => {
                  if (isScopedOperationalRole) return
                  setKecamatanFilter(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="h-10 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {isScopedOperationalRole && assignedKecamatan ? <SelectItem value={assignedKecamatan}>{assignedKecamatan}</SelectItem> : null}
                    {!isScopedOperationalRole ? <SelectItem value="semua">Semua Kecamatan</SelectItem> : null}
                    {!isScopedOperationalRole ? kecamatanData.map((kec) => (
                      <SelectItem key={kec.id} value={kec.nama}>{kec.nama}</SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">PLPK</p>
                <Select value={plpkFilter} onValueChange={(value) => { setPlpkFilter(value); setCurrentPage(1) }}>
                  <SelectTrigger className="h-10 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="PLPK" />
                  </SelectTrigger>
                  <SelectContent>
                    {plpkOptions.map((value) => <SelectItem key={value} value={value}>{value === 'semua' ? 'Semua PLPK' : value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Status</p>
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as MunfiqStatus); setCurrentPage(1) }}>
                  <SelectTrigger className="h-10 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua Status</SelectItem>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Cari Munfiq</p>
                <div className="relative">
                  <Search className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari kode, nama, atau no HP..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-10 border-0 bg-transparent pl-7 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

                <Button variant="outline" className="h-auto min-h-[76px] rounded-2xl px-4" aria-expanded={advancedFilterOpen} aria-label="Buka atau tutup filter lanjutan munfiq" onClick={() => setAdvancedFilterOpen((value) => !value)}>
                <SlidersHorizontal className="mr-2 size-4" />
                Filter Lainnya
              </Button>
            </div>

            {advancedFilterOpen ? (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/20 p-3.5">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Urutkan</span>
                </div>
                <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                  <SelectTrigger className="w-[190px]">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kontribusi">Top Kontribusi</SelectItem>
                    <SelectItem value="nama">Nama A-Z</SelectItem>
                    <SelectItem value="terakhir">Setoran Terbaru</SelectItem>
                    <SelectItem value="registrasi">Registrasi Terbaru</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters ? (
                  <Button variant="ghost" size="sm" className="gap-2" onClick={handleResetFilters}>
                    <X className="size-4" />
                    Reset Filter
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 text-sm text-muted-foreground">
            <span>Menampilkan {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredData.length)} dari {filteredData.length} data</span>
            <span>Halaman {currentPage} dari {totalPages}</span>
          </div>

          <div className="hidden w-full overflow-x-auto md:block">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold whitespace-nowrap">Kode Munfiq</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Nama Munfiq</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">PLPK</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Ranting</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Alamat</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">No HP</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((munfiq) => {
                  return (
                    <TableRow key={munfiq.id} className="group hover:bg-muted/50">
                      <TableCell className="font-mono text-xs font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400">{munfiq.munfiqCode ?? munfiq.id}</TableCell>
                      <TableCell className="min-w-[180px]">
                        <div>
                          <p className="font-medium text-sm">{munfiq.nama}</p>
                          <p className="text-xs text-muted-foreground">{getGenderShortLabel(munfiq.jenisKelamin)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <div>
                          <p className="text-sm font-medium">{munfiq.plpkCode ?? '---'} - {munfiq.plpk}</p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400">{munfiq.kecamatan}</p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px]"><div><p className="text-sm font-medium">{munfiq.desa}</p><p className="text-xs text-emerald-700 dark:text-emerald-400">{munfiq.kecamatan}</p></div></TableCell>
                      <TableCell className="min-w-[220px]"><div><p className="text-sm">{munfiq.alamat}</p><p className="text-xs text-muted-foreground">{munfiq.desa}, {munfiq.kecamatan}</p></div></TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{munfiq.noHp}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={munfiq.status === 'aktif' ? 'default' : 'secondary'}
                          className={cn(
                            'text-xs whitespace-nowrap',
                            munfiq.status === 'aktif' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                          )}
                        >
                          {munfiq.status === 'aktif' ? 'Aktif' : 'Non Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleViewDetail(munfiq)} className="size-9 text-emerald-600" aria-label={`Lihat detail ${munfiq.nama}`}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleEditMunfiq(munfiq)} className="size-9 text-blue-600" aria-label={`Edit data ${munfiq.nama}`}>
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {paginatedData.map((munfiq) => {
              return (
                <div key={munfiq.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">{munfiq.munfiqCode ?? munfiq.id}</p>
                      <p className="truncate text-sm font-semibold">{munfiq.nama}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{getGenderShortLabel(munfiq.jenisKelamin)} · {munfiq.plpkCode ?? '---'} · {munfiq.plpk}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={munfiq.status === 'aktif' ? 'default' : 'secondary'}
                        className={cn(
                          'text-[10px]',
                          munfiq.status === 'aktif' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                        )}
                      >
                        {munfiq.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/75">Ranting</p>
                      <p className="mt-1 text-xs text-foreground">{munfiq.desa}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/75">No HP</p>
                      <p className="mt-1 text-xs text-foreground">{munfiq.noHp}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/75">Alamat</p>
                      <p className="mt-1 text-xs text-foreground">{munfiq.alamat}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="min-h-[44px] flex-1" aria-label={`Edit data ${munfiq.nama}`} onClick={() => handleEditMunfiq(munfiq)}>
                      Edit
                    </Button>
                    <Button size="sm" className="min-h-[44px] flex-1 bg-emerald-600 hover:bg-emerald-700" aria-label={`Lihat detail ${munfiq.nama}`} onClick={() => handleViewDetail(munfiq)}>
                      Detail
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredData.length === 0 && (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Belum ada data munfiq"
                description={hasActiveFilters ? 'Tidak ada munfiq yang cocok dengan filter saat ini. Coba reset filter atau ubah kata kunci pencarian.' : 'Belum ada munfiq terdaftar dalam scope role Anda.'}
                action={
                  <Button variant="outline" size="sm" className="min-h-[44px]" onClick={hasActiveFilters ? handleResetFilters : () => setCreateOpen(true)}>
                    {hasActiveFilters ? 'Reset Filter' : 'Tambah Munfiq'}
                  </Button>
                }
              />
            </div>
          )}

          {filteredData.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Baris per halaman</span>
                <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setCurrentPage(1) }}>
                  <SelectTrigger className="h-9 w-[84px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button variant="outline" size="icon" className="size-9" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Halaman sebelumnya">
                  <ChevronLeft className="size-4" />
                </Button>
                {visiblePages[0] && visiblePages[0] > 1 ? <span className="px-2 text-sm text-muted-foreground">1</span> : null}
                {visiblePages[0] && visiblePages[0] > 2 ? <span className="px-1 text-sm text-muted-foreground">...</span> : null}
                {visiblePages.map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'ghost'}
                    size="icon"
                    className={cn('size-8', page === currentPage ? 'bg-emerald-600 hover:bg-emerald-700' : '')}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                {visiblePages[visiblePages.length - 1] && visiblePages[visiblePages.length - 1] < totalPages - 1 ? <span className="px-1 text-sm text-muted-foreground">...</span> : null}
                {visiblePages[visiblePages.length - 1] && visiblePages[visiblePages.length - 1] < totalPages ? <span className="px-2 text-sm text-muted-foreground">{totalPages}</span> : null}
                <Button variant="outline" size="icon" className="size-9" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} aria-label="Halaman berikutnya">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
          {selectedMunfiq && (
            <>
              <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
                <SheetHeader className="pb-0">
                  <SheetTitle className="text-xl">{selectedMunfiq.nama}</SheetTitle>
                  <SheetDescription>Detail informasi, kesehatan relasi, dan riwayat kontribusi.</SheetDescription>
                </SheetHeader>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6 px-6 py-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn('px-3 py-1', selectedMunfiq.status === 'aktif' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600')}>
                      {selectedMunfiq.status === 'aktif' ? 'Munfiq Aktif' : 'Munfiq Nonaktif'}
                    </Badge>
                    {currentDetailTone && <Badge variant="outline" className={currentDetailTone.className}>{currentDetailTone.label}</Badge>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border border-border/40 bg-background/50 shadow-none">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Total Kontribusi</p>
                        <p className="mt-2 text-lg font-bold text-emerald-600">{formatRupiah(selectedMunfiq.totalSetoran)}</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-border/40 bg-background/50 shadow-none">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Frekuensi</p>
                        <p className="mt-2 text-lg font-bold">{selectedMunfiq.jumlahSetoran}x</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-border/40 bg-background/50 shadow-none">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Hari sejak setor</p>
                        <p className="mt-2 text-lg font-bold">{getDaysSince(selectedMunfiq.lastSetoran) ?? '-'} hari</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Informasi Pribadi</h4>
                      <div className="space-y-2 rounded-2xl border border-border/40 bg-background/40 p-4 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Kode Munfiq</span><span className="font-mono font-medium">{selectedMunfiq.munfiqCode ?? selectedMunfiq.id}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">NIK</span><span className="font-mono font-medium">{selectedMunfiq.nik}</span></div>
                        {selectedMunfiq.tglLahir && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Tanggal Lahir</span><span className="font-medium">{formatDateShort(selectedMunfiq.tglLahir)}</span></div>}
                        {selectedMunfiq.jenisKelamin && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Jenis Kelamin</span><span className="font-medium capitalize">{selectedMunfiq.jenisKelamin === 'pria' ? 'Pria' : 'Wanita'}</span></div>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kontak & Alamat</h4>
                      <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-4 text-sm">
                        <div className="flex items-center gap-3"><Phone className="size-4 text-muted-foreground" /><span className="font-mono">{selectedMunfiq.noHp}</span></div>
                        <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 text-muted-foreground" /><div><p>{selectedMunfiq.alamat}</p><p className="text-xs text-muted-foreground">{selectedMunfiq.desa}, {selectedMunfiq.kecamatan}</p></div></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Penugasan</h4>
                      <div className="space-y-2 rounded-2xl border border-border/40 bg-background/40 p-4 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Kecamatan</span><span className="font-medium">{selectedMunfiq.kecamatan}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Ranting</span><span className="font-medium">{selectedMunfiq.desa}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Assigned PLPK</span><span className="font-medium">{selectedMunfiq.plpk}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Kode PLPK</span><span className="font-mono font-medium">{selectedMunfiq.plpkCode ?? '-'}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Urutan Kecamatan</span><span className="font-mono font-medium">{selectedMunfiq.sequence ? String(selectedMunfiq.sequence).padStart(5, '0') : '-'}</span></div>
                        {selectedMunfiq.tglRegistrasi && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Tgl Registrasi</span><span className="font-medium">{formatDateShort(selectedMunfiq.tglRegistrasi)}</span></div>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Aktivitas Terakhir</h4>
                      <div className="rounded-2xl border border-border/40 bg-background/40 p-4 text-sm">
                        {selectedMunfiq.lastSetoran ? (
                          <div className="flex items-center gap-3"><Calendar className="size-4 text-muted-foreground" /><span>Kontribusi terakhir: {formatDateShort(selectedMunfiq.lastSetoran)}</span></div>
                        ) : (
                          <p className="text-muted-foreground">Belum ada riwayat kontribusi tercatat.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-border/50 pt-4">
                    <Button variant="outline" className="flex-1 gap-2" asChild>
                      <Link href="/gorut/transaksi">
                        <History className="size-4" />
                        Riwayat
                      </Link>
                    </Button>
                    <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700" asChild>
                      <Link href="/gorut/setoran">
                        <Coins className="size-4" />
                        Input Kontribusi
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
          {editingMunfiq && (
            <>
              <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
                <SheetHeader className="pb-0">
                  <SheetTitle className="text-xl">Edit Data Munfiq</SheetTitle>
                  <SheetDescription>{editingMunfiq.nama}</SheetDescription>
                </SheetHeader>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6 px-6 py-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Informasi Pribadi</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Kode Munfiq</label>
                        <Input value={editingMunfiq.munfiqCode || '-'} readOnly className="mt-1.5 text-sm font-mono text-muted-foreground" />
                        <p className="mt-1 text-xs text-muted-foreground">Kode ini permanen dan tidak berubah saat PLPK, alamat, atau ranting diperbarui.</p>
                      </div>
                      <div><label className="text-sm font-medium">Nama Lengkap</label><Input value={editingMunfiq.nama} onChange={(e) => setEditingMunfiq({ ...editingMunfiq, nama: e.target.value })} className="mt-1.5 text-sm" /></div>
                      <div><label className="text-sm font-medium">NIK</label><Input value={editingMunfiq.nik} onChange={(e) => setEditingMunfiq({ ...editingMunfiq, nik: e.target.value })} className="mt-1.5 text-sm" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-sm font-medium">Tgl. Lahir</label><Input type="date" value={editingMunfiq.tglLahir || ''} onChange={(e) => setEditingMunfiq({ ...editingMunfiq, tglLahir: e.target.value })} className="mt-1.5 text-sm" /></div>
                        <div>
                          <label className="text-sm font-medium">Jenis Kelamin</label>
                          <Select value={editingMunfiq.jenisKelamin || 'pria'} onValueChange={(value) => setEditingMunfiq({ ...editingMunfiq, jenisKelamin: value as MunfiqData['jenisKelamin'] })}>
                            <SelectTrigger className="mt-1.5 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pria">Pria</SelectItem>
                              <SelectItem value="wanita">Wanita</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kontak & Alamat</h4>
                    <div className="space-y-3">
                      <div><label className="text-sm font-medium">No. Telepon</label><Input value={editingMunfiq.noHp} onChange={(e) => setEditingMunfiq({ ...editingMunfiq, noHp: e.target.value })} className="mt-1.5 text-sm" /></div>
                      <div><label className="text-sm font-medium">Alamat</label><Input value={editingMunfiq.alamat} onChange={(e) => setEditingMunfiq({ ...editingMunfiq, alamat: e.target.value })} className="mt-1.5 text-sm" /></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Penugasan Wilayah</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Kecamatan</label>
                        <Select value={editingMunfiq.kecamatan} onValueChange={(value) => setEditingMunfiq({ ...editingMunfiq, kecamatan: value })}>
                          <SelectTrigger className="mt-1.5 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {kecamatanData.map((kec) => <SelectItem key={kec.nama} value={kec.nama}>{kec.nama}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><label className="text-sm font-medium">Ranting</label><Input value={editingMunfiq.desa} onChange={(e) => setEditingMunfiq({ ...editingMunfiq, desa: e.target.value })} className="mt-1.5 text-sm" /></div>
                      <div><label className="text-sm font-medium">Assigned PLPK</label><Input value={editingMunfiq.plpk} onChange={(e) => setEditingMunfiq({ ...editingMunfiq, plpk: e.target.value })} className="mt-1.5 text-sm" /></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status</h4>
                    <Select value={editingMunfiq.status} onValueChange={(value) => setEditingMunfiq({ ...editingMunfiq, status: value as MunfiqData['status'] })}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aktif">Aktif</SelectItem>
                        <SelectItem value="nonaktif">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sticky bottom-0 -mx-6 mt-4 flex gap-2 border-t border-border/50 bg-gradient-to-t from-background via-background/95 to-transparent px-6 pb-6 pt-6">
                    <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Batal</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveEdit}>Simpan Perubahan</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
          <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
            <SheetHeader className="pb-0">
              <SheetTitle className="text-xl">Tambah Munfiq Baru</SheetTitle>
              <SheetDescription>Lengkapi profil dasar, penugasan wilayah, dan status awal.</SheetDescription>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-6 py-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Informasi Pribadi</h4>
                <div className="space-y-3">
                  <div><label className="text-sm font-medium">Nama Lengkap</label><Input value={newMunfiq.nama} onChange={(e) => updateNewMunfiq('nama', e.target.value)} className="mt-1.5 text-sm" /></div>
                  <div><label className="text-sm font-medium">NIK</label><Input value={newMunfiq.nik} onChange={(e) => updateNewMunfiq('nik', e.target.value)} className="mt-1.5 text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium">No. Telepon</label><Input value={newMunfiq.noHp} onChange={(e) => updateNewMunfiq('noHp', e.target.value)} className="mt-1.5 text-sm" /></div>
                    <div><label className="text-sm font-medium">Tgl. Lahir</label><Input type="date" value={newMunfiq.tglLahir || ''} onChange={(e) => updateNewMunfiq('tglLahir', e.target.value)} className="mt-1.5 text-sm" /></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Jenis Kelamin</label>
                    <Select value={newMunfiq.jenisKelamin || 'pria'} onValueChange={(value) => updateNewMunfiq('jenisKelamin', value as MunfiqData['jenisKelamin'])}>
                      <SelectTrigger className="mt-1.5 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pria">Pria</SelectItem>
                        <SelectItem value="wanita">Wanita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kontak & Penugasan</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Kode Munfiq</label>
                    <Input value={newMunfiq.plpk ? 'Otomatis saat disimpan' : 'Lengkapi kecamatan dan PLPK'} readOnly className="mt-1.5 text-sm font-mono text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">Format kode: kecamatan + kode PLPK + urutan global per kecamatan.</p>
                  </div>
                  <div><label className="text-sm font-medium">Alamat</label><Input value={newMunfiq.alamat} onChange={(e) => updateNewMunfiq('alamat', e.target.value)} className="mt-1.5 text-sm" /></div>
                  <div>
                    <label className="text-sm font-medium">Kecamatan</label>
                    <Select value={newMunfiq.kecamatan} onValueChange={(value) => updateNewMunfiq('kecamatan', value)}>
                      <SelectTrigger className="mt-1.5 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {kecamatanData.map((kec) => <SelectItem key={kec.nama} value={kec.nama}>{kec.nama}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium">Ranting</label><Input value={newMunfiq.desa} onChange={(e) => updateNewMunfiq('desa', e.target.value)} className="mt-1.5 text-sm" /></div>
                    <div><label className="text-sm font-medium">Assigned PLPK</label><Input value={newMunfiq.plpk} onChange={(e) => updateNewMunfiq('plpk', e.target.value)} className="mt-1.5 text-sm" /></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status Awal</label>
                    <Select value={newMunfiq.status} onValueChange={(value) => updateNewMunfiq('status', value as MunfiqData['status'])}>
                      <SelectTrigger className="mt-1.5 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aktif">Aktif</SelectItem>
                        <SelectItem value="nonaktif">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-6 mt-4 flex gap-2 border-t border-border/50 bg-gradient-to-t from-background via-background/95 to-transparent px-6 pb-6 pt-6">
                <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Batal</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateMunfiq}>Tambah Munfiq</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Preview Import Munfiq</DialogTitle>
            <DialogDescription>
              {importFileName || 'File import'} siap diproses. Tinjau data terlebih dahulu sebelum masuk ke database GORUT.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border border-border/40 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total Baris</p>
                  <p className="mt-2 text-2xl font-semibold">{importPreviewRows.length}</p>
                </CardContent>
              </Card>
              <Card className="border border-border/40 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Data Baru</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{importPreviewSummary.fresh}</p>
                </CardContent>
              </Card>
              <Card className="border border-border/40 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Akan Replace</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">{importPreviewSummary.duplicates}</p>
                </CardContent>
              </Card>
            </div>

            {isScopedOperationalRole && assignedKecamatan ? (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                Semua data import untuk akun ini otomatis disimpan ke kecamatan <span className="font-semibold">{assignedKecamatan}</span>.
              </div>
            ) : null}

            <div className="max-h-[45vh] overflow-auto rounded-xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Baris</TableHead>
                    <TableHead>Kode Munfiq</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Kecamatan</TableHead>
                    <TableHead>Ranting</TableHead>
                    <TableHead>PLPK</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreviewRows.map((item) => (
                    <TableRow key={`${item.id}-${item.sourceRow}`}>
                      <TableCell className="font-mono text-xs">{item.sourceRow}</TableCell>
                      <TableCell className="font-mono text-xs">{item.munfiqCode ?? '-'}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="font-mono text-xs">{item.nik}</TableCell>
                      <TableCell>{item.kecamatan}</TableCell>
                      <TableCell>{item.desa}</TableCell>
                      <TableCell>{item.plpk}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'aktif' ? 'default' : 'secondary'} className={item.status === 'aktif' ? 'bg-emerald-500/10 text-emerald-600' : ''}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.duplicateTarget ? (
                          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600">
                            Replace {item.duplicateTarget}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                            Baru
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false)
                setImportPreviewRows([])
                setImportFileName('')
              }}
            >
              Batal
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApplyImport} disabled={importPreviewRows.length === 0 || isImporting}>
              {isImporting ? 'Memproses...' : 'Import Sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
