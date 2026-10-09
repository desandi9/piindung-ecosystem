"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import Link from "next/link"
import { ArrowRight, Box, CircleDashed, FileText, Image as ImageIcon, MessageCircleQuestion, Settings2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { roleDisplayNames } from "@/lib/auth-context"

type CardMapping = {
  title: string
  description: string
  icon: typeof Box
  href?: string
  locked?: boolean
}

export default function KontenPublikPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [ready, setReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem
  const isSuperAdmin = user?.role === "super_admin_pc"

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login?next=/dashboard/landing-page")
      } else if (user.role !== "super_admin_pc" && user.role !== "admin_pc") {
        router.replace("/dashboard")
      } else {
        setReady(true)
      }
    }
  }, [user, isLoading, router])

  if (!ready || !user) return <div className="min-h-screen bg-background" />

  const cards: CardMapping[] = [
    {
      title: "Beranda",
      description: "Hero, visual, intro, cara kerja, dan CTA bantuan.",
      icon: ImageIcon,
      href: isSuperAdmin ? "/dashboard/landing-page/beranda" : undefined,
      locked: !isSuperAdmin,
    },
    {
      title: "Produk",
      description: "Daftar produk, logo, status, CTA, dan urutan.",
      icon: Box,
      href: isSuperAdmin ? "/dashboard/landing-page/produk" : undefined,
      locked: !isSuperAdmin,
    },
    {
      title: "Dampak",
      description: "Statistik, cerita dampak, gambar, dan CTA.",
      icon: CircleDashed,
      href: isSuperAdmin ? "/dashboard/landing-page/dampak" : undefined,
      locked: !isSuperAdmin,
    },
    {
      title: "Artikel & Berita",
      description: "Kelola artikel, cover, draft, dan publikasi.",
      icon: FileText,
      href: "/dashboard/landing-page/artikel",
    },
    {
      title: "Pusat Bantuan",
      description: "Kategori bantuan, FAQ, dan CTA kontak.",
      icon: MessageCircleQuestion,
      href: isSuperAdmin ? "/dashboard/landing-page/bantuan" : undefined,
      locked: !isSuperAdmin,
    },
    {
      title: "Pengaturan Website",
      description: "Logo, favicon, kontak, sosial, footer, SEO, dan media.",
      icon: Settings2,
      href: isSuperAdmin ? "/dashboard/landing-page/pengaturan" : undefined,
      locked: !isSuperAdmin,
    },
  ]

  return (
    <MemberLayout title="Kelola Landing Page" breadcrumb="Beranda / Kelola Landing Page">
      <div className="space-y-8 overflow-x-hidden">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="relative overflow-hidden rounded-[28px] border border-[#dce8e2]/90 bg-gradient-to-br from-white via-[#f8fbf9] to-[#e7f7ef]/60 p-6 shadow-[0_18px_44px_rgba(9,43,32,0.07)] dark:border-white/10 dark:from-[#0d1e2d] dark:via-[#0d1e2d] dark:to-emerald-500/10 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
            <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-teal-200/35 blur-3xl dark:bg-teal-500/10" />
          </div>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#07965d] dark:text-emerald-300">LANDING PAGE CMS</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#08213b] dark:text-white sm:text-4xl">Kelola konten website</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#6c7a89] dark:text-slate-300">Enam menu utama untuk merapikan beranda, produk, dampak, artikel, bantuan, dan pengaturan website. Akses: {roleDisplayNames[user.role]}.</p>
          </div>
        </motion.section>

        <motion.section variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            const locked = Boolean(card.locked)
            const CardContent = (
              <motion.article variants={itemReveal} className={cn("group flex h-full flex-col rounded-[24px] border p-6 transition-all duration-300", locked ? "border-dashed border-border/60 bg-muted/20 opacity-80" : "border-border bg-card shadow-sm hover:-translate-y-1 hover:border-[#15945b]/30 hover:shadow-md")}>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", locked ? "bg-muted text-muted-foreground" : "bg-[#e6f7ee] text-[#15945b] transition-colors group-hover:bg-[#15945b] group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400")}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className={cn("mt-6 text-xl font-bold", locked ? "text-muted-foreground" : "text-foreground transition-colors group-hover:text-[#15945b]")}>{card.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
                <div className="mt-6 flex items-center text-sm font-semibold">
                  <span className={cn("flex items-center gap-2 transition-colors", locked ? "text-muted-foreground" : "text-foreground group-hover:text-[#15945b]")}>
                    {locked ? "Super Admin saja" : "Buka editor"}
                    {!locked && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </span>
                </div>
              </motion.article>
            )

            if (!locked && card.href) {
              return <Link key={card.title} href={card.href} className="block outline-none">{CardContent}</Link>
            }
            return <div key={card.title}>{CardContent}</div>
          })}
        </motion.section>
      </div>
    </MemberLayout>
  )
}
