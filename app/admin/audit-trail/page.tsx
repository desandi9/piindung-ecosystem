"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import {
  Activity,
  Download,
  FileText,
  Filter,
  FolderOpen,
  Megaphone,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
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
} from "@/lib/activity-log"

type AuditDomain = "Konten Publik" | "Komunikasi" | "Pengguna & Akses" | "Sistem" | "Operasional"

interface AuditItem extends ActivityLogItem {
  domain: AuditDomain
  entity: string
}

const domainOptions: Array<AuditDomain | "Semua"> = ["Semua", "Konten Publik", "Komunikasi", "Pengguna & Akses", "Sistem", "Operasional"]
const statusOptions: Array<ActivityStatus | "Semua"> = ["Semua", "Success", "Warning", "Failed"]

function deriveAuditMetadata(log: ActivityLogItem): Pick<AuditItem, "domain" | "entity"> {
  const action = log.action.toLowerCase()

  if (action.includes("artikel") || action.includes("banner") || action.includes("popup") || action.includes("galeri") || action.includes("download") || action.includes("faq") || action.includes("kontak")) {
    return {
      domain: "Konten Publik",
      entity: action.includes("artikel") ? "Artikel / Berita" : action.includes("banner") ? "Banner Homepage" : action.includes("popup") ? "Popup Pengumuman" : action.includes("galeri") ? "Galeri Kegiatan" : action.includes("download") ? "Download Center" : action.includes("faq") ? "FAQ Manager" : "Kontak & Sosial Media",
    }
  }

  if (action.includes("pesan") || action.includes("notifikasi") || action.includes("inbox")) {
    return {
      domain: "Komunikasi",
      entity: action.includes("notifikasi") ? "Notifikasi" : "Pesan Masuk",
    }
  }

  if (action.includes("user") || action.includes("pengguna") || action.includes("akses") || log.type === "Permission") {
    return {
      domain: "Pengguna & Akses",
      entity: log.type === "Permission" || action.includes("akses") ? "Hak Akses" : "Kelola Pengguna",
    }
  }

  if (action.includes("backup") || action.includes("maintenance") || action.includes("theme") || action.includes("sistem") || log.type === "Settings") {
    return {
      domain: "Sistem",
      entity: action.includes("backup") ? "Backup & Restore" : action.includes("maintenance") ? "Maintenance Mode" : action.includes("theme") ? "Pengaturan Sistem" : "System Settings",
    }
  }

  return {
    domain: "Operasional",
    entity: action.includes("media") ? "Media Manager" : action.includes("aplikasi") ? "Aplikasi Terintegrasi" : "Activity Log",
  }
}

function domainTone(domain: AuditDomain) {
  if (domain === "Konten Publik") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
  if (domain === "Komunikasi") return "bg-sky-500/10 text-sky-600 dark:text-sky-300"
  if (domain === "Pengguna & Akses") return "bg-violet-500/10 text-violet-600 dark:text-violet-300"
  if (domain === "Sistem") return "bg-amber-500/10 text-amber-600 dark:text-amber-300"
  return "bg-muted text-muted-foreground"
}

function domainIcon(domain: AuditDomain) {
  if (domain === "Konten Publik") return FileText
  if (domain === "Komunikasi") return Megaphone
  if (domain === "Pengguna & Akses") return UserRound
  if (domain === "Sistem") return Settings
  return FolderOpen
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<AuditDomain | "Semua">("Semua")
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus | "Semua">("Semua")
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

  const auditItems = useMemo<AuditItem[]>(() => logs.map((log) => ({ ...log, ...deriveAuditMetadata(log) })), [logs])

  const filteredItems = useMemo(() => {
    return auditItems.filter((item) => {
      const searchText = `${item.userName} ${item.action} ${item.entity} ${item.domain} ${item.roleLabel ?? ""}`.toLowerCase()
      const matchesSearch = searchText.includes(deferredSearch.toLowerCase())
      const matchesDomain = selectedDomain === "Semua" || item.domain === selectedDomain
      const matchesStatus = selectedStatus === "Semua" || item.status === selectedStatus
      return matchesSearch && matchesDomain && matchesStatus
    })
  }, [auditItems, deferredSearch, selectedDomain, selectedStatus])

  const summary = useMemo(() => ({
    total: auditItems.length,
    content: auditItems.filter((item) => item.domain === "Konten Publik").length,
    governance: auditItems.filter((item) => item.domain === "Pengguna & Akses").length,
    system: auditItems.filter((item) => item.domain === "Sistem").length,
  }), [auditItems])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Governance Trail
            </div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Audit Trail</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Jejak perubahan konten, akses, pengaturan, dan operasional yang membantu super admin menilai siapa mengubah apa dan di area mana.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => exportActivityLogs(filteredItems)}>
              <Download className="h-4 w-4" />
              Export Audit
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive" onClick={clearActivityLogs}>
              <Trash2 className="h-4 w-4" />
              Clear Trail
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <SummaryCard title="Total Event" value={String(summary.total)} icon={Activity} />
          <SummaryCard title="Konten Publik" value={String(summary.content)} icon={FileText} />
          <SummaryCard title="Akses & Governance" value={String(summary.governance)} icon={UserRound} />
          <SummaryCard title="Perubahan Sistem" value={String(summary.system)} icon={Settings} />
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 lg:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari user, modul, aksi..."
                  className="h-10 rounded-xl bg-muted/50 pl-9"
                />
              </div>
              <Select value={selectedDomain} onValueChange={(value) => setSelectedDomain(value as AuditDomain | "Semua")}>
                <SelectTrigger className="h-10 rounded-xl bg-muted/50">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter domain" />
                </SelectTrigger>
                <SelectContent>
                  {domainOptions.map((domain) => <SelectItem key={domain} value={domain}>{domain}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ActivityStatus | "Semua")}>
                <SelectTrigger className="h-10 rounded-xl bg-muted/50">
                  <ShieldCheck className="h-4 w-4" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Jejak Perubahan</CardTitle>
            <CardDescription>Timeline audit lintas domain utama super admin.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredItems.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredItems.map((item) => {
                  const DomainIcon = domainIcon(item.domain)
                  return (
                    <div key={item.id} className="p-4 transition-colors hover:bg-muted/40 lg:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <DomainIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h2 className="text-sm font-semibold text-foreground">{item.userName}</h2>
                              <Badge className={cn("border-0", domainTone(item.domain))}>{item.domain}</Badge>
                              <Badge variant="outline">{item.entity}</Badge>
                              <Badge variant="outline">{item.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.action}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{item.dateTime}{item.roleLabel ? ` • ${item.roleLabel}` : ""}{item.device ? ` • ${item.device}` : ""}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Audit trail tidak ditemukan</p>
                <p className="mt-1 text-sm text-muted-foreground">Coba ubah keyword atau filter domain audit.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
  return (
    <Card className="border-border shadow-sm transition-all duration-300 hover:shadow-md">
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
