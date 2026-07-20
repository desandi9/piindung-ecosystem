import { NextResponse } from "next/server"
import { readImpactContent } from "@/lib/impact-content-server"
import { toPublicImpactContent } from "@/lib/impact-content"
export async function GET() { try { return NextResponse.json({ content: toPublicImpactContent(await readImpactContent()) }) } catch { return NextResponse.json({ error: "Gagal memuat konten dampak." }, { status: 500 }) } }
