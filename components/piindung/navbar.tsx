"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { getResolvedLogoUrl, useStoredSystemSettings } from "@/lib/system-settings"
import { adminDashboardRoles } from "@/features/auth"
import { 
  Bell, 
  AlertCircle,
  ChevronDown, 
  CreditCard,
  FileText,
  User, 
  Settings, 
  HelpCircle, 
  LogOut,
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
  getPublishedNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  type NotificationIconKey,
  useNotifications,
} from "@/lib/notifications"
import { updateStoredSystemColorMode, type ColorMode } from "@/lib/system-settings"
import { 
  useAuth, 
  roleDisplayNames, 
} from "@/lib/auth-context"

const navItems = [
  { label: "Beranda", href: "/dashboard" },
  { label: "Program", href: "/program" },
  { label: "Informasi", href: "/informasi" },
  { label: "Laporan", href: "/laporan" },
]

const commonProfileMenuItems = [
  { 
    label: "Profil Saya", 
    description: "Lihat informasi profil",
    icon: User, 
    href: "/profil" 
  },
  { 
    label: "Pengaturan Profil", 
    description: "Edit profil & password",
    icon: Settings, 
    href: "/pengaturan-profil" 
  },
  { 
    label: "Bantuan", 
    description: "Pusat bantuan",
    icon: HelpCircle, 
    href: "/bantuan" 
  },
] as const

const portalManagementProfileMenuItems = [
  { 
    label: "Dashboard Admin", 
    description: "Panel kontrol administrator",
    icon: LayoutDashboard, 
    href: "/admin" 
  },
] as const

function iconFor(iconKey: NotificationIconKey) {
  if (iconKey === "credit-card") return CreditCard
  if (iconKey === "file-text") return FileText
  if (iconKey === "users") return Users
  if (iconKey === "alert-circle") return AlertCircle
  return Bell
}

export function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const { settings } = useStoredSystemSettings()
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const notifications = getPublishedNotifications(useNotifications())
  const unreadCount = getUnreadNotificationsCount(notifications)
  const canAccessAdminDashboard = user?.role ? adminDashboardRoles.includes(user.role) : false
  const visibleProfileMenuItems = canAccessAdminDashboard
    ? [...portalManagementProfileMenuItems, ...commonProfileMenuItems]
    : commonProfileMenuItems

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
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
        setIsDropdownOpen(false)
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

  const handleLogout = () => {
    setIsDropdownOpen(false)
    logout()
    window.location.href = "/login"
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

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-all duration-200 ease-out relative py-2",
                    isActive 
                      ? "text-[#2e8b57]" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2e8b57]" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Side - Notification, Dark Mode Toggle, Profile */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-all duration-200 ease-out"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

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
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#2e8b57] rounded-full text-[10px] font-medium text-white flex items-center justify-center">
                    {unreadCount}
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

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ease-out",
                  "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-[#2e8b57]/20",
                  isDropdownOpen && "bg-accent"
                )}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-card shadow-sm bg-gradient-to-br from-[#0f3460] to-[#1a4a7a]">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} className="object-cover" />
                    <AvatarFallback className="bg-transparent text-white">
                      <User className="h-5 w-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#2e8b57] border-2 border-card rounded-full" />
                </div>
                
                {/* User Info */}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-foreground">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user ? roleDisplayNames[user.role] : "Loading..."}
                  </p>
                </div>
                
                {/* Dropdown Arrow */}
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isDropdownOpen && "rotate-180"
                  )} 
                />
              </button>

              {/* Dropdown Menu - Simplified */}
              <div 
                className={cn(
                  "absolute right-0 top-full mt-2 w-72 bg-card rounded-2xl shadow-xl border border-border overflow-hidden",
                  "transition-all duration-300 ease-out origin-top-right",
                  isDropdownOpen 
                    ? "opacity-100 scale-100 translate-y-0 visible" 
                    : "opacity-0 scale-95 -translate-y-2 invisible"
                )}
                role="menu"
                aria-orientation="vertical"
              >
                {/* User Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-accent to-card border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 shadow-md bg-gradient-to-br from-[#0f3460] to-[#1a4a7a]">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} className="object-cover" />
                      <AvatarFallback className="bg-transparent text-white">
                        <User className="h-6 w-6 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{user?.name || "User"}</p>
                      <p className="text-sm text-muted-foreground">
                        {user ? roleDisplayNames[user.role] : "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items - Clean & Minimalist */}
                <div className="py-2">
                  {visibleProfileMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-all duration-200 ease-out group"
                      role="menuitem"
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-[#2e8b57]/10 transition-colors duration-150">
                        <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-[#2e8b57] transition-colors duration-150" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-[#2e8b57] transition-colors duration-150">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-t border-border py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-destructive/10 transition-all duration-200 ease-out group"
                    role="menuitem"
                  >
                    <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors duration-150">
                      <LogOut className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-destructive">Logout</p>
                      <p className="text-xs text-destructive/70">Keluar dari akun</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-border py-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-sm font-medium transition-all duration-200 ease-out py-2 px-3 rounded-lg",
                      isActive 
                        ? "text-[#2e8b57] bg-[#2e8b57]/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
