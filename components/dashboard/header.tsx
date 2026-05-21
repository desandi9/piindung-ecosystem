"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { getUnreadInboxCount, markAllInboxMessagesAsRead, updateInboxMessageStatus, useInboxMessages } from "@/lib/admin-inbox"
import { useAuth, roleDisplayNames } from "@/lib/auth-context"
import { canAccessMenu, useRolePermissions } from "@/lib/access-permissions"
import { useActivityLogs } from "@/lib/activity-log"
import { useMaintenanceSettings } from "@/lib/maintenance-mode"
import { useAssignedGorutKecamatan } from "@/MODUL GORUT TERBARU/lib/gorut/operational-scope"
import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  Search,
  Bell,
  FileText,
  FolderOpen,
  Moon,
  Sun,
  HelpCircle,
  ChevronDown,
  Menu,
  Home,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { updateStoredSystemColorMode, type ColorMode } from "@/lib/system-settings"
import { flattenSidebarItems } from "./sidebar"

interface DashboardHeaderProps {
  onMenuClick?: () => void
  sidebarCollapsed?: boolean
}

interface SearchResultItem {
  id: string
  title: string
  description: string
  href: string
  group: string
  icon: React.ElementType
  meta?: string
}

export function DashboardHeader({ onMenuClick, sidebarCollapsed }: DashboardHeaderProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { user } = useAuth()
  const { scopedRoleLabel } = useAssignedGorutKecamatan()
  const permissions = useRolePermissions()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const inboxMessages = useInboxMessages()
  const activityLogs = useActivityLogs()
  const { settings: maintenanceSettings } = useMaintenanceSettings()
  const unreadInboxCount = getUnreadInboxCount(inboxMessages)
  const recentMessages = inboxMessages.slice(0, 5)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const userInitials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD"

  const menuSearchResults = useMemo(() => {
    if (!user?.role) return [] as SearchResultItem[]

    return flattenSidebarItems()
      .filter((item) => item.roles.includes(user.role) && canAccessMenu(user.role, item.id, permissions))
      .map((item) => ({
        id: `menu-${item.id}`,
        title: item.label,
        description: `Buka menu ${item.label}`,
        href: item.href,
        group: "Menu",
        icon: item.icon,
      }))
  }, [permissions, user?.role])

  const searchGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const sourceGroups: Array<{ key: string; items: SearchResultItem[] }> = [{ key: "Menu", items: menuSearchResults }]

    return sourceGroups
      .map((group) => {
        const items = query.length === 0
          ? group.items.slice(0, group.key === "Menu" ? 8 : 3)
          : group.items.filter((item) => `${item.title} ${item.description} ${item.meta ?? ""}`.toLowerCase().includes(query)).slice(0, 5)

        return {
          heading: group.key,
          items,
        }
      })
      .filter((group) => group.items.length > 0)
  }, [menuSearchResults, searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setSearchOpen(false)
      }
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationOpen(false)
      }
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    function handleKeyboardShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
        setMobileSearchOpen(false)
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyboardShortcut)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyboardShortcut)
    }
  }, [])

  const toggleTheme = () => {
    const nextMode: ColorMode = document.documentElement.classList.contains("dark") ? "light" : "dark"
    setTheme(nextMode)
    updateStoredSystemColorMode(nextMode)
  }

  const systemStatus = maintenanceSettings.enabled
    ? { label: "Maintenance Active", tone: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" }
    : { label: "System Online", tone: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" }

  function handleSearchSelect(href: string) {
    router.push(href)
    setSearchOpen(false)
    setMobileSearchOpen(false)
    setNotificationOpen(false)
    setProfileOpen(false)
    setSearchQuery("")
  }

  function handleNavAway(href: string) {
    setSearchOpen(false)
    setMobileSearchOpen(false)
    setNotificationOpen(false)
    setProfileOpen(false)
    router.push(href)
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-30 h-16 border-b border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] backdrop-blur-md transition-all duration-300 ease-out",
          sidebarCollapsed ? "left-[72px]" : "left-[260px]",
          "max-lg:left-0"
        )}
      >
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Cari menu, artikel, user, notifikasi, media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="w-[280px] lg:w-[400px] pl-9 pr-14 h-10 rounded-xl border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border bg-background/80 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <span>Ctrl</span>
              <span>K</span>
            </div>

            {searchOpen ? (
              <div className="absolute left-0 top-full z-50 mt-2 w-[420px] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
                <Command className="bg-transparent">
                  <SearchResults groups={searchGroups} onSelect={handleSearchSelect} activityCount={activityLogs.length} />
                </Command>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
              <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => setNotificationOpen((current) => !current)}>
                <Bell className="h-5 w-5" />
                {unreadInboxCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
                    {unreadInboxCount > 99 ? "99+" : unreadInboxCount}
                  </span>
                ) : null}
              </Button>
            {notificationOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 text-sm font-medium">
                <span>Pesan Masuk</span>
                <Badge variant="secondary" className="text-xs">{unreadInboxCount} Baru</Badge>
              </div>
              <div className="h-px bg-border" />
              <div className="max-h-[300px] overflow-y-auto">
                {recentMessages.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Belum ada pesan masuk.</div>
                ) : (
                  recentMessages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      className="flex w-full cursor-pointer flex-col items-start gap-1 p-3 text-left hover:bg-accent"
                      onClick={() => {
                        updateInboxMessageStatus(message.id, "Read")
                        setNotificationOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn("h-2 w-2 rounded-full", message.status === "Unread" ? "bg-primary" : "bg-muted")}/>
                        <span className="font-medium text-sm">{message.title}</span>
                      </div>
                      <p className="pl-4 text-xs text-muted-foreground">{message.source} • {message.senderName}</p>
                      <p className="pl-4 text-xs text-muted-foreground line-clamp-2">{message.message}</p>
                      <span className="pl-4 text-xs text-muted-foreground">{message.createdAtLabel}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between gap-2 p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={markAllInboxMessagesAsRead}
                  className="text-primary"
                  disabled={unreadInboxCount === 0}
                >
                  Tandai Dibaca
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => handleNavAway("/admin/pesan-masuk")}>
                  Lihat Semua
                </Button>
              </div>
            </div>
            ) : null}
          </div>

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium shadow-sm">
            <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", systemStatus.dot)} />
            <span className={cn("whitespace-nowrap", systemStatus.tone)}>{systemStatus.label}</span>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
              <Button
                variant="ghost"
                className="h-auto p-1.5 pl-2 pr-3 rounded-xl hover:bg-accent gap-2"
                onClick={() => setProfileOpen((current) => !current)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none">{user?.name || "Admin"}</span>
                  <span className="text-xs text-muted-foreground leading-none mt-0.5">
                    {scopedRoleLabel ?? (user?.role ? roleDisplayNames[user.role] : "Admin")}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
              </Button>
            {profileOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
              <div className="px-3 py-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="p-1.5">
                <button type="button" className="flex w-full cursor-pointer items-center rounded-xl px-2 py-2 text-left text-sm hover:bg-accent" onClick={() => handleNavAway("/dashboard")}>
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Dashboard Utama
                </button>
                <button type="button" className="flex w-full cursor-pointer items-center rounded-xl px-2 py-2 text-left text-sm hover:bg-accent" onClick={() => handleNavAway("/bantuan")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Bantuan
                </button>
              </div>
            </div>
            ) : null}
            </div>
        </div>
        </div>
      </header>

      <CommandDialog
        open={mobileSearchOpen}
        onOpenChange={setMobileSearchOpen}
        title="Global Admin Search"
        description="Cari menu, artikel, pengguna, notifikasi, atau media"
        className="max-w-2xl rounded-2xl"
      >
        <CommandInput value={searchQuery} onValueChange={setSearchQuery} placeholder="Cari menu, artikel, user, notifikasi, media..." />
        <SearchResults groups={searchGroups} onSelect={handleSearchSelect} activityCount={activityLogs.length} />
      </CommandDialog>
    </>
  )
}

function SearchResults({
  groups,
  onSelect,
  activityCount,
}: {
  groups: Array<{ heading: string; items: SearchResultItem[] }>
  onSelect: (href: string) => void
  activityCount: number
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Global search untuk Super Admin Dashboard</span>
        <span>{activityCount} aktivitas tercatat</span>
      </div>
      <CommandList className="max-h-[420px]">
        <CommandEmpty className="py-10 text-center text-sm text-muted-foreground">
          Tidak ada hasil yang cocok.
        </CommandEmpty>
        {groups.map((group, index) => (
          <div key={group.heading}>
            {index > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => {
                const Icon = item.icon

                return (
                  <CommandItem key={item.id} value={`${item.title} ${item.description} ${item.meta ?? ""}`} onSelect={() => onSelect(item.href)} className="rounded-xl px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.title}</div>
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      {item.meta ? <p className="truncate text-[11px] text-muted-foreground/80">{item.meta}</p> : null}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Pilih hasil pencarian untuk membuka halaman terkait</span>
        <CommandShortcut>Ctrl/Cmd K</CommandShortcut>
      </div>
    </>
  )
}
