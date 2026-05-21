'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  ContentCard,
  DashboardPage,
  DashboardPageHeader,
  StatsGrid,
  StatCard,
} from '@/components/gorut/dashboard-layouts'
import { getAnalyticsOverview } from '@/lib/gorut/analytics'
import { formatRupiah } from '@/lib/gorut/data'
import { filterInsightsByCategory, type InsightCategory } from '@/lib/gorut/insights'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Coins,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const categories: Array<{ id: 'all' | InsightCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'operational', label: 'Operasional' },
  { id: 'finance', label: 'Keuangan' },
  { id: 'performance', label: 'Performa' },
  { id: 'security', label: 'Keamanan' },
  { id: 'system', label: 'Sistem' },
]

export default function AnalyticsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | InsightCategory>('all')
  const overview = useMemo(() => getAnalyticsOverview(), [])

  const insightRows = useMemo(() => {
    const base = category === 'all' ? overview.insights : filterInsightsByCategory(overview.insights, category)
    const keyword = query.trim().toLowerCase()
    return base.filter((item) => {
      if (!keyword) return true
      return [item.title, item.description, item.category, item.value?.toString() ?? ''].join(' ').toLowerCase().includes(keyword)
    })
  }, [overview.insights, category, query])

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="GORUT / Analytics"
        description="Satu layar untuk membaca kesehatan wilayah, performa penghimpunan, dan insight prioritas lintas modul."
        action={<Button asChild className="bg-emerald-600 hover:bg-emerald-700"><Link href="/gorut/performance">Buka Target & Performance</Link></Button>}
      />

      <Card className="overflow-hidden border-0 bg-card shadow-sm">
        <CardContent className="relative p-0">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative grid gap-4 px-6 py-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-600">Cross-module Intelligence</Badge>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Analytics sekarang sudah nyambung ke data wilayah, monitoring, dan insight dashboard.</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Fokusnya bukan sekadar angka besar, tapi area mana yang paling sehat, mana yang mulai turun, dan tindakan apa yang perlu dibuka sekarang.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Top Kecamatan</p><p className="mt-2 text-sm font-semibold">{overview.topKecamatan[0]?.nama ?? '-'}</p><p className="mt-1 text-xs text-muted-foreground">{overview.topKecamatan[0] ? formatRupiah(overview.topKecamatan[0].totalTerkumpul) : '-'}</p></div>
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Risk Wilayah</p><p className="mt-2 text-sm font-semibold">{overview.riskKecamatan[0]?.nama ?? '-'}</p><p className="mt-1 text-xs text-muted-foreground">skor {overview.riskKecamatan[0]?.healthScore ?? 0}</p></div>
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Top PLPK</p><p className="mt-2 text-sm font-semibold">{overview.topPlpk[0]?.nama ?? '-'}</p><p className="mt-1 text-xs text-muted-foreground">skor {overview.topPlpk[0]?.performanceScore ?? 0}</p></div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Total Penghimpunan</p><p className="mt-3 text-2xl font-semibold tracking-tight">{overview.headline.totalCollected}</p><p className="mt-2 text-xs text-muted-foreground">akumulasi semua kanal</p></div>
              <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Health Wilayah</p><p className="mt-3 text-2xl font-semibold tracking-tight">{overview.headline.totalHealth}</p><p className="mt-2 text-xs text-muted-foreground">rata-rata skor kesehatan</p></div>
              <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Pending Operasional</p><p className="mt-3 text-2xl font-semibold tracking-tight">{overview.headline.totalPending}</p><p className="mt-2 text-xs text-muted-foreground">transaksi butuh tindak lanjut</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StatsGrid>
        <StatCard icon={Coins} label="Bulan Ini" value={overview.headline.monthlyCollected} description="Realisasi bulan berjalan" trend={`${overview.headline.growth}%`} trendDirection="up" />
        <StatCard icon={ShieldCheck} label="Health Score" value={overview.headline.totalHealth} description="Rerata kesehatan wilayah" trend="stabil" trendDirection="stable" />
        <StatCard icon={AlertTriangle} label="Pending" value={overview.headline.totalPending} description="Approval dan follow-up lapangan" trend="prioritas" trendDirection="down" />
        <StatCard icon={TrendingUp} label="Growth" value={`${overview.headline.growth}%`} description="Pertumbuhan pendapatan" trend="vs bulan lalu" trendDirection="up" />
      </StatsGrid>

      <ContentCard title="Insight Prioritas" description="Insight otomatis dari approval, performance, finance, security, dan system.">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari insight atau metrik..." className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <Button key={item.id} variant={category === item.id ? 'default' : 'outline'} size="sm" onClick={() => setCategory(item.id)} className={cn(category === item.id && 'bg-emerald-600 hover:bg-emerald-700')}>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {insightRows.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/40 bg-background/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{item.category}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="size-4 text-emerald-600" />
                    <span className="font-medium">{item.value ?? '-'}</span>
                  </div>
                  {item.actionUrl && item.actionLabel && <Button asChild variant="ghost" size="sm" className="gap-1"><Link href={item.actionUrl}>{item.actionLabel}<ArrowRight className="size-3.5" /></Link></Button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ContentCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <ContentCard title="Top Kecamatan" description="Penghimpunan tertinggi saat ini.">
          <div className="space-y-3">
            {overview.topKecamatan.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                <div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-600">{index + 1}</div><div><p className="font-medium">{item.nama}</p><p className="text-xs text-muted-foreground">skor {item.healthScore} • {item.activePlpkCount} PLPK aktif</p></div></div>
                <p className="text-sm font-semibold">{formatRupiah(item.totalTerkumpul)}</p>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Risk Wilayah" description="Area yang paling butuh follow-up.">
          <div className="space-y-3">
            {overview.riskKecamatan.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/40 p-3">
                <div className="flex items-center justify-between"><p className="font-medium">{item.nama}</p><Badge className={cn(item.healthScore < 75 ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600')}>skor {item.healthScore}</Badge></div>
                <p className="mt-2 text-xs text-muted-foreground">{item.pendingTransactions} pending transaksi • aktivasi {item.activationRate}%</p>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Top UPZIS" description="Kontributor kelembagaan terbesar.">
          <div className="space-y-3">
            {overview.topUpzis.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/40 p-3">
                <div className="flex items-center justify-between"><div><p className="font-medium">{item.nama}</p><p className="text-xs text-muted-foreground">{item.kecamatan} • {item.plpkNames.length} PLPK terkait</p></div><Building2 className="size-4 text-emerald-600" /></div>
                <div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">Setoran</span><span className="font-semibold">{formatRupiah(item.totalSetoran)}</span></div>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      <ContentCard title="Tren Bulanan" description="Perbandingan target dan realisasi tanpa pindah ke halaman performance.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {overview.monthlySeries.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/40 bg-background/50 p-4">
              <div className="flex items-center justify-between"><p className="font-semibold">{item.label}</p><Badge variant="secondary">{item.achievement}%</Badge></div>
              <p className="mt-3 text-sm text-muted-foreground">Target</p>
              <p className="text-sm font-medium">{formatRupiah(item.target)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Realisasi</p>
              <p className="text-sm font-medium">{formatRupiah(item.actual)}</p>
              <p className={cn('mt-2 text-xs', item.gap >= 0 ? 'text-emerald-600' : 'text-red-600')}>{item.gap >= 0 ? '+' : ''}{formatRupiah(item.gap)}</p>
            </div>
          ))}
        </div>
      </ContentCard>

      <ContentCard title="Top PLPK" description="Petugas paling kuat berdasarkan skor dan capaian setoran.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {overview.topPlpk.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/40 bg-background/50 p-4">
              <div className="flex items-center justify-between"><p className="font-semibold">{item.nama}</p><Badge className="bg-emerald-500/10 text-emerald-600">{item.performanceScore}</Badge></div>
              <p className="mt-1 text-xs text-muted-foreground">{item.kecamatan} • {item.ranting}</p>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">Munfiq</span><span className="font-medium">{item.jumlahMunfiq}</span></div>
              <div className="mt-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">Setoran</span><span className="font-medium">{formatRupiah(item.totalSetoran)}</span></div>
              <div className="mt-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">Pending</span><span className="font-medium">{item.pendingTransactions}</span></div>
            </div>
          ))}
        </div>
      </ContentCard>
    </DashboardPage>
  )
}
