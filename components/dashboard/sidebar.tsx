"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { primaryNavigation, type PortalNavigationIcon } from "@/lib/portal-navigation"
import { getResolvedLogoUrl, useStoredSystemSettings } from "@/lib/system-settings"
import {
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigationIcons: Record<PortalNavigationIcon, React.ElementType> = {
  home: LayoutDashboard,
  members: Users,
  help: CircleHelp,
  profile: User,
  landing: Globe,
}

export function flattenSidebarItems() {
  return primaryNavigation.map((item) => ({
    ...item,
    roles: ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"] as const,
    icon: navigationIcons[item.icon],
  }))
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
  const userRole = user?.role || "admin_kordes"

  const items = flattenSidebarItems().filter((item) => item.roles.includes(userRole))

  const NavItem = ({ item }: { item: ReturnType<typeof flattenSidebarItems>[number] }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    const Icon = item.icon

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
          <Icon className="h-5 w-5" />
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
            <div className="space-y-2">
              {!collapsed ? (
                <div className="px-3">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="h-px flex-1 bg-border/70" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                      Navigasi
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1">
                {items.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </div>
            </div>
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
                  aria-label="Keluar"
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
