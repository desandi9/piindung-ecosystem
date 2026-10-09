"use client"

import {
  Moon,
  Sun,
} from "lucide-react"
import { useEffect, useState } from "react"
import { updateStoredSystemColorMode, type ColorMode } from "@/lib/system-settings"
import { useTheme } from "next-themes"
import { NotificationBell } from "@/components/notification-bell"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function MemberHeader({ title, breadcrumb }: { title: string; breadcrumb: string }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkMode = mounted ? resolvedTheme === "dark" || (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) : false

  useEffect(() => setMounted(true), [])

  const toggleDarkMode = () => {
    const nextMode: ColorMode = isDarkMode ? "light" : "dark"
    setTheme(nextMode)
    updateStoredSystemColorMode(nextMode)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#dce8e2]/90 bg-white/85 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1e2d]/88 lg:px-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/landing-page" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#6c7a89] transition-colors hover:bg-[#e6f7ef] hover:text-[#07965d] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-emerald-300" aria-label="Kembali ke Kelola Landing Page">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[#08213b] dark:text-white sm:text-xl">{title}</h1>
          <nav className="hidden text-xs font-medium text-[#6c7a89] dark:text-slate-400 sm:block" aria-label="Breadcrumb">{breadcrumb}</nav>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleDarkMode} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#6c7a89] transition-colors hover:bg-[#e6f7ef] hover:text-[#07965d] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-emerald-300" aria-label="Ganti tema warna">{mounted && isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
        <NotificationBell />
      </div>
    </header>
  )
}

export function MemberLayout({ children, title = "Kelola Landing Page", breadcrumb = "Beranda / Kelola Landing Page" }: { children: React.ReactNode; title?: string; breadcrumb?: string }) {
  return (
    <div className="min-h-screen bg-[#f8fbf9] dark:bg-[#07131f]">
      <div className="flex min-h-screen flex-col">
        <MemberHeader title={title} breadcrumb={breadcrumb} />
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
