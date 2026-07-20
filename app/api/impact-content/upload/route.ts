import { NextResponse, type NextRequest } from "next/server"
import { optimizeAndStoreImage } from "@/lib/server/image-upload"
import { createUploadAuditLog } from "@/lib/server/upload-audit-log"
import { requireImpactManager } from "@/lib/impact-content-server"
import { type ImpactAsset } from "@/lib/impact-content"

export async function POST(request: NextRequest) {
  try {
    const access = await requireImpactManager()
    if (access.response) return access.response

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File gambar tidak ditemukan." }, { status: 400 })
    }

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      return NextResponse.json({ error: "Format gambar tidak didukung." }, { status: 400 })
    }

    const payload = await optimizeAndStoreImage(file, "impact-content")
    await createUploadAuditLog({
      userName: access.user.name,
      action: `Upload impact asset: ${file.name} (${payload.savedPercent}% lebih kecil)`,
      status: "Success",
      optimizationMetrics: {
        originalSize: payload.originalSize,
        optimizedSize: payload.size,
        savedBytes: payload.savedBytes,
        savedPercent: payload.savedPercent,
        folder: "impact-content",
        fileName: file.name,
      },
    })

    const asset: ImpactAsset = {
      path: payload.url,
      width: payload.width ?? 200,
      height: payload.height ?? 50,
      mimeType: payload.mimeType === "image/png" ? "image/png" : "image/jpeg",
      fileSize: payload.size,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ asset })
  } catch (error) {
    console.error("Impact asset upload failed:", error)
    return NextResponse.json({ error: "Gagal mengupload aset dampak." }, { status: 500 })
  }
}
