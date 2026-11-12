"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ChevronDown, LogOut, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { roleDisplayNames } from "@/features/auth/role-config"
import { useAuth } from "@/lib/auth-context"
import { DEFAULT_SITE_BRANDING } from "@/lib/site-branding"
import type { DashboardLink } from "@/lib/portal-dashboard"
import type { AuthUser } from "@/types/auth"
import { cn } from "@/lib/utils"
import { portalIcons } from "./portal-icons"

export function initialsOf(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)
  return (words.slice(0, 2).map((word) => word[0]).join("") || "P").toUpperCase()
}

const navLinkClass = "rounded-full px-4 py-2 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c]"
const iconButtonClass = "grid h-11 w-11 place-items-center rounded-full text-[#0b4f33] transition hover:bg-[#eef7e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c] dark:text-[#c9f26d] dark:hover:bg-white/10"

export function PortalHeader({ user, helpHref, accountLinks, showNotifications, dark, onToggleTheme }: { user: AuthUser; helpHref: string; accountLinks: DashboardLink[]; showNotifications: boolean; dark: boolean; onToggleTheme: () => void }) {
  const { logout } = useAuth()
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const logo = DEFAULT_SITE_BRANDING.logos.navbarLight
  const logoDark = DEFAULT_SITE_BRANDING.logos.navbarDark

  const signOut = async () => {
    setLeaving(true)
    await logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#e3ede0] bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-[#07131f]/90">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" aria-label="Beranda dashboard PIINDUNG" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c]">
          <Image src={logo.path} alt="PIINDUNG — NU Care–LAZISNU Garut" width={logo.width} height={logo.height} priority className="h-auto w-[132px] dark:hidden sm:w-[160px]" />
          <Image src={logoDark.path} alt="PIINDUNG — NU Care–LAZISNU Garut" width={logoDark.width} height={logoDark.height} priority className="hidden h-auto w-[132px] dark:block sm:w-[160px]" />
        </Link>

        <nav aria-label="Navigasi dashboard" className="ml-6 hidden items-center gap-1 md:flex">
          <Link href="/dashboard" aria-current="page" className={`${navLinkClass} bg-[#eef7e9] text-[#0b4f33] dark:bg-white/10 dark:text-white`}>Beranda</Link>
          <a href="#aplikasi" className={`${navLinkClass} text-[#5b6878] hover:text-[#0b4f33] dark:text-slate-300 dark:hover:text-white`}>Aplikasi</a>
          <Link href={helpHref} className={`${navLinkClass} text-[#5b6878] hover:text-[#0b4f33] dark:text-slate-300 dark:hover:text-white`}>Bantuan</Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={onToggleTheme} className={iconButtonClass} aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"} title={dark ? "Mode terang" : "Mode gelap"}>
            {dark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>
          {showNotifications && (
            <Link href="/notifikasi" aria-label="Notifikasi" className={iconButtonClass}>
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-11 items-center gap-2.5 rounded-full border border-[#e3ede0] bg-white py-1 pl-1 pr-3 text-left transition hover:bg-[#f6faf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" aria-label="Menu akun">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b4f33] text-[13px] font-bold text-[#d9f59a]">{initialsOf(user.name)}</span>
              <span className="hidden max-w-[160px] leading-tight sm:block">
                <span className="block truncate text-[13px] font-semibold text-[#08213b] dark:text-white">{user.name}</span>
                <span className="block truncate text-[11.5px] text-[#5b6878] dark:text-slate-400">{roleDisplayNames[user.role]}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-[#5b6878] dark:text-slate-400" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className={cn("w-64 rounded-2xl border-[#e3ede0] p-2", dark && "dark border-white/10 bg-[#0d1e2d] text-white")}>
              <DropdownMenuLabel className="px-3 py-2">
                <span className="block truncate text-[14px] font-semibold text-[#08213b] dark:text-white">{user.name}</span>
                <span className="block truncate text-[12px] font-normal text-[#5b6878] dark:text-slate-400">{roleDisplayNames[user.role]}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 md:hidden"><a href="#aplikasi">Aplikasi</a></DropdownMenuItem>
              {accountLinks.map((link) => {
                const Icon = portalIcons[link.icon]
                return (
                  <DropdownMenuItem key={link.id} asChild className="rounded-xl px-3 py-2.5">
                    <Link href={link.href}><Icon className="h-4 w-4 text-[#0b4f33] dark:text-[#c9f26d]" aria-hidden="true" />{link.title}</Link>
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={leaving} onSelect={(event) => { event.preventDefault(); void signOut() }} className="rounded-xl px-3 py-2.5 text-[#b42318] focus:text-[#b42318] dark:text-[#ff8a7a] dark:focus:text-[#ff8a7a]">
                <LogOut className="h-4 w-4" aria-hidden="true" />{leaving ? "Keluar..." : "Keluar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
