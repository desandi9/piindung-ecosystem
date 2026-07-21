import { normalizeEmail } from "@/lib/portal-user-management"
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone"

const allowedFields = new Set(["name", "email", "phone", "avatar"])
const forbiddenFields = new Set(["id", "userId", "memberId", "role", "status", "permissions", "modules", "grants", "password", "passwordHash", "createdAt", "updatedAt", "operationalScope"])
const executableExtensions = /\.(?:php\d*|phtml|phar|cgi|pl|py|rb|sh|bash|exe|dll|dylib|bin|js|mjs|html?|svg)$/i

export type AccountProfile = {
  memberId: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  avatar: string | null
  createdAt: string
  updatedAt: string
  verificationUrl: string
  identityPath: string
}

export type ProfilePatch = { name?: string; email?: string; phone?: string; avatar?: string | null }

export function serializeAccountProfile(user: { memberId: string; name: string; email: string | null; phone: string; role: string; status: string; avatar: string | null; createdAt: Date; updatedAt: Date }, verification: string): AccountProfile {
  return { memberId: user.memberId, name: user.name, email: user.email ?? "", phone: user.phone, role: user.role, status: user.status, avatar: user.avatar, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString(), verificationUrl: verification, identityPath: "/member-area/identitas" }
}

export function validateAvatarReference(value: unknown): { value?: string | null; error?: string } {
  if (value === null || value === "") return { value: null }
  if (typeof value !== "string" || value.includes("\\") || value.includes("..") || /%(?:2f|2e|5c)/i.test(value) || /^(?:https?:|\/\/|data:|javascript:|file:)/i.test(value) || executableExtensions.test(value)) return { error: "Avatar tidak valid." }
  if (!/^\/uploads\/[A-Za-z0-9/_-]+\.[A-Za-z0-9]+$/.test(value)) return { error: "Avatar tidak valid." }
  const normalized = `/${value.split("/").filter(Boolean).join("/")}`
  if (!normalized.startsWith("/uploads/") || normalized !== value) return { error: "Avatar tidak valid." }
  return { value: normalized }
}

export function validateProfilePatch(body: unknown): { value?: ProfilePatch; error?: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Data profil tidak valid." }
  const input = body as Record<string, unknown>
  if (Object.keys(input).some((key) => forbiddenFields.has(key) || !allowedFields.has(key))) return { error: "Field profil tidak didukung." }
  const value: ProfilePatch = {}
  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 120 || /[\u0000-\u001f\u007f]/.test(input.name)) return { error: "Nama tidak valid." }
    value.name = input.name.trim()
  }
  if (input.email !== undefined) {
    if (typeof input.email !== "string") return { error: "Email tidak valid." }
    const email = normalizeEmail(input.email)
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return { error: "Email tidak valid." }
    value.email = email
  }
  if (input.phone !== undefined) {
    if (typeof input.phone !== "string") return { error: "Nomor HP tidak valid." }
    const phone = normalizePhoneNumber(input.phone)
    if (!isValidPhoneNumber(phone)) return { error: "Nomor HP tidak valid." }
    value.phone = phone
  }
  if (input.avatar !== undefined) {
    const avatar = validateAvatarReference(input.avatar)
    if (avatar.error) return { error: avatar.error }
    value.avatar = avatar.value
  }
  return { value }
}

export function validatePasswordInput(currentPassword: unknown, newPassword: unknown, confirmPassword: unknown) {
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || typeof confirmPassword !== "string" || !currentPassword || !newPassword || !confirmPassword || newPassword.length < 8 || newPassword !== confirmPassword || currentPassword === newPassword) return { valid: false as const, error: "INVALID_PASSWORD" }
  return { valid: true as const }
}

export function passwordAuditPayload(actorId: string, timestamp: string) {
  return { actorId, targetUserId: actorId, action: "self_password_changed", timestamp }
}
