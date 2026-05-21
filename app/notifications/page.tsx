"use client"

import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
  Users,
} from "lucide-react"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { Navbar } from "@/components/piindung/navbar"
import {
  getPublishedNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  type NotificationIconKey,
  useNotifications,
} from "@/lib/notifications"
import { cn } from "@/lib/utils"

function iconFor(iconKey: NotificationIconKey) {
  if (iconKey === "credit-card") return CreditCard
  if (iconKey === "file-text") return FileText
  if (iconKey === "users") return Users
  if (iconKey === "alert-circle") return AlertCircle
  return Bell
}

export default function NotificationsPage() {
  const notifications = getPublishedNotifications(useNotifications())
  const unreadCount = getUnreadNotificationsCount(notifications)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 lg:px-8 py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
              Notifikasi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllNotificationsAsRead} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2e8b57] hover:bg-[#2e8b57]/10 rounded-xl transition-colors">
              <CheckCheck className="h-4 w-4" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {notifications.map((notification, index) => (
            (() => {
              const Icon = iconFor(notification.iconKey)

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 p-4 lg:p-5 transition-colors hover:bg-accent/50",
                    notification.unread && "bg-[#2e8b57]/5",
                    index !== notifications.length - 1 && "border-b border-border"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    notification.type === "success" && "bg-[#2e8b57]/10",
                    notification.type === "info" && "bg-blue-500/10",
                    notification.type === "warning" && "bg-amber-500/10"
                  )}>
                    <Icon className={cn(
                  "h-5 w-5",
                  notification.type === "success" && "text-[#2e8b57]",
                  notification.type === "info" && "text-blue-500",
                  notification.type === "warning" && "text-amber-500"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "text-sm text-foreground",
                            notification.unread ? "font-semibold" : "font-medium"
                          )}>
                            {notification.title}
                          </h3>
                          {notification.unread && (
                            <span className="w-2 h-2 bg-[#2e8b57] rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {notification.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground/70">{notification.time}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {notification.unread ? (
                      <span className="px-2 py-1 text-xs font-medium bg-[#2e8b57]/10 text-[#2e8b57] rounded-full">Baru</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">Dibaca</span>
                    )}
                  </div>
                </div>
              )
            })()
          ))}
        </div>
      </main>
      <SimpleFooter />
    </div>
  )
}
