"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth, roleDisplayNames } from "@/lib/auth-context"
import { primaryNavigation, type PortalNavigationIcon } from "@/lib/portal-navigation"
import { getResolvedLogoUrl, useStoredSystemSettings, updateStoredSystemColorMode, type ColorMode } from "@/lib/system-settings"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notification-bell"

const navigationIcons: Record<PortalNavigationIcon, React.ElementType> = {
  home: LayoutDashboard,
  members: Users,
  help: CircleHelp,
  profile: User,
}

export const memberMenuSections = [
  {
    title: "Navigasi",
    items: primaryNavigation.map((item) => ({
      ...item,
      icon: navigationIcons[item.icon],
    })),
  },
]

export function MemberSidebar({ collapsed, onCloseMobile }: { collapsed?: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { settings } = useStoredSystemSettings()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark" || (typeof document !== "undefined" && document.documentElement.classList.contains("dark"))

  const handleLogout = () => {
    if (onCloseMobile) onCloseMobile()
    logout()
    window.location.href = "/login"
  }

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-300", collapsed ? "w-[72px]" : "w-[260px] lg:w-[280px]")}>
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="shrink-0">
              <Image src={getResolvedLogoUrl(settings.logoUrl, isDarkMode ? "dark" : "light")} alt={settings.websiteTitle} width={140} height={32} className="h-7 w-auto" />
            </Link>
          </div>
        ) : (
          <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#15945b] text-xs font-bold text-white">PI</Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {memberMenuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {!collapsed && (
                <div className="px-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{section.title}</h3>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/member-area" && pathname.startsWith(item.href))
                  const content = (
                    <div className="relative flex items-center justify-between">
                      <div className={cn("flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400" : "text-muted-foreground hover:bg-accent hover:text-foreground", collapsed && "justify-center px-0")}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                    </div>
                  )

                  return (
                    <Link key={item.id} href={item.href} onClick={onCloseMobile}>{content}</Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0 bg-gradient-to-br from-[#0f3460] to-[#1a4a7a]">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} className="object-cover" />
              <AvatarFallback className="bg-transparent text-white"><User className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user?.name || "Pengguna"}</p>
              <p className="truncate text-xs text-muted-foreground">{user ? roleDisplayNames[user.role] : "Admin"}</p>
            </div>
            <button type="button" onClick={handleLogout} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10" aria-label="Logout"><LogOut className="h-4 w-4" /></button>
          </div>
        ) : (
          <button type="button" onClick={handleLogout} className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20" aria-label="Logout"><LogOut className="h-5 w-5" /></button>
        )}
      </div>
    </aside>
  )
}

export function MemberHeader({ title, breadcrumb, onOpenMobile }: { title: string; breadcrumb: string; onOpenMobile: () => void }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkMode = mounted ? resolvedTheme === "dark" || (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) : false

  useEffect(() => setMounted(true), [])

  const toggleDarkMode = () => {
    const nextMode: ColorMode = isDarkMode ? "light" : "dark"
    setTheme(nextMode)
    updateStoredSystemColorMode(nextMode)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-8">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onOpenMobile} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden" aria-label="Buka menu navigasi"><Menu className="h-5 w-5" /></button>
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">{title}</h1>
          <nav className="hidden text-xs font-medium text-muted-foreground sm:block" aria-label="Breadcrumb">{breadcrumb}</nav>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleDarkMode} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Ganti tema warna">{mounted && isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
        <NotificationBell />
      </div>
    </header>
  )
}

export function MemberLayout({ children, title = "Ringkasan", breadcrumb = "Member Area / Ringkasan" }: { children: React.ReactNode; title?: string; breadcrumb?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false) }
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", escape)
    return () => { document.body.style.overflow = originalOverflow; document.removeEventListener("keydown", escape) }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block"><MemberSidebar /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <MemberSidebar onCloseMobile={() => setMobileOpen(false)} />
        </div>
      )}
      <div className="flex min-h-screen flex-col transition-all duration-300 lg:pl-[280px]">
        <MemberHeader title={title} breadcrumb={breadcrumb} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
