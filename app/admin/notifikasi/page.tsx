"use client"

import { useState } from "react"
import {
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Megaphone,
  Trash2,
  Users,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  deleteNotification,
  getPublishedNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  type NotificationIconKey,
  type NotificationItem,
  updateNotification,
  useNotifications,
} from "@/lib/notifications"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

function statusClassName(unread: boolean) {
  if (unread) return "bg-primary/10 text-primary hover:bg-primary/10"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

function typeStyles(type: NotificationItem["type"]) {
  if (type === "success") return "bg-primary/10 text-primary"
  if (type === "warning") return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
}

function iconFor(iconKey: NotificationIconKey) {
  if (iconKey === "file-text") return FileText
  if (iconKey === "users") return Users
  if (iconKey === "bell") return Bell
  return Megaphone
}

export default function NotifikasiAdminPage() {
  const { user } = useAuth()
  const notifications = useNotifications()
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null)
  const unreadCount = getUnreadNotificationsCount(notifications)
  const publishedCount = getPublishedNotifications(notifications).length

  function handleToggleRead(notification: NotificationItem) {
    updateNotification(notification.id, { unread: !notification.unread })
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Notification",
      action: `${notification.unread ? "Menandai dibaca" : "Menandai belum dibaca"} notifikasi ${notification.title}`,
      status: "Success",
    })
  }

  function handleTogglePublish(notification: NotificationItem) {
    updateNotification(notification.id, { published: !notification.published })
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Notification",
      action: `${notification.published ? "Menyimpan sebagai draft" : "Mempublikasikan"} notifikasi ${notification.title}`,
      status: "Success",
    })
  }

  function handleDelete(notification: NotificationItem) {
    setDeleteTarget(notification)
  }

  function confirmDelete() {
    if (!deleteTarget) return

    deleteNotification(deleteTarget.id)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Notification",
      action: `Menghapus notifikasi ${deleteTarget.title}`,
      status: "Warning",
    })
    setDeleteTarget(null)
  }

  function handleMarkAllAsRead() {
    markAllNotificationsAsRead()
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Notification",
      action: "Menandai semua notifikasi sebagai dibaca",
      status: "Success",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Bell className="h-4 w-4 text-primary" />
              Dashboard Notification Center
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Notifikasi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola notifikasi yang tampil pada dashboard utama pengguna PIINDUNG.
            </p>
          </div>
          <Button type="button" onClick={handleMarkAllAsRead} disabled={unreadCount === 0} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20">
            <CheckCircle2 className="h-4 w-4" />
            Tandai Semua Dibaca
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard icon={Bell} title="Total Notifikasi" value={String(notifications.length)} />
          <SummaryCard icon={Clock} title="Belum Dibaca" value={String(unreadCount)} />
          <SummaryCard icon={Megaphone} title="Dipublikasikan" value={String(publishedCount)} />
        </div>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Daftar Notifikasi</CardTitle>
            <CardDescription>Kelola status baca, publish, dan hapus notifikasi</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Bell className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Belum ada notifikasi</p>
                  <p className="mt-1 text-sm text-muted-foreground">Notifikasi yang dibuat admin akan muncul di daftar ini.</p>
                </div>
              ) : notifications.map((notification) => {
                const Icon = iconFor(notification.iconKey)

                return (
                  <div key={notification.id} className="p-4 lg:p-5 transition-colors hover:bg-muted/40">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeStyles(notification.type))}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2 className="text-sm font-semibold text-foreground">{notification.title}</h2>
                            <Badge className={cn("border-0", statusClassName(notification.unread))}>{notification.unread ? "Unread" : "Read"}</Badge>
                            <Badge variant="outline" className="capitalize">{notification.type}</Badge>
                            <Badge variant={notification.published ? "default" : "secondary"}>{notification.published ? "Published" : "Draft"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time} • {notification.date}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <ActionButton icon={Eye} label={notification.unread ? "Tandai Dibaca" : "Tandai Belum Dibaca"} onClick={() => handleToggleRead(notification)} />
                        <ActionButton icon={Megaphone} label={notification.published ? "Unpublish" : "Publish"} onClick={() => handleTogglePublish(notification)} />
                        <ActionButton icon={Trash2} label="Delete" destructive onClick={() => handleDelete(notification)} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Notifikasi"
        description={deleteTarget ? `Notifikasi \"${deleteTarget.title}\" akan dihapus dari dashboard pengguna.` : ""}
        confirmLabel="Hapus Notifikasi"
        destructive
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: typeof Bell; title: string; value: string }) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

function ActionButton({ icon: Icon, label, destructive, onClick }: { icon: typeof Eye; label: string; destructive?: boolean; onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-2 rounded-xl hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
        destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
