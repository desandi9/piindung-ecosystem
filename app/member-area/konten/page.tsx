"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import Link from "next/link"
import { ArrowRight, Box, CircleDashed, FileText, Image as ImageIcon, MessageCircleQuestion, Settings, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { useHomepageContent } from "@/lib/homepage-content"
import { useIntegratedApps } from "@/lib/integrated-apps"
import { useHelpFaqCategories } from "@/lib/faq-manager"
import { useGalleryItems } from "@/lib/gallery-content"

type CardMapping = {
  title: string
  description: string
  icon: typeof Box
  statusLabel: string
  statusType: "ready" | "unavailable"
  actionLabel: string
  href?: string
}

export default function KontenPublikPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [ready, setReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem

  const homepageContent = useHomepageContent()
  const apps = useIntegratedApps()
  const faqs = useHelpFaqCategories()
  const galleries = useGalleryItems()

  const summary = useMemo(() => {
    return {
      pagesCount: 5,
      activeModules: 6,
      pendingModules: 2,
      mediaCount: galleries.length,
    }
  }, [galleries.length])

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/login?next=/member-area/konten")
      else if (user.role !== "super_admin_pc") router.replace("/dashboard")
      else setReady(true)
    }
  }, [user, isLoading, router])

  if (!ready || !user) return <div className="min-h-screen bg-background" />

  const cards: CardMapping[] = [
    {
      title: "Beranda",
      description: "Hero, CTA, gambar utama, dan susunan section.",
      icon: ImageIcon,
      statusLabel: "Tersedia",
      statusType: "ready",
      actionLabel: "Kelola Konten",
      href: "/member-area/konten/beranda",
    },
    {
      title: "Produk",
      description: "Produk publik, deskripsi, status, logo, dan urutan.",
      icon: Box,
      statusLabel: "Tersedia",
      statusType: "ready",
      actionLabel: "Kelola Konten",
      href: "/member-area/konten/produk",
    },
    {
      title: "Dampak",
      description: "Narasi dampak, area manfaat, dan CTA.",
      icon: CircleDashed,
      statusLabel: "Belum Tersedia",
      statusType: "unavailable",
      actionLabel: "Segera Tersedia",
    },
    {
      title: "Artikel & Berita",
      description: "Artikel, kategori, cover, draft, dan publikasi.",
      icon: FileText,
      statusLabel: "Tersedia",
      statusType: "ready",
      actionLabel: "Kelola Konten",
      href: "/member-area/konten/artikel",
    },
    {
      title: "Pusat Bantuan",
      description: "FAQ, topik bantuan, dan informasi dukungan.",
      icon: MessageCircleQuestion,
      statusLabel: "Tersedia",
      statusType: "ready",
      actionLabel: "Kelola Konten",
      href: "/member-area/konten/bantuan",
    },
    {
      title: "Media & Branding",
      description: "Logo, gambar, galeri, favicon, dan aset publik.",
      icon: ImageIcon,
      statusLabel: "Tersedia",
      statusType: "ready",
      actionLabel: "Kelola Konten",
      href: "/admin/galeri",
    },
    {
      title: "Kontak & Footer",
      description: "Alamat, kontak, media sosial, dan tautan footer.",
      icon: Phone,
      statusLabel: "Tersedia",
      statusType: "ready",
      actionLabel: "Kelola Konten",
      href: "/member-area/konten/kontak",
    },
    {
      title: "SEO",
      description: "Judul situs, deskripsi, Open Graph, dan metadata halaman.",
      icon: Settings,
      statusLabel: "Tersedia",
      statusType: "ready",
      actionLabel: "Kelola Konten",
      href: "/admin/pengaturan",
    },
  ]

  return (
    <MemberLayout title="Konten Publik" breadcrumb="Member Area / Konten Publik">
      <div className="space-y-8 overflow-x-hidden">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">KONTEN PUBLIK</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">Kelola Tampilan dan Informasi Publik</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">Kelola konten landing page, artikel, pusat bantuan, media, kontak, dan identitas publik PIINDUNG melalui satu pusat kendali.</p>
        </motion.section>

        <motion.section variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Halaman Publik", summary.pagesCount],
            ["Modul Pengelolaan Tersedia", summary.activeModules],
            ["Konten Belum Terhubung", summary.pendingModules],
            ["Aset Media", summary.mediaCount],
          ].map(([label, value]) => (
            <motion.div key={label as string} variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const isReady = card.statusType === "ready"
            const Icon = card.icon

            const CardContent = (
              <motion.article variants={itemReveal} className={cn("group flex h-full flex-col rounded-[24px] border bg-card p-6 transition-all duration-300", isReady ? "border-border shadow-sm hover:-translate-y-1 hover:border-[#15945b]/30 hover:shadow-md" : "border-dashed border-border/60 bg-muted/20 opacity-80")}>
                <div className="flex items-start justify-between gap-4">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", isReady ? "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:bg-[#15945b] group-hover:text-white transition-colors" : "bg-muted text-muted-foreground")}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", isReady ? "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300")}>{card.statusLabel}</span>
                </div>
                <h3 className={cn("mt-6 text-xl font-bold", isReady ? "text-foreground group-hover:text-[#15945b] transition-colors" : "text-muted-foreground")}>{card.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
                <div className="mt-6 flex items-center text-sm font-semibold">
                  <span className={cn("flex items-center gap-2 transition-colors", isReady ? "text-foreground group-hover:text-[#15945b]" : "text-muted-foreground")}>
                    {card.actionLabel}
                    {isReady && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </span>
                </div>
              </motion.article>
            )

            if (isReady && card.href) {
              return <Link key={card.title} href={card.href} className="block outline-none">{CardContent}</Link>
            }
            return <div key={card.title}>{CardContent}</div>
          })}
        </motion.section>
      </div>
    </MemberLayout>
  )
}
