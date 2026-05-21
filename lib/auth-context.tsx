"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { roleDisplayNames } from "@/features/auth"
import { addActivityLog, formatActivityDateTime } from "@/lib/activity-log"
import { MANAGED_USERS_EVENT } from "@/lib/managed-users"
import type { AppRole, AuthUser } from "@/types/auth"

export type UserRole = AppRole
export type User = AuthUser
export { roleDisplayNames }

// Menu items configuration based on roles
export interface MenuItem {
  id: string
  label: string
  description: string
  icon: string
  href: string
  roles: UserRole[] // Which roles can see this menu
  section: "admin" | "management" | "system" | "profile"
}

export const adminMenuItems: MenuItem[] = [
  // Admin Section - Super Admin Only
  {
    id: "dashboard-admin",
    label: "Dashboard Admin",
    description: "Panel kontrol administrator",
    icon: "LayoutDashboard",
    href: "/admin",
    roles: ["super_admin_pc", "admin_pc"],
    section: "admin",
  },
  {
    id: "kelola-pengguna",
    label: "Kelola Pengguna",
    description: "Manajemen akun pengguna",
    icon: "Users",
    href: "/admin/pengguna",
    roles: ["super_admin_pc"],
    section: "admin",
  },
  {
    id: "kelola-role",
    label: "Kelola Role & Hak Akses",
    description: "Pengaturan hak akses",
    icon: "Shield",
    href: "/admin/hak-akses",
    roles: ["super_admin_pc"],
    section: "admin",
  },
  // Management Section
  {
    id: "kelola-artikel",
    label: "Kelola Artikel / Berita",
    description: "Manajemen konten berita",
    icon: "FileText",
    href: "/admin/artikel",
    roles: ["super_admin_pc", "admin_pc"],
    section: "management",
  },
  {
    id: "kelola-banner",
    label: "Kelola Banner & Homepage",
    description: "Pengaturan halaman utama",
    icon: "Image",
    href: "/admin/banner",
    roles: ["super_admin_pc", "admin_pc"],
    section: "management",
  },
  // System Section
  {
    id: "pengaturan-sistem",
    label: "Pengaturan Sistem",
    description: "Konfigurasi sistem",
    icon: "Settings",
    href: "/admin/pengaturan",
    roles: ["super_admin_pc"],
    section: "system",
  },
  {
    id: "system-health",
    label: "System Health",
    description: "Monitoring kesehatan sistem dan data utama.",
    icon: "ShieldCheck",
    href: "/admin/system-health",
    roles: ["super_admin_pc"],
    section: "system",
  },
  {
    id: "audit-trail",
    label: "Audit Trail",
    description: "Jejak perubahan konten, akses, dan sistem.",
    icon: "ShieldCheck",
    href: "/admin/audit-trail",
    roles: ["super_admin_pc"],
    section: "system",
  },
  {
    id: "maintenance-mode",
    label: "Maintenance Mode",
    description: "Kontrol maintenance mode global",
    icon: "MonitorCog",
    href: "/admin/maintenance",
    roles: ["super_admin_pc"],
    section: "system",
  },
  {
    id: "activity-log",
    label: "Activity Log",
    description: "Riwayat aktivitas sistem",
    icon: "Activity",
    href: "/admin/activity",
    roles: ["super_admin_pc", "admin_pc"],
    section: "system",
  },
  {
    id: "backup-restore",
    label: "Backup & Restore",
    description: "Cadangan data sistem",
    icon: "Database",
    href: "/admin/backup",
    roles: ["super_admin_pc"],
    section: "system",
  },
]

// UPZIS specific menus
export const upzisMenuItems: MenuItem[] = [
  {
    id: "data-upzis",
    label: "Data UPZIS",
    description: "Kelola data UPZIS",
    icon: "Building",
    href: "/upzis/data",
    roles: ["super_admin_pc", "admin_pc", "admin_upzis"],
    section: "management",
  },
  {
    id: "laporan-upzis",
    label: "Laporan UPZIS",
    description: "Laporan kegiatan UPZIS",
    icon: "BarChart",
    href: "/upzis/reports",
    roles: ["super_admin_pc", "admin_pc", "admin_upzis"],
    section: "management",
  },
]

// Kordes specific menus
export const kordesMenuItems: MenuItem[] = [
  {
    id: "data-kordes",
    label: "Data Kordes",
    description: "Kelola data koordinator desa",
    icon: "MapPin",
    href: "/kordes/data",
    roles: ["super_admin_pc", "admin_pc", "admin_kordes"],
    section: "management",
  },
  {
    id: "laporan-kordes",
    label: "Laporan Kordes",
    description: "Laporan kegiatan koordinator",
    icon: "ClipboardList",
    href: "/kordes/reports",
    roles: ["super_admin_pc", "admin_pc", "admin_kordes"],
    section: "management",
  },
]

// Get menu items for a specific role
export function getMenuItemsForRole(role: UserRole): MenuItem[] {
  const allMenus = [...adminMenuItems, ...upzisMenuItems, ...kordesMenuItems]
  return allMenus.filter((item) => item.roles.includes(role))
}

// Auth Context
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (identifier: string, password: string, options?: { remember?: boolean }) => Promise<boolean>
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" })
        if (!response.ok) {
          if (isMounted) setUser(null)
          return
        }

        const payload = (await response.json()) as { user: User | null }
        if (isMounted) setUser(payload.user)
      } catch {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    async function syncCurrentSession() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" })
        if (!response.ok) {
          setUser(null)
          return
        }

        const payload = (await response.json()) as { user: User | null }
        setUser(payload.user)
      } catch {
        setUser(null)
      }
    }

    window.addEventListener(MANAGED_USERS_EVENT, syncCurrentSession)

    return () => {
      window.removeEventListener(MANAGED_USERS_EVENT, syncCurrentSession)
    }
  }, [])

  const login = async (identifier: string, password: string, options?: { remember?: boolean }): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: identifier, password, remember: options?.remember ?? true }),
      })

      if (!response.ok) {
        addActivityLog({
          userName: identifier,
          type: "Login",
          action: "Login gagal atau akun tidak aktif",
          loginAction: "Login",
          status: "Failed",
        })
        return false
      }

      const payload = (await response.json()) as { user: User }
      setUser(payload.user)
      addActivityLog({
        userName: payload.user.name,
        type: "Login",
        action: "Login ke Admin Dashboard",
        roleLabel: roleDisplayNames[payload.user.role],
        loginAction: "Login",
        status: "Success",
      })
      return true
    } catch {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    if (user) {
      addActivityLog({
        userName: user.name,
        type: "Login",
        action: "Logout dari Admin Dashboard",
        roleLabel: roleDisplayNames[user.role],
        loginAction: "Logout",
        status: "Success",
      })
    }

    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch {
      // ignore logout transport errors and clear the client session anyway
    }

    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
