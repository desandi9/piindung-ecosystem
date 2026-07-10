'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Clock,
  FileText,
  PlusCircle,
  ReceiptText,
  User,
  Users,
  WalletCards,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MetricCard,
  EmptyState,
  ActionCard,
  LoadingCard,
  PageSectionHeader,
  IconBox,
} from '@/components/ui/ds-patterns'
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
    <div className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/30">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{transaction.transactionCode}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(transaction.transactionDate)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Badge variant="outline" className={getGorutTransactionStateClassName(transaction.currentState)}>
            {getGorutTransactionStateLabel(transaction.currentState)}
          </Badge>
          <span className="text-sm font-semibold tabular-nums">{formatRupiah(transaction.totalAmount)}</span>
        </div>
      </div>
    </div>
  )
}

export function PlpkDashboard() {
  const { payload, isLoading, error } = usePlpkDashboard()
  const plpkLabel = payload.profile.plpk
    ? `${payload.profile.plpk.code} · ${payload.profile.plpk.ranting.name || payload.profile.plpk.ranting.desaKelurahanName}`
    : 'PLPK belum terhubung'

  if (isLoading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Memuat dashboard PLPK">
        <LoadingCard className="h-24" />
        <LoadingCard className="h-28" />
        <div className="grid gap-4 grid-cols-2">
          <LoadingCard className="h-32" />
          <LoadingCard className="h-32" />
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <LoadingCard className="h-24" />
          <LoadingCard className="h-24" />
          <LoadingCard className="h-24 col-span-2 sm:col-span-1" />
        </div>
        <LoadingCard className="h-48" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  return (
    <div className="min-w-0 space-y-10" role="main" aria-label="Dashboard PLPK">
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {plpkLabel}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard PLPK
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Kelola setoran dan munfiq binaan Anda.
        </p>
      </div>

      <div
        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6"
        role="region"
        aria-label="Aksi utama"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconBox icon={PlusCircle} size="lg" tone="success" />
            <div>
              <p className="text-base font-semibold text-foreground">Input Setoran Baru</p>
              <p className="text-xs text-muted-foreground">
                Catat setoran koin infak dari munfiq binaan
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="min-h-[52px] min-w-[180px] rounded-xl bg-emerald-500 text-base font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400"
            aria-label="Input setoran baru"
          >
            <Link href="/gorut/transaksi">
              <PlusCircle className="mr-2 size-5" />
              Input Setoran
            </Link>
          </Button>
        </div>
      </div>

      <section aria-label="Ringkasan angka">
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Munfiq"
            value={String(payload.summary.totalMunfiq)}
            description="Munfiq terhubung ke PLPK Anda"
            icon={Users}
            iconTone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <MetricCard
            title="Setoran Bulan Ini"
            value={formatRupiah(payload.summary.setoranBulanIni)}
            description="Total yang sudah disetujui"
            icon={WalletCards}
            iconTone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <MetricCard
            title="Transaksi Pending"
            value={String(payload.summary.transaksiPending)}
            description="Menunggu proses"
            icon={Clock}
            iconTone="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <MetricCard
            title="Transaksi Selesai"
            value={String(payload.summary.transaksiSelesai)}
            description="Sudah tercatat"
            icon={ReceiptText}
            iconTone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      </section>

      <section aria-label="Menu cepat">
        <div className="space-y-5">
          <PageSectionHeader
            title="Menu Cepat"
            description="Fitur yang paling sering Anda gunakan."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <ActionCard
              icon={Users}
              title="Munfiq Saya"
              description="Lihat data munfiq binaan"
              href="/gorut/munfiq"
              iconTone="primary"
            />
            <ActionCard
              icon={WalletCards}
              title="Riwayat Setoran"
              description="Semua transaksi Anda"
              href="/gorut/transaksi"
              iconTone="info"
            />
            <ActionCard
              icon={User}
              title="Profil Saya"
              description="Lihat dan perbarui akun"
              href="/gorut/profil"
              iconTone="muted"
            />
            <ActionCard
              icon={BarChart3}
              title="Monitoring"
              description="Ringkasan dan status data"
              href="/gorut/monitoring"
              iconTone="info"
            />
            <ActionCard
              icon={FileText}
              title="Laporan"
              description="Rekap dan arsip dokumen"
              href="/gorut/reports"
              iconTone="muted"
            />
          </div>
        </div>
      </section>

      <Card className="border-border shadow-sm" aria-label="Daftar munfiq saya">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconBox icon={Users} size="sm" tone="primary" />
              <div>
                <CardTitle className="text-sm font-semibold">Munfiq Saya</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Munfiq terhubung ke PLPK Anda
                </p>
              </div>
            </div>
            {payload.munfiq.length > 0 && (
              <Badge variant="outline">{payload.munfiq.length} orang</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {payload.munfiq.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Belum ada munfiq"
              message="Data munfiq akan muncul setelah dihubungkan oleh admin."
            />
          ) : (
            payload.munfiq.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.munfiqCode} · {item.desa ?? '-'} · {item.phone ?? '-'}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">{item.status}</Badge>
                </div>
              </div>
            ))
          )}
          {payload.munfiq.length > 0 && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-1 w-full min-h-[48px] justify-between rounded-xl text-xs"
              aria-label="Lihat semua munfiq"
            >
              <Link href="/gorut/munfiq">
                Lihat semua munfiq
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm" aria-label="Riwayat setoran">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconBox icon={WalletCards} size="sm" tone="info" />
              <div>
                <CardTitle className="text-sm font-semibold">Riwayat Setoran</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Transaksi dalam scope PLPK Anda
                </p>
              </div>
            </div>
            {payload.transactions.length > 0 && (
              <Badge variant="outline">{payload.transactions.length} transaksi</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {payload.transactions.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Belum ada riwayat setoran"
              message="Setoran yang Anda buat akan tampil di sini."
              action={
                <Button
                  asChild
                  size="sm"
                  className="mt-4 min-h-[48px] rounded-xl bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  aria-label="Input setoran pertama"
                >
                  <Link href="/gorut/transaksi">
                    <PlusCircle className="mr-2 size-4" />
                    Input Setoran Pertama
                  </Link>
                </Button>
              }
            />
          ) : (
            payload.transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
