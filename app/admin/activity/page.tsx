"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Download,
  FileText,
  Filter,
  ImageIcon,
  LogIn,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ACTIVITY_LOG_EVENT,
  clearActivityLogs,
  exportActivityLogs,
  readActivityLogs,
  type ActivityLogItem,
  type ActivityStatus,
  type ActivityType,
} from "@/lib/activity-log"

const typeOptions = ["Semua", "Login", "Settings", "User", "Article/Banner", "System", "Permission"]
const statusOptions = ["Semua", "Success", "Warning", "Failed"]
const auditOptions = ["Semua", "Upload Optimizer"]

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function typeIcon(type: ActivityType) {
  if (type === "Login") return LogIn
  if (type === "Settings") return Settings
  if (type === "User") return User
  if (type === "Article/Banner") return FileText
  if (type === "Permission") return ShieldCheck
  return Activity
}

function statusClassName(status: ActivityStatus) {
  if (status === "Success") return "bg-primary/10 text-primary hover:bg-primary/10"
  if (status === "Warning") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
  return "bg-destructive/10 text-destructive hover:bg-destructive/10"
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("Semua")
  const [selectedStatus, setSelectedStatus] = useState("Semua")
  const [selectedAudit, setSelectedAudit] = useState("Semua")
  const deferredSearch = useDeferredValue(searchQuery)

  useEffect(() => {
    setLogs(readActivityLogs())

    function handleLogUpdated(event: Event) {
      const customEvent = event as CustomEvent<ActivityLogItem[]>
      setLogs(customEvent.detail ?? readActivityLogs())
    }

    function handleStorageUpdated(event: StorageEvent) {
      if (event.key === "piindung-activity-log") setLogs(readActivityLogs())
    }

    window.addEventListener(ACTIVITY_LOG_EVENT, handleLogUpdated)
    window.addEventListener("storage", handleStorageUpdated)

    return () => {
      window.removeEventListener(ACTIVITY_LOG_EVENT, handleLogUpdated)
      window.removeEventListener("storage", handleStorageUpdated)
    }
  }, [])

  const uploadOptimizerLogs = useMemo(
    () => logs.filter((log) => Boolean(log.optimizationMetrics)),
    [logs]
  )

  const totalUploadSavedBytes = useMemo(
    () => uploadOptimizerLogs.reduce((total, log) => total + (log.optimizationMetrics?.savedBytes ?? 0), 0),
    [uploadOptimizerLogs]
  )

  const averageUploadSavedPercent = useMemo(() => {
    if (uploadOptimizerLogs.length === 0) return 0
    return Math.round(
      uploadOptimizerLogs.reduce((total, log) => total + (log.optimizationMetrics?.savedPercent ?? 0), 0) / uploadOptimizerLogs.length
    )
  }, [uploadOptimizerLogs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchText = `${log.userName} ${log.action} ${log.type} ${log.device ?? ""} ${log.roleLabel ?? ""}`.toLowerCase()
      const matchesSearch = searchText.includes(deferredSearch.toLowerCase())
      const matchesType = selectedType === "Semua" || log.type === selectedType
      const matchesStatus = selectedStatus === "Semua" || log.status === selectedStatus
      const matchesAudit = selectedAudit === "Semua" || (selectedAudit === "Upload Optimizer" && Boolean(log.optimizationMetrics))

      return matchesSearch && matchesType && matchesStatus && matchesAudit
    })
  }, [logs, deferredSearch, selectedType, selectedStatus, selectedAudit])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4 text-primary" />
              Audit Sistem PIINDUNG
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Activity Log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pantau login, perubahan pengaturan, aktivitas user, update artikel/banner, dan perubahan sistem secara realtime.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => exportActivityLogs(filteredLogs)}>
              <Download className="h-4 w-4" />
              Export Log
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive" onClick={clearActivityLogs}>
              <Trash2 className="h-4 w-4" />
              Clear Log
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <SummaryCard icon={Activity} title="Total Aktivitas" value={String(logs.length)} />
          <SummaryCard icon={LogIn} title="Login Activity" value={String(logs.filter((log) => log.type === "Login").length)} />
          <SummaryCard icon={Settings} title="System Changes" value={String(logs.filter((log) => log.type === "Settings" || log.type === "System").length)} />
          <SummaryCard icon={ShieldCheck} title="Permission Changes" value={String(logs.filter((log) => log.type === "Permission").length)} />
          <SummaryCard icon={ImageIcon} title="Upload Savings" value={uploadOptimizerLogs.length > 0 ? `${formatBytes(totalUploadSavedBytes)}` : "0 B"} description={uploadOptimizerLogs.length > 0 ? `Dari ${uploadOptimizerLogs.length} upload, rata-rata hemat ${averageUploadSavedPercent}%` : "Belum ada audit optimasi upload"} />
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 lg:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px_210px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari user, aktivitas, device..."
                  className="h-10 rounded-xl bg-muted/50 pl-9"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/50">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter tipe" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/50">
                  <RotateCcw className="h-4 w-4" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedAudit} onValueChange={setSelectedAudit}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/50">
                  <ImageIcon className="h-4 w-4" />
                  <SelectValue placeholder="Filter audit" />
                </SelectTrigger>
                <SelectContent>
                  {auditOptions.map((audit) => <SelectItem key={audit} value={audit}>{audit}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Riwayat Aktivitas</CardTitle>
            <CardDescription>Daftar log otomatis dari aksi admin dan sistem</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLogs.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <ActivityItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Activity className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Log tidak ditemukan</p>
                <p className="text-sm text-muted-foreground mt-1">Coba ubah keyword atau filter activity log.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value, description }: { icon: LucideIcon; title: string; value: string; description?: string }) {
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
        {description ? <p className="mt-2 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  )
}

function ActivityItem({ log }: { log: ActivityLogItem }) {
  const Icon = typeIcon(log.type)

  return (
    <div className="p-4 lg:p-5 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">{log.userName}</h2>
              <Badge variant="outline">{log.type}</Badge>
              {log.roleLabel ? <Badge variant="outline">{log.roleLabel}</Badge> : null}
              <Badge className={cn("border-0", statusClassName(log.status))}>{log.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{log.action}</p>
            {log.optimizationMetrics ? (
              <p className="mt-2 text-xs text-primary">
                Optimized {formatBytes(log.optimizationMetrics.originalSize)} {"->"} {formatBytes(log.optimizationMetrics.optimizedSize)}
                {` • Hemat ${log.optimizationMetrics.savedPercent}%`}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">{log.dateTime}{log.device ? ` • ${log.device}` : ""}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
