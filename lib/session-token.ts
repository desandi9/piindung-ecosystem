import type { AppRole } from "@/types/auth"

export const AUTH_COOKIE_NAME = "piindung-session"
const encoder = new TextEncoder()

export interface SessionTokenPayload {
  sub: string
  name: string
  phone: string
  role: AppRole
  remember: boolean
  iat: number
  exp: number
}

function toBase64Url(input: ArrayBuffer | Uint8Array | string) {
  const bytes = typeof input === "string" ? encoder.encode(input) : input instanceof Uint8Array ? input : new Uint8Array(input)
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function createHmacSignature(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message))
  return toBase64Url(signature)
}

export async function createSessionToken(payload: SessionTokenPayload, secret: string) {
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = await createHmacSignature(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export async function verifySessionToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return null

  const expectedSignature = await createHmacSignature(encodedPayload, secret)
  if (expectedSignature !== signature) return null

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as SessionTokenPayload
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
