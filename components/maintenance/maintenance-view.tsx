"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Clock3, LoaderCircle, ShieldCheck, TimerReset, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type MaintenanceSettings } from "@/lib/maintenance-mode"
import { getResolvedLogoUrl, getThemePreset, readStoredSystemSettings } from "@/lib/system-settings"

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) return `rgba(46, 139, 87, ${alpha})`

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function formatEstimatedTime(value: string) {
  if (!value.trim()) return "Estimasi sedang diperbarui"

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return value

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

function useCountdown(enabled: boolean, target: string) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled || !target) return

    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [enabled, target])

  return useMemo(() => {
    const targetTimestamp = Date.parse(target)
    if (!enabled || !target || Number.isNaN(targetTimestamp)) {
      return {
        active: false,
        expired: false,
        segments: [],
      }
    }

    const difference = Math.max(0, targetTimestamp - now)
    const expired = targetTimestamp <= now
    const totalSeconds = Math.floor(difference / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return {
      active: true,
      expired,
      segments: [
        { label: "Hari", value: String(days).padStart(2, "0") },
        { label: "Jam", value: String(hours).padStart(2, "0") },
        { label: "Menit", value: String(minutes).padStart(2, "0") },
        { label: "Detik", value: String(seconds).padStart(2, "0") },
      ],
    }
  }, [enabled, target, now])
}

export function MaintenanceView({
  settings,
  preview = false,
  showAdminBypassHint = false,
}: {
  settings: MaintenanceSettings
  preview?: boolean
  showAdminBypassHint?: boolean
}) {
  const systemSettings = readStoredSystemSettings()
  const maintenanceLogo = getResolvedLogoUrl(systemSettings.logoUrl, "dark")
  const countdown = useCountdown(settings.countdownEnabled, settings.countdownTarget)
  const isExternalLink = /^https?:\/\//.test(settings.customButtonUrl)
  const [cursor, setCursor] = useState({ x: 50, y: 18 })
  const accentColor = systemSettings.themePreset === "custom"
    ? systemSettings.customPrimaryColor
    : getThemePreset(systemSettings.themePreset).color
  const secondaryGlow = systemSettings.themePreset === "blue" ? "#2e8b57" : "#0f3460"

  useEffect(() => {
    if (preview || typeof window === "undefined") return

    function handlePointerMove(event: PointerEvent) {
      setCursor({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener("pointermove", handlePointerMove)
    return () => window.removeEventListener("pointermove", handlePointerMove)
  }, [preview])

  return (
    <div className={cn(preview ? "h-full" : "min-h-screen", "relative overflow-hidden bg-background text-foreground") }>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_40%),radial-gradient(circle_at_bottom_right,_hsl(var(--secondary)/0.16),_transparent_28%)]" />
      {!preview ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-100 transition-all duration-150"
          style={{
            background: `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, ${hexToRgba(accentColor, 0.38)}, transparent 14%), radial-gradient(circle at ${Math.max(0, cursor.x - 10)}% ${Math.max(0, cursor.y - 8)}%, ${hexToRgba(secondaryGlow, 0.22)}, transparent 20%), radial-gradient(circle at ${100 - cursor.x}% ${Math.min(100, cursor.y + 24)}%, ${hexToRgba(accentColor, 0.16)}, transparent 28%)`,
          }}
        />
      ) : null}
      <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

      <div className={cn("relative mx-auto max-w-6xl px-4", preview ? "py-4" : "min-h-screen py-6 lg:px-8 lg:py-10") }>
        <div className="mx-auto flex h-full flex-col justify-center">
          <div className={cn("flex flex-wrap items-center justify-between gap-3", preview ? "mb-4" : "mb-6 lg:mb-8") }>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card/80 p-2 shadow-sm backdrop-blur-sm">
                <img src={maintenanceLogo} alt="PIINDUNG" className="max-h-full max-w-full object-contain dark:brightness-110" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">PIINDUNG</p>
                <p className="text-sm font-semibold text-foreground">NU Care LAZISNU Garut</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border-0 px-3 py-1 hover:bg-primary/10", settings.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground") }>
                {settings.enabled ? "Maintenance Aktif" : "Standby Preview"}
              </Badge>
              <Badge className={cn("border-0 px-3 py-1 hover:bg-secondary/10", countdown.active ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground") }>
                {countdown.active ? "Countdown Aktif" : "Countdown Opsional"}
              </Badge>
            </div>
          </div>

          <div className={cn("grid gap-6", preview ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center") }>
            <div className={cn("rounded-[28px] border border-border bg-card/85 shadow-xl backdrop-blur-sm", preview ? "p-4" : "p-6 lg:p-8") }>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Wrench className="h-3.5 w-3.5" />
                Pembaruan Sistem Sedang Berlangsung
              </div>

              <h1 className={cn("mt-4 font-bold tracking-tight text-foreground", preview ? "text-2xl" : "text-3xl lg:text-5xl") }>
                {settings.title}
              </h1>
              <p className={cn("mt-3 max-w-2xl text-muted-foreground", preview ? "text-sm leading-6" : "text-base lg:text-lg") }>
                {settings.description}
              </p>

              <div className={cn("mt-6 grid gap-3", preview ? "sm:grid-cols-1" : "sm:grid-cols-3") }>
                <StatusCard
                  icon={LoaderCircle}
                  title="Status"
                  value={settings.enabled ? "Sedang berlangsung" : "Siap digunakan"}
                />
                <StatusCard
                  icon={Clock3}
                  title="Estimasi Selesai"
                  value={formatEstimatedTime(settings.estimatedCompletion)}
                />
                <StatusCard
                  icon={ShieldCheck}
                  title="Akses Admin"
                  value="Super Admin tetap bisa masuk"
                />
              </div>

              {countdown.active ? (
                <div className="mt-6 rounded-3xl border border-border bg-background/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <TimerReset className="h-4 w-4 text-primary" />
                    {countdown.expired ? "Finalisasi maintenance" : "Perkiraan waktu selesai"}
                  </div>
                  <div className={cn("mt-4 grid grid-cols-2 gap-3", preview ? "sm:grid-cols-2" : "sm:grid-cols-4") }>
                    {countdown.segments.map((segment) => (
                      <div key={segment.label} className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-foreground">{segment.value}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{segment.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {settings.customButtonLabel.trim() && settings.customButtonUrl.trim() ? (
                  <Button asChild className="rounded-2xl bg-primary px-5 hover:bg-primary/90">
                    <a href={settings.customButtonUrl} target={isExternalLink ? "_blank" : undefined} rel={isExternalLink ? "noreferrer" : undefined}>
                      {settings.customButtonLabel}
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
                <span className="text-sm text-muted-foreground">Perubahan akan tampil otomatis untuk seluruh pengguna saat maintenance diaktifkan.</span>
              </div>

              {showAdminBypassHint ? (
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                  Hanya Super Admin PC yang tetap dapat mengakses area `/admin` selama maintenance berlangsung.
                </div>
              ) : null}
            </div>

            <div className={cn("rounded-[28px] border border-border bg-card/90 shadow-xl backdrop-blur-sm", preview ? "p-3" : "p-4 lg:p-5") }>
              <div className="overflow-hidden rounded-[24px] border border-border bg-background shadow-inner">
                {settings.imageUrl ? (
                  <img src={settings.imageUrl} alt="Maintenance banner" className={cn("w-full object-cover", preview ? "h-52" : "h-72 lg:h-[420px]")} />
                ) : (
                  <div className={cn("relative flex w-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),transparent_55%),linear-gradient(225deg,hsl(var(--secondary)/0.12),transparent_45%)] px-6 text-center", preview ? "h-52" : "h-72 lg:h-[420px]") }>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-primary/20 bg-card shadow-lg">
                      <img src={maintenanceLogo} alt="PIINDUNG" className="max-h-10 max-w-10 object-contain dark:brightness-110" />
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Branded maintenance visual</div>
                    <p className="mt-3 text-sm font-semibold text-foreground">Upload banner maintenance untuk memperkuat informasi yang ditampilkan.</p>
                    <p className="mt-2 max-w-xs text-xs text-muted-foreground">Banner akan muncul otomatis di seluruh halaman publik saat maintenance mode aktif.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Wrench
  title: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
