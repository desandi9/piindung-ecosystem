"use client"

import { useMemo } from "react"
import { canAccessAdminDashboard, canAccessRoute, isSuperAdminOnlyRoute } from "@/features/auth"
import type { AppRole } from "@/types/auth"

export function useAdminRouteAccess(pathname: string, role?: AppRole | null) {
  return useMemo(() => {
    return {
      canAccessDashboard: canAccessAdminDashboard(role),
      isSuperAdminRestrictedRoute: isSuperAdminOnlyRoute(pathname),
      canAccessRoute: canAccessRoute(pathname, role),
    }
  }, [pathname, role])
}
