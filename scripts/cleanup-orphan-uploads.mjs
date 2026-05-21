import { readdir, rm, stat } from "fs/promises"
import path from "path"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const uploadsRoot = path.join(process.cwd(), "public", "uploads", "images")
const shouldDelete = process.argv.includes("--delete")

function collectUploadUrls(value, urls = new Set()) {
  if (typeof value === "string") {
    if (value.startsWith("/uploads/images/")) {
      urls.add(value)
    }
    return urls
  }

  if (Array.isArray(value)) {
    for (const item of value) collectUploadUrls(item, urls)
    return urls
  }

  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value)) {
      collectUploadUrls(nestedValue, urls)
    }
  }

  return urls
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath))
    } else {
      files.push(fullPath)
    }
  }

  return files
}

async function main() {
  const referencedUrls = new Set()

  const users = await prisma.$queryRaw`SELECT avatar FROM "User"`
  for (const user of users) {
    collectUploadUrls(user.avatar, referencedUrls)
  }

  const records = await prisma.$queryRaw`SELECT data FROM "AppRecord"`
  for (const record of records) {
    collectUploadUrls(record.data, referencedUrls)
  }

  let filesOnDisk = []
  try {
    await stat(uploadsRoot)
    filesOnDisk = await walkFiles(uploadsRoot)
  } catch {
    console.log(`Folder upload belum ada: ${uploadsRoot}`)
  }
  const orphanFiles = filesOnDisk.filter((filePath) => {
    const relativePath = `/${path.relative(path.join(process.cwd(), "public"), filePath).split(path.sep).join("/")}`
    return !referencedUrls.has(relativePath)
  })

  console.log(`Referenced upload URLs: ${referencedUrls.size}`)
  console.log(`Files on disk: ${filesOnDisk.length}`)
  console.log(`Orphan files found: ${orphanFiles.length}`)

  if (orphanFiles.length > 0) {
    for (const filePath of orphanFiles) {
      console.log(`${shouldDelete ? "DELETE" : "ORPHAN"} ${filePath}`)
      if (shouldDelete) {
        await rm(filePath, { force: true })
      }
    }
  }

  console.log(shouldDelete ? "Cleanup selesai." : "Dry run selesai. Jalankan dengan --delete untuk menghapus file orphan.")
}

main()
  .catch((error) => {
    console.error("Cleanup orphan uploads gagal", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
