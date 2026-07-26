"use client"

import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"
import {
  ArrowRight,
  BellRing,
  CircleHelp,
  ClipboardList,
  IdCard,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motionEase } from "@/lib/motion"
import { roleDisplayNames } from "@/features/auth"
import type { AuthUser } from "@/types/auth"

export type PortalHubModule = { key: string; name: string; route: string; description: string }
export type PortalHubNotification = { id: string; title: string; body: string; createdAt?: string; readAt: string | null }
export type PortalHubActivity = { id: string; label: string; description: string; timestamp: string }

const datetime = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Baru saja"

const initialsOf = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "P"

const moduleHighlightsByKey: Record<string, string[]> = {
  gorut: ["Digitalisasi kotak infaq", "Setoran & rekap terpusat", "Alur validasi berjenjang"],
}

function useReveal(delay = 0): Variants {
  const reduced = useReducedMotion()
  return {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: 0 } : { duration: 0.6, delay, ease: motionEase },
    },
  }
}

function useCardStagger(): { container: Variants; item: Variants } {
  const reduced = useReducedMotion()
  return {
    container: { hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.08, delayChildren: reduced ? 0 : 0.06 } } },
    item: {
      hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: reduced ? { duration: 0 } : { duration: 0.6, ease: motionEase } },
    },
  }
}

function WelcomeBanner({ user, sessionVerified }: { user: AuthUser; sessionVerified: boolean }) {
  const reveal = useReveal()

  return (
    <motion.section initial="hidden" animate="visible" variants={reveal} aria-labelledby="dashboard-welcome-heading" className="relative overflow-hidden rounded-[24px] border border-emerald-100/70 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-[0_18px_44px_rgba(15,80,55,0.06)] dark:border-emerald-500/15 dark:from-emerald-500/10 dark:via-slate-950 dark:to-slate-950 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 hidden h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10 sm:block" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-24 hidden h-56 w-56 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10 lg:block" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 shrink-0 border border-emerald-200/70 shadow-sm dark:border-emerald-400/25">
            <AvatarImage src={user.avatar || undefined} alt={user.name} className="object-cover" />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-base font-semibold dark:bg-emerald-500/15 dark:text-emerald-200">{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Portal PIINDUNG</p>
            <h1 id="dashboard-welcome-heading" className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Selamat datang kembali, {user.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Kelola akses, identitas, dan layanan PIINDUNG dari satu tempat.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200">
                <UserRoundCog className="h-3.5 w-3.5" aria-hidden="true" />
                {roleDisplayNames[user.role] ?? user.role}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Akun aktif
              </span>
              {sessionVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Sesi terverifikasi
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 sm:flex-col sm:items-end">
          <Link
            href="/profil"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(21,148,91,0.22)] transition hover:bg-[#107947] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          >
            Lihat Profil
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.section>
  )
}

function ModuleShowcase({ modules }: { modules: PortalHubModule[] }) {
  const reduced = useReducedMotion()
  const reveal = useReveal(0.05)
  const cardInitial = reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 } as const

  if (!modules.length) {
    return (
      <motion.section initial="hidden" animate="visible" variants={reveal} aria-labelledby="modules-heading">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 id="modules-heading" className="text-lg font-semibold text-slate-900 dark:text-white">Modul Saya</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Belum ada modul aktif</span>
        </div>
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
          Belum ada modul yang tersedia untuk akun Anda. Hubungi administrator untuk peninjauan akses.
        </div>
      </motion.section>
    )
  }

  const single = modules.length === 1

  return (
    <motion.section initial="hidden" animate="visible" variants={reveal} aria-labelledby="modules-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 id="modules-heading" className="text-lg font-semibold text-slate-900 dark:text-white">Modul Saya</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">{modules.length} modul aktif</span>
      </div>
      <div className={single ? "grid gap-5 lg:grid-cols-[1.35fr_0.9fr]" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"}>
        {modules.map((module, index) => {
          const highlights = moduleHighlightsByKey[module.key] ?? [module.description]
          const initial = module.name.trim().charAt(0).toUpperCase() || "M"
          return (
            <motion.article
              key={module.key}
              initial={cardInitial}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.55, delay: 0.05 + index * 0.05, ease: motionEase }}
              whileHover={reduced ? undefined : { y: -3 }}
              className="group flex flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900 sm:p-7"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" aria-hidden="true">
                      {initial}
                    </span>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                        Tersedia
                      </span>
                      <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{module.name}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{module.description}</p>
                </div>
                {single ? (
                  <div className="w-full max-w-xs shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Fungsi Utama</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {highlights.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              {!single ? (
                <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {highlights.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">{module.route}</span>
                <Link
                  href={module.route}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#15945b] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(21,148,91,0.22)] transition hover:bg-[#107947] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
                >
                  Masuk ke {module.name}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </motion.article>
          )
        })}
      </div>
    </motion.section>
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
    <div className="flex h-full flex-col items-start gap-3 rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm dark:border-white/10 dark:bg-white/5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      <Link href={actionHref} className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-emerald-300 dark:focus-visible:ring-offset-slate-950">
        {actionLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

function NotificationsCard({ notifications }: { notifications: PortalHubNotification[] }) {
  const items = notifications.slice(0, 3)
  return (
    <section aria-labelledby="dashboard-notifications-heading" className="flex h-full flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="dashboard-notifications-heading" className="text-lg font-semibold text-slate-900 dark:text-white">Notifikasi</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kabar terbaru untuk akun Anda.</p>
        </div>
        <Link href="/notifikasi" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300">
          Lihat semua
        </Link>
      </div>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((notification) => (
            <li key={notification.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                {!notification.readAt ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">Baru</span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{notification.body}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{datetime(notification.createdAt)}</p>
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
    <section aria-labelledby="dashboard-activity-heading" className="flex h-full flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="dashboard-activity-heading" className="text-lg font-semibold text-slate-900 dark:text-white">Aktivitas Akun</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tiga aktivitas terbaru pada akun Anda.</p>
        </div>
        <Link href="/member-area/aktivitas" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300">
          Lihat semua
        </Link>
      </div>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((activity) => (
            <li key={activity.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-slate-900 dark:text-white">{activity.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{activity.description}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{datetime(activity.timestamp)}</p>
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

function QuickAccess({ hasAccessManage }: { hasAccessManage: boolean }) {
  const stagger = useCardStagger()
  const shortcuts: Array<{ href: string; title: string; description: string; icon: React.ElementType }> = [
    { href: "/member-area/identitas", title: "Identitas Digital", description: "Kartu identitas anggota PIINDUNG.", icon: IdCard },
    { href: "/pengaturan-profil", title: "Pengaturan Profil", description: "Perbarui data pribadi & keamanan.", icon: UserRoundCog },
    { href: "/bantuan", title: "Pusat Bantuan", description: "Panduan penggunaan dan kontak dukungan.", icon: CircleHelp },
  ]
  if (hasAccessManage) shortcuts.push({ href: "/member-area/hak-akses", title: "Hak Akses", description: "Pengaturan hak akses portal.", icon: ShieldCheck })

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }} variants={stagger.container} aria-labelledby="quick-access-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 id="quick-access-heading" className="text-lg font-semibold text-slate-900 dark:text-white">Akses Cepat</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((item) => {
          const Icon = item.icon
          return (
            <motion.div key={item.href} variants={stagger.item}>
              <Link
                href={item.href}
                className="group flex h-full flex-col gap-3 rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-slate-900 dark:hover:border-emerald-500/30 dark:focus-visible:ring-offset-slate-950"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.description}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Buka
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
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
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }} variants={stagger.container} className="grid gap-5 lg:grid-cols-2">
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

  return (
    <div className="space-y-7 sm:space-y-8">
      <WelcomeBanner user={user} sessionVerified={sessionVerified} />
      <ModuleShowcase modules={modules} />
      <CardsStaggerGroup>
        <NotificationsCard notifications={notifications} />
        <ActivityCard activities={activities} />
      </CardsStaggerGroup>
      <QuickAccess hasAccessManage={hasAccessManage} />
    </div>
  )
}
