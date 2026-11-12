import type { AppRole } from "@/types/auth"

/**
 * Isi dashboard PIINDUNG V2 per pengguna. Murni presentasi: setiap tujuan tetap
 * memakai otorisasinya sendiri (proxy.ts, requireGorutContext, guard halaman mobile).
 * Daftar tujuan hanya memuat halaman GORUT V2 yang terhubung ke API sungguhan.
 */
export type OperationalRole = "PC" | "UPZIS" | "RANTING" | "PLPK"

export type DashboardIcon =
  | "deposit" | "validate" | "approve" | "package" | "verify" | "pickup"
  | "home" | "program" | "bell" | "website" | "admin" | "identity" | "settings" | "help"

export interface DashboardAccess {
  role: AppRole
  permissions: readonly string[]
  modules: readonly { key: string }[]
  /** Peran dari penugasan GORUT aktif; null bila tidak ada penugasan yang valid. */
  operationalRole: OperationalRole | null
  /** Hanya untuk Munfiq: identitas Munfiq aktif dan terhubung. */
  munfiqLinked: boolean | null
  /** canAccessAdminDashboard(role) dihitung pemanggil agar modul ini tetap murni. */
  adminDashboard: boolean
}

export interface DashboardLink {
  id: string
  title: string
  description: string
  href: string
  icon: DashboardIcon
}

export type GorutAppAccess = { kind: "open"; href: string } | { kind: "locked"; reason: string }

// Sama dengan aturan Akses Cepat portal-hub lama.
const CONTENT_PERMISSIONS = ["articles.manage", "homepage.manage", "products.manage", "impact.manage", "gallery.manage", "downloads.manage", "help_content.manage", "contact.manage", "branding.manage"]
const ADMIN_PERMISSIONS = ["users.manage", "access.manage", "settings.manage", "audit.view", "notifications.manage"]

const gorutTasks: Record<OperationalRole, DashboardLink[]> = {
  PC: [
    { id: "pc-setoran", title: "Setoran", description: "Catat serah-terima paket dari kecamatan.", href: "/gorut-v2/setoran", icon: "deposit" },
    { id: "pc-validasi", title: "Validasi setoran", description: "Periksa bukti setoran dan rekam hasil validasi.", href: "/gorut-v2/validasi", icon: "validate" },
    { id: "pc-approval", title: "Approval akhir", description: "Tinjau paket sebelum keputusan akhir PC.", href: "/gorut-v2/approval", icon: "approve" },
  ],
  UPZIS: [
    { id: "upzis-verifikasi", title: "Verifikasi paket UPZIS", description: "Maker dan Checker menjalankan tahapnya masing-masing, lalu meneruskan ke PC.", href: "/gorut-v2/penghimpunan/verifikasi-upzis", icon: "package" },
  ],
  RANTING: [
    { id: "kordes-verifikasi", title: "Verifikasi Kordes", description: "Periksa hasil penjemputan PLPK di ranting Anda.", href: "/gorut-v2/mobile/kordes", icon: "verify" },
  ],
  PLPK: [
    { id: "plpk-penjemputan", title: "Penjemputan koin", description: "Buka ruang kerja penjemputan PLPK.", href: "/gorut-v2/mobile/plpk", icon: "pickup" },
  ],
}

const munfiqTasks: DashboardLink[] = [
  { id: "munfiq-beranda", title: "Ruang Munfiq", description: "Ringkasan kotak infak dan kebaikan Anda.", href: "/gorut-v2/mobile/munfiq", icon: "home" },
  { id: "munfiq-penjemputan", title: "Penjemputan", description: "Lihat status penjemputan kotak infak Anda.", href: "/gorut-v2/mobile/munfiq/penjemputan", icon: "pickup" },
  { id: "munfiq-program", title: "Program", description: "Program yang didukung infak Anda.", href: "/gorut-v2/mobile/munfiq/program", icon: "program" },
  { id: "munfiq-notifikasi", title: "Notifikasi GORUT", description: "Kabar terbaru tentang kotak infak Anda.", href: "/gorut-v2/mobile/munfiq/notifikasi", icon: "bell" },
]

const operationalEntryRoles: readonly OperationalRole[] = ["PC", "UPZIS", "RANTING"]

export function hasGorutModule(access: Pick<DashboardAccess, "modules">) {
  return access.modules.some((module) => module.key === "gorut")
}

function resolveGorutTasks(access: DashboardAccess): DashboardLink[] {
  if (access.role === "munfiq") return access.munfiqLinked ? munfiqTasks : []
  if (access.role === "plpk") return access.operationalRole === "PLPK" ? gorutTasks.PLPK : []
  if (!hasGorutModule(access) || !access.operationalRole || !operationalEntryRoles.includes(access.operationalRole)) return []
  return gorutTasks[access.operationalRole]
}

function resolvePortalTasks(access: DashboardAccess): DashboardLink[] {
  const tasks: DashboardLink[] = []
  if (CONTENT_PERMISSIONS.some((permission) => access.permissions.includes(permission))) {
    tasks.push({ id: "portal-website", title: "Kelola website", description: "Perbarui artikel dan konten halaman publik.", href: "/dashboard/landing-page", icon: "website" })
  }
  if (access.adminDashboard || ADMIN_PERMISSIONS.some((permission) => access.permissions.includes(permission))) {
    tasks.push({ id: "portal-admin", title: "Administrasi sistem", description: "Kelola pengguna, hak akses, dan pengaturan.", href: "/admin", icon: "admin" })
  }
  return tasks
}

export function resolveDashboardTasks(access: DashboardAccess): DashboardLink[] {
  return [...resolveGorutTasks(access), ...resolvePortalTasks(access)]
}

export function resolveGorutApp(access: DashboardAccess): GorutAppAccess {
  if (access.role === "munfiq") {
    return access.munfiqLinked ? { kind: "open", href: "/gorut-v2/mobile/munfiq" } : { kind: "locked", reason: "Akun Munfiq Anda belum terhubung dengan kotak infak." }
  }
  if (access.role === "plpk") {
    return access.operationalRole === "PLPK" ? { kind: "open", href: "/gorut-v2/mobile/plpk" } : { kind: "locked", reason: "Penugasan PLPK Anda belum aktif." }
  }
  if (!hasGorutModule(access)) return { kind: "locked", reason: "GORUT belum diaktifkan untuk akun Anda." }
  if (!access.operationalRole || !operationalEntryRoles.includes(access.operationalRole)) return { kind: "locked", reason: "Penugasan GORUT Anda belum aktif." }
  return { kind: "open", href: "/gorut-v2/dashboard" }
}

export function resolveAccountLinks(access: DashboardAccess): DashboardLink[] {
  const links: DashboardLink[] = []
  if (access.permissions.includes("member_area.view")) links.push({ id: "identitas", title: "Identitas digital", description: "Kartu identitas anggota Anda.", href: "/profil/identitas", icon: "identity" })
  if (access.permissions.includes("profile.view")) links.push({ id: "profil", title: "Pengaturan profil", description: "Data diri, foto, dan kata sandi.", href: "/pengaturan-profil", icon: "settings" })
  if (access.permissions.includes("notifications.view")) links.push({ id: "notifikasi", title: "Notifikasi", description: "Pemberitahuan untuk akun Anda.", href: "/notifikasi", icon: "bell" })
  links.push({ id: "bantuan", title: "Pusat bantuan", description: "Panduan penggunaan PIINDUNG.", href: access.permissions.includes("help.view") ? "/dashboard/bantuan" : "/bantuan", icon: "help" })
  return links
}

export const operationalRoleLabels: Record<OperationalRole, string> = {
  PC: "PC",
  UPZIS: "UPZIS",
  RANTING: "Kordes",
  PLPK: "PLPK",
}
