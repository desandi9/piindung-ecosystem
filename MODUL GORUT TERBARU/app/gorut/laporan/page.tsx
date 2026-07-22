'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  MapPin,
  Users,
  Coins,
  BarChart3,
  CheckCircle2,
  FileDown,
  Inbox,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { MetricCard, EmptyState, PageSectionHeader, IconBox } from '@/components/ui/ds-patterns'
import { formatRupiah } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { useGorutLaporanSummary } from '@/lib/gorut/laporan-control'
import { cn } from '@/lib/utils'

const reportTypes = [
  {
    id: 'bulanan',
    title: 'Laporan Bulanan',
    description: 'Ringkasan transaksi dan statistik per bulan',
    icon: Calendar,
    tone: 'success' as const,
    formats: ['Excel', 'PDF'],
  },
  {
    id: 'wilayah',
    title: 'Laporan Wilayah',
    description: 'Statistik per kecamatan dan ranting',
    icon: MapPin,
    tone: 'info' as const,
    formats: ['Excel', 'PDF', 'CSV'],
  },
  {
    id: 'plpk',
    title: 'Laporan PLPK',
    description: 'Performa dan ranking petugas lapangan',
    icon: Users,
    tone: 'primary' as const,
    formats: ['Excel', 'PDF'],
  },
  {
    id: 'keuangan',
    title: 'Laporan Keuangan',
    description: 'Arus kas dan rekapitulasi keuangan',
    icon: Coins,
    tone: 'warning' as const,
    formats: ['Excel', 'PDF'],
  },
  {
    id: 'munfiq',
    title: 'Data Munfiq',
    description: 'Daftar lengkap donatur dan kontribusi',
    icon: Users,
    tone: 'destructive' as const,
    formats: ['Excel', 'CSV'],
  },
  {
    id: 'transaksi',
    title: 'Riwayat Transaksi',
    description: 'Detail seluruh transaksi setoran',
    icon: BarChart3,
    tone: 'info' as const,
    formats: ['Excel', 'PDF', 'CSV'],
  },
]

const recentExports = [
  { id: '1', nama: 'Laporan Bulanan April 2026', tanggal: '2026-05-14T10:30:00', format: 'PDF', ukuran: '2.4 MB', status: 'selesai' },
  { id: '2', nama: 'Data Munfiq - Garut Kota', tanggal: '2026-05-13T15:20:00', format: 'Excel', ukuran: '856 KB', status: 'selesai' },
  { id: '3', nama: 'Laporan PLPK Q1 2026', tanggal: '2026-05-12T09:00:00', format: 'PDF', ukuran: '1.8 MB', status: 'selesai' },
  { id: '4', nama: 'Transaksi Mei 2026', tanggal: '2026-05-10T14:45:00', format: 'CSV', ukuran: '324 KB', status: 'selesai' },
]

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LaporanPage() {
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState('2026-05')
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua')
  const { summary: overview, loading, error } = useGorutLaporanSummary(selectedMonth, selectedKecamatan)
  const topUpzis = overview.perUpzis[0]
  const topRanting = overview.perRanting[0]
  const topPlpk = overview.perPlpk[0]
  const latestRekapDana = overview.rekapDana[0]
  const hasReportData = overview.headline.totalTransaksiSelesai > 0 || overview.transactions.length > 0 || overview.perUpzis.length > 0

  const reportConfig = useMemo(() => ({
    bulanan: {
      title: 'Laporan Bulanan GORUT',
      summary: [
        { label: 'Periode', value: overview.period.label },
        { label: 'Total Penghimpunan', value: formatRupiah(overview.headline.totalPenghimpunan) },
        { label: 'Transaksi Selesai', value: String(overview.headline.totalTransaksiSelesai) },
        { label: 'Munfiq Berkontribusi', value: String(overview.headline.totalMunfiqBerkontribusi) },
      ],
      tableTitle: 'Ringkasan Bulanan per Kecamatan',
      rows: overview.perUpzis.map((item) => [item.name, item.kecamatan ?? '-', formatRupiah(item.totalAmount), String(item.transactionCount), String(item.munfiqCount)]),
      columns: ['UPZIS', 'Kecamatan', 'Total', 'Transaksi', 'Munfiq'],
    },
    wilayah: {
      title: 'Laporan Wilayah GORUT',
      summary: [
        { label: 'Top UPZIS', value: topUpzis?.name ?? '-' },
        { label: 'Top Ranting', value: topRanting?.name ?? '-' },
        { label: 'Total Ranting', value: String(overview.perRanting.length) },
        { label: 'Total Penghimpunan', value: formatRupiah(overview.headline.totalPenghimpunan) },
      ],
      tableTitle: 'Statistik Wilayah',
      rows: overview.perRanting.map((item) => [item.name, item.kecamatan ?? '-', formatRupiah(item.totalAmount), String(item.transactionCount), String(item.munfiqCount)]),
      columns: ['Ranting', 'Kecamatan', 'Total', 'Transaksi', 'Munfiq'],
    },
    plpk: {
      title: 'Laporan PLPK GORUT',
      summary: [
        { label: 'Top PLPK', value: topPlpk?.name ?? '-' },
        { label: 'Total PLPK', value: String(overview.perPlpk.length) },
        { label: 'Transaksi Selesai', value: String(overview.headline.totalTransaksiSelesai) },
        { label: 'Total Penghimpunan', value: formatRupiah(overview.headline.totalPenghimpunan) },
      ],
      tableTitle: 'Performa PLPK',
      rows: overview.perPlpk.map((item) => [item.name, item.kecamatan ?? '-', item.ranting ?? '-', formatRupiah(item.totalAmount), String(item.transactionCount), String(item.munfiqCount)]),
      columns: ['PLPK', 'Kecamatan', 'Ranting', 'Total', 'Transaksi', 'Munfiq'],
    },
    keuangan: {
      title: 'Laporan Keuangan GORUT',
      summary: [
        { label: 'Total Penghimpunan', value: formatRupiah(overview.headline.totalPenghimpunan) },
        { label: 'Transaksi Selesai', value: String(overview.headline.totalTransaksiSelesai) },
        { label: 'Rekap Dana', value: latestRekapDana ? formatRupiah(latestRekapDana.totalAmount) : '-' },
        { label: 'Scope Rekap', value: overview.rekapScope?.scopeLevel ?? 'PLPK' },
      ],
      tableTitle: 'Ringkasan Financial Wilayah',
      rows: overview.perUpzis.map((item) => [item.name, item.kecamatan ?? '-', formatRupiah(item.totalAmount), String(item.transactionCount)]),
      columns: ['UPZIS', 'Kecamatan', 'Total', 'Transaksi'],
    },
    munfiq: {
      title: 'Laporan Data Munfiq GORUT',
      summary: [
        { label: 'Munfiq Berkontribusi', value: String(overview.headline.totalMunfiqBerkontribusi) },
        { label: 'Top UPZIS', value: topUpzis?.name ?? '-' },
        { label: 'Top PLPK', value: topPlpk?.name ?? '-' },
        { label: 'Total Penghimpunan', value: formatRupiah(overview.headline.totalPenghimpunan) },
      ],
      tableTitle: 'Kontributor Wilayah',
      rows: overview.perUpzis.map((item) => [item.name, item.kecamatan ?? '-', String(item.munfiqCount), formatRupiah(item.totalAmount)]),
      columns: ['UPZIS', 'Kecamatan', 'Munfiq', 'Total'],
    },
    transaksi: {
      title: 'Laporan Transaksi GORUT',
      summary: [
        { label: 'Transaksi Selesai', value: String(overview.headline.totalTransaksiSelesai) },
        { label: 'Total Penghimpunan', value: formatRupiah(overview.headline.totalPenghimpunan) },
        { label: 'Top UPZIS', value: topUpzis?.name ?? '-' },
        { label: 'Periode', value: overview.period.label },
      ],
      tableTitle: 'Ringkasan Transaksi Wilayah',
      rows: overview.transactions.map((item) => [item.transactionCode, item.kecamatan, item.ranting, item.plpk, formatRupiah(item.totalAmount), String(item.munfiqCount)]),
      columns: ['Kode', 'Kecamatan', 'Ranting', 'PLPK', 'Total', 'Munfiq'],
    },
  }), [latestRekapDana, overview, topPlpk, topRanting, topUpzis])

  const handleExport = async (reportId: string, format: string) => {
    const config = reportConfig[reportId as keyof typeof reportConfig]
    if (!config) return

    const fileBase = `${reportId}-${selectedMonth}${selectedKecamatan === 'semua' ? '' : `-${selectedKecamatan}`}`.toLowerCase().replace(/\s+/g, '-')

    if (format === 'PDF') {
      exportReportToPdf({
        title: config.title,
        subtitle: `Periode ${selectedMonth}${selectedKecamatan === 'semua' ? '' : ` • ${selectedKecamatan}`}`,
        summary: config.summary,
        tables: [{ title: config.tableTitle, columns: config.columns, rows: config.rows }],
        notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
      })
      return
    }

    exportRowsToSpreadsheet({
      fileName: `${fileBase}.${format === 'CSV' ? 'csv' : 'xlsx'}`,
      rows: [config.columns, ...config.rows],
      format: format === 'CSV' ? 'csv' : 'xlsx',
    })
    toast({ variant: 'default', title: `Export ${format} siap`, description: `${config.title} berhasil diunduh dan bisa dibuka di Excel.` })
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Memuat laporan...</p>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Gagal memuat laporan"
        description={error}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageSectionHeader title={<h1 className="text-2xl font-bold tracking-tight">Laporan &amp; Export</h1>} description="Generate dan unduh laporan dalam berbagai format. Hanya transaksi FINAL_APPROVED yang masuk laporan." />

      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[160px]" aria-label="Pilih bulan laporan">
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026-05">Mei 2026</SelectItem>
                  <SelectItem value="2026-04">April 2026</SelectItem>
                  <SelectItem value="2026-03">Maret 2026</SelectItem>
                  <SelectItem value="2026-02">Februari 2026</SelectItem>
                  <SelectItem value="2026-01">Januari 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <Select value={selectedKecamatan} onValueChange={setSelectedKecamatan}>
                <SelectTrigger className="w-[180px]" aria-label="Pilih kecamatan">
                  <SelectValue placeholder="Pilih Kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kecamatan</SelectItem>
                  {overview.availableKecamatan.map((kecamatan) => (
                    <SelectItem key={kecamatan.id} value={kecamatan.name}>{kecamatan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Penghimpunan" value={formatRupiah(overview.headline.totalPenghimpunan)} icon={Coins} accent="from-emerald-500/15 via-emerald-500/5 to-transparent" iconTone="bg-emerald-500/10 text-emerald-600" />
        <MetricCard title="Transaksi Selesai" value={overview.headline.totalTransaksiSelesai} icon={CheckCircle2} accent="from-blue-500/15 via-blue-500/5 to-transparent" iconTone="bg-blue-500/10 text-blue-600" />
        <MetricCard title="Munfiq Berkontribusi" value={overview.headline.totalMunfiqBerkontribusi} icon={Users} accent="from-violet-500/15 via-violet-500/5 to-transparent" iconTone="bg-violet-500/10 text-violet-600" />
        <MetricCard title="Rekap Dana" value={latestRekapDana ? formatRupiah(latestRekapDana.totalAmount) : '-'} icon={BarChart3} accent="from-amber-500/15 via-amber-500/5 to-transparent" iconTone="bg-amber-500/10 text-amber-600" />
      </div>

      {!hasReportData && (
        <EmptyState icon={Inbox} title="Belum ada data laporan" description="Laporan akan terisi setelah transaksi mencapai status Selesai atau FINAL_APPROVED." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report.id} className="border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <IconBox icon={report.icon} tone={report.tone} />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="mt-1 text-xs">{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {report.formats.map((format) => (
                  <Button
                    key={format}
                    variant="outline"
                    size="sm"
                    className="min-h-9 gap-1.5"
                    aria-label={`Export ${report.title} sebagai ${format}`}
                    onClick={() => handleExport(report.id, format)}
                  >
                    {format === 'Excel' && <FileSpreadsheet className="size-3.5" />}
                    {format === 'PDF' && <FileText className="size-3.5" />}
                    {format === 'CSV' && <FileDown className="size-3.5" />}
                    {format}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <PageSectionHeader title="Export Terakhir" action={<Badge variant="secondary" className="font-normal">{recentExports.length} file</Badge>} />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {recentExports.map((exp) => (
              <div key={exp.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                    exp.format === 'PDF' ? 'bg-red-500/10' :
                    exp.format === 'Excel' ? 'bg-emerald-500/10' :
                    'bg-blue-500/10'
                  )}>
                    {exp.format === 'PDF' && <FileText className="size-5 text-red-600" />}
                    {exp.format === 'Excel' && <FileSpreadsheet className="size-5 text-emerald-600" />}
                    {exp.format === 'CSV' && <FileDown className="size-5 text-blue-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{exp.nama}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(exp.tanggal)} - {exp.ukuran}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="min-h-7 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 gap-1">
                    <CheckCircle2 className="size-3" />
                    Selesai
                  </Badge>
                  <Button variant="ghost" size="icon" className="size-9" aria-label={`Download ${exp.nama}`} onClick={() => exp.format === 'PDF' ? handleExport('bulanan', 'PDF') : toast({ variant: 'default', title: `Download ${exp.format}`, description: 'File historis belum terhubung ke storage aktual.' })}>
                    <Download className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
