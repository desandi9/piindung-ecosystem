"use client"

import { PortalDashboard } from "@/components/piindung/portal/portal-dashboard"
import { useAuth } from "@/lib/auth-context"

// Dashboard PIINDUNG V2. PortalHubDashboard lama (components/dashboard/portal-hub.tsx) dibiarkan, tidak lagi dipakai di sini.
export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <div className="min-h-dvh bg-[linear-gradient(180deg,#f3faef_0%,#ffffff_340px)] dark:bg-none dark:bg-[#07131f]" aria-busy="true" />
  }

  return <PortalDashboard user={user} />
}
