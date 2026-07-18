import { NextResponse } from "next/server"
import { toPublicSiteContact } from "@/lib/site-contact"
import { readSiteContact } from "@/lib/site-contact-server"

export async function GET() {
  try {
    const content = await readSiteContact()
    return NextResponse.json({ contact: toPublicSiteContact(content) })
  } catch {
    return NextResponse.json({ error: "Gagal memuat informasi kontak." }, { status: 500 })
  }
}
