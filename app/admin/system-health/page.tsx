"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  Bell,
  Database,
  FolderOpen,
  HardDrive,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useActivityLogs } from "@/lib/activity-log"
import { getUnreadInboxCount, useInboxMessages } from "@/lib/admin-inbox"
import { useGalleryItems } from "@/lib/gallery-content"
import { useHomepageContent } from "@/lib/homepage-content"
import { useMaintenanceSettings } from "@/lib/maintenance-mode"
import { useStoredMediaItems } from "@/lib/media-library"
import { useManagedUsers } from "@/lib/managed-users"
import { getPublishedNotifications, useNotifications } from "@/lib/notifications"
import { usePopupAnnouncements } from "@/lib/popup-announcements"
import { cn } from "@/lib/utils"
import Link from "next/link"

const BACKUP_HISTORY_STORAGE_KEY = "piindung-backup-history"

interface HealthCard {
  title: string
  value: string
  description: string
  icon: React.ElementType
  tone: string
}

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

export default function SystemHealthPage() {
  const managedUsers = useManagedUsers()
  const inboxMessages = useInboxMessages()
  const notifications = useNotifications()
  const homepageContent = useHomepageContent()
  const galleryItems = useGalleryItems()
  const mediaItems = useStoredMediaItems()
  const popups = usePopupAnnouncements()
  const activityLogs = useActivityLogs()
  const { settings: maintenanceSettings } = useMaintenanceSettings()
  const [lastBackupLabel, setLastBackupLabel] = useState("Belum ada backup")

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY)
      if (!raw) return
      const history = JSON.parse(raw) as Array<{ createdAt?: string }>
      setLastBackupLabel(history[0]?.createdAt ?? "Belum ada backup")
    } catch {
      setLastBackupLabel("Belum ada backup")
    }
  }, [])

  const unreadInbox = getUnreadInboxCount(inboxMessages)
  const publishedNotifications = getPublishedNotifications(notifications)
  const totalMediaStorage = mediaItems.reduce((total, item) => total + parseStorageSize(item.size), 0)
  const publishedContent = homepageContent.filter((item) => item.status === "Published").length
  const draftContent = homepageContent.filter((item) => item.status === "Draft").length
  const activePopups = popups.filter((item) => item.active).length

  const cards = useMemo<HealthCard[]>(() => [
    {
      title: "Database / Record Store",
      value: String(homepageContent.length + galleryItems.length + mediaItems.length + notifications.length + inboxMessages.length + popups.length),
      description: "Total record terdeteksi dari modul inti sistem",
      icon: Database,
      tone: "text-cyan-300",
    },
    {
      title: "Media Usage",
      value: formatStorageSize(totalMediaStorage),
      description: `${mediaItems.length} aset media aktif tersimpan`,
      icon: HardDrive,
      tone: "text-emerald-300",
    },
    {
      title: "Inbox Pending",
      value: String(unreadInbox),
      description: `${inboxMessages.length} total pesan dari publik`,
      icon: MessageSquare,
      tone: "text-amber-300",
    },
    {
      title: "Published Alerts",
      value: String(publishedNotifications.length),
      description: `${publishedNotifications.filter((item) => item.unread).length} notifikasi belum dibaca`,
      icon: Bell,
      tone: "text-violet-300",
    },
    {
      title: "Content Health",
      value: String(publishedContent),
      description: `${draftContent} draft masih menunggu publikasi`,
      icon: FolderOpen,
      tone: "text-sky-300",
    },
    {
      title: "User Governance",
      value: String(managedUsers.length),
      description: `${managedUsers.filter((item) => item.status === "Aktif").length} akun aktif saat ini`,
      icon: UserRound,
      tone: "text-fuchsia-300",
    },
  ], [draftContent, galleryItems.length, homepageContent, inboxMessages, managedUsers, mediaItems, notifications.length, popups.length, publishedContent, publishedNotifications, totalMediaStorage, unreadInbox])

  const warnings = [
    lastBackupLabel === "Belum ada backup" ? "Belum ada riwayat backup tersimpan di browser admin ini." : null,
    maintenanceSettings.enabled ? "Maintenance mode sedang aktif. Pastikan ini memang disengaja sebelum publikasi konten baru." : null,
    unreadInbox > 10 ? `Pesan masuk belum dibaca mencapai ${unreadInbox}. Perlu tindak lanjut admin.` : null,
    activePopups > 1 ? `Popup aktif lebih dari satu (${activePopups}). Pastikan prioritas pengumuman sudah benar.` : null,
    draftContent > publishedContent && draftContent > 5 ? `Jumlah draft (${draftContent}) lebih tinggi dari konten published (${publishedContent}).` : null,
  ].filter(Boolean) as string[]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="relative bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#0b1120] p-6 text-white lg:p-8">
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  Super Admin Monitoring
                </div>
                <h1 className="text-2xl font-bold lg:text-3xl">System Health</h1>
                <p className="mt-2 max-w-3xl text-sm text-white/75 lg:text-base">
                  Ringkasan kesehatan data, aktivitas operasional, media, backup, dan komunikasi agar super admin dapat memantau kondisi sistem PIINDUNG dari satu panel.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">Last Backup</p>
                <p className="mt-1 text-sm font-semibold text-white">{lastBackupLabel}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title} className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <CardDescription className="mt-1 text-2xl font-semibold text-foreground">{card.value}</CardDescription>
                </div>
                <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-3", card.tone)}>
                  <card.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Activity className="h-5 w-5 text-primary" />
                Operational Snapshot
              </CardTitle>
              <CardDescription>Status inti yang paling sering dipantau super admin.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Maintenance</p>
                <Badge className={cn("mt-3 border-0", maintenanceSettings.enabled ? "bg-amber-500/10 text-amber-600 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300")}>
                  {maintenanceSettings.enabled ? "Active" : "Online"}
                </Badge>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Popup Aktif</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{activePopups}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Galeri Published</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{galleryItems.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recent Activity</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{activityLogs.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TriangleAlert className="h-5 w-5 text-amber-500" />
                Warning & Attention
              </CardTitle>
              <CardDescription>Anomali ringan yang perlu diperhatikan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {warnings.length === 0 ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  Tidak ada warning utama saat ini. Sistem terlihat stabil untuk pemantauan dasar.
                </div>
              ) : (
                warnings.map((warning) => (
                  <div key={warning} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                    {warning}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tindakan Cepat</CardTitle>
            <CardDescription>Akses area yang paling sering dipakai saat ada warning atau investigasi.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Lihat Backup", href: "/admin/backup" },
                { label: "Buka Inbox", href: "/admin/pesan-masuk" },
                { label: "Cek Notifikasi", href: "/admin/notifikasi" },
                { label: "Maintenance", href: "/admin/maintenance" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="group rounded-2xl border border-border/70 bg-muted/20 p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
