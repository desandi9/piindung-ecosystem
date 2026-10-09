"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type Variants } from "motion/react"
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  CircleHelp,
  Clock,
  Fingerprint,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motionEase } from "@/lib/motion"
import { roleDisplayNames } from "@/lib/auth-context"
import type { AccountProfile } from "@/lib/account-profile"
import type { AppRole } from "@/types/auth"
import { cn } from "@/lib/utils"

const datetime = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)) : "—"

const dateOnly = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value)) : "—"

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

function useStagger(): { container: Variants; item: Variants } {
  const reduced = useReducedMotion()
  return {
    container: { hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.07, delayChildren: reduced ? 0 : 0.05 } } },
    item: {
      hidden: reduced ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.98 },
      visible: { opacity: 1, y: 0, scale: 1, transition: reduced ? { duration: 0 } : { duration: 0.55, ease: motionEase } },
    },
  }
}

type MenuItem = {
  href: string
  title: string
  description: string
  icon: React.ElementType
  external?: boolean
  accent: string
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [error, setError] = useState("")
  const reveal = useReveal()

  useEffect(() => {
    void fetch("/api/account/profile", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setProfile(data.profile)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Profil belum dapat dimuat."))
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f9f6] dark:bg-[#07131f]">
      <Navbar />
      <main className="container mx-auto max-w-5xl flex-1 space-y-8 px-4 py-8 sm:py-10">
        <motion.header initial="hidden" animate="visible" variants={reveal}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#07965d] dark:text-emerald-300">Akun PIINDUNG</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#08213b] dark:text-white sm:text-4xl">Profil Saya</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6c7a89] dark:text-slate-300 sm:text-[15px]">
            Informasi akun pusat yang tersimpan aman di PIINDUNG. Kelola identitas, keamanan, dan layanan dari satu tempat.
          </p>
        </motion.header>

        {error ? (
          <div role="alert" className="rounded-2xl border border-red-200/70 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {!profile && !error ? <ProfileSkeleton /> : null}

        {profile ? <ProfileContent profile={profile} /> : null}
      </main>
      <SimpleFooter />
    </div>
  )
}

function ProfileContent({ profile }: { profile: AccountProfile }) {
  const stagger = useStagger()
  const sectionReveal = useReveal(0.05)
  const initials = profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "PI"
  const roleLabel = roleDisplayNames[profile.role as AppRole] ?? profile.role
  const isActive = profile.status.toLowerCase().includes("aktif") || profile.status.toLowerCase() === "active"

  const info: Array<{ label: string; value: string; icon: React.ElementType; mono?: boolean }> = [
    { label: "Nama Lengkap", value: profile.name, icon: UserRound },
    { label: "Member ID", value: profile.memberId, icon: Fingerprint, mono: true },
    { label: "Email", value: profile.email || "Belum diatur", icon: Mail },
    { label: "Nomor HP", value: profile.phone || "Belum diatur", icon: Phone },
    { label: "Alamat", value: profile.address || "Belum diatur", icon: MapPin },
    { label: "Peran", value: roleLabel, icon: ShieldCheck },
    { label: "Status Akun", value: profile.status, icon: BadgeCheck },
    { label: "Bergabung", value: dateOnly(profile.createdAt), icon: CalendarClock },
    { label: "Diperbarui", value: datetime(profile.updatedAt), icon: Clock },
  ]

  const menu: MenuItem[] = [
    { href: "/pengaturan-profil", title: "Pengaturan Akun", description: "Ubah nama, email, dan nomor HP.", icon: Settings2, accent: "from-emerald-500/15 to-teal-500/10" },
    { href: profile.identityPath, title: "Kartu Identitas Digital", description: "Lihat dan bagikan identitas anggota.", icon: IdCard, accent: "from-teal-500/15 to-emerald-500/10" },
    { href: "/pengaturan-profil", title: "Keamanan & Password", description: "Perbarui kata sandi akun Anda.", icon: KeyRound, accent: "from-emerald-400/15 to-teal-400/10" },
    { href: profile.verificationUrl, title: "Verifikasi Identitas", description: "Konfirmasi keaslian data anggota.", icon: BadgeCheck, external: true, accent: "from-teal-400/15 to-emerald-500/10" },
    { href: "/notifikasi", title: "Notifikasi", description: "Kabar dan pemberitahuan terbaru.", icon: Bell, accent: "from-teal-500/15 to-emerald-500/10" },
    { href: "/bantuan", title: "Pusat Bantuan", description: "Panduan dan dukungan PIINDUNG.", icon: CircleHelp, accent: "from-emerald-400/15 to-teal-400/10" },
  ]

  return (
    <div className="space-y-8">
      <HeroCard
        name={profile.name}
        email={profile.email}
        roleLabel={roleLabel}
        memberId={profile.memberId}
        status={profile.status}
        avatar={profile.avatar}
        initials={initials}
        isActive={isActive}
      />

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
        variants={sectionReveal}
        aria-labelledby="profile-info-heading"
        className="rounded-[28px] border border-[#dce8e2]/90 bg-white/90 p-6 shadow-[0_14px_36px_rgba(9,43,32,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1e2d]/85 sm:p-7"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-300">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="profile-info-heading" className="text-lg font-bold tracking-tight text-[#08213b] dark:text-white sm:text-xl">
              Informasi Profil
            </h2>
            <p className="mt-0.5 text-sm text-[#6c7a89] dark:text-slate-400">Data akun pusat Anda di PIINDUNG.</p>
          </div>
        </div>

        <motion.dl
          variants={stagger.container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {info.map((row) => {
            const Icon = row.icon
            return (
              <motion.div
                key={row.label}
                variants={stagger.item}
                className="flex items-start gap-3 rounded-2xl border border-[#dce8e2]/70 bg-[#f8fbf9]/70 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#07965d] shadow-sm dark:bg-[#0d1e2d] dark:text-emerald-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6c7a89] dark:text-slate-400">{row.label}</dt>
                  <dd className={cn("mt-0.5 break-words font-semibold text-[#08213b] dark:text-white", row.mono && "font-mono text-sm")}>{row.value}</dd>
                </div>
              </motion.div>
            )
          })}
        </motion.dl>
      </motion.section>

      <section aria-labelledby="profile-menu-heading">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#07965d] to-[#0bbf78] text-white shadow-[0_8px_20px_rgba(7,150,93,0.28)]">
            <Settings2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="profile-menu-heading" className="text-lg font-bold tracking-tight text-[#08213b] dark:text-white sm:text-xl">
              Menu & Layanan
            </h2>
            <p className="mt-0.5 text-sm text-[#6c7a89] dark:text-slate-400">Akses cepat ke pengaturan dan layanan akun.</p>
          </div>
        </div>

        <motion.div
          variants={stagger.container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1, margin: "0px 0px -8% 0px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {menu.map((item) => (
            <MenuCard key={item.title} item={item} variants={stagger.item} />
          ))}
        </motion.div>
      </section>
    </div>
  )
}

function HeroCard({
  name,
  email,
  roleLabel,
  memberId,
  status,
  avatar,
  initials,
  isActive,
}: {
  name: string
  email: string
  roleLabel: string
  memberId: string
  status: string
  avatar: string | null
  initials: string
  isActive: boolean
}) {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 220, damping: 20 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 220, damping: 20 })
  const spotlightBackground = useTransform(
    [px, py],
    ([x, y]) => `radial-gradient(420px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(7,150,93,0.16), transparent 70%)`,
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
    <motion.section
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.7, ease: motionEase }}
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      style={interactive ? { rotateX, rotateY, transformPerspective: 1000 } : undefined}
      className="group relative overflow-hidden rounded-[28px] border border-[#dce8e2]/90 bg-gradient-to-br from-white via-[#f8fbf9] to-[#e7f7ef]/60 p-6 shadow-[0_18px_44px_rgba(9,43,32,0.07)] backdrop-blur-sm [transform-style:preserve-3d] dark:border-white/10 dark:from-[#0d1e2d] dark:via-[#0d1e2d] dark:to-emerald-500/10 sm:p-8"
      aria-labelledby="profile-hero-heading"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={reduced ? undefined : { x: [0, 22, 0], y: [0, -14, 0] }}
          transition={reduced ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-12 -top-16 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10"
        />
        <motion.div
          animate={reduced ? undefined : { x: [0, -18, 0], y: [0, 16, 0] }}
          transition={reduced ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-teal-200/35 blur-3xl dark:bg-teal-500/10"
        />
      </div>

      {interactive ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlightBackground }}
        />
      ) : null}

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <motion.div
          whileHover={interactive ? { scale: 1.05, rotate: -3 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          className="shrink-0"
        >
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-[#07965d]/20 dark:border-white/10 dark:ring-emerald-400/20">
            <AvatarImage src={avatar || undefined} alt={name} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-[#08213b] to-[#07965d] text-2xl font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="profile-hero-heading" className="text-2xl font-bold tracking-tight text-[#08213b] dark:text-white">
              {name}
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                isActive
                  ? "bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-[#f1f4f7] text-[#9aabb8] dark:bg-white/[0.08] dark:text-slate-400",
              )}
            >
              {isActive ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#07965d] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#07965d]" />
                </span>
              ) : null}
              {status}
            </span>
          </div>
          {email ? <p className="mt-1 truncate text-sm text-[#6c7a89] dark:text-slate-300">{email}</p> : null}
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#07965d] dark:text-emerald-300">{roleLabel}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1 font-mono text-sm text-[#08213b] shadow-sm dark:bg-white/5 dark:text-slate-200">
            <Fingerprint className="h-3.5 w-3.5 text-[#07965d] dark:text-emerald-300" aria-hidden="true" />
            {memberId}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:self-stretch sm:justify-center">
          <Link
            href="/pengaturan-profil"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#07965d] to-[#0bbf78] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(7,150,93,0.24)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(7,150,93,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#07131f]"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Pengaturan Akun
          </Link>
          <Link
            href="/profil/identitas"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dce8e2] bg-white/90 px-5 text-sm font-semibold text-[#08213b] shadow-sm transition hover:border-[#07965d]/40 hover:bg-[#e7f7ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-emerald-500/10"
          >
            <IdCard className="h-4 w-4" aria-hidden="true" />
            Identitas Digital
          </Link>
        </div>
      </div>
    </motion.section>
  )
}

function MenuCard({ item, variants }: { item: MenuItem; variants: Variants }) {
  const Icon = item.icon
  return (
    <motion.div variants={variants} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <Link
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        className="group relative flex h-full items-start gap-4 overflow-hidden rounded-[22px] border border-[#dce8e2]/90 bg-white/95 p-5 shadow-[0_10px_28px_rgba(9,43,32,0.05)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_22px_48px_rgba(7,150,93,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#0d1e2d]/90 dark:focus-visible:ring-offset-[#07131f]"
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
            item.accent,
          )}
        />
        <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#07965d] shadow-sm transition-transform duration-300 group-hover:scale-105 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold tracking-tight text-[#08213b] dark:text-white">{item.title}</h3>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#07965d] opacity-0 transition-all duration-200 group-hover:translate-x-[3px] group-hover:opacity-100 dark:text-emerald-300" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm leading-6 text-[#6c7a89] dark:text-slate-300">{item.description}</p>
        </div>
      </Link>
    </motion.div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-[188px] animate-pulse rounded-[28px] border border-[#dce8e2]/90 bg-white/70 dark:border-white/10 dark:bg-[#0d1e2d]/70" />
      <div className="h-[280px] animate-pulse rounded-[28px] border border-[#dce8e2]/90 bg-white/70 dark:border-white/10 dark:bg-[#0d1e2d]/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[104px] animate-pulse rounded-[22px] border border-[#dce8e2]/90 bg-white/70 dark:border-white/10 dark:bg-[#0d1e2d]/70" />
        ))}
      </div>
    </div>
  )
}
