"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { getUnreadInboxCount, useInboxMessages } from "@/lib/admin-inbox"
import { cn } from "@/lib/utils"
import { useAuth, roleDisplayNames, type UserRole } from "@/lib/auth-context"
import { canAccessMenu, useRolePermissions } from "@/lib/access-permissions"
import { getResolvedLogoUrl, useStoredSystemSettings } from "@/lib/system-settings"
import {
  LayoutDashboard,
  Bell,
  Users,
  Download,
  FileText,
  Archive,
  CircleHelp,
  Contact,
  Megaphone,
  Settings,
  Shield,
  Image as ImageIcon,
  FolderOpen,
  LogIn,
  Activity,
  Database,
  MonitorCog,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
  roles: UserRole[]
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

export const sidebarSections: SidebarSection[] = [
  {
    title: "Dashboard",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin", roles: ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"] },
    ],
  },
  {
    title: "Portal Publik",
    items: [
      { id: "artikel-berita", label: "Artikel & Berita", icon: FileText, href: "/admin/artikel", roles: ["super_admin_pc", "admin_pc"] },
      { id: "banner-homepage", label: "Banner Homepage", icon: ImageIcon, href: "/admin/banner", roles: ["super_admin_pc", "admin_pc"] },
      { id: "galeri-kegiatan", label: "Galeri Kegiatan", icon: ImageIcon, href: "/admin/galeri", roles: ["super_admin_pc", "admin_pc"] },
      { id: "download-center", label: "Download Center", icon: Download, href: "/admin/download", roles: ["super_admin_pc", "admin_pc"] },
      { id: "popup-pengumuman", label: "Popup & Pengumuman", icon: Megaphone, href: "/admin/popup", roles: ["super_admin_pc", "admin_pc"] },
      { id: "faq-manager", label: "FAQ Manager", icon: CircleHelp, href: "/admin/faq", roles: ["super_admin_pc", "admin_pc"] },
      { id: "kontak-sosial", label: "Kontak & Sosial Media", icon: Contact, href: "/admin/kontak-sosial", roles: ["super_admin_pc", "admin_pc"] },
      { id: "media-manager", label: "Media Manager", icon: FolderOpen, href: "/admin/media", roles: ["super_admin_pc"] },
    ],
  },
  {
    title: "Inbox & Broadcast",
    items: [
      { id: "pesan-masuk", label: "Pesan Masuk", icon: Archive, href: "/admin/pesan-masuk", roles: ["super_admin_pc", "admin_pc"] },
      { id: "notifikasi", label: "Notifikasi", icon: Bell, href: "/admin/notifikasi", roles: ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"] },
    ],
  },
  {
    title: "User & Governance",
    items: [
      { id: "kelola-pengguna", label: "Kelola Pengguna", icon: Users, href: "/admin/pengguna", roles: ["super_admin_pc"] },
      { id: "hak-akses", label: "Hak Akses", icon: Shield, href: "/admin/hak-akses", roles: ["super_admin_pc"] },
      { id: "riwayat-login", label: "Riwayat Login", icon: LogIn, href: "/admin/riwayat-login", roles: ["super_admin_pc"] },
    ],
  },
  {
    title: "Monitoring & Audit",
    items: [
      { id: "activity-log", label: "Activity Log", icon: Activity, href: "/admin/activity", roles: ["super_admin_pc", "admin_pc"] },
      { id: "audit-trail", label: "Audit Trail", icon: ShieldCheck, href: "/admin/audit-trail", roles: ["super_admin_pc"] },
    ],
  },
  {
    title: "Sistem & Integrasi",
    items: [
      { id: "aplikasi-terintegrasi", label: "Aplikasi Terintegrasi", icon: Contact, href: "/admin/aplikasi", roles: ["super_admin_pc"] },
      { id: "pengaturan-sistem", label: "Pengaturan Sistem", icon: Settings, href: "/admin/pengaturan", roles: ["super_admin_pc"] },
      { id: "system-health", label: "System Health", icon: ShieldCheck, href: "/admin/system-health", roles: ["super_admin_pc"] },
      { id: "maintenance-mode", label: "Maintenance Mode", icon: MonitorCog, href: "/admin/maintenance", roles: ["super_admin_pc"] },
      { id: "backup-restore", label: "Backup & Restore", icon: Database, href: "/admin/backup", roles: ["super_admin_pc"] },
    ],
  },
]

function getVisibleItems(items: SidebarItem[], role: UserRole): SidebarItem[] {
  return items.filter(item => item.roles.includes(role))
}

export function flattenSidebarItems() {
  return sidebarSections.flatMap((section) => section.items)
}

interface DashboardSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function DashboardSidebar({ collapsed = false, onCollapsedChange }: DashboardSidebarProps) {
  const pathname = usePathname()
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const { user, logout } = useAuth()
  const { settings } = useStoredSystemSettings()
  const permissions = useRolePermissions()
  const inboxMessages = useInboxMessages()
  const userRole = user?.role || "admin_kordes"
  const unreadInboxCount = getUnreadInboxCount(inboxMessages)
  
  const visibleSections = sidebarSections
    .map((section) => ({
      ...section,
      items: getVisibleItems(section.items, userRole).filter((item) => canAccessMenu(userRole, item.id, permissions)),
    }))
    .filter((section) => section.items.length > 0)

  const NavItem = ({ item }: { item: SidebarItem }) => {
    const isDashboardRootItem = item.href === "/admin"
    const isActive = isDashboardRootItem ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")
    const Icon = item.icon
    const showInboxBadge = item.id === "pesan-masuk" && unreadInboxCount > 0

    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          !collapsed && !isActive && "hover:translate-x-0.5",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="relative shrink-0">
          <Icon className={cn("h-5 w-5", collapsed ? "h-5 w-5" : "h-5 w-5")} />
          {showInboxBadge ? (
            <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-medium text-white">
              {unreadInboxCount > 99 ? "99+" : unreadInboxCount}
            </span>
          ) : null}
        </div>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  useEffect(() => {
    const container = navContainerRef.current
    if (!container) return

    const storageKey = `piindung-admin-sidebar-scroll:${userRole}`
    const savedOffset = window.sessionStorage.getItem(storageKey)

    if (savedOffset) {
      container.scrollTop = Number.parseInt(savedOffset, 10) || 0
    }

    const handleScroll = () => {
      window.sessionStorage.setItem(storageKey, String(container.scrollTop))
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [userRole])

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] backdrop-blur-sm transition-all duration-300 ease-out",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src={getResolvedLogoUrl(settings.logoUrl, settings.colorMode)}
                alt={settings.websiteTitle}
                width={140}
                height={40}
                className="h-8 w-auto dark:brightness-110"
                style={{ width: "auto" }}
              />
            </Link>
          ) : (
            <Link href="/dashboard">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">PI</span>
              </div>
            </Link>
          )}
           <Button
             variant="ghost"
             size="icon"
             onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(
              "h-8 w-8 rounded-lg hover:bg-accent transition-all duration-200 ease-out",
              collapsed && "absolute -right-3 top-6 bg-card border border-border shadow-sm"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div ref={navContainerRef} className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-4">
            {visibleSections.map((section, sectionIndex) => (
              <div key={section.title} className="space-y-2">
                {!collapsed ? (
                  <div className="px-3">
                    <div className="flex items-center gap-2 pb-2">
                      <div className="h-px flex-1 bg-border/70" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                        {section.title}
                      </span>
                    </div>
                  </div>
                ) : sectionIndex > 0 ? (
                  <div className="px-2 pt-1">
                    <div className="h-px rounded-full bg-border/70" />
                  </div>
                ) : null}

                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

        </div>

        {/* Footer */}
        <div className={cn(
          "p-3 border-t border-border shrink-0",
          collapsed && "flex justify-center"
        )}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void logout()}
                  className="h-10 w-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Keluar</TooltipContent>
            </Tooltip>
          ) : (
             <Button
               variant="ghost"
               onClick={() => void logout()}
               className="h-11 w-full justify-start gap-3 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
             >
               <LogOut className="h-5 w-5" />
               <span>Keluar</span>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
