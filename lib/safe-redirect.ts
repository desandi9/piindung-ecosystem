export const DEFAULT_SAFE_REDIRECT = "/dashboard"

const sensitiveApiPath = /^\/api\/(?:auth|account|users|portal-access|notifications)(?:\/|$)/i

export function safeRedirectPath(value: string | null | undefined, fallback = DEFAULT_SAFE_REDIRECT) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || sensitiveApiPath.test(value)) return fallback

  try {
    const decoded = decodeURIComponent(value)
    if (decoded.includes("\\") || decoded.split(/[/?#]/).includes("..") || /^\/\//.test(decoded) || sensitiveApiPath.test(decoded)) return fallback
    const url = new URL(value, "https://piindung.invalid")
    return url.origin === "https://piindung.invalid" && url.pathname.startsWith("/") ? `${url.pathname}${url.search}${url.hash}` : fallback
  } catch {
    return fallback
  }
}
