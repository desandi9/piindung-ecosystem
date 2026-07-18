import { randomUUID } from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { getRecord } from "@/lib/record-store-server"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { SITE_CONTACT_SCOPE, SITE_CONTACT_KEY, DEFAULT_SITE_CONTACT, validateSiteContact, type SiteContactContent } from "./site-contact"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"

export async function readSiteContact(): Promise<SiteContactContent> {
  const record = await getRecord(SITE_CONTACT_SCOPE, SITE_CONTACT_KEY)
  if (!record) return DEFAULT_SITE_CONTACT
  return validateSiteContact(record.data)
}

export async function requireSiteContactManager() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session) return { response: NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 }) }
  if (session.role !== "super_admin_pc" && session.role !== "admin_pc") {
    return { response: NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 }) }
  }

  const prisma = getPrismaClient()
  const users = await prisma.$queryRaw<Array<{ id: string; name: string; email: string | null; role: string }>>`
    SELECT id, name, email, role
    FROM "User"
    WHERE id = ${session.sub}
    LIMIT 1
  `
  const user = users[0]
  if (user?.role !== "super_admin_pc" && user?.role !== "admin_pc") {
    return { response: NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 }) }
  }
  return { user, session }
}

export async function updateSiteContact(content: SiteContactContent, actor: { id: string; name: string; email: string | null; role: string }) {
  const prisma = getPrismaClient()
  const validated = validateSiteContact({ ...content, updatedAt: new Date().toISOString() })

  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${SITE_CONTACT_SCOPE + ":mutations"}))`
    await transaction.$executeRaw`
      INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
      VALUES (${randomUUID()}, ${SITE_CONTACT_SCOPE}, ${SITE_CONTACT_KEY}, ${JSON.stringify(validated)}::jsonb, NOW())
      ON CONFLICT ("scope", "key") DO UPDATE SET "data" = EXCLUDED."data", "updatedAt" = NOW()
    `

    const timestamp = new Date().toISOString()
    const auditId = randomUUID()
    const audit = {
      id: `log-${auditId}`,
      userName: actor.name,
      type: "Settings",
      action: "site_contact_updated",
      dateTime: timestamp,
      device: "Server Site Contact API",
      status: "Success",
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      socialCount: validated.socialLinks.filter((l) => l.visible).length,
      hoursCount: validated.officeHours.items.length,
      addressChanged: true,
      timestamp,
    }
    await transaction.$executeRaw`
      INSERT INTO "AppRecord" ("id", "scope", "key", "data", "updatedAt")
      VALUES (${randomUUID()}, 'activity-log', ${`site-contact-updated-${auditId}`}, ${JSON.stringify(audit)}::jsonb, NOW())
    `
    return validated
  })
}

export async function readLegacyContactSocialRecords() {
  return getRecord("contact-social", "singleton")
}
