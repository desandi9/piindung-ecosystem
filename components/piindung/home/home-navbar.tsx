"use client"

import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { calmEase } from "@/components/piindung/landing-motion"
import { useAuth } from "@/lib/auth-context"
import type { SiteBranding } from "@/lib/site-branding"
import { cn } from "@/lib/utils"

export const homeSections = [
  { id: "beranda", label: "Beranda" },
  { id: "aplikasi", label: "Aplikasi" },
  { id: "cara-kerja", label: "Cara Kerja" },
  { id: "bantuan", label: "Bantuan" },
] as const

type HomeSectionId = (typeof homeSections)[number]["id"]

/** Tujuan tombol utama: pengunjung masuk lewat login, pengguna bersesi langsung ke dasbor. */
export function usePortalEntry() {
  const { user } = useAuth()
  return user ? { href: "/dashboard", label: "Buka Dasbor" } : { href: "/login", label: "Masuk ke PIINDUNG" }
}

function useActiveSection() {
  const [active, setActive] = useState<HomeSectionId>("beranda")

  useEffect(() => {
    const nodes = homeSections.map((section) => document.getElementById(section.id)).filter((node): node is HTMLElement => Boolean(node))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id as HomeSectionId)
      },
      { rootMargin: "-42% 0px -52% 0px" },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return active
}

export function HomeNavbar({ branding }: { branding: SiteBranding }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const active = useActiveSection()
  const entry = usePortalEntry()
  const reduced = useReducedMotion()

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 16)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    const desktop = window.matchMedia("(min-width: 1024px)")
    const closeOnDesktop = () => desktop.matches && setOpen(false)
    window.addEventListener("keydown", escape)
    desktop.addEventListener("change", closeOnDesktop)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", escape)
      desktop.removeEventListener("change", closeOnDesktop)
    }
  }, [open])

  const logo = branding.logos.navbarDark

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: calmEase }}
        className={cn(
          "border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled || open
            ? "border-white/10 bg-[#061423]/88 shadow-[0_14px_40px_-12px_rgba(2,10,20,.55)] backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center gap-6 px-5 sm:px-8 lg:h-[84px]">
          <a href="#beranda" aria-label="PIINDUNG — kembali ke atas" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9f26d] focus-visible:ring-offset-4 focus-visible:ring-offset-[#061423]">
            <Image
              src={logo.path}
              alt={branding.identity.logoAltText || "PIINDUNG dan NU Care–LAZISNU Garut"}
              width={logo.width}
              height={logo.height}
              priority
              className="h-auto w-[156px] object-contain sm:w-[184px]"
            />
          </a>

          <nav aria-label="Navigasi beranda" className="mx-auto hidden items-center gap-1 rounded-full border border-white/10 bg-white/[.05] p-1.5 lg:flex">
            {homeSections.map((section) => {
              const current = active === section.id
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={current ? "location" : undefined}
                  className={cn(
                    "relative isolate rounded-full px-[18px] py-2 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9f26d]",
                    current ? "text-white" : "text-white/65 hover:text-white",
                  )}
                >
                  {current && <motion.span layoutId="home-nav-pill" transition={{ duration: 0.45, ease: calmEase }} className="absolute inset-0 -z-10 rounded-full bg-white/[.12]" />}
                  {section.label}
                </a>
              )
            })}
          </nav>

          <Link
            href={entry.href}
            className="group hidden h-12 shrink-0 items-center gap-3 rounded-full bg-white pl-5 pr-1.5 text-[14px] font-semibold text-[#08213b] shadow-[0_10px_24px_-10px_rgba(0,0,0,.45)] transition hover:bg-[#f1f8e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9f26d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061423] lg:inline-flex"
          >
            {entry.label}
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#08213b] text-[#c9f26d] transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="home-mobile-nav"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="ml-auto grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[.06] text-white transition hover:bg-white/[.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9f26d] lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.button
            key="home-mobile-scrim"
            type="button"
            aria-label="Tutup menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-[72px] -z-10 cursor-default bg-[#061423]/70 backdrop-blur-[2px] lg:hidden"
          />
        )}
        {open && (
          <motion.div
            key="home-mobile-nav"
            id="home-mobile-nav"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: calmEase }}
            className="mx-4 mt-2 rounded-[24px] border border-white/10 bg-[#0a1f30]/97 p-3 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,.7)] backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Navigasi beranda" className="grid gap-1">
              {homeSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === section.id ? "location" : undefined}
                  className={cn("rounded-2xl px-4 py-3.5 text-[15px] font-medium", active === section.id ? "bg-white/10 text-white" : "text-white/75")}
                >
                  {section.label}
                </a>
              ))}
            </nav>
            <Link href={entry.href} onClick={() => setOpen(false)} className="mt-2 flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#c9f26d] text-[15px] font-bold text-[#061423]">
              {entry.label}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
