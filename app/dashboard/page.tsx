"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { useAuth } from "@/lib/auth-context"
import type { Notification } from "@/app/notifikasi/page"
import {
  PortalHubDashboard,
  type PortalHubActivity,
  type PortalHubModule,
  type PortalHubNotification,
} from "@/components/dashboard/portal-hub"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const [notifications, setNotifications] = useState<PortalHubNotification[]>([])
  const [activities, setActivities] = useState<PortalHubActivity[]>([])
  const [modules, setModules] = useState<PortalHubModule[]>([])
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    void Promise.all([
      fetch("/api/portal-access/me", { cache: "no-store" }).then((response) => (response.ok ? response.json() : { modules: [], permissions: [] })),
      fetch("/api/notifications/me?page=1&limit=3", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})),
      fetch("/api/account/activity?page=1&limit=5", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})),
    ]).then(([access, notificationData, activityData]) => {
      const accessPayload = access as { modules?: PortalHubModule[]; permissions?: string[] }
      setModules(accessPayload.modules ?? [])
      setPermissions(accessPayload.permissions ?? [])
      const notifPayload = notificationData as { notifications?: Notification[]; data?: Notification[] }
      setNotifications((notifPayload.notifications ?? notifPayload.data ?? []).slice(0, 3))
      const activityPayload = activityData as { activities?: PortalHubActivity[]; data?: PortalHubActivity[] }
      setActivities((activityPayload.activities ?? activityPayload.data ?? []).slice(0, 3))
    })
  }, [user])

  if (isLoading || !user) return <div className="min-h-screen bg-[#f7faf8] dark:bg-slate-950" />

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf8] dark:bg-slate-950">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-8 lg:max-w-6xl lg:px-8" aria-label="Konten utama dashboard PIINDUNG">
        <PortalHubDashboard
          user={user}
          modules={modules}
          notifications={notifications}
          activities={activities}
          permissions={permissions}
          sessionVerified
        />
      </main>
      <SimpleFooter />
    </div>
  )
}
