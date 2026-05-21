'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAssignedGorutKecamatan } from '@/lib/gorut/operational-scope'
import {
  StatsCards,
  RevenueCard,
  RecentActivity,
  PendingValidations,
  KecamatanChart,
} from '@/components/gorut'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InsightPanel, CriticalInsightBanner } from '@/components/gorut/insight-cards'
import { kecamatanData, notificationData, recentActivities, statistikGorut } from '@/lib/gorut/data'
import { useGorutApprovalTransactions } from '@/lib/gorut/approval-control'
import { getGorutWorkflowStatusMetaFromApproval, getGorutWorkflowStepLabel } from '@/lib/gorut/workflow'
import { hasRecentDashboardEntry } from '@/lib/gorut/dashboard-transition'
import { generateDashboardInsights, type DashboardInsight } from '@/lib/gorut/insights'
import { cn } from '@/lib/utils'
import { ArrowRight, BellRing, FileCheck2, ReceiptText, ShieldAlert, WalletCards } from 'lucide-react'

const initialInsights = generateDashboardInsights(statistikGorut, kecamatanData)

export function DashboardHome() {
  const { user } = useAuth()
  const { assignedKecamatan, isScopedUpzis } = useAssignedGorutKecamatan()
  const approvalRows = useGorutApprovalTransactions()
  const [pinnedInsightIds, setPinnedInsightIds] = useState<string[]>([])
  const [dismissedCriticalInsight, setDismissedCriticalInsight] = useState(false)
  const [insights] = useState<DashboardInsight[]>(initialInsights)
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    if (!hasRecentDashboardEntry()) return

    setShowIntro(true)
    const timeoutId = window.setTimeout(() => setShowIntro(false), 1300)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const handlePinInsight = (id: string) => {
    setPinnedInsightIds((prev) =>
      prev.includes(id) ? prev.filter((pinnedId) => pinnedId !== id) : [...prev, id]
    )
  }

  const criticalInsights = useMemo(
    () => insights.filter((insight) => insight.priority === 'critical'),
    [insights]
  )

  const priorityApprovals = useMemo(
    () => approvalRows.filter((item) => item.overallStatus === 'pending').slice(0, 3),
    [approvalRows]
  )

  const priorityNotifications = useMemo(
    () => notificationData.filter((item) => item.priority === 'critical' || item.priority === 'warning').slice(0, 3),
    []
  )

  const scopedPriorityApprovals = useMemo(
    () => (isScopedUpzis && assignedKecamatan ? priorityApprovals.filter((item) => item.kecamatan === assignedKecamatan) : priorityApprovals),
    [assignedKecamatan, isScopedUpzis, priorityApprovals]
  )

  const scopedPriorityNotifications = useMemo(
    () => (isScopedUpzis && assignedKecamatan ? priorityNotifications.filter((item) => !item.actionUrl || item.actionUrl.includes('upzis') || item.actionUrl.includes('approval') || item.actionUrl.includes('validasi') || item.actionUrl.includes('laporan')) : priorityNotifications),
    [assignedKecamatan, isScopedUpzis, priorityNotifications]
  )

  const executiveDeck = [
    {
      title: 'Approval Mendesak',
        value: scopedPriorityApprovals.length,
      description: 'Butuh keputusan berjenjang hari ini',
      href: '/gorut/approval',
      icon: FileCheck2,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      ring: 'group-hover:shadow-emerald-500/20',
      badge: 'border-emerald-500/20 text-emerald-600',
    },
    {
      title: 'Validasi Pending',
      value: statistikGorut.kotakPending,
      description: 'Perlu dibersihkan sebelum closing',
      href: '/gorut/validasi',
      icon: ReceiptText,
      accent: 'text-amber-600',
      bg: 'bg-amber-500/10',
      ring: 'group-hover:shadow-amber-500/20',
      badge: 'border-amber-500/20 text-amber-600',
    },
    {
      title: 'Laporan Bulanan',
      value: 'Ready',
      description: 'Akses rekap dan closing bulanan',
      href: '/gorut/rekap-bulanan',
      icon: WalletCards,
      accent: 'text-blue-600',
      bg: 'bg-blue-500/10',
      ring: 'group-hover:shadow-blue-500/20',
      badge: 'border-blue-500/20 text-blue-600',
    },
    {
      title: 'Executive Alerts',
        value: scopedPriorityNotifications.length,
      description: 'Alert operasional prioritas tinggi',
      href: '/gorut/notifikasi',
      icon: ShieldAlert,
      accent: 'text-violet-600',
      bg: 'bg-violet-500/10',
      ring: 'group-hover:shadow-violet-500/20',
      badge: 'border-violet-500/20 text-violet-600',
    },
  ]

  const visibleCommandDeck = useMemo(() => {
    if (user?.role === 'admin_upzis') {
      return executiveDeck.filter((item) => item.href !== '/gorut/rekap-bulanan')
    }

    if (user?.role === 'admin_kordes') {
      return executiveDeck.filter((item) => item.href !== '/gorut/rekap-bulanan')
    }

    return executiveDeck
  }, [executiveDeck, user?.role])

  const commandDeckTitle = user?.role === 'super_admin_pc' || user?.role === 'admin_pc' ? 'Executive Command Deck' : 'Command Deck'
  const commandDeckDescription =
    user?.role === 'super_admin_pc' || user?.role === 'admin_pc'
      ? 'Akses tercepat ke area yang paling sering dipakai super admin.'
      : 'Shortcut cepat ke area operasional yang paling sering dipakai.'
  const commandDeckBadge =
    user?.role === 'super_admin_pc' || user?.role === 'admin_pc' ? 'Super Admin Priority' : assignedKecamatan || 'Operasional Kecamatan'

  const introClassName = () =>
    cn(
      'transition-all ease-out',
      showIntro ? 'translate-y-5 opacity-0 blur-[8px]' : 'translate-y-0 opacity-100 blur-0',
      `duration-[720ms]`
    )

  return (
    <div className="min-w-0 space-y-6">
      <div className={introClassName()} style={{ transitionDelay: showIntro ? '40ms' : '0ms' }}>
        <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/60 px-5 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-600">
              Executive Overview
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {assignedKecamatan ? `${user?.role ?? 'operasional'} - ${assignedKecamatan}` : 'Super Admin Console'}
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard GORUT</h1>
            <p className="text-sm text-muted-foreground">
              Selamat datang di sistem operasional Gerakan Koin Infak NU Garut
            </p>
          </div>
        </div>
      </div>

      {!dismissedCriticalInsight && (
        <div className={introClassName()} style={{ transitionDelay: showIntro ? '110ms' : '0ms' }}>
          <CriticalInsightBanner
            insights={criticalInsights}
            onDismiss={() => setDismissedCriticalInsight(true)}
          />
        </div>
      )}

      <div className={introClassName()} style={{ transitionDelay: showIntro ? '170ms' : '0ms' }}>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <InsightPanel
            insights={insights}
            onPin={handlePinInsight}
            pinnedIds={pinnedInsightIds}
          />
        </div>
      </div>

      <div className={introClassName()} style={{ transitionDelay: showIntro ? '240ms' : '0ms' }}>
        <RevenueCard stats={statistikGorut} />
      </div>
      <div className={introClassName()} style={{ transitionDelay: showIntro ? '290ms' : '0ms' }}>
        <StatsCards stats={statistikGorut} />
      </div>

      <div className={introClassName()} style={{ transitionDelay: showIntro ? '340ms' : '0ms' }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{commandDeckTitle}</h2>
              <p className="text-sm text-muted-foreground">{commandDeckDescription}</p>
            </div>
            <Badge variant="outline" className="hidden rounded-full border-border/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:flex">
              {commandDeckBadge}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleCommandDeck.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-border/40 bg-card/90 p-4 shadow-sm transition-all duration-300 hover:border-white/10 hover:bg-card hover:shadow-[0_18px_40px_rgba(0,0,0,0.16)] hover:-translate-y-1',
                  item.ring
                )}
              >
                <div className={cn('absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.08]', item.bg)} />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-3">
                  <div className={cn('relative flex size-11 items-center justify-center rounded-xl border border-white/5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl', item.bg)}>
                    <item.icon className={cn('size-5', item.accent)} />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground/75">{item.title}</p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className={cn('rounded-full px-2 py-0.5 text-[10px]', item.badge)}>
                    Priority
                  </Badge>
                  <span className="font-medium text-foreground/80">Open</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={introClassName()} style={{ transitionDelay: showIntro ? '410ms' : '0ms' }}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <KecamatanChart data={kecamatanData} />
            <RecentActivity activities={recentActivities} />
          </div>
          <div className="min-w-0 space-y-6">
            <Card className="group border border-border/40 bg-card/90 shadow-sm transition-all duration-300 backdrop-blur-sm hover:border-white/10 hover:shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
              <CardHeader className="border-b border-border/40 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <FileCheck2 className="size-4 text-emerald-600" />
                      Approval Priority Queue
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Antrian approval yang paling perlu atensi cepat.</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                  {scopedPriorityApprovals.length} prioritas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {scopedPriorityApprovals.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/40 bg-background/40 p-3 transition-all duration-300 hover:border-emerald-500/20 hover:bg-background/60 hover:shadow-[0_12px_30px_rgba(16,185,129,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.kode}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.munfiqNama} • {item.kecamatan}</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] uppercase">
                        {getGorutWorkflowStepLabel(item.currentStep)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getGorutWorkflowStatusMetaFromApproval(item).label}</span>
                      <span className="font-medium text-foreground">Rp {(item.nominal).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
                <Button asChild variant="ghost" size="sm" className="w-full justify-between rounded-xl border border-border/40 bg-background/40 text-xs hover:bg-muted/40">
                  <Link href="/gorut/approval">
                    Buka seluruh approval
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group border border-border/40 bg-card/90 shadow-sm transition-all duration-300 backdrop-blur-sm hover:border-white/10 hover:shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
              <CardHeader className="border-b border-border/40 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <ShieldAlert className="size-4 text-amber-600" />
                      Executive Watchlist
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Alert dan notifikasi penting yang sebaiknya dibaca lebih dulu.</p>
                  </div>
                  <BellRing className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {scopedPriorityNotifications.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/40 bg-background/40 p-3 transition-all duration-300 hover:border-amber-500/20 hover:bg-background/60 hover:shadow-[0_12px_30px_rgba(245,158,11,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] uppercase',
                          item.priority === 'critical' ? 'border-red-500/20 text-red-600' : 'border-amber-500/20 text-amber-600'
                        )}
                      >
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button asChild variant="ghost" size="sm" className="w-full justify-between rounded-xl border border-border/40 bg-background/40 text-xs hover:bg-muted/40">
                  <Link href="/gorut/notifikasi">
                    Buka pusat notifikasi
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <PendingValidations count={scopedPriorityApprovals.length} />
          </div>
        </div>
      </div>
    </div>
  )
}
