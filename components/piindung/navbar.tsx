"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { getResolvedLogoUrl, useStoredSystemSettings } from "@/lib/system-settings"
import { 
  Bell, 
  AlertCircle,
  CreditCard,
  FileText,
   User,

  Moon,
  Sun,
  LayoutDashboard,
  Menu,
  Users,
  X,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  getPublishedNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  type NotificationIconKey,
  useNotifications,
} from "@/lib/notifications"
import { updateStoredSystemColorMode, type ColorMode } from "@/lib/system-settings"
import { useAuth, roleDisplayNames } from "@/lib/auth-context"
import { primaryNavigation } from "@/lib/portal-navigation"

const navItems = primaryNavigation

function iconFor(iconKey: NotificationIconKey) {
  if (iconKey === "credit-card") return CreditCard
  if (iconKey === "file-text") return FileText
  if (iconKey === "users") return Users
  if (iconKey === "alert-circle") return AlertCircle
  return Bell
}

export function Navbar() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const { settings } = useStoredSystemSettings()
  const { user } = useAuth()
  const pathname = usePathname()
  const notifications = getPublishedNotifications(useNotifications())
  const unreadCount = getUnreadNotificationsCount(notifications)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationOpen(false)
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  const toggleDarkMode = () => {
    const nextMode: ColorMode = document.documentElement.classList.contains("dark") ? "light" : "dark"
    setTheme(nextMode)
    updateStoredSystemColorMode(nextMode)
  }

  const isDarkMode = mounted ? resolvedTheme === "dark" || document.documentElement.classList.contains("dark") : false

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/dashboard" className="shrink-0">
            <Image
              src={getResolvedLogoUrl(settings.logoUrl, isDarkMode ? "dark" : "light")}
              alt={settings.websiteTitle}
              width={180}
              height={50}
              className="h-10 w-auto lg:h-12"
              style={{ width: "auto" }}
              priority
            />
          </Link>

          {/* Right Side - Navigation, Notification, Dark Mode Toggle */}
          <div className="ml-auto flex items-center gap-2 lg:gap-3">
            <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8">
              {navItems.map((item) => {
                const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-all duration-300 ease-out relative py-2 group whitespace-nowrap",
                      isActive
                        ? "text-[#2e8b57]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {isActive ? (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2e8b57] rounded-full" />
                    ) : (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2e8b57] rounded-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 opacity-50" />
                    )}
                  </Link>
                )
              })}
            </nav>
            {/* Mobile Menu Sheet */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button 
                  className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-all duration-200 ease-out"
                  aria-label="Buka menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] border-r border-border p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <SheetHeader className="p-0 mb-6">
                    <SheetTitle className="text-left text-lg font-bold text-foreground">
                      <Image
                        src={getResolvedLogoUrl(settings.logoUrl, isDarkMode ? "dark" : "light")}
                        alt={settings.websiteTitle}
                        width={120}
                        height={32}
                        className="h-8 w-auto"
                        style={{ width: "auto" }}
                      />
                    </SheetTitle>
                  </SheetHeader>
                  
                  <nav className="flex flex-col gap-2 mt-4">
                    {navItems.map((item) => {
                      const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(`${item.href}/`)
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "text-sm font-medium transition-all duration-200 ease-out py-3 px-4 rounded-xl flex items-center gap-3",
                            isActive 
                              ? "text-[#2e8b57] bg-[#2e8b57]/10" 
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-3 px-2 py-1">
                    <Avatar className="w-10 h-10 shadow-sm bg-gradient-to-br from-[#0f3460] to-[#1a4a7a]">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} className="object-cover" />
                      <AvatarFallback className="bg-transparent text-white">
                        <User className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate max-w-[150px]">{user?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">
                        {user ? roleDisplayNames[user.role] : "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={cn(
                  "relative p-2 text-muted-foreground hover:text-foreground transition-all duration-200 ease-out rounded-xl hover:bg-accent",
                  isNotificationOpen && "bg-accent text-foreground"
                )}
                aria-label="Notifications"
                aria-expanded={isNotificationOpen}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-0.5 bg-[#2e8b57] rounded-full text-[10px] font-medium text-white flex items-center justify-center tabular-nums">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <div 
                className={cn(
                  "absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-2xl shadow-xl border border-border overflow-hidden",
                  "transition-all duration-300 ease-out origin-top-right",
                  isNotificationOpen 
                    ? "opacity-100 scale-100 translate-y-0 visible" 
                    : "opacity-0 scale-95 -translate-y-2 invisible"
                )}
                role="menu"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Notifikasi</h3>
                    <p className="text-xs text-muted-foreground">{unreadCount} belum dibaca</p>
                  </div>
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllNotificationsAsRead} className="text-xs text-[#2e8b57] hover:text-[#236b43] font-medium flex items-center gap-1 transition-colors">
                      <Check className="h-3 w-3" />
                      Tandai dibaca
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => {
                    const Icon = iconFor(notification.iconKey)

                    return (
                      <button
                        key={notification.id}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-all duration-200 ease-out text-left border-b border-border/50 last:border-b-0",
                          notification.unread && "bg-[#2e8b57]/5"
                        )}
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          notification.type === "success" && "bg-[#2e8b57]/10",
                          notification.type === "info" && "bg-blue-500/10",
                          notification.type === "warning" && "bg-amber-500/10"
                        )}>
                          <Icon className={cn(
                          "h-4 w-4",
                          notification.type === "success" && "text-[#2e8b57]",
                          notification.type === "info" && "text-blue-500",
                          notification.type === "warning" && "text-amber-500"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm text-foreground truncate",
                              notification.unread && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            {notification.unread && (
                              <span className="w-2 h-2 bg-[#2e8b57] rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-border p-2">
                  <Link
                    href="/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="block w-full text-center py-2 text-sm font-medium text-[#2e8b57] hover:bg-[#2e8b57]/10 rounded-xl transition-colors"
                  >
                    Lihat Semua
                  </Link>
                </div>
              </div>
            </div>

            {/* Dark Mode Toggle - Separate from dropdown */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 ease-out rounded-xl hover:bg-accent"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {mounted && isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

      </div>
    </header>
  )
}
