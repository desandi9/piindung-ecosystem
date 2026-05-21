'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  Coins,
  Download,
  Gauge,
  MapPin,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { monthlyProgressData, formatRupiah } from '@/lib/gorut/data'
import { getWilayahOverview } from '@/lib/gorut/wilayah'
import { exportReportToPdf } from '@/lib/gorut/export'
import { cn } from '@/lib/utils'

type HealthStatus = 'strong' | 'watch' | 'risk'

function getStatusLabel(status: HealthStatus) {
  if (status === 'strong') return 'Strong'
  if (status === 'watch') return 'Watch'
  return 'Risk'
}

function getStatusClass(status: HealthStatus) {
  if (status === 'strong') return 'bg-emerald-500/10 text-emerald-600'
  if (status === 'watch') return 'bg-amber-500/10 text-amber-600'
  return 'bg-red-500/10 text-red-600'
}

export default function PerformancePage() {
  const wilayah = useMemo(() => getWilayahOverview(), [])
  const months = monthlyProgressData.map((item) => item.bulan)
  const latestMonth = months[months.length - 1] ?? 'Mei'
  const [selectedMonth, setSelectedMonth] = useState(latestMonth)
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua')

  const monthlyTarget = monthlyProgressData.find((item) => item.bulan === selectedMonth) ?? monthlyProgressData[monthlyProgressData.length - 1]

  const kecamatanRows = useMemo(() => {
    const base = selectedKecamatan === 'semua'
      ? wilayah.kecamatan
      : wilayah.kecamatan.filter((item) => item.nama === selectedKecamatan)

    return [...base]
      .sort((a, b) => b.healthScore - a.healthScore || b.totalTerkumpul - a.totalTerkumpul)
      .map((item, index) => {
        const target = Math.round(item.totalTerkumpul * 1.18)
        const achievement = Math.round((item.totalTerkumpul / Math.max(1, target)) * 100)
        const status: HealthStatus = item.healthScore >= 88 ? 'strong' : item.healthScore >= 75 ? 'watch' : 'risk'
        return { ...item, ranking: index + 1, target, achievement, status }
      })
  }, [wilayah.kecamatan, selectedKecamatan])

  const plpkRows = useMemo(() => {
    const base = selectedKecamatan === 'semua'
      ? wilayah.plpk
      : wilayah.plpk.filter((item) => item.kecamatan === selectedKecamatan)

    return [...base]
      .sort((a, b) => b.performanceScore - a.performanceScore || b.totalSetoran - a.totalSetoran)
      .map((item, index) => ({
        ...item,
        ranking: index + 1,
        achievement: Math.round((item.totalSetoran / Math.max(1, item.targetSetoran)) * 100),
      }))
  }, [wilayah.plpk, selectedKecamatan])

  const summary = useMemo(() => {
    const totalActual = kecamatanRows.reduce((sum, item) => sum + item.totalTerkumpul, 0)
    const totalTarget = kecamatanRows.reduce((sum, item) => sum + item.target, 0)
    const avgHealth = Math.round(kecamatanRows.reduce((sum, item) => sum + item.healthScore, 0) / Math.max(1, kecamatanRows.length))
    const avgPlpkScore = Math.round(plpkRows.reduce((sum, item) => sum + item.performanceScore, 0) / Math.max(1, plpkRows.length))
    return {
      totalActual,
      totalTarget,
      achievement: Math.round((totalActual / Math.max(1, totalTarget)) * 100),
      avgHealth,
      avgPlpkScore,
      totalPending: kecamatanRows.reduce((sum, item) => sum + item.pendingTransactions, 0),
    }
  }, [kecamatanRows, plpkRows])

  const exportPdf = () => {
    exportReportToPdf({
      title: 'Laporan Target & Performance GORUT',
      subtitle: `Periode ${selectedMonth}${selectedKecamatan === 'semua' ? '' : ` • ${selectedKecamatan}`}`,
      summary: [
        { label: 'Realisasi', value: formatRupiah(summary.totalActual) },
        { label: 'Target', value: formatRupiah(summary.totalTarget) },
        { label: 'Pencapaian', value: `${summary.achievement}%` },
        { label: 'Avg Health', value: `${summary.avgHealth}` },
      ],
      tables: [
        {
          title: 'Performa Kecamatan',
          columns: ['Ranking', 'Kecamatan', 'Realisasi', 'Target', 'Pencapaian', 'Health', 'Pending'],
          rows: kecamatanRows.map((item) => [
            String(item.ranking),
            item.nama,
            formatRupiah(item.totalTerkumpul),
            formatRupiah(item.target),
            `${item.achievement}%`,
            String(item.healthScore),
            String(item.pendingTransactions),
          ]),
        },
        {
          title: 'Performa PLPK',
          columns: ['Ranking', 'PLPK', 'Kecamatan', 'Setoran', 'Target', 'Skor', 'Pending'],
          rows: plpkRows.map((item) => [
            String(item.ranking),
            item.nama,
            item.kecamatan,
            formatRupiah(item.totalSetoran),
            formatRupiah(item.targetSetoran),
            String(item.performanceScore),
            String(item.pendingTransactions),
          ]),
        },
      ],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.', 'Data bersumber dari agregasi wilayah, PLPK, dan transaksi dashboard.'],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Target & Performance</h1>
          <p className="text-sm text-muted-foreground">Pantau target, health wilayah, dan performa PLPK dari data yang sama dengan analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportPdf} className="gap-2"><Download className="size-4" />Export PDF</Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Link href="/gorut/analytics">Buka Analytics</Link></Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Bulan</p>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((month) => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Kecamatan</p>
          <Select value={selectedKecamatan} onValueChange={setSelectedKecamatan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kecamatan</SelectItem>
              {wilayah.kecamatan.map((item) => <SelectItem key={item.id} value={item.nama}>{item.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Target Bulanan</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatRupiah(monthlyTarget.target)}</p><p className="mt-2 text-xs text-muted-foreground">{selectedMonth}</p></CardContent></Card>
        <Card className="border-border/40"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Realisasi Wilayah</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatRupiah(summary.totalActual)}</p><p className="mt-2 text-xs text-emerald-600">{summary.achievement}% dari target internal</p></CardContent></Card>
        <Card className="border-border/40 bg-card/50"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Avg Health Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.avgHealth}</p><p className="mt-2 text-xs text-muted-foreground">Rerata kesehatan kecamatan</p></CardContent></Card>
        <Card className="border-border/40"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Avg PLPK Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.avgPlpkScore}</p><p className="mt-2 text-xs text-muted-foreground">Rerata performa petugas</p></CardContent></Card>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="size-5" />Target vs Realisasi Bulanan</CardTitle>
          <CardDescription>Ringkasan progres bulanan untuk konteks target makro.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {monthlyProgressData.map((item) => {
              const achievement = Math.round((item.actual / item.target) * 100)
              return (
                <div key={item.bulan} className="rounded-xl border border-border/40 bg-background/50 p-4">
                  <div className="flex items-center justify-between"><p className="font-semibold">{item.bulan}</p><Badge variant="secondary">{achievement}%</Badge></div>
                  <p className="mt-3 text-xs text-muted-foreground">Target</p>
                  <p className="text-sm font-medium">{formatRupiah(item.target)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Realisasi</p>
                  <p className="text-sm font-medium">{formatRupiah(item.actual)}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Performa Kecamatan</CardTitle>
          <CardDescription>Ranking wilayah berdasarkan health score dan capaian penghimpunan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {kecamatanRows.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/30 bg-background/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">#{item.ranking}</span><h3 className="font-medium">{item.nama}</h3></div>
                    <p className="text-sm text-muted-foreground">{formatRupiah(item.totalTerkumpul)} / {formatRupiah(item.target)}</p>
                  </div>
                  <Badge className={cn(getStatusClass(item.status))}>{getStatusLabel(item.status)}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-border/40 p-3"><p className="text-xs text-muted-foreground">Pencapaian</p><p className="mt-1 font-semibold">{item.achievement}%</p></div>
                  <div className="rounded-lg border border-border/40 p-3"><p className="text-xs text-muted-foreground">Health Score</p><p className="mt-1 font-semibold">{item.healthScore}</p></div>
                  <div className="rounded-lg border border-border/40 p-3"><p className="text-xs text-muted-foreground">PLPK Aktif</p><p className="mt-1 font-semibold">{item.activePlpkCount}</p></div>
                  <div className="rounded-lg border border-border/40 p-3"><p className="text-xs text-muted-foreground">Pending</p><p className="mt-1 font-semibold">{item.pendingTransactions}</p></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Performa PLPK</CardTitle>
          <CardDescription>Petugas lapangan disortir berdasarkan skor performa dan realisasi setoran.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plpkRows.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/30 bg-background/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">#{item.ranking}</span><h3 className="font-medium">{item.nama}</h3></div>
                    <p className="text-sm text-muted-foreground">{item.kecamatan} • {item.ranting}</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600">skor {item.performanceScore}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-border/40 p-3"><p className="text-xs text-muted-foreground">Setoran</p><p className="mt-1 font-semibold">{formatRupiah(item.totalSetoran)}</p></div>
                  <div className="rounded-lg border border-border/40 p-3"><p className="text-xs text-muted-foreground">Target</p><p className="mt-1 font-semibold">{formatRupiah(item.targetSetoran)}</p></div>
                  <div className="rounded-lg border border-border/40 p-3"><p className="text-xs text-muted-foreground">Munfiq</p><p className="mt-1 font-semibold">{item.jumlahMunfiq}</p></div>
                  <div className="rounded-lg border border-border/40 p-3"><p className="text-xs text-muted-foreground">Pending</p><p className="mt-1 font-semibold">{item.pendingTransactions}</p></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
