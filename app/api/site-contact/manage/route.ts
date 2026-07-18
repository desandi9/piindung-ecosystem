import { NextResponse } from "next/server"
import { SiteContactValidationError, validateSiteContact } from "@/lib/site-contact"
import { readSiteContact, requireSiteContactManager, updateSiteContact } from "@/lib/site-contact-server"

export async function GET() {
  try {
    const access = await requireSiteContactManager()
    if (access.response) return access.response
    return NextResponse.json({ contact: await readSiteContact() })
  } catch {
    return NextResponse.json({ error: "Gagal memuat data kontak." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireSiteContactManager()
    if (access.response) return access.response
    const payload = await request.json().catch(() => null)
    const validated = validateSiteContact(payload)
    const updated = await updateSiteContact(validated, access.user)
    return NextResponse.json({ contact: updated })
  } catch (error) {
    if (error instanceof SiteContactValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: "Gagal menyimpan data kontak." }, { status: 500 })
  }
}
