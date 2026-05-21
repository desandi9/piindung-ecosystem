'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  XCircle,
  Database,
  MessageSquare,
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  Filter,
  Inbox,
  MailOpen,
  RotateCcw,
} from 'lucide-react'
import { notificationData } from '@/lib/gorut/data'
import type { Notification, NotificationCategory, NotificationPriority } from '@/lib/gorut/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type FilterCategory = 'semua' | NotificationCategory
type FilterRead = 'semua' | 'unread' | 'read'

const categoryConfig: Partial<Record<NotificationCategory, { label: string; icon: typeof Bell; color: string; bgColor: string }>> = {
  pending_approval: { label: 'Persetujuan Pending', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  target_achievement: { label: 'Pencapaian Target', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  plpk_inactive: { label: 'PLPK Tidak Aktif', icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
  failed_transaction: { label: 'Transaksi Gagal', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10' },
  backup_status: { label: 'Status Backup', icon: Database, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  whatsapp_gateway: { label: 'WhatsApp Gateway', icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-500/10' },
  monthly_report: { label: 'Laporan Bulanan', icon: Activity, color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
  suspicious_login: { label: 'Login Mencurigakan', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-500/10' },
  storage_warning: { label: 'Peringatan Penyimpanan', icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  successful_validation: { label: 'Validasi Berhasil', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  rejected_transaction: { label: 'Transaksi Ditolak', icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-500/10' },
  pending_validation: { label: 'Validasi Pending', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  whatsapp_status: { label: 'WhatsApp Status', icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-500/10' },
  user_activity: { label: 'Aktivitas User', icon: Activity, color: 'text-muted-foreground', bgColor: 'bg-muted/10' },
}

const priorityConfig: Partial<Record<NotificationPriority, { label: string; color: string; dotColor: string }>> = {
  info: { label: 'Info', color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
  success: { label: 'Sukses', color: 'text-emerald-600', dotColor: 'bg-emerald-500' },
  warning: { label: 'Peringatan', color: 'text-amber-600', dotColor: 'bg-amber-500' },
  critical: { label: 'Kritis', color: 'text-red-600', dotColor: 'bg-red-500' },
  low: { label: 'Rendah', color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
  medium: { label: 'Sedang', color: 'text-blue-600', dotColor: 'bg-blue-500' },
  high: { label: 'Tinggi', color: 'text-amber-600', dotColor: 'bg-amber-500' },
  urgent: { label: 'Urgent', color: 'text-red-600', dotColor: 'bg-red-500' },
}

function formatTimeAgo(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays < 7) return `${diffDays} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Notification Card Component
function NotificationCard({ 
  notification, 
  onRead, 
  onSelect 
}: { 
  notification: Notification
  onRead: (id: string) => void
  onSelect: (notification: Notification) => void
}) {
  const category = categoryConfig[notification.category] || {
    label: 'Unknown',
    icon: Bell,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
  }
  const priority = priorityConfig[notification.priority] || {
    label: 'Unknown',
    color: 'text-muted-foreground',
    dotColor: 'bg-muted-foreground',
  }
  const CategoryIcon = category.icon

  return (
    <div
      className={cn(
        'group relative flex gap-4 rounded-lg border p-4 transition-all cursor-pointer hover:bg-muted/50',
        !notification.isRead && 'bg-emerald-500/5 border-emerald-500/20'
      )}
      onClick={() => onSelect(notification)}
    >
      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 size-2 rounded-full bg-emerald-500" />
      )}

      {/* Icon */}
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', category.bgColor)}>
        <CategoryIcon className={cn('size-5', category.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={cn('font-medium truncate', !notification.isRead && 'text-foreground')}>
                {notification.title}
              </p>
              {notification.priority === 'urgent' || notification.priority === 'high' ? (
                <div className={cn('size-2 rounded-full shrink-0', priority.dotColor)} />
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="outline" className={cn('text-xs', category.color)}>
            {category.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.timestamp)}</span>
        </div>
      </div>

      {/* Mark as Read Button */}
      {!notification.isRead && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onRead(notification.id)
          }}
        >
          <Check className="size-4" />
        </Button>
      )}
    </div>
  )
}

export default function NotifikasiPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState(notificationData)
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('semua')
  const [readFilter, setReadFilter] = useState<FilterRead>('semua')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesCategory = categoryFilter === 'semua' || notif.category === categoryFilter
      const matchesRead = readFilter === 'semua' || 
        (readFilter === 'unread' && !notif.isRead) || 
        (readFilter === 'read' && notif.isRead)
      return matchesCategory && matchesRead
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [notifications, categoryFilter, readFilter])

  const stats = useMemo(() => {
    const unread = notifications.filter(n => !n.isRead).length
    const urgent = notifications.filter(n => !n.isRead && (n.priority === 'urgent' || n.priority === 'high')).length
    const byCategory: Record<string, number> = {
      pending_validation: notifications.filter(n => !n.isRead && n.category === 'pending_validation').length,
      successful_validation: notifications.filter(n => !n.isRead && n.category === 'successful_validation').length,
      rejected_transaction: notifications.filter(n => !n.isRead && n.category === 'rejected_transaction').length,
      backup_status: notifications.filter(n => !n.isRead && n.category === 'backup_status').length,
      user_activity: notifications.filter(n => !n.isRead && n.category === 'user_activity').length,
      whatsapp_status: notifications.filter(n => !n.isRead && n.category === 'whatsapp_status').length,
      pending_approval: notifications.filter(n => !n.isRead && n.category === 'pending_approval').length,
      whatsapp_gateway: notifications.filter(n => !n.isRead && n.category === 'whatsapp_gateway').length,
    }
    return { unread, urgent, byCategory, total: notifications.length }
  }, [notifications])

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const handleMarkAsUnread = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    toast({ variant: 'default', title: 'Semua notifikasi dibaca', description: 'Inbox sudah dirapikan.' })
  }

  const handleSelectNotification = (notification: Notification) => {
    setSelectedNotification(notification)
    setSheetOpen(true)
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pusat Notifikasi</h1>
          <p className="text-sm text-muted-foreground">Pantau semua aktivitas dan pemberitahuan sistem</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.unread > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
              <MailOpen className="size-4" />
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Bell className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Belum Dibaca</p>
              <p className="text-xl font-bold">{stats.unread}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prioritas Tinggi</p>
              <p className="text-xl font-bold">{stats.urgent}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validasi Pending</p>
              <p className="text-xl font-bold">{stats.byCategory.pending_validation}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Inbox className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Notifikasi</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter Pills */}
      <Card className="border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Filter Kategori</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('semua')}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all hover:bg-muted',
                categoryFilter === 'semua' && 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
              )}
            >
              Semua
              {stats.unread > 0 && (
                <Badge className="bg-emerald-500 text-white text-xs h-5 px-1.5">{stats.unread}</Badge>
              )}
            </button>
            {(Object.keys(categoryConfig) as NotificationCategory[]).map((cat) => {
              const config =
                categoryConfig[cat] || {
                  label: 'Unknown',
                  icon: Bell,
                  color: 'text-muted-foreground',
                  bgColor: 'bg-muted/10',
                }
              const count = stats.byCategory[cat] || 0

              const Icon = config.icon

              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all hover:bg-muted',
                    categoryFilter === cat && 'border-emerald-500 bg-emerald-500/10'
                  )}
                >
                  <Icon className={cn('size-3.5', config.color)} />
                  <span className="hidden sm:inline">{config.label}</span>
                  {count > 0 && (
                    <Badge
                      className={cn(
                        'text-xs h-5 px-1.5',
                        config.bgColor,
                        config.color
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="border-0 bg-card shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">
              Notifikasi 
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredNotifications.length})
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={readFilter} onValueChange={(v) => setReadFilter(v as FilterRead)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua</SelectItem>
                  <SelectItem value="unread">Belum Dibaca</SelectItem>
                  <SelectItem value="read">Sudah Dibaca</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                  onSelect={handleSelectNotification}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="size-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Tidak ada notifikasi</p>
              <p className="text-sm text-muted-foreground/70">Coba ubah filter untuk melihat notifikasi lainnya</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedNotification && (
            <>
              <SheetHeader>
                <SheetTitle>Detail Notifikasi</SheetTitle>
                <SheetDescription>{formatDateTime(selectedNotification.timestamp)}</SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Category & Priority */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const catCfg =
                      categoryConfig[selectedNotification.category] || {
                        label: 'Unknown',
                        icon: Bell,
                        color: 'text-muted-foreground',
                        bgColor: 'bg-muted/10',
                      }
                    const prCfg =
                      priorityConfig[selectedNotification.priority] || {
                        label: 'Unknown',
                        color: 'text-muted-foreground',
                        dotColor: 'bg-muted-foreground',
                      }

                    return (
                      <>
                        <Badge className={cn(catCfg.bgColor, catCfg.color)}>
                          {catCfg.label}
                        </Badge>
                        <Badge variant="outline" className={prCfg.color}>
                          {prCfg.label}
                        </Badge>
                      </>
                    )
                  })()}
                </div>

                {/* Title */}
                <div>
                  <p className="text-lg font-semibold">{selectedNotification.title}</p>
                </div>

                {/* Message */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed">{selectedNotification.message}</p>
                </div>

                {/* Action Button */}
                {selectedNotification.actionUrl && (
                  <div className="space-y-2">
                    <Link href={selectedNotification.actionUrl}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Lihat Detail
                        <ChevronRight className="size-4 ml-2" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (selectedNotification.isRead) {
                          handleMarkAsUnread(selectedNotification.id)
                          toast({ variant: 'default', title: 'Ditandai belum dibaca', description: 'Notifikasi dikembalikan ke inbox prioritas.' })
                        } else {
                          handleMarkAsRead(selectedNotification.id)
                          toast({ variant: 'default', title: 'Ditandai dibaca', description: 'Status notifikasi diperbarui.' })
                        }
                      }}
                    >
                      <RotateCcw className="mr-2 size-4" />
                      {selectedNotification.isRead ? 'Tandai Belum Dibaca' : 'Tandai Dibaca'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
