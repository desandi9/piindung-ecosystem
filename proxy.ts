import { NextResponse, type NextRequest } from "next/server"
import { canAccessAdminDashboard, isSuperAdminOnlyRoute } from "@/features/auth"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"

const protectedUiPrefixes = ["/dashboard", "/admin", "/profil", "/pengaturan-profil", "/gorut"]
const adminApiPrefixes = ["/api/users", "/api/records"]
const publicReadableRecordScopes = new Set([
  "maintenance-mode",
  "system-settings",
  "contact-social",
  "homepage-content",
  "notifications",
  "gallery-content",
  "download-center",
  "popup-announcements",
  "integrated-apps",
  "faq-manager",
])
const publicAssetPattern = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$/i

function extractRecordScope(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments[0] !== "api" || segments[1] !== "records") return null
  return segments[2] ?? null
}

function isProtectedUiPath(pathname: string) {
  return protectedUiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function canAccessGorut(role?: string | null) {
  return role === "super_admin_pc" || role === "admin_pc"
}

function canAccessGorutPath(role: string | null | undefined, pathname: string) {
  const normalizedPath = pathname === "/gorut" ? "/gorut/dashboard" : pathname

  if (role === "super_admin_pc") {
    return true
  }

  if (role === "admin_pc") {
    const allowedPrefixes = [
      "/gorut",
      "/gorut/dashboard",
      "/gorut/munfiq",
      "/gorut/transaksi",
      "/gorut/approval",
      "/gorut/validasi",
      "/gorut/setoran",
      "/gorut/analytics",
      "/gorut/performance",
      "/gorut/keuangan",
      "/gorut/kecamatan",
      "/gorut/upzis",
      "/gorut/ranting",
      "/gorut/monitoring-plpk",
      "/gorut/laporan",
      "/gorut/statistik",
      "/gorut/archive",
      "/gorut/announcement",
      "/gorut/whatsapp",
      "/gorut/notifikasi",
      "/gorut/profil",
      "/gorut/pengaturan-akun",
      "/gorut/help",
    ]

    return allowedPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  }

  if (role === "admin_upzis") {
    const allowedPrefixes = [
      "/gorut",
      "/gorut/dashboard",
      "/gorut/munfiq",
      "/gorut/transaksi",
      "/gorut/approval",
      "/gorut/validasi",
      "/gorut/upzis",
      "/gorut/laporan",
      "/gorut/notifikasi",
      "/gorut/whatsapp",
      "/gorut/profil",
      "/gorut/pengaturan-akun",
      "/gorut/help",
    ]

    return allowedPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  }

  if (role === "admin_kordes") {
    const allowedPrefixes = [
      "/gorut",
      "/gorut/dashboard",
      "/gorut/munfiq",
      "/gorut/transaksi",
      "/gorut/approval",
      "/gorut/validasi",
      "/gorut/monitoring-plpk",
      "/gorut/laporan",
      "/gorut/notifikasi",
      "/gorut/profil",
      "/gorut/pengaturan-akun",
      "/gorut/help",
    ]

    return allowedPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  }

  return false
}

function isPublicPath(pathname: string) {
  return ["/", "/login", "/program", "/informasi", "/laporan", "/rekening-donasi", "/qris-donasi", "/bantuan", "/kontak", "/galeri", "/download", "/notifications", "/notifikasi", "/verify"].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isAuthApiPath(pathname: string) {
  return pathname.startsWith("/api/auth/")
}

function defaultRouteForRole(role: string) {
  return canAccessAdminDashboard(role as never) ? "/admin" : "/dashboard"
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/icon-light-32x32.png" || pathname === "/icon-dark-32x32.png" || pathname === "/apple-icon.png") {
    return NextResponse.redirect(new URL("/piindung-logo-blue.png", request.url))
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname === "/robots.txt" || publicAssetPattern.test(pathname)) {
    return NextResponse.next()
  }

  if (pathname === "/login") {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) return NextResponse.next()

    const session = await verifySessionToken(token, AUTH_SECRET)
    if (!session) return NextResponse.next()

    return NextResponse.redirect(new URL(defaultRouteForRole(session.role), request.url))
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null

  if (pathname.startsWith("/api/")) {
    if (isAuthApiPath(pathname)) return NextResponse.next()

    const recordScope = extractRecordScope(pathname)
    if (request.method === "GET" && recordScope && publicReadableRecordScopes.has(recordScope)) {
      return NextResponse.next()
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (adminApiPrefixes.some((prefix) => pathname.startsWith(prefix)) && !canAccessAdminDashboard(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (pathname.startsWith("/api/records") || pathname.startsWith("/api/users")) {
      if (!canAccessAdminDashboard(session.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.next()
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith("/gorut")) {
    if (!canAccessGorutPath(session.role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!canAccessAdminDashboard(session.role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    if ((session.role === "admin_upzis" || session.role === "admin_kordes") && pathname !== "/admin" && !pathname.startsWith("/admin/notifikasi")) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    if (isSuperAdminOnlyRoute(pathname) && session.role !== "super_admin_pc") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
