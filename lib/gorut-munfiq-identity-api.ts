// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { isMemberId, normalizeMemberId } from "./member-identity.ts"

export type GorutMunfiqLinkInput = { userMemberId: string; munfiqCode: string; reason: string | null }

function hasExactKeys(record: Record<string, unknown>, allowed: readonly string[]) {
  const keys = new Set(allowed)
  return Object.keys(record).every((key) => keys.has(key))
}

function normalizeReason(value: unknown) {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return undefined
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized.length > 0 && normalized.length <= 500 ? normalized : undefined
}

function isPublicGorutCode(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
}

export function parseGorutMunfiqLinkInput(value: unknown): GorutMunfiqLinkInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  if (!hasExactKeys(body, ["userMemberId", "munfiqCode", "reason"])) return null
  if (typeof body.userMemberId !== "string" || !isMemberId(body.userMemberId)) return null
  if (!isPublicGorutCode(body.munfiqCode)) return null
  const reason = normalizeReason(body.reason)
  if (reason === undefined) return null
  return { userMemberId: normalizeMemberId(body.userMemberId), munfiqCode: body.munfiqCode, reason }
}
