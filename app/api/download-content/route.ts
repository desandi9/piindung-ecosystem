import { NextResponse } from "next/server"
import { toPublicDownloadContent } from "@/lib/download-content"
import { readDownloadContent } from "@/lib/download-content-server"
export async function GET() { try { return NextResponse.json({ content: toPublicDownloadContent(await readDownloadContent()) }) } catch (error) { console.error("Public download content failed:", error); return NextResponse.json({ error: "Pusat dokumen tidak dapat dimuat." }, { status: 500 }) } }
