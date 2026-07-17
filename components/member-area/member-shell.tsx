"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Bell,
  Box,
  Check,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
  User,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useAuth, roleDisplayNames } from "@/lib/auth-context"
import { getResolvedLogoUrl, useStoredSystemSettings, updateStoredSystemColorMode, type ColorMode } from "@/lib/system-settings"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  getPublishedNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  useNotifications,
} from "@/lib/notifications"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const memberMenuSections = [
  {
    title: "MAIN",
    items: [{ id: "ringkasan", label: "Ringkasan", href: "/member-area", icon: LayoutDashboard }],
  },
  {
    title: "MANAJEMEN",
    items: [
      { id: "pengguna", label: "Pengguna & Akses", href: "/member-area/pengguna", icon: Users },
      { id: "organisasi", label: "Organisasi & Wilayah", href: "#", icon: MapPin, status: "Segera Tersedia" },
      { id: "produk", label: "Produk & Modul", href: "#", icon: Box, status: "Segera Tersedia" },
    ],
  },
  {
    title: "KONTEN",
    items: [{ id: "konten-publik", label: "Konten Publik", href: "#", icon: Search, status: "Segera Tersedia" }],
  },
  {
    title: "PEMANTAUAN",
    items: [{ id: "monitoring", label: "Monitoring & Audit", href: "#", icon: ShieldCheck, status: "Segera Tersedia" }],
  },
  {
    title: "SISTEM",
    items: [{ id: "pengaturan", label: "Pengaturan Sistem", href: "#", icon: Settings, status: "Segera Tersedia" }],
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
            <div className="flex flex-col border-l border-border pl-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#15945b]">Member Area</span>
              <span className="text-[10px] font-medium text-muted-foreground">Super Admin</span>
            </div>
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
                  const isDisabled = item.status === "Segera Tersedia"
                  const content = (
                    <div className="relative flex items-center justify-between">
                      <div className={cn("flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400" : isDisabled ? "cursor-not-allowed opacity-50" : "text-muted-foreground hover:bg-accent hover:text-foreground", collapsed && "justify-center px-0")}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                    </div>
                  )

                  return isDisabled ? (
                    <div key={item.id} className="cursor-not-allowed" title="Segera Tersedia">{content}</div>
                  ) : (
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkMode = mounted ? resolvedTheme === "dark" || (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) : false
  const notifications = getPublishedNotifications(useNotifications())
  const unreadCount = getUnreadNotificationsCount(notifications)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => { if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setIsNotificationOpen(false) }
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setIsNotificationOpen(false) }
    document.addEventListener("mousedown", clickOutside)
    document.addEventListener("keydown", escape)
    return () => { document.removeEventListener("mousedown", clickOutside); document.removeEventListener("keydown", escape) }
  }, [])

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
        <div className="relative" ref={notificationRef}>
          <button type="button" onClick={() => setIsNotificationOpen(!isNotificationOpen)} className={cn("relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors", isNotificationOpen ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")} aria-label="Notifikasi">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute right-2 top-2 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-[#15945b] px-0.5 text-[8px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </button>
          {isNotificationOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:w-96">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div><h3 className="font-semibold text-foreground">Notifikasi</h3><p className="text-xs text-muted-foreground">{unreadCount} belum dibaca</p></div>
                {unreadCount > 0 && <button type="button" onClick={markAllNotificationsAsRead} className="flex items-center gap-1 text-xs font-medium text-[#15945b] hover:text-[#107947]"><Check className="h-3 w-3" /> Tandai dibaca</button>}
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {notifications.length ? notifications.map((notif) => (
                  <div key={notif.id} className={cn("mb-1 rounded-xl p-3 text-sm", notif.unread ? "bg-accent" : "hover:bg-accent/50")}>
                    <div className="flex items-center justify-between"><p className="font-semibold text-foreground">{notif.title}</p>{notif.unread && <span className="h-2 w-2 rounded-full bg-[#15945b]" />}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{notif.description}</p>
                    <p className="mt-2 text-[10px] font-medium text-muted-foreground/70">{notif.time}</p>
                  </div>
                )) : <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada notifikasi.</div>}
              </div>
              <div className="border-t border-border p-2"><Link href="/notifikasi" onClick={() => setIsNotificationOpen(false)} className="block rounded-lg py-2 text-center text-sm font-medium text-[#15945b] transition-colors hover:bg-[#e6f7ee] dark:hover:bg-emerald-500/10">Lihat Semua</Link></div>
            </div>
          )}
        </div>
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
