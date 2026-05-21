"use client"

import { createSingletonClient } from "@/services/api/record-client"

export type ThemePresetKey = "nu-green" | "blue" | "emerald" | "dark-green" | "custom"

export type ColorMode = "light" | "dark"

export const DEFAULT_LIGHT_LOGO_URL = "/piindung-logo-blue.png"
export const DEFAULT_DARK_LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PIINDUNG%20PUTIH.-N7pkJsqskZWWShIRpKJozgp3D7NnGu.png"

export interface SystemSettings {
  themePreset: ThemePresetKey
  customPrimaryColor: string
  colorMode: ColorMode
  logoUrl: string
  websiteTitle: string
  footerText: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  animationsEnabled: boolean
}

export interface ThemePreset {
  key: ThemePresetKey
  name: string
  color: string
  light: {
    primary: string
    secondary: string
    accent: string
    accentForeground: string
    ring: string
  }
  dark: {
    primary: string
    secondary: string
    accent: string
    accentForeground: string
    ring: string
  }
}

export const SYSTEM_SETTINGS_STORAGE_KEY = "piindung-system-settings"

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  themePreset: "blue",
  customPrimaryColor: "#0f3460",
  colorMode: "light",
  logoUrl: DEFAULT_LIGHT_LOGO_URL,
  websiteTitle: "PIINDUNG - NU Care LAZISNU Garut",
  footerText: "© 2026 NU Care LAZISNU Garut. Semua hak dilindungi.",
  contactEmail: "nucarelazisnugarut@gmail.com",
  contactPhone: "+62 812-3456-7890",
  contactAddress: "Jl. Patriot, Kabupaten Garut, Jawa Barat",
  animationsEnabled: true,
}

const systemSettingsClient = createSingletonClient<SystemSettings>({
  scope: "system-settings",
  defaultValue: DEFAULT_SYSTEM_SETTINGS,
  eventName: "piindung-system-settings-updated",
})

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "nu-green",
    name: "NU Green",
    color: "#2e8b57",
    light: {
      primary: "oklch(0.55 0.18 145)",
      secondary: "oklch(0.35 0.12 250)",
      accent: "oklch(0.96 0.03 145)",
      accentForeground: "oklch(0.34 0.14 145)",
      ring: "oklch(0.55 0.18 145)",
    },
    dark: {
      primary: "oklch(0.60 0.18 145)",
      secondary: "oklch(0.50 0.12 250)",
      accent: "oklch(0.26 0.03 145)",
      accentForeground: "oklch(0.95 0 0)",
      ring: "oklch(0.60 0.18 145)",
    },
  },
  {
    key: "blue",
    name: "Blue",
    color: "#0f3460",
    light: {
      primary: "oklch(0.35 0.12 250)",
      secondary: "oklch(0.55 0.18 145)",
      accent: "oklch(0.96 0.02 250)",
      accentForeground: "oklch(0.35 0.12 250)",
      ring: "oklch(0.35 0.12 250)",
    },
    dark: {
      primary: "oklch(0.52 0.13 250)",
      secondary: "oklch(0.60 0.18 145)",
      accent: "oklch(0.26 0.03 250)",
      accentForeground: "oklch(0.95 0 0)",
      ring: "oklch(0.52 0.13 250)",
    },
  },
  {
    key: "emerald",
    name: "Emerald",
    color: "#059669",
    light: {
      primary: "oklch(0.62 0.16 160)",
      secondary: "oklch(0.42 0.12 250)",
      accent: "oklch(0.96 0.03 160)",
      accentForeground: "oklch(0.38 0.13 160)",
      ring: "oklch(0.62 0.16 160)",
    },
    dark: {
      primary: "oklch(0.66 0.16 160)",
      secondary: "oklch(0.52 0.12 250)",
      accent: "oklch(0.26 0.03 160)",
      accentForeground: "oklch(0.95 0 0)",
      ring: "oklch(0.66 0.16 160)",
    },
  },
  {
    key: "dark-green",
    name: "Dark Green",
    color: "#14532d",
    light: {
      primary: "oklch(0.38 0.13 150)",
      secondary: "oklch(0.36 0.11 250)",
      accent: "oklch(0.95 0.03 150)",
      accentForeground: "oklch(0.28 0.10 150)",
      ring: "oklch(0.38 0.13 150)",
    },
    dark: {
      primary: "oklch(0.52 0.14 150)",
      secondary: "oklch(0.48 0.12 250)",
      accent: "oklch(0.25 0.03 150)",
      accentForeground: "oklch(0.95 0 0)",
      ring: "oklch(0.52 0.14 150)",
    },
  },
  {
    key: "custom",
    name: "Custom",
    color: "#0f3460",
    light: {
      primary: "#0f3460",
      secondary: "color-mix(in srgb, #0f3460 32%, white)",
      accent: "color-mix(in srgb, #0f3460 10%, white)",
      accentForeground: "#0f3460",
      ring: "#0f3460",
    },
    dark: {
      primary: "#0f3460",
      secondary: "color-mix(in srgb, #0f3460 45%, white)",
      accent: "color-mix(in srgb, #0f3460 22%, black)",
      accentForeground: "#ffffff",
      ring: "#0f3460",
    },
  },
]

export function getThemePreset(key: ThemePresetKey) {
  return THEME_PRESETS.find((theme) => theme.key === key) ?? THEME_PRESETS[1]
}

export function getResolvedLogoUrl(logoUrl: string, colorMode: ColorMode) {
  const normalized = logoUrl.trim()
  const usingDefaultBlueLogo = normalized === DEFAULT_LIGHT_LOGO_URL || normalized.includes("PIINDUNG%20BIRU") || normalized.includes("piindung-logo-blue")

  if (colorMode === "dark" && usingDefaultBlueLogo) {
    return DEFAULT_DARK_LOGO_URL
  }

  return normalized || (colorMode === "dark" ? DEFAULT_DARK_LOGO_URL : DEFAULT_LIGHT_LOGO_URL)
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed
  return DEFAULT_SYSTEM_SETTINGS.customPrimaryColor
}

function buildCustomPalette(colorMode: ColorMode, color: string) {
  const safeColor = normalizeHexColor(color)

  if (colorMode === "dark") {
    return {
      primary: safeColor,
      secondary: `color-mix(in srgb, ${safeColor} 45%, white)`,
      accent: `color-mix(in srgb, ${safeColor} 22%, black)`,
      accentForeground: "#ffffff",
      ring: safeColor,
    }
  }

  return {
    primary: safeColor,
    secondary: `color-mix(in srgb, ${safeColor} 32%, white)`,
    accent: `color-mix(in srgb, ${safeColor} 10%, white)`,
    accentForeground: safeColor,
    ring: safeColor,
  }
}

export function applySystemSettings(settings: SystemSettings) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  const palette = settings.themePreset === "custom"
    ? buildCustomPalette(settings.colorMode, settings.customPrimaryColor)
    : getThemePreset(settings.themePreset)[settings.colorMode]

  root.classList.toggle("dark", settings.colorMode === "dark")
  root.style.colorScheme = settings.colorMode

  root.style.setProperty("--primary", palette.primary)
  root.style.setProperty("--secondary", palette.secondary)
  root.style.setProperty("--accent", palette.accent)
  root.style.setProperty("--accent-foreground", palette.accentForeground)
  root.style.setProperty("--ring", palette.ring)
  root.style.setProperty("--chart-1", palette.primary)
  root.style.setProperty("--chart-2", palette.secondary)
  root.style.setProperty("--sidebar-primary", palette.primary)
  root.style.setProperty("--sidebar-ring", palette.ring)
  root.dataset.animations = settings.animationsEnabled ? "on" : "off"
  document.title = settings.websiteTitle

  if (typeof window !== "undefined") {
    window.localStorage.setItem("theme", settings.colorMode)
  }
}

export function readStoredSystemSettings() {
  return systemSettingsClient.readValueSync()
}

export function updateStoredSystemColorMode(colorMode: ColorMode) {
  const settings = { ...readStoredSystemSettings(), colorMode }
  void systemSettingsClient.writeValue(settings)
  applySystemSettings(settings)
}

export function writeStoredSystemSettings(settings: SystemSettings) {
  void systemSettingsClient.writeValue({
    ...settings,
    customPrimaryColor: normalizeHexColor(settings.customPrimaryColor),
  })
}

export function resetStoredSystemSettings() {
  void systemSettingsClient.writeValue(DEFAULT_SYSTEM_SETTINGS)
}

export function useStoredSystemSettings() {
  const settings = systemSettingsClient.useValue()
  return { settings, isLoaded: settings !== DEFAULT_SYSTEM_SETTINGS || systemSettingsClient.readValueSync() !== DEFAULT_SYSTEM_SETTINGS }
}
