'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  MessageSquare,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { notificationData } from '@/lib/gorut/data'
import type { Notification, NotificationCategory } from '@/lib/gorut/types'
import { cn } from '@/lib/utils'

const categoryConfig: Partial<Record<NotificationCategory, { icon: typeof Bell; color: string; bgColor: string }>> = {
  pending_approval: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  pending_validation: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  target_achievement: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  failed_transaction: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10' },
  backup_status: { icon: Database, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
  whatsapp_gateway: { icon: MessageSquare, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
  whatsapp_status: { icon: MessageSquare, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
  monthly_report: { icon: Activity, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/10' },
  suspicious_login: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10' },
  storage_warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  successful_validation: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  rejected_transaction: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10' },
  plpk_inactive: { icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
  user_activity: { icon: Activity, color: 'text-muted-foreground', bgColor: 'bg-muted/40' },
}

function formatRelativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

function sortNotifications(notifications: Notification[]) {
  return [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(() => sortNotifications(notificationData))

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications])
  const latestNotifications = useMemo(() => notifications.slice(0, 5), [notifications])

  const handlePreviewClick = (id: string) => {
    setNotifications((current) =>
      sortNotifications(current.map((item) => (item.id === id ? { ...item, isRead: true } : item)))
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 text-muted-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-muted hover:text-foreground"
          aria-label="Notifikasi"
        >
          <Bell className="size-5 transition-transform duration-200" />
          {unreadCount > 0 && (
            <>
              <span className="absolute right-1 top-1 flex size-2.5 items-center justify-center">
                <span className="absolute inline-flex size-full rounded-full bg-emerald-400/70 animate-ping" />
                <span className="relative inline-flex size-2.5 rounded-full border border-background bg-emerald-500" />
              </span>
              <Badge
                className="absolute -right-1.5 -top-1.5 h-5 min-w-5 rounded-full border border-background bg-emerald-500 px-1.5 text-[10px] font-semibold text-white shadow-sm transition-all duration-200"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        collisionPadding={16}
        className="z-[80] w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-2xl border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur-xl data-[state=open]:duration-200 data-[state=closed]:duration-150 data-[side=bottom]:slide-in-from-top-1"
      >
        <div className="border-b border-border/60 bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Notifikasi</p>
              <p className="text-xs text-muted-foreground">Preview terbaru aktivitas penting</p>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 transition-colors duration-200 dark:text-emerald-400"
            >
              {unreadCount} belum dibaca
            </Badge>
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {latestNotifications.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center px-4 py-8 text-center">
              <Bell className="mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">Tidak ada notifikasi</p>
              <p className="text-xs text-muted-foreground">Semua aktivitas terbaru akan tampil di sini.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {latestNotifications.map((notification) => {
                const config = categoryConfig[notification.category] ?? {
                  icon: Bell,
                  color: 'text-muted-foreground',
                  bgColor: 'bg-muted/40',
                }
                const Icon = config.icon

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handlePreviewClick(notification.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-all duration-200 hover:border-border/60 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
                      !notification.isRead && 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.08]'
                    )}
                  >
                    <div className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl', config.bgColor)}>
                      <Icon className={cn('size-4', config.color)} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className={cn('line-clamp-1 text-sm font-medium text-foreground', !notification.isRead && 'pr-2')}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="mt-1 flex size-2 shrink-0 items-center justify-center">
                            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {notification.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-muted-foreground">{formatRelativeTime(notification.timestamp)}</span>
                        <span className="text-[11px] text-muted-foreground/80">
                          {!notification.isRead ? 'Baru' : 'Dibaca'}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-muted/10 p-2">
          <Button asChild variant="ghost" className="h-10 w-full justify-center rounded-xl text-sm font-medium transition-all duration-200 hover:bg-muted">
            <Link href="/gorut/notifikasi" onClick={() => setOpen(false)}>
              Lihat Semua
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
