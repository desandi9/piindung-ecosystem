'use client'

import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Loader2, Radio, Server, ShieldCheck, Wifi } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, MetricCard, PageSectionHeader } from '@/components/ui/ds-patterns'
import { cn } from '@/lib/utils'
import { useGorutMonitoringSnapshot, type MonitoringProgressItem } from '@/lib/gorut/monitoring-control'
import { getGorutTransactionStateClassName, getGorutTransactionStateLabel } from '@/lib/gorut/workflow-status'

function StatusBadge({ status }: { status: 'online' | 'warning' | 'offline' }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'min-h-7 gap-1.5 px-2.5',
        status === 'online' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
        status === 'warning' && 'border-amber-500/30 bg-amber-500/10 text-amber-600',
        status === 'offline' && 'border-red-500/30 bg-red-500/10 text-red-600',
      )}
    >
      <span className={cn('size-1.5 rounded-full', status === 'online' && 'bg-emerald-500', status === 'warning' && 'bg-amber-500', status === 'offline' && 'bg-red-500')} />
      {status === 'online' ? 'Online' : status === 'warning' ? 'Warning' : 'Offline'}
    </Badge>
  )
}

function MetricBar({ label, value, width, tone = 'emerald' }: { label: string; value: string; width: number; tone?: 'emerald' | 'amber' | 'blue' }) {
  const toneClass = tone === 'amber' ? 'bg-amber-500' : tone === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/50"><div className={cn('h-full rounded-full transition-all duration-500', toneClass)} style={{ width: `${Math.min(100, Math.max(0, width))}%` }} /></div>
    </div>
  )
}

function formatRupiah(amount: number | string | null | undefined) {
  const num = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num ?? 0)
}

function formatTime(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function ProgressList({ title, items }: { title: string; items: MonitoringProgressItem[] | null }) {
  const safeItems = items ?? []
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {safeItems.length === 0 ? <EmptyState inline icon={Activity} title="Belum ada data progress" description="Data akan tampil setelah transaksi GORUT masuk database normalized." /> : safeItems.slice(0, 5).map((item) => (
          <div key={item.id} className="rounded-2xl border border-border/60 bg-background/40 p-4 transition-colors hover:bg-muted/30">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.kecamatan}{item.ranting ? ` • ${item.ranting}` : ''}</p>
              </div>
              <Badge variant="outline" className="min-h-7 shrink-0 text-xs">{item.progress ?? 0}%</Badge>
            </div>
            <MetricBar label={`${item.finalApprovedCount ?? 0} selesai • ${item.pendingCount ?? 0} pending`} value={formatRupiah(item.finalApprovedAmount)} width={item.progress ?? 0} tone={(item.pendingCount ?? 0) > 0 ? 'amber' : 'emerald'} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function SystemMonitoringPage() {
  const { snapshot, loading, error } = useGorutMonitoringSnapshot()
  const icons = [ShieldCheck, Radio, Clock, AlertTriangle, Wifi, Database, Server, Activity]

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Memuat data monitoring...</p>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Gagal memuat monitoring"
        description={error}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageSectionHeader title={<h1 className="text-2xl font-bold tracking-tight">System Monitoring</h1>} description="Pantau kesehatan sistem operasional, approval, backup, dan gateway. Data diambil dari database GORUT." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(snapshot.metrics ?? []).map((metric, index) => {
          const Icon = icons[index % icons.length]
          const value = `${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`
          const accent = metric.status === 'online' ? 'from-emerald-500/15 via-emerald-500/5 to-transparent' : metric.status === 'warning' ? 'from-amber-500/15 via-amber-500/5 to-transparent' : 'from-red-500/15 via-red-500/5 to-transparent'
          const iconTone = metric.status === 'online' ? 'bg-emerald-500/10 text-emerald-600' : metric.status === 'warning' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
          return <MetricCard key={metric.label} title={metric.label} value={value} icon={Icon} description={metric.status === 'online' ? 'Status online' : metric.status === 'warning' ? 'Perlu perhatian' : 'Status offline'} accent={accent} iconTone={iconTone} />
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {snapshot.api ? <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="size-4 text-emerald-500" />API Health Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <MetricBar label="Response Time" value={`${snapshot.api.responseTime}ms`} width={100 - snapshot.api.responseTime / 2} tone="emerald" />
            <MetricBar label="Uptime" value={`${snapshot.api.uptime}%`} width={snapshot.api.uptime} tone="blue" />
            <MetricBar label="Error Rate" value={`${snapshot.api.errorRate}%`} width={snapshot.api.errorRate * 10} tone="amber" />
          </CardContent>
        </Card> : <EmptyState inline icon={Server} title="API Health Status" description="Monitoring infrastruktur tidak tersedia." />}

        {snapshot.database ? <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Database className="size-4 text-emerald-500" />Database Health</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <MetricBar label="Connection Pool" value={snapshot.database.connectionPool} width={48} tone="blue" />
            <MetricBar label="Query Time" value={`${snapshot.database.queryTime}ms`} width={100 - snapshot.database.queryTime * 2} tone="emerald" />
            <MetricBar label="Replication Lag" value={`${snapshot.database.replicationLag}ms`} width={snapshot.database.replicationLag * 10} tone="amber" />
          </CardContent>
        </Card> : <EmptyState inline icon={Database} title="Database Health" description="Monitoring infrastruktur tidak tersedia." />}

        {snapshot.gateway ? <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Wifi className="size-4 text-emerald-500" />WhatsApp Gateway</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Status</span><StatusBadge status={snapshot.gateway.status} /></div>
            <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Messages Sent (24h)</span><span className="text-sm font-medium">{snapshot.gateway.messagesSent24h.toLocaleString('id-ID')}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Failed Messages</span><span className="text-sm font-medium text-amber-600">{snapshot.gateway.failedMessages}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Last Sync</span><span className="text-sm font-medium">{snapshot.gateway.lastSyncMinutes} min ago</span></div>
          </CardContent>
        </Card> : <EmptyState inline icon={Wifi} title="WhatsApp Gateway" description="Monitoring infrastruktur tidak tersedia." />}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Final Approved Totals</CardTitle><CardDescription>Hanya dari transaksi FINAL_APPROVED.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <MetricBar label="Total Penghimpunan" value={formatRupiah(snapshot.finalApprovedTotals.totalAmount)} width={100} tone="emerald" />
            <MetricBar label="Bulan Ini" value={formatRupiah(snapshot.finalApprovedTotals.currentMonthAmount)} width={Number(snapshot.finalApprovedTotals.totalAmount) ? (Number(snapshot.finalApprovedTotals.currentMonthAmount) / Number(snapshot.finalApprovedTotals.totalAmount)) * 100 : 0} tone="blue" />
            <div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Transaksi Selesai</span><span className="font-medium">{snapshot.finalApprovedTotals.transactionCount}</span></div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Pending by Stage</CardTitle><CardDescription>Berdasarkan currentState transaksi.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {snapshot.pendingByStage.length === 0 ? <EmptyState inline icon={CheckCircle2} title="Tidak ada transaksi pending" description="Setoran yang menunggu verifikasi akan muncul di sini." /> : snapshot.pendingByStage.map((item) => (
              <MetricBar key={item.state} label={item.label} value={`${item.count} transaksi`} width={item.count * 20} tone={item.count > 0 ? 'amber' : 'emerald'} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Status Distribution</CardTitle><CardDescription>Distribusi currentState normalized.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {snapshot.statusDistribution.length === 0 ? <EmptyState inline icon={Database} title="Belum ada transaksi" description="Distribusi status akan tampil setelah ada setoran." /> : snapshot.statusDistribution.map((item) => (
              <MetricBar key={item.state} label={getGorutTransactionStateLabel(item.state)} value={`${item.count} • ${formatRupiah(item.amount)}`} width={item.count * 12} tone={item.state === 'FINAL_APPROVED' ? 'emerald' : item.state.includes('WAITING') ? 'amber' : 'blue'} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ProgressList title="PLPK Performance" items={snapshot.plpkPerformance} />
        <ProgressList title="UPZIS Progress" items={snapshot.upzisProgress} />
        <ProgressList title="Ranting Progress" items={snapshot.rantingProgress} />
      </div>

      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="size-5 text-amber-500" />Returned / Rejected Transactions</CardTitle>
          <CardDescription>Transaksi yang sedang dikembalikan atau ditolak dalam scope role saat ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {snapshot.returnedRejectedTransactions.length === 0 ? <EmptyState inline icon={CheckCircle2} title="Tidak ada transaksi dikembalikan atau ditolak" description="Monitoring revisi akan muncul jika ada return/reject." /> : snapshot.returnedRejectedTransactions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="truncate text-sm font-medium">{item.transactionCode}</p>
                  <Badge variant="outline" className={cn('min-h-7 shrink-0 text-xs', getGorutTransactionStateClassName(item.currentState))}>{getGorutTransactionStateLabel(item.currentState)}</Badge>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{item.kecamatan} • {item.ranting} • {item.plpk} • {formatRupiah(item.totalAmount)}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground/70"><Clock className="size-3" />{formatTime(item.transactionDate)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Activity className="size-5" />Recent System Activity</CardTitle>
          <CardDescription>Event terakhir dari approval, backup, gateway, dan aktivitas admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(snapshot.recentEvents ?? []).length === 0 ? <EmptyState inline icon={Activity} title="Belum ada aktivitas sistem" description="Event monitoring terbaru akan muncul di sini." /> : (snapshot.recentEvents ?? []).map((event) => (
              <div key={event.id} className={cn('rounded-2xl border p-4 transition-colors', event.type === 'success' && 'border-emerald-500/20 bg-emerald-500/5', event.type === 'warning' && 'border-amber-500/20 bg-amber-500/5', event.type === 'error' && 'border-red-500/20 bg-red-500/5', event.type === 'info' && 'border-blue-500/20 bg-blue-500/5')}>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium">{event.message}</p>
                  <Badge variant="outline" className="min-h-7 shrink-0 text-xs capitalize">{event.type}</Badge>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{event.detail}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground/70"><Clock className="size-3" />{formatTime(event.timestamp)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
