"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/piindung/navbar"
import { HeroBanner } from "@/components/piindung/hero-banner"
import { AppCards } from "@/components/piindung/app-cards"
import { QuickActions } from "@/components/piindung/quick-actions"
import { InfoSection } from "@/components/piindung/info-section"
import { Footer } from "@/components/piindung/footer"
import { PopupAnnouncement } from "@/components/piindung/popup-announcement"
import {
  MetricCard,
  InlineAlert,
  LoadingCard,
  LoadingRow,
  EmptyState,
  GovernanceCard,
  PageSectionHeader,
} from "@/components/ui/ds-patterns"
import {
  Bell,
  ClipboardList,
  BookOpen,
  Heart,
  Megaphone,
  Activity,
  Users,
  Layers,
  TrendingUp,
  HandHeart,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// REVEAL BLOCK — staggered fade-in wrapper
// ─────────────────────────────────────────────────────────────────────────────

function RevealBlock({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div
      className={`dashboard-reveal ${className}`.trim()}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SKELETON — shown during hydration
// Uses DS LoadingCard + LoadingRow for every shimmer region.
// ─────────────────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      aria-hidden="true"
      role="presentation"
    >
      {/* Navbar skeleton */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-8">
        <div className="w-32 h-8 rounded-lg bg-muted animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-3">
            <div className="w-16 h-4 rounded bg-muted animate-pulse" />
            <div className="w-16 h-4 rounded bg-muted animate-pulse" />
            <div className="w-16 h-4 rounded bg-muted animate-pulse" />
          </div>
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 lg:px-8 py-8 space-y-10">
        {/* HeroBanner skeleton */}
        <div className="h-[320px] md:h-[400px] w-full bg-gradient-to-br from-emerald-950/10 via-card to-zinc-900/30 rounded-2xl border border-border animate-pulse flex flex-col justify-end p-6 md:p-8 space-y-4">
          <div className="w-2/3 md:w-1/2 h-8 rounded-lg bg-muted" />
          <div className="w-1/2 md:w-1/3 h-4 rounded-md bg-muted" />
          <div className="w-28 h-10 rounded-xl bg-muted" />
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <LoadingCard key={idx} className="h-[136px]" />
          ))}
        </div>

        {/* QuickActions skeleton */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="w-36 h-4 rounded bg-muted animate-pulse mb-5" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <div key={idx} className="flex flex-col items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-muted animate-pulse" />
                <div className="w-14 h-3 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* AppCards skeleton */}
        <div className="space-y-4">
          <div className="w-48 h-5 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {Array.from({ length: 2 }).map((_, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <LoadingCard key={idx} className="h-[108px]" />
            ))}
          </div>
        </div>

        {/* InfoSection skeleton */}
        <div className="space-y-4">
          <div className="w-56 h-5 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <LoadingCard key={idx} />
            ))}
          </div>
        </div>

        {/* Announcements skeleton */}
        <div className="space-y-4">
          <div className="w-52 h-5 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <LoadingCard key={idx} />
            ))}
          </div>
        </div>

        {/* Activity skeleton */}
        <div className="space-y-4">
          <div className="w-44 h-5 rounded bg-muted animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <LoadingRow key={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI SECTION
// Four MetricCard tiles summarising key institutional stats.
// Data is static / demo — no new API calls introduced.
// ─────────────────────────────────────────────────────────────────────────────

const KPI_METRICS = [
  {
    title: "Total Donatur",
    value: "12.400+",
    description: "Muzakki & donatur aktif LAZISNU Garut",
    icon: Users,
    accent: "from-primary/20 via-primary/5 to-transparent",
    iconTone: "bg-primary/10 text-primary",
  },
  {
    title: "Program Aktif",
    value: "18",
    description: "Program sosial & kemanusiaan berjalan",
    icon: Layers,
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    iconTone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Penerima Manfaat",
    value: "5.200+",
    description: "Keluarga & individu yang telah dibantu",
    icon: HandHeart,
    accent: "from-amber-500/20 via-amber-500/5 to-transparent",
    iconTone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Pertumbuhan ZIS",
    value: "+24%",
    description: "Peningkatan penyaluran dari tahun lalu",
    icon: TrendingUp,
    accent: "from-blue-500/20 via-blue-500/5 to-transparent",
    iconTone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
]

function DashboardKPISection() {
  return (
    <section
      className="container mx-auto px-4 lg:px-8 py-6"
      aria-labelledby="kpi-section-heading"
    >
      <h2 id="kpi-section-heading" className="sr-only">
        Ringkasan Statistik LAZISNU Garut
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {KPI_METRICS.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            accent={metric.accent}
            iconTone={metric.iconTone}
          />
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENT WIDGET
// Three GovernanceCard tiles linking to key informational pages.
// ─────────────────────────────────────────────────────────────────────────────

const ANNOUNCEMENT_ITEMS = [
  {
    icon: ClipboardList,
    title: "LAPORAN KEUANGAN",
    value: "Transparansi & Akuntabilitas LAZISNU Garut",
    description:
      "Lihat laporan penerimaan dan penyaluran zakat, infaq, sedekah secara berkala.",
    href: "/laporan",
  },
  {
    icon: BookOpen,
    title: "INFORMASI PROGRAM",
    value: "Program Unggulan & Penyaluran Tepat Sasaran",
    description:
      "Temukan berbagai program sosial kemanusiaan yang sedang berjalan.",
    href: "/informasi",
  },
  {
    icon: Heart,
    title: "CARA BERDONASI",
    value: "Transfer, QRIS, dan Rekening Resmi",
    description:
      "Donasikan sebagian rezeki Anda melalui kanal resmi yang tersedia.",
    href: "/rekening-donasi",
  },
] as const

function AnnouncementWidget() {
  return (
    <section
      className="container mx-auto px-4 lg:px-8 py-8"
      aria-labelledby="announcement-section-heading"
    >
      <PageSectionHeader
        title={
          <span
            id="announcement-section-heading"
            className="flex items-center gap-2"
          >
            <Megaphone className="h-4 w-4 text-primary" aria-hidden="true" />
            Informasi & Pengumuman
          </span>
        }
        description="Berita terkini, laporan, dan panduan layanan LAZISNU Garut"
        className="mb-5"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ANNOUNCEMENT_ITEMS.map((item) => (
          <GovernanceCard
            key={item.href}
            icon={item.icon}
            title={item.title}
            value={item.value}
            description={item.description}
            href={item.href}
          />
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY WIDGET
// Empty state with icon + explanation + CTA.
// InlineAlert contextualises why the section is empty.
// Populated by notification data when available (future sprint).
// ─────────────────────────────────────────────────────────────────────────────

function ActivityWidget() {
  return (
    <section
      className="container mx-auto px-4 lg:px-8 py-8"
      aria-labelledby="activity-section-heading"
    >
      <PageSectionHeader
        title={
          <span
            id="activity-section-heading"
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            Aktivitas Terkini
          </span>
        }
        description="Riwayat aksi dan notifikasi penting di akun Anda"
        className="mb-5"
      />
      <InlineAlert variant="muted" className="mb-4">
        Fitur riwayat aktivitas sedang disiapkan. Aksi penting seperti donasi,
        laporan, dan perubahan akun akan tercatat di sini secara otomatis.
      </InlineAlert>
      <EmptyState
        icon={Bell}
        title="Belum ada aktivitas terbaru"
        description="Aktivitas akun Anda akan tercatat di sini setelah menggunakan layanan PIINDUNG."
        action={
          <Link
            href="/notifikasi"
            aria-label="Lihat semua notifikasi akun Anda"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Lihat Semua Notifikasi
          </Link>
        }
      />
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  if (!isReady) {
    return <DashboardSkeleton />
  }

  return (
    <div
      className="dashboard-shell min-h-screen flex flex-col bg-background"
      data-ready={isReady}
    >
      {/* Skip navigation — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none"
      >
        Lewati ke konten utama
      </a>

      {/* Navigation */}
      <RevealBlock delay={80} className="dashboard-reveal-nav">
        <Navbar />
      </RevealBlock>

      {/* Main content */}
      <main
        className="flex-1"
        id="main-content"
        aria-label="Konten utama dashboard PIINDUNG"
      >
        {/* 1. Hero Banner — primary CTA + brand statement */}
        <RevealBlock delay={160}>
          <HeroBanner />
        </RevealBlock>

        {/* 2. KPI Metrics — institutional snapshot */}
        <RevealBlock delay={220}>
          <DashboardKPISection />
        </RevealBlock>

        {/* 3. Quick Actions — highest-frequency user tasks */}
        <RevealBlock delay={280}>
          <QuickActions />
        </RevealBlock>

        {/* 4. Integrated Apps — GORUT & other modules */}
        <RevealBlock delay={360}>
          <AppCards />
        </RevealBlock>

        {/* 5. Info Section — program, gallery, download, contacts */}
        <RevealBlock delay={440}>
          <InfoSection />
        </RevealBlock>

        {/* 6. Announcements — key institutional links */}
        <RevealBlock delay={520}>
          <AnnouncementWidget />
        </RevealBlock>

        {/* 7. Activity — recent account actions (empty until Sprint 7) */}
        <RevealBlock delay={600}>
          <ActivityWidget />
        </RevealBlock>
      </main>

      {/* Footer */}
      <RevealBlock delay={680}>
        <Footer />
      </RevealBlock>

      {/* Popup announcement overlay */}
      <PopupAnnouncement />
    </div>
  )
}