import { NextResponse } from "next/server"
import { readImpactContent, requireImpactManager, updateImpactContent } from "@/lib/impact-content-server"
import { validateImpactContent } from "@/lib/impact-content"
export async function GET() { const access = await requireImpactManager(); if (access.response) return access.response; return NextResponse.json({ content: await readImpactContent() }) }
export async function PATCH(request: Request) { try { const access = await requireImpactManager(); if (access.response) return access.response; const body = validateImpactContent(await request.json().catch(() => null)); return NextResponse.json({ content: await updateImpactContent(body, access.user) }) } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan dampak." }, { status: 400 }) } }
