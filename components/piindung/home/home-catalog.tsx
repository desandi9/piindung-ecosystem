"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, ArrowUpRight, Check, Play } from "lucide-react"
import { LandingReveal, perCardReveal } from "@/components/piindung/landing-motion"
import { useAuth } from "@/lib/auth-context"
import { GORUT_PLAY_STORE_URL, resolveLandingGorutRoute } from "@/lib/landing-gorut-route"
import { cn } from "@/lib/utils"
import type { LandingApp } from "./home-apps"

const gorutCapabilities = ["Data munfiq dan kaleng koin", "Pengambilan dan setoran koin", "Validasi, persetujuan, dan laporan"]

function StatusPill({ available, tone = "light" }: { available: boolean; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold",
        available
          ? tone === "dark" ? "bg-[#c9f26d] text-[#061423]" : "bg-[#e3f6ec] text-[#06784b]"
          : "bg-[#eef2f1] text-[#556372]",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", available ? (tone === "dark" ? "bg-[#061423]" : "bg-[#07965d]") : "bg-[#9aa6b1]")} />
      {available ? "Aktif" : "Segera hadir"}
    </span>
  )
}

/** Tautan Play Store hanya aktif bila listing resmi sudah diverifikasi (lihat GORUT_PLAY_STORE_URL). */
function GooglePlayAction() {
  const base = "inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full border px-6 text-[14.5px] font-semibold"
  const icon = <Play className="h-4 w-4 fill-current" aria-hidden="true" />

  if (GORUT_PLAY_STORE_URL) {
    return (
      <a
        href={GORUT_PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, "border-white/20 bg-[#08213b]/60 text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9f26d]")}
      >
        {icon}
        Unduh di Google Play
      </a>
    )
  }

  return (
    <button type="button" disabled aria-describedby="gorut-play-note" className={cn(base, "cursor-not-allowed border-white/15 bg-[#0d2a40] text-white/60 shadow-[0_10px_24px_-14px_rgba(0,0,0,.6)]")}>
      {icon}
      Segera di Google Play
    </button>
  )
}

function GorutFeature({ app }: { app: LandingApp }) {
  const { user } = useAuth()
  const route = resolveLandingGorutRoute(user?.role)

  return (
    <LandingReveal distance={36} duration={0.8} className="h-full">
      <article className="relative isolate flex h-full min-h-[460px] flex-col overflow-hidden rounded-[32px] bg-[#08213b] p-7 text-white sm:p-10">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_100%_100%,rgba(16,128,112,.45),transparent_70%),radial-gradient(40%_40%_at_0%_0%,rgba(201,242,109,.10),transparent_70%)]" />

        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-10 hidden w-[230px] rotate-[-9deg] sm:block lg:w-[250px]">
          <div className="rounded-[15%/7%] bg-[linear-gradient(150deg,#3a4652,#0b1017_40%,#1d2731)] p-[3.2%] shadow-[0_40px_70px_-30px_rgba(0,0,0,.8)] ring-1 ring-white/15">
            <div className="relative aspect-[600/1299] overflow-hidden rounded-[12.6%/5.8%]">
              <Image src="/images/landing/gorut-android-welcome.webp" alt="" fill sizes="250px" className="object-cover object-top" />
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 sm:max-w-[62%]">
          <Image src={app.icon} alt="" width={72} height={72} className="h-[68px] w-[68px] object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,.35)]" />
          <StatusPill available={app.available} tone="dark" />
        </div>

        <div className="mt-7 sm:max-w-[60%]">
          <h3 className="text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-none tracking-[-0.04em]">{app.name}</h3>
          <p className="mt-2 text-[14px] font-semibold text-[#c9f26d]">Gerakan Koin Infak Nahdlatul Ulama Garut</p>
          <p className="mt-5 text-[15.5px] leading-[1.7] text-white/75">{app.description}</p>
          <ul className="mt-6 grid gap-2.5">
            {gorutCapabilities.map((capability) => (
              <li key={capability} className="flex items-center gap-3 text-[14.5px] text-white/85">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[#c9f26d]">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {capability}
              </li>
            ))}
          </ul>
        </div>

        {app.available && (
          <div className="relative mt-auto flex flex-col gap-3 pt-9 sm:flex-row sm:items-center">
            <Link
              href={route}
              className="group inline-flex h-[52px] items-center justify-between gap-4 rounded-full bg-[#c9f26d] pl-6 pr-1.5 text-[15px] font-bold text-[#061423] transition hover:bg-[#d7f88d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#08213b] sm:justify-start"
            >
              Buka GORUT
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#061423] text-[#c9f26d] transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </Link>
            <GooglePlayAction />
          </div>
        )}
        {app.available && (
          <p id="gorut-play-note" className="relative mt-3 text-[12.5px] text-white/55 sm:max-w-[60%]">
            {GORUT_PLAY_STORE_URL ? "Aplikasi Android GORUT untuk Munfiq dan petugas lapangan." : "Aplikasi Android GORUT belum terbit di Google Play."}
          </p>
        )}
      </article>
    </LandingReveal>
  )
}

function OtherApps({ apps }: { apps: LandingApp[] }) {
  const reduced = useReducedMotion()
  const reveal = perCardReveal(!!reduced, 1)
  const upcoming = apps.some((app) => !app.available)

  return (
    <div className="flex h-full flex-col rounded-[32px] border border-[#dce8e2] bg-[#f6faf8] p-2">
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <h3 className="text-[17px] font-bold tracking-[-0.02em] text-[#08213b]">{upcoming ? "Segera hadir di PIINDUNG" : "Aplikasi lainnya"}</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-[#5b6878]">Dibuka dengan akun yang sama begitu siap digunakan.</p>
      </div>
      <ul className="grid flex-1 gap-2">
        {apps.map((app, index) => (
          <motion.li
            key={app.id}
            custom={index}
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            className="relative flex gap-4 rounded-[24px] bg-white p-5 shadow-[0_10px_28px_-18px_rgba(9,43,32,.18)] ring-1 ring-[#e3ece8] sm:p-6"
          >
            <Image src={app.icon} alt="" width={56} height={56} className={cn("h-14 w-14 shrink-0 object-contain", !app.available && "opacity-80 grayscale-[.25]")} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                <h4 className="text-[18px] font-bold tracking-[-0.025em] text-[#08213b]">{app.name}</h4>
                <StatusPill available={app.available} />
              </div>
              <p className="mt-0.5 text-[12.5px] font-semibold text-[#06784b]">{app.category}</p>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#5b6878]">{app.description}</p>
              {app.available && app.href && (
                <Link href={app.href} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#06784b] after:absolute after:inset-0 after:rounded-[24px] hover:text-[#08213b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]">
                  Buka {app.name}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

export function HomeCatalog({ apps }: { apps: LandingApp[] }) {
  const gorut = apps.find((app) => app.id === "gorut")
  const others = apps.filter((app) => app.id !== "gorut")

  return (
    <section id="aplikasi" aria-labelledby="home-catalog-heading" className="scroll-mt-20 bg-white pb-24 pt-20 sm:pb-32 sm:pt-28">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)] lg:items-end lg:gap-12">
          <LandingReveal distance={24}>
            <h2 id="home-catalog-heading" className="max-w-[15ch] text-[clamp(2.1rem,4.4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#08213b]">
              Aplikasi dalam satu ekosistem.
            </h2>
          </LandingReveal>
          <LandingReveal distance={24} delay={0.1}>
            <p className="max-w-[31rem] text-[16px] leading-[1.75] text-[#5b6878] lg:justify-self-end">
              Mulai dari GORUT untuk gerakan koin infak NU. Aplikasi berikutnya menyusul dan dapat dibuka dengan akun PIINDUNG yang sama.
            </p>
          </LandingReveal>
        </div>

        <div className={cn("mt-12 grid gap-5 sm:mt-14", gorut && others.length > 0 && "lg:grid-cols-[minmax(0,1.12fr)_minmax(0,.88fr)]")}>
          {gorut && <GorutFeature app={gorut} />}
          {others.length > 0 && <OtherApps apps={others} />}
        </div>
      </div>
    </section>
  )
}
