"use client"

import { usePathname } from "next/navigation"
import { canBypassMaintenance } from "@/features/auth"
import { useAuth } from "@/lib/auth-context"
import { useMaintenanceSettings } from "@/lib/maintenance-mode"
import { MaintenanceView } from "./maintenance-view"

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { settings, isLoaded } = useMaintenanceSettings()
  const isProtectedAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")

  if (!isLoaded) {
    return <div className="min-h-screen bg-background" />
  }

  if (!settings.enabled) {
    return children
  }

  if (isProtectedAdminRoute && isLoading) {
    return <div className="min-h-screen bg-background" />
  }

  if (canBypassMaintenance(pathname, user?.role)) {
    return children
  }

  return <MaintenanceView settings={settings} showAdminBypassHint={isProtectedAdminRoute || pathname === "/login"} />
}
