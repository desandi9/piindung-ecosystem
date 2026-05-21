'use client'

import { useState, useMemo } from 'react'
import { Bell, X, Check, CheckCheck, Pin, Trash2, Search as SearchIcon, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { notificationData } from '@/lib/gorut/data'
import type { Notification } from '@/lib/gorut/types'

const categoryLabels: Record<string, string> = {
  pending_approval: 'Persetujuan Menunggu',
  target_achievement: 'Pencapaian Target',
  plpk_inactive: 'PLPK Tidak Aktif',
  failed_transaction: 'Transaksi Gagal',
  backup_status: 'Status Backup',
  whatsapp_gateway: 'WhatsApp Gateway',
  monthly_report: 'Laporan Bulanan',
  suspicious_login: 'Login Mencurigakan',
  storage_warning: 'Peringatan Storage',
  successful_validation: 'Validasi Berhasil',
  rejected_transaction: 'Transaksi Ditolak',
  user_activity: 'Aktivitas User',
}

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
  warning: { label: 'Warning', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  success: { label: 'Success', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  info: { label: 'Info', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
}

const priorityIcons: Record<string, React.ReactNode> = {
  critical: '⚠️',
  warning: '⚡',
  success: '✓',
  info: 'ℹ',
}

type NotificationWithState = Notification & { isPinnedLocal?: boolean }

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationWithState[]>(notificationData)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications])
  const criticalCount = useMemo(() => notifications.filter(n => n.priority === 'critical' && !n.isRead).length, [notifications])

  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.isRead)
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(n => n.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        categoryLabels[n.category].toLowerCase().includes(query)
      )
    }

    // Sort: pinned first, then by unread, then by priority, then by timestamp
    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1

      const priorityOrder: Record<
        Notification['priority'],
        number
      > = {
        urgent: 0,
        high: 1,
        critical: 2,
        warning: 3,
        medium: 4,
        low: 5,
        success: 6,
        info: 7,
      }

      const aRank = priorityOrder[a.priority]
      const bRank = priorityOrder[b.priority]
      if (aRank !== bRank) return aRank - bRank

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [notifications, showUnreadOnly, selectedCategory, searchQuery])

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handlePin = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n)
    )
  }

  const categories = useMemo(() => {
    const cats = new Set(notifications.map(n => n.category))
    return Array.from(cats)
  }, [notifications])

  const groupedNotifications = useMemo(() => {
    const grouped: Record<string, typeof filteredNotifications> = {}
    filteredNotifications.forEach(notif => {
      if (!grouped[notif.category]) {
        grouped[notif.category] = []
      }
      grouped[notif.category].push(notif)
    })
    return grouped
  }, [filteredNotifications])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9 text-muted-foreground hover:text-foreground">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <>
              <span className="absolute right-1 top-1 flex size-2 items-center justify-center">
                <span className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                  criticalCount > 0 ? 'bg-red-400' : 'bg-emerald-400'
                )} />
                <span className={cn(
                  'relative inline-flex size-2 rounded-full',
                  criticalCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
                )} />
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0 max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm p-4 sticky top-0 z-20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-foreground" />
              <h2 className="text-sm font-semibold">Smart Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {unreadCount} Baru
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" onClick={handleMarkAllAsRead} className="text-xs">
                <CheckCheck className="size-3 mr-1" />
                Tandai Semua
              </Button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari notifikasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant={showUnreadOnly ? 'default' : 'outline'}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className="text-xs gap-1"
            >
              <Filter className="size-3" />
              Belum Dibaca
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="px-4 py-2 border-b border-border/50 flex flex-wrap gap-1 bg-muted/30">
            <Button
              size="sm"
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className="text-xs h-7"
            >
              Semua
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="text-xs h-7"
              >
                {categoryLabels[cat]}
              </Button>
            ))}
          </div>
        )}

        {/* Notification List */}
        <div className="overflow-y-auto flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="size-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {Object.entries(groupedNotifications).map(([category, notifs]) => (
                <div key={category}>
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1 sticky top-0 bg-background/50">
                    {categoryLabels[category]}
                  </div>
                  {notifs.map(notif => (
                    <Card
                      key={notif.id}
                      className={cn(
                        'p-3 cursor-pointer transition-all duration-200',
                        notif.isRead ? 'opacity-60 hover:opacity-100' : 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10',
                        priorityConfig[notif.priority].bgColor,
                        'border'
                      )}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-lg mt-0.5 flex-shrink-0">
                          {priorityIcons[notif.priority]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={cn('text-sm font-semibold', !notif.isRead && 'text-foreground')}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {notif.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {notif.isPinned && <Pin className="size-3 text-amber-500 fill-amber-500" />}
                              {!notif.isRead && <span className="size-2 rounded-full bg-emerald-500" />}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(notif.timestamp).toLocaleString('id-ID')}
                            </span>
                            <div className="flex items-center gap-1">
                              {notif.actionUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-6 px-2 text-emerald-600 hover:text-emerald-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Action would navigate to actionUrl
                                  }}
                                >
                                  {notif.actionLabel || 'Buka'}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePin(notif.id)
                                }}
                              >
                                <Pin className={cn('size-3', notif.isPinned && 'fill-amber-500 text-amber-500')} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(notif.id)
                                }}
                              >
                                <Trash2 className="size-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-emerald-600 hover:text-emerald-700"
            >
              Lihat Semua Notifikasi
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
