import { NextResponse, type NextRequest } from "next/server"
import { optimizeAndStoreImage } from "@/lib/server/image-upload"
import { createUploadAuditLog } from "@/lib/server/upload-audit-log"
import { requireBrandingManager } from "@/lib/site-branding-server"
import { type BrandAsset } from "@/lib/site-branding"

export async function POST(request: NextRequest) {
  try {
    const access = await requireBrandingManager()
    if (access.response) return access.response

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File gambar tidak ditemukan." }, { status: 400 })
    }

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      return NextResponse.json({ error: "Format gambar tidak didukung." }, { status: 400 })
    }

    const payload = await optimizeAndStoreImage(file, "site-branding")
    await createUploadAuditLog({
      userName: access.user.name,
      action: `Upload branding asset: ${file.name} (${payload.savedPercent}% lebih kecil)`,
      status: "Success",
      optimizationMetrics: {
        originalSize: payload.originalSize,
        optimizedSize: payload.size,
        savedBytes: payload.savedBytes,
        savedPercent: payload.savedPercent,
        folder: "site-branding",
        fileName: file.name,
      },
    })

    const asset: BrandAsset = {
      path: payload.url,
      width: payload.width ?? 200,
      height: payload.height ?? 50,
      mimeType: payload.mimeType === "image/png" ? "image/png" : "image/jpeg",
      fileSize: payload.size,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ asset })
  } catch (error) {
    console.error("Branding asset upload failed:", error)
    return NextResponse.json(
      { error: "Gagal mengupload aset branding. Silakan coba kembali." },
      { status: 500 }
    )
  }
}
