'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Download,
  Pencil,
  FileText,
  RotateCcw,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react'
import {
  activityLogData,
  approvalTransactionData,
  formatRupiah,
  kecamatanTargets,
  monthlyProgressData,
  monthlyTargets,
  plpkData,
  plpkTargets,
  transactionData,
} from '@/lib/gorut/data'
import { exportReportToPdf } from '@/lib/gorut/export'
import { useToast } from '@/hooks/use-toast'
import { type GorutClosingRecord, type GorutClosingVerdict, useGorutMonthlyClosingRecords, writeGorutMonthlyClosingRecords } from '@/lib/gorut/monthly-closing'
import { cn } from '@/lib/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type PerformanceStatus = 'achieved' | 'on_track' | 'warning' | 'below_target'
function StatusBadge({ status }: { status: PerformanceStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'achieved' && 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        status === 'on_track' && 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400',
        status === 'warning' && 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400',
        status === 'below_target' && 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400'
      )}
    >
      {status === 'achieved' && 'Tercapai'}
      {status === 'on_track' && 'On Track'}
      {status === 'warning' && 'Warning'}
      {status === 'below_target' && 'Butuh Intervensi'}
    </Badge>
  )
}

function ProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

function formatMonthKey(label: string) {
  return label.split(' ')[0]
}

function getStatusColor(status: PerformanceStatus) {
  if (status === 'achieved') return 'bg-emerald-500'
  if (status === 'on_track') return 'bg-blue-500'
  if (status === 'warning') return 'bg-amber-500'
  return 'bg-red-500'
}

export default function RekapBulananPage() {
  const { toast } = useToast()
  const closingHistory = useGorutMonthlyClosingRecords()
  const [selectedMonth, setSelectedMonth] = useState(monthlyTargets[0]?.bulan ?? 'Mei 2026')
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua')
  const [closingOpen, setClosingOpen] = useState(false)
  const [closingVerdict, setClosingVerdict] = useState<GorutClosingVerdict>('siap-publikasi')
  const [closingNote, setClosingNote] = useState('')

  const monthKey = formatMonthKey(selectedMonth)
  const currentTarget = monthlyTargets.find((item) => item.bulan === selectedMonth) ?? monthlyTargets[0]
  const monthlyTrend = monthlyProgressData.find((item) => item.bulan === monthKey)

  const monthlyKecamatan = useMemo(
    () => {
      const items = kecamatanTargets.filter((item) => item.bulan === selectedMonth)
      const filtered = selectedKecamatan === 'semua' ? items : items.filter((item) => item.kecamatanNama === selectedKecamatan)
      return filtered.sort((a, b) => b.currentAmount - a.currentAmount)
    },
    [selectedKecamatan, selectedMonth]
  )

  const monthlyPlpk = useMemo(
    () => {
      const items = plpkTargets.filter((item) => item.bulan === selectedMonth)
      const filtered = selectedKecamatan === 'semua' ? items : items.filter((item) => item.kecamatan === selectedKecamatan)
      return filtered.sort((a, b) => b.currentAmount - a.currentAmount)
    },
    [selectedKecamatan, selectedMonth]
  )

  const pendingApprovals = useMemo(
    () => {
      const items = approvalTransactionData.filter((item) => item.overallStatus === 'pending')
      return selectedKecamatan === 'semua' ? items : items.filter((item) => item.kecamatan === selectedKecamatan)
    },
    [selectedKecamatan]
  )

  const recentMonthlyExports = useMemo(
    () => activityLogData.filter((item) => item.action === 'export' && item.detail.toLowerCase().includes('bulanan')),
    []
  )

  const pendingTransactions = useMemo(
    () => {
      const items = transactionData.filter((item) => item.status === 'pending')
      return selectedKecamatan === 'semua' ? items : items.filter((item) => item.kecamatan === selectedKecamatan)
    },
    [selectedKecamatan]
  )

  const inactivePlpk = useMemo(() => {
    const items = plpkData.filter((item) => item.status === 'nonaktif')
    return selectedKecamatan === 'semua' ? items : items.filter((item) => item.kecamatan === selectedKecamatan)
  }, [selectedKecamatan])

  const availableKecamatan = useMemo(
    () => kecamatanTargets.filter((item) => item.bulan === selectedMonth).map((item) => item.kecamatanNama),
    [selectedMonth]
  )

  const totalKecamatanAchieved = monthlyKecamatan.filter((item) => item.achievementPercentage >= 95).length
  const totalPlpkAtRisk = monthlyPlpk.filter((item) => item.achievementPercentage < 85).length
  const targetGap = Math.max(0, currentTarget.targetAmount - currentTarget.currentAmount)
  const variance = (monthlyTrend?.actual ?? currentTarget.currentAmount) - currentTarget.targetAmount
  const closingChecks = [
    {
      label: 'Approval lintas level selesai',
      done: pendingApprovals.length === 0,
      detail: pendingApprovals.length === 0 ? 'Tidak ada approval tertunda.' : `${pendingApprovals.length} approval masih menunggu.`
    },
    {
      label: 'Validasi transaksi sudah bersih',
      done: pendingTransactions.length === 0,
      detail: pendingTransactions.length === 0 ? 'Tidak ada transaksi pending.' : `${pendingTransactions.length} transaksi masih pending.`
    },
    {
      label: 'PLPK nonaktif sudah ditindaklanjuti',
      done: inactivePlpk.length === 0,
      detail: inactivePlpk.length === 0 ? 'Tidak ada PLPK nonaktif.' : `${inactivePlpk.length} PLPK perlu follow-up.`
    },
    {
      label: 'Capaian wilayah minimal on track',
      done: monthlyKecamatan.every((item) => item.achievementPercentage >= 80),
      detail: monthlyKecamatan.some((item) => item.achievementPercentage < 80)
        ? `${monthlyKecamatan.filter((item) => item.achievementPercentage < 80).length} wilayah di bawah 80%.`
        : 'Semua wilayah minimal 80%.'
    },
  ]
  const closingScore = Math.round((closingChecks.filter((item) => item.done).length / closingChecks.length) * 100)
  const lowestPerformer = monthlyPlpk[monthlyPlpk.length - 1]
  const currentAreaLabel = selectedKecamatan === 'semua' ? 'Semua Kecamatan' : selectedKecamatan
  const currentClosingRecord = useMemo(
    () => closingHistory.find((item) => item.month === selectedMonth && item.area === currentAreaLabel) ?? null,
    [closingHistory, currentAreaLabel, selectedMonth]
  )
  const latestClosing = useMemo(
    () => closingHistory.find((item) => item.month === selectedMonth && item.area === currentAreaLabel) ?? closingHistory[0],
    [closingHistory, currentAreaLabel, selectedMonth]
  )

  useEffect(() => {
    if (!closingOpen) {
      return
    }

    setClosingVerdict(closingScore >= 75 ? 'siap-publikasi' : 'butuh-tindak-lanjut')
    setClosingNote('')
  }, [closingOpen, closingScore])

  const handleExportCsv = () => {
    const lines = [
      ['Periode', selectedMonth],
      ['Filter Kecamatan', selectedKecamatan === 'semua' ? 'Semua Kecamatan' : selectedKecamatan],
      ['Target Bulanan', currentTarget.targetAmount.toString()],
      ['Realisasi', currentTarget.currentAmount.toString()],
      ['Pencapaian (%)', currentTarget.achievementPercentage.toFixed(1)],
      ['Pending Approval', pendingApprovals.length.toString()],
      ['Pending Transaksi', pendingTransactions.length.toString()],
      ['PLPK Nonaktif', inactivePlpk.length.toString()],
      ['Closing Score', closingScore.toString()],
      ['Closing Verdict', currentClosingRecord ? (currentClosingRecord.verdict === 'siap-publikasi' ? 'Siap Publikasi' : 'Butuh Tindak Lanjut') : 'Belum closing'],
      ['Closing Note', currentClosingRecord?.note ?? ''],
      [''],
      ['Top Wilayah'],
      ['Ranking', 'Kecamatan', 'Target', 'Realisasi', 'Pencapaian'],
      ...monthlyKecamatan.map((item) => [
        item.ranking.toString(),
        item.kecamatanNama,
        item.targetAmount.toString(),
        item.currentAmount.toString(),
        item.achievementPercentage.toFixed(1),
      ]),
      [''],
      ['Top PLPK'],
      ['Ranking', 'PLPK', 'Kecamatan', 'Target', 'Realisasi', 'Pencapaian'],
      ...monthlyPlpk.map((item) => [
        item.ranking.toString(),
        item.plpkNama,
        item.kecamatan,
        item.targetAmount.toString(),
        item.currentAmount.toString(),
        item.achievementPercentage.toFixed(1),
      ]),
    ]

    const csv = lines
      .map((row) => row.map((cell = '') => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const area = selectedKecamatan === 'semua' ? 'semua-kecamatan' : selectedKecamatan.toLowerCase().replace(/\s+/g, '-')
    link.href = url
    link.download = `rekap-bulanan-${selectedMonth.toLowerCase().replace(/\s+/g, '-')}-${area}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    exportReportToPdf({
      title: 'Rekap Bulanan GORUT',
      subtitle: `${selectedMonth} • ${currentAreaLabel}`,
      summary: [
        { label: 'Target Bulanan', value: formatRupiah(currentTarget.targetAmount) },
        { label: 'Realisasi', value: formatRupiah(currentTarget.currentAmount) },
        { label: 'Pencapaian', value: `${currentTarget.achievementPercentage.toFixed(1)}%` },
        { label: 'Closing Score', value: `${closingScore}%` },
      ],
      tables: [
        {
          title: 'Top Wilayah Bulanan',
          columns: ['Ranking', 'Kecamatan', 'Target', 'Realisasi', 'Pencapaian'],
          rows: monthlyKecamatan.map((item) => [
            String(item.ranking),
            item.kecamatanNama,
            formatRupiah(item.targetAmount),
            formatRupiah(item.currentAmount),
            `${item.achievementPercentage.toFixed(1)}%`,
          ]),
        },
        {
          title: 'Top PLPK Bulanan',
          columns: ['Ranking', 'PLPK', 'Kecamatan', 'Target', 'Realisasi', 'Pencapaian'],
          rows: monthlyPlpk.map((item) => [
            String(item.ranking),
            item.plpkNama,
            item.kecamatan,
            formatRupiah(item.targetAmount),
            formatRupiah(item.currentAmount),
            `${item.achievementPercentage.toFixed(1)}%`,
          ]),
        },
      ],
      notes: [
        `Pending approval: ${pendingApprovals.length}`,
        `Pending transaksi: ${pendingTransactions.length}`,
        `PLPK nonaktif: ${inactivePlpk.length}`,
        'Gunakan Print to PDF pada dialog browser untuk menyimpan file.',
      ],
    })
  }

  const handleMonthlyClosing = () => {
    const nextRecord: GorutClosingRecord = {
      id: `closing-${selectedMonth}-${currentAreaLabel}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      month: selectedMonth,
      area: currentAreaLabel,
      closedAt: new Date().toISOString(),
      verdict: closingVerdict,
      note: closingNote.trim(),
    }

    void writeGorutMonthlyClosingRecords([
      nextRecord,
      ...closingHistory.filter((item) => !(item.month === selectedMonth && item.area === currentAreaLabel)),
    ])
      .then(() => {
        toast({ variant: 'default', title: 'Closing bulanan disimpan', description: `Keputusan closing ${selectedMonth} untuk ${currentAreaLabel} berhasil diperbarui.` })
        setClosingOpen(false)
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Gagal menyimpan closing', description: 'Keputusan closing belum berhasil diperbarui.' })
      })
  }

  const handleOpenClosingEditor = () => {
    if (currentClosingRecord) {
      setClosingVerdict(currentClosingRecord.verdict)
      setClosingNote(currentClosingRecord.note)
    }
    setClosingOpen(true)
  }

  const handleUseClosingFilter = (record: GorutClosingRecord) => {
    setSelectedMonth(record.month)
    setSelectedKecamatan(record.area === 'Semua Kecamatan' ? 'semua' : record.area)
  }

  const handleReopenClosing = () => {
    void writeGorutMonthlyClosingRecords(
      closingHistory.filter((item) => !(item.month === selectedMonth && item.area === currentAreaLabel))
    )
      .then(() => {
        toast({ variant: 'default', title: 'Closing dibuka kembali', description: `Status closing ${selectedMonth} untuk ${currentAreaLabel} berhasil dibuka kembali.` })
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Gagal reopen closing', description: 'Status closing belum berhasil dibuka kembali.' })
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekap Bulanan</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan target, realisasi, operasional approval, dan performa wilayah untuk kebutuhan super admin.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-[180px]">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthlyTargets.map((item) => (
                  <SelectItem key={item.id} value={item.bulan}>
                    {item.bulan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <Select value={selectedKecamatan} onValueChange={setSelectedKecamatan}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Semua Kecamatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kecamatan</SelectItem>
                {availableKecamatan.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCsv}>
              <Download className="size-4" />
              Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPdf}>
              <FileText className="size-4" />
              Export PDF
          </Button>
          <Dialog open={closingOpen} onOpenChange={setClosingOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleOpenClosingEditor}>
                {currentClosingRecord ? <Pencil className="size-4" /> : <CheckCircle2 className="size-4" />}
                {currentClosingRecord ? 'Edit Closing' : 'Closing Bulanan'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Konfirmasi Closing Bulanan</DialogTitle>
                <DialogDescription>
                  Penutupan ini akan menandai bahwa rekap {selectedMonth}
                  {selectedKecamatan !== 'semua' ? ` untuk ${selectedKecamatan}` : ''} siap dipublikasikan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Closing readiness</span>
                  <span className="font-semibold">{closingScore}%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Pending approval</span>
                  <span className="font-semibold">{pendingApprovals.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Pending transaksi</span>
                  <span className="font-semibold">{pendingTransactions.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">PLPK nonaktif</span>
                  <span className="font-semibold">{inactivePlpk.length}</span>
                </div>
                <div>
                  <p className="mb-2 text-muted-foreground">Verdict Super Admin</p>
                  <Select value={closingVerdict} onValueChange={(value: 'siap-publikasi' | 'butuh-tindak-lanjut') => setClosingVerdict(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="siap-publikasi">Siap Publikasi</SelectItem>
                      <SelectItem value="butuh-tindak-lanjut">Butuh Tindak Lanjut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-muted-foreground">Catatan Closing</p>
                  <Textarea
                    value={closingNote}
                    onChange={(event) => setClosingNote(event.target.value)}
                    rows={4}
                    placeholder="Tambahkan catatan super admin untuk periode ini..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClosingOpen(false)}>Batal</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleMonthlyClosing}>Konfirmasi Closing</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Target Bulanan</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{formatRupiah(currentTarget.targetAmount)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Periode {selectedMonth}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Target className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Realisasi</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{formatRupiah(currentTarget.currentAmount)}</p>
                <p className="mt-1 text-xs text-emerald-600">{currentTarget.achievementPercentage.toFixed(1)}% dari target</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Selisih Target</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{formatRupiah(targetGap)}</p>
                <p className={cn('mt-1 text-xs', variance >= 0 ? 'text-emerald-600' : 'text-amber-600')}>
                  {variance >= 0 ? 'Di atas target bulanan' : 'Masih perlu dorongan'}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <CalendarRange className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{pendingApprovals.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Perlu eskalasi lintas level</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
                <TriangleAlert className="size-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="size-4" />
              Target vs Realisasi Bulanan
            </CardTitle>
            <CardDescription>Perbandingan historis target dan realisasi per bulan untuk melihat momentum capaian.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyProgressData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="bulan" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000000)}jt`} />
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px' }}
                  />
                  <Legend />
                  <Bar dataKey="target" name="Target" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Realisasi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Executive Summary</CardTitle>
            <CardDescription>
              Poin yang paling perlu dipantau super admin pada periode {selectedMonth}
              {selectedKecamatan !== 'semua' ? ` untuk ${selectedKecamatan}` : ''}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-background/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Status Capaian Bulanan</p>
                  <p className="mt-1 text-xs text-muted-foreground">{currentTarget.currentAmount >= currentTarget.targetAmount ? 'Target sudah melampaui threshold.' : 'Masih ada gap menuju target akhir bulan.'}</p>
                </div>
                <StatusBadge status={currentTarget.status} />
              </div>
              <div className="mt-3">
                <ProgressBar value={currentTarget.achievementPercentage} colorClass={getStatusColor(currentTarget.status)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Kecamatan Strong</p>
                <p className="mt-2 text-2xl font-bold">{totalKecamatanAchieved}</p>
                <p className="text-xs text-muted-foreground">wilayah di atas 95%</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">PLPK At Risk</p>
                <p className="mt-2 text-2xl font-bold">{totalPlpkAtRisk}</p>
                <p className="text-xs text-muted-foreground">butuh coaching atau follow-up</p>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Approval & Operasional</p>
                <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  <Link href="/gorut/approval">Buka Approval</Link>
                </Button>
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Pending approval lintas level</span>
                  <span className="font-medium text-foreground">{pendingApprovals.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Transaksi pending validasi</span>
                  <span className="font-medium text-foreground">{pendingTransactions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>PLPK nonaktif</span>
                  <span className="font-medium text-foreground">{inactivePlpk.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Export bulanan terbaru</span>
                  <span className="font-medium text-foreground">{recentMonthlyExports.length}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Mode Closing Bulanan</p>
                  <p className="mt-1 text-xs text-muted-foreground">Kesiapan administrasi akhir periode untuk publikasi rekap.</p>
                </div>
                <Badge variant="outline" className={cn(closingScore >= 75 ? 'border-emerald-500/30 text-emerald-600' : 'border-amber-500/30 text-amber-600')}>
                  {closingScore}% Ready
                </Badge>
              </div>
              <div className="mt-3">
                <ProgressBar value={closingScore} colorClass={closingScore >= 75 ? 'bg-emerald-500' : 'bg-amber-500'} />
              </div>
              {latestClosing && (
                <div className="mt-3 rounded-md border border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
                  <div>
                    Closing terakhir: <span className="font-medium text-foreground">{latestClosing.month}</span> • {latestClosing.area} • {latestClosing.closedAt}
                  </div>
                  <div className="mt-1">
                    Verdict: <span className="font-medium text-foreground">{latestClosing.verdict === 'siap-publikasi' ? 'Siap Publikasi' : 'Butuh Tindak Lanjut'}</span>
                  </div>
                  {latestClosing.note && <div className="mt-1">Catatan: <span className="text-foreground">{latestClosing.note}</span></div>}
                  {currentClosingRecord && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={handleOpenClosingEditor}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={handleReopenClosing}>
                        <RotateCcw className="size-3.5" />
                        Reopen
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Top Wilayah Bulanan</CardTitle>
                <CardDescription>Ranking kecamatan berdasarkan realisasi pada {selectedMonth}.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/gorut/kecamatan">
                  Detail
                  <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyKecamatan.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">#{item.ranking}</span>
                      <p className="truncate font-medium">{item.kecamatanNama}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRupiah(item.currentAmount)} / {formatRupiah(item.targetAmount)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 space-y-2">
                  <ProgressBar value={item.achievementPercentage} colorClass={getStatusColor(item.status)} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.achievementPercentage.toFixed(1)}% tercapai</span>
                    <span>{formatRupiah(Math.max(0, item.targetAmount - item.currentAmount))} sisa</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Top PLPK Bulanan</CardTitle>
                <CardDescription>Kontributor lapangan yang paling dekat atau sudah melampaui target.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/gorut/ranting">
                  Detail
                  <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyPlpk.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">#{item.ranking}</span>
                      <p className="truncate font-medium">{item.plpkNama}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.kecamatan}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 space-y-2">
                  <ProgressBar value={item.achievementPercentage} colorClass={getStatusColor(item.status)} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatRupiah(item.currentAmount)} realisasi</span>
                    <span>target {formatRupiah(item.targetAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Antrian Approval Prioritas</CardTitle>
            <CardDescription>Transaksi yang masih menunggu approval dan perlu pengawalan super admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.kode}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        Step: {item.currentStep.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.munfiqNama} • {item.kecamatan} • {formatRupiah(item.nominal)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Riwayat approval: {item.approvalHistory.length} tahap selesai</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href="/gorut/approval">
                      Review
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Checklist Admin Bulanan</CardTitle>
            <CardDescription>Tindakan yang biasanya dibutuhkan sebelum tutup periode dan publikasi rekap.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {closingChecks.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
                <CheckCircle2 className={cn('mt-0.5 size-4', item.done ? 'text-emerald-600' : 'text-muted-foreground')} />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
              <Users className="mt-0.5 size-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Follow-up PLPK nonaktif</p>
                <p className="text-xs text-muted-foreground">{inactivePlpk.map((item) => item.nama).join(', ') || 'Tidak ada PLPK nonaktif.'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
              <FileText className="mt-0.5 size-4 text-violet-600" />
              <div>
                <p className="text-sm font-medium">Riwayat export bulanan</p>
                <p className="text-xs text-muted-foreground">
                  {recentMonthlyExports[0]?.detail ?? 'Belum ada activity export bulanan yang tercatat.'}
                </p>
              </div>
            </div>
            {lowestPerformer && (
              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
                <TriangleAlert className="mt-0.5 size-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">Perlu Intervensi Terdekat</p>
                  <p className="text-xs text-muted-foreground">
                    {lowestPerformer.plpkNama} di {lowestPerformer.kecamatan} baru mencapai {lowestPerformer.achievementPercentage.toFixed(1)}%.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Riwayat Closing Bulanan</CardTitle>
          <CardDescription>Jejak keputusan closing yang disimpan di browser untuk monitoring dan tindak lanjut super admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {closingHistory.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Belum ada riwayat closing tersimpan untuk browser ini.
            </div>
          ) : (
            <div className="space-y-3">
              {closingHistory.map((record) => {
                const isCurrentRecord = record.month === selectedMonth && record.area === currentAreaLabel

                return (
                  <div key={`${record.month}-${record.area}`} className="rounded-lg border border-border/50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{record.month}</p>
                          <Badge variant="secondary" className="text-[10px]">{record.area}</Badge>
                          <Badge
                            variant="outline"
                            className={cn(record.verdict === 'siap-publikasi' ? 'border-emerald-500/30 text-emerald-600' : 'border-amber-500/30 text-amber-600')}
                          >
                            {record.verdict === 'siap-publikasi' ? 'Siap Publikasi' : 'Butuh Tindak Lanjut'}
                          </Badge>
                          {isCurrentRecord && <Badge variant="outline">Aktif</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Closed at {record.closedAt}</p>
                        {record.note && <p className="mt-2 text-sm text-muted-foreground">{record.note}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleUseClosingFilter(record)}>
                          Buka
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-xs"
                          onClick={() => {
                            handleUseClosingFilter(record)
                            setClosingVerdict(record.verdict)
                            setClosingNote(record.note)
                            setClosingOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
