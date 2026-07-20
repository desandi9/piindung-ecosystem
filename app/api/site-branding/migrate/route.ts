import { NextResponse } from "next/server"
import { migrateLegacyMedia, previewLegacyMedia, requireBrandingManager } from "@/lib/site-branding-server"

export async function POST() {
  try {
    const access = await requireBrandingManager()
    if (access.response) return access.response
    const result = await migrateLegacyMedia(access.user)
    return NextResponse.json({ ...result, skippedCount: result.preview.skipped + result.preview.invalid.length })
  } catch {
    return NextResponse.json({ error: "Gagal memigrasikan branding." }, { status: 500 })
  }
}

export async function GET() {
  const access = await requireBrandingManager()
  if (access.response) return access.response
  return NextResponse.json(await previewLegacyMedia())
}
