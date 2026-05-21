'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CircleHelp, FileText, MessageSquare, ShieldCheck, Smartphone } from 'lucide-react'

const quickLinks = [
  { title: 'Approval Workflow', href: '/gorut/approval', label: 'Validasi berlapis dan bottleneck approval' },
  { title: 'Analytics', href: '/gorut/analytics', label: 'Insight prioritas lintas wilayah dan operasional' },
  { title: 'WhatsApp Template', href: '/gorut/whatsapp', label: 'Template komunikasi dan test send' },
  { title: 'Mobile Ecosystem', href: '/gorut/mobile', label: 'Session device, audience push, dan QR member' },
]

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bantuan</h1>
        <p className="text-sm text-muted-foreground">Panduan singkat untuk membuka area dashboard yang paling sering dipakai.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CircleHelp className="size-4 text-emerald-600" />Mulai Cepat</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Untuk operasional harian, biasanya alur tercepat adalah cek `analytics`, bersihkan `approval`, lalu monitor `wilayah` dan `transaksi pending`.</p>
            <div className="flex flex-wrap gap-2"><Badge variant="secondary">Analytics</Badge><Badge variant="secondary">Approval</Badge><Badge variant="secondary">Kecamatan</Badge><Badge variant="secondary">Transaksi</Badge></div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-emerald-600" />Panduan Area</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Approval:</strong> validasi transaksi bertingkat.</p>
            <p><strong>Analytics:</strong> ringkasan health wilayah dan prioritas.</p>
            <p><strong>WhatsApp:</strong> template notifikasi dan komunikasi otomatis.</p>
            <p><strong>Mobile:</strong> device session, audience push, dan QR member.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-card shadow-sm">
        <CardHeader><CardTitle className="text-base">Quick Links</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {quickLinks.map((item, index) => (
            <div key={item.href} className="rounded-lg border border-border/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                {index === 0 && <FileText className="size-4 text-emerald-600" />}
                {index === 1 && <ShieldCheck className="size-4 text-emerald-600" />}
                {index === 2 && <MessageSquare className="size-4 text-emerald-600" />}
                {index === 3 && <Smartphone className="size-4 text-emerald-600" />}
                <p className="font-medium">{item.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <div className="mt-3"><Button asChild variant="outline" size="sm"><Link href={item.href}>Buka</Link></Button></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
