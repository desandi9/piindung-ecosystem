import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { canAccessAdminDashboard } from "@/features/auth"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"

export async function requireHomepageContentManager() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!canAccessAdminDashboard(session.role)) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}
