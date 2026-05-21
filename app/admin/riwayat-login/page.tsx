"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  History,
  LogIn,
  LogOut,
  Monitor,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ACTIVITY_LOG_EVENT,
  readActivityLogs,
  type ActivityLogItem,
  type ActivityStatus,
  type LoginActionType,
} from "@/lib/activity-log"
import { cn } from "@/lib/utils"

const actionOptions = ["Semua", "Login", "Logout"]
const statusOptions = ["Semua", "Success", "Warning", "Failed"]

function statusClassName(status: ActivityStatus) {
  if (status === "Success") return "bg-primary/10 text-primary hover:bg-primary/10"
  if (status === "Warning") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
  return "bg-destructive/10 text-destructive hover:bg-destructive/10"
}

function loginActionClassName(action: LoginActionType | undefined) {
  if (action === "Logout") return "bg-muted text-muted-foreground hover:bg-muted"
  return "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
}

export default function RiwayatLoginPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAction, setSelectedAction] = useState("Semua")
  const [selectedStatus, setSelectedStatus] = useState("Semua")
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

  const loginLogs = useMemo(() => logs.filter((log) => log.type === "Login"), [logs])

  const filteredLogs = useMemo(() => {
    return loginLogs.filter((log) => {
      const searchText = `${log.userName} ${log.action} ${log.device ?? ""} ${log.roleLabel ?? ""}`.toLowerCase()
      const matchesSearch = searchText.includes(deferredSearch.toLowerCase())
      const matchesAction = selectedAction === "Semua" || log.loginAction === selectedAction
      const matchesStatus = selectedStatus === "Semua" || log.status === selectedStatus

      return matchesSearch && matchesAction && matchesStatus
    })
  }, [deferredSearch, loginLogs, selectedAction, selectedStatus])

  const totalLogin = loginLogs.filter((log) => log.loginAction === "Login").length
  const totalLogout = loginLogs.filter((log) => log.loginAction === "Logout").length
  const successfulLogs = loginLogs.filter((log) => log.status === "Success").length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4 text-primary" />
            Audit Login Dashboard
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Riwayat Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau login, logout, device/browser, role, dan waktu akses admin secara realtime.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <SummaryCard icon={History} title="Total Aktivitas" value={String(loginLogs.length)} />
          <SummaryCard icon={LogIn} title="Total Login" value={String(totalLogin)} />
          <SummaryCard icon={LogOut} title="Total Logout" value={String(totalLogout)} />
          <SummaryCard icon={ShieldCheck} title="Login Berhasil" value={String(successfulLogs)} />
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 lg:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari nama, role, device, aktivitas..."
                  className="h-10 rounded-xl bg-muted/50 pl-9"
                />
              </div>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/50">
                  <RotateCcw className="h-4 w-4" />
                  <SelectValue placeholder="Filter aksi" />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((action) => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/50">
                  <ShieldCheck className="h-4 w-4" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Daftar Riwayat Login</CardTitle>
            <CardDescription>Data login/logout otomatis dari proses autentikasi dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLogs.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <LoginHistoryItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <History className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Riwayat login tidak ditemukan</p>
                <p className="mt-1 text-sm text-muted-foreground">Coba ubah keyword atau filter login history.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ringkasan Keamanan</CardTitle>
            <CardDescription>Snapshot cepat perilaku autentikasi admin dari log yang tersedia.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Login Gagal</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{loginLogs.filter((log) => log.status === "Failed").length}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">User Unik</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{new Set(loginLogs.map((log) => log.userName)).size}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Device Terdeteksi</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{new Set(loginLogs.map((log) => log.device).filter(Boolean)).size}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 lg:p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}

function LoginHistoryItem({ log }: { log: ActivityLogItem }) {
  const ActionIcon = log.loginAction === "Logout" ? LogOut : LogIn

  return (
    <div className="p-4 lg:p-5 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ActionIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">{log.userName}</h2>
              {log.loginAction ? (
                <Badge className={cn("border-0", loginActionClassName(log.loginAction))}>{log.loginAction}</Badge>
              ) : null}
              {log.roleLabel ? <Badge variant="outline">{log.roleLabel}</Badge> : null}
              <Badge className={cn("border-0", statusClassName(log.status))}>{log.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{log.action}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{log.dateTime}</span>
              {log.device ? (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5" />
                    {log.device}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
