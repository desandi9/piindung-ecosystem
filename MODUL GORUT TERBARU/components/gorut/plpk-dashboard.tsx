'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Clock, FileText, ReceiptText, User, Users, WalletCards } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard, EmptyState, ActionCard, LoadingCard } from '@/components/ui/ds-patterns'
import { usePlpkDashboard, type PlpkDashboardTransaction } from '@/lib/gorut/plpk-dashboard-control'
import { getGorutTransactionStateClassName, getGorutTransactionStateLabel } from '@/lib/gorut/workflow-status'

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TransactionRow({ transaction }: { transaction: PlpkDashboardTransaction }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{transaction.transactionCode}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(transaction.transactionDate)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant="outline" className={getGorutTransactionStateClassName(transaction.currentState)}>{getGorutTransactionStateLabel(transaction.currentState)}</Badge>
          <span className="text-sm font-semibold">{formatRupiah(transaction.totalAmount)}</span>
        </div>
      </div>
    </div>
  )
}

export function PlpkDashboard() {
  const { payload, isLoading, error } = usePlpkDashboard()
  const plpkLabel = payload.profile.plpk
    ? `${payload.profile.plpk.code} - ${payload.profile.plpk.ranting.name || payload.profile.plpk.ranting.desaKelurahanName}`
    : 'PLPK belum terhubung'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingCard className="h-28" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <LoadingCard className="h-32" />
          <LoadingCard className="h-32" />
          <LoadingCard className="h-32" />
          <LoadingCard className="h-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <LoadingCard className="h-80 lg:col-span-2" />
          <div className="space-y-4">
            <LoadingCard className="h-28" />
            <LoadingCard className="h-28" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return <Card className="border-destructive/30"><CardContent className="p-6 text-sm text-destructive">{error}</CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/40 bg-card/60 px-5 py-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">PLPK Web Fallback</Badge>
          <Badge variant="outline" className="border-border/60 text-muted-foreground">{plpkLabel}</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Dashboard PLPK</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operasional utama PLPK akan tersedia melalui aplikasi mobile.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Munfiq Binaan"
          value={String(payload.summary.totalMunfiq)}
          description="Scope PLPK Anda"
          icon={Users}
          iconTone="success"
        />
        <MetricCard
          title="Setoran Bulan Ini"
          value={formatRupiah(payload.summary.setoranBulanIni)}
          description="FINAL_APPROVED bulan berjalan"
          icon={WalletCards}
          iconTone="success"
        />
        <MetricCard
          title="Transaksi Pending"
          value={String(payload.summary.transaksiPending)}
          description="Draft/menunggu/dikembalikan"
          icon={Clock}
          iconTone="warning"
        />
        <MetricCard
          title="Transaksi Selesai"
          value={String(payload.summary.transaksiSelesai)}
          description="Sudah final approved"
          icon={ReceiptText}
          iconTone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/40 bg-card/90 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Munfiq Saya</CardTitle>
            <CardDescription>Hanya menampilkan Munfiq yang terhubung ke PLPK Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {payload.munfiq.length === 0 ? (
              <EmptyState
                variant="inline"
                title="Belum ada Munfiq Saya"
                message="Assignment PLPK belum memiliki Munfiq aktif di database GORUT."
              />
            ) : payload.munfiq.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl border border-border/40 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.munfiqCode} • {item.desa ?? '-'} • {item.phone ?? '-'}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">{item.status}</Badge>
                </div>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full justify-between rounded-xl">
              <Link href="/gorut/munfiq">Lihat semua Munfiq Saya <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
            <ActionCard
              title="Tinjau data monitoring"
              description="Lihat ringkasan transaksi, status data, dan insight terbaru."
              icon={BarChart3}
              href="/gorut/monitoring"
              className="h-full"
            />

            <ActionCard
              title="Kelola laporan"
              description="Akses laporan bulanan, rekap, dan arsip dokumen."
              icon={FileText}
              href="/gorut/reports"
            />
        </div>
      </div>

      <Card className="border-border/40 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Riwayat Setoran</CardTitle>
          <CardDescription>Transaksi yang dibuat dalam scope PLPK Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {payload.transactions.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Belum ada riwayat setoran"
              message="Setoran yang dibuat PLPK akan tampil di sini sesuai alur operasional."
              action={
                <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
                  <Link href="/gorut/transaksi">Input Setoran</Link>
                </Button>
              }
            />
          ) : payload.transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}