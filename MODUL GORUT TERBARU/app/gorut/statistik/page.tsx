'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ContentCard,
  DashboardPage,
  DashboardPageHeader,
  StatCard,
  StatsGrid,
} from '@/components/gorut/dashboard-layouts'
import { EnhancedTable, TablePagination } from '@/components/gorut/enhanced-table'
import { Progress } from '@/components/ui/progress'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { getAnalyticsOverview } from '@/lib/gorut/analytics'
import { formatRupiah } from '@/lib/gorut/data'
import {
  AlertTriangle,
  Coins,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  MapPin,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react'

export default function StatistikPage() {
  const overview = useMemo(() => getAnalyticsOverview(), [])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return overview.topKecamatan
      .concat(overview.riskKecamatan.filter((item) => !overview.topKecamatan.some((top) => top.id === item.id)))
      .filter((item) => !query || [item.nama, item.healthScore.toString(), item.pendingTransactions.toString()].join(' ').toLowerCase().includes(query))
      .map((item) => ({
        ...item,
        target: Math.round(item.totalTerkumpul * 1.18),
        progress: Math.round((item.totalTerkumpul / Math.max(1, Math.round(item.totalTerkumpul * 1.18))) * 100),
      }))
  }, [overview, search])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const pageRows = useMemo(() => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [rows, currentPage])

  const exportPdf = () => {
    exportReportToPdf({
      title: 'Laporan Statistik GORUT',
      subtitle: 'Ringkasan wilayah, performa, dan risiko operasional',
      summary: [
        { label: 'Total Penghimpunan', value: overview.headline.totalCollected },
        { label: 'Bulan Ini', value: overview.headline.monthlyCollected },
        { label: 'Health Score', value: String(overview.headline.totalHealth) },
        { label: 'Pending', value: String(overview.headline.totalPending) },
      ],
      tables: [
        {
          title: 'Statistik Kecamatan',
          columns: ['Kecamatan', 'Setoran', 'Target', 'Progress', 'Health', 'Pending', 'PLPK Aktif'],
          rows: rows.map((item) => [
            item.nama,
            formatRupiah(item.totalTerkumpul),
            formatRupiah(item.target),
            `${item.progress}%`,
            String(item.healthScore),
            String(item.pendingTransactions),
            String(item.activePlpkCount),
          ]),
        },
      ],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.', 'Data statistik sinkron dengan analytics dan helper wilayah.'],
    })
  }

  const exportExcel = () => {
    exportRowsToSpreadsheet({
      fileName: 'statistik-gorut.xlsx',
      rows: [
        ['Kecamatan', 'Setoran', 'Target', 'Progress', 'Health', 'Pending', 'PLPK Aktif'],
        ...rows.map((item) => [item.nama, formatRupiah(item.totalTerkumpul), formatRupiah(item.target), `${item.progress}%`, String(item.healthScore), String(item.pendingTransactions), String(item.activePlpkCount)]),
      ],
      format: 'xlsx',
    })
  }

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="GORUT / Statistik"
        description="Operasional insight, monitoring wilayah, performa PLPK, dan penghimpunan dari satu sumber data yang sama."
        action={<div className="flex gap-2"><Button variant="default" size="sm" onClick={exportPdf}><FileText className="mr-2 size-4" />Export PDF</Button><Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="mr-2 size-4" />Export Excel</Button></div>}
        className="mb-4"
      />

      <StatsGrid>
        <StatCard icon={Users} label="Insight Aktif" value={overview.insights.length} description="Insight lintas modul" trend="live" trendDirection="stable" />
        <StatCard icon={Coins} label="Total Setoran" value={overview.headline.monthlyCollected} description="Realisasi bulan berjalan" trend="up" trendDirection="up" />
        <StatCard icon={MapPin} label="Wilayah Risiko" value={overview.riskKecamatan.length} description="Perlu follow-up cepat" trend="alert" trendDirection="down" />
        <StatCard icon={Gauge} label="Health Score" value={overview.headline.totalHealth} description="Rata-rata kesehatan wilayah" trend="monitor" trendDirection="stable" />
      </StatsGrid>

      <ContentCard title="Filter Statistik" description="Cari kecamatan untuk membaca progres, risiko, dan kontribusi secara cepat.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} placeholder="Cari kecamatan atau metrik..." className="pl-9" /></div>
          <div className="text-xs text-muted-foreground">Halaman ini sudah sinkron dengan `analytics`, `monitoring`, dan `wilayah`.</div>
        </div>
      </ContentCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <ContentCard title="Top Kecamatan" description="Kontributor penghimpunan tertinggi.">
          <div className="space-y-3">
            {overview.topKecamatan.map((item, index) => <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/40 p-3"><div><p className="font-medium">#{index + 1} {item.nama}</p><p className="text-xs text-muted-foreground">skor {item.healthScore}</p></div><p className="text-sm font-semibold">{formatRupiah(item.totalTerkumpul)}</p></div>)}
          </div>
        </ContentCard>
        <ContentCard title="Risk Wilayah" description="Health rendah atau pending tinggi.">
          <div className="space-y-3">
            {overview.riskKecamatan.map((item) => <div key={item.id} className="rounded-xl border border-border/40 p-3"><div className="flex items-center justify-between"><p className="font-medium">{item.nama}</p><Badge className="bg-red-500/10 text-red-600">{item.healthScore}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{item.pendingTransactions} pending • {item.activationRate}% aktivasi</p></div>)}
          </div>
        </ContentCard>
        <ContentCard title="Top PLPK" description="Petugas dengan skor terbaik.">
          <div className="space-y-3">
            {overview.topPlpk.map((item) => <div key={item.id} className="rounded-xl border border-border/40 p-3"><div className="flex items-center justify-between"><p className="font-medium">{item.nama}</p><Badge className="bg-emerald-500/10 text-emerald-600">{item.performanceScore}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{item.kecamatan} • pending {item.pendingTransactions}</p></div>)}
          </div>
        </ContentCard>
      </div>

      <ContentCard title="Penghimpunan & Performa Wilayah" description="Tabel ringkas target, realisasi, progress, dan skor penghimpunan.">
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            <EnhancedTable
              columns={[
                { id: 'kecamatan', label: 'Kecamatan', sortable: false },
                { id: 'setoran', label: 'Total Setoran', sortable: false },
                { id: 'target', label: 'Target', sortable: false },
                { id: 'progress', label: 'Progress', sortable: false },
                { id: 'health', label: 'Health', sortable: false },
                { id: 'pending', label: 'Pending', sortable: false },
                { id: 'aksi', label: 'Aksi', sortable: false },
              ]}
              rows={pageRows.map((item) => ({
                id: item.id,
                kecamatan: <span className="font-medium">{item.nama}</span>,
                setoran: formatRupiah(item.totalTerkumpul),
                target: formatRupiah(item.target),
                progress: <div className="min-w-[140px] space-y-1"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{item.progress}%</span><span className="font-semibold">{item.activePlpkCount} PLPK</span></div><Progress value={item.progress} /></div>,
                health: <Badge className={item.healthScore >= 85 ? 'bg-emerald-500/10 text-emerald-600' : item.healthScore >= 75 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}>{item.healthScore}</Badge>,
                pending: item.pendingTransactions,
                aksi: <Button asChild size="sm" variant="outline"><Link href="/gorut/analytics">Lihat</Link></Button>,
              }))}
              selectable={false}
              emptyMessage={search ? 'Tidak ada data untuk pencarian ini.' : 'Belum ada data statistik.'}
            />
            <div className="mt-4"><TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={rows.length} /></div>
          </CardContent>
        </Card>
      </ContentCard>

      <ContentCard title="Operational Notes" description="Catatan cepat untuk membaca angka statistik dengan benar.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-card p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-emerald-400" /><div><p className="text-sm font-medium">Wilayah sehat</p><p className="text-xs text-muted-foreground">Skor health tinggi biasanya ditopang oleh aktivasi kotak stabil, pending rendah, dan PLPK aktif.</p></div></div></div>
          <div className="rounded-lg border border-border/50 bg-card p-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 text-amber-400" /><div><p className="text-sm font-medium">Wilayah prioritas</p><p className="text-xs text-muted-foreground">Fokuskan follow-up ke kecamatan dengan health rendah atau pending transaksi tertinggi.</p></div></div></div>
        </div>
      </ContentCard>
    </DashboardPage>
  )
}
