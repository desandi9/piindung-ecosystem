'use client'

import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Radio, Server, ShieldCheck, Wifi } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getMonitoringSnapshot } from '@/lib/gorut/analytics'

function StatusBadge({ status }: { status: 'online' | 'warning' | 'offline' }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5',
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
      <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/50"><div className={cn('h-full', toneClass)} style={{ width: `${Math.min(100, Math.max(0, width))}%` }} /></div>
    </div>
  )
}

export default function SystemMonitoringPage() {
  const snapshot = getMonitoringSnapshot()
  const icons = [ShieldCheck, Radio, Clock, AlertTriangle, Wifi, Database, Server, Activity]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">System Monitoring</h1>
        <p className="text-sm text-muted-foreground">Pantau kesehatan sistem operasional, approval, backup, dan gateway berdasarkan data dashboard saat ini.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {snapshot.metrics.map((metric, index) => {
          const Icon = icons[index % icons.length]
          return (
            <Card key={metric.label} className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                    <div className="flex items-baseline gap-1.5"><span className="text-2xl font-bold tracking-tight">{metric.value}</span>{metric.unit && <span className="text-xs text-muted-foreground">{metric.unit}</span>}</div>
                  </div>
                  <div className={cn('rounded-lg p-2', metric.status === 'online' && 'bg-emerald-500/10', metric.status === 'warning' && 'bg-amber-500/10', metric.status === 'offline' && 'bg-red-500/10')}><Icon className={cn('size-5', metric.status === 'online' && 'text-emerald-500', metric.status === 'warning' && 'text-amber-500', metric.status === 'offline' && 'text-red-500')} /></div>
                </div>
                <div className="mt-3 border-t border-border/30 pt-3"><StatusBadge status={metric.status} /></div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="size-4 text-emerald-500" />API Health Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <MetricBar label="Response Time" value={`${snapshot.api.responseTime}ms`} width={100 - snapshot.api.responseTime / 2} tone="emerald" />
            <MetricBar label="Uptime" value={`${snapshot.api.uptime}%`} width={snapshot.api.uptime} tone="blue" />
            <MetricBar label="Error Rate" value={`${snapshot.api.errorRate}%`} width={snapshot.api.errorRate * 10} tone="amber" />
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Database className="size-4 text-emerald-500" />Database Health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <MetricBar label="Connection Pool" value={snapshot.database.connectionPool} width={48} tone="blue" />
            <MetricBar label="Query Time" value={`${snapshot.database.queryTime}ms`} width={100 - snapshot.database.queryTime * 2} tone="emerald" />
            <MetricBar label="Replication Lag" value={`${snapshot.database.replicationLag}ms`} width={snapshot.database.replicationLag * 10} tone="amber" />
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Wifi className="size-4 text-emerald-500" />WhatsApp Gateway</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Status</span><StatusBadge status={snapshot.gateway.status} /></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Messages Sent (24h)</span><span className="font-medium text-sm">{snapshot.gateway.messagesSent24h.toLocaleString('id-ID')}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Failed Messages</span><span className="font-medium text-sm text-amber-600">{snapshot.gateway.failedMessages}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Last Sync</span><span className="font-medium text-sm">{snapshot.gateway.lastSyncMinutes} min ago</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Activity className="size-5" />Recent System Activity</CardTitle>
          <CardDescription>Event terakhir dari approval, backup, gateway, dan aktivitas admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {snapshot.recentEvents.map((event) => (
              <div key={event.id} className={cn('rounded-lg border p-3 transition-colors', event.type === 'success' && 'border-emerald-500/20 bg-emerald-500/5', event.type === 'warning' && 'border-amber-500/20 bg-amber-500/5', event.type === 'error' && 'border-red-500/20 bg-red-500/5', event.type === 'info' && 'border-blue-500/20 bg-blue-500/5')}>
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-medium">{event.message}</p>
                  <Badge variant="outline" className="ml-auto text-xs">{event.type}</Badge>
                </div>
                <p className="mb-1.5 text-xs text-muted-foreground">{event.detail}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground/70"><Clock className="size-3" />{event.timestamp}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
