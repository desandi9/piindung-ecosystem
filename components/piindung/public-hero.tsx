"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BarChart3, Bell, Check, FileText, Gauge, LogIn, Send, Users, Wallet } from "lucide-react"
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react"
import { useEffect, useState } from "react"
import { useCanHoverFine } from "@/components/piindung/landing-motion"

const chart = [42, 58, 51, 70, 62, 82]
const marqueeItems = ["PENGHIMPUNAN", "PENGELOLAAN", "PENYALURAN", "PELAPORAN", "TRANSPARANSI", "PELAYANAN UMAT"]
const menuItems = [
  { label: "Dashboard", icon: Gauge, active: true },
  { label: "Munfiq", icon: Users },
  { label: "Penghimpunan", icon: Wallet },
  { label: "Penyaluran", icon: Send },
  { label: "Pelaporan", icon: FileText },
  { label: "Pengguna", icon: Users },
]
const stats = [
  { label: "Total Munfiq", value: "3.482", note: "+8,4%", icon: Users },
  { label: "Penghimpunan Bulan Ini", value: "Data demo", note: "Tertib", icon: Wallet },
  { label: "Penyaluran", value: "Terverifikasi", note: "Aman", icon: Send },
  { label: "UPZIS Aktif", value: "Terhubung", note: "Online", icon: BarChart3 },
]
const activities = [
  { title: "Setoran koin masuk", unit: "UPZIS Tarogong", value: "Tervalidasi", time: "2 menit" },
  { title: "Data munfiq diperbarui", unit: "PLPK Cilawu", value: "Sinkron", time: "8 menit" },
  { title: "Penyaluran dicatat", unit: "Program sosial", value: "Selesai", time: "18 menit" },
]

function MagneticCta({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  const reduced = useReducedMotion()
  const canHover = useCanHoverFine()
  const active = canHover && !reduced
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 })

  return (
    <motion.div
      className="inline-block"
      style={{ x: active ? springX : 0, y: active ? springY : 0 }}
      onPointerMove={(event) => {
        if (!active) return
        const rect = event.currentTarget.getBoundingClientRect()
        x.set((event.clientX - rect.left - rect.width / 2) * 0.3)
        y.set((event.clientY - rect.top - rect.height / 2) * 0.3)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  )
}

export function HeroSection() {
  const reduced = useReducedMotion()
  const [canTilt, setCanTilt] = useState(false)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { stiffness: 130, damping: 24, mass: 0.5 })
  const springY = useSpring(pointerY, { stiffness: 130, damping: 24, mass: 0.5 })
  // Base tilt ≈ rotateX(2) rotateY(-5) rotateZ(1); cursor adds ≤±2°
  const rotateY = useTransform(springX, [-0.5, 0.5], [-7, -3])
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, 0])
  const rotateZ = useTransform(springX, [-0.5, 0.5], [0.5, 1.5])
  const glowX = useTransform(springX, [-0.5, 0.5], [34, 66])
  const glowY = useTransform(springY, [-0.5, 0.5], [30, 58])
  const floatTopX = useTransform(springX, [-0.5, 0.5], [-3, 5])
  const floatTopY = useTransform(springY, [-0.5, 0.5], [-2, 4])
  const floatBottomX = useTransform(springX, [-0.5, 0.5], [4, -4])
  const floatBottomY = useTransform(springY, [-0.5, 0.5], [4, -4])
  const glowBackground = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(24,185,122,.12), transparent 34%)`)

  useEffect(() => {
    if (reduced) {
      setCanTilt(false)
      return
    }
    const media = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setCanTilt(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [reduced])

  return (
    <>
      <section id="beranda" className="relative isolate overflow-hidden bg-[#f8fbf9] pt-[72px] text-[#08213b] dark:bg-[#07131f] dark:text-white lg:pt-[78px]" aria-labelledby="hero-heading">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-30 overflow-hidden">
          <Image
            src="/images/hero-pattern-piindung.png"
            alt=""
            fill
            priority
            className="hero-pattern-drift object-cover object-[center_top]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(8,33,59,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(8,33,59,.035)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-20" />
        <div className="hero-gradient-blob hero-gradient-blob-one" aria-hidden="true" />
        <div className="hero-gradient-blob hero-gradient-blob-two" aria-hidden="true" />
        <div className="hero-gradient-blob hero-gradient-blob-three" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-10 pt-10 sm:px-8 md:gap-12 lg:min-h-[680px] lg:grid-cols-[46%_54%] lg:gap-12 lg:px-16 lg:pb-12 lg:pt-8 xl:px-20">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[600px] text-center lg:mx-0 lg:text-left"
          >
            <div className="inline-flex items-center text-[11px] font-bold uppercase tracking-[.20em] text-[#078f61]">
              Ekosistem Digital LAZISNU Garut
            </div>

            <h1
              id="hero-heading"
              className="mt-11 max-w-[600px] text-[clamp(2.625rem,5vw,4.875rem)] font-bold leading-[1.02] tracking-[-.06em] sm:text-[clamp(2.75rem,5vw,4.25rem)] lg:mt-12 lg:text-[clamp(3.5rem,5vw,4.875rem)] xl:text-[clamp(3.5rem,5vw,4.875rem)]"
            >
              <span className="block">Satu Ekosistem</span>
              <span className="block">untuk Pelayanan</span>
              <span className="block">
                yang{" "}
                <span className="bg-gradient-to-r from-[#049961] via-[#13b97a] to-[#55ce91] bg-clip-text text-transparent">
                  Lebih Unggul.
                </span>
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-[620px] text-[15px] leading-[1.8] text-[#687789] dark:text-slate-300 sm:text-[16px] lg:mx-0">
              PIINDUNG menyatukan data, proses, dan layanan NU Care–LAZISNU Garut agar kerja pengurus lebih tertib, cepat, dan mudah dipantau.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <MagneticCta
                href="/produk"
                className="group inline-flex h-[50px] items-center justify-center gap-3 rounded-[14px] bg-[#08a969] px-6 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(8,169,105,.22)] transition hover:-translate-y-0.5 hover:bg-[#079c61] hover:shadow-[0_18px_36px_rgba(8,169,105,.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08a969] focus-visible:ring-offset-4"
              >
                Jelajahi PIINDUNG <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </MagneticCta>
              <MagneticCta
                href="/login"
                className="group inline-flex h-[50px] items-center justify-center gap-3 rounded-[14px] border border-[#d9e5df] bg-white/80 px-6 text-[13px] font-semibold text-[#08213b] shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08a969] focus-visible:ring-offset-4 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                Masuk ke Sistem
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e5f7ef] text-[#08a969] transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-400/10">
                  <LogIn className="h-3 w-3" />
                </span>
              </MagneticCta>
            </div>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: reduced ? 0 : 0.85, delay: reduced ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto hidden w-full max-w-[720px] md:block lg:mx-0"
            onPointerMove={(event) => {
              if (!canTilt) return
              const rect = event.currentTarget.getBoundingClientRect()
              pointerX.set((event.clientX - rect.left) / rect.width - 0.5)
              pointerY.set((event.clientY - rect.top) / rect.height - 0.5)
            }}
            onPointerLeave={() => {
              pointerX.set(0)
              pointerY.set(0)
            }}
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[min(100%,420px)] w-[min(100%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#9fd7c4]/30 lg:block" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[min(78%,300px)] w-[min(78%,300px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#9fd7c4]/40 lg:block" />

            <div className="relative mx-auto w-full max-w-[min(100%,700px)]">
              <div className="dashboard-float-wrapper">
                <motion.div
                  className="dashboard-tilt-wrapper relative w-full overflow-hidden rounded-[22px] border border-[rgba(15,35,25,.11)] bg-[#fbfdfb] shadow-[0_24px_60px_rgba(7,44,31,.16)] [transform-style:preserve-3d] dark:border-white/10 dark:bg-[#0e2030]"
                  style={{
                    rotateX: canTilt ? rotateX : 1.5,
                    rotateY: canTilt ? rotateY : -4,
                    rotate: canTilt ? rotateZ : 0.8,
                    transformPerspective: 1400,
                  }}
                >
                <motion.div className="pointer-events-none absolute inset-0" style={{ background: glowBackground }} />
                <div className="grid aspect-[16/10] max-h-[520px] grid-cols-[22%_minmax(0,1fr)]">
                  <aside className="flex min-w-0 flex-col border-r border-[rgba(15,35,25,.08)] bg-[#f0f8f3] p-3 sm:p-3.5 dark:border-white/10 dark:bg-white/[.035]">
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1.5 shadow-[0_4px_12px_rgba(7,44,31,.04)] dark:bg-white/[.06]">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#07965d] text-[7px] font-bold text-white">PI</span>
                      <span className="min-w-0">
                        <strong className="block truncate text-[9px] leading-none text-[#08213b] dark:text-white">PIINDUNG</strong>
                        <small className="text-[5.5px] font-bold uppercase tracking-[.12em] text-[#6f7f73] dark:text-slate-400">LAZISNU Garut</small>
                      </span>
                    </div>
                    <nav className="mt-3 space-y-1" aria-label="Menu mockup dashboard">
                      {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <span
                            key={item.label}
                            className={
                              item.active
                                ? "flex items-center gap-1.5 rounded-lg bg-[#07965d] px-2 py-1.5 text-white shadow-[0_6px_14px_rgba(7,150,93,.14)]"
                                : "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[#64748b] dark:text-slate-300"
                            }
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                            <span className="truncate text-[7.5px] font-semibold">{item.label}</span>
                          </span>
                        )
                      })}
                    </nav>
                    <div className="mt-auto rounded-xl border border-[rgba(15,35,25,.08)] bg-white/80 p-2 dark:border-white/10 dark:bg-white/[.04]">
                      <small className="block text-[6px] text-[#87948c] dark:text-slate-400">Operator</small>
                      <strong className="mt-0.5 block truncate text-[8px] text-[#08213b] dark:text-white">Admin PIINDUNG</strong>
                      <span className="mt-1.5 inline-flex rounded-full bg-[#e6f7ef] px-1.5 py-0.5 text-[6px] font-bold text-[#07965d] dark:bg-emerald-400/10">Online</span>
                    </div>
                  </aside>

                  <div className="min-w-0 p-3 sm:p-4">
                    <header className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[7.5px] text-[#87948c] dark:text-slate-400">Minggu, 26 Juli 2026</p>
                        <h3 className="mt-0.5 truncate text-[13px] font-bold leading-tight tracking-[-.03em] text-[#08213b] dark:text-white sm:text-[15px]">
                          Selamat datang di PIINDUNG
                        </h3>
                        <p className="mt-0.5 max-w-[240px] text-[7.5px] leading-3.5 text-[#718074] dark:text-slate-300">
                          Pantau aktivitas penghimpunan dan penyaluran secara terpusat.
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button type="button" className="rounded-lg bg-[#07965d] px-2.5 py-1.5 text-[7px] font-bold text-white">
                          Lihat Laporan
                        </button>
                        <span className="grid h-7 w-7 place-items-center rounded-lg border border-[rgba(15,35,25,.08)] bg-white text-[#07965d] dark:border-white/10 dark:bg-white/[.05]">
                          <Bell className="h-3 w-3" />
                        </span>
                      </div>
                    </header>

                    <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
                      {stats.map((stat) => {
                        const Icon = stat.icon
                        return (
                          <div
                            key={stat.label}
                            className="rounded-[11px] border border-[rgba(15,35,25,.09)] bg-white p-2 shadow-[0_4px_12px_rgba(7,44,31,.03)] dark:border-white/10 dark:bg-white/[.035]"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="grid h-6 w-6 place-items-center rounded-md bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10">
                                <Icon className="h-3 w-3" />
                              </span>
                              <span className="text-[6px] font-bold text-[#07965d]">{stat.note}</span>
                            </div>
                            <small className="mt-2 block min-h-[16px] text-[6.5px] leading-[8px] text-[#839084] dark:text-slate-400">{stat.label}</small>
                            <strong className="mt-0.5 block truncate text-[9.5px] text-[#08213b] dark:text-white">{stat.value}</strong>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 grid grid-cols-[1.35fr_.85fr] gap-2">
                      <section
                        className="rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-2.5 shadow-[0_6px_14px_rgba(7,44,31,.035)] dark:border-white/10 dark:bg-white/[.035]"
                        aria-label="Grafik perkembangan"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-[8.5px] text-[#08213b] dark:text-white">Perkembangan ZIS</strong>
                          <span className="text-[6px] font-bold text-[#07965d]">6 bulan</span>
                        </div>
                        <div className="mt-3 flex h-[72px] items-end gap-2 px-1 sm:h-[80px]">
                          {chart.map((height, index) => (
                            <i key={index} style={{ height: `${height}%` }} className="flex-1 rounded-t-md bg-gradient-to-t from-[#07965d] to-[#70d9a6]" />
                          ))}
                        </div>
                        <div className="mt-2 flex justify-between text-[6px] text-[#9aa6af]">
                          <span>Jan</span>
                          <span>Feb</span>
                          <span>Mar</span>
                          <span>Apr</span>
                          <span>Mei</span>
                          <span>Jun</span>
                        </div>
                      </section>
                      <section
                        className="rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-2.5 shadow-[0_6px_14px_rgba(7,44,31,.035)] dark:border-white/10 dark:bg-white/[.035]"
                        aria-label="Aktivitas terbaru"
                      >
                        <strong className="text-[8.5px] text-[#08213b] dark:text-white">Aktivitas terbaru</strong>
                        <div className="mt-2 space-y-1.5">
                          {activities.map((activity) => (
                            <div key={activity.title} className="rounded-lg bg-[#f7faf8] p-1.5 dark:bg-white/[.04]">
                              <div className="flex items-center justify-between gap-1">
                                <strong className="truncate text-[7px] text-[#08213b] dark:text-white">{activity.title}</strong>
                                <span className="shrink-0 text-[6px] text-[#07965d]">{activity.time}</span>
                              </div>
                              <p className="mt-0.5 truncate text-[6px] text-[#7b8792] dark:text-slate-400">
                                {activity.unit} · {activity.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
                </motion.div>
              </div>

              <motion.div
                className="hero-float-badge hero-float-badge-top absolute -right-1 top-2 z-10 rounded-lg border border-white/90 bg-white/92 px-2.5 py-1.5 text-[7.5px] font-semibold text-[#21394e] shadow-md backdrop-blur dark:border-white/10 dark:bg-[#102536]/90 dark:text-white sm:right-1 sm:top-3 sm:px-3 sm:py-2 sm:text-[8px]"
                style={{ x: floatTopX, y: floatTopY }}
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#18c483] shadow-[0_0_0_4px_rgba(24,196,131,.12)]" />
                Sistem terhubung
              </motion.div>
              <motion.div
                className="hero-float-badge hero-float-badge-bottom absolute bottom-2 right-1 z-10 flex items-center gap-1.5 rounded-lg border border-white/90 bg-white/92 px-2.5 py-1.5 shadow-md backdrop-blur dark:border-white/10 dark:bg-[#102536]/90 sm:bottom-3 sm:right-2 sm:gap-2 sm:px-3 sm:py-2"
                style={{ x: floatBottomX, y: floatBottomY }}
              >
                <span className="grid h-5 w-5 place-items-center rounded-md bg-[#e5f7ef] text-[#08a969] sm:h-6 sm:w-6">
                  <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </span>
                <span className="text-[6.5px] text-[#8b98a4] sm:text-[7px]">
                  Data hari ini
                  <strong className="block text-[7.5px] text-[#21394e] dark:text-white sm:text-[8px]">Sudah diperbarui</strong>
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <div
        className="relative h-[56px] overflow-hidden border-y border-[#d9e5df] bg-white/70 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] dark:border-white/10 dark:bg-white/[.03]"
        aria-label="Nilai utama PIINDUNG"
      >
        <div className="flex h-full w-max items-center animate-[marquee_34s_linear_infinite] gap-8 px-8 text-[10px] font-bold uppercase tracking-[.18em] text-[#07965d] hover:[animation-play-state:paused] motion-reduce:animate-none">
          {Array.from({ length: 4 }).flatMap((_, group) =>
            marqueeItems.map((item) => (
              <span key={`${group}-${item}`} className="flex items-center gap-8">
                <span>{item}</span>
                <i className="h-1.5 w-1.5 rounded-full bg-[#13b97a]" />
              </span>
            )),
          )}
        </div>
      </div>
    </>
  )
}
