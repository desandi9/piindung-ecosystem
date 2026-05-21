"use client"

import { useEffect } from "react"
import { applySystemSettings, useStoredSystemSettings } from "@/lib/system-settings"

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoaded } = useStoredSystemSettings()

  useEffect(() => {
    if (!isLoaded) return
    applySystemSettings(settings)
  }, [isLoaded, settings])

  return children
}
