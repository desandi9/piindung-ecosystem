'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Receipt,
  PiggyBank,
  BarChart3,
  Download,
  FileText,
  MapPin,
} from 'lucide-react'
import { financeStats, monthlyCashflowData, kecamatanData, formatRupiah } from '@/lib/gorut/data'
import { exportReportToPdf } from '@/lib/gorut/export'
import { getAnalyticsOverview } from '@/lib/gorut/analytics'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function KeuanganPage() {
  const overview = useMemo(() => getAnalyticsOverview(), [])
  // Get top 5 kecamatan by total collected
  const topKecamatan = [...kecamatanData]
    .sort((a, b) => b.totalTerkumpul - a.totalTerkumpul)
    .slice(0, 5)

  const handleExportPdf = () => {
    exportReportToPdf({
      title: 'Laporan Keuangan GORUT',
      subtitle: 'Dashboard keuangan, cashflow, dan kontribusi wilayah',
      summary: [
        { label: 'Total Pendapatan', value: formatRupiah(financeStats.totalPendapatan) },
        { label: 'Saldo Sekarang', value: formatRupiah(financeStats.saldoSekarang) },
        { label: 'Pendapatan Bulan Ini', value: formatRupiah(financeStats.pendapatanBulanIni) },
        { label: 'Growth', value: `${financeStats.pertumbuhanPendapatan}%` },
      ],
      tables: [
        {
          title: 'Cashflow Bulanan',
          columns: ['Bulan', 'Pemasukan', 'Pengeluaran'],
          rows: monthlyCashflowData.map((item) => [item.bulan, formatRupiah(item.masuk), formatRupiah(item.keluar)]),
        },
        {
          title: 'Top Kontribusi Wilayah',
          columns: ['Kecamatan', 'Total Terkumpul', 'Health', 'Pending'],
          rows: overview.topKecamatan.map((item) => [item.nama, formatRupiah(item.totalTerkumpul), String(item.healthScore), String(item.pendingTransactions)]),
        },
      ],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Keuangan</h1>
          <p className="text-sm text-muted-foreground">Pantau arus keuangan dan statistik kontribusi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPdf}>
            <Download className="size-4" />
            Export Laporan
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Pendapatan */}
        <Card className="border-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 text-white shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm opacity-90">Total Pendapatan</p>
                <p className="text-3xl font-bold tracking-tight">{formatRupiah(financeStats.totalPendapatan)}</p>
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUpRight className="size-3" />
                  <span>+{financeStats.pertumbuhanPendapatan}% dari bulan lalu</span>
                </div>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                <Coins className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Sekarang */}
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Saldo Sekarang</p>
                <p className="text-2xl font-bold tracking-tight">{formatRupiah(financeStats.saldoSekarang)}</p>
                <p className="text-xs text-muted-foreground">Tersedia untuk distribusi</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Wallet className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pendapatan Bulan Ini */}
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pendapatan Bulan Ini</p>
                <p className="text-2xl font-bold tracking-tight">{formatRupiah(financeStats.pendapatanBulanIni)}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="size-3" />
                  <span>+{financeStats.pertumbuhanPendapatan}%</span>
                </div>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <PiggyBank className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rata-rata Transaksi */}
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Rata-rata Transaksi</p>
                <p className="text-2xl font-bold tracking-tight">{formatRupiah(financeStats.rataRataTransaksi)}</p>
                <p className="text-xs text-muted-foreground">{financeStats.totalTransaksi.toLocaleString('id-ID')} total transaksi</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10">
                <Receipt className="size-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cashflow Chart */}
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Arus Kas Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCashflowData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="bulan" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="masuk" 
                    name="Pemasukan" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="keluar" 
                    name="Pengeluaran" 
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Kecamatan */}
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Kontribusi Wilayah</CardTitle>
              <Badge variant="secondary" className="font-normal">5 Teratas</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topKecamatan.map((kec, index) => {
                const maxCollected = topKecamatan[0].totalTerkumpul
                const percentage = (kec.totalTerkumpul / maxCollected) * 100
                return (
                  <div key={kec.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                          index === 0 ? 'bg-emerald-500/10 text-emerald-600' :
                          index === 1 ? 'bg-blue-500/10 text-blue-600' :
                          index === 2 ? 'bg-amber-500/10 text-amber-600' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{kec.nama}</span>
                      </div>
                      <span className="font-semibold">{formatRupiah(kec.totalTerkumpul)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          index === 0 ? 'bg-emerald-500' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-amber-500' :
                          'bg-gray-400'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="border-0 bg-card shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Tren Pendapatan</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="size-4 text-emerald-500" />
              <span>Naik {financeStats.pertumbuhanPendapatan}% bulan ini</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyCashflowData}>
                <defs>
                  <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="bulan" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                />
                <Tooltip 
                  formatter={(value: number) => formatRupiah(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="masuk" 
                  name="Pendapatan"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorMasuk)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
