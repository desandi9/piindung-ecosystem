"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useTheme } from "next-themes"
import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  Bell,
  Check,
  Palette,
  ImageIcon,
  Mail,
  MapPin,
  MonitorCog,
  Moon,
  Phone,
  RotateCcw,
  Save,
  Sparkles,
  Sun,
  Type,
  Upload,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import {
  addActivityLog,
} from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import {
  applySystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
  resetStoredSystemSettings,
  useStoredSystemSettings,
  writeStoredSystemSettings,
  THEME_PRESETS,
  type SystemSettings,
} from "@/lib/system-settings"
import { toast } from "sonner"

export default function PengaturanSistemPage() {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS)
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle")
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const { settings: storedSettings, isLoaded } = useStoredSystemSettings()

  useEffect(() => {
    if (!isLoaded) return
    setSettings(storedSettings)
  }, [isLoaded, storedSettings])

  useEffect(() => {
    if (!isLoaded) return
    setTheme(settings.colorMode)
    applySystemSettings(settings)
  }, [isLoaded, settings, setTheme])

  function updateSetting<Key extends keyof SystemSettings>(key: Key, value: SystemSettings[Key]) {
    setSaveState("idle")
    setSettings((currentSettings) => ({ ...currentSettings, [key]: value }))
  }

  async function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploadedImage = await uploadOptimizedImage(file, "system-logo", settings.logoUrl)
      updateSetting("logoUrl", uploadedImage.url)
      toast.success(buildImageOptimizationMessage(uploadedImage))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload logo gagal.")
    } finally {
      event.target.value = ""
    }
  }

  function saveSettings() {
    writeStoredSystemSettings(settings)
    applySystemSettings(settings)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Settings",
      action: `Menyimpan Pengaturan Sistem (${settings.themePreset}, ${settings.colorMode})`,
      status: "Success",
    })
    setSaveState("saved")
  }

  function resetSettings() {
    setConfirmResetOpen(true)
  }

  function confirmResetSettings() {
    resetStoredSystemSettings()
    window.localStorage.setItem("theme", DEFAULT_SYSTEM_SETTINGS.colorMode)
    setSettings(DEFAULT_SYSTEM_SETTINGS)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Settings",
      action: "Reset Pengaturan Sistem ke default",
      status: "Warning",
    })
    setSaveState("idle")
    setConfirmResetOpen(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MonitorCog className="h-4 w-4 text-primary" />
              Konfigurasi Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Pengaturan Sistem</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atur identitas, tampilan, kontak, dan preferensi UI portal secara langsung.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4" />
              Reset Default
            </Button>
            <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20" onClick={saveSettings}>
              {saveState === "saved" ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saveState === "saved" ? "Tersimpan" : "Simpan Settings"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Tabs defaultValue="tampilan" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl lg:grid-cols-4">
              <TabsTrigger value="tampilan" className="rounded-lg">Tampilan</TabsTrigger>
              <TabsTrigger value="identitas" className="rounded-lg">Identitas</TabsTrigger>
              <TabsTrigger value="kontak" className="rounded-lg">Kontak</TabsTrigger>
              <TabsTrigger value="preferensi" className="rounded-lg">Preferensi</TabsTrigger>
            </TabsList>

            <TabsContent value="tampilan" className="space-y-4">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Theme Color</CardTitle>
                  <CardDescription>Pilih preset atau gunakan warna custom. Perubahan langsung diterapkan ke menu aktif, tombol, badge, link, dan highlight.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {THEME_PRESETS.map((theme) => {
                      const isActive = settings.themePreset === theme.key

                      return (
                        <button
                          key={theme.key}
                          type="button"
                          onClick={() => updateSetting("themePreset", theme.key)}
                          className={cn(
                            "rounded-xl border bg-card p-4 text-left shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md",
                            isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="h-9 w-9 rounded-xl shadow-sm" style={{ backgroundColor: theme.color }} />
                            {isActive && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="mt-3 text-sm font-semibold text-foreground">{theme.name}</p>
                          <p className="text-xs text-muted-foreground">Preset warna sistem</p>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <Palette className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Custom Color</p>
                        <p className="text-xs text-muted-foreground">Gunakan picker warna atau isi kode hex manual seperti `#2e8b57`.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center">
                      <input
                        type="color"
                        value={settings.customPrimaryColor}
                        onChange={(event) => {
                          updateSetting("themePreset", "custom")
                          updateSetting("customPrimaryColor", event.target.value)
                        }}
                        className="h-16 w-full cursor-pointer rounded-xl border border-border bg-transparent p-1"
                        aria-label="Custom theme color"
                      />
                      <div className="space-y-2">
                        <Label htmlFor="custom-primary-color">Kode Warna</Label>
                        <Input
                          id="custom-primary-color"
                          value={settings.customPrimaryColor}
                          onChange={(event) => {
                            updateSetting("themePreset", "custom")
                            updateSetting("customPrimaryColor", event.target.value)
                          }}
                          className="rounded-xl bg-muted/50"
                          placeholder="#2e8b57"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Mode Tampilan</CardTitle>
                  <CardDescription>Ubah mode terang atau gelap untuk seluruh dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ModeButton
                      icon={Sun}
                      title="Light Mode"
                      description="Tampilan terang dan bersih"
                      active={settings.colorMode === "light"}
                      onClick={() => updateSetting("colorMode", "light")}
                    />
                    <ModeButton
                      icon={Moon}
                      title="Dark Mode"
                      description="Tampilan gelap premium"
                      active={settings.colorMode === "dark"}
                      onClick={() => updateSetting("colorMode", "dark")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="identitas" className="space-y-4">
              <SettingsCard icon={ImageIcon} title="Logo Website" description="Gunakan URL logo atau upload file dari perangkat.">
                <div className="grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)]">
                  <div className="flex h-28 items-center justify-center rounded-xl border border-border bg-muted/40 p-4">
                    {/* Native img keeps arbitrary uploaded/data URLs usable in the live preview. */}
                    <img src={settings.logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain dark:brightness-110" />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="logo-url">URL Logo</Label>
                      <Input
                        id="logo-url"
                        value={settings.logoUrl}
                        onChange={(event) => updateSetting("logoUrl", event.target.value)}
                        placeholder="https://..."
                        className="rounded-xl bg-muted/50"
                      />
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                    <Button variant="outline" className="gap-2 rounded-xl" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Change Logo
                    </Button>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard icon={Type} title="Judul Website" description="Judul diterapkan langsung ke tab browser dan live preview.">
                <div className="space-y-2">
                  <Label htmlFor="website-title">Website Title</Label>
                  <Input
                    id="website-title"
                    value={settings.websiteTitle}
                    onChange={(event) => updateSetting("websiteTitle", event.target.value)}
                    className="rounded-xl bg-muted/50"
                  />
                </div>
              </SettingsCard>

              <SettingsCard icon={BadgeCheck} title="Footer Text" description="Teks footer untuk informasi hak cipta dan lembaga.">
                <div className="space-y-2">
                  <Label htmlFor="footer-text">Footer Text</Label>
                  <Textarea
                    id="footer-text"
                    value={settings.footerText}
                    onChange={(event) => updateSetting("footerText", event.target.value)}
                    className="min-h-24 rounded-xl bg-muted/50"
                  />
                </div>
              </SettingsCard>
            </TabsContent>

            <TabsContent value="kontak" className="space-y-4">
              <SettingsCard icon={Mail} title="Informasi Kontak" description="Kontak utama yang tampil pada preview portal.">
                <div className="grid gap-4 lg:grid-cols-2">
                  <InputField
                    id="contact-email"
                    label="Email"
                    value={settings.contactEmail}
                    onChange={(value) => updateSetting("contactEmail", value)}
                  />
                  <InputField
                    id="contact-phone"
                    label="Nomor Telepon"
                    value={settings.contactPhone}
                    onChange={(value) => updateSetting("contactPhone", value)}
                  />
                  <div className="lg:col-span-2">
                    <Label htmlFor="contact-address">Alamat</Label>
                    <Textarea
                      id="contact-address"
                      value={settings.contactAddress}
                      onChange={(event) => updateSetting("contactAddress", event.target.value)}
                      className="mt-2 min-h-24 rounded-xl bg-muted/50"
                    />
                  </div>
                </div>
              </SettingsCard>
            </TabsContent>

            <TabsContent value="preferensi" className="space-y-4">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Animasi Interface</CardTitle>
                  <CardDescription>Aktifkan atau matikan transisi dan animasi dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Smooth animations</p>
                        <p className="text-xs text-muted-foreground">Hover, transition, dan page animation</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.animationsEnabled}
                      onCheckedChange={(checked) => updateSetting("animationsEnabled", checked)}
                      aria-label="Toggle animations"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <LivePreview settings={settings} />
        </div>
      </div>
      <ConfirmActionDialog
        open={confirmResetOpen}
        onOpenChange={setConfirmResetOpen}
        title="Reset Pengaturan Sistem"
        description="Semua pengaturan sistem akan dikembalikan ke default, termasuk tema, identitas, dan preferensi portal."
        confirmLabel="Reset Default"
        destructive
        onConfirm={confirmResetSettings}
      />
    </DashboardLayout>
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

function ModeButton({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: LucideIcon
  title: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-4 text-left shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md",
        active ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {active && <Check className="h-4 w-4 text-primary" />}
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  )
}

function InputField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl bg-muted/50" />
    </div>
  )
}

function LivePreview({ settings }: { settings: SystemSettings }) {
  return (
    <Card className="border-border shadow-sm xl:sticky xl:top-20 xl:self-start">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Live Preview</CardTitle>
        <CardDescription>Preview langsung untuk perubahan theme, logo, title, footer, kontak, dan animasi.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/40 p-2">
                <img src={settings.logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain dark:brightness-110" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{settings.websiteTitle}</p>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[120px_minmax(0,1fr)]">
            <div className="border-r border-border bg-card p-3 space-y-2">
              <div className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm">Dashboard</div>
              <div className="rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">Pengguna</div>
              <div className="rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">Konten</div>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Program Zakat</p>
                    <p className="text-xs text-muted-foreground">Highlight kartu dan badge mengikuti theme.</p>
                  </div>
                  <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/10">Active</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90">Primary</Button>
                  <Button size="sm" variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary/5">Link</Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <PreviewContact icon={Mail} value={settings.contactEmail} />
                  <PreviewContact icon={Phone} value={settings.contactPhone} />
                  <PreviewContact icon={MapPin} value={settings.contactAddress} />
                </div>
              </div>

              <div className="rounded-xl bg-primary/10 p-3 text-xs text-primary">
                <div className="flex items-center gap-2 font-medium">
                  <Bell className="h-4 w-4" />
                  Highlight sistem aktif
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-card p-3 text-xs text-muted-foreground">
            {settings.footerText}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewContact({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="line-clamp-2">{value}</span>
    </div>
  )
}
