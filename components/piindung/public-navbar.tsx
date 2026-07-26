"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react"
import { LogIn, Menu, Moon, Sun, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import type { ColorMode } from "@/lib/system-settings"
import { DEFAULT_SITE_BRANDING, type SiteBranding } from "@/lib/site-branding"
import { mobileMenuItems, mobileMenuPanel, motionEase, softSpring } from "@/lib/motion"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Beranda", href: "/", id: "beranda" },
  { label: "Produk", href: "/produk", id: "produk" },
  { label: "Dampak", href: "/dampak", id: "dampak" },
  { label: "Artikel", href: "/artikel", id: "artikel" },
  { label: "Pusat Bantuan", href: "/bantuan", id: "bantuan" },
] as const

function resolveActiveNavItem(pathname: string | null): (typeof navItems)[number]["id"] | null {
  const path = (pathname || "/").split("?")[0].split("#")[0] || "/"
  if (path === "/") return "beranda"
  if (path === "/produk" || path.startsWith("/produk/")) return "produk"
  if (path === "/dampak" || path.startsWith("/dampak/")) return "dampak"
  if (path === "/artikel" || path.startsWith("/artikel/")) return "artikel"
  if (path === "/bantuan" || path.startsWith("/bantuan/")) return "bantuan"
  return null
}

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_SITE_BRANDING)
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    fetch("/api/site-branding")
      .then((res) => res.json())
      .then((data) => {
        if (data.branding) setBranding(data.branding)
      })
      .catch(() => {})

    const handleScroll = () => {
      const scrollY = window.scrollY
      setExpanded((current) => (current ? scrollY > 12 : scrollY > 16))
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isDarkMode = mounted && (resolvedTheme === "dark" || document.documentElement.classList.contains("dark"))
  const lightLogo = branding.logos.navbarLight.path
  const darkLogo = branding.logos.navbarDark.path
  const logoAlt = branding.identity.logoAltText || "PIINDUNG dan NU Care-LAZISNU Garut"
  const currentItem = resolveActiveNavItem(pathname)
  const toggleDarkMode = () => setTheme((isDarkMode ? "light" : "dark") as ColorMode)
  const menuPanelVariants = prefersReducedMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : mobileMenuPanel
  const menuItemVariants = prefersReducedMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : mobileMenuItems
  const navbarTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.65, ease: motionEase }

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [isOpen])

  return (
    <MotionConfig transition={navbarTransition} reducedMotion="user">
      <motion.header initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={navbarTransition} className="fixed inset-x-0 top-0 z-50">
      <motion.div layout transition={prefersReducedMotion ? { duration: 0 } : softSpring} className={cn("border-b transition-colors duration-300", expanded || isOpen ? "border-[#d9e5df]/80 bg-white/90 shadow-[0_10px_28px_rgba(7,38,28,.08)] backdrop-blur-xl dark:border-[#213a49] dark:bg-[#07131f]/90" : "border-transparent bg-transparent")}>
        <div className="mx-auto flex h-[74px] max-w-[1180px] items-center px-6 sm:px-10">
          <Link href="/" className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]" aria-label="Beranda PIINDUNG"><Image src={isDarkMode ? darkLogo : lightLogo} alt={logoAlt} width={isDarkMode ? branding.logos.navbarDark.width : branding.logos.navbarLight.width} height={isDarkMode ? branding.logos.navbarDark.height : branding.logos.navbarLight.height} priority className="h-auto w-[170px] object-contain sm:w-[225px]" /></Link>
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <nav aria-label="Navigasi utama" className="flex items-center gap-1 rounded-full border border-[#d9e5df]/80 bg-white/80 p-1 shadow-sm dark:border-[#213a49] dark:bg-[#0d1e2d]/80">
              {navItems.map((item) => <Link key={item.id} href={item.href} className={cn("relative rounded-full px-4 py-2 text-[13px] font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]", currentItem === item.id ? "text-[#07965d]" : "text-[#0b2239] hover:bg-[#e6f7ef] dark:text-white dark:hover:bg-white/10")}>{currentItem === item.id && <motion.span layoutId="public-navbar-active-pill" transition={prefersReducedMotion ? { duration: 0 } : softSpring} className="absolute inset-0 -z-10 rounded-full bg-[#e6f7ef] dark:bg-emerald-300/10" />}{item.label}</Link>)}
            </nav>
            <motion.button type="button" whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }} onClick={toggleDarkMode} className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-[#d9e5df] text-[#64748b] transition hover:bg-[#f1fbf6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-[#213a49] dark:text-white" aria-label={isDarkMode ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>{isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</motion.button>
            <Link href="/login" className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#07965d] to-[#0eae70] px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(7,150,93,.2)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2"><LogIn className="h-4 w-4" />Masuk</Link>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:hidden"><motion.button type="button" whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }} onClick={toggleDarkMode} className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-[#d9e5df] text-[#64748b] dark:border-[#213a49] dark:text-white" aria-label={isDarkMode ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>{isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</motion.button><button type="button" onClick={() => setIsOpen(!isOpen)} className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-[#d9e5df] text-[#0b2239] dark:border-[#213a49] dark:text-white" aria-expanded={isOpen} aria-controls="mobile-public-navigation">{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
        </div>
      </motion.div>
      <AnimatePresence initial={false}>
        {isOpen && <motion.div id="mobile-public-navigation" key="mobile-public-navigation" variants={menuPanelVariants} initial="hidden" animate="visible" exit="exit" className="mx-auto mt-2 max-w-7xl rounded-[22px] border border-white/50 bg-white/95 p-4 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95 lg:hidden"><motion.nav variants={{ visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.06 } } }} initial="hidden" animate="visible" className="flex flex-col gap-2">{navItems.map((item) => <motion.div key={item.id} variants={menuItemVariants}><Link href={item.href} onClick={() => setIsOpen(false)} className={cn("relative block rounded-xl px-4 py-3 text-sm font-medium", currentItem === item.id ? "text-[#07965d]" : "text-[#0b1f33] dark:text-white")}>{currentItem === item.id && <motion.span layoutId="public-navbar-active-pill-mobile" transition={prefersReducedMotion ? { duration: 0 } : softSpring} className="absolute inset-0 -z-10 rounded-xl bg-[#e6f7ee] dark:bg-emerald-300/10" />}{item.label}</Link></motion.div>)}</motion.nav><Link href="/login" onClick={() => setIsOpen(false)} className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#07965d] to-[#0eae70] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(7,150,93,.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2"><LogIn className="h-4 w-4" />Masuk ke Dashboard</Link></motion.div>}
      </AnimatePresence>
    </motion.header>
    </MotionConfig>
  )
}
