"use client"

import { useEffect, useState } from "react"
import { createSingletonClient } from "@/services/api/record-client"

export interface MaintenanceSettings {
  enabled: boolean
  title: string
  description: string
  imageUrl: string
  estimatedCompletion: string
  countdownEnabled: boolean
  countdownTarget: string
  customButtonLabel: string
  customButtonUrl: string
}

export const MAINTENANCE_MODE_STORAGE_KEY = "piindung-maintenance-mode"
export const MAINTENANCE_MODE_EVENT = "piindung-maintenance-mode-updated"

export const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  enabled: false,
  title: "PIINDUNG Sedang Dalam Pemeliharaan",
  description: "Kami sedang melakukan peningkatan sistem agar layanan PIINDUNG menjadi lebih cepat, aman, dan nyaman digunakan. Silakan kembali beberapa saat lagi.",
  imageUrl: "",
  estimatedCompletion: "Hari ini, 23.00 WIB",
  countdownEnabled: false,
  countdownTarget: "",
  customButtonLabel: "Hubungi Admin",
  customButtonUrl: "",
}

const maintenanceClient = createSingletonClient<MaintenanceSettings>({
  scope: "maintenance-mode",
  defaultValue: DEFAULT_MAINTENANCE_SETTINGS,
  eventName: MAINTENANCE_MODE_EVENT,
})

function normalizeMaintenanceSettings(value?: Partial<MaintenanceSettings>) {
  return {
    ...DEFAULT_MAINTENANCE_SETTINGS,
    ...value,
  }
}

function dispatchMaintenanceModeEvent(settings: MaintenanceSettings) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<MaintenanceSettings>(MAINTENANCE_MODE_EVENT, { detail: settings }))
}

export function readStoredMaintenanceSettings() {
  return normalizeMaintenanceSettings(maintenanceClient.readValueSync())
}

export function writeStoredMaintenanceSettings(settings: MaintenanceSettings) {
  const normalizedSettings = normalizeMaintenanceSettings(settings)
  dispatchMaintenanceModeEvent(normalizedSettings)
  void maintenanceClient.writeValue(normalizedSettings)
}

export function resetStoredMaintenanceSettings() {
  dispatchMaintenanceModeEvent(DEFAULT_MAINTENANCE_SETTINGS)
  void maintenanceClient.writeValue(DEFAULT_MAINTENANCE_SETTINGS)
}

export function useMaintenanceSettings() {
  const [settings, setSettings] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    void maintenanceClient.readValue().then((value) => {
      if (isMounted) {
        setSettings(normalizeMaintenanceSettings(value))
        setIsLoaded(true)
      }
    })

    function handleSettingsUpdated(event: Event) {
      const customEvent = event as CustomEvent<MaintenanceSettings | MaintenanceSettings[]>
      const detail = Array.isArray(customEvent.detail) ? customEvent.detail[0] : customEvent.detail
      setSettings(normalizeMaintenanceSettings(detail ?? readStoredMaintenanceSettings()))
    }

    window.addEventListener(MAINTENANCE_MODE_EVENT, handleSettingsUpdated)

    return () => {
      isMounted = false
      window.removeEventListener(MAINTENANCE_MODE_EVENT, handleSettingsUpdated)
    }
  }, [])

  return { settings, isLoaded }
}
