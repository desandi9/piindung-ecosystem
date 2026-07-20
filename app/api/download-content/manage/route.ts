import { NextResponse } from "next/server"
import { validateDownloadContent } from "@/lib/download-content"
import { readDownloadContent, requireDownloadManager, updateDownloadContent } from "@/lib/download-content-server"
export async function GET() { const access = await requireDownloadManager(); if ("response" in access) return access.response; return NextResponse.json({ content: await readDownloadContent() }) }
export async function PATCH(request: Request) { try { const access = await requireDownloadManager(); if ("response" in access) return access.response; return NextResponse.json({ content: await updateDownloadContent(validateDownloadContent(await request.json().catch(() => null)), access.user) }) } catch (error) { console.error("Download content update failed:", error); return NextResponse.json({ error: "Konten dokumen tidak dapat disimpan." }, { status: 400 }) } }
