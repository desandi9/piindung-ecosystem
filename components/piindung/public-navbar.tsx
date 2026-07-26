"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Menu, Moon, Sun, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import type { ColorMode } from "@/lib/system-settings"
import { DEFAULT_SITE_BRANDING, type SiteBranding } from "@/lib/site-branding"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Beranda", href: "/", id: "beranda" },
  { label: "Produk", href: "/produk", id: "produk" },
  { label: "Dampak", href: "/dampak", id: "dampak" },
  { label: "Artikel", href: "/artikel", id: "artikel" },
  { label: "Pusat Bantuan", href: "/bantuan", id: "bantuan" },
] as const

function activeItem(pathname: string | null) {
  const path = pathname || "/"
  if (path === "/") return "beranda"
  return navItems.find((item) => item.href !== "/" && path.startsWith(item.href))?.id ?? null
}

export function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_SITE_BRANDING)
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    fetch("/api/site-branding").then((res) => res.json()).then((data) => {
      if (data.branding) setBranding(data.branding)
    }).catch(() => undefined)
    const update = () => setScrolled(window.scrollY > 12)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", escape)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", escape)
    }
  }, [open])

  const dark = mounted && resolvedTheme === "dark"
  const current = activeItem(pathname)
  const logo = dark ? branding.logos.navbarDark : branding.logos.navbarLight
  const toggleTheme = () => setTheme((dark ? "light" : "dark") as ColorMode)

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "border-b transition-all duration-300",
          scrolled || open
            ? "border-[#dfe9e4] bg-[#f8fbf9]/92 shadow-[0_10px_35px_rgba(8,33,59,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07131f]/92"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-[78px] max-w-[1040px] items-center px-5 sm:px-8 lg:h-[86px] lg:px-0">
          <Link href="/" aria-label="Beranda PIINDUNG" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0aaa6e]">
            <Image
              src={logo.path}
              alt={branding.identity.logoAltText || "PIINDUNG dan NU Care-LAZISNU Garut"}
              width={logo.width}
              height={logo.height}
              priority
              className="h-auto w-[190px] object-contain sm:w-[225px]"
            />
          </Link>

          <div className="ml-auto hidden items-center gap-6 lg:flex">
            <nav aria-label="Navigasi utama" className="flex items-center gap-1 rounded-full border border-[#e1ebe6] bg-white/82 p-1 shadow-[0_5px_18px_rgba(8,33,59,.04)] backdrop-blur dark:border-white/10 dark:bg-white/5">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-5 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0aaa6e]",
                    current === item.id ? "text-[#078b5d]" : "text-[#657184] hover:text-[#08213b] dark:text-slate-300 dark:hover:text-white",
                  )}
                >
                  {current === item.id && <motion.span layoutId="premium-nav-pill" className="absolute inset-0 -z-10 rounded-full bg-[#e7f7ef] dark:bg-emerald-400/10" />}
                  {item.label}
                </Link>
              ))}
            </nav>
            <button type="button" onClick={toggleTheme} className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e1ebe6] bg-white/70 text-[#08213b] shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white" aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <button type="button" onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-xl border border-[#dfe9e4] text-[#08213b] dark:border-white/10 dark:text-white" aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#dfe9e4] text-[#08213b] dark:border-white/10 dark:text-white" aria-expanded={open} aria-controls="mobile-public-nav">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div id="mobile-public-nav" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-4 mt-2 rounded-[22px] border border-[#dfe9e4] bg-white/95 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1b29]/95 lg:hidden">
            <nav className="grid gap-1">{navItems.map((item) => <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className={cn("rounded-xl px-4 py-3 text-sm font-medium", current === item.id ? "bg-[#e7f7ef] text-[#078b5d] dark:bg-emerald-400/10" : "text-[#657184] dark:text-slate-200")}>{item.label}</Link>)}</nav>
            <Link href="/login" onClick={() => setOpen(false)} className="mt-2 flex h-12 items-center justify-center rounded-xl bg-[#08a969] text-sm font-semibold text-white">Masuk ke Sistem</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
