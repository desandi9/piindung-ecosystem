import { randomUUID } from "crypto"
import { mkdir, rm, writeFile } from "fs/promises"
import path from "path"
import sharp from "sharp"

export const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"])
export const MAX_IMAGE_UPLOAD_SIZE = 10 * 1024 * 1024

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "general"
}

function resolveOutputExtension(fileName: string, mimeType: string) {
  const originalExtension = path.extname(fileName).toLowerCase()
  if (mimeType === "image/png") return ".png"
  if (originalExtension === ".jpg") return ".jpg"
  return ".jpeg"
}

export function validateImageUpload(file: File) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("File harus berupa JPG, JPEG, atau PNG.")
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    throw new Error("Ukuran gambar maksimal 10MB.")
  }
}

export async function optimizeAndStoreImage(file: File, folder = "general") {
  validateImageUpload(file)

  const buffer = Buffer.from(await file.arrayBuffer())
  const image = sharp(buffer, { failOn: "error" })
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error("Gagal membaca dimensi gambar.")
  }

  // Preserve original format and original dimensions. We only optimize encoding
  // settings here so payload size drops without resizing the image.
  const optimizedBuffer = file.type === "image/png"
    ? await image.png({ compressionLevel: 9, palette: true }).toBuffer()
    : await image.jpeg({ quality: 82, mozjpeg: true }).toBuffer()

  const safeFolder = sanitizePathSegment(folder)
  const extension = resolveOutputExtension(file.name, file.type)
  const fileName = `${Date.now()}-${randomUUID()}${extension}`
  const relativeDirectory = path.join("uploads", "images", safeFolder)
  const outputDirectory = path.join(process.cwd(), "public", relativeDirectory)
  const outputPath = path.join(outputDirectory, fileName)

  await mkdir(outputDirectory, { recursive: true })
  await writeFile(outputPath, optimizedBuffer)

  return {
    url: `/${relativeDirectory.split(path.sep).join("/")}/${fileName}`,
    size: optimizedBuffer.length,
    originalSize: file.size,
    savedBytes: Math.max(0, file.size - optimizedBuffer.length),
    savedPercent: file.size > 0 ? Math.max(0, Math.round(((file.size - optimizedBuffer.length) / file.size) * 100)) : 0,
    width: metadata.width,
    height: metadata.height,
    mimeType: file.type === "image/png" ? "image/png" : "image/jpeg",
  }
}

export async function deleteUploadedImageByUrl(url?: string | null) {
  if (!url || !url.startsWith("/uploads/images/")) return

  const relativePath = url.replace(/^\//, "")
  const absolutePath = path.join(process.cwd(), "public", relativePath)

  try {
    await rm(absolutePath, { force: true })
  } catch {
    // Cleanup should never block the main upload/update flow.
  }
}
