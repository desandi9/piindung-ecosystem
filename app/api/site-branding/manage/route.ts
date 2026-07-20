import { NextResponse } from "next/server"
import { requireBrandingManager, readSiteBranding, updateSiteBranding } from "@/lib/site-branding-server"
import { validateSiteBranding } from "@/lib/site-branding"
export async function GET() { const access = await requireBrandingManager(); if (access.response) return access.response; return NextResponse.json({ branding: await readSiteBranding() }) }
export async function PATCH(request: Request) { try { const access = await requireBrandingManager(); if (access.response) return access.response; const body = validateSiteBranding(await request.json().catch(() => null)); return NextResponse.json({ branding: await updateSiteBranding(body, access.user) }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan branding." }, { status: 400 }) } }
