"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileArchive,
  History,
  RotateCcw,
  Upload,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { addActivityLog } from "@/lib/activity-log"
import { ACCESS_PERMISSIONS_EVENT, type RolePermissions } from "@/lib/access-permissions"
import { useAuth } from "@/lib/auth-context"
import { applySystemSettings, type SystemSettings } from "@/lib/system-settings"

interface BackupPayload {
  version: string
  createdAt: string
  data: Record<string, string | null>
}

interface BackupHistoryItem {
  id: string
  name: string
  createdAt: string
  size: string
  status: "Success" | "Failed"
  payload: BackupPayload
}

const BACKUP_HISTORY_STORAGE_KEY = "piindung-backup-history"
const BACKUP_SOURCES = [
  { key: "system-settings", scope: "system-settings", kind: "singleton" },
  { key: "maintenance-mode", scope: "maintenance-mode", kind: "singleton" },
  { key: "access-permissions", scope: "access-permissions", kind: "singleton" },
  { key: "contact-social", scope: "contact-social", kind: "singleton" },
  { key: "homepage-content", scope: "homepage-content", kind: "collection" },
  { key: "notifications", scope: "notifications", kind: "collection" },
  { key: "activity-log", scope: "activity-log", kind: "collection" },
  { key: "admin-inbox", scope: "admin-inbox", kind: "collection" },
  { key: "faq-manager", scope: "faq-manager", kind: "collection" },
  { key: "download-center", scope: "download-center", kind: "collection" },
  { key: "gallery-content", scope: "gallery-content", kind: "collection" },
  { key: "integrated-apps", scope: "integrated-apps", kind: "collection" },
  { key: "media-library", scope: "media-library", kind: "collection" },
  { key: "popup-announcements", scope: "popup-announcements", kind: "collection" },
]

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return (await response.json()) as T
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatSize(value: string) {
  const size = new Blob([value]).size
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function readBackupHistory() {
  if (typeof window === "undefined") return []

  try {
    const storedHistory = window.localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY)
    if (!storedHistory) return []
    return JSON.parse(storedHistory) as BackupHistoryItem[]
  } catch {
    return []
  }
}

async function createBackupPayload(): Promise<BackupPayload> {
  const data = await BACKUP_SOURCES.reduce<Promise<Record<string, string | null>>>(async (previous, source) => {
    const backupData = await previous
    try {
      const payload = await requestJson<Record<string, unknown>>(`/api/records/${source.scope}`)
      backupData[source.key] = JSON.stringify(payload)
    } catch {
      backupData[source.key] = null
    }
    return backupData
  }, Promise.resolve({}))

  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    data,
  }
}

function downloadBackup(payload: BackupPayload, name: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export default function BackupRestorePage() {
  const { user } = useAuth()
  const restoreInputRef = useRef<HTMLInputElement>(null)
  const [history, setHistory] = useState<BackupHistoryItem[]>([])
  const [pendingRestore, setPendingRestore] = useState<BackupPayload | null>(null)
  const [confirmAction, setConfirmAction] = useState<"backup" | "restore" | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    setHistory(readBackupHistory())
  }, [])

  function writeHistory(nextHistory: BackupHistoryItem[]) {
    setHistory(nextHistory)
    window.localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
  }

  function showNotice(type: "success" | "error", message: string) {
    setNotice({ type, message })
    window.setTimeout(() => setNotice(null), 3000)
  }

  async function backupNow() {
    try {
      const payload = await createBackupPayload()
      const payloadText = JSON.stringify(payload)
      const createdAt = formatDateTime(new Date())
      const nextBackup: BackupHistoryItem = {
        id: `backup-${Date.now()}`,
        name: `piindung-backup-${Date.now()}.json`,
        createdAt,
        size: formatSize(payloadText),
        status: "Success",
        payload,
      }

      writeHistory([nextBackup, ...history].slice(0, 20))
      addActivityLog({
        userName: user?.name || "Admin",
        type: "System",
        action: "Membuat backup data sistem",
        status: "Success",
      })
      showNotice("success", "Backup berhasil dibuat")
      setConfirmAction(null)
    } catch (error) {
      console.error(error)
      addActivityLog({
        userName: user?.name || "Admin",
        type: "System",
        action: "Gagal membuat backup data sistem",
        status: "Failed",
      })
      showNotice("error", "Backup gagal dibuat")
      setConfirmAction(null)
    }
  }

  function handleRestoreFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsedPayload = JSON.parse(String(reader.result)) as BackupPayload
        if (!parsedPayload.data || !parsedPayload.version) throw new Error("Invalid backup file")
        setPendingRestore(parsedPayload)
        setConfirmAction("restore")
      } catch {
        showNotice("error", "File backup tidak valid")
      } finally {
        event.target.value = ""
      }
    }
    reader.readAsText(file)
  }

  async function restoreBackup() {
    if (!pendingRestore) return

    try {
      for (const source of BACKUP_SOURCES) {
        const value = pendingRestore.data[source.key]
        if (!value) continue

        const parsed = JSON.parse(value) as { records?: Array<{ key: string; data: Record<string, unknown> }> }

        if (source.kind === "singleton") {
          const record = parsed.records?.[0]?.data
          if (!record) continue

          await requestJson(`/api/records/${source.scope}/singleton`, {
            method: "PATCH",
            body: JSON.stringify(record),
          })

          if (source.scope === "system-settings") applySystemSettings(record as unknown as SystemSettings)
          if (source.scope === "access-permissions") {
            window.dispatchEvent(new CustomEvent<RolePermissions>(ACCESS_PERMISSIONS_EVENT, { detail: record as unknown as RolePermissions }))
          }

          continue
        }

        const records = parsed.records ?? []
        const current = await requestJson<{ records: Array<{ key: string }> }>(`/api/records/${source.scope}`)
        const nextKeys = new Set(records.map((record) => record.key))

        await Promise.all(
          current.records
            .filter((record) => !nextKeys.has(record.key))
            .map((record) => requestJson(`/api/records/${source.scope}/${record.key}`, { method: "DELETE" }))
        )

        await Promise.all(
          records.map((record) =>
            requestJson(`/api/records/${source.scope}/${record.key}`, {
              method: "PATCH",
              body: JSON.stringify(record.data),
            })
          )
        )
      }

      addActivityLog({
        userName: user?.name || "Admin",
        type: "System",
        action: "Restore backup data sistem",
        status: "Success",
      })
      showNotice("success", "Restore backup berhasil diterapkan")
      setPendingRestore(null)
      setConfirmAction(null)
    } catch (error) {
      console.error(error)
      addActivityLog({
        userName: user?.name || "Admin",
        type: "System",
        action: "Gagal restore backup data sistem",
        status: "Failed",
      })
      showNotice("error", "Restore backup gagal diterapkan")
      setConfirmAction(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Database className="h-4 w-4 text-primary" />
              System Data Protection
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Backup & Restore</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Backup data sistem, export file backup, restore konfigurasi, dan kelola riwayat backup.
            </p>
          </div>
          <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20" onClick={() => setConfirmAction("backup")}>
            <Database className="h-4 w-4" />
            Backup Now
          </Button>
        </div>

        {notice && (
          <Card className={cn("shadow-sm", notice.type === "success" ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5")}>
            <CardContent className={cn("flex items-center gap-2 p-3 text-sm font-medium", notice.type === "success" ? "text-primary" : "text-destructive")}>
              {notice.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {notice.message}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard icon={History} title="Total Backup" value={String(history.length)} />
          <SummaryCard icon={CheckCircle2} title="Backup Berhasil" value={String(history.filter((item) => item.status === "Success").length)} />
          <SummaryCard icon={FileArchive} title="Data Sources" value={String(BACKUP_SOURCES.length)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Backup System Data</CardTitle>
              <CardDescription>Buat snapshot data lokal sistem dan simpan ke riwayat backup.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">Data yang dibackup</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {BACKUP_SOURCES.map((source) => <Badge key={source.key} variant="outline">{source.key}</Badge>)}
                </div>
                <Button className="mt-4 gap-2 rounded-xl bg-primary hover:bg-primary/90" onClick={() => setConfirmAction("backup")}>
                  <Database className="h-4 w-4" />
                  Backup Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Restore Upload</CardTitle>
              <CardDescription>Upload file backup JSON untuk mengembalikan data sistem.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">Upload backup file</p>
                <p className="mt-1 text-sm text-muted-foreground">Restore akan meminta konfirmasi sebelum diterapkan.</p>
                <input ref={restoreInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleRestoreFile} />
                <Button variant="outline" className="mt-4 gap-2 rounded-xl" onClick={() => restoreInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Pilih File Restore
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Backup History</CardTitle>
            <CardDescription>Riwayat backup terbaru dan download file backup</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {history.length > 0 ? (
              <div className="divide-y divide-border">
                {history.map((item) => (
                  <div key={item.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center lg:justify-between lg:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileArchive className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                          <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/10">{item.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.createdAt} • {item.size}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => downloadBackup(item.payload, item.name)}>
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <History className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Belum ada backup</p>
                <p className="text-sm text-muted-foreground mt-1">Klik Backup Now untuk membuat backup pertama.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction === "restore" ? "Konfirmasi Restore Backup" : "Konfirmasi Backup Data"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "restore"
                ? "Restore akan menimpa data sistem lokal dengan isi file backup yang dipilih. Lanjutkan?"
                : "Sistem akan membuat backup dari konfigurasi dan data lokal saat ini. Lanjutkan?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-primary hover:bg-primary/90" onClick={confirmAction === "restore" ? restoreBackup : backupNow}>
              {confirmAction === "restore" ? "Restore" : "Backup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 lg:p-5">
        <div className="mb-3 rounded-xl bg-primary/10 p-2 text-primary w-fit">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}
