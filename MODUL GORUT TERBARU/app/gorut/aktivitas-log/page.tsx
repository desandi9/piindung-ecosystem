'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, ArrowRight, Clock, ShieldCheck } from 'lucide-react'
import { activityLogData } from '@/lib/gorut/data'

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AktivitasLogPage() {
  const latest = activityLogData.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aktivitas Log</h1>
        <p className="text-sm text-muted-foreground">Ringkasan aktivitas terbaru yang paling sering dipantau dari menu profil.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 bg-card shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Aktivitas</p><p className="mt-2 text-2xl font-bold">{activityLogData.length}</p></CardContent></Card>
        <Card className="border-0 bg-card shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Aktivitas Export</p><p className="mt-2 text-2xl font-bold">{activityLogData.filter((item) => item.action === 'export').length}</p></CardContent></Card>
        <Card className="border-0 bg-card shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Aksi Validasi</p><p className="mt-2 text-2xl font-bold">{activityLogData.filter((item) => item.action === 'validasi').length}</p></CardContent></Card>
      </div>

      <Card className="border-0 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
          <Button asChild variant="outline" size="sm"><Link href="/gorut/activity">Buka Activity Center<ArrowRight className="ml-2 size-4" /></Link></Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {latest.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10"><Activity className="size-4 text-emerald-600" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.userName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="size-3.5" />{formatDateTime(item.timestamp)}</span><span className="flex items-center gap-1"><ShieldCheck className="size-3.5" />{item.action}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
