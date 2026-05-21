import { NextResponse, type NextRequest } from "next/server"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { deleteUploadedImageByUrl, optimizeAndStoreImage } from "@/lib/server/image-upload"
import { createUploadAuditLog } from "@/lib/server/upload-audit-log"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Anda harus login untuk upload gambar." }, { status: 401 })
    }

    const session = await verifySessionToken(token, AUTH_SECRET)
    if (!session) {
      return NextResponse.json({ error: "Sesi login tidak valid. Silakan login ulang." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const folder = String(formData.get("folder") ?? "general")
    const previousUrl = String(formData.get("previousUrl") ?? "")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File gambar tidak ditemukan pada request upload." }, { status: 400 })
    }

    // The optimizer keeps image format and dimensions intact, then rewrites the
    // file using more efficient encoder settings before saving to disk.
    const uploadedImage = await optimizeAndStoreImage(file, folder)
    await deleteUploadedImageByUrl(previousUrl)

    await createUploadAuditLog({
      userName: session.name,
      action: `Optimasi upload gambar ${file.name} di folder ${folder} (${uploadedImage.savedPercent}% lebih kecil)`,
      status: "Success",
      optimizationMetrics: {
        originalSize: uploadedImage.originalSize,
        optimizedSize: uploadedImage.size,
        savedBytes: uploadedImage.savedBytes,
        savedPercent: uploadedImage.savedPercent,
        folder,
        fileName: file.name,
      },
    })

    return NextResponse.json(uploadedImage)
  } catch (error) {
    console.error("Image upload error", error)

    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
      const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
      if (session) {
        await createUploadAuditLog({
          userName: session.name,
          action: error instanceof Error ? `Gagal optimasi upload gambar: ${error.message}` : "Gagal optimasi upload gambar.",
          status: "Failed",
        })
      }
    } catch {
      // Audit logging is best-effort and should not mask the original upload error.
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Gagal mengoptimalkan dan menyimpan gambar." }, { status: 500 })
  }
}
