'use client'

import { useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Download,
  Activity,
  LogIn,
  CheckCircle2,
  FileDown,
  Settings,
  Coins,
  Filter,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  User,
} from 'lucide-react'
import { activityLogData } from '@/lib/gorut/data'
import { exportReportToPdf } from '@/lib/gorut/export'
import { cn } from '@/lib/utils'

const actionConfig = {
  login: { label: 'Login', icon: LogIn, color: 'bg-blue-500/10 text-blue-600' },
  validasi: { label: 'Validasi', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600' },
  setoran: { label: 'Setoran', icon: Coins, color: 'bg-amber-500/10 text-amber-600' },
  export: { label: 'Export', icon: FileDown, color: 'bg-violet-500/10 text-violet-600' },
  settings: { label: 'Pengaturan', icon: Settings, color: 'bg-pink-500/10 text-pink-600' },
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDeviceIcon(device: string) {
  if (device.includes('Desktop')) return Monitor
  if (device.includes('iPhone') || device.includes('Android')) return Smartphone
  return Globe
}

export default function ActivityLogPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('semua')

  const filteredData = useMemo(() => {
    return activityLogData.filter((log) => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.detail.toLowerCase().includes(search.toLowerCase()) ||
        log.ipAddress.includes(search)
      
      const matchesAction = actionFilter === 'semua' || log.action === actionFilter
      
      return matchesSearch && matchesAction
    })
  }, [search, actionFilter])

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todayLogs = activityLogData.filter(l => new Date(l.timestamp).toDateString() === today).length
    const uniqueUsers = new Set(activityLogData.map(l => l.userId)).size
    const loginCount = activityLogData.filter(l => l.action === 'login').length
    return { total: activityLogData.length, today: todayLogs, uniqueUsers, loginCount }
  }, [])

  const handleExport = () => {
    exportReportToPdf({
      title: 'Laporan Log Aktivitas GORUT',
      subtitle: `${filteredData.length} aktivitas sesuai filter aktif`,
      summary: [
        { label: 'Total Aktivitas', value: String(stats.total) },
        { label: 'Hari Ini', value: String(stats.today) },
        { label: 'Pengguna Aktif', value: String(stats.uniqueUsers) },
        { label: 'Total Login', value: String(stats.loginCount) },
      ],
      tables: [{
        title: 'Daftar Log Aktivitas',
        columns: ['Waktu', 'Pengguna', 'Aktivitas', 'Detail', 'IP', 'Perangkat'],
        rows: filteredData.map((log) => [formatDateTime(log.timestamp), log.userName, actionConfig[log.action as keyof typeof actionConfig]?.label ?? log.action, log.detail, log.ipAddress, `${log.browser} / ${log.device}`]),
      }],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
    })
    toast({ variant: 'default', title: 'Export activity log siap', description: 'Laporan aktivitas dibuka di jendela print.' })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Log Aktivitas</h1>
          <p className="text-sm text-muted-foreground">Pantau seluruh aktivitas pengguna sistem</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="size-4" />
          Export Log
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Activity className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Aktivitas</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hari Ini</p>
              <p className="text-xl font-bold">{stats.today}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10">
              <User className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pengguna Aktif</p>
              <p className="text-xl font-bold">{stats.uniqueUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <LogIn className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Login</p>
              <p className="text-xl font-bold">{stats.loginCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-0 bg-card shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari user, aktivitas, atau IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipe Aktivitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua Aktivitas</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="validasi">Validasi</SelectItem>
                    <SelectItem value="setoran">Setoran</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="settings">Pengaturan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Waktu</TableHead>
                  <TableHead className="font-semibold">Pengguna</TableHead>
                  <TableHead className="font-semibold">Aktivitas</TableHead>
                  <TableHead className="font-semibold">Detail</TableHead>
                  <TableHead className="font-semibold">IP Address</TableHead>
                  <TableHead className="font-semibold">Perangkat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((log) => {
                  const config = actionConfig[log.action as keyof typeof actionConfig] || actionConfig.login
                  const DeviceIcon = getDeviceIcon(log.device)
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{formatDateTime(log.timestamp)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.userName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{log.userId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('gap-1', config.color)}>
                          <config.icon className="size-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-sm truncate">{log.detail}</p>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="size-4 text-muted-foreground" />
                          <div className="text-xs">
                            <p>{log.browser}</p>
                            <p className="text-muted-foreground">{log.device}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="size-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Tidak ada aktivitas yang ditemukan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
