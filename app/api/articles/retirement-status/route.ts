import { NextResponse } from "next/server"
import { requireArticleManager } from "@/lib/article-content-api"
import { getArticleRetirementStatus } from "@/lib/article-retirement"

export async function GET() {
  try {
    const access = await requireArticleManager()
    if (access.response) return access.response
    return NextResponse.json(await getArticleRetirementStatus())
  } catch {
    return NextResponse.json({ error: "Gagal mengambil status retirement CMS artikel lama." }, { status: 500 })
  }
}
