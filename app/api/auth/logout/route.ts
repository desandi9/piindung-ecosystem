import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, getClearAuthCookieOptions } from "@/lib/session-token"
import { validateMutationRequest } from "@/lib/request-security"

export async function POST(request: Request) {
  const failure = validateMutationRequest(request, { json: false })
  if (failure) return NextResponse.json({ error: failure.error }, { status: failure.status })
  const response = NextResponse.json({ ok: true })

  response.cookies.set({ name: AUTH_COOKIE_NAME, value: "", ...getClearAuthCookieOptions(process.env.NODE_ENV === "production") })
  return response
}
