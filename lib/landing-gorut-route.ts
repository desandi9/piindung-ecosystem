/**
 * Tujuan tombol GORUT di landing publik. Selalu rute V2 — daftar role disamakan
 * dengan gerbang /gorut-v2 di proxy.ts agar tombol tidak mengarah ke halaman yang
 * akan ditolak. Pengunjung tanpa sesi masuk lewat login PIINDUNG lebih dulu.
 */
export const GORUT_V2_DASHBOARD = "/gorut-v2/dashboard"
export const GORUT_V2_MOBILE_ENTRY = "/gorut-v2/mobile"

/** applicationId aplikasi Android GORUT (gorut-mobile/android/app/build.gradle). */
export const GORUT_ANDROID_PACKAGE = "id.or.nucare.gorut"
/**
 * Isi hanya setelah listing resmi Google Play untuk GORUT_ANDROID_PACKAGE terbit dan
 * URL-nya diverifikasi. Selama null, landing menampilkan "Segera di Google Play" nonaktif.
 * Per 2026-11-12 listing tersebut masih 404.
 */
export const GORUT_PLAY_STORE_URL: string | null = null

const operationalRoles = new Set(["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes"])
const mobileRoutes: Record<string, string> = {
  munfiq: "/gorut-v2/mobile/munfiq",
  plpk: "/gorut-v2/mobile/plpk",
}

export function resolveLandingGorutRoute(role: string | null | undefined) {
  if (!role) return `/login?next=${encodeURIComponent(GORUT_V2_DASHBOARD)}`
  if (operationalRoles.has(role)) return GORUT_V2_DASHBOARD
  return mobileRoutes[role] ?? "/dashboard"
}
