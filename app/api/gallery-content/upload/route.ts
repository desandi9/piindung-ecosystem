import { NextResponse, type NextRequest } from "next/server"
import { optimizeAndStoreImage } from "@/lib/server/image-upload"
import { createUploadAuditLog } from "@/lib/server/upload-audit-log"
import { requireGalleryManager } from "@/lib/gallery-content-server"
import type { GalleryAsset } from "@/lib/gallery-content"

export async function POST(request: NextRequest) {
  try {
    const access = await requireGalleryManager()
    if ("response" in access) return access.response
    const file = (await request.formData()).get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "File gambar tidak ditemukan." }, { status: 400 })
    if (file.type !== "image/png" && file.type !== "image/jpeg") return NextResponse.json({ error: "Format gambar tidak didukung." }, { status: 400 })
    const payload = await optimizeAndStoreImage(file, "gallery-content")
    await createUploadAuditLog({ userName: access.user.name, action: "Upload aset galeri", status: "Success", optimizationMetrics: { originalSize: payload.originalSize, optimizedSize: payload.size, savedBytes: payload.savedBytes, savedPercent: payload.savedPercent, folder: "gallery-content", fileName: payload.url } })
    const asset: GalleryAsset = { path: payload.url, width: payload.width ?? 1, height: payload.height ?? 1, mimeType: payload.mimeType === "image/png" ? "image/png" : payload.mimeType === "image/webp" ? "image/webp" : "image/jpeg", fileSize: payload.size, updatedAt: new Date().toISOString() }
    return NextResponse.json({ asset })
  } catch (error) {
    console.error("Gallery asset upload failed:", error)
    return NextResponse.json({ error: "Gagal mengunggah gambar galeri." }, { status: 500 })
  }
}
