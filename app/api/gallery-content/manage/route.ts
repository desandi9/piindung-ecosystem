import { NextResponse } from "next/server"
import { validateGalleryContent } from "@/lib/gallery-content"
import { readGalleryContent, requireGalleryManager, updateGalleryContent } from "@/lib/gallery-content-server"

export async function GET() { const access = await requireGalleryManager(); if ("response" in access) return access.response; return NextResponse.json({ content: await readGalleryContent() }) }
export async function PATCH(request: Request) { try { const access = await requireGalleryManager(); if ("response" in access) return access.response; const content = validateGalleryContent(await request.json().catch(() => null)); return NextResponse.json({ content: await updateGalleryContent(content, access.user) }) } catch (error) { console.error("Gallery content update failed:", error); return NextResponse.json({ error: "Konten galeri tidak dapat disimpan." }, { status: 400 }) } }
