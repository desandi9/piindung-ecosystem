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

  if (isLoading || !user) {
    return <div className="min-h-screen bg-[#f8fbf9] dark:bg-[#07131f]" />
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f8fbf9] text-[#08213b] dark:bg-[#07131f] dark:text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(8,33,59,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(8,33,59,.035)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-20" />
        <div className="hero-soft-blob hero-soft-blob-one" />
        <div className="hero-soft-blob hero-soft-blob-two" />
        <div className="hero-soft-blob hero-soft-blob-three" />
      </div>
      <Navbar />
      <main
        className="relative mx-auto w-full max-w-[1360px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12"
        aria-label="Konten utama dashboard PIINDUNG"
      >
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
