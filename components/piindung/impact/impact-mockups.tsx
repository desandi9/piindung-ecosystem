"use client"

/**
 * Mockup presentasional untuk halaman /dampak.
 * Seluruh data di dalam komponen ini adalah ilustrasi antarmuka (bukan cuplikan dashboard
 * internal maupun data produksi) — dibuat aman untuk ditampilkan secara publik.
 */

import {
  Bell,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Gauge,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

function MockupFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[22px] border border-[#d9e5df] bg-[#fbfdfb] shadow-[0_20px_50px_rgba(7,44,31,.12)] dark:border-white/10 dark:bg-[#0e2030]",
        className,
      )}
    >
      {children}
    </div>
  )
}

function MockupHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-[rgba(15,35,25,.08)] px-4 py-3 dark:border-white/10 sm:px-5 sm:py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-[11px] font-bold leading-tight text-[#08213b] dark:text-white">{title}</strong>
          <small className="block truncate text-[9px] text-[#87948c] dark:text-slate-400">{subtitle}</small>
        </span>
      </div>
      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#e6f7ef] px-2 py-1 text-[8px] font-bold text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-[#18c483]" /> Sinkron
      </span>
    </header>
  )
}

function MiniTile({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-[12px] border border-[rgba(15,35,25,.09)] bg-white p-2.5 dark:border-white/10 dark:bg-white/[.035]">
      <div className="flex items-center justify-between gap-1">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300">
          <Icon className="h-3 w-3" />
        </span>
      </div>
      <small className="mt-2 block text-[8px] leading-tight text-[#839084] dark:text-slate-400">{label}</small>
      <strong className="mt-0.5 block truncate text-[11px] text-[#08213b] dark:text-white">{value}</strong>
    </div>
  )
}

function StatusChip({ tone, children }: { tone: "success" | "pending" | "info"; children: React.ReactNode }) {
  const tones = {
    success: "bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300",
    pending: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
    info: "bg-[#e6f4fb] text-[#0a7ea4] dark:bg-sky-400/10 dark:text-sky-300",
  } as const
  return <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[7.5px] font-bold", tones[tone])}>{children}</span>
}

/* ------------------------------------------------------------------------ */
/* Featured visual (hero) — ringkasan ekosistem                             */
/* ------------------------------------------------------------------------ */

const featuredChart = [38, 54, 46, 66, 58, 78, 70]
const featuredTiles = [
  { label: "Munfiq", value: "3.482+", icon: Users },
  { label: "Penghimpunan", value: "Tercatat", icon: Wallet },
  { label: "Penyaluran", value: "Terverifikasi", icon: Send },
  { label: "Pelaporan", value: "Tersusun", icon: FileText },
]
const featuredRegions = [
  { name: "Tarogong Kidul", status: "Aktif" },
  { name: "Cilawu", status: "Aktif" },
  { name: "Bayongbong", status: "Sinkron" },
]

export function FeaturedDashboardMockup() {
  return (
    <MockupFrame>
      <MockupHeader title="Ringkasan Ekosistem PIINDUNG" subtitle="Munfiq · Penghimpunan · Penyaluran · Pelaporan" icon={Gauge} />
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {featuredTiles.map((tile) => (
            <MiniTile key={tile.label} {...tile} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
            <div className="flex items-center justify-between">
              <strong className="text-[9px] font-bold text-[#08213b] dark:text-white">Tren Penghimpunan</strong>
              <span className="inline-flex items-center gap-1 text-[8px] font-bold text-[#07965d]">
                <TrendingUp className="h-2.5 w-2.5" /> 7 minggu
              </span>
            </div>
            <div className="mt-3 flex h-[70px] items-end gap-1.5 sm:h-[86px]">
              {featuredChart.map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} className="flex-1 rounded-t-md bg-gradient-to-t from-[#07965d] to-[#6ee7b7]" />
              ))}
            </div>
          </section>
          <section className="rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
            <strong className="text-[9px] font-bold text-[#08213b] dark:text-white">Status Wilayah</strong>
            <div className="mt-2 space-y-1.5">
              {featuredRegions.map((region) => (
                <div key={region.name} className="flex items-center justify-between gap-1 rounded-lg bg-[#f7faf8] px-2 py-1.5 dark:bg-white/[.04]">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <MapPin className="h-2.5 w-2.5 shrink-0 text-[#07965d]" />
                    <span className="truncate text-[8px] font-semibold text-[#08213b] dark:text-white">{region.name}</span>
                  </span>
                  <StatusChip tone="success">{region.status}</StatusChip>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </MockupFrame>
  )
}

export function FeaturedMobileMockup() {
  return (
    <div className="relative w-[150px] shrink-0 rounded-[26px] border-[6px] border-[#0b2239] bg-[#0b2239] shadow-[0_18px_38px_rgba(7,38,28,.22)] sm:w-[168px]">
      <div className="overflow-hidden rounded-[18px] bg-[#fbfdfb] dark:bg-[#0e2030]">
        <div className="flex items-center justify-between px-3 pt-3">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-[#07965d] text-[6px] font-bold text-white">PI</span>
          <Bell className="h-3 w-3 text-[#87948c]" />
        </div>
        <p className="px-3 pt-2 text-[7px] text-[#87948c] dark:text-slate-400">Ringkasan hari ini</p>
        <div className="mt-1.5 space-y-1.5 px-3 pb-3.5">
          {[
            { label: "Setoran baru", value: "6", tone: "success" as const },
            { label: "Menunggu validasi", value: "2", tone: "pending" as const },
            { label: "Munfiq baru", value: "14", tone: "info" as const },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-[rgba(15,35,25,.08)] bg-white p-2 dark:border-white/10 dark:bg-white/[.04]">
              <span className="text-[7px] text-[#6c7a89] dark:text-slate-300">{item.label}</span>
              <StatusChip tone={item.tone}>{item.value}</StatusChip>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Studi kasus #1 — Penghimpunan & Transaksi                                */
/* ------------------------------------------------------------------------ */

const transactionChart = [40, 62, 50, 74, 66, 84]
const recentTransactions = [
  { label: "Setoran UPZIS Tarogong", note: "Munfiq #00231", status: "Tervalidasi" },
  { label: "Setoran UPZIS Cilawu", note: "Munfiq #00458", status: "Tervalidasi" },
  { label: "Setoran UPZIS Bayongbong", note: "Munfiq #00512", status: "Diperiksa" },
]

export function TransactionMockup() {
  return (
    <MockupFrame className="min-h-[360px]">
      <MockupHeader title="Transaksi Penghimpunan" subtitle="Pencatatan setoran dari petugas lapangan" icon={Wallet} />
      <div className="p-4 sm:p-5">
        <section className="rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
          <div className="flex items-center justify-between">
            <strong className="text-[9px] font-bold text-[#08213b] dark:text-white">Grafik Penghimpunan</strong>
            <span className="text-[8px] font-bold text-[#07965d]">6 bulan</span>
          </div>
          <div className="mt-3 flex h-[76px] items-end gap-2">
            {transactionChart.map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} className="flex-1 rounded-t-md bg-gradient-to-t from-[#07965d] to-[#6ee7b7]" />
            ))}
          </div>
        </section>
        <section className="mt-3 rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
          <strong className="text-[9px] font-bold text-[#08213b] dark:text-white">Ringkasan Transaksi Terbaru</strong>
          <div className="mt-2 space-y-1.5">
            {recentTransactions.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7faf8] px-2.5 py-2 dark:bg-white/[.04]">
                <span className="min-w-0">
                  <strong className="block truncate text-[8.5px] text-[#08213b] dark:text-white">{item.label}</strong>
                  <small className="block text-[7.5px] text-[#87948c] dark:text-slate-400">{item.note}</small>
                </span>
                <StatusChip tone={item.status === "Tervalidasi" ? "success" : "pending"}>{item.status}</StatusChip>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MockupFrame>
  )
}

/* ------------------------------------------------------------------------ */
/* Studi kasus #2 — Pendataan Munfiq                                        */
/* ------------------------------------------------------------------------ */

const munfiqRows = [
  { name: "Munfiq #00231", area: "Tarogong Kidul", status: "Terverifikasi" },
  { name: "Munfiq #00458", area: "Cilawu", status: "Terverifikasi" },
  { name: "Munfiq #00512", area: "Bayongbong", status: "Menunggu" },
  { name: "Munfiq #00579", area: "Samarang", status: "Terverifikasi" },
]

export function MunfiqMockup() {
  return (
    <MockupFrame className="min-h-[360px]">
      <MockupHeader title="Data Munfiq" subtitle="Pendataan berdasarkan wilayah & status" icon={Users} />
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:p-5">
        <section className="min-w-0 flex-1 rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(15,35,25,.09)] px-2 py-1 text-[7.5px] text-[#6c7a89] dark:border-white/10 dark:text-slate-300">
              <Filter className="h-2.5 w-2.5" /> Kecamatan: Semua
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(15,35,25,.09)] px-2 py-1 text-[7.5px] text-[#6c7a89] dark:border-white/10 dark:text-slate-300">
              <Search className="h-2.5 w-2.5" /> Cari munfiq
            </span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {munfiqRows.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7faf8] px-2.5 py-2 dark:bg-white/[.04]">
                <span className="min-w-0">
                  <strong className="block truncate text-[8.5px] text-[#08213b] dark:text-white">{row.name}</strong>
                  <small className="flex items-center gap-1 text-[7.5px] text-[#87948c] dark:text-slate-400">
                    <MapPin className="h-2 w-2" /> {row.area}
                  </small>
                </span>
                <StatusChip tone={row.status === "Terverifikasi" ? "success" : "pending"}>{row.status}</StatusChip>
              </div>
            ))}
          </div>
        </section>
        <aside className="w-full shrink-0 rounded-[16px] border-[5px] border-[#0b2239] bg-[#0b2239] sm:w-[104px]">
          <div className="overflow-hidden rounded-[10px] bg-[#fbfdfb] p-2 dark:bg-[#0e2030]">
            <p className="text-[6.5px] font-bold text-[#08213b] dark:text-white">Petugas</p>
            <div className="mt-1.5 space-y-1">
              {munfiqRows.slice(0, 3).map((row) => (
                <div key={row.name} className="rounded-md bg-white p-1.5 dark:bg-white/[.06]">
                  <p className="truncate text-[6px] text-[#08213b] dark:text-white">{row.name}</p>
                  <p className="truncate text-[5.5px] text-[#87948c] dark:text-slate-400">{row.area}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </MockupFrame>
  )
}

/* ------------------------------------------------------------------------ */
/* Studi kasus #3 — Monitoring & Validasi                                   */
/* ------------------------------------------------------------------------ */

const validationSteps = [
  { title: "Pencatatan", icon: FileText, state: "done" as const },
  { title: "Menunggu Validasi", icon: Clock, state: "current" as const },
  { title: "Pemeriksaan", icon: ShieldCheck, state: "upcoming" as const },
  { title: "Tervalidasi", icon: CheckCircle2, state: "upcoming" as const },
]
const validationList = [
  { label: "Setoran UPZIS Tarogong", status: "Tervalidasi" },
  { label: "Setoran UPZIS Cilawu", status: "Diperiksa" },
  { label: "Setoran UPZIS Samarang", status: "Menunggu" },
]

export function ValidationMockup() {
  return (
    <MockupFrame className="min-h-[360px]">
      <MockupHeader title="Monitoring Validasi Setoran" subtitle="Alur pencatatan hingga pemeriksaan" icon={ShieldCheck} />
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-4 gap-1.5">
          {validationSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative flex flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border",
                    step.state === "upcoming"
                      ? "border-[rgba(15,35,25,.12)] bg-white text-[#9aa6af] dark:border-white/10 dark:bg-white/[.04] dark:text-slate-500"
                      : "border-transparent bg-[#07965d] text-white shadow-[0_6px_14px_rgba(7,150,93,.24)]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[6.5px] font-semibold leading-tight text-[#6c7a89] dark:text-slate-300">{step.title}</span>
                {index < validationSteps.length - 1 && (
                  <span className="absolute left-[calc(50%+18px)] top-4 h-px w-[calc(100%-24px)] bg-[rgba(15,35,25,.12)] dark:bg-white/10" />
                )}
              </div>
            )
          })}
        </div>
        <section className="mt-4 rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
          <strong className="text-[9px] font-bold text-[#08213b] dark:text-white">Daftar Validasi</strong>
          <div className="mt-2 space-y-1.5">
            {validationList.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7faf8] px-2.5 py-2 dark:bg-white/[.04]">
                <span className="truncate text-[8.5px] text-[#08213b] dark:text-white">{item.label}</span>
                <StatusChip tone={item.status === "Tervalidasi" ? "success" : item.status === "Diperiksa" ? "info" : "pending"}>{item.status}</StatusChip>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MockupFrame>
  )
}

/* ------------------------------------------------------------------------ */
/* Studi kasus #4 — Pelaporan                                               */
/* ------------------------------------------------------------------------ */

const reportChart = [30, 48, 40, 62, 54, 70, 64, 80]
const reportRegions = [
  { name: "Tarogong Kidul", value: 82 },
  { name: "Cilawu", value: 68 },
  { name: "Bayongbong", value: 74 },
]

export function ReportMockup() {
  return (
    <MockupFrame className="min-h-[360px]">
      <MockupHeader title="Laporan Penghimpunan & Penyaluran" subtitle="Rekap periode berjalan" icon={FileText} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(15,35,25,.09)] px-2 py-1 text-[7.5px] text-[#6c7a89] dark:border-white/10 dark:text-slate-300">
            Periode: 12 bulan terakhir
          </span>
          <span
            aria-hidden="true"
            className="inline-flex select-none items-center gap-1 rounded-lg bg-[#e6f7ef] px-2 py-1 text-[7.5px] font-bold text-[#07965d] opacity-80 dark:bg-emerald-400/10 dark:text-emerald-300"
          >
            <Download className="h-2.5 w-2.5" /> Ekspor · Segera Hadir
          </span>
        </div>
        <section className="mt-2.5 rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
          <strong className="text-[9px] font-bold text-[#08213b] dark:text-white">Tren Bulanan</strong>
          <div className="mt-3 flex h-[64px] items-end gap-1.5">
            {reportChart.map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} className="flex-1 rounded-t-md bg-gradient-to-t from-[#07965d] to-[#5eead4]" />
            ))}
          </div>
        </section>
        <section className="mt-3 rounded-[13px] border border-[rgba(15,35,25,.09)] bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
          <strong className="text-[9px] font-bold text-[#08213b] dark:text-white">Breakdown Wilayah</strong>
          <div className="mt-2 space-y-2">
            {reportRegions.map((region) => (
              <div key={region.name}>
                <div className="flex items-center justify-between text-[7.5px] text-[#6c7a89] dark:text-slate-300">
                  <span>{region.name}</span>
                  <span className="font-bold text-[#07965d]">{region.value}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#eef3f0] dark:bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#07965d] to-[#6ee7b7]" style={{ width: `${region.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MockupFrame>
  )
}

export const caseStudyVisuals = {
  transaksi: TransactionMockup,
  munfiq: MunfiqMockup,
  validasi: ValidationMockup,
  laporan: ReportMockup,
} as const
