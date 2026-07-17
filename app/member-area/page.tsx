"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { Box, FileText, MapPin, MonitorCheck, Settings, ShieldCheck, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"

const controlCards = [
  {
    title: "Pengguna & Akses",
    description: "Kelola akun, role, status pengguna, dan kewenangan sistem.",
    icon: Users,
  },
  {
    title: "Organisasi & Wilayah",
    description: "Atur struktur organisasi, wilayah kerja, serta penanggung jawab.",
    icon: MapPin,
  },
  {
    title: "Produk & Modul",
    description: "Kelola produk PIINDUNG, status modul, dan akses sistem.",
    icon: Box,
  },
  {
    title: "Konten Publik",
    description: "Kelola beranda, produk, dampak, artikel, bantuan, dan informasi publik.",
    icon: FileText,
  },
  {
    title: "Monitoring & Audit",
    description: "Pantau aktivitas penting, perubahan data, dan kondisi sistem.",
    icon: MonitorCheck,
  },
  {
    title: "Pengaturan Sistem",
    description: "Atur preferensi umum, notifikasi, integrasi, dan konfigurasi sistem.",
    icon: Settings,
  },
]

const ecosystemStatus = [
  { label: "Autentikasi", status: "Terhubung", tone: "green" },
  { label: "Landing Page", status: "Aktif", tone: "green" },
  { label: "Member Area", status: "Dalam Pengembangan", tone: "amber" },
  { label: "Modul Operasional", status: "Terintegrasi Bertahap", tone: "blue" },
]

export default function MemberAreaPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [ready, setReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem
  const displayName = user?.name || "Pengguna"

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login?next=/member-area")
      } else if (user.role !== "super_admin_pc") {
        router.replace("/dashboard")
      } else {
        setReady(true)
      }
    }
  }, [user, isLoading, router])

  if (!ready || !user) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <MemberLayout>
      <div className="space-y-8 overflow-x-hidden">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">MEMBER AREA</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">Selamat datang, {displayName}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">Kelola pengguna, akses, konten publik, modul, dan konfigurasi PIINDUNG melalui satu pusat kendali.</p>
        </motion.section>

        <motion.section variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {controlCards.map(({ title, description, icon: Icon }) => (
            <motion.article key={title} variants={itemReveal} className="flex h-full min-h-[190px] flex-col rounded-[22px] border border-border bg-card p-5 shadow-sm transition-colors hover:border-[#15945b]/40 hover:bg-accent/40 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Segera Tersedia</span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
            </motion.article>
          ))}
        </motion.section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="rounded-[24px] border border-border bg-card p-6 shadow-sm" aria-labelledby="ecosystem-status-heading">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="ecosystem-status-heading" className="text-xl font-bold text-foreground">Status Ekosistem</h2>
                <p className="text-sm text-muted-foreground">Ringkasan kualitatif kesiapan layanan PIINDUNG.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {ecosystemStatus.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", item.tone === "green" && "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400", item.tone === "amber" && "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", item.tone === "blue" && "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300")}>{item.status}</span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} className="rounded-[24px] border border-border bg-card p-6 shadow-sm" aria-labelledby="recent-activity-heading">
            <h2 id="recent-activity-heading" className="text-xl font-bold text-foreground">Aktivitas Terbaru</h2>
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/50 p-6 text-sm leading-7 text-muted-foreground">
              Aktivitas sistem akan ditampilkan setelah modul audit diaktifkan.
            </div>
          </motion.section>
        </div>
      </div>
    </MemberLayout>
  )
}
