"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"
import { Bell, BatteryFull, Check, House, KeyRound, LayoutGrid, Signal, UserRound, Wifi } from "lucide-react"
import { calmEase } from "@/components/piindung/landing-motion"
import { cn } from "@/lib/utils"
import type { LandingApp } from "./home-apps"
import "./home.css"

function PhoneFrame({ children, className, camera = "island" }: { children: React.ReactNode; className?: string; camera?: "island" | "punch-hole" }) {
  return (
    <div className={cn("relative rounded-[15%/7%] bg-[linear-gradient(150deg,#3a4652_0%,#0b1017_38%,#1d2731_100%)] p-[3.2%] shadow-[0_60px_90px_-34px_rgba(0,0,0,.8),0_26px_44px_-26px_rgba(0,0,0,.65)] ring-1 ring-white/15", className)}>
      <span aria-hidden="true" className="absolute -left-[1.1%] top-[19%] h-[7%] w-[1.3%] rounded-l-full bg-[#2a343f]" />
      <span aria-hidden="true" className="absolute -left-[1.1%] top-[28%] h-[7%] w-[1.3%] rounded-l-full bg-[#2a343f]" />
      <span aria-hidden="true" className="absolute -right-[1.1%] top-[24%] h-[11%] w-[1.3%] rounded-r-full bg-[#2a343f]" />
      <div className="@container relative aspect-[600/1299] overflow-hidden rounded-[12.6%/5.8%] bg-white">
        {children}
        {camera === "island" ? (
          <span aria-hidden="true" className="absolute left-1/2 top-[1.7%] h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-[#05080b]" />
        ) : (
          <span aria-hidden="true" className="absolute left-[5.2%] top-[1.45%] aspect-square w-[4%] rounded-full bg-[#05080b] ring-1 ring-white/10" />
        )}
      </div>
    </div>
  )
}

/** Ilustrasi layar PIINDUNG: hanya katalog aplikasi, tanpa nama orang atau angka operasional. */
function PiindungLauncher({ apps }: { apps: LandingApp[] }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col bg-[linear-gradient(180deg,#eef6f2_0%,#ffffff_42%)] text-[#08213b]">
      <div className="flex items-center justify-between px-[8cqw] pt-[5.2cqw] text-[length:4.3cqw] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-[1.4cqw]">
          <Signal className="h-[3.8cqw] w-[3.8cqw]" />
          <Wifi className="h-[3.8cqw] w-[3.8cqw]" />
          <BatteryFull className="h-[4.6cqw] w-[4.6cqw]" />
        </span>
      </div>

      <div className="mt-[7cqw] flex items-center justify-between px-[7cqw]">
        <Image src="/images/landing/piindung-wordmark.webp" alt="" width={420} height={133} className="h-auto w-[40cqw]" />
        <span className="grid h-[9cqw] w-[9cqw] place-items-center rounded-full bg-[#08213b] text-white">
          <UserRound className="h-[4.6cqw] w-[4.6cqw]" />
        </span>
      </div>

      <div className="mx-[6cqw] mt-[6cqw] rounded-[6cqw] bg-[#08213b] p-[6cqw] text-white">
        <p className="text-[length:3.8cqw] text-white/65">Assalamu&apos;alaikum,</p>
        <p className="mt-[1cqw] text-[length:6.4cqw] font-bold leading-[1.15] tracking-[-0.03em]">Pilih aplikasi Anda</p>
        <span className="mt-[3.5cqw] inline-flex items-center gap-[1.4cqw] rounded-full bg-[#c9f26d] px-[3cqw] py-[1.2cqw] text-[length:3.2cqw] font-bold text-[#061423]">
          <Check className="h-[3.2cqw] w-[3.2cqw]" />
          Sesuai peran Anda
        </span>
      </div>

      <p className="mt-[6.5cqw] px-[7cqw] text-[length:4.2cqw] font-bold">Aplikasi</p>
      <div className="mt-[3cqw] grid grid-cols-2 gap-[3.5cqw] px-[6cqw]">
        {apps.map((app) => (
          <div
            key={app.id}
            className={cn(
              "rounded-[5cqw] border bg-white p-[3.8cqw] shadow-[0_1.6cqw_4cqw_rgba(8,33,59,.07)]",
              app.id === "gorut" ? "home-tap border-[#07965d]" : "border-[#e2ebe7]",
            )}
          >
            <Image src={app.icon} alt="" width={96} height={96} className={cn("h-[12cqw] w-[12cqw] object-contain", !app.available && "opacity-60 grayscale-[.35]")} />
            <p className="mt-[2.6cqw] truncate text-[length:4.2cqw] font-bold leading-tight">{app.name}</p>
            <p className={cn("mt-[1cqw] flex items-center gap-[1.3cqw] text-[length:3.1cqw] font-semibold", app.available ? "text-[#07965d]" : "text-[#7a8794]")}>
              <span className={cn("h-[1.7cqw] w-[1.7cqw] rounded-full", app.available ? "bg-[#07965d]" : "bg-[#b6c0c8]")} />
              {app.available ? "Aktif" : "Segera hadir"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-around border-t border-[#e6eeea] bg-white px-[6cqw] pb-[7cqw] pt-[3.5cqw] text-[#9aa6b1]">
        <House className="h-[5.4cqw] w-[5.4cqw] text-[#07965d]" />
        <LayoutGrid className="h-[5.4cqw] w-[5.4cqw]" />
        <Bell className="h-[5.4cqw] w-[5.4cqw]" />
        <UserRound className="h-[5.4cqw] w-[5.4cqw]" />
      </div>
      <span className="absolute bottom-[1.6cqw] left-1/2 h-[1.2cqw] w-[34cqw] -translate-x-1/2 rounded-full bg-[#08213b]/30" />
    </div>
  )
}

export function HeroPhones({ apps }: { apps: LandingApp[] }) {
  const reduced = useReducedMotion()
  const enter = (delay: number, from: { y: number; rotate: number }, to: { rotate: number }) =>
    reduced
      ? { initial: false as const, animate: { rotate: to.rotate } }
      : {
          initial: { opacity: 0, y: from.y, rotate: from.rotate, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, rotate: to.rotate, filter: "blur(0px)" },
          transition: { duration: 1.1, delay, ease: calmEase },
        }
  const pop = (delay: number) =>
    reduced
      ? { initial: false as const }
      : { initial: { opacity: 0, scale: 0.86, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 0.7, delay, ease: calmEase } }

  return (
    <figure className="relative mx-auto w-full max-w-[560px] lg:mr-0">
      <div className="relative aspect-[560/600] w-full">
        <div aria-hidden="true" className="absolute left-[52%] top-[48%] h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,242,109,.17)_0%,rgba(18,140,120,.12)_38%,transparent_68%)]" />
        <div aria-hidden="true" className="absolute left-[52%] top-[48%] h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.07]" />

        <motion.div {...enter(0.25, { y: 70, rotate: -15 }, { rotate: -8 })} className="absolute left-[2%] top-[15%] z-10 w-[41%]">
          <div className="home-float home-float-late">
            <PhoneFrame>
              <div role="img" aria-label="Ilustrasi layar PIINDUNG berisi daftar aplikasi dan statusnya" className="absolute inset-0">
                <PiindungLauncher apps={apps} />
              </div>
            </PhoneFrame>
          </div>
        </motion.div>

        <motion.div {...enter(0.55, { y: 110, rotate: 14 }, { rotate: 6 })} className="absolute left-[37%] top-[2%] z-20 w-[47%]">
          <div className="home-float">
            <PhoneFrame camera="punch-hole">
              <Image
                src="/images/landing/gorut-android-welcome.webp"
                alt="Layar sambutan aplikasi Android GORUT: Kebaikan jadi lebih dekat"
                fill
                priority
                sizes="(min-width: 1024px) 250px, 46vw"
                className="object-cover object-top"
              />
            </PhoneFrame>
          </div>
        </motion.div>

        <motion.div {...pop(1.25)} className="absolute -top-11 left-0 z-30 flex max-w-[58%] sm:top-[1%] items-center gap-2.5 rounded-2xl border border-white/15 bg-[#0d2a3a]/70 py-2 pl-2 pr-3.5 text-white shadow-[0_18px_36px_-16px_rgba(0,0,0,.6)] backdrop-blur-md sm:gap-3 sm:py-2.5 sm:pl-2.5 sm:pr-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c9f26d] text-[#061423] sm:h-8 sm:w-8">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-[11.5px] font-medium leading-snug sm:text-[13px]">Menu menyesuaikan peran Anda</span>
        </motion.div>

        <motion.div {...pop(1.45)} className="absolute bottom-[5%] right-0 z-30 flex items-center gap-3 rounded-[20px] bg-[#c9f26d] py-3 pl-3 pr-5 text-[#061423] shadow-[0_24px_44px_-18px_rgba(0,0,0,.65)] sm:gap-3.5 sm:py-4 sm:pl-4 sm:pr-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#061423] text-[#c9f26d] sm:h-11 sm:w-11">
            <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <strong className="block text-[15px] font-extrabold tracking-[-0.02em] sm:text-[19px]">Satu akun</strong>
            <span className="text-[11.5px] font-medium text-[#061423]/75 sm:text-[13px]">untuk semua aplikasi</span>
          </span>
        </motion.div>
      </div>
      <figcaption className="mt-4 text-center text-[11.5px] text-white/50 lg:text-right">
        Layar GORUT dari aplikasi Android terbaru. Layar PIINDUNG berupa ilustrasi tanpa data operasional.
      </figcaption>
    </figure>
  )
}
