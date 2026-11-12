"use client"

import Image from "next/image"
import Link from "next/link"
import { AlertCircle, ArrowRight, ArrowUpRight, Camera, ChevronRight, Lock, MessageCircle, RefreshCw, Sparkles } from "lucide-react"
import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { useLandingApps, type LandingApp } from "@/components/piindung/home/home-apps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { canAccessAdminDashboard } from "@/features/auth/route-access"
import { roleDisplayNames } from "@/features/auth/role-config"
import {
  hasGorutModule,
  operationalRoleLabels,
  resolveAccountLinks,
  resolveDashboardTasks,
  resolveGorutApp,
  type DashboardAccess,
  type DashboardLink,
  type GorutAppAccess,
  type OperationalRole,
} from "@/lib/portal-dashboard"
import { cn } from "@/lib/utils"
import type { AuthUser } from "@/types/auth"
import { initialsOf, PortalHeader } from "./portal-header"
import { portalFont } from "./portal-font"
import { portalIcons } from "./portal-icons"
import { usePortalTheme } from "./portal-theme"
import "./portal.css"

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; access: DashboardAccess; contextUnavailable: boolean }

const operationalRoles = new Set<string>(["PC", "UPZIS", "RANTING", "PLPK"])

async function readJson(path: string, signal: AbortSignal) {
  const response = await fetch(path, { credentials: "include", cache: "no-store", signal })
  return { status: response.status, data: response.ok ? ((await response.json().catch(() => null)) as Record<string, unknown> | null) : null }
}

/** Dua permintaan paralel: izin portal + konteks GORUT (Munfiq: identitas Munfiq). */
function useDashboardAccess(user: AuthUser) {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const isMunfiq = user.role === "munfiq"
    Promise.all([
      readJson("/api/portal-access/me", controller.signal),
      readJson(isMunfiq ? "/api/gorut/munfiq/me" : "/api/gorut/context", controller.signal),
    ])
      .then(([portal, gorut]) => {
        if (!portal.data) return setState({ status: "error" })
        // 403 berarti memang belum punya penugasan/identitas; selain itu belum dapat dipastikan.
        const contextUnavailable = !gorut.data && gorut.status !== 403
        const role = gorut.data?.operationalRole
        setState({
          status: "ready",
          contextUnavailable,
          access: {
            role: user.role,
            permissions: (portal.data.permissions as string[] | undefined) ?? [],
            modules: (portal.data.modules as { key: string }[] | undefined) ?? [],
            operationalRole: !isMunfiq && typeof role === "string" && operationalRoles.has(role) ? (role as OperationalRole) : null,
            munfiqLinked: isMunfiq ? typeof gorut.data?.munfiqCode === "string" && gorut.data?.active === true : null,
            adminDashboard: canAccessAdminDashboard(user.role),
          },
        })
      })
      .catch((error: unknown) => {
        if ((error as { name?: string } | null)?.name !== "AbortError") setState({ status: "error" })
      })
    return () => controller.abort()
  }, [user.role, attempt])

  const retry = useCallback(() => {
    setState({ status: "loading" })
    setAttempt((value) => value + 1)
  }, [])

  return { state, retry }
}

const rise = (index: number) => ({ "--portal-index": index }) as CSSProperties

function Skeleton({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn("portal-skeleton block rounded-xl", className)} />
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 id={id} className="text-[21px] font-bold tracking-[-0.025em] text-[#08213b] dark:text-white sm:text-[23px]">{title}</h2>
      <p className="mt-1 text-[14px] text-[#5b6878] dark:text-[#a9bdb1]">{description}</p>
    </div>
  )
}

function assignmentLabel(state: LoadState, gorut: GorutAppAccess | null) {
  if (state.status === "error") return "Akses belum dapat dimuat"
  if (state.status !== "ready") return null
  const { access } = state
  if (access.role === "munfiq") return access.munfiqLinked ? "Kotak infak terhubung" : "Kotak infak belum terhubung"
  if (state.contextUnavailable) return "Penugasan GORUT belum dapat dipastikan"
  if (gorut?.kind === "open" && access.operationalRole) return `Penugasan GORUT · ${operationalRoleLabels[access.operationalRole]}`
  return "GORUT belum aktif untuk akun ini"
}

function IdentityCard({ user, state, gorut, profileHref }: { user: AuthUser; state: LoadState; gorut: GorutAppAccess | null; profileHref: string | null }) {
  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())
  const assignment = assignmentLabel(state, gorut)
  const active = gorut?.kind === "open"

  return (
    <section aria-labelledby="portal-greeting" className="portal-rise relative flex w-full flex-col justify-center overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0b4f33_0%,#0f6b45_55%,#1f8a56_100%)] p-6 text-white shadow-[0_24px_50px_-28px_rgba(11,79,51,.7)] ring-1 ring-transparent dark:bg-[linear-gradient(135deg,#0a3a27_0%,#0d5236_55%,#166b44_100%)] dark:shadow-none dark:ring-white/10 sm:p-8" style={rise(0)}>
      <span aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
      <span aria-hidden="true" className="absolute -right-4 -top-8 h-40 w-40 rounded-full border border-white/10" />
      <span aria-hidden="true" className="absolute -bottom-24 right-10 h-56 w-56 rounded-full bg-[#c9f26d]/20 blur-3xl" />

      <div className="relative flex items-start gap-5 sm:items-center">
        <div className="min-w-0 flex-1">
        <p className="text-[14px] text-white/75">Assalamu&apos;alaikum,</p>
        <h1 id="portal-greeting" className="mt-1 line-clamp-2 text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-[-0.03em]">{user.name}</h1>
        <p className="mt-1.5 text-[13.5px] text-white/65">{today}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-white/15">{roleDisplayNames[user.role]}</span>
          {assignment ? (
            <span className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-semibold", active || (state.status === "ready" && state.access.munfiqLinked) ? "bg-[#c9f26d] text-[#0b2a1a]" : "bg-white/10 text-white/80 ring-1 ring-white/15")}>{assignment}</span>
          ) : (
            <span aria-hidden="true" className="block h-7 w-44 animate-pulse rounded-full bg-white/15 motion-reduce:animate-none" />
          )}
        </div>

        {active && gorut?.kind === "open" && (
          <Link href={gorut.href} className="group mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-white pl-5 pr-1.5 text-[14.5px] font-bold text-[#0b4f33] transition hover:bg-[#f2fbe6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9f26d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f6b45]">
            Buka GORUT
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#c9f26d] text-[#0b2a1a] transition-transform duration-300 group-hover:translate-x-0.5"><ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
          </Link>
        )}
        </div>

        <div className="relative shrink-0 sm:mr-2">
          <span aria-hidden="true" className="absolute -inset-3 rounded-full border border-white/15 sm:-inset-4" />
          <span aria-hidden="true" className="absolute -inset-6 hidden rounded-full border border-dashed border-white/10 sm:block" />
          <Avatar className="relative h-16 w-16 shadow-[0_16px_32px_-14px_rgba(0,0,0,.55)] ring-4 ring-white/25 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
            <AvatarImage src={user.avatar || undefined} alt={`Foto profil ${user.name}`} className="object-cover" />
            <AvatarFallback className="bg-[#c9f26d] text-[22px] font-bold text-[#0b4f33] sm:text-[30px] lg:text-[34px]">{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          {profileHref && (
            <Link href={profileHref} aria-label="Ubah foto profil" title="Ubah foto profil" className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-white text-[#0b4f33] shadow-[0_6px_14px_-6px_rgba(0,0,0,.5)] ring-2 ring-[#0f6b45] transition hover:bg-[#f2fbe6] focus-visible:outline-none focus-visible:ring-[#c9f26d] sm:h-9 sm:w-9">
              <Camera className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function AccountPanel({ links, className, headingId }: { links: DashboardLink[]; className?: string; headingId: string }) {
  return (
    <section aria-labelledby={headingId} className={cn("portal-rise rounded-[28px] border border-[#e3ede0] bg-white p-3 dark:border-white/10 dark:bg-[#0d1e2d] sm:p-4", className)} style={rise(1)}>
      <h2 id={headingId} className="px-3 pb-2 pt-2 text-[15px] font-bold text-[#08213b] dark:text-white">Akun Anda</h2>
      <ul className="grid gap-1">
        {links.map((link) => {
          const Icon = portalIcons[link.icon]
          return (
            <li key={link.id}>
              <Link href={link.href} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[#f3f9ef] dark:hover:bg-white/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef7e9] text-[#0b4f33] dark:bg-[#12301f] dark:text-[#c9f26d]"><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-[#08213b] dark:text-white">{link.title}</span>
                  <span className="block truncate text-[12.5px] text-[#5b6878] dark:text-[#a9bdb1]">{link.description}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#9aa8a0] transition-transform group-hover:translate-x-0.5 dark:text-[#6f8579]" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function emptyTasksMessage(access: DashboardAccess) {
  if (access.role === "munfiq") return "Akun Munfiq Anda belum terhubung dengan kotak infak. Hubungi admin LAZISNU Garut untuk menautkannya."
  if (access.role === "plpk") return "Penugasan PLPK Anda belum aktif. Hubungi Kordes atau admin UPZIS di wilayah Anda."
  if (!hasGorutModule(access)) return "Akses GORUT belum diaktifkan untuk akun Anda. Hubungi admin PC bila Anda memerlukannya."
  return "Akun Anda belum memiliki penugasan GORUT yang aktif. Hubungi admin PC untuk mengaturnya."
}

function TaskCard({ task, index }: { task: DashboardLink; index: number }) {
  const Icon = portalIcons[task.icon]
  return (
    <Link href={task.href} style={rise(index + 2)} className="portal-rise group relative flex min-h-[148px] flex-col rounded-[22px] bg-[#eef7e9] p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-[#e5f3dd] hover:shadow-[0_16px_30px_-20px_rgba(11,79,51,.45)] dark:bg-[#0f2a1f] dark:ring-1 dark:ring-white/5 dark:hover:bg-[#123425] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c] motion-reduce:hover:translate-y-0 sm:min-h-[156px] sm:rounded-[24px] sm:p-5">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d4f28a] text-[#0b4f33] sm:h-12 sm:w-12"><Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden="true" /></span>
      <span className="mt-3.5 pr-6 text-[15px] font-bold leading-snug text-[#08213b] dark:text-white sm:mt-4 sm:pr-10 sm:text-[16px]">{task.title}</span>
      <span className="mt-1 text-[12.5px] leading-relaxed text-[#4c5f55] dark:text-[#a9bdb1] sm:text-[13.5px]">{task.description}</span>
      <span aria-hidden="true" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white text-[#0b4f33] transition-transform dark:bg-white/10 dark:text-[#c9f26d] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:right-4 sm:top-4 sm:h-9 sm:w-9"><ArrowUpRight className="h-4 w-4" /></span>
    </Link>
  )
}

function gorutGroupLabel(access: DashboardAccess) {
  if (access.role === "munfiq") return "Layanan Munfiq"
  return access.operationalRole ? `Operasional GORUT · ${operationalRoleLabels[access.operationalRole]}` : "Operasional GORUT"
}

function TaskGroup({ label, tasks, offset }: { label: string; tasks: DashboardLink[]; offset: number }) {
  if (!tasks.length) return null
  return (
    <div>
      <h3 className="mb-3 text-[14px] font-semibold text-[#3f5a4b] dark:text-[#a9bdb1]">{label}</h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tasks.map((task, index) => <TaskCard key={task.id} task={task} index={offset + index} />)}
      </div>
    </div>
  )
}

function TasksSection({ state, retry, tasks }: { state: LoadState; retry: () => void; tasks: DashboardLink[] }) {
  const gorutTasks = tasks.filter((task) => task.href.startsWith("/gorut-v2"))
  const portalTasks = tasks.filter((task) => !task.href.startsWith("/gorut-v2"))
  return (
    <section aria-labelledby="portal-tasks" aria-busy={state.status === "loading" || undefined}>
      <SectionHeading id="portal-tasks" title="Pekerjaan Anda" description="Pintasan ke tugas yang tersedia untuk peran dan penugasan Anda." />
      {state.status === "loading" && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" role="status" aria-label="Memuat pekerjaan">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-[148px] rounded-[22px] sm:h-[156px] sm:rounded-[24px]" />)}
        </div>
      )}
      {state.status === "error" && (
        <div role="alert" className="flex flex-col items-start gap-4 rounded-[24px] border border-[#f3d3cf] bg-[#fff7f5] p-6 dark:border-[#5c2a2a] dark:bg-[#2a1515] sm:flex-row sm:items-center">
          <AlertCircle className="h-6 w-6 shrink-0 text-[#b42318] dark:text-[#ff8a7a]" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-[#7a271a] dark:text-[#ffb4a8]">Pekerjaan belum dapat dimuat.</p>
            <p className="mt-0.5 text-[13.5px] text-[#8a4b40] dark:text-[#e6a99f]">Periksa koneksi Anda lalu coba lagi. Bila masih gagal, hubungi admin.</p>
          </div>
          <button type="button" onClick={retry} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0b4f33] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0f6b45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c] focus-visible:ring-offset-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />Coba lagi
          </button>
        </div>
      )}
      {state.status === "ready" && (
        <>
          {state.contextUnavailable && (
            <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-[#fff8e6] px-4 py-3 text-[13.5px] text-[#7a5a12] dark:bg-[#2b2410] dark:text-[#f3d27a]">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">Penugasan GORUT belum dapat dipastikan, jadi pintasan GORUT belum ditampilkan.</span>
              <button type="button" onClick={retry} className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c]">Coba lagi</button>
            </div>
          )}
          {tasks.length > 0 ? (
            <div className="space-y-6">
              <TaskGroup label={gorutGroupLabel(state.access)} tasks={gorutTasks} offset={0} />
              <TaskGroup label="Pengelolaan PIINDUNG" tasks={portalTasks} offset={gorutTasks.length} />
            </div>
          ) : (
            <div className="portal-rise flex flex-col items-start gap-4 rounded-[24px] border border-dashed border-[#cfe2c6] bg-[#f8fcf5] p-6 dark:border-white/15 dark:bg-[#0d1e2d] sm:flex-row sm:items-center" style={rise(2)}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef7e9] text-[#0b4f33] dark:bg-[#12301f] dark:text-[#c9f26d]"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-[#08213b] dark:text-white">Belum ada pekerjaan untuk akun Anda</p>
                <p className="mt-0.5 max-w-[60ch] text-[13.5px] leading-relaxed text-[#5b6878] dark:text-[#a9bdb1]">{state.contextUnavailable ? "Muat ulang untuk memeriksa penugasan GORUT Anda." : emptyTasksMessage(state.access)}</p>
              </div>
              <Link href="/kontak" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#cfe2c6] bg-white px-5 text-[14px] font-semibold text-[#0b4f33] transition hover:bg-[#eef7e9] dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c]">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />Hubungi admin
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function AppCard({ app, gorut, index }: { app: LandingApp; gorut: GorutAppAccess | null; index: number }) {
  const isGorut = app.id === "gorut"
  const href = isGorut ? (app.available && gorut?.kind === "open" ? gorut.href : null) : app.available ? app.href : null
  const status = !app.available ? "Segera hadir" : isGorut && gorut?.kind === "locked" ? "Belum aktif" : isGorut && !gorut ? "Memeriksa…" : "Aktif"
  const tone = status === "Aktif" ? "bg-[#e3f6ec] text-[#06784b] dark:bg-[#c9f26d]/15 dark:text-[#c9f26d]" : "bg-[#eef2f1] text-[#556372] dark:bg-white/5 dark:text-slate-400"

  return (
    <article className="portal-rise flex flex-col rounded-[22px] border border-[#e3ede0] bg-white p-4 transition hover:shadow-[0_16px_34px_-24px_rgba(11,79,51,.4)] dark:border-white/10 dark:bg-[#0d1e2d] dark:hover:shadow-none sm:rounded-[24px] sm:p-5" style={rise(index + 6)}>
      <div className="flex items-start justify-between gap-2">
        <Image src={app.icon} alt="" width={56} height={56} className={cn("h-11 w-11 object-contain sm:h-14 sm:w-14", !app.available && "opacity-75 grayscale-[.3]")} />
        <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10.5px] font-bold sm:px-2.5 sm:text-[11.5px]", tone)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status === "Aktif" ? "bg-[#07965d]" : "bg-[#9aa6b1]")} />{status}
        </span>
      </div>
      <h3 className="mt-3 text-[15px] font-bold tracking-[-0.02em] text-[#08213b] dark:text-white sm:mt-4 sm:text-[17px]">{app.name}</h3>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[#5b6878] dark:text-[#a9bdb1] sm:line-clamp-3 sm:text-[13.5px]">{app.description}</p>
      <div className="mt-auto pt-4 sm:pt-5">
        {href ? (
          <Link href={href} className="group inline-flex h-10 items-center gap-2 rounded-full bg-[#0b4f33] px-4 text-[13px] font-semibold sm:h-11 sm:px-5 sm:text-[14px] text-white transition hover:bg-[#0f6b45] dark:bg-[#c9f26d] dark:text-[#0b2a1a] dark:hover:bg-[#d7f88d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c] focus-visible:ring-offset-2">
            Buka {app.name}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ) : isGorut && app.available && gorut?.kind === "locked" ? (
          <p className="flex items-start gap-2 text-[12.5px] leading-snug text-[#5b6878] dark:text-[#a9bdb1]"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{gorut.reason}</p>
        ) : (
          <span className="inline-flex h-10 items-center rounded-full bg-[#f2f5f3] px-4 text-[12.5px] font-semibold text-[#7a8794] dark:bg-white/5 dark:text-slate-400 sm:h-11 sm:px-5 sm:text-[13.5px]" aria-disabled="true">{app.available ? "Memeriksa akses…" : "Segera hadir"}</span>
        )}
      </div>
    </article>
  )
}

function HelpBanner({ helpHref }: { helpHref: string }) {
  return (
    <section aria-labelledby="portal-help" className="relative grid items-center overflow-hidden rounded-[28px] bg-[linear-gradient(115deg,#eef9e4_0%,#ddf2c9_60%,#cdebb3_100%)] px-6 pt-7 dark:bg-[linear-gradient(115deg,#0f2a1d_0%,#123a27_60%,#17482f_100%)] dark:ring-1 dark:ring-white/10 sm:px-10 md:grid-cols-[minmax(0,1fr)_auto] md:pt-0">
      <div className="relative z-10 py-2 md:py-9">
        <h2 id="portal-help" className="text-[22px] font-bold tracking-[-0.025em] text-[#08213b] dark:text-white sm:text-[24px]">Butuh bantuan?</h2>
        <p className="mt-2 max-w-[44ch] text-[14.5px] leading-relaxed text-[#3f5a4b] dark:text-[#b9cdbf]">Panduan penggunaan ada di Pusat Bantuan. Tim NU Care–LAZISNU Garut juga siap membantu bila Anda menemui kendala.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={helpHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0b4f33] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0f6b45] dark:bg-[#c9f26d] dark:text-[#0b2a1a] dark:hover:bg-[#d7f88d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c] focus-visible:ring-offset-2">Buka Pusat Bantuan</Link>
          <Link href="/kontak" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#0b4f33]/20 bg-white/70 px-5 text-[14px] font-semibold text-[#0b4f33] transition hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fae3c]"><MessageCircle className="h-4 w-4" aria-hidden="true" />Hubungi admin</Link>
        </div>
      </div>
      <Image src="/images/portal/mascot-group.webp" alt="Sahabat NU Care–LAZISNU Garut memberi salam" width={640} height={480} className="relative mx-auto -mb-1 mt-4 h-auto w-[min(100%,300px)] md:mx-0 md:mt-6 md:w-[340px] lg:w-[380px]" />
    </section>
  )
}

/** Dashboard PIINDUNG V2: pusat akses berbasis peran. Bukan pengganti dashboard operasional GORUT. */
export function PortalDashboard({ user }: { user: AuthUser }) {
  const { state, retry } = useDashboardAccess(user)
  const { dark, toggle } = usePortalTheme()
  const apps = useLandingApps()
  const ready = state.status === "ready" ? state : null
  const tasks = ready ? resolveDashboardTasks(ready.access) : []
  const gorut = ready ? resolveGorutApp(ready.access) : null
  // Sebelum izin termuat, tampilkan tautan akun dasar yang dimiliki semua peran.
  const accountLinks = ready ? resolveAccountLinks(ready.access) : resolveAccountLinks({ role: user.role, permissions: ["profile.view", "notifications.view"], modules: [], operationalRole: null, munfiqLinked: null, adminDashboard: false })
  const helpHref = accountLinks.find((link) => link.id === "bantuan")?.href ?? "/bantuan"

  return (
    <div className={cn(portalFont.className, "min-h-dvh antialiased", dark ? "dark bg-[linear-gradient(180deg,#0a1f17_0%,#07131f_360px)] text-white [color-scheme:dark]" : "bg-[linear-gradient(180deg,#f3faef_0%,#ffffff_340px)] text-[#08213b]")}>
      <PortalHeader user={user} helpHref={helpHref} accountLinks={accountLinks} showNotifications={accountLinks.some((link) => link.id === "notifikasi")} dark={dark} onToggleTheme={toggle} />
      {/* Satu panel Akun: di desktop berdampingan dengan kartu identitas, di mobile turun setelah Aplikasi (CSS order, tanpa toggle display). */}
      <main className="mx-auto flex max-w-[1180px] flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10" aria-label="Dashboard PIINDUNG">
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-5">
          <div className="order-1 flex lg:order-none">
            <IdentityCard user={user} state={state} gorut={gorut} profileHref={accountLinks.find((link) => link.id === "profil")?.href ?? null} />
          </div>
          <AccountPanel links={accountLinks} headingId="portal-account" className="order-4 lg:order-none" />
        </div>

        <div className="order-2">
          <TasksSection state={state} retry={retry} tasks={tasks} />
        </div>

        <section id="aplikasi" aria-labelledby="portal-apps" className="order-3 scroll-mt-24">
          <SectionHeading id="portal-apps" title="Aplikasi Anda" description="Aplikasi PIINDUNG dibuka dengan akun yang sama. Status sesuai keadaan sebenarnya." />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {apps.map((app, index) => <AppCard key={app.id} app={app} gorut={state.status === "loading" ? null : gorut ?? { kind: "locked", reason: "Akses aplikasi belum dapat dimuat." }} index={index} />)}
          </div>
        </section>

        <div className="order-5">
          <HelpBanner helpHref={helpHref} />
        </div>
      </main>
      <footer className="mx-auto max-w-[1180px] px-4 pb-8 pt-2 text-[12.5px] text-[#7a8794] dark:text-slate-500 sm:px-6 lg:px-8">© 2026 PIINDUNG · NU Care–LAZISNU Kabupaten Garut</footer>
    </div>
  )
}
