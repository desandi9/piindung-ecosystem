import { NextResponse } from "next/server"
import { readImpactContent, requireImpactManager, updateImpactContent } from "@/lib/impact-content-server"
export async function GET() { const access = await requireImpactManager(); if (access.response) return access.response; return NextResponse.json({ content: await readImpactContent() }) }
export async function PATCH(request: Request) { try { const access = await requireImpactManager(); if (access.response) return access.response; return NextResponse.json({ content: await updateImpactContent(await request.json().catch(() => null), access.user) }) } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan dampak." }, { status: 400 }) } }
