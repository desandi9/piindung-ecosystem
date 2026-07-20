import { NextResponse } from "next/server"
import { toPublicSiteBranding } from "@/lib/site-branding"
import { readSiteBranding } from "@/lib/site-branding-server"
export async function GET() { try { return NextResponse.json({ branding: toPublicSiteBranding(await readSiteBranding()) }) } catch { return NextResponse.json({ error: "Gagal memuat branding." }, { status: 500 }) } }
