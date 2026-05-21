'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import type { KecamatanData } from '@/lib/gorut/types'
import { formatRupiah, monthlyTrendData, targetProgress } from '@/lib/gorut/data'
import { TrendingUp, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface KecamatanChartProps {
  data: KecamatanData[]
}

export function KecamatanChart({ data }: KecamatanChartProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 400)
    return () => clearTimeout(timer)
  }, [])

  const chartData = data.map((item) => ({
    name: item.nama.length > 8 ? item.nama.substring(0, 8) + '...' : item.nama,
    fullName: item.nama,
    kotak: item.jumlahKotak,
    total: item.totalTerkumpul / 1000000,
  }))

  const sortedByCollection = [...data].sort((a, b) => b.totalTerkumpul - a.totalTerkumpul)
  const topKecamatan = sortedByCollection[0]
  const totalCollected = data.reduce((sum, item) => sum + item.totalTerkumpul, 0)
  const avgCollected = Math.round(totalCollected / Math.max(1, data.length))
  const underperforming = data.filter((item) => item.jumlahKotakAktif / Math.max(1, item.jumlahKotak) < 0.85).length

  return (
    <Card 
      className={cn(
        'group border border-border/40 bg-card/90 shadow-sm transition-all duration-500 backdrop-blur-sm hover:border-white/10 hover:shadow-[0_18px_40px_rgba(0,0,0,0.14)]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <CardHeader className="border-b border-border/40 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Distribusi per Kecamatan</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Perbandingan kotak dan pengumpulan</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Kotak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Total (Jt)</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border/50 bg-card p-3 shadow-xl">
                        <p className="mb-2 font-semibold">{payload[0]?.payload?.fullName}</p>
                        <div className="space-y-1.5 text-sm">
                          <p className="flex items-center justify-between gap-6">
                            <span className="text-muted-foreground">Jumlah Kotak:</span>
                            <span className="font-semibold text-emerald-600">{payload[0]?.value}</span>
                          </p>
                          <p className="flex items-center justify-between gap-6">
                            <span className="text-muted-foreground">Total Terkumpul:</span>
                            <span className="font-semibold text-blue-600">
                              {formatRupiah((Number(payload[1]?.value) || 0) * 1000000)}
                            </span>
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="kotak"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
              <Bar
                dataKey="total"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-3 border-t border-border/40 pt-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/40 bg-background/40 p-3 transition-all duration-300 hover:border-emerald-500/20 hover:bg-background/60 hover:shadow-[0_10px_28px_rgba(16,185,129,0.08)]">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Top Wilayah</p>
            <p className="mt-2 text-sm font-semibold">{topKecamatan?.nama ?? '-'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{topKecamatan ? formatRupiah(topKecamatan.totalTerkumpul) : '-'}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 p-3 transition-all duration-300 hover:border-blue-500/20 hover:bg-background/60 hover:shadow-[0_10px_28px_rgba(59,130,246,0.08)]">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Rata-rata Wilayah</p>
            <p className="mt-2 text-sm font-semibold">{formatRupiah(avgCollected)}</p>
            <p className="mt-1 text-xs text-muted-foreground">per kecamatan aktif</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 p-3 transition-all duration-300 hover:border-amber-500/20 hover:bg-background/60 hover:shadow-[0_10px_28px_rgba(245,158,11,0.08)]">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Butuh Follow-up</p>
            <p className="mt-2 text-sm font-semibold">{underperforming} wilayah</p>
            <p className="mt-1 text-xs text-muted-foreground">aktivasi kotak di bawah 85%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Monthly Trend Chart
export function MonthlyTrendChart() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card 
      className={cn(
        'border-0 shadow-sm transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Tren Pengumpulan</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">5 bulan terakhir (juta rupiah)</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="size-3.5" />
            <span>+12.5%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl">
                        <p className="text-sm font-semibold">
                          {formatRupiah(Number(payload[0]?.value) * 1000000)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCollected)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Target Progress Card
export function TargetProgressCard() {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
      // Animate progress bar
      const progressTimer = setTimeout(() => {
        setProgress(targetProgress.percentage)
      }, 300)
      return () => clearTimeout(progressTimer)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card 
      className={cn(
        'border-0 shadow-sm transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Target Bulanan</CardTitle>
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <Target className="size-4 text-emerald-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{progress.toFixed(1)}%</span>
            <span className="text-xs text-muted-foreground">tercapai</span>
          </div>
          <Progress value={progress} className="h-3 bg-emerald-100 dark:bg-emerald-900/30 [&_[data-slot=progress-indicator]]:bg-emerald-500" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Terkumpul</p>
            <p className="font-semibold text-emerald-600">{formatRupiah(targetProgress.current)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Target</p>
            <p className="font-semibold">{formatRupiah(targetProgress.target)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
