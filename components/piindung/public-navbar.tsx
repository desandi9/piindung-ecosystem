"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react"
import { Menu, Moon, Sun, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import type { ColorMode } from "@/lib/system-settings"
import { mobileMenuItems, mobileMenuPanel, motionEase, motionTransition, softSpring } from "@/lib/motion"
import { cn } from "@/lib/utils"

const lightLogo = "/Logo-navbar2.png"
const darkLogo = "/Logo-navbarputih.png"

const navItems = [
  { label: "Beranda", href: "/", id: "beranda" },
  { label: "Produk", href: "/produk", id: "produk" },
  { label: "Dampak", href: "/dampak", id: "dampak" },
  { label: "Artikel", href: "/artikel", id: "artikel" },
  { label: "Pusat Bantuan", href: "/bantuan", id: "bantuan" },
]

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [activeItem, setActiveItem] = useState("beranda")
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      const scrollY = window.scrollY
      setExpanded((current) => (current ? scrollY > 8 : scrollY > 160))
      if (scrollY < 80) setActiveItem("beranda")
    }
    const sections = navItems.slice(1).map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveItem(visible.target.id)
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.05, 0.2] }
    )
    sections.forEach((section) => observer.observe(section))
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const isDarkMode = mounted && (resolvedTheme === "dark" || document.documentElement.classList.contains("dark"))
  const currentItem = pathname === "/produk" || pathname.startsWith("/produk/") ? "produk" : pathname === "/dampak" || pathname.startsWith("/dampak/") ? "dampak" : pathname === "/artikel" || pathname.startsWith("/artikel/") ? "artikel" : pathname === "/bantuan" || pathname.startsWith("/bantuan/") ? "bantuan" : activeItem
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
      <motion.header initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={navbarTransition} className={cn("fixed inset-x-0 top-0 z-50", expanded ? "px-0 py-0" : "px-4 py-4 sm:px-6 lg:px-8")}>
      <motion.div layout transition={prefersReducedMotion ? { duration: 0 } : softSpring} className={cn("mx-auto border border-white/45 bg-white/72 shadow-[0_18px_50px_rgba(7,20,38,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72", expanded ? "max-w-none rounded-none" : "max-w-7xl rounded-[24px]")}>
        <div className={cn("mx-auto flex h-[72px] items-center px-4 transition-all duration-[650ms] sm:px-6 lg:px-8", expanded && "h-16 max-w-7xl px-6 sm:px-8")}>
          <Link href="/" className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b]" aria-label="Beranda PIINDUNG"><Image src={isDarkMode ? darkLogo : lightLogo} alt="PIINDUNG dan NU Care-LAZISNU Garut" width={1366} height={306} priority className="h-auto w-[170px] object-contain sm:w-[225px]" /></Link>
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <nav aria-label="Navigasi utama" className="flex items-center gap-2">
              {navItems.map((item) => <Link key={item.id} href={item.href} onClick={() => setActiveItem(item.id)} className={cn("relative rounded-full px-4 py-2 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b]", currentItem === item.id ? "text-[#15945b]" : "text-[#0b1f33] hover:bg-[#eaf7f0] dark:text-white dark:hover:bg-white/10")}>{currentItem === item.id && <motion.span layoutId="public-navbar-active-pill" transition={prefersReducedMotion ? { duration: 0 } : softSpring} className="absolute inset-0 -z-10 rounded-full bg-[#e6f7ee] dark:bg-emerald-300/10" />}{item.label}</Link>)}
            </nav>
            <motion.button type="button" whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }} onClick={toggleDarkMode} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#dde7e2] text-[#566473] transition hover:bg-[#eaf7f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:text-white" aria-label={isDarkMode ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>{isDarkMode ? <motion.span initial={prefersReducedMotion ? false : { rotate: -18 }} animate={{ rotate: 0 }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: motionEase }}><Sun className="h-5 w-5" /></motion.span> : <motion.span initial={prefersReducedMotion ? false : { rotate: 18 }} animate={{ rotate: 0 }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: motionEase }}><Moon className="h-5 w-5" /></motion.span>}</motion.button>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:hidden"><motion.button type="button" whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }} onClick={toggleDarkMode} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#dde7e2] text-[#566473] dark:border-white/10 dark:text-white" aria-label={isDarkMode ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>{isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</motion.button><button type="button" onClick={() => setIsOpen(!isOpen)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#dde7e2] text-[#0b1f33] dark:border-white/10 dark:text-white" aria-expanded={isOpen} aria-controls="mobile-public-navigation">{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
        </div>
      </motion.div>
      <AnimatePresence initial={false}>
        {isOpen && <motion.div id="mobile-public-navigation" key="mobile-public-navigation" variants={menuPanelVariants} initial="hidden" animate="visible" exit="exit" className="mx-auto mt-2 max-w-7xl rounded-[22px] border border-white/50 bg-white/95 p-4 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95 lg:hidden"><motion.nav variants={{ visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.06 } } }} initial="hidden" animate="visible" className="flex flex-col gap-2">{navItems.map((item) => <motion.div key={item.id} variants={menuItemVariants}><Link href={item.href} onClick={() => { setActiveItem(item.id); setIsOpen(false) }} className={cn("relative block rounded-xl px-4 py-3 text-sm font-medium", currentItem === item.id ? "text-[#15945b]" : "text-[#0b1f33] dark:text-white")}>{currentItem === item.id && <motion.span layoutId="public-navbar-active-pill-mobile" transition={prefersReducedMotion ? { duration: 0 } : softSpring} className="absolute inset-0 -z-10 rounded-xl bg-[#e6f7ee] dark:bg-emerald-300/10" />}{item.label}</Link></motion.div>)}</motion.nav></motion.div>}
      </AnimatePresence>
    </motion.header>
    </MotionConfig>
  )
}
