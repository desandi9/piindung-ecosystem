// Mobile Ecosystem Components
'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Smartphone,
  Wifi,
  WifiOff,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Battery,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileSession, DeviceStatus } from '@/lib/gorut/mobile-types'

export function MobileDeviceCard({
  session,
  onRevoke,
  onBlock,
  onMarkTrusted,
}: {
  session: MobileSession
  onRevoke: (id: string) => void
  onBlock: (id: string) => void
  onMarkTrusted: (id: string) => void
}) {
  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-700'
      case 'idle':
        return 'bg-amber-500/10 text-amber-700'
      case 'suspicious':
        return 'bg-red-500/10 text-red-700'
      case 'blocked':
        return 'bg-slate-500/10 text-slate-700'
    }
  }

  const getStatusLabel = (status: DeviceStatus) => {
    const labels: Record<DeviceStatus, string> = {
      active: 'Active',
      idle: 'Idle',
      suspicious: 'Suspicious',
      blocked: 'Blocked',
    }
    return labels[status]
  }

  const formatTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Smartphone className="w-5 h-5 text-foreground/60" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{session.deviceName}</h3>
            <p className="text-xs text-muted-foreground">{session.deviceType}</p>
          </div>
        </div>
        <Badge className={cn('text-xs', getStatusColor(session.status))}>
          {getStatusLabel(session.status)}
        </Badge>
      </div>

      <div className="space-y-2 mb-4 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {session.isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                Offline
              </>
            )}
          </span>
          <span>v{session.appVersion}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Last login: {formatTime(session.lastLogin)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{session.location}</span>
        </div>
        {session.batteryLevel !== undefined && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Battery className="w-3.5 h-3.5" />
            <span>{session.batteryLevel}%</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {session.status === 'suspicious' ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              onClick={() => onBlock(session.id)}
            >
              <Lock className="w-3 h-3 mr-1" />
              Block
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onRevoke(session.id)}
            >
              Revoke
            </Button>
          </>
        ) : (
          <>
            {!session.isTrusted && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => onMarkTrusted(session.id)}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Trust
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onRevoke(session.id)}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function MobileDevicesGrid({
  sessions,
  onRevoke,
  onBlock,
  onMarkTrusted,
}: {
  sessions: MobileSession[]
  onRevoke: (id: string) => void
  onBlock: (id: string) => void
  onMarkTrusted: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessions.map((session) => (
        <MobileDeviceCard
          key={session.id}
          session={session}
          onRevoke={onRevoke}
          onBlock={onBlock}
          onMarkTrusted={onMarkTrusted}
        />
      ))}
    </div>
  )
}

export function DeviceActivityTimeline({ deviceId }: { deviceId: string }) {
  // In a real app, this would fetch activity for the specific device
  return (
    <div className="space-y-3">
      {[
        {
          action: 'login',
          label: 'User logged in',
          time: 'Now',
          icon: CheckCircle2,
        },
        {
          action: 'sync',
          label: 'Data synchronized',
          time: '2 minutes ago',
          icon: Clock,
        },
        {
          action: 'login',
          label: 'Previous login',
          time: 'Yesterday at 10:30 AM',
          icon: CheckCircle2,
        },
      ].map((item, idx) => {
        const Icon = item.icon
        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Icon className="w-4 h-4 text-emerald-600" />
              {idx < 2 && <div className="w-0.5 h-6 bg-border mt-1" />}
            </div>
            <div className="pb-2">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
