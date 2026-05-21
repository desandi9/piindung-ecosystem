import { notFound } from "next/navigation"

const routeModules: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  activity: () => import("../../../MODUL GORUT TERBARU/app/gorut/activity/page"),
  akses: () => import("../../../MODUL GORUT TERBARU/app/gorut/akses/page"),
  "aktivitas-log": () => import("../../../MODUL GORUT TERBARU/app/gorut/aktivitas-log/page"),
  announcement: () => import("../../../MODUL GORUT TERBARU/app/gorut/announcement/page"),
  approval: () => import("../../../MODUL GORUT TERBARU/app/gorut/approval/page"),
  archive: () => import("../../../MODUL GORUT TERBARU/app/gorut/archive/page"),
  audit: () => import("../../../MODUL GORUT TERBARU/app/gorut/audit/page"),
  backup: () => import("../../../MODUL GORUT TERBARU/app/gorut/backup/page"),
  dashboard: () => import("../../../MODUL GORUT TERBARU/app/gorut/dashboard/page"),
  kecamatan: () => import("../../../MODUL GORUT TERBARU/app/gorut/kecamatan/page"),
  keuangan: () => import("../../../MODUL GORUT TERBARU/app/gorut/keuangan/page"),
  laporan: () => import("../../../MODUL GORUT TERBARU/app/gorut/laporan/page"),
  mobile: () => import("../../../MODUL GORUT TERBARU/app/gorut/mobile/page"),
  monitoring: () => import("../../../MODUL GORUT TERBARU/app/gorut/monitoring/page"),
  "monitoring-plpk": () => import("../../../MODUL GORUT TERBARU/app/gorut/monitoring-plpk/page"),
  munfiq: () => import("../../../MODUL GORUT TERBARU/app/gorut/munfiq/page"),
  notifikasi: () => import("../../../MODUL GORUT TERBARU/app/gorut/notifikasi/page"),
  performance: () => import("../../../MODUL GORUT TERBARU/app/gorut/performance/page"),
  profil: () => import("../../../MODUL GORUT TERBARU/app/gorut/profil/page"),
  "pengaturan-akun": () => import("../../../MODUL GORUT TERBARU/app/gorut/pengaturan-akun/page"),
  ranting: () => import("../../../MODUL GORUT TERBARU/app/gorut/ranting/page"),
  "ranting-plpk": () => import("../../../MODUL GORUT TERBARU/app/gorut/ranting-plpk/page"),
  "rekap-bulanan": () => import("../../../MODUL GORUT TERBARU/app/gorut/rekap-bulanan/page"),
  settings: () => import("../../../MODUL GORUT TERBARU/app/gorut/settings/page"),
  setoran: () => import("../../../MODUL GORUT TERBARU/app/gorut/setoran/page"),
  "setoran-koin": () => import("../../../MODUL GORUT TERBARU/app/gorut/setoran-koin/page"),
  statistik: () => import("../../../MODUL GORUT TERBARU/app/gorut/statistik/page"),
  transaksi: () => import("../../../MODUL GORUT TERBARU/app/gorut/transaksi/page"),
  upzis: () => import("../../../MODUL GORUT TERBARU/app/gorut/upzis/page"),
  validasi: () => import("../../../MODUL GORUT TERBARU/app/gorut/validasi/page"),
  "validasi-setoran": () => import("../../../MODUL GORUT TERBARU/app/gorut/validasi-setoran/page"),
  whatsapp: () => import("../../../MODUL GORUT TERBARU/app/gorut/whatsapp/page"),
}

export default async function GorutDynamicRoutePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugSegments } = await params
  const slug = slugSegments.join("/")
  const loadModule = routeModules[slug]

  if (!loadModule) {
    notFound()
  }

  const module = await loadModule()
  const Component = module.default
  return <Component />
}
