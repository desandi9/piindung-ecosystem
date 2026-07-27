"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type Variants } from "motion/react"
import {
  ArrowRight,
  BellRing,
  CircleHelp,
  ClipboardList,
  FilePenLine,
  IdCard,
  LayoutGrid,
  Settings2,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motionEase } from "@/lib/motion"
import { roleDisplayNames } from "@/features/auth"
import { canAccessAdminDashboard } from "@/features/auth/route-access"
import type { AuthUser } from "@/types/auth"
import { cn } from "@/lib/utils"

export type PortalHubModule = { key: string; name: string; route: string; description: string }
export type PortalHubNotification = { id: string; title: string; body: string; createdAt?: string; readAt: string | null }
export type PortalHubActivity = { id: string; label: string; description: string; timestamp: string }

const datetime = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Baru saja"

const initialsOf = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "P"

const productInitials = (name: string) => {
  const words = name.replace(/[^a-zA-Z ]/g, " ").trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  return (words[0] ?? name).slice(0, 2).toUpperCase()
}

const CONTENT_PERMISSIONS = [
  "articles.manage",
  "homepage.manage",
  "products.manage",
  "impact.manage",
  "gallery.manage",
  "downloads.manage",
  "help_content.manage",
  "contact.manage",
  "branding.manage",
] as const

const ADMIN_PERMISSIONS = [
  "users.manage",
  "access.manage",
  "settings.manage",
  "audit.view",
  "notifications.manage",
] as const

type EcosystemApp = {
  id: string
  name: string
  description: string
  logo: string | null
  accent: string
} & (
  | { status: "available"; route: string; cta: string }
  | { status: "coming-soon" }
)

function useReveal(delay = 0): Variants {
  const reduced = useReducedMotion()
  return {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: 0 } : { duration: 0.7, delay, ease: motionEase },
    },
  }
}

function useCardStagger(): { container: Variants; item: Variants } {
  const reduced = useReducedMotion()
  return {
    container: { hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.09, delayChildren: reduced ? 0 : 0.06 } } },
    item: {
      hidden: reduced ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.985 },
      visible: { opacity: 1, y: 0, scale: 1, transition: reduced ? { duration: 0 } : { duration: 0.6, ease: motionEase } },
    },
  }
}

function resolveEcosystemApps(modules: PortalHubModule[]): EcosystemApp[] {
  const gorut = modules.find((module) => module.key === "gorut")

  return [
    gorut
      ? {
          id: "gorut",
          name: "GORUT",
          description: "Kelola Munfiq, transaksi, setoran, validasi, monitoring, dan laporan.",
          logo: "/gorut-logo-icon.png",
          accent: "from-emerald-500/15 to-teal-500/10",
          status: "available",
          route: gorut.route || "/gorut",
          cta: "Masuk GORUT",
        }
      : null,
    {
      id: "e-tasyaruf",
      name: "E-Tasyaruf",
      description: "Digitalisasi penyaluran dan pentasyarufan dana secara tepat sasaran.",
      logo: "/ICON PENTASYARUFAN.png",
      accent: "from-teal-500/15 to-emerald-500/10",
      status: "coming-soon" as const,
    },
    {
      id: "mobisnu",
      name: "Mobisnu",
      description: "Aplikasi mobile layanan warga untuk akses cepat dalam genggaman.",
      logo: "/icon mobisnu.PNG",
      accent: "from-emerald-400/15 to-teal-400/10",
      status: "coming-soon" as const,
    },
    {
      id: "arsip-digital",
      name: "Arsip Digital",
      description: "Penyimpanan dan pengelolaan dokumen organisasi secara terpusat.",
      logo: "/icon arsip.PNG",
      accent: "from-teal-400/15 to-emerald-500/10",
      status: "coming-soon" as const,
    },
  ].filter(Boolean) as EcosystemApp[]
}

function WelcomeBanner({
  user,
  sessionVerified,
  hasIdentityAccess,
}: {
  user: AuthUser
  sessionVerified: boolean
  hasIdentityAccess: boolean
}) {
  const reveal = useReveal()

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={reveal}
      aria-labelledby="dashboard-welcome-heading"
      className="relative overflow-hidden rounded-[28px] border border-[#dce8e2]/90 bg-white/80 p-6 shadow-[0_18px_44px_rgba(9,43,32,0.07)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1e2d]/80 sm:p-8 lg:min-h-[250px] lg:p-9"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute right-10 top-0 h-48 w-48 rounded-full bg-teal-200/35 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute -bottom-16 right-1/3 h-40 w-40 rounded-full bg-[#e7f7ef]/70 blur-3xl dark:bg-emerald-400/5" />
        <div className="absolute right-8 top-8 hidden h-36 w-36 rounded-full border border-emerald-300/30 dark:border-emerald-400/15 lg:block" />
        <div className="absolute right-16 top-16 hidden h-20 w-20 rounded-full border border-teal-300/25 dark:border-teal-400/10 lg:block" />
        <div className="absolute bottom-8 right-28 hidden grid-cols-4 gap-2 opacity-40 lg:grid">
          {Array.from({ length: 12 }).map((_, index) => (
            <span key={index} className="h-1 w-1 rounded-full bg-[#07965d]/50" />
          ))}
        </div>
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] lg:items-center">
        <div className="min-w-0">
          <h1
            id="dashboard-welcome-heading"
            className="text-[clamp(1.85rem,3.4vw,2.65rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[#08213b] dark:text-white"
          >
            Selamat datang kembali, {user.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#6c7a89] dark:text-slate-300 sm:text-[15px]">
            Kelola akses, identitas, dan layanan PIINDUNG dari satu tempat.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/profil"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#07965d] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(7,150,93,0.24)] transition hover:bg-[#067a4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#07131f]"
            >
              Lihat Profil
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {hasIdentityAccess ? (
              <Link
                href="/member-area/identitas"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dce8e2] bg-white/90 px-5 text-sm font-semibold text-[#08213b] shadow-sm transition hover:border-[#07965d]/40 hover:bg-[#e7f7ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-emerald-500/10"
              >
                <IdCard className="h-4 w-4" aria-hidden="true" />
                Identitas Digital
              </Link>
            ) : null}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
          <ProfileCard user={user} sessionVerified={sessionVerified} />
        </div>
      </div>
    </motion.section>
  )
}

function ProfileCard({ user, sessionVerified }: { user: AuthUser; sessionVerified: boolean }) {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)

  // Pointer-driven 3D tilt + spotlight (disabled under reduced-motion).
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [8, -8]), { stiffness: 220, damping: 20 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-8, 8]), { stiffness: 220, damping: 20 })
  const spotlightBackground = useTransform(
    [px, py],
    ([x, y]) => `radial-gradient(320px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(7,150,93,0.16), transparent 68%)`,
  )

  const interactive = !reduced

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }

  const resetPointer = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      whileHover={interactive ? { y: -4 } : undefined}
      style={interactive ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative overflow-hidden rounded-[24px] border border-[#dce8e2]/90 bg-gradient-to-br from-white via-[#f8fbf9] to-[#e7f7ef]/60 p-5 shadow-[0_12px_32px_rgba(9,43,32,0.065)] backdrop-blur-sm transition-shadow duration-300 [transform-style:preserve-3d] hover:shadow-[0_26px_56px_rgba(7,150,93,0.18)] dark:border-white/10 dark:from-[#0d1e2d] dark:via-[#0d1e2d] dark:to-emerald-500/10 sm:p-6"
    >
      {interactive ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlightBackground }}
        />
      ) : null}

      <div className="relative flex items-center gap-4">
        <motion.div
          whileHover={interactive ? { scale: 1.06, rotate: -3 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
        >
          <Avatar className="h-16 w-16 shrink-0 border-2 border-white shadow-md dark:border-white/10">
            <AvatarImage src={user.avatar || undefined} alt={user.name} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-[#08213b] to-[#07965d] text-lg font-bold text-white">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-[#08213b] dark:text-white">{user.name}</p>
          <p className="mt-0.5 truncate text-sm text-[#6c7a89] dark:text-slate-300">{user.email}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#07965d] dark:text-emerald-300">
            {roleDisplayNames[user.role] ?? user.role}
          </p>
        </div>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-[#dce8e2]/80 bg-white/80 px-3 py-2.5 transition-colors duration-200 group-hover:border-[#07965d]/25 dark:border-white/10 dark:bg-white/5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c7a89] dark:text-slate-400">Status</p>
          <p className="mt-1 text-sm font-semibold text-[#07965d] dark:text-emerald-300">Aktif</p>
        </div>
        <div className="rounded-2xl border border-[#dce8e2]/80 bg-white/80 px-3 py-2.5 transition-colors duration-200 group-hover:border-[#07965d]/25 dark:border-white/10 dark:bg-white/5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c7a89] dark:text-slate-400">Sesi</p>
          <p className="mt-1 text-sm font-semibold text-[#08213b] dark:text-white">{sessionVerified ? "Terverifikasi" : "Aktif"}</p>
        </div>
      </div>
    </motion.div>
  )
}

function EcosystemSection({ apps }: { apps: EcosystemApp[] }) {
  const reduced = useReducedMotion()
  const reveal = useReveal(0.05)
  const stagger = useCardStagger()

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={reveal}
      aria-labelledby="apps-heading"
      className="relative overflow-hidden rounded-[28px] border border-[#dce8e2]/90 bg-gradient-to-b from-white/85 via-[#f8fbf9]/70 to-[#eef7f2]/50 p-6 shadow-[0_18px_44px_rgba(9,43,32,0.06)] backdrop-blur-sm dark:border-white/10 dark:from-[#0d1e2d]/85 dark:via-[#0d1e2d]/70 dark:to-[#0a1a26]/60 sm:p-7 lg:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={reduced ? undefined : { x: [0, 24, 0], y: [0, -16, 0] }}
          transition={reduced ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10"
        />
        <motion.div
          animate={reduced ? undefined : { x: [0, -20, 0], y: [0, 18, 0] }}
          transition={reduced ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 right-0 h-52 w-52 rounded-full bg-teal-200/25 blur-3xl dark:bg-teal-500/10"
        />
      </div>

      <motion.div
        initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.1, ease: motionEase }}
        className="relative mb-6 flex items-center gap-3"
      >
        <motion.span
          whileHover={reduced ? undefined : { rotate: -8, scale: 1.06 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#07965d] to-[#0bbf78] text-white shadow-[0_8px_20px_rgba(7,150,93,0.28)]"
        >
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
        </motion.span>
        <div>
          <h2 id="apps-heading" className="text-[22px] font-bold tracking-tight text-[#08213b] dark:text-white sm:text-2xl">
            Ekosistem PIINDUNG
          </h2>
          <p className="mt-0.5 text-sm text-[#6c7a89] dark:text-slate-400">
            Layanan digital dalam satu ekosistem terpadu.
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
        className="relative grid gap-5 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4"
      >
        {apps.map((app) => (
          <EcosystemCard key={app.id} app={app} variants={stagger.item} reduced={!!reduced} />
        ))}
      </motion.div>
    </motion.section>
  )
}

function EcosystemCard({ app, variants, reduced }: { app: EcosystemApp; variants: Variants; reduced: boolean }) {
  const available = app.status === "available"
  const cardRef = useRef<HTMLElement>(null)

  // Pointer-driven 3D tilt + spotlight (skipped when reduced-motion or unavailable).
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 220, damping: 20 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-7, 7]), { stiffness: 220, damping: 20 })
  const spotlightBackground = useTransform(
    [px, py],
    ([x, y]) => `radial-gradient(340px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(7,150,93,0.14), transparent 70%)`,
  )

  const interactive = available && !reduced

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!interactive || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }

  const resetPointer = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.article
      ref={cardRef}
      variants={variants}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      whileHover={interactive ? { y: -6 } : undefined}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      style={interactive ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[22px] border bg-white/95 p-6 shadow-[0_12px_32px_rgba(9,43,32,0.055)] backdrop-blur-sm [transform-style:preserve-3d] dark:bg-[#0d1e2d]/90",
        available
          ? "border-[#dce8e2]/90 transition-shadow duration-300 hover:shadow-[0_28px_60px_rgba(7,150,93,0.16)] dark:border-white/10"
          : "border-[#e8edf0]/80 dark:border-white/[0.07]",
      )}
    >
      {interactive ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlightBackground }}
        />
      ) : null}

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl transition-opacity duration-300",
          available ? "opacity-70 group-hover:opacity-100" : "opacity-40",
          app.accent,
        )}
      />

      <div className="relative flex flex-1 flex-col">
        <div className="mb-5 flex items-start justify-between gap-2">
          <motion.div
            whileHover={interactive ? { scale: 1.08, rotate: -4 } : undefined}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
            className={cn(
              "inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border shadow-sm",
              available
                ? "border-[#dce8e2]/80 bg-white dark:border-white/10 dark:bg-white/10"
                : "border-[#e8edf0]/80 bg-[#f8fbf9] dark:border-white/[0.07] dark:bg-white/5",
            )}
          >
            {app.logo ? (
              <Image
                src={app.logo}
                alt={`Logo ${app.name}`}
                width={48}
                height={48}
                className={cn("h-12 w-12 object-contain", !available && "opacity-60")}
              />
            ) : (
              <span className={cn("text-lg font-bold tracking-tight", available ? "text-[#07965d] dark:text-emerald-300" : "text-[#9aabb8] dark:text-slate-500")}>
                {productInitials(app.name)}
              </span>
            )}
          </motion.div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              available
                ? "bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-[#f1f4f7] text-[#9aabb8] dark:bg-white/[0.08] dark:text-slate-500",
            )}
          >
            {available ? (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#07965d] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#07965d]" />
              </span>
            ) : null}
            {available ? "Tersedia" : "Segera Hadir"}
          </span>
        </div>

        <h3 className={cn("text-lg font-bold tracking-tight", available ? "text-[#08213b] dark:text-white" : "text-[#6c7a89] dark:text-slate-400")}>
          {app.name}
        </h3>

        <p className={cn("mt-2 line-clamp-2 text-sm leading-6", available ? "text-[#6c7a89] dark:text-slate-300" : "text-[#9aabb8] dark:text-slate-500")}>
          {app.description}
        </p>

        <div className="mt-auto pt-5">
          {app.status === "available" ? (
            <Link
              href={app.route}
              className="group/cta inline-flex min-h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#07965d] to-[#0bbf78] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,150,93,0.24)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(7,150,93,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#07131f]"
            >
              <span className="relative flex items-center gap-2">
                {app.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-[3px]" aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <span className="inline-flex min-h-10 w-full cursor-default items-center justify-center rounded-xl border border-dashed border-[#dce8e2] bg-transparent px-4 text-sm font-medium text-[#b0bec8] dark:border-white/[0.08] dark:text-slate-600">
              Segera Hadir
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: React.ElementType
  title: string
  description: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="flex h-full flex-col items-start gap-3 rounded-[20px] border border-dashed border-[#dce8e2] bg-[#f8fbf9]/70 p-5 text-sm dark:border-white/10 dark:bg-white/5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#07965d] shadow-sm dark:bg-[#0d1e2d] dark:text-emerald-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-[#08213b] dark:text-white">{title}</p>
        <p className="leading-6 text-[#6c7a89] dark:text-slate-300">{description}</p>
      </div>
      <Link
        href={actionHref}
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#07965d] hover:text-[#067a4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:text-emerald-300"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

function NotificationsCard({ notifications }: { notifications: PortalHubNotification[] }) {
  const items = notifications.slice(0, 3)
  return (
    <section
      aria-labelledby="dashboard-notifications-heading"
      className="flex h-full flex-col gap-4 rounded-[24px] border border-[#dce8e2]/90 bg-white/90 p-5 shadow-[0_10px_28px_rgba(9,43,32,0.05)] dark:border-white/10 dark:bg-[#0d1e2d]/85 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="dashboard-notifications-heading" className="text-lg font-semibold text-[#08213b] dark:text-white sm:text-xl">
            Notifikasi
          </h2>
          <p className="mt-1 text-xs text-[#6c7a89] dark:text-slate-400">Kabar terbaru untuk akun Anda.</p>
        </div>
        <Link href="/notifikasi" className="text-xs font-semibold text-[#07965d] hover:text-[#067a4c] dark:text-emerald-300">
          Lihat semua
        </Link>
      </div>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((notification) => (
            <li key={notification.id} className="rounded-2xl border border-[#dce8e2]/80 bg-[#f8fbf9]/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-[#08213b] dark:text-white">{notification.title}</p>
                {!notification.readAt ? (
                  <span className="inline-flex items-center rounded-full bg-[#e7f7ef] px-2 py-0.5 text-[11px] font-semibold text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-200">
                    Baru
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6c7a89] dark:text-slate-300">{notification.body}</p>
              <p className="mt-2 text-xs text-[#6c7a89]/80 dark:text-slate-400">{datetime(notification.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={BellRing}
          title="Belum ada notifikasi baru"
          description="Notifikasi penting akan muncul di sini agar mudah dipantau."
          actionHref="/notifikasi"
          actionLabel="Lihat semua notifikasi"
        />
      )}
    </section>
  )
}

function ActivityCard({ activities }: { activities: PortalHubActivity[] }) {
  const items = activities.slice(0, 3)
  return (
    <section
      aria-labelledby="dashboard-activity-heading"
      className="flex h-full flex-col gap-4 rounded-[24px] border border-[#dce8e2]/90 bg-white/90 p-5 shadow-[0_10px_28px_rgba(9,43,32,0.05)] dark:border-white/10 dark:bg-[#0d1e2d]/85 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="dashboard-activity-heading" className="text-lg font-semibold text-[#08213b] dark:text-white sm:text-xl">
            Aktivitas Akun
          </h2>
          <p className="mt-1 text-xs text-[#6c7a89] dark:text-slate-400">Tiga aktivitas terbaru pada akun Anda.</p>
        </div>
        <Link href="/member-area/aktivitas" className="text-xs font-semibold text-[#07965d] hover:text-[#067a4c] dark:text-emerald-300">
          Lihat semua
        </Link>
      </div>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((activity) => (
            <li key={activity.id} className="rounded-2xl border border-[#dce8e2]/80 bg-[#f8fbf9]/80 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-[#08213b] dark:text-white">{activity.label}</p>
              <p className="mt-1 text-sm leading-6 text-[#6c7a89] dark:text-slate-300">{activity.description}</p>
              <p className="mt-2 text-xs text-[#6c7a89]/80 dark:text-slate-400">{datetime(activity.timestamp)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada aktivitas terbaru"
          description="Aktivitas akun akan tampil di sini setelah Anda melakukan tindakan pada portal."
          actionHref="/member-area/aktivitas"
          actionLabel="Lihat riwayat aktivitas"
        />
      )}
    </section>
  )
}

function QuickAccess({
  hasAccessManage,
  hasContent,
  hasAdmin,
}: {
  hasAccessManage: boolean
  hasContent: boolean
  hasAdmin: boolean
}) {
  const reduced = useReducedMotion()
  const reveal = useReveal(0.1)
  const shortcuts: Array<{ href: string; title: string; icon: React.ElementType }> = [
    { href: "/member-area/identitas", title: "Identitas Digital", icon: IdCard },
    { href: "/pengaturan-profil", title: "Pengaturan Profil", icon: UserRoundCog },
    { href: "/bantuan", title: "Pusat Bantuan", icon: CircleHelp },
  ]
  if (hasContent) shortcuts.push({ href: "/member-area/konten/beranda", title: "Kelola Website", icon: FilePenLine })
  if (hasAdmin) shortcuts.push({ href: "/admin", title: "Administrasi Sistem", icon: Settings2 })
  if (hasAccessManage) shortcuts.push({ href: "/member-area/hak-akses", title: "Hak Akses", icon: ShieldCheck })

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
      variants={reveal}
      aria-labelledby="quick-access-heading"
    >
      <h2 id="quick-access-heading" className="mb-4 text-base font-semibold text-[#08213b] dark:text-white">
        Akses Cepat
      </h2>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.href}
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={reduced ? { duration: 0 } : { duration: 0.4, delay: index * 0.05, ease: motionEase }}
            >
              <Link
                href={item.href}
                className="group inline-flex items-center gap-2 rounded-xl border border-[#dce8e2]/90 bg-white/90 px-4 py-2.5 text-sm font-medium text-[#08213b] shadow-sm transition duration-200 hover:border-[#07965d]/35 hover:bg-[#e7f7ef]/60 hover:text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#0d1e2d]/85 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#07965d] dark:text-emerald-400" aria-hidden="true" />
                {item.title}
                <ArrowRight className="h-3 w-3 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-[3px] group-hover:opacity-100" aria-hidden="true" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}

function CardsStaggerGroup({ children }: { children: React.ReactNode }) {
  const stagger = useCardStagger()
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
      variants={stagger.container}
      className="grid gap-5 lg:grid-cols-2"
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={stagger.item}>
              {child}
            </motion.div>
          ))
        : (
          <motion.div variants={stagger.item}>{children}</motion.div>
        )}
    </motion.div>
  )
}

export function PortalHubDashboard({
  user,
  modules,
  notifications,
  activities,
  permissions,
  sessionVerified,
}: {
  user: AuthUser
  modules: PortalHubModule[]
  notifications: PortalHubNotification[]
  activities: PortalHubActivity[]
  permissions: string[]
  sessionVerified: boolean
}) {
  const hasAccessManage = permissions.includes("access.manage")
  const hasIdentityAccess = permissions.includes("member_area.view")
  const hasContent = CONTENT_PERMISSIONS.some((permission) => permissions.includes(permission))
  const hasAdmin = ADMIN_PERMISSIONS.some((permission) => permissions.includes(permission)) || canAccessAdminDashboard(user.role)
  const apps = resolveEcosystemApps(modules)

  return (
    <div className="space-y-8 sm:space-y-9">
      <WelcomeBanner user={user} sessionVerified={sessionVerified} hasIdentityAccess={hasIdentityAccess} />
      <EcosystemSection apps={apps} />
      <CardsStaggerGroup>
        <NotificationsCard notifications={notifications} />
        <ActivityCard activities={activities} />
      </CardsStaggerGroup>
      <QuickAccess hasAccessManage={hasAccessManage} hasContent={hasContent} hasAdmin={hasAdmin} />
    </div>
  )
}
