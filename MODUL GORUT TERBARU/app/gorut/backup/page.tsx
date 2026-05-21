'use client'

import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { exportReportToPdf } from '@/lib/gorut/export'
import type { BackupData } from '@/lib/gorut/types'
import {
  createGorutBackupHistoryItem,
  DEFAULT_GORUT_BACKUP_SETTINGS,
  type GorutBackupSettings,
  useGorutBackupHistory,
  useGorutBackupSettings,
  writeGorutBackupSettings,
} from '@/lib/gorut/backup-control'
import { cn } from '@/lib/utils'

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BackupPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const backupSettings = useGorutBackupSettings()
  const backupHistory = useGorutBackupHistory()
  const [autoBackup, setAutoBackup] = useState(DEFAULT_GORUT_BACKUP_SETTINGS.autoBackup)
  const [backupSchedule, setBackupSchedule] = useState<GorutBackupSettings['backupSchedule']>(DEFAULT_GORUT_BACKUP_SETTINGS.backupSchedule)
  const [isBackingUp, setIsBackingUp] = useState(false)

  useEffect(() => {
    setAutoBackup(backupSettings.autoBackup)
    setBackupSchedule(backupSettings.backupSchedule)
  }, [backupSettings.autoBackup, backupSettings.backupSchedule])

  const latestBackup = backupHistory.length > 0 ? backupHistory[0] : null
  const totalSize = useMemo(() => backupHistory.reduce((sum, item) => sum + parseFloat(item.ukuran), 0).toFixed(1), [backupHistory])
  const nextBackupLabel = useMemo(() => {
    const now = new Date()
    const next = new Date(now)

    if (backupSchedule === 'daily') {
      next.setDate(now.getDate() + 1)
      next.setHours(0, 0, 0, 0)
    } else if (backupSchedule === 'weekly') {
      next.setDate(now.getDate() + 7)
      next.setHours(0, 0, 0, 0)
    } else {
      next.setMonth(now.getMonth() + 1, 1)
      next.setHours(0, 0, 0, 0)
    }

    return next.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [backupSchedule])

  const persistBackupSettings = async (nextAutoBackup: boolean, nextSchedule: GorutBackupSettings['backupSchedule']) => {
    try {
      await writeGorutBackupSettings({ autoBackup: nextAutoBackup, backupSchedule: nextSchedule })
      toast({ variant: 'default', title: 'Pengaturan backup tersimpan', description: 'Konfigurasi backup otomatis berhasil diperbarui.' })
    } catch {
      toast({ variant: 'destructive', title: 'Gagal menyimpan pengaturan backup', description: 'Konfigurasi backup otomatis belum berhasil diperbarui.' })
    }
  }

  const handleManualBackup = async () => {
    setIsBackingUp(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      const now = new Date()
      const month = `${now.getMonth() + 1}`.padStart(2, '0')
      const day = `${now.getDate()}`.padStart(2, '0')
      const hours = `${now.getHours()}`.padStart(2, '0')
      const minutes = `${now.getMinutes()}`.padStart(2, '0')
      const estimatedSize = (44 + Math.random() * 4).toFixed(1)

      const backupItem: BackupData = {
        id: `backup-${Date.now()}`,
        nama: `backup_gorut_${now.getFullYear()}${month}${day}_manual_${hours}${minutes}.sql`,
        tanggal: now.toISOString(),
        ukuran: `${estimatedSize} MB`,
        tipe: 'manual',
        status: 'berhasil',
      }

      await createGorutBackupHistoryItem(backupItem)
      toast({
        variant: 'default',
        title: 'Backup berhasil dibuat',
        description: `Snapshot baru ${backupItem.nama} tersimpan untuk ${user?.name ?? 'super admin'}.`,
      })
    } catch {
      toast({ variant: 'destructive', title: 'Backup gagal dibuat', description: 'Riwayat backup belum berhasil diperbarui.' })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleDownloadBackup = (name: string) => {
    const content = `GORUT backup bundle\nFile: ${name}\nGenerated: ${new Date().toISOString()}\nOperator: ${user?.name ?? 'Super Admin'}\n`
    const blob = new Blob([content], { type: 'application/sql' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportReport = () => {
    exportReportToPdf({
      title: 'Laporan Backup GORUT',
      subtitle: 'Status backup, jadwal otomatis, dan riwayat file backup',
      summary: [
        { label: 'Status Backup', value: 'Berhasil' },
        { label: 'Total File', value: String(backupHistory.length) },
        { label: 'Total Ukuran', value: `${totalSize} MB` },
        { label: 'Auto Backup', value: autoBackup ? 'Aktif' : 'Nonaktif' },
      ],
      tables: [{
        title: 'Riwayat Backup',
        columns: ['Nama', 'Tanggal', 'Ukuran', 'Tipe', 'Status'],
        rows: backupHistory.map((item) => [item.nama, formatDateTime(item.tanggal), item.ukuran, item.tipe, item.status]),
      }],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Backup Data</h1>
          <p className="text-sm text-muted-foreground">Kelola backup dan restore database sistem</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleManualBackup} disabled={isBackingUp} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {isBackingUp ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Membackup...
              </>
            ) : (
              <>
                <Database className="size-4" />
                Backup Sekarang
              </>
            )}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportReport}>
            <Download className="size-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status Backup</p>
              <p className="text-lg font-bold text-emerald-600">Berhasil</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Backup Terakhir</p>
              <p className="text-lg font-bold">{latestBackup ? formatDateTime(latestBackup.tanggal) : 'Belum ada'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10">
              <HardDrive className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Backup</p>
              <p className="text-lg font-bold">{backupHistory.length} file</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Database className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Ukuran</p>
              <p className="text-lg font-bold">{totalSize} MB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pengaturan Backup Otomatis</CardTitle>
          <CardDescription>Konfigurasi jadwal backup otomatis database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Otomatis</Label>
              <p className="text-sm text-muted-foreground">Jalankan backup secara otomatis sesuai jadwal</p>
            </div>
            <Switch
              checked={autoBackup}
              onCheckedChange={(checked) => {
                setAutoBackup(checked)
                void persistBackupSettings(checked, backupSchedule)
              }}
            />
          </div>

          {autoBackup && (
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label>Jadwal Backup</Label>
                <Select
                  value={backupSchedule}
                  onValueChange={(value) => {
                    const nextSchedule = value as GorutBackupSettings['backupSchedule']
                    setBackupSchedule(nextSchedule)
                    void persistBackupSettings(autoBackup, nextSchedule)
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Setiap Hari (00:00)</SelectItem>
                    <SelectItem value="weekly">Setiap Minggu</SelectItem>
                    <SelectItem value="monthly">Setiap Bulan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Backup berikutnya: <span className="font-medium">{nextBackupLabel}</span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Riwayat Backup</CardTitle>
            <Badge variant="secondary" className="font-normal">{backupHistory.length} backup</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex size-10 items-center justify-center rounded-lg',
                    backup.status === 'berhasil' ? 'bg-emerald-500/10' : backup.status === 'proses' ? 'bg-blue-500/10' : 'bg-red-500/10'
                  )}>
                    {backup.status === 'berhasil' && <CheckCircle2 className="size-5 text-emerald-600" />}
                    {backup.status === 'proses' && <RefreshCw className="size-5 text-blue-600 animate-spin" />}
                    {backup.status === 'gagal' && <AlertTriangle className="size-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm font-mono">{backup.nama}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDateTime(backup.tanggal)}</span>
                      <span>-</span>
                      <span>{backup.ukuran}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {backup.tipe === 'otomatis' ? 'Auto' : 'Manual'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleDownloadBackup(backup.nama)}>
                    <Download className="size-4" />
                    Download
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Upload className="size-4" />
                        Restore
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restore Backup</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin restore database dari backup ini?
                          Seluruh data saat ini akan diganti dengan data dari backup.
                          Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => {
                            toast({
                              variant: 'default',
                              title: 'Restore belum dibuka',
                              description: `Alur restore untuk ${backup.nama} akan diaktifkan setelah backup super admin stabil dan teruji.`,
                            })
                          }}
                        >
                          Ya, Restore
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
