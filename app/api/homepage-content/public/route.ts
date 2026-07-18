import { NextResponse } from "next/server"
import { listRecords } from "@/lib/record-store-server"

type PublicHero = {
  title: string
  subtitle: string
  description: string
  image: string
  link: string
  buttonText: string
}

type HomepageRecord = {
  key: string
  data: Record<string, unknown>
  updatedAt: Date
}

function safeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return ""
  const text = value.trim()
  return text.length <= maxLength && !/[\u0000-\u0008\u000b-\u001f\u007f]/.test(text) ? text : ""
}

function safeImage(value: unknown) {
  const image = safeText(value, 2_000)
  if (!image) return ""
  if (image.startsWith("/") && !image.startsWith("//")) return image
  try {
    const url = new URL(image)
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? image : ""
  } catch {
    return ""
  }
}

function safeLink(value: unknown) {
  const link = safeText(value, 2_000)
  if (!link) return ""
  if (link.startsWith("/") && !link.startsWith("//")) return link
  try {
    const url = new URL(link)
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? link : ""
  } catch {
    return ""
  }
}

function toPublicHero(record: HomepageRecord): PublicHero | null {
  const { data } = record
  if (data.type !== "Banner" || data.status !== "Published") return null
  const title = safeText(data.title, 160)
  const subtitle = safeText(data.subtitle, 320)
  const description = safeText(data.description, 2_000)
  const buttonText = safeText(data.buttonText, 120)
  if (!title || !subtitle || !description || !buttonText) return null
  return { title, subtitle, description, image: safeImage(data.image), link: safeLink(data.link), buttonText }
}

export async function GET() {
  try {
    const records = await listRecords("homepage-content") as HomepageRecord[]
    const hero = records
      .filter((record) => record.data.type === "Banner" && record.data.status === "Published")
      .sort((first, second) => {
        const firstOrder = typeof first.data.order === "number" && Number.isFinite(first.data.order) ? first.data.order : Number.MAX_SAFE_INTEGER
        const secondOrder = typeof second.data.order === "number" && Number.isFinite(second.data.order) ? second.data.order : Number.MAX_SAFE_INTEGER
        if (firstOrder !== secondOrder) return firstOrder - secondOrder
        const updated = first.updatedAt.getTime() - second.updatedAt.getTime()
        return updated || first.key.localeCompare(second.key)
      })
      .map(toPublicHero)
      .find((item): item is PublicHero => item !== null) ?? null

    return NextResponse.json({ hero })
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data beranda publik." }, { status: 500 })
  }
}
