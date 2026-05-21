"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Clock3,
  ImageIcon,
  Link2,
  MonitorCog,
  Power,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Upload,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { MaintenanceView } from "@/components/maintenance/maintenance-view"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { addActivityLog } from "@/lib/activity-log"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import {
  DEFAULT_MAINTENANCE_SETTINGS,
  resetStoredMaintenanceSettings,
  useMaintenanceSettings,
  writeStoredMaintenanceSettings,
  type MaintenanceSettings,
} from "@/lib/maintenance-mode"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function MaintenanceModePage() {
  const { user } = useAuth()
  const { settings: storedSettings, isLoaded } = useMaintenanceSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE_SETTINGS)
  const [pendingEnabledState, setPendingEnabledState] = useState<boolean | null>(null)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const bannerUsesLocalUpload = settings.imageUrl.startsWith("data:")

  useEffect(() => {
    if (!isLoaded) return
    setSettings(storedSettings)
  }, [isLoaded, storedSettings])

  function logActivity(action: string, status: "Success" | "Warning" = "Success") {
    addActivityLog({
      userName: user?.name || "Super Admin",
      type: "System",
      action,
      status,
    })
  }

  function applySettings(updater: (current: MaintenanceSettings) => MaintenanceSettings) {
    setSettings((currentSettings) => {
      const nextSettings = updater(currentSettings)
      writeStoredMaintenanceSettings(nextSettings)
      return nextSettings
    })
  }

  function updateSetting<Key extends keyof MaintenanceSettings>(key: Key, value: MaintenanceSettings[Key]) {
    applySettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
  }

  async function handleBannerFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploadedImage = await uploadOptimizedImage(file, "maintenance", settings.imageUrl)
      updateSetting("imageUrl", uploadedImage.url)
      logActivity("Memperbarui banner maintenance mode")
      toast.success(buildImageOptimizationMessage(uploadedImage))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload banner maintenance gagal.")
    } finally {
      event.target.value = ""
    }
  }

  function confirmToggle() {
    if (pendingEnabledState === null) return

    applySettings((currentSettings) => ({
      ...currentSettings,
      enabled: pendingEnabledState,
    }))
    logActivity(pendingEnabledState ? "Mengaktifkan maintenance mode" : "Menonaktifkan maintenance mode", pendingEnabledState ? "Warning" : "Success")
    setPendingEnabledState(null)
  }

  function resetSettings() {
    resetStoredMaintenanceSettings()
    setSettings(DEFAULT_MAINTENANCE_SETTINGS)
    logActivity("Reset maintenance mode ke konfigurasi default", "Warning")
    setConfirmResetOpen(false)
  }

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh]" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MonitorCog className="h-4 w-4 text-primary" />
              Global Website Control
            </div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Maintenance Mode</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola mode pemeliharaan website secara global. Perubahan diterapkan otomatis dan Super Admin tetap bisa mengakses area admin.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Badge className={cn("border-0 px-3 py-2 hover:bg-primary/10", settings.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground") }>
              {settings.enabled ? "Status: Aktif" : "Status: Nonaktif"}
            </Badge>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setConfirmResetOpen(true)}>
              <RotateCcw className="h-4 w-4" />
              Reset Default
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard icon={Power} title="Mode Saat Ini" value={settings.enabled ? "Maintenance Aktif" : "Standby"} />
          <SummaryCard icon={TimerReset} title="Countdown" value={settings.countdownEnabled ? "Aktif" : "Opsional"} />
          <SummaryCard icon={Sparkles} title="Apply Changes" value="Instant" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <SettingsCard icon={ShieldCheck} title="Status & Akses" description="Aktifkan maintenance mode global untuk seluruh website dan batasi akses hanya untuk Super Admin di area admin.">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Enable maintenance mode</p>
                  <p className="mt-1 text-xs text-muted-foreground">Saat aktif, semua pengguna akan diarahkan ke halaman maintenance secara otomatis.</p>
                </div>
                <Switch checked={settings.enabled} onCheckedChange={setPendingEnabledState} aria-label="Toggle maintenance mode" />
              </div>
            </SettingsCard>

            <SettingsCard icon={MonitorCog} title="Konten Maintenance" description="Atur judul dan pesan utama yang dilihat pengguna saat maintenance mode aktif.">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance-title">Maintenance Title</Label>
                  <Input
                    id="maintenance-title"
                    value={settings.title}
                    onChange={(event) => updateSetting("title", event.target.value)}
                    onBlur={() => logActivity("Memperbarui judul maintenance mode")}
                    className="rounded-xl bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-description">Maintenance Message</Label>
                  <Textarea
                    id="maintenance-description"
                    value={settings.description}
                    onChange={(event) => updateSetting("description", event.target.value)}
                    onBlur={() => logActivity("Memperbarui deskripsi maintenance mode")}
                    className="min-h-28 rounded-xl bg-muted/50"
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard icon={ImageIcon} title="Banner Maintenance" description="Gunakan URL gambar atau upload banner maintenance dari perangkat Anda.">
              <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40 p-3">
                  {settings.imageUrl ? (
                    <img src={settings.imageUrl} alt="Banner maintenance preview" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <div className="text-center text-xs text-muted-foreground">Belum ada banner</div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-image">URL Banner</Label>
                    <Input
                      id="maintenance-image"
                      value={bannerUsesLocalUpload ? "File lokal terupload" : settings.imageUrl}
                      onChange={(event) => updateSetting("imageUrl", event.target.value)}
                      onBlur={() => logActivity("Memperbarui URL banner maintenance mode")}
                      placeholder="https://..."
                      className="rounded-xl bg-muted/50"
                      readOnly={bannerUsesLocalUpload}
                    />
                    {bannerUsesLocalUpload ? <p className="text-xs text-muted-foreground">Banner aktif berasal dari upload lokal. Upload ulang file lain atau kosongkan field lewat reset default bila ingin memakai URL manual.</p> : null}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
                  <Button variant="outline" className="gap-2 rounded-xl" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Upload Banner
                  </Button>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard icon={Clock3} title="Estimasi & Countdown" description="Tampilkan estimasi selesai maintenance dan aktifkan countdown bila diperlukan.">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated-completion">Estimated Completion</Label>
                  <Input
                    id="estimated-completion"
                    value={settings.estimatedCompletion}
                    onChange={(event) => updateSetting("estimatedCompletion", event.target.value)}
                    onBlur={() => logActivity("Memperbarui estimasi selesai maintenance")}
                    placeholder="Hari ini, 23.00 WIB"
                    className="rounded-xl bg-muted/50"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Aktifkan countdown</p>
                    <p className="mt-1 text-xs text-muted-foreground">Countdown tampil otomatis di halaman maintenance jika target waktu diisi.</p>
                  </div>
                  <Switch
                    checked={settings.countdownEnabled}
                    onCheckedChange={(checked) => {
                      updateSetting("countdownEnabled", checked)
                      logActivity(`${checked ? "Mengaktifkan" : "Menonaktifkan"} countdown maintenance mode`)
                    }}
                    aria-label="Toggle maintenance countdown"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countdown-target">Countdown Target</Label>
                  <Input
                    id="countdown-target"
                    type="datetime-local"
                    value={settings.countdownTarget}
                    onChange={(event) => updateSetting("countdownTarget", event.target.value)}
                    onBlur={() => logActivity("Memperbarui target countdown maintenance mode")}
                    className="rounded-xl bg-muted/50"
                    disabled={!settings.countdownEnabled}
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard icon={Link2} title="Custom Button / Link" description="Tambahkan tombol aksi kustom seperti kontak admin, status page, atau link informasi eksternal.">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="button-label">Button Label</Label>
                  <Input
                    id="button-label"
                    value={settings.customButtonLabel}
                    onChange={(event) => updateSetting("customButtonLabel", event.target.value)}
                    onBlur={() => logActivity("Memperbarui label tombol maintenance mode")}
                    placeholder="Hubungi Admin"
                    className="rounded-xl bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button-url">Button URL</Label>
                  <Input
                    id="button-url"
                    value={settings.customButtonUrl}
                    onChange={(event) => updateSetting("customButtonUrl", event.target.value)}
                    onBlur={() => logActivity("Memperbarui link tombol maintenance mode")}
                    placeholder="https://..."
                    className="rounded-xl bg-muted/50"
                  />
                </div>
              </div>
            </SettingsCard>
          </div>

          <Card className="border-border shadow-sm xl:sticky xl:top-20 xl:self-start">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Live Preview</CardTitle>
              <CardDescription>Preview langsung halaman maintenance dengan branding PIINDUNG, status mode, countdown, dan CTA kustom.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                <MaintenanceView settings={settings} preview />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={pendingEnabledState !== null} onOpenChange={(open) => !open && setPendingEnabledState(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingEnabledState ? "Aktifkan Maintenance Mode?" : "Nonaktifkan Maintenance Mode?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingEnabledState
                ? "Semua pengguna akan langsung melihat halaman maintenance. Hanya Super Admin PC yang tetap bisa mengakses area admin."
                : "Website akan kembali normal untuk seluruh pengguna dan halaman maintenance tidak lagi ditampilkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-primary hover:bg-primary/90" onClick={confirmToggle}>
              {pendingEnabledState ? "Aktifkan" : "Nonaktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Maintenance Mode</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh konfigurasi maintenance mode akan dikembalikan ke default dan mode maintenance akan dinonaktifkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-primary hover:bg-primary/90" onClick={resetSettings}>
              Reset Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
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

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
