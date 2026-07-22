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
import { useAuth, roleDisplayNames } from "@/lib/auth-context"
import { primaryNavigation } from "@/lib/portal-navigation"
import { NotificationBell } from "@/components/notification-bell"

const navItems = primaryNavigation

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { settings } = useStoredSystemSettings()
  const { user } = useAuth()
  const pathname = usePathname()
  useEffect(() => setMounted(true), [])
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
            <NotificationBell />

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
