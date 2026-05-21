export type UploadedImagePayload = {
  url: string
  size: number
  originalSize: number
  savedBytes: number
  savedPercent: number
  width: number
  height: number
  mimeType: string
}

function formatUploadBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`
  return `${bytes}B`
}

export function buildImageOptimizationMessage(payload: UploadedImagePayload) {
  if (payload.savedBytes <= 0) {
    return `Upload selesai. Ukuran akhir ${formatUploadBytes(payload.size)}.`
  }

  return `Upload selesai. Hemat ${payload.savedPercent}% (${formatUploadBytes(payload.originalSize)} -> ${formatUploadBytes(payload.size)}).`
}

export async function uploadOptimizedImage(file: File, folder = "general", previousUrl?: string | null) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)
  if (previousUrl) {
    formData.append("previousUrl", previousUrl)
  }

  const response = await fetch("/api/upload/image", {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  const payload = await response.json() as UploadedImagePayload & { error?: string }
  if (!response.ok) {
    throw new Error(payload.error || "Upload gambar gagal diproses.")
  }

  return payload
}
