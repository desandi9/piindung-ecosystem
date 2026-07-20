import { NextResponse } from "next/server"
import { readGalleryContent } from "@/lib/gallery-content-server"
import { toPublicGalleryContent } from "@/lib/gallery-content"

export async function GET() {
  try {
    return NextResponse.json({ content: toPublicGalleryContent(await readGalleryContent()) })
  } catch (error) {
    console.error("Failed to fetch public gallery content:", error)
    return NextResponse.json({ error: "Gagal mengambil galeri." }, { status: 500 })
  }
}
