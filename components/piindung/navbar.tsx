"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { getResolvedLogoUrl, useStoredSystemSettings } from "@/lib/system-settings"
import {
  Moon,
  Sun,
  Menu,
  User,
  Home,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { updateStoredSystemColorMode, type ColorMode } from "@/lib/system-settings"
import { useRouter } from "next/navigation"
import { useAuth, roleDisplayNames } from "@/lib/auth-context"
import { primaryNavigation } from "@/lib/portal-navigation"
import { NotificationBell } from "@/components/notification-bell"

const navItems = primaryNavigation.filter((item) => item.id !== "landing-page")

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { settings } = useStoredSystemSettings()
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => setMounted(true), [])
  const toggleDarkMode = () => {
    const nextMode: ColorMode = document.documentElement.classList.contains("dark") ? "light" : "dark"
    setTheme(nextMode)
    updateStoredSystemColorMode(nextMode)
  }
  const isDarkMode = mounted ? resolvedTheme === "dark" || document.documentElement.classList.contains("dark") : false

  return (
    <header className="sticky top-0 z-50 transition-colors duration-300">
      <div className="mx-auto max-w-[1360px] px-3 pt-3 sm:px-5 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3 rounded-full border border-[#dfe9e4]/90 bg-white/85 px-3 shadow-[0_10px_28px_rgba(8,33,59,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1e2d]/88 sm:h-16 sm:px-4 lg:h-[68px] lg:px-5">
          <Link href="/dashboard" className="shrink-0 pl-1">
            <Image
              src={getResolvedLogoUrl(settings.logoUrl, isDarkMode ? "dark" : "light")}
              alt={settings.websiteTitle}
              width={180}
              height={50}
              className="h-9 w-auto lg:h-11"
              style={{ width: "auto" }}
              priority
            />
          </Link>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            <nav className="hidden items-center gap-1 rounded-full bg-[#f4f8f6]/80 p-1 dark:bg-white/5 md:flex">
              {navItems.map((item) => {
                const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap lg:px-4",
                      isActive
                        ? "bg-[#e6f7ef] text-[#07965d] shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "text-[#6c7a89] hover:bg-white hover:text-[#08213b] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="rounded-full p-2 text-[#6c7a89] transition-all duration-200 hover:bg-[#e6f7ef] hover:text-[#07965d] md:hidden dark:text-slate-300 dark:hover:bg-white/10"
                  aria-label="Buka menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[300px] flex-col justify-between border-r border-[#dfe9e4] p-6 dark:border-white/10">
                <div className="flex-1">
                  <SheetHeader className="mb-6 p-0">
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

                  <nav className="mt-4 flex flex-col gap-1.5">
                    {navItems.map((item) => {
                      const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(`${item.href}/`)
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                <div className="flex flex-col gap-2 border-t border-[#dfe9e4] pt-4 dark:border-white/10">
                  <div className="flex items-center gap-3 px-2 py-1">
                    <Avatar className="h-10 w-10 bg-gradient-to-br from-[#08213b] to-[#1a4a7a] shadow-sm">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} className="object-cover" />
                      <AvatarFallback className="bg-transparent text-white">
                        <User className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="max-w-[150px] truncate text-sm font-semibold text-foreground">{user?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">
                        {user ? roleDisplayNames[user.role] : "Loading..."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false)
                      await logout()
                      router.push("/")
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-all duration-200 hover:bg-red-500/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Keluar / Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <Link
              href="/"
              className="rounded-full p-2 text-[#6c7a89] transition-all duration-200 hover:bg-[#e6f7ef] hover:text-[#07965d] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-emerald-300"
              title="Kembali ke Landing Page"
            >
              <Home className="h-5 w-5" />
            </Link>

            <NotificationBell />

            <button
              onClick={toggleDarkMode}
              className="rounded-full p-2 text-[#6c7a89] transition-all duration-200 hover:bg-[#e6f7ef] hover:text-[#07965d] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-emerald-300"
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
