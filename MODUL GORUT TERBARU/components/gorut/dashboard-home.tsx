'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAssignedGorutKecamatan } from '@/lib/gorut/operational-scope'
import { useGorutDashboard } from '@/lib/gorut/dashboard-control'
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
import { getGorutWorkflowStatusMetaFromApproval, getGorutWorkflowStepLabel } from '@/lib/gorut/workflow'
import { hasRecentDashboardEntry } from '@/lib/gorut/dashboard-transition'
import { generateDashboardInsights } from '@/lib/gorut/insights'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  BellRing,
  FileCheck2,
  ReceiptText,
  ShieldAlert,
  WalletCards,
} from 'lucide-react'
import {
  EmptyState,
  ActionCard,
  PageSectionHeader,
  IconBox,
} from '@/components/ui/ds-patterns'

export function DashboardHome() {
  const { user } = useAuth()
  const { assignedKecamatan, isScopedUpzis } = useAssignedGorutKecamatan()
  const dashboard = useGorutDashboard()
  const [pinnedInsightIds, setPinnedInsightIds] = useState<string[]>([])
  const [dismissedCriticalInsight, setDismissedCriticalInsight] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const insights = useMemo(
    () => generateDashboardInsights(dashboard.stats, dashboard.kecamatanData),
    [dashboard.kecamatanData, dashboard.stats]
  )

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
    () => dashboard.priorityApprovals.filter((item) => item.overallStatus === 'pending').slice(0, 3),
    [dashboard.priorityApprovals]
  )

  const priorityNotifications = useMemo(
    () => dashboard.priorityNotifications.filter((item) => item.priority === 'critical' || item.priority === 'warning').slice(0, 3),
    [dashboard.priorityNotifications]
  )

  const scopedPriorityApprovals = useMemo(
    () => (isScopedUpzis && assignedKecamatan ? priorityApprovals.filter((item) => item.kecamatan === assignedKecamatan) : priorityApprovals),
    [assignedKecamatan, isScopedUpzis, priorityApprovals]
  )

  const scopedPriorityNotifications = useMemo(
    () => (isScopedUpzis && assignedKecamatan ? priorityNotifications.filter((item) => !item.actionUrl || item.actionUrl.includes('upzis') || item.actionUrl.includes('approval') || item.actionUrl.includes('validasi') || item.actionUrl.includes('laporan')) : priorityNotifications),
    [assignedKecamatan, isScopedUpzis, priorityNotifications]
  )

  const visibleQuickActions = useMemo(() => {
    const actions = [
      {
        title: 'Approval Mendesak',
        description: `${scopedPriorityApprovals.length} item menunggu keputusan`,
        href: '/gorut/approval',
        icon: FileCheck2,
        iconTone: 'success' as const,
      },
      {
        title: 'Validasi Pending',
        description: `${dashboard.stats.kotakPending} item perlu ditindaklanjuti`,
        href: '/gorut/validasi',
        icon: ReceiptText,
        iconTone: 'warning' as const,
      },
      {
        title: 'Rekap Bulanan',
        description: 'Laporan dan closing bulanan',
        href: '/gorut/rekap-bulanan',
        icon: WalletCards,
        iconTone: 'info' as const,
      },
      {
        title: 'Notifikasi',
        description: `${scopedPriorityNotifications.length} peringatan aktif`,
        href: '/gorut/notifikasi',
        icon: ShieldAlert,
        iconTone: 'muted' as const,
      },
    ]
    if (user?.role === 'admin_upzis' || user?.role === 'admin_kordes') {
      return actions.filter((item) => item.href !== '/gorut/rekap-bulanan')
    }
    return actions
  }, [user?.role, scopedPriorityApprovals.length, dashboard.stats.kotakPending, scopedPriorityNotifications.length])

  const scopeLabel = assignedKecamatan
    ? `${user?.role ?? 'Operasional'} · ${assignedKecamatan}`
    : 'Super Admin'

  const introClassName = () =>
    cn(
      'transition-all ease-out',
      showIntro ? 'translate-y-5 opacity-0 blur-[8px]' : 'translate-y-0 opacity-100 blur-0',
      'duration-[720ms]'
    )

  return (
    <div className="min-w-0 space-y-10" role="main" aria-label="Dashboard GORUT">
      <div className={introClassName()} style={{ transitionDelay: showIntro ? '40ms' : '0ms' }}>
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {scopeLabel}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard GORUT
          </h1>
          <p className="max-w-lg text-sm text-muted-foreground">
            Pantau operasional Gerakan Koin Infak NU Garut dari satu tempat.
          </p>
        </div>
      </div>

      {!dismissedCriticalInsight && criticalInsights.length > 0 && (
        <div className={introClassName()} style={{ transitionDelay: showIntro ? '110ms' : '0ms' }}>
          <CriticalInsightBanner
            insights={criticalInsights}
            onDismiss={() => setDismissedCriticalInsight(true)}
          />
        </div>
      )}

      {insights.length > 0 && (
        <div className={introClassName()} style={{ transitionDelay: showIntro ? '170ms' : '0ms' }}>
          <InsightPanel
            insights={insights}
            onPin={handlePinInsight}
            pinnedIds={pinnedInsightIds}
          />
        </div>
      )}

      <div className={introClassName()} style={{ transitionDelay: showIntro ? '240ms' : '0ms' }}>
        <RevenueCard stats={dashboard.stats} />
      </div>

      <div className={introClassName()} style={{ transitionDelay: showIntro ? '290ms' : '0ms' }}>
        <StatsCards stats={dashboard.stats} />
      </div>

      <section
        className={introClassName()}
        style={{ transitionDelay: showIntro ? '340ms' : '0ms' }}
        aria-label="Aksi cepat"
      >
        <div className="space-y-5">
          <PageSectionHeader
            title="Aksi Cepat"
            description="Pintasan ke tugas operasional utama."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleQuickActions.map((item) => (
              <ActionCard
                key={item.href}
                icon={item.icon}
                title={item.title}
                description={item.description}
                href={item.href}
                iconTone={item.iconTone}
              />
            ))}
          </div>
        </div>
      </section>

      <div className={introClassName()} style={{ transitionDelay: showIntro ? '410ms' : '0ms' }}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="min-w-0 space-y-8 lg:col-span-2">
            <KecamatanChart data={dashboard.kecamatanData} />
            <RecentActivity activities={dashboard.recentActivities} />
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="border-border shadow-sm" aria-label="Antrian approval prioritas">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <IconBox icon={FileCheck2} size="sm" tone="success" />
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Antrian Approval
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Perlu atensi segera
                      </p>
                    </div>
                  </div>
                  {scopedPriorityApprovals.length > 0 && (
                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                      {scopedPriorityApprovals.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {scopedPriorityApprovals.length === 0 && (
                  <EmptyState
                    variant="inline"
                    title="Semua approval sudah diproses"
                    message="Tidak ada item yang menunggu."
                  />
                )}
                {scopedPriorityApprovals.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.kode}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.munfiqNama} · {item.kecamatan}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase">
                        {getGorutWorkflowStepLabel(item.currentStep)}
                      </Badge>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getGorutWorkflowStatusMetaFromApproval(item).label}</span>
                      <span className="font-medium text-foreground">
                        Rp {(item.nominal).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full min-h-[44px] justify-between rounded-xl text-xs"
                  aria-label="Buka seluruh approval"
                >
                  <Link href="/gorut/approval">
                    Lihat semua approval
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm" aria-label="Notifikasi penting">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <IconBox icon={BellRing} size="sm" tone="warning" />
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Peringatan
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Perhatian yang diperlukan
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {scopedPriorityNotifications.length === 0 && (
                  <EmptyState
                    variant="inline"
                    title="Tidak ada peringatan"
                    message="Semua berjalan normal."
                  />
                )}
                {scopedPriorityNotifications.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase',
                          item.priority === 'critical' ? 'border-red-500/20 text-red-600' : 'border-amber-500/20 text-amber-600'
                        )}
                      >
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full min-h-[44px] justify-between rounded-xl text-xs"
                  aria-label="Buka pusat notifikasi"
                >
                  <Link href="/gorut/notifikasi">
                    Lihat semua notifikasi
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <PendingValidations count={dashboard.stats.kotakPending} />
          </div>
        </div>
      </div>
    </div>
  )
}
