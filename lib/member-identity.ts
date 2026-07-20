import { randomBytes } from "crypto"
import type { AppRole } from "@/types/auth"

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
export const memberIdPattern = /^PID-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/

export function normalizeMemberId(value: string) {
  return value.trim().toUpperCase()
}

export function isMemberId(value: string) {
  return memberIdPattern.test(normalizeMemberId(value))
}

export function generateMemberId(random = randomBytes) {
  const bytes = random(12)
  let value = "PID-"
  for (const byte of bytes) value += alphabet[byte % alphabet.length]
  return value
}

export function verificationPath(memberId: string) {
  const normalized = normalizeMemberId(memberId)
  if (!isMemberId(normalized)) throw new Error("INVALID_MEMBER_ID")
  return `/verify/${encodeURIComponent(normalized)}`
}

export function canonicalOrigin(env: Record<string, string | undefined> = process.env) {
  const configured = env.SITE_URL || env.NEXT_PUBLIC_SITE_URL
  if (!configured) {
    if (env.NODE_ENV === "production") throw new Error("SITE_URL_REQUIRED")
    return "http://localhost:3000"
  }
  const url = new URL(configured.includes("://") ? configured : `https://${configured}`)
  if (url.protocol !== "https:" && !(env.NODE_ENV !== "production" && url.hostname === "localhost")) throw new Error("INVALID_SITE_URL")
  return url.origin
}

export function verificationUrl(memberId: string, env?: Record<string, string | undefined>) {
  return `${canonicalOrigin(env)}${verificationPath(memberId)}`
}

export function publicStatus(status: string) {
  if (status === "Aktif") return { label: "Status akun: Aktif", result: "Identitas terdaftar", active: true }
  if (status === "Menunggu") return { label: "Menunggu aktivasi", result: "Identitas terdaftar", active: false }
  return { label: "Akun tidak aktif", result: "Identitas terdaftar", active: false }
}

export function serializePublicMember(user: { memberId: string; name: string; role: AppRole; status: string }, roleLabel: string, organization: string) {
  return { memberId: user.memberId, name: user.name, role: roleLabel, status: publicStatus(user.status), organization }
}

export function preservesMemberId(current: string, nextRole: AppRole, nextStatus: string) {
  void nextRole
  void nextStatus
  return current
}
