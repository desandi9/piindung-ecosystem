"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  FolderOpen,
  LockKeyhole,
  Image as ImageIcon,
  Megaphone,
  Shield,
  ShieldCheck,
  TriangleAlert,
  Upload,
  Users,
} from "lucide-react"
import { getUnreadInboxCount, useInboxMessages } from "@/lib/admin-inbox"
import { addActivityLog, useActivityLogs } from "@/lib/activity-log"
import { useAuth, roleDisplayNames } from "@/lib/auth-context"
import { useGalleryItems } from "@/lib/gallery-content"
import { useHomepageContent } from "@/lib/homepage-content"
import { useMaintenanceSettings, writeStoredMaintenanceSettings } from "@/lib/maintenance-mode"
import { useStoredMediaItems } from "@/lib/media-library"
import { useManagedUsers } from "@/lib/managed-users"
import { getPublishedNotifications, useNotifications } from "@/lib/notifications"
import { getActivePopup, usePopupAnnouncements } from "@/lib/popup-announcements"
import { useAssignedGorutKecamatan } from "@/MODUL GORUT TERBARU/lib/gorut/operational-scope"
import { cn } from "@/lib/utils"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function parseStorageSize(value: string) {
  const normalizedValue = value.trim().toUpperCase()
  const numericValue = Number.parseFloat(normalizedValue)
  if (Number.isNaN(numericValue)) return 0

  if (normalizedValue.includes("GB")) return numericValue * 1024 * 1024 * 1024
  if (normalizedValue.includes("MB")) return numericValue * 1024 * 1024
  return numericValue * 1024
}

function formatStorageSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function formatUploadSavedSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function activityStatusClassName(status: "Success" | "Warning" | "Failed") {
  if (status === "Success") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  if (status === "Warning") return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return "bg-destructive/10 text-destructive"
}

export function DashboardContent() {
  const { user } = useAuth()
  const { scopedRoleLabel } = useAssignedGorutKecamatan()
  const [currentDate, setCurrentDate] = useState("")
  const managedUsers = useManagedUsers()
  const homepageContent = useHomepageContent()
  const galleryItems = useGalleryItems()
  const inboxMessages = useInboxMessages()
  const notifications = useNotifications()
  const popups = usePopupAnnouncements()
  const mediaItems = useStoredMediaItems()
  const activityLogs = useActivityLogs()
  const { settings: maintenanceSettings } = useMaintenanceSettings()
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false)
  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )
  }, [])

  const totalArticles = homepageContent.filter((item) => item.type === "Artikel" || item.type === "Berita").length
  const publishedNotifications = getPublishedNotifications(notifications)
  const unreadMessages = getUnreadInboxCount(inboxMessages)
  const totalMediaStorage = mediaItems.reduce((total, item) => total + parseStorageSize(item.size), 0)
  const recentActivities = activityLogs.slice(0, 6)
  const uploadOptimizerLogs = activityLogs.filter((item) => Boolean(item.optimizationMetrics))
  const totalUploadSavedBytes = uploadOptimizerLogs.reduce((total, item) => total + (item.optimizationMetrics?.savedBytes ?? 0), 0)
  const averageUploadSavedPercent = uploadOptimizerLogs.length > 0
    ? Math.round(uploadOptimizerLogs.reduce((total, item) => total + (item.optimizationMetrics?.savedPercent ?? 0), 0) / uploadOptimizerLogs.length)
    : 0
  const isSuperAdmin = user?.role === "super_admin_pc"
  const isAdminPc = user?.role === "admin_pc"
  const isOperationalAdmin = user?.role === "admin_upzis" || user?.role === "admin_kordes"
  const activePopup = getActivePopup(popups)
  const totalActivePopups = popups.filter((item) => item.active).length
  const activeBanner = homepageContent.find((item) => item.type === "Banner" && item.status === "Published") ?? null
  const latestArticle = homepageContent.find((item) => (item.type === "Artikel" || item.type === "Berita") && item.status === "Published") ?? null
  const latestGalleryItem = galleryItems[0] ?? null
  const recentNotificationItems = publishedNotifications.slice(0, 4)
  const activeUsers = managedUsers.filter((item) => item.status === "Aktif").length
  const draftContentCount = homepageContent.filter((item) => item.status === "Draft").length
  const unreadNotificationCount = publishedNotifications.filter((item) => item.unread).length
  const backupAlert = activityLogs.find((item) => item.action.toLowerCase().includes("backup"))?.dateTime ?? "Belum ada backup tercatat"
  const executiveWarnings = [
    maintenanceSettings.enabled ? "Maintenance mode sedang aktif dan berdampak ke seluruh pengguna publik." : null,
    unreadMessages > 10 ? `${unreadMessages} pesan masuk belum dibaca dan membutuhkan tindak lanjut.` : null,
    unreadNotificationCount > 5 ? `${unreadNotificationCount} notifikasi publik belum dibaca.` : null,
    totalActivePopups > 1 ? `${totalActivePopups} popup aktif bersamaan. Periksa prioritas komunikasi publik.` : null,
    draftContentCount > totalArticles && draftContentCount > 5 ? `${draftContentCount} draft konten menunggu publikasi.` : null,
  ].filter(Boolean) as string[]
  const governanceItems = [
    {
      title: "User Governance",
      value: `${activeUsers}/${managedUsers.length}`,
      description: "Akun aktif dibanding total user yang dikelola saat ini.",
      href: "/admin/pengguna",
      icon: Users,
    },
    {
      title: "Permission Control",
      value: "Role Matrix",
      description: "Kelola role sensitif, hak akses, dan batasan menu antar admin.",
      href: "/admin/hak-akses",
      icon: LockKeyhole,
    },
    {
      title: "Backup Confidence",
      value: backupAlert,
      description: "Waktu backup terakhir yang tercatat dari aktivitas sistem.",
      href: "/admin/backup",
      icon: Database,
    },
    {
      title: "System Health",
      value: maintenanceSettings.enabled ? "Attention Needed" : "Stable",
      description: "Pantau media, inbox, popup, dan kesehatan data inti portal.",
      href: "/admin/system-health",
      icon: Shield,
    },
  ] as const

  const analyticsCards = useMemo(() => {
    if (isAdminPc) {
      return [
        {
          title: "Total Artikel",
          value: String(totalArticles),
          description: `${homepageContent.filter((item) => item.status === "Published" && (item.type === "Artikel" || item.type === "Berita")).length} artikel dan berita sedang tayang`,
          icon: FileText,
          accent: "from-primary/20 via-primary/5 to-transparent",
          iconTone: "bg-primary/10 text-primary",
        },
        {
          title: "Popup Aktif",
          value: String(totalActivePopups),
          description: activePopup ? `Popup utama: ${activePopup.title}` : "Belum ada popup aktif saat ini",
          icon: Megaphone,
          accent: "from-chart-3/20 via-chart-3/5 to-transparent",
          iconTone: "bg-chart-3/10 text-chart-3",
        },
        {
          title: "Unread Pesan Masuk",
          value: String(unreadMessages),
          description: `${inboxMessages.length} total pesan perlu dipantau`,
          icon: Bell,
          accent: "from-chart-4/25 via-chart-4/5 to-transparent",
          iconTone: "bg-chart-4/10 text-chart-4",
        },
        {
          title: "Total Galeri",
          value: String(galleryItems.length),
          description: latestGalleryItem ? `Update terbaru: ${latestGalleryItem.title}` : "Belum ada item galeri terbaru",
          icon: ImageIcon,
          accent: "from-secondary/20 via-secondary/5 to-transparent",
          iconTone: "bg-secondary/10 text-secondary",
        },
      ]
    }

    if (isOperationalAdmin) {
      return [
        {
          title: "Notifikasi Aktif",
          value: String(publishedNotifications.length),
          description: `${publishedNotifications.filter((item) => item.unread).length} notifikasi belum dibaca`,
          icon: Bell,
          accent: "from-chart-4/25 via-chart-4/5 to-transparent",
          iconTone: "bg-chart-4/10 text-chart-4",
        },
        {
          title: "Konten Published",
          value: String(homepageContent.filter((item) => item.status === "Published").length),
          description: "Ringkasan konten publik yang sedang tayang",
          icon: FileText,
          accent: "from-primary/20 via-primary/5 to-transparent",
          iconTone: "bg-primary/10 text-primary",
        },
        {
          title: "Galeri Terbaru",
          value: String(galleryItems.length),
          description: latestGalleryItem ? latestGalleryItem.title : "Belum ada item galeri terbaru",
          icon: ImageIcon,
          accent: "from-secondary/20 via-secondary/5 to-transparent",
          iconTone: "bg-secondary/10 text-secondary",
        },
        {
          title: "Status Sistem",
          value: maintenanceSettings.enabled ? "Maintenance" : "Online",
          description: maintenanceSettings.enabled ? "Beberapa layanan publik dibatasi sementara" : "Layanan publik berjalan normal",
          icon: Shield,
          accent: "from-chart-3/20 via-chart-3/5 to-transparent",
          iconTone: "bg-chart-3/10 text-chart-3",
        },
      ]
    }

    return [
      {
        title: "Total Users",
        value: String(managedUsers.length),
        description: `${managedUsers.filter((item) => item.status === "Aktif").length} akun aktif saat ini`,
        icon: Users,
        accent: "from-primary/20 via-primary/5 to-transparent",
        iconTone: "bg-primary/10 text-primary",
      },
      {
        title: "Total Articles",
        value: String(totalArticles),
        description: `${homepageContent.filter((item) => item.status === "Published").length} konten sedang tayang`,
        icon: FileText,
        accent: "from-secondary/20 via-secondary/5 to-transparent",
        iconTone: "bg-secondary/10 text-secondary",
      },
      {
        title: "Unread Messages",
        value: String(unreadMessages),
        description: `${inboxMessages.length} total pesan di inbox admin`,
        icon: Bell,
        accent: "from-chart-4/25 via-chart-4/5 to-transparent",
        iconTone: "bg-chart-4/10 text-chart-4",
      },
      {
        title: "Active Notifications",
        value: String(publishedNotifications.length),
        description: `${publishedNotifications.filter((item) => item.unread).length} notifikasi belum dibaca`,
        icon: Megaphone,
        accent: "from-chart-3/20 via-chart-3/5 to-transparent",
        iconTone: "bg-chart-3/10 text-chart-3",
      },
      {
        title: "Storage / Media Usage",
        value: formatStorageSize(totalMediaStorage),
        description: `${mediaItems.length} aset media tersimpan`,
        icon: Database,
        accent: "from-chart-2/20 via-chart-2/5 to-transparent",
        iconTone: "bg-chart-2/10 text-chart-2",
      },
      {
        title: "Recent Admin Activity",
        value: String(recentActivities.length),
        description: recentActivities[0]?.dateTime ?? "Belum ada aktivitas terbaru",
        icon: Activity,
        accent: "from-primary/15 via-secondary/10 to-transparent",
        iconTone: "bg-primary/10 text-primary",
      },
      {
        title: "Upload Savings",
        value: formatUploadSavedSize(totalUploadSavedBytes),
        description: uploadOptimizerLogs.length > 0 ? `${uploadOptimizerLogs.length} upload, rata-rata hemat ${averageUploadSavedPercent}%` : "Belum ada optimasi upload tercatat",
        icon: ImageIcon,
        accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
        iconTone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      },
    ]
  }, [activePopup, averageUploadSavedPercent, galleryItems, homepageContent, inboxMessages.length, isAdminPc, isOperationalAdmin, latestGalleryItem, managedUsers, mediaItems.length, maintenanceSettings.enabled, popups, publishedNotifications, recentActivities, totalActivePopups, totalArticles, totalMediaStorage, totalUploadSavedBytes, unreadMessages, uploadOptimizerLogs.length])

  const quickActions = (isSuperAdmin
    ? [
        {
          label: "System Health",
          description: "Pantau kesehatan sistem, media, inbox, dan sinyal risiko utama.",
          href: "/admin/system-health",
          icon: Shield,
        },
        {
          label: "Audit Trail",
          description: "Tinjau jejak perubahan konten, akses, dan operasional lintas modul.",
          href: "/admin/audit-trail",
          icon: LockKeyhole,
        },
        {
          label: "Backup & Restore",
          description: "Amankan snapshot data sistem dan kontrol kesiapan pemulihan.",
          href: "/admin/backup",
          icon: Database,
        },
        {
          label: "Hak Akses",
          description: "Atur role sensitif dan batas akses antar admin dalam portal.",
          href: "/admin/hak-akses",
          icon: ShieldCheck,
        },
        {
          label: "Kelola Pengguna",
          description: "Tinjau akun aktif, onboarding admin, dan status akses pengguna.",
          href: "/admin/pengguna",
          icon: Users,
        },
        {
          label: "Priority Inbox",
          description: "Respons cepat ke pesan publik, konsultasi, dan follow-up penting.",
          href: "/admin/pesan-masuk",
          icon: Bell,
        },
      ]
      : isAdminPc
        ? [
        {
          label: "Artikel & Berita",
          description: "Kelola artikel, berita, dan konten yang siap dipublikasikan.",
          href: "/admin/artikel",
          icon: FileText,
        },
        {
          label: "Kelola Galeri",
          description: "Tambahkan dokumentasi visual kegiatan terbaru.",
          href: "/admin/galeri",
          icon: Upload,
        },
        {
          label: "Popup Homepage",
          description: "Siapkan popup dan pengumuman penting di homepage.",
          href: "/admin/popup",
          icon: Megaphone,
        },
        {
          label: "Notifikasi Publik",
          description: "Publikasikan pemberitahuan yang tampil ke pengguna.",
          href: "/admin/notifikasi",
          icon: Bell,
        },
        {
          label: "Pesan Masuk",
          description: "Respons pesan dan konsultasi dari publik dengan cepat.",
          href: "/admin/pesan-masuk",
          icon: FolderOpen,
        },
        {
          label: "Kontak Publik",
          description: "Perbarui kontak, maps, dan sosial media yang tampil ke publik.",
          href: "/admin/kontak-sosial",
          icon: ShieldCheck,
        },
      ]
        : [
        {
          label: "Notifikasi",
          description: "Pantau broadcast aktif dan status notifikasi untuk pengguna.",
          href: "/admin/notifikasi",
          icon: Bell,
        },
        {
          label: "Dashboard Publik",
          description: "Kembali ke dashboard utama untuk melihat tampilan pengguna.",
          href: "/dashboard",
          icon: ArrowUpRight,
        },
      ])

  const focusItems = isAdminPc
    ? [
        {
          label: "Konten Draft",
          value: String(draftContentCount),
          detail: draftContentCount > 0 ? "Perlu review sebelum tayang" : "Tidak ada antrean draft",
          icon: FileText,
        },
        {
          label: "Pesan Belum Dibaca",
          value: String(unreadMessages),
          detail: unreadMessages > 0 ? "Follow-up komunikasi publik" : "Inbox dalam kondisi aman",
          icon: Bell,
        },
        {
          label: "Popup Aktif",
          value: String(totalActivePopups),
          detail: activePopup ? activePopup.title : "Belum ada popup aktif",
          icon: Megaphone,
        },
      ]
    : [
        {
          label: "Priority Warning",
          value: String(executiveWarnings.length),
          detail: executiveWarnings[0] ?? "Tidak ada warning prioritas saat ini",
          icon: TriangleAlert,
        },
        {
          label: "Akun Aktif",
          value: String(activeUsers),
          detail: `${managedUsers.length - activeUsers} akun nonaktif atau menunggu`,
          icon: Users,
        },
        {
          label: "Media Storage",
          value: formatStorageSize(totalMediaStorage),
          detail: `${mediaItems.length} aset media tersimpan`,
          icon: Database,
        },
        {
          label: "Upload Savings",
          value: formatUploadSavedSize(totalUploadSavedBytes),
          detail: uploadOptimizerLogs.length > 0 ? `${uploadOptimizerLogs.length} upload optimizer, rata-rata hemat ${averageUploadSavedPercent}%` : "Belum ada data optimasi upload",
          icon: ImageIcon,
        },
      ]

  function handleMaintenanceToggle() {
    if (!isSuperAdmin) return
    setMaintenanceConfirmOpen(true)
  }

  function confirmMaintenanceToggle() {
    const nextEnabled = !maintenanceSettings.enabled

    writeStoredMaintenanceSettings({
      ...maintenanceSettings,
      enabled: nextEnabled,
    })
    addActivityLog({
      userName: user?.name || "Super Admin",
      type: "System",
      action: `${nextEnabled ? "Mengaktifkan" : "Menonaktifkan"} maintenance mode dari dashboard`,
      status: nextEnabled ? "Warning" : "Success",
    })
    setMaintenanceConfirmOpen(false)
  }

  if (isOperationalAdmin) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="relative bg-[linear-gradient(135deg,#0b1220,#10243a,#123d2c)] p-6 text-white lg:p-8">
            <div className="absolute inset-0 opacity-15">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="ops-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M 12 0 L 0 0 0 12" fill="none" stroke="white" strokeWidth="0.45" />
                </pattern>
                <rect width="100" height="100" fill="url(#ops-grid)" />
              </svg>
            </div>

            <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
              <div>
                <p className="mb-1 text-sm text-white/70">{currentDate || "Memuat tanggal..."}</p>
                <h1 className="text-2xl font-bold lg:text-3xl">Dashboard Operasional {user?.role === "admin_upzis" ? "UPZIS" : "Kordes"}</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80 lg:text-base">
                  Pantau notifikasi aktif, status sistem publik, dan highlight konten terbaru yang relevan untuk operasional lapangan.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-white/20 text-white hover:bg-white/20">{user?.role ? roleDisplayNames[user.role] : "Admin"}</Badge>
                  <Badge className="border-0 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/15">Operational Desk</Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Notifikasi Aktif</p>
                  <p className="mt-2 text-2xl font-bold">{publishedNotifications.length}</p>
                  <p className="mt-1 text-xs text-white/70">Broadcast yang sedang tampil untuk pengguna.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Status Portal</p>
                  <p className="mt-2 text-2xl font-bold">{maintenanceSettings.enabled ? "Maintenance" : "Online"}</p>
                  <p className="mt-1 text-xs text-white/70">Pantau perubahan status layanan publik secara cepat.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analyticsCards.map((card) => (
            <Card key={card.title} className="group overflow-hidden border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="relative p-5">
                <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90", card.accent)} />
                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className={cn("rounded-2xl p-2.5 shadow-sm", card.iconTone)}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tugas Utama Operasional</CardTitle>
            <CardDescription>Akses yang paling relevan untuk admin operasional tanpa membawa menu super admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href} className="group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-105">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Highlight Publik Terbaru</CardTitle>
              <CardDescription>Snapshot cepat konten publik yang sedang tayang untuk referensi operasional.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <PreviewCard
                  icon={ImageIcon}
                  title="Banner Aktif"
                  value={activeBanner?.title ?? "Belum ada banner aktif"}
                  description={activeBanner?.subtitle ?? "Belum ada banner publik yang tampil saat ini."}
                  href="/dashboard"
                />
                <PreviewCard
                  icon={Megaphone}
                  title="Popup Aktif"
                  value={activePopup?.title ?? "Belum ada popup aktif"}
                  description={activePopup?.message ?? "Tidak ada popup pengumuman yang sedang tampil."}
                  href="/dashboard"
                />
                <PreviewCard
                  icon={FolderOpen}
                  title="Galeri Terbaru"
                  value={latestGalleryItem?.title ?? "Belum ada item galeri"}
                  description={latestGalleryItem?.caption ?? "Belum ada dokumentasi terbaru yang tampil."}
                  href="/galeri"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm xl:self-start">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Catatan Operasional</CardTitle>
              <CardDescription>Informasi cepat untuk membantu orientasi kerja harian.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {focusItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] p-6 text-white lg:p-8">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="dashboard-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
              <rect width="100" height="100" fill="url(#dashboard-grid)" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="mb-1 text-sm text-white/70">{currentDate || "Memuat tanggal..."}</p>
              <h1 className="text-2xl font-bold lg:text-3xl">
                Assalamualaikum, {user?.name?.split(" ")[0] || "Admin"}!
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80 lg:text-base">
                {isAdminPc
                  ? "Selamat datang di pusat pengelolaan konten PIINDUNG. Pantau publikasi portal, komunikasi pengguna, dan tampilan publik dari satu dashboard yang rapi dan fokus."
                  : isOperationalAdmin
                    ? "Selamat datang di dashboard operasional PIINDUNG. Pantau notifikasi, status sistem, dan highlight publik yang paling relevan untuk UPZIS dan Kordes."
                  : "Selamat datang di pusat kendali PIINDUNG. Pantau governance, kesehatan sistem, komunikasi publik, dan risiko operasional dari satu dashboard yang lebih fokus."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/20 text-white hover:bg-white/20">
                  {scopedRoleLabel ?? (user?.role ? roleDisplayNames[user.role] : "Admin")}
                </Badge>
                {isSuperAdmin ? (
                  <Badge className="border-0 bg-white/10 text-white/90 hover:bg-white/10">
                    {maintenanceSettings.enabled ? "Maintenance Active" : "System Online"}
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-white/10 text-white/90 hover:bg-white/10">
                    {isOperationalAdmin ? "Operational Dashboard" : "Portal Content Management"}
                  </Badge>
                )}
              </div>
            </div>

             <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isSuperAdmin ? "Priority Inbox" : "Unread Inbox"}</p>
                <p className="mt-2 text-2xl font-bold">{unreadMessages}</p>
                <p className="mt-1 text-xs text-white/70">{isSuperAdmin ? "Tiket publik yang perlu respons cepat" : "Pesan yang perlu ditindaklanjuti"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isAdminPc ? "Active Popup" : "Governance Signal"}</p>
                <p className="mt-2 text-2xl font-bold">{isAdminPc ? totalActivePopups : executiveWarnings.length}</p>
                <p className="mt-1 text-xs text-white/70">{isAdminPc ? "Popup homepage yang sedang tayang" : "Warning prioritas yang perlu perhatian"}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {focusItems.map((item) => (
          <Card key={item.label} className="border-border bg-card/80 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isSuperAdmin ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Executive Snapshot
              </CardTitle>
              <CardDescription>Ringkasan governance dan kontrol yang paling relevan untuk super admin.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {governanceItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-105">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{item.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{item.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm xl:self-start">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TriangleAlert className="h-5 w-5 text-amber-500" />
                Priority Panel
              </CardTitle>
              <CardDescription>Warning ringan agar super admin cepat melihat anomali paling penting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {executiveWarnings.length === 0 ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  Tidak ada prioritas kritis saat ini. Kondisi portal terlihat stabil.
                </div>
              ) : (
                executiveWarnings.map((warning) => (
                  <div key={warning} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                    {warning}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", isAdminPc ? "xl:grid-cols-4" : "xl:grid-cols-3 2xl:grid-cols-6") }>
        {analyticsCards.map((card) => (
          <Card key={card.title} className="group overflow-hidden border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="relative p-5">
              <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90", card.accent)} />
              <div className="relative z-10">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className={cn("rounded-2xl p-2.5 shadow-sm", card.iconTone)}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>{isAdminPc ? "Akses cepat ke tugas operasional konten dan komunikasi yang paling sering dikerjakan Admin PC." : "Akses cepat ke tugas operasional yang paling sering dikerjakan Super Admin."}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-105">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                </Link>
              ))}

              {isSuperAdmin ? (
                <button
                  type="button"
                  onClick={handleMaintenanceToggle}
                  className="group rounded-2xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-105">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {maintenanceSettings.enabled ? "Nonaktifkan Maintenance" : "Aktifkan Maintenance"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {maintenanceSettings.enabled ? "Kembalikan akses website ke semua pengguna." : "Alihkan pengguna ke halaman maintenance secara global."}
                  </p>
                </button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {isAdminPc ? (
          <Card className="border-border shadow-sm xl:self-start">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Notifications</CardTitle>
              <CardDescription>Broadcast terbaru yang saat ini aktif untuk pengguna portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentNotificationItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                  Belum ada notifikasi aktif yang dipublikasikan.
                </div>
              ) : (
                recentNotificationItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-muted/20 p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                      <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/10">{item.unread ? "Baru" : "Aktif"}</Badge>
                    </div>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.date}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border shadow-sm xl:self-start">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">System Snapshot</CardTitle>
              <CardDescription>Ringkasan cepat kondisi portal dan aktivitas terdekat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusSnapshot
                icon={CheckCircle2}
                label="System Status"
                value={maintenanceSettings.enabled ? "Maintenance Active" : "Online & Stable"}
              />
              <StatusSnapshot
                icon={Clock3}
                label="Last Activity"
                value={recentActivities[0]?.dateTime ?? "Belum ada aktivitas"}
              />
              <StatusSnapshot
                icon={FolderOpen}
                label="Media Library"
                value={`${mediaItems.length} aset tersimpan`}
              />
              <StatusSnapshot
                icon={Bell}
                label="Unread Notifications"
                value={`${publishedNotifications.filter((item) => item.unread).length} item membutuhkan perhatian`}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {isAdminPc ? (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Workflow Prioritas Hari Ini</CardTitle>
            <CardDescription>Area kerja yang paling sering dipakai Admin PC untuk menjaga portal tetap update dan responsif.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <PreviewCard
                icon={FileText}
                title="Draft Konten"
                value={`${draftContentCount} item`}
                description={draftContentCount > 0 ? "Tinjau draft lalu publikasikan yang siap tayang." : "Tidak ada draft yang antre saat ini."}
                href="/admin/artikel"
              />
              <PreviewCard
                icon={Bell}
                title="Pesan Publik"
                value={`${unreadMessages} belum dibaca`}
                description={unreadMessages > 0 ? "Prioritaskan pesan yang butuh respons cepat." : "Inbox publik dalam kondisi aman."}
                href="/admin/pesan-masuk"
              />
              <PreviewCard
                icon={Megaphone}
                title="Popup Aktif"
                value={`${totalActivePopups} tayang`}
                description={activePopup ? activePopup.title : "Belum ada popup homepage aktif."}
                href="/admin/popup"
              />
              <PreviewCard
                icon={ImageIcon}
                title="Galeri Terbaru"
                value={latestGalleryItem?.title ?? "Belum ada update"}
                description={latestGalleryItem?.caption ?? "Tambahkan dokumentasi terbaru untuk menjaga halaman publik tetap hidup."}
                href="/admin/galeri"
              />
              <PreviewCard
                icon={ShieldCheck}
                title="Kontak Publik"
                value="Sinkron"
                description="Pastikan nomor, alamat, maps, dan sosial media tetap sesuai kondisi terbaru." 
                href="/admin/kontak-sosial"
              />
              <PreviewCard
                icon={FolderOpen}
                title="Download Center"
                value={`${formatStorageSize(totalMediaStorage)}`}
                description="Perbarui file unduhan penting, template, dan materi publikasi resmi." 
                href="/admin/download"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isAdminPc ? (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Public Preview</CardTitle>
            <CardDescription>Ringkasan cepat elemen publik yang sedang tampil di portal PIINDUNG.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PreviewCard
                icon={ImageIcon}
                title="Active Homepage Banner"
                value={activeBanner?.title ?? "Belum ada banner aktif"}
                description={activeBanner?.subtitle ?? "Siapkan banner publik untuk halaman utama."}
                href="/admin/banner"
              />
              <PreviewCard
                icon={FileText}
                title="Latest Article"
                value={latestArticle?.title ?? "Belum ada artikel terbit"}
                description={latestArticle?.subtitle ?? "Publikasikan artikel atau berita terbaru."}
                href="/admin/artikel"
              />
              <PreviewCard
                icon={Megaphone}
                title="Active Popup"
                value={activePopup?.title ?? "Belum ada popup aktif"}
                description={activePopup?.message ?? "Buat popup homepage untuk pengumuman penting."}
                href="/admin/popup"
              />
              <PreviewCard
                icon={FolderOpen}
                title="Latest Gallery Item"
                value={latestGalleryItem?.title ?? "Belum ada item galeri"}
                description={latestGalleryItem?.caption ?? "Tambahkan dokumentasi visual terbaru."}
                href="/admin/galeri"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Recent Admin Activity</CardTitle>
              <CardDescription>{isAdminPc ? "Aktivitas terbaru dari publikasi konten, komunikasi pengguna, dan perubahan portal." : "Aktivitas terbaru dari kontrol portal, user, konten, dan perubahan sistem."}</CardDescription>
            </div>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/admin/activity">Lihat Semua Aktivitas</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Belum ada aktivitas admin yang tercatat.
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className={cn("mt-0.5 rounded-xl p-2", activityStatusClassName(activity.status))}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{activity.userName}</p>
                        <Badge className={cn("border-0 hover:bg-transparent", activityStatusClassName(activity.status))}>{activity.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{activity.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {activity.type} • {activity.device ?? "Unknown device"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground sm:pl-4">{activity.dateTime}</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={maintenanceConfirmOpen}
        onOpenChange={setMaintenanceConfirmOpen}
        title={maintenanceSettings.enabled ? "Nonaktifkan Maintenance Mode" : "Aktifkan Maintenance Mode"}
        description={maintenanceSettings.enabled ? "Akses website publik akan dibuka kembali untuk semua pengguna." : "Semua pengguna publik akan diarahkan ke halaman maintenance sampai mode ini dimatikan."}
        confirmLabel={maintenanceSettings.enabled ? "Nonaktifkan" : "Aktifkan"}
        destructive={!maintenanceSettings.enabled}
        onConfirm={confirmMaintenanceToggle}
      />
    </div>
  )
}

function StatusSnapshot({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function PreviewCard({
  icon: Icon,
  title,
  value,
  description,
  href,
}: {
  icon: typeof Activity
  title: string
  value: string
  description: string
  href: string
}) {
  return (
    <Link href={href} className="group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{value}</p>
      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{description}</p>
    </Link>
  )
}
