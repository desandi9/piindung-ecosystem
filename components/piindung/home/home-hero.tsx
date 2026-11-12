"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowDown, ArrowRight, KeyRound, Network, UserRoundCheck } from "lucide-react"
import { calmEase, perCardReveal } from "@/components/piindung/landing-motion"
import type { LandingApp } from "./home-apps"
import { usePortalEntry } from "./home-navbar"
import { HeroPhones } from "./home-phones"

const roles = ["PC", "UPZIS", "Kordes", "PLPK", "Munfiq"]

const highlights = [
  {
    icon: KeyRound,
    title: "Satu akun",
    text: "Cukup nomor HP dan kata sandi yang sama untuk membuka aplikasi PIINDUNG.",
  },
  {
    icon: UserRoundCheck,
    title: "Akses sesuai peran",
    text: "Menu dan aplikasi yang tampil menyesuaikan peran serta wilayah tugas Anda.",
  },
  {
    icon: Network,
    title: "Layanan terhubung",
    text: "Aplikasi NU Care–LAZISNU Garut berada dalam satu ekosistem, tanpa berganti akun.",
  },
]

const quickSteps = ["Masuk", "Pilih aplikasi", "Mulai bekerja"]

export function HomeHero({ apps }: { apps: LandingApp[] }) {
  const reduced = useReducedMotion()
  const entry = usePortalEntry()
  const rise = (delay: number) =>
    reduced
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 28, filter: "blur(8px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.9, delay, ease: calmEase },
        }

  return (
    <section id="beranda" aria-labelledby="home-hero-heading" className="relative isolate overflow-hidden bg-[#061423] text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#061423_0%,#07192b_40%,#0a2c3a_72%,#123f47_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(52%_48%_at_76%_40%,rgba(16,128,112,.34),transparent_72%),radial-gradient(36%_40%_at_6%_92%,rgba(7,150,93,.16),transparent_70%)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:76px_76px] [mask-image:radial-gradient(70%_60%_at_60%_35%,black,transparent_78%)]" />

      <div className="mx-auto grid max-w-[1240px] items-center gap-20 px-5 pb-40 pt-[124px] sm:px-8 sm:pb-44 sm:gap-14 sm:pt-[150px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 lg:pb-52 lg:pt-[164px]">
        <div className="max-w-[620px]">
          <motion.h1
            id="home-hero-heading"
            {...rise(0.1)}
            className="text-[clamp(2.2rem,9.4vw,4rem)] font-extrabold leading-[1.03] tracking-[-0.04em] lg:text-[clamp(3.25rem,5.6vw,5rem)]"
          >
            <span className="block">Satu Akses.</span>
            <span className="block text-[#c9f26d]">
              Banyak <span className="lg:block">Kemudahan.</span>
            </span>
          </motion.h1>

          <motion.p {...rise(0.22)} className="mt-6 max-w-[33rem] text-[16px] leading-[1.75] text-white/75 sm:mt-7 sm:text-[17.5px]">
            PIINDUNG adalah pintu masuk layanan digital NU Care–LAZISNU Garut. Cukup satu akun untuk membuka aplikasi yang sesuai dengan peran Anda.
          </motion.p>

          <motion.div {...rise(0.34)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={entry.href}
              className="group inline-flex h-[56px] items-center justify-between gap-4 rounded-full bg-[#c9f26d] pl-7 pr-2 text-[15.5px] font-bold text-[#061423] shadow-[0_18px_36px_-14px_rgba(201,242,109,.55)] transition hover:bg-[#d7f88d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#061423] sm:justify-start"
            >
              {entry.label}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#061423] text-[#c9f26d] transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </Link>
            <a
              href="#aplikasi"
              className="group inline-flex h-[56px] items-center justify-center gap-2.5 rounded-full border border-white/20 px-7 text-[15.5px] font-semibold text-white transition hover:border-white/40 hover:bg-white/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9f26d]"
            >
              Lihat aplikasi
              <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
          </motion.div>

          <motion.div {...rise(0.46)} className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-6 sm:mt-11 sm:flex-row sm:items-center sm:gap-5">
            <p className="shrink-0 text-[13px] font-medium text-white/55">Satu akun untuk</p>
            <ul className="flex flex-wrap gap-2" aria-label="Peran pengguna PIINDUNG">
              {roles.map((role) => (
                <li key={role} className="rounded-full border border-white/12 bg-white/[.04] px-3.5 py-1.5 text-[13px] font-semibold text-white/85">
                  {role}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <HeroPhones apps={apps} />
      </div>

      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[150px] bg-[linear-gradient(180deg,transparent,#ffffff)] sm:h-[170px]" />
    </section>
  )
}

export function HomeHighlights() {
  const reduced = useReducedMotion()
  const reveal = perCardReveal(!!reduced, 3)

  return (
    <section aria-labelledby="home-highlights-heading" className="relative z-10 -mt-32 px-5 pb-4 sm:-mt-36 sm:px-8 lg:-mt-40">
      <h2 id="home-highlights-heading" className="sr-only">Keunggulan PIINDUNG</h2>
      <div className="mx-auto grid max-w-[1240px] gap-4 lg:grid-cols-[296px_minmax(0,1fr)]">
        <motion.a
          href="#cara-kerja"
          custom={0}
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-[#c9f26d] p-7 text-[#061423] shadow-[0_28px_50px_-26px_rgba(4,20,30,.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#061423] focus-visible:ring-offset-4"
        >
          <div>
            <p className="text-[20px] font-extrabold leading-tight tracking-[-0.03em]">Baru pertama kali?</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#061423]/75">Lihat cara kerjanya dalam tiga langkah singkat.</p>
          </div>
          <ol className="mt-8 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[12px] font-bold sm:gap-x-2" aria-label="Ringkasan langkah">
            {quickSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-1.5 sm:gap-2">
                <span className="whitespace-nowrap rounded-full bg-[#061423]/10 px-2.5 py-1">{step}</span>
                {index < quickSteps.length - 1 && <span aria-hidden="true" className="h-px w-2.5 bg-[#061423]/40 sm:w-3" />}
              </li>
            ))}
          </ol>
          <span className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-[#061423] text-[#c9f26d] transition-transform duration-300 group-hover:translate-y-0.5">
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </span>
        </motion.a>

        <div className="rounded-[28px] border border-white/10 bg-[#0b2531] p-2 text-white shadow-[0_34px_60px_-30px_rgba(4,20,30,.75)]">
          <ul className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {highlights.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.li
                  key={item.title}
                  custom={index}
                  variants={reveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 p-5 sm:p-6 md:block lg:p-8"
                >
                  <span className="row-span-2 grid h-12 w-12 place-items-center rounded-full bg-[#c9f26d]/12 text-[#c9f26d] ring-1 ring-[#c9f26d]/25">
                    <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                  </span>
                  <h3 className="self-center text-[18px] font-bold tracking-[-0.025em] md:mt-5 md:text-[19px]">{item.title}</h3>
                  <p className="mt-1 text-[14.5px] md:mt-2 leading-[1.65] text-white/68">{item.text}</p>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
