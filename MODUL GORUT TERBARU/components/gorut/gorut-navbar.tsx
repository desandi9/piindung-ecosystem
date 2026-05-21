'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Search, ChevronDown, Menu, Command, Sun, Moon, LogOut, User, Settings, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAuth, roleDisplayNames } from '@/lib/auth-context'
import { useAssignedGorutKecamatan } from '@/lib/gorut/operational-scope'
import { getGorutCurrentPage, getGorutMobileNavItems, isGorutPathActive } from '@/lib/gorut/navigation'
import { SearchDropdown } from './search-dropdown'
import { NotificationDropdown } from './notification-dropdown'

interface GorutNavbarProps {
  onMobileMenuOpen?: () => void
  userName?: string
  userRole?: string
}

export function GorutNavbar({
  userName = 'Desandi Herdiansyah',
  userRole = 'Super Admin PC',
}: GorutNavbarProps) {
  const { user } = useAuth()
  const { scopedRoleLabel } = useAssignedGorutKecamatan()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const resolvedUserName = user?.name ?? userName
  const resolvedUserRole = scopedRoleLabel ?? (user?.role ? roleDisplayNames[user.role] : userRole)
  const currentPage = getGorutCurrentPage(pathname, user?.role)
  const mobileNavItems = getGorutMobileNavItems(user?.role)

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md transition-all duration-300',
        'px-4 sm:px-6'
      )}
    >
      {/* Left Section - Breadcrumb / Page Title */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="size-9">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center border-b px-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700">
                    <Image
                      src="/gorut-logo.png"
                      alt="GORUT"
                      width={40}
                      height={40}
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-emerald-600">GORUT</span>
                    <span className="text-[10px] text-muted-foreground">Koin Infak NU Garut</span>
                  </div>
                </div>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {mobileNavItems.map(({ href, title }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isGorutPathActive(pathname, href)
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {title}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Page Title / Breadcrumb */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold tracking-tight">{currentPage}</h1>
        </div>
      </div>

      {/* Right Section - Search, Notifications, User */}
      <div className="flex items-center gap-2">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full group relative transition-all"
          >
            <div className="relative flex items-center cursor-pointer">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-foreground" />
              <div className="h-9 w-64 bg-muted/50 pl-9 pr-12 text-sm rounded-md border border-border/50 flex items-center text-muted-foreground group-hover:bg-muted group-hover:border-border/70 transition-all">
                Cari di GORUT...
              </div>
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 text-[10px] font-medium text-muted-foreground sm:flex -translate-y-1/2">
                <Command className="size-3" />K
              </kbd>
            </div>
          </button>
        </div>

        {/* Mobile Search Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-9 md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-5" />
        </Button>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-9 text-muted-foreground hover:text-foreground" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <NotificationDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3 hover:bg-muted">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
                <span className="text-sm font-semibold">{resolvedUserName.charAt(0)}</span>
              </div>
              <div className="hidden flex-col items-start lg:flex">
                <span className="text-sm font-medium leading-none">{resolvedUserName}</span>
                <span className="text-[10px] text-muted-foreground">{resolvedUserRole}</span>
              </div>
              <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{resolvedUserName}</p>
                <p className="text-xs text-muted-foreground">{resolvedUserRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              <Link href="/gorut/profil">
                <User className="size-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              <Link href="/gorut/pengaturan-akun">
                <Settings className="size-4" />
                Pengaturan Akun
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              <Link href="/gorut/activity">
                <Activity className="size-4" />
                Aktivitas Log
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Dropdown */}
        <SearchDropdown isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </header>
  )
}
