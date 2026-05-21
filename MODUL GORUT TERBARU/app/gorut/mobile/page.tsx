'use client'

import { useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Smartphone,
  Bell,
  QrCode,
  Activity,
  RefreshCw,
  Download,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { exportReportToPdf } from '@/lib/gorut/export'

// Mock data
import {
  mockMobileSessions,
  mockMobileDevices,
  mockNotificationTemplates,
  mockNotificationAudiences,
  mockMobileAppStatus,
  mockQRMemberCards,
} from '@/lib/gorut/mobile-data'

// Components
import { MobileDevicesGrid } from '@/components/gorut/mobile-devices'
import {
  PushTemplatesGrid,
  NotificationAudienceCard,
  NotificationTestDialog,
} from '@/components/gorut/mobile-notifications'
import {
  QRMemberCardsGrid,
  QRScanReadyLayout,
  MemberQRStatusCard,
} from '@/components/gorut/mobile-qr'
import {
  MobileAppStatusPanel,
  MobileLoginActivityCard,
  DeviceHealthChart,
  LatestMobileActivityCard,
} from '@/components/gorut/mobile-app-status'

export default function MobileEcosystemPage() {
  const { toast } = useToast()
  const [sessions, setSessions] = useState(mockMobileSessions)
  const [selectedAudience, setSelectedAudience] = useState(mockNotificationAudiences[0].id)
  const [testNotificationOpen, setTestNotificationOpen] = useState(false)
  const [testTemplateId, setTestTemplateId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const stats = useMemo(() => ({
    totalDevices: mockMobileDevices.length,
    activeSessions: sessions.length,
    onlineNow: sessions.filter((s) => s.isOnline).length,
    trustedDevices: sessions.filter((s) => s.isTrusted).length,
    suspiciousDevices: sessions.filter((s) => s.status === 'suspicious').length,
  }), [sessions])

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId))
    toast({
      title: 'Session Revoked',
      description: 'Device session has been terminated.',
    })
  }

  const handleBlockDevice = (sessionId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'blocked' as const } : s
      )
    )
    toast({
      title: 'Device Blocked',
      description: 'Device has been blocked and session terminated.',
      variant: 'destructive',
    })
  }

  const handleMarkTrusted = (sessionId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, isTrusted: true } : s
      )
    )
    toast({
      title: 'Device Trusted',
      description: 'Device marked as trusted.',
    })
  }

  const handleSendTestNotification = (templateId: string) => {
    setTestTemplateId(templateId)
    setTestNotificationOpen(true)
  }

  const handleConfirmNotification = () => {
    toast({
      title: 'Test Notification Sent',
      description: `Test notification sent to ${mockNotificationAudiences.find((a) => a.id === selectedAudience)?.name}`,
    })
    setTestNotificationOpen(false)
  }

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1)
    toast({
      title: 'Refreshed',
      description: 'Mobile ecosystem data updated.',
    })
  }

  const handleExportPdf = () => {
    exportReportToPdf({
      title: 'Laporan Mobile Ecosystem GORUT',
      subtitle: 'Ringkasan devices, sessions, notification audiences, dan QR member coverage',
      summary: [
        { label: 'Total Devices', value: String(stats.totalDevices) },
        { label: 'Active Sessions', value: String(stats.activeSessions) },
        { label: 'Online Now', value: String(stats.onlineNow) },
        { label: 'Trusted Devices', value: String(stats.trustedDevices) },
      ],
      tables: [
        {
          title: 'Active Mobile Sessions',
          columns: ['Device', 'Type', 'Status', 'Trusted', 'Online', 'Location'],
          rows: sessions.map((item) => [item.deviceName, item.deviceType, item.status, item.isTrusted ? 'Yes' : 'No', item.isOnline ? 'Yes' : 'No', item.location]),
        },
        {
          title: 'Notification Audiences',
          columns: ['Audience', 'Count'],
          rows: mockNotificationAudiences.map((item) => [item.name, String(item.count)]),
        },
      ],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
    })
  }

  const selectedAudienceData = mockNotificationAudiences.find(
    (a) => a.id === selectedAudience
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Ekosistem Mobile</h1>
        <p className="text-muted-foreground text-sm">
          Kelola aplikasi mobile, perangkat, dan notifikasi untuk PLPK dan munfiq.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Refresh
        </Button>
        <Button onClick={handleExportPdf} variant="outline" size="sm" className="text-xs">
          <Download className="w-3.5 h-3.5 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Total Perangkat</p><p className="mt-2 text-2xl font-bold">{stats.totalDevices}</p></div>
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Sesi Aktif</p><p className="mt-2 text-2xl font-bold text-emerald-600">{stats.activeSessions}</p></div>
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Sedang Online</p><p className="mt-2 text-2xl font-bold text-blue-600">{stats.onlineNow}</p></div>
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Trusted</p><p className="mt-2 text-2xl font-bold text-violet-600">{stats.trustedDevices}</p></div>
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Suspicious</p><p className="mt-2 text-2xl font-bold text-amber-600">{stats.suspiciousDevices}</p></div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices" className="text-xs">
            <Smartphone className="w-4 h-4 mr-2" />
            Perangkat
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="w-4 h-4 mr-2" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-xs">
            <QrCode className="w-4 h-4 mr-2" />
            QR Anggota
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="text-xs">
            <Activity className="w-4 h-4 mr-2" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Sesi Mobile Aktif</h2>
            <MobileDevicesGrid
              sessions={sessions}
              onRevoke={handleRevokeSession}
              onBlock={handleBlockDevice}
              onMarkTrusted={handleMarkTrusted}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Statistik Perangkat</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                 <p className="text-sm text-muted-foreground mb-2">Total Perangkat</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats.totalDevices}
                </p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                 <p className="text-sm text-muted-foreground mb-2">Sesi Aktif</p>
                <p className="text-3xl font-bold text-blue-600">{stats.activeSessions}</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                 <p className="text-sm text-muted-foreground mb-2">Sedang Online</p>
                <p className="text-3xl font-bold text-slate-600">
                  {stats.onlineNow}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Template Push Notification</h2>
            <PushTemplatesGrid
              templates={mockNotificationTemplates}
              onSendTest={handleSendTestNotification}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Pilih Audience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockNotificationAudiences.map((audience) => (
                <NotificationAudienceCard
                  key={audience.id}
                  name={audience.name}
                  filters={audience.filters}
                  count={audience.count}
                  isSelected={selectedAudience === audience.id}
                  onSelect={() => setSelectedAudience(audience.id)}
                />
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">Audience Terpilih</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedAudienceData?.name} • {selectedAudienceData?.count} recipients</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* QR Tab */}
        <TabsContent value="qr" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">QR Kartu Anggota</h2>
            <QRMemberCardsGrid members={mockQRMemberCards} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Preview Layout Siap Scan QR</h2>
            <div className="flex justify-center py-6">
              <QRScanReadyLayout />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">QR Coverage Status</h2>
            <div className="max-w-md">
              <MemberQRStatusCard
                totalMembers={312}
                membersWithQR={287}
                scanCount={45}
              />
            </div>
            <div className="mt-4 rounded-lg border border-border bg-card p-4 max-w-md">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">QR readiness</p>
                  <p className="text-xs text-muted-foreground mt-1">287 dari 312 anggota sudah memiliki QR card dan 45 scan tercatat.</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6 mt-6">
          <div>
            <MobileAppStatusPanel status={mockMobileAppStatus} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MobileLoginActivityCard />
            <DeviceHealthChart />
          </div>

          <div>
            <LatestMobileActivityCard />
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Notification Dialog */}
      {testNotificationOpen && selectedAudienceData && (
        <Dialog open={testNotificationOpen} onOpenChange={setTestNotificationOpen}>
          <DialogContent>
            <NotificationTestDialog
              templateId={testTemplateId}
              audienceCount={selectedAudienceData.count}
              onSend={handleConfirmNotification}
              onCancel={() => setTestNotificationOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
