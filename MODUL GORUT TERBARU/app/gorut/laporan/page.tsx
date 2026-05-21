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
  Clock,
  CheckCircle2,
  FileDown,
  Printer,
} from 'lucide-react'
import { kecamatanData, formatRupiah } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { getAnalyticsOverview } from '@/lib/gorut/analytics'
import { cn } from '@/lib/utils'

const reportTypes = [
  {
    id: 'bulanan',
    title: 'Laporan Bulanan',
    description: 'Ringkasan transaksi dan statistik per bulan',
    icon: Calendar,
    color: 'bg-emerald-500/10 text-emerald-600',
    formats: ['Excel', 'PDF'],
  },
  {
    id: 'wilayah',
    title: 'Laporan Wilayah',
    description: 'Statistik per kecamatan dan ranting',
    icon: MapPin,
    color: 'bg-blue-500/10 text-blue-600',
    formats: ['Excel', 'PDF', 'CSV'],
  },
  {
    id: 'plpk',
    title: 'Laporan PLPK',
    description: 'Performa dan ranking petugas lapangan',
    icon: Users,
    color: 'bg-violet-500/10 text-violet-600',
    formats: ['Excel', 'PDF'],
  },
  {
    id: 'keuangan',
    title: 'Laporan Keuangan',
    description: 'Arus kas dan rekapitulasi keuangan',
    icon: Coins,
    color: 'bg-amber-500/10 text-amber-600',
    formats: ['Excel', 'PDF'],
  },
  {
    id: 'munfiq',
    title: 'Data Munfiq',
    description: 'Daftar lengkap donatur dan kontribusi',
    icon: Users,
    color: 'bg-pink-500/10 text-pink-600',
    formats: ['Excel', 'CSV'],
  },
  {
    id: 'transaksi',
    title: 'Riwayat Transaksi',
    description: 'Detail seluruh transaksi setoran',
    icon: BarChart3,
    color: 'bg-cyan-500/10 text-cyan-600',
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
  const [selectedMonth, setSelectedMonth] = useState('mei-2026')
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua')
  const overview = useMemo(() => getAnalyticsOverview(), [])

  const reportConfig = useMemo(() => ({
    bulanan: {
      title: 'Laporan Bulanan GORUT',
      summary: [
        { label: 'Bulan Ini', value: overview.headline.monthlyCollected },
        { label: 'Growth', value: `${overview.headline.growth}%` },
        { label: 'Health', value: String(overview.headline.totalHealth) },
        { label: 'Pending', value: String(overview.headline.totalPending) },
      ],
      tableTitle: 'Ringkasan Bulanan per Kecamatan',
      rows: overview.topKecamatan.map((item) => [item.nama, formatRupiah(item.totalTerkumpul), String(item.healthScore), String(item.pendingTransactions)]),
      columns: ['Kecamatan', 'Setoran', 'Health', 'Pending'],
    },
    wilayah: {
      title: 'Laporan Wilayah GORUT',
      summary: [
        { label: 'Top Wilayah', value: overview.topKecamatan[0]?.nama ?? '-' },
        { label: 'Risk Wilayah', value: overview.riskKecamatan[0]?.nama ?? '-' },
        { label: 'Total Health', value: String(overview.headline.totalHealth) },
        { label: 'Pending', value: String(overview.headline.totalPending) },
      ],
      tableTitle: 'Statistik Wilayah',
      rows: [...overview.topKecamatan, ...overview.riskKecamatan.filter((item) => !overview.topKecamatan.some((top) => top.id === item.id))].map((item) => [item.nama, formatRupiah(item.totalTerkumpul), `${item.activationRate}%`, String(item.healthScore), String(item.activePlpkCount)]),
      columns: ['Kecamatan', 'Setoran', 'Aktivasi', 'Health', 'PLPK Aktif'],
    },
    plpk: {
      title: 'Laporan PLPK GORUT',
      summary: [
        { label: 'Top PLPK', value: overview.topPlpk[0]?.nama ?? '-' },
        { label: 'Total PLPK', value: String(overview.topPlpk.length) },
        { label: 'Growth', value: `${overview.headline.growth}%` },
        { label: 'Pending', value: String(overview.headline.totalPending) },
      ],
      tableTitle: 'Performa PLPK',
      rows: overview.topPlpk.map((item) => [item.nama, item.kecamatan, item.ranting, formatRupiah(item.totalSetoran), String(item.performanceScore), String(item.pendingTransactions)]),
      columns: ['PLPK', 'Kecamatan', 'Ranting', 'Setoran', 'Skor', 'Pending'],
    },
    keuangan: {
      title: 'Laporan Keuangan GORUT',
      summary: [
        { label: 'Total Penghimpunan', value: overview.headline.totalCollected },
        { label: 'Bulan Ini', value: overview.headline.monthlyCollected },
        { label: 'Growth', value: `${overview.headline.growth}%` },
        { label: 'Health', value: String(overview.headline.totalHealth) },
      ],
      tableTitle: 'Ringkasan Financial Wilayah',
      rows: overview.topUpzis.map((item) => [item.nama, item.kecamatan, formatRupiah(item.totalSetoran), String(item.penghimpunanScore)]),
      columns: ['UPZIS', 'Kecamatan', 'Setoran', 'Skor'],
    },
    munfiq: {
      title: 'Laporan Data Munfiq GORUT',
      summary: [
        { label: 'Wilayah Top', value: overview.topKecamatan[0]?.nama ?? '-' },
        { label: 'Top PLPK', value: overview.topPlpk[0]?.nama ?? '-' },
        { label: 'Bulan Ini', value: overview.headline.monthlyCollected },
        { label: 'Pending', value: String(overview.headline.totalPending) },
      ],
      tableTitle: 'Kontributor Wilayah',
      rows: overview.topKecamatan.map((item) => [item.nama, String(item.munfiqCount), String(item.activePlpkCount), formatRupiah(item.totalTerkumpul)]),
      columns: ['Kecamatan', 'Munfiq', 'PLPK Aktif', 'Setoran'],
    },
    transaksi: {
      title: 'Laporan Transaksi GORUT',
      summary: [
        { label: 'Bulan Ini', value: overview.headline.monthlyCollected },
        { label: 'Pending', value: String(overview.headline.totalPending) },
        { label: 'Top Wilayah', value: overview.topKecamatan[0]?.nama ?? '-' },
        { label: 'Growth', value: `${overview.headline.growth}%` },
      ],
      tableTitle: 'Ringkasan Transaksi Wilayah',
      rows: overview.topKecamatan.map((item) => [item.nama, formatRupiah(item.totalTerkumpul), String(item.pendingTransactions), String(item.healthScore)]),
      columns: ['Kecamatan', 'Setoran', 'Pending', 'Health'],
    },
  }), [overview])

  const handleExport = (reportId: string, format: string) => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan & Export</h1>
          <p className="text-sm text-muted-foreground">Generate dan unduh laporan dalam berbagai format</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mei-2026">Mei 2026</SelectItem>
                  <SelectItem value="apr-2026">April 2026</SelectItem>
                  <SelectItem value="mar-2026">Maret 2026</SelectItem>
                  <SelectItem value="feb-2026">Februari 2026</SelectItem>
                  <SelectItem value="jan-2026">Januari 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <Select value={selectedKecamatan} onValueChange={setSelectedKecamatan}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih Kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kecamatan</SelectItem>
                  {kecamatanData.map((kec) => (
                    <SelectItem key={kec.id} value={kec.nama}>{kec.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report.id} className="border-0 bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className={cn('flex size-10 items-center justify-center rounded-lg', report.color)}>
                  <report.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Format Options */}
              <div className="flex flex-wrap gap-2">
                {report.formats.map((format) => (
                  <Button
                    key={format}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
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

      {/* Recent Exports */}
      <Card className="border-0 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Export Terakhir</CardTitle>
            <Badge variant="secondary" className="font-normal">{recentExports.length} file</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {recentExports.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex size-10 items-center justify-center rounded-lg',
                    exp.format === 'PDF' ? 'bg-red-500/10' :
                    exp.format === 'Excel' ? 'bg-emerald-500/10' :
                    'bg-blue-500/10'
                  )}>
                    {exp.format === 'PDF' && <FileText className="size-5 text-red-600" />}
                    {exp.format === 'Excel' && <FileSpreadsheet className="size-5 text-emerald-600" />}
                    {exp.format === 'CSV' && <FileDown className="size-5 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{exp.nama}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(exp.tanggal)} - {exp.ukuran}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 gap-1">
                    <CheckCircle2 className="size-3" />
                    Selesai
                  </Badge>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => exp.format === 'PDF' ? handleExport('bulanan', 'PDF') : toast({ variant: 'default', title: `Download ${exp.format}`, description: 'File historis belum terhubung ke storage aktual.' })}>
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
