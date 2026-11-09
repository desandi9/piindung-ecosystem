import type { AuthUser } from "../../types/auth"
// @ts-expect-error Native Node tests require the TypeScript extension.
import { runActorRequest } from "../../services/api/actor-session.ts"

export const publicEntryPath = "/login/gorut/publik"
export const entryRoles = {
  MUNFIQ: { label: "Munfiq", description: "Ikuti perjalanan kebaikan Anda.", href: "/gorut-v2/mobile/munfiq" },
  PLPK: { label: "PLPK", description: "Jemput dan catat infak warga.", href: "/gorut-v2/mobile/plpk" },
  RANTING: { label: "Kordes", description: "Dampingi penghimpunan di desa.", href: "/gorut-v2/mobile/kordes" },
  UPZIS: { label: "UPZIS", description: "Kelola penghimpunan kecamatan.", href: "/gorut-v2/mobile/upzis" },
  PC: { label: "PC", description: "Pantau dan verifikasi penghimpunan.", href: "/gorut-v2/mobile/pc" },
} as const
export type EntryRole = keyof typeof entryRoles

export function resolveEntryDestination(roles: EntryRole[], requestedDestination?: string | null) {
  const fallback = roles[0] ? entryRoles[roles[0]].href : null
  if (!fallback) return null
  const allowed = roles.some((role) => requestedDestination === entryRoles[role].href || requestedDestination?.startsWith(`${entryRoles[role].href}/`))
  return allowed && requestedDestination ? requestedDestination : fallback
}

/** Presentation only. Every destination retains its existing server authorization. */
export async function loadEntryRoles(user: Pick<AuthUser, "role">, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<EntryRole[]> {
  return runActorRequest(async (ownedSignal) => {
    async function read(path: string) {
      const response = await fetcher(path, { credentials: "include", cache: "no-store", signal: ownedSignal })
      if (response.status === 401) throw new Error("Sesi berakhir. Silakan masuk kembali.")
      if (response.status === 403) return null
      if (!response.ok) throw new Error("Pilihan akun belum dapat dimuat. Silakan coba lagi.")
      return response.json()
    }
    if (user.role === "munfiq") {
      const identity = await read("/api/gorut/munfiq/me")
      return identity && typeof identity.munfiqCode === "string" && identity.active === true ? ["MUNFIQ"] : []
    }
    const access = await read("/api/portal-access/me")
    if (!access?.modules?.some((module: { key: string }) => module.key === "gorut")) return []
    const dashboard = await read("/api/gorut/dashboard")
    const role = dashboard?.roleSummary?.role
    return role === "PLPK" || role === "RANTING" || role === "UPZIS" || role === "PC" ? [role] : []
  }, signal)
}
