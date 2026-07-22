export const PRIVATE_NO_STORE_HEADERS = { "Cache-Control": "private, no-store" }
export const DEFAULT_MAX_JSON_BYTES = 1_048_576

export type RequestSecurityFailure = { status: 400 | 403 | 413 | 415; error: string }

export function validateMutationRequest(request: Request, options: { json?: boolean; maxBytes?: number; canonicalOrigin?: string } = {}): RequestSecurityFailure | null {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_JSON_BYTES
  const contentLength = request.headers.get("content-length")
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) return { status: 413, error: "Payload terlalu besar." }
  if (options.json !== false && !/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return { status: 415, error: "Content-Type harus application/json." }

  const origin = request.headers.get("origin")
  if (origin) {
    try {
      const expected = new URL(options.canonicalOrigin ?? request.url).origin
      if (new URL(origin).origin !== expected) return { status: 403, error: "Origin permintaan tidak valid." }
    } catch {
      return { status: 403, error: "Origin permintaan tidak valid." }
    }
  }
  return null
}

export async function readJsonMutation(request: Request, options?: { maxBytes?: number; canonicalOrigin?: string }) {
  const failure = validateMutationRequest(request, { ...options, json: true })
  if (failure) return { failure }
  try {
    return { value: await request.json() as unknown }
  } catch {
    return { failure: { status: 400 as const, error: "JSON tidak valid." } }
  }
}
