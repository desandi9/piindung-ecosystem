// Mobile App Status Monitoring Components
'use client'

import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Users,
  Smartphone,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileAppStatus } from '@/lib/gorut/mobile-types'

export function MobileAppStatusPanel({
  status,
}: {
  status: MobileAppStatus
}) {
  const getHealthStatus = () => {
    if (status.errorRate > 5) return { label: 'Critical', color: 'text-red-600' }
    if (status.errorRate > 2) return { label: 'Warning', color: 'text-amber-600' }
    return { label: 'Healthy', color: 'text-emerald-600' }
  }

  const health = getHealthStatus()

  return (
    <div className="border border-border rounded-lg p-4 bg-gradient-to-br from-emerald-600/5 to-emerald-600/0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Mobile App Status</h3>
            <p className="text-xs text-muted-foreground">Real-time metrics</p>
          </div>
        </div>
        <Badge className={cn('text-xs', health.color && `text-[${health.color}]`)}>
          {health.label}
        </Badge>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="border border-border rounded-lg p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Active Users</p>
          <p className="text-lg font-bold text-emerald-600">{status.activeUsers}</p>
          <p className="text-xs text-muted-foreground mt-1">+12 this hour</p>
        </div>

        <div className="border border-border rounded-lg p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Total Devices</p>
          <p className="text-lg font-bold text-blue-600">{status.totalDevices}</p>
          <p className="text-xs text-emerald-600 mt-1">
            {status.onlineDevices} online
          </p>
        </div>

        <div className="border border-border rounded-lg p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Avg Battery</p>
          <p className="text-lg font-bold text-amber-600">{status.avgBattery}%</p>
          <p className="text-xs text-muted-foreground mt-1">Device health</p>
        </div>

        <div className="border border-border rounded-lg p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Delivery Rate</p>
          <p className="text-lg font-bold text-emerald-600">
            {status.notificationDeliveryRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Notifications</p>
        </div>

        <div className="border border-border rounded-lg p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
          <p
            className={cn(
              'text-lg font-bold',
              status.errorRate > 2 ? 'text-red-600' : 'text-emerald-600'
            )}
          >
            {status.errorRate.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">System health</p>
        </div>

        <div className="border border-border rounded-lg p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Last Sync</p>
          <p className="text-lg font-bold text-slate-600">
            {Math.floor((Date.now() - status.lastSyncTime.getTime()) / 60000)}m
          </p>
          <p className="text-xs text-muted-foreground mt-1">ago</p>
        </div>
      </div>

      {/* Alerts */}
      {status.errorRate > 2 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500 rounded flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <p className="font-medium">Error rate elevated</p>
            <p className="mt-1">Consider investigating app logs</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function MobileLoginActivityCard() {
  const activities = [
    { time: 'Just now', user: 'Budi Santoso', device: 'iPhone 14 Pro', status: 'success' },
    { time: '12 minutes ago', user: 'Siti Nurhaliza', device: 'Samsung Galaxy A12', status: 'success' },
    { time: '2 hours ago', user: 'Ahmad Rifki', device: 'Xiaomi Redmi Note 11', status: 'success' },
    { time: '5 hours ago', user: 'Unknown', device: 'iPad', status: 'failed' },
  ]

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Mobile Login Activity</h3>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
            <div className="mt-0.5">
              {activity.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.user}</p>
              <p className="text-xs text-muted-foreground">{activity.device}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DeviceHealthChart() {
  const metrics = [
    { label: 'iOS Devices', value: 45, color: 'bg-slate-600' },
    { label: 'Android Devices', value: 67, color: 'bg-emerald-600' },
    { label: 'Healthy', value: 92, color: 'bg-emerald-500' },
    { label: 'Issues', value: 20, color: 'bg-amber-500' },
  ]

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <Smartphone className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Device Health Distribution</h3>
          <p className="text-xs text-muted-foreground">All registered devices</p>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <span className="text-sm font-medium">{metric.value}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(metric.color, 'h-full transition-all')}
                style={{ width: `${Math.min((metric.value / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LatestMobileActivityCard() {
  const activities = [
    {
      timestamp: new Date(Date.now() - 2 * 60000),
      type: 'sync',
      description: 'Data synchronized from 143 devices',
      icon: TrendingUp,
    },
    {
      timestamp: new Date(Date.now() - 15 * 60000),
      type: 'notification',
      description: 'Sent 245 push notifications',
      icon: Activity,
    },
    {
      timestamp: new Date(Date.now() - 1 * 3600000),
      type: 'update',
      description: 'App version 2.1.0 released',
      icon: Clock,
    },
  ]

  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="font-semibold text-sm mb-4">Latest Activity</h3>
      <div className="space-y-3">
        {activities.map((activity, idx) => {
          const Icon = activity.icon
          const minutes = Math.floor(
            (Date.now() - activity.timestamp.getTime()) / 60000
          )
          const timeStr = minutes < 1 ? 'Just now' : `${minutes}m ago`

          return (
            <div
              key={idx}
              className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
            >
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeStr}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
